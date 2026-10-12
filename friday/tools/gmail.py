"""
Gmail tools — read-only inbox triage for the AEGIS secretary layer.

Backed by the Gmail API using the shared read-only OAuth token from
friday.google_auth (scope: https://www.googleapis.com/auth/gmail.readonly).

High-priority hook: when an email is flagged as high priority, the formatted
output tells the voice agent to escalate it, e.g. by calling the Telegram tool
`send_mobile_alert(title=..., message=..., priority="high")`. The agent decides
whether to push it — this module never sends notifications on its own.
"""

import base64
import datetime as dt
import logging
import re
from email.utils import parseaddr

from googleapiclient.errors import HttpError

from friday.google_auth import GoogleSetupError, get_service

logger = logging.getLogger("aegis-gmail")

# Words that mark an email as needing immediate attention.
HIGH_PRIORITY_KEYWORDS = (
    "urgent",
    "asap",
    "immediately",
    "deadline",
    "action required",
    "invoice",
    "payment due",
    "overdue",
    "expires",
    "critical",
    "exam",
    "interview",
    "verification code",
    "otp",
)

MAX_BODY_CHARS = 1600


# ---------------------------------------------------------------------------
# Service + error helpers
# ---------------------------------------------------------------------------


def _gmail_service():
    return get_service("gmail", "v1")


def _friendly_error(action: str, exc: Exception) -> str:
    """Translate an exception into a spoken-friendly string."""
    if isinstance(exc, GoogleSetupError):
        return str(exc)
    if isinstance(exc, HttpError):
        status = getattr(exc.resp, "status", None)
        content = (exc.content or b"").decode("utf-8", "replace")
        if (
            "accessNotConfigured" in content
            or "SERVICE_DISABLED" in content
            or "has not been used" in content
        ):
            return (
                "The Gmail API isn't enabled in the Google Cloud project yet. "
                "Enable 'Gmail API' under APIs & Services → Library, wait a minute, "
                "then ask again."
            )
        if status == 429:
            return (
                "Gmail is rate-limiting me right now. Give it a moment and ask again."
            )
        if status in (401, 403):
            return (
                "Gmail refused my access — the saved token is missing Gmail "
                "permission. Delete credentials/token.json and authorize again; "
                "AEGIS will then request Calendar and Gmail access together."
            )
        logger.error("Gmail API error during %s: %s", action, exc)
        return f"Gmail returned an API error while trying to {action}: {exc}"
    if isinstance(exc, (TimeoutError, OSError)):
        logger.error("Network error during %s: %s", action, exc)
        return f"I couldn't reach Gmail to {action}. The network may be down."
    logger.exception("Unexpected error during %s", action)
    return f"I hit an unexpected error while trying to {action}: {exc}"


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------


def _headers_map(payload: dict) -> dict:
    headers = {}
    for header in payload.get("headers", []):
        name = (header.get("name") or "").lower()
        if name:
            headers[name] = header.get("value", "")
    return headers


def _split_sender(raw_from: str) -> tuple[str, str]:
    name, address = parseaddr(raw_from or "")
    return (name.strip(), address.strip())


def _format_date(raw_date: str) -> str:
    if not raw_date:
        return "unknown date"
    try:
        parsed = dt.datetime.strptime(raw_date, "%a, %d %b %Y %H:%M:%S %z")
        return parsed.strftime("%a, %b %d at %I:%M %p").replace(" 0", " ")
    except (ValueError, TypeError):
        return raw_date.strip()


def _is_high_priority(subject: str, snippet: str) -> bool:
    haystack = f"{subject} {snippet}".lower()
    return any(keyword in haystack for keyword in HIGH_PRIORITY_KEYWORDS)


def _decode_part(data: str | None) -> str:
    if not data:
        return ""
    try:
        return base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")
    except (ValueError, TypeError):
        return ""


def _strip_html(markup: str) -> str:
    text = re.sub(r"(?is)<(script|style).*?>.*?</\1>", " ", markup)
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?i)</(p|div|tr|li|h[1-6])>", "\n", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = _html_unescape(text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
    return text.strip()


def _html_unescape(value: str) -> str:
    import html as _html

    return _html.unescape(value)


# Zero-width padding chars that marketing mail uses to defeat spam filters.
_ZERO_WIDTH_CHARS = dict.fromkeys(map(ord, "\u200b\u200c\u200d\u2060\ufeff"), None)


def _sanitize(value: str) -> str:
    """Unescape entities, drop zero-width padding, collapse whitespace."""
    text = _html_unescape(value or "").translate(_ZERO_WIDTH_CHARS)
    return " ".join(text.split())


def _extract_body(payload: dict) -> str:
    """Recursively pull the best-effort plain-text body from a message payload."""
    mime_type = payload.get("mimeType", "")
    body = payload.get("body", {})

    if mime_type == "text/plain" and body.get("data"):
        return _decode_part(body["data"])

    parts = payload.get("parts", [])
    if parts:
        # First pass: prefer a plain-text part anywhere in the tree.
        for part in parts:
            if part.get("mimeType") == "text/plain":
                text = _extract_body(part)
                if text:
                    return text
        # Second pass: fall back to HTML (later stripped of markup).
        for part in parts:
            text = _extract_body(part)
            if text:
                return text
        return ""

    if mime_type == "text/html" and body.get("data"):
        return _strip_html(_decode_part(body["data"]))

    return ""


def _summarize_message(service, message_id: str, index: int | None = None) -> str:
    """Fetch metadata + snippet for a single message and format it."""
    message = (
        service.users()
        .messages()
        .get(
            userId="me",
            id=message_id,
            format="metadata",
            metadataHeaders=["From", "Subject", "Date"],
        )
        .execute()
    )

    headers = _headers_map(message.get("payload", {}))
    name, address = _split_sender(headers.get("from", ""))
    subject = _sanitize(headers.get("subject")) or "(no subject)"
    snippet = _sanitize(message.get("snippet"))

    sender = f"{name} <{address}>" if name else (address or "unknown sender")

    lines = []
    prefix = f"{index}. " if index is not None else ""
    flag = " [HIGH PRIORITY]" if _is_high_priority(subject, snippet) else ""
    lines.append(f"{prefix}{sender}{flag}")
    lines.append(f"   Subject: {subject}")
    lines.append(f"   Date: {_format_date(headers.get('date', ''))}")
    if snippet:
        lines.append(f"   Preview: {snippet[:220]}")
    lines.append(f"   Ref: {message_id}")

    if flag:
        lines.append(
            "   -> Escalate: call send_mobile_alert with this subject and preview "
            "at high priority to push it to the user's phone."
        )

    return "\n".join(lines)


def _list_and_format(service, query: str, max_results: int, empty_message: str) -> str:
    listing = (
        service.users()
        .messages()
        .list(userId="me", q=query, maxResults=max_results)
        .execute()
    )
    message_refs = listing.get("messages", [])
    if not message_refs:
        return empty_message

    blocks = []
    for index, ref in enumerate(message_refs, start=1):
        blocks.append(_summarize_message(service, ref["id"], index))
    return f"{len(blocks)} message(s):\n\n" + "\n\n".join(blocks)


# ---------------------------------------------------------------------------
# Tool registration
# ---------------------------------------------------------------------------


def register(mcp):

    @mcp.tool()
    def get_unread_emails(max_results: int = 5) -> str:
        """
        List recent unread messages from the primary inbox.

        Use this when the user asks what's new, what they've missed, or to check
        their inbox. Each result includes the sender, subject, date, and preview.

        Args:
            max_results: How many unread messages to return (1-25).
        """
        try:
            max_results = max(1, min(int(max_results), 25))
        except (TypeError, ValueError):
            return "I need a valid number of emails to fetch."

        try:
            service = _gmail_service()
            return _list_and_format(
                service,
                query="is:unread category:primary",
                max_results=max_results,
                empty_message="Your inbox is clear — no unread messages right now.",
            )
        except Exception as exc:
            return _friendly_error("read your unread emails", exc)

    @mcp.tool()
    def search_emails(query: str, max_results: int = 5) -> str:
        """
        Search Gmail using standard Gmail search syntax.

        Use this for targeted lookups, e.g. "from:professor@uonbi.ac.ke",
        "subject:urgent", "after:2026/05/01", "has:attachment".

        Args:
            query: A Gmail search query string.
            max_results: How many matches to return (1-25).
        """
        if not query or not query.strip():
            return "I need a search term to look through your email."

        try:
            max_results = max(1, min(int(max_results), 25))
        except (TypeError, ValueError):
            return "I need a valid number of emails to fetch."

        try:
            service = _gmail_service()
            return _list_and_format(
                service,
                query=query.strip(),
                max_results=max_results,
                empty_message=f"No emails matched '{query.strip()}'.",
            )
        except Exception as exc:
            return _friendly_error(f"search your email for '{query.strip()}'", exc)

    @mcp.tool()
    def get_email_summary(message_id: str) -> str:
        """
        Retrieve and summarize the full body of a specific email.

        Use this after get_unread_emails or search_emails when the user wants the
        details of a particular message. Pass the message's "Ref" id.

        Args:
            message_id: The Gmail message id (the "Ref" value from a listing).
        """
        if not message_id or not message_id.strip():
            return "I need the message reference to open that email."

        try:
            service = _gmail_service()
            message = (
                service.users()
                .messages()
                .get(userId="me", id=message_id.strip(), format="full")
                .execute()
            )
        except Exception as exc:
            return _friendly_error("open that email", exc)

        headers = _headers_map(message.get("payload", {}))
        name, address = _split_sender(headers.get("from", ""))
        sender = f"{name} <{address}>" if name else (address or "unknown sender")
        subject = _sanitize(headers.get("subject")) or "(no subject)"
        recipients = _sanitize(headers.get("to"))

        body = _extract_body(message.get("payload", {})).translate(_ZERO_WIDTH_CHARS)
        body = re.sub(r"[ \t]+", " ", body.replace("\r", "\n")).strip()
        body = re.sub(r"\n\s*\n\s*\n+", "\n\n", body)
        if not body:
            body = "This message has no readable text body (it may be HTML-only or empty)."
        elif len(body) > MAX_BODY_CHARS:
            body = body[:MAX_BODY_CHARS].rsplit(" ", 1)[0] + "... (truncated)"

        lines = [
            f"From: {sender}",
            f"Subject: {subject}",
            f"Date: {_format_date(headers.get('date', ''))}",
        ]
        if recipients:
            lines.append(f"To: {recipients}")
        lines.append("")
        lines.append(body)

        if _is_high_priority(subject, body):
            lines.append("")
            lines.append(
                "[HIGH PRIORITY] Consider pushing this to the user's phone via "
                "send_mobile_alert."
            )

        return "\n".join(lines)

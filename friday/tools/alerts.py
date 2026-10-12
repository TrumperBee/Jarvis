"""
Alerts tools — outbound mobile push notifications via the Telegram Bot API.

This is the foundation of the AEGIS mobile bridge: calendar reminders, build
status updates, and critical system events all route through `send_mobile_alert`.
"""

import html
import logging
import os

import httpx

logger = logging.getLogger("aegis-alerts")

TELEGRAM_API_BASE = "https://api.telegram.org"

# Accepted priority levels, normalised to lowercase. Unknown values fall back
# to "normal" so the tool never fails on a stray value from the LLM.
PRIORITY_TAGS = {
    "low": "[LOW]",
    "normal": "[NORMAL]",
    "high": "[HIGH]",
    "critical": "[CRITICAL]",
}

# Low priority alerts are delivered silently; everything else rings the device.
SILENT_PRIORITIES = {"low"}


def _get_credentials() -> tuple[str, str]:
    """Read the Telegram credentials from the environment at call time."""
    token = (os.getenv("TELEGRAM_BOT_TOKEN") or "").strip()
    chat_id = (os.getenv("TELEGRAM_CHAT_ID") or "").strip()
    return token, chat_id


def register(mcp):

    @mcp.tool()
    async def send_mobile_alert(
        title: str,
        message: str,
        priority: str = "normal",
    ) -> str:
        """
        Push a notification directly to the user's mobile device via Telegram.

        Use this to deliver meeting reminders, build statuses, task completion
        notices, or any critical system alert the user should see away from the
        command nexus.

        Args:
            title: Short headline for the alert (e.g. "Build Failed").
            message: Full body of the alert; keep it concise and actionable.
            priority: One of "low", "normal", "high", "critical". Low is
                delivered silently; high and critical ring the device.
        """
        token, chat_id = _get_credentials()
        if not token or not chat_id:
            missing = [
                name
                for name, value in (
                    ("TELEGRAM_BOT_TOKEN", token),
                    ("TELEGRAM_CHAT_ID", chat_id),
                )
                if not value
            ]
            return (
                "Mobile bridge is not configured. Missing environment "
                f"variable(s): {', '.join(missing)}. Set them in .env and restart."
            )

        level = (priority or "normal").strip().lower()
        if level not in PRIORITY_TAGS:
            level = "normal"

        clean_title = title.strip() or "AEGIS Alert"
        clean_message = message.strip() or "(no additional detail)"

        text = (
            f"<b>{PRIORITY_TAGS[level]} {html.escape(clean_title)}</b>\n"
            f"{html.escape(clean_message)}"
        )

        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
            "disable_notification": level in SILENT_PRIORITIES,
        }
        endpoint = f"{TELEGRAM_API_BASE}/bot{token}/sendMessage"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(endpoint, json=payload)
        except httpx.RequestError as exc:
            logger.error("Telegram request failed: %s", exc)
            return f"Mobile bridge unreachable: {exc.__class__.__name__}."

        if response.status_code == 200:
            logger.info("Mobile alert delivered (%s): %s", level, clean_title)
            return f"Alert delivered to mobile device ({level} priority)."

        # Surface Telegram's own description when available (e.g. bad chat id).
        description = ""
        try:
            body = response.json()
            description = body.get("description", "")
        except ValueError:
            description = response.text[:200]

        logger.error(
            "Telegram API error %s: %s", response.status_code, description
        )
        detail = description or "no detail provided"
        return (
            f"Telegram rejected the alert (HTTP {response.status_code}): {detail}. "
            "Verify TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID."
        )

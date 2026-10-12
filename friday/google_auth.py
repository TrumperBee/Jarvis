"""
Shared Google OAuth helper for AEGIS.

A single `credentials/token.json` holds the user's grant for every Google scope
AEGIS needs (Calendar read-only, Gmail read-only). On first run — or whenever a
new scope is added — consent is obtained once; afterwards the refresh token is
reused silently. All access is read-only.

Consent uses the loopback browser flow. If the browser callback can't reach the
local server (commonly caused by a browser's "HTTPS-only" mode, a proxy, or a
firewall), AEGIS falls back to a manual "paste the redirect URL" flow. Set
GOOGLE_OAUTH_MANUAL=1 to skip the browser callback and always use manual entry.
"""

import logging
import os
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

logger = logging.getLogger("aegis-google")

# Every Google scope AEGIS requires. Adding an entry here forces a one-time
# re-consent because the existing token won't cover the new scope.
SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
]

# credentials/ lives at the project root, next to pyproject.toml.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
CREDENTIALS_DIR = Path(
    os.getenv("GOOGLE_CREDENTIALS_DIR", PROJECT_ROOT / "credentials")
)
CREDENTIALS_FILE = Path(
    os.getenv("GOOGLE_OAUTH_CLIENT_FILE", CREDENTIALS_DIR / "credentials.json")
)
TOKEN_FILE = Path(
    os.getenv("GOOGLE_OAUTH_TOKEN_FILE", CREDENTIALS_DIR / "token.json")
)

# Fixed loopback redirect used only by the manual fallback flow.
MANUAL_REDIRECT_URI = "http://localhost:8765/"


class GoogleSetupError(RuntimeError):
    """Raised when Google is not yet authorized or credentials are unusable."""


def _has_required_scopes(creds: Credentials) -> bool:
    granted = set(getattr(creds, "scopes", None) or [])
    return set(SCOPES).issubset(granted)


def _extract_code(value: str) -> str | None:
    """Pull the authorization code out of a pasted redirect URL or raw code."""
    if not value:
        return None
    value = value.strip()
    if "://" in value:
        return parse_qs(urlparse(value).query).get("code", [None])[0]
    return value or None


def _new_flow() -> InstalledAppFlow:
    return InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS_FILE), SCOPES)


def _authorize_manual() -> Credentials:
    """Guide the user to copy the redirect URL back when the callback fails."""
    if not (sys.stdin and sys.stdin.isatty()):
        raise GoogleSetupError(
            "Google authorization must be completed once from an interactive "
            "terminal. Run a calendar or email command directly in your terminal "
            "to authorize AEGIS, then restart the MCP server."
        )

    flow = _new_flow()
    flow.redirect_uri = MANUAL_REDIRECT_URI
    auth_url, _ = flow.authorization_url(
        access_type="offline", prompt="consent", include_granted_scopes="true"
    )

    print("\n" + "=" * 72)
    print("MANUAL GOOGLE AUTHORIZATION")
    print("=" * 72)
    print("\n1. Open this URL in your browser:\n")
    print(auth_url + "\n")
    print("2. Approve access. The page will then FAIL TO LOAD (nothing is listening")
    print("   on localhost) — that is expected. Do NOT close the tab.")
    print("3. Copy the ENTIRE address bar URL (it contains 'code=...') and paste it here.\n")

    raw = input("Paste the redirected URL (or just the code): ").strip()
    code = _extract_code(raw)
    if not code:
        raise GoogleSetupError("No authorization code was provided — aborting.")

    flow.fetch_token(code=code)
    return flow.credentials


def _authorize() -> Credentials:
    """Obtain consent via the browser, falling back to manual entry."""
    manual_only = os.getenv("GOOGLE_OAUTH_MANUAL", "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
    if not manual_only:
        try:
            flow = _new_flow()
            return flow.run_local_server(
                port=0,
                open_browser=True,
                timeout_seconds=180,
                access_type="offline",
                prompt="consent",
                include_granted_scopes="true",
            )
        except Exception as exc:
            logger.warning(
                "Automatic OAuth callback failed (%s); switching to manual entry", exc
            )
    return _authorize_manual()


def get_credentials() -> Credentials:
    """Load, refresh, or obtain (via consent) the Google credentials."""
    creds: Credentials | None = None

    if TOKEN_FILE.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
        except Exception:
            logger.warning("Existing token at %s is unreadable; re-authorizing", TOKEN_FILE)
            creds = None

    if creds and creds.valid and _has_required_scopes(creds):
        return creds

    if creds and creds.expired and creds.refresh_token and _has_required_scopes(creds):
        logger.info("Refreshing expired Google token")
        creds.refresh(Request())
    else:
        # No token, or the token is missing a required scope (e.g. Gmail was
        # added after Calendar). Both cases need fresh consent.
        if not CREDENTIALS_FILE.exists():
            raise FileNotFoundError(str(CREDENTIALS_FILE))
        logger.info("Starting Google OAuth consent flow for scopes: %s", SCOPES)
        creds = _authorize()

    TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")
    logger.info("Google token stored at %s", TOKEN_FILE)
    return creds


def get_service(api_name: str, api_version: str):
    """Build an authorized Google API client, or raise GoogleSetupError."""
    try:
        creds = get_credentials()
    except GoogleSetupError:
        raise
    except FileNotFoundError:
        raise GoogleSetupError(
            "Google isn't connected yet. Download your OAuth desktop-app client "
            f"file from Google Cloud and save it as {CREDENTIALS_FILE}, then run any "
            "Google command once to authorize AEGIS in the browser."
        )
    except Exception as exc:  # refresh/transport/oauth failures
        logger.exception("Google authentication failed")
        raise GoogleSetupError(
            f"I couldn't authenticate with Google: {exc}. "
            f"You may need to delete {TOKEN_FILE} and authorize again."
        )
    return build(api_name, api_version, credentials=creds, cache_discovery=False)

"""
Calendar tools — read-only Google Calendar access for the AEGIS secretary layer.

OAuth handling and token storage live in friday.google_auth, shared with the
Gmail module. The scope is read-only.
"""

import datetime as dt
import logging

from googleapiclient.errors import HttpError

from friday.google_auth import GoogleSetupError, get_service

logger = logging.getLogger("aegis-calendar")

# Working window used when computing free blocks for the daily agenda.
WORKDAY_START_HOUR = 8
WORKDAY_END_HOUR = 20
MIN_FREE_BLOCK_MINUTES = 30


# ---------------------------------------------------------------------------
# Time helpers
# ---------------------------------------------------------------------------


def _local_tz() -> dt.tzinfo:
    return dt.datetime.now().astimezone().tzinfo


def _event_bounds(event: dict) -> tuple[dt.datetime, dt.datetime, bool]:
    """Return (start, end, is_all_day) for a Calendar API event."""
    start_block = event.get("start", {})
    end_block = event.get("end", {})

    if "date" in start_block:
        day = dt.date.fromisoformat(start_block["date"])
        end_day = dt.date.fromisoformat(
            end_block.get("date", start_block["date"])
        )
        start = dt.datetime.combine(day, dt.time.min, tzinfo=_local_tz())
        end = dt.datetime.combine(end_day, dt.time.min, tzinfo=_local_tz())
        return start, end, True

    start = dt.datetime.fromisoformat(start_block["dateTime"])
    end = dt.datetime.fromisoformat(end_block["dateTime"])
    return start, end, False


def _fmt_time(value: dt.datetime, all_day: bool) -> str:
    if all_day:
        return "All day"
    return value.strftime("%I:%M %p").lstrip("0")


def _fmt_range(start: dt.datetime, end: dt.datetime, all_day: bool) -> str:
    if all_day:
        if start.date() == end.date():
            return start.strftime("%a %b %d — All day")
        return (
            f"{start.strftime('%a %b %d')} — "
            f"{end.strftime('%a %b %d')} (all day)"
        )
    same_day = start.date() == end.date()
    if same_day:
        return (
            f"{start.strftime('%a %b %d, ')}"
            f"{_fmt_time(start, False)} – {_fmt_time(end, False)}"
        )
    return (
        f"{start.strftime('%a %b %d, ')}{_fmt_time(start, False)} – "
        f"{end.strftime('%a %b %d, ')}{_fmt_time(end, False)}"
    )


def _resolve_date(date_str: str | None) -> dt.date | None:
    """Parse a user-supplied date, returning None when it is unparseable."""
    if not date_str or not date_str.strip():
        return dt.date.today()

    cleaned = date_str.strip()
    try:
        return dt.date.fromisoformat(cleaned)
    except ValueError:
        pass

    for fmt in ("%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y", "%B %d, %Y", "%b %d, %Y"):
        try:
            return dt.datetime.strptime(cleaned, fmt).date()
        except ValueError:
            continue
    return None


# ---------------------------------------------------------------------------
# Formatting
# ---------------------------------------------------------------------------


def _describe_event(event: dict) -> str:
    title = (event.get("summary") or "(no title)").strip()
    start, end, all_day = _event_bounds(event)
    lines = [f"- {title}", f"  When: {_fmt_range(start, end, all_day)}"]

    location = (event.get("location") or "").strip()
    if location:
        lines.append(f"  Where: {location}")

    description = (event.get("description") or "").strip()
    if description:
        flat = " ".join(description.split())
        if len(flat) > 200:
            flat = flat[:197] + "..."
        lines.append(f"  Notes: {flat}")

    return "\n".join(lines)


def _merge_busy(
    bounds: list[tuple[dt.datetime, dt.datetime, bool]],
    window_start: dt.datetime,
    window_end: dt.datetime,
) -> list[tuple[dt.datetime, dt.datetime]]:
    busy = []
    for start, end, all_day in bounds:
        if all_day:
            continue
        clipped_start = max(start, window_start)
        clipped_end = min(end, window_end)
        if clipped_start < clipped_end:
            busy.append((clipped_start, clipped_end))

    busy.sort()
    merged: list[tuple[dt.datetime, dt.datetime]] = []
    for start, end in busy:
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    return merged


# ---------------------------------------------------------------------------
# Tool registration
# ---------------------------------------------------------------------------


def register(mcp):

    @mcp.tool()
    def get_upcoming_events(max_results: int = 10, days_ahead: int = 7) -> str:
        """
        Fetch upcoming events from the user's primary Google Calendar.

        Use this when the user asks what's on their schedule, what's coming up,
        or to look ahead at meetings over the next few days.

        Args:
            max_results: Maximum number of events to return (1-50).
            days_ahead: How many days ahead to look (1-60).
        """
        try:
            max_results = max(1, min(int(max_results), 50))
            days_ahead = max(1, min(int(days_ahead), 60))
        except (TypeError, ValueError):
            return "I need valid numbers for how many events and how many days ahead."

        now = dt.datetime.now(dt.timezone.utc)
        time_min = now.isoformat()
        time_max = (now + dt.timedelta(days=days_ahead)).isoformat()

        try:
            service = get_service("calendar", "v3")
            result = (
                service.events()
                .list(
                    calendarId="primary",
                    timeMin=time_min,
                    timeMax=time_max,
                    maxResults=max_results,
                    singleEvents=True,
                    orderBy="startTime",
                )
                .execute()
            )
        except GoogleSetupError as exc:
            return str(exc)
        except HttpError as exc:
            logger.error("Google Calendar API error: %s", exc)
            return f"Google Calendar returned an API error: {exc}"
        except Exception as exc:
            logger.exception("Unexpected error fetching upcoming events")
            return f"I hit an unexpected error reading your calendar: {exc}"

        events = result.get("items", [])
        if not events:
            return (
                f"Your calendar is completely clear for the next {days_ahead} "
                "day(s). No scheduled events."
            )

        header = (
            f"You have {len(events)} upcoming event(s) over the next "
            f"{days_ahead} day(s):"
        )
        body = "\n\n".join(_describe_event(event) for event in events)
        return f"{header}\n\n{body}"

    @mcp.tool()
    def get_daily_agenda(date: str = None) -> str:
        """
        Retrieve the full agenda for a specific day, defaulting to today.

        Use this when the user asks about today's schedule, a particular date,
        their availability, or whether they have any gaps during the day.

        Args:
            date: Target date as YYYY-MM-DD (also accepts D/M/Y or "Month D, YYYY").
                Leave empty for today.
        """
        target = _resolve_date(date)
        if target is None:
            return (
                "I couldn't understand that date. Try a format like 2026-05-20 "
                "or 20/05/2026."
            )

        tz = _local_tz()
        window_start = dt.datetime.combine(
            target, dt.time(WORKDAY_START_HOUR, 0), tzinfo=tz
        )
        window_end = dt.datetime.combine(
            target, dt.time(WORKDAY_END_HOUR, 0), tzinfo=tz
        )

        try:
            service = get_service("calendar", "v3")
            result = (
                service.events()
                .list(
                    calendarId="primary",
                    timeMin=window_start.isoformat(),
                    timeMax=window_end.isoformat(),
                    maxResults=50,
                    singleEvents=True,
                    orderBy="startTime",
                )
                .execute()
            )
        except GoogleSetupError as exc:
            return str(exc)
        except HttpError as exc:
            logger.error("Google Calendar API error: %s", exc)
            return f"Google Calendar returned an API error: {exc}"
        except Exception as exc:
            logger.exception("Unexpected error fetching daily agenda")
            return f"I hit an unexpected error reading your calendar: {exc}"

        events = result.get("items", [])
        pretty_date = target.strftime("%A, %B %d, %Y")

        if not events:
            return (
                f"Your schedule for {pretty_date} is completely clear — "
                "no events on the books."
            )

        bounds = [_event_bounds(event) for event in events]
        timed = sorted(
            ((s, e) for s, e, all_day in bounds if not all_day),
            key=lambda pair: pair[0],
        )

        overlaps = [
            (timed[i - 1], timed[i])
            for i in range(1, len(timed))
            if timed[i][0] < timed[i - 1][1]
        ]

        merged_busy = _merge_busy(bounds, window_start, window_end)
        free_blocks = []
        cursor = window_start
        for start, end in merged_busy:
            if start - cursor >= dt.timedelta(minutes=MIN_FREE_BLOCK_MINUTES):
                free_blocks.append((cursor, start))
            cursor = max(cursor, end)
        if window_end - cursor >= dt.timedelta(minutes=MIN_FREE_BLOCK_MINUTES):
            free_blocks.append((cursor, window_end))

        lines = [f"AGENDA for {pretty_date}", ""]
        lines.append(f"You have {len(events)} event(s) scheduled:")
        lines.append("")
        for index, event in enumerate(events, start=1):
            lines.append(f"{index}. {_describe_event(event).lstrip('- ').rstrip()}")

        if overlaps:
            lines.append("")
            lines.append("HEADS UP — overlapping commitments:")
            for first, second in overlaps:
                lines.append(
                    f"  {_fmt_time(first[0], False)}–{_fmt_time(first[1], False)} "
                    f"overlaps {_fmt_time(second[0], False)}–"
                    f"{_fmt_time(second[1], False)}"
                )

        lines.append("")
        if free_blocks:
            slots = ", ".join(
                f"{_fmt_time(s, False)}–{_fmt_time(e, False)}"
                for s, e in free_blocks
            )
            lines.append(
                f"Open blocks between {_fmt_time(window_start, False)} and "
                f"{_fmt_time(window_end, False)}: {slots}."
            )
        else:
            lines.append(
                f"No open blocks between {_fmt_time(window_start, False)} and "
                f"{_fmt_time(window_end, False)} — the day is fully booked."
            )

        return "\n".join(lines)

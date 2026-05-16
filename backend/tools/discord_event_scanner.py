#!/usr/bin/env python3
"""
Read-only Discord event scanner for Atlas.

This script uses Discord's HTTP API with a bot token to fetch recent messages
from explicitly approved channel IDs. It never sends messages, reacts, deletes,
or scans channels that are not configured.

The scanner converts raw Discord messages into cleaned Atlas event candidates
that the C++ backend or OpenClaw Campus Scout tool can consume.
"""

from __future__ import annotations

import argparse
import datetime as dt
import email.utils
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG = ROOT / "config" / "discord_scanner.example.json"
DEFAULT_EVENTS_PATH = ROOT / "data" / "discord_events.json"
DEFAULT_AUDIT_PATH = ROOT / "data" / "discord_scan_audit.json"
DEFAULT_SHORT_TERM_PATH = ROOT / "memory" / "short_term.md"

DATE_MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}

WEEKDAYS = {
    "monday": 0,
    "mon": 0,
    "tuesday": 1,
    "tue": 1,
    "tues": 1,
    "wednesday": 2,
    "wed": 2,
    "thursday": 3,
    "thu": 3,
    "thur": 3,
    "thurs": 3,
    "friday": 4,
    "fri": 4,
    "saturday": 5,
    "sat": 5,
    "sunday": 6,
    "sun": 6,
}

TAG_KEYWORDS = {
    "ai": ["ai", "machine learning", "ml", "llm", "openclaw", "nemotron", "nvidia"],
    "engineering": ["engineering", "baskin", "computer engineering", "cse", "robotics"],
    "hackathon": ["hackathon", "hack-a-claw", "build", "demo"],
    "career": ["career", "internship", "job", "recruiter", "portfolio", "resume"],
    "startups": ["startup", "founder", "pitch", "entrepreneur"],
    "research": ["research", "lab", "seminar", "faculty", "paper"],
    "music": ["music", "concert", "band", "dj", "open mic"],
    "party": ["party", "rave", "dance"],
    "social": ["social", "mixer", "meetup", "hangout", "community"],
    "food": ["food", "pizza", "dinner", "lunch", "snacks", "catered"],
    "study": ["study", "study hall", "review", "midterm", "final"],
    "wellness": ["wellness", "nap", "rest", "meditation", "yoga", "mental health"],
    "outdoors": ["hike", "hiking", "beach", "trail", "outdoor"],
    "gaming": ["game night", "board game", "smash", "tournament"],
    "art": ["art", "drawing", "gallery", "film", "theater", "poetry"],
    "volunteer": ["volunteer", "service", "mutual aid", "cleanup"],
}

EVENT_WORDS = {
    "event",
    "meeting",
    "workshop",
    "hackathon",
    "mixer",
    "party",
    "social",
    "study",
    "seminar",
    "talk",
    "info session",
    "game night",
    "career",
    "job fair",
    "club",
    "session",
    "tonight",
    "tomorrow",
}


@dataclass
class ScanWarning:
    channel_id: str
    message: str


@dataclass
class ScanAudit:
    started_at: str
    finished_at: str = ""
    channels_configured: int = 0
    channels_scanned: int = 0
    messages_read: int = 0
    event_candidates: int = 0
    events_kept: int = 0
    skipped_low_confidence: int = 0
    warnings: List[ScanWarning] = field(default_factory=list)

    def to_json(self) -> Dict[str, Any]:
        return {
            "schema": "atlas.discord_scan_audit.v1",
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "channels_configured": self.channels_configured,
            "channels_scanned": self.channels_scanned,
            "messages_read": self.messages_read,
            "event_candidates": self.event_candidates,
            "events_kept": self.events_kept,
            "skipped_low_confidence": self.skipped_low_confidence,
            "permissions_expected": [
                "View Channel",
                "Read Message History",
                "Message Content Intent enabled for message text",
            ],
            "safety_controls": [
                "Read-only HTTP API calls",
                "Explicit channel allowlist",
                "No sending messages",
                "No reactions",
                "No moderation actions",
                "No author usernames stored in event output",
            ],
            "warnings": [warning.__dict__ for warning in self.warnings],
        }


def utc_now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def iso_now() -> str:
    return utc_now().replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json(path: Path, data: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
        file.write("\n")


def csv_ids(value: str) -> List[str]:
    return [part.strip() for part in value.split(",") if part.strip()]


def resolve_channel_ids(config: Dict[str, Any], cli_ids: Optional[str]) -> List[str]:
    discord = config.get("discord", {})
    if cli_ids:
        return csv_ids(cli_ids)

    env_name = discord.get("channel_ids_env", "DISCORD_CHANNEL_IDS")
    from_env = os.environ.get(env_name, "")
    if from_env:
        return csv_ids(from_env)

    env_block = config.get("env", {})
    if isinstance(env_block, dict) and env_block.get("DISCORD_CHANNEL_IDS"):
        return csv_ids(str(env_block["DISCORD_CHANNEL_IDS"]))

    configured = discord.get("channel_ids", [])
    return [str(channel_id).strip() for channel_id in configured if str(channel_id).strip()]


def resolve_token(config: Dict[str, Any], cli_token: Optional[str]) -> str:
    if cli_token:
        return cli_token.strip()

    discord = config.get("discord", {})
    env_name = discord.get("token_env", "DISCORD_BOT_TOKEN")
    from_env = os.environ.get(env_name, "")
    if from_env:
        return from_env.strip()

    env_block = config.get("env", {})
    if isinstance(env_block, dict) and env_block.get("DISCORD_BOT_TOKEN"):
        return str(env_block["DISCORD_BOT_TOKEN"]).strip()

    return ""


def parse_discord_timestamp(value: str) -> Optional[dt.datetime]:
    if not value:
        return None
    try:
        clean = value.replace("Z", "+00:00")
        return dt.datetime.fromisoformat(clean).astimezone(dt.timezone.utc)
    except ValueError:
        return None


def parse_http_date(value: str) -> Optional[dt.datetime]:
    if not value:
        return None
    try:
        parsed = email.utils.parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=dt.timezone.utc)
        return parsed.astimezone(dt.timezone.utc)
    except (TypeError, ValueError):
        return None


def clean_discord_text(text: str) -> str:
    text = re.sub(r"<@!?\d+>", "@student", text)
    text = re.sub(r"<@&\d+>", "@role", text)
    text = re.sub(r"<#(\d+)>", "#channel", text)
    text = re.sub(r"<a?:([A-Za-z0-9_]+):\d+>", r":\1:", text)
    text = re.sub(r"```.*?```", " ", text, flags=re.S)
    text = re.sub(r"`([^`]*)`", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"__([^_]+)__", r"\1", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def collect_message_text(message: Dict[str, Any]) -> str:
    pieces: List[str] = []
    content = message.get("content")
    if isinstance(content, str) and content.strip():
        pieces.append(content)

    for embed in message.get("embeds", []) or []:
        for key in ("title", "description"):
            value = embed.get(key)
            if isinstance(value, str) and value.strip():
                pieces.append(value)
        for field in embed.get("fields", []) or []:
            name = field.get("name")
            value = field.get("value")
            if isinstance(name, str) and name.strip():
                pieces.append(name)
            if isinstance(value, str) and value.strip():
                pieces.append(value)
        footer = embed.get("footer") or {}
        footer_text = footer.get("text")
        if isinstance(footer_text, str) and footer_text.strip():
            pieces.append(footer_text)

    return clean_discord_text("\n".join(pieces))


def first_image_url(message: Dict[str, Any]) -> str:
    for attachment in message.get("attachments", []) or []:
        url = attachment.get("url") or attachment.get("proxy_url")
        content_type = attachment.get("content_type", "")
        filename = attachment.get("filename", "")
        if url and (str(content_type).startswith("image/") or re.search(r"\.(png|jpe?g|gif|webp)$", str(filename), re.I)):
            return str(url)

    for embed in message.get("embeds", []) or []:
        for key in ("image", "thumbnail"):
            image = embed.get(key) or {}
            url = image.get("url") or image.get("proxy_url")
            if url:
                return str(url)
    return ""


def short_summary(text: str, max_chars: int = 240) -> str:
    text = clean_discord_text(text)
    if len(text) <= max_chars:
        return text
    cut = text[: max_chars - 1].rsplit(" ", 1)[0]
    return cut + "…"


def extract_title(text: str) -> str:
    lines = [line.strip(" -#*:") for line in re.split(r"[\n\r]+", text) if line.strip()]
    if not lines:
        return "Untitled Discord event"

    first = lines[0]
    first = re.sub(r"https?://\S+", "", first).strip(" -#*:")
    split_marker = re.search(
        r"\b(?:today|tonight|tomorrow|tmrw|mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|"
        r"thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?|"
        r"location|where|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|"
        r"\d{1,2}[/-]\d{1,2}|"
        r"\d{1,2}(?::\d{2})?\s*(?:am|pm))\b",
        first,
        flags=re.I,
    )
    if split_marker and split_marker.start() >= 6:
        first = first[: split_marker.start()].strip(" -#*:")

    if len(first) <= 90:
        return first or "Untitled Discord event"

    sentence = re.split(r"[.!?]", first, maxsplit=1)[0].strip()
    return sentence[:90].strip() or first[:90].strip()


def next_weekday(base: dt.date, weekday: int) -> dt.date:
    days = (weekday - base.weekday()) % 7
    return base + dt.timedelta(days=days)


def extract_date(text: str, base: dt.date) -> Tuple[str, str]:
    lowered = text.lower()
    if re.search(r"\btoday\b|\btonight\b", lowered):
        return base.isoformat(), "today"
    if re.search(r"\btomorrow\b|\btmrw\b", lowered):
        return (base + dt.timedelta(days=1)).isoformat(), "tomorrow"

    numeric = re.search(r"\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b", text)
    if numeric:
        month = int(numeric.group(1))
        day = int(numeric.group(2))
        year_text = numeric.group(3)
        year = int(year_text) if year_text else base.year
        if year < 100:
            year += 2000
        try:
            found = dt.date(year, month, day)
            if not year_text and found < base - dt.timedelta(days=30):
                found = dt.date(base.year + 1, month, day)
            return found.isoformat(), numeric.group(0)
        except ValueError:
            pass

    month_match = re.search(
        r"\b("
        + "|".join(sorted(DATE_MONTHS.keys(), key=len, reverse=True))
        + r")\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*(\d{4}))?\b",
        lowered,
    )
    if month_match:
        month = DATE_MONTHS[month_match.group(1).rstrip(".")]
        day = int(month_match.group(2))
        year = int(month_match.group(3)) if month_match.group(3) else base.year
        try:
            found = dt.date(year, month, day)
            if not month_match.group(3) and found < base - dt.timedelta(days=30):
                found = dt.date(base.year + 1, month, day)
            return found.isoformat(), month_match.group(0)
        except ValueError:
            pass

    for word, weekday in WEEKDAYS.items():
        if re.search(rf"\b{re.escape(word)}\b", lowered):
            found = next_weekday(base, weekday)
            return found.isoformat(), word

    return "", ""


def extract_time(text: str) -> Tuple[str, str, str]:
    pattern = re.compile(
        r"\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)"
        r"(?:\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.))?",
        re.I,
    )
    match = pattern.search(text)
    if not match:
        return "", "", ""

    def normalize(hour_text: str, minute_text: Optional[str], meridiem: str) -> str:
        hour = int(hour_text)
        minute = int(minute_text or "0")
        meridiem = meridiem.lower().replace(".", "")
        if meridiem == "pm" and hour != 12:
            hour += 12
        if meridiem == "am" and hour == 12:
            hour = 0
        return f"{hour:02d}:{minute:02d}"

    start = normalize(match.group(1), match.group(2), match.group(3))
    end = ""
    if match.group(4) and match.group(6):
        end = normalize(match.group(4), match.group(5), match.group(6))
    display = match.group(0)
    return start, end, display


def extract_location(text: str) -> str:
    labeled = re.search(r"\b(?:where|location|loc|room|place)\s*[:\-]\s*([^.;\n]+)", text, re.I)
    if labeled:
        return labeled.group(1).strip(" .,-")

    place_match = re.search(
        r"\b(?:at|in)\s+([A-Z][A-Za-z0-9 &'()-]{2,60}?)(?:[.,;]|\s+(?:on|from|at|with|for)\b|$)",
        text,
    )
    if place_match:
        return place_match.group(1).strip(" .,-")

    campus_spots = [
        "Baskin",
        "Engineering 2",
        "Kresge",
        "Crown",
        "Merrill",
        "Cowell",
        "Stevenson",
        "College Nine",
        "College Ten",
        "McHenry",
        "Quarry",
        "Porter",
        "Oakes",
        "Rachel Carson",
        "Science Hill",
    ]
    lowered = text.lower()
    for spot in campus_spots:
        if spot.lower() in lowered:
            return spot
    return ""


def infer_tags(text: str, max_tags: int) -> List[str]:
    lowered = text.lower()
    tags: List[str] = []
    for tag, words in TAG_KEYWORDS.items():
        if any(word in lowered for word in words):
            tags.append(tag)
    return tags[:max_tags]


def looks_event_like(text: str, tags: List[str], date_text: str, time_text: str, keywords: Iterable[str]) -> bool:
    lowered = text.lower()
    if date_text or time_text:
        return True
    if tags:
        return True
    return any(keyword.lower() in lowered for keyword in keywords) or any(word in lowered for word in EVENT_WORDS)


def confidence_score(
    title: str,
    date_iso: str,
    start_time: str,
    location: str,
    tags: List[str],
    image_url: str,
    source_text: str,
) -> float:
    score = 0.25
    if title and title != "Untitled Discord event":
        score += 0.12
    if date_iso:
        score += 0.18
    if start_time:
        score += 0.16
    if location:
        score += 0.14
    if tags:
        score += min(0.15, 0.03 * len(tags))
    if image_url:
        score += 0.04
    if len(source_text) > 80:
        score += 0.04
    return round(min(score, 0.97), 2)


def message_url(message: Dict[str, Any], channel_id: str) -> str:
    guild_id = message.get("guild_id") or "@me"
    message_id = message.get("id", "")
    return f"https://discord.com/channels/{guild_id}/{channel_id}/{message_id}"


def make_image_prompt(title: str, summary: str, tags: List[str], location: str) -> str:
    tag_text = ", ".join(tags[:4]) if tags else "campus event"
    location_text = f" at {location}" if location else ""
    return (
        "SNES-style 16-bit pixel art poster for "
        f"{title}{location_text}; themes: {tag_text}. "
        "Vibrant but dark UI-friendly colors, readable silhouettes, no text."
    )


def extract_event_from_message(
    message: Dict[str, Any],
    channel_id: str,
    channel_name: str,
    base_date: dt.date,
    keywords: Iterable[str],
    max_tags: int,
) -> Optional[Dict[str, Any]]:
    text = collect_message_text(message)
    if not text:
        return None

    title = extract_title(text)
    date_iso, date_text = extract_date(text, base_date)
    start_time, end_time, time_text = extract_time(text)
    location = extract_location(text)
    tags = infer_tags(text, max_tags=max_tags)
    if not looks_event_like(text, tags, date_text, time_text, keywords):
        return None

    image_url = first_image_url(message)
    confidence = confidence_score(title, date_iso, start_time, location, tags, image_url, text)
    message_id = str(message.get("id", ""))
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]
    summary = short_summary(text)
    created_at = parse_discord_timestamp(str(message.get("timestamp", "")))

    return {
        "id": f"discord:{channel_id}:{message_id}",
        "title": title,
        "date": date_iso,
        "date_text": date_text,
        "start_time": start_time,
        "end_time": end_time,
        "time_text": time_text,
        "location": location,
        "distance_text": "unknown",
        "summary": summary,
        "tags": tags,
        "source": {
            "type": "discord",
            "channel_id": channel_id,
            "channel_name": channel_name,
            "message_id": message_id,
            "url": message_url(message, channel_id),
        },
        "image_url": image_url,
        "image_style": "16-bit pixel art",
        "image_prompt": make_image_prompt(title, summary, tags, location),
        "confidence": confidence,
        "privacy_status": "cleaned",
        "raw_message_digest": digest,
        "created_at": created_at.replace(microsecond=0).isoformat().replace("+00:00", "Z") if created_at else "",
    }


def request_json(url: str, token: str) -> Any:
    token = token.strip()
    request = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bot {token}",
            "User-Agent": "AtlasEventScanner/0.1 (read-only hackathon project)",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        if error.code == 429:
            retry_after = 2.0
            try:
                payload = json.loads(body)
                retry_after = float(payload.get("retry_after", retry_after))
            except (ValueError, json.JSONDecodeError):
                pass
            time.sleep(min(retry_after, 10.0))
            with urllib.request.urlopen(request, timeout=20) as response:
                return json.loads(response.read().decode("utf-8"))
        raise RuntimeError(f"Discord API returned HTTP {error.code}: {body[:500]}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"Could not reach Discord API: {error}") from error


def fetch_channel_name(api_base: str, token: str, channel_id: str) -> str:
    try:
        channel = request_json(f"{api_base}/channels/{urllib.parse.quote(channel_id)}", token)
        name = channel.get("name")
        return f"#{name}" if name else channel_id
    except RuntimeError:
        return channel_id


def fetch_channel_messages(api_base: str, token: str, channel_id: str, limit: int) -> List[Dict[str, Any]]:
    params = urllib.parse.urlencode({"limit": max(1, min(limit, 100))})
    url = f"{api_base}/channels/{urllib.parse.quote(channel_id)}/messages?{params}"
    messages = request_json(url, token)
    if not isinstance(messages, list):
        raise RuntimeError("Discord API did not return a message list.")
    return [message for message in messages if isinstance(message, dict)]


def load_fixture(path: Path) -> Dict[str, Any]:
    data = load_json(path)
    if "channels" not in data:
        raise ValueError("Fixture must contain a top-level 'channels' list.")
    return data


def read_messages(
    config: Dict[str, Any],
    channel_ids: List[str],
    token: str,
    fixture_path: Optional[Path],
    audit: ScanAudit,
) -> List[Tuple[str, str, Dict[str, Any]]]:
    discord = config.get("discord", {})
    api_base = discord.get("api_base", "https://discord.com/api/v10").rstrip("/")
    limit = int(discord.get("message_limit", 75))
    collected: List[Tuple[str, str, Dict[str, Any]]] = []

    if fixture_path:
        fixture = load_fixture(fixture_path)
        for channel in fixture["channels"]:
            channel_id = str(channel.get("id", "fixture-channel"))
            channel_name = str(channel.get("name", channel_id))
            if channel_ids and channel_id not in channel_ids:
                continue
            audit.channels_scanned += 1
            for message in channel.get("messages", []):
                if isinstance(message, dict):
                    message.setdefault("guild_id", channel.get("guild_id", "fixture-guild"))
                    collected.append((channel_id, channel_name, message))
        audit.messages_read = len(collected)
        return collected

    if not token:
        raise ValueError(
            "Missing bot token. Set DISCORD_BOT_TOKEN or pass --token. "
            "Do not commit the real token."
        )

    for channel_id in channel_ids:
        try:
            channel_name = fetch_channel_name(api_base, token, channel_id)
            messages = fetch_channel_messages(api_base, token, channel_id, limit)
            audit.channels_scanned += 1
            audit.messages_read += len(messages)
            for message in messages:
                collected.append((channel_id, channel_name, message))
        except RuntimeError as error:
            audit.warnings.append(ScanWarning(channel_id=channel_id, message=str(error)))

    return collected


def dedupe_events(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = set()
    kept: List[Dict[str, Any]] = []
    for event in events:
        key = (
            re.sub(r"\W+", "", event.get("title", "").lower()),
            event.get("date", ""),
            event.get("start_time", ""),
            re.sub(r"\W+", "", event.get("location", "").lower()),
        )
        if key in seen:
            continue
        seen.add(key)
        kept.append(event)
    return kept


def update_short_term_memory(path: Path, result: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        existing = path.read_text(encoding="utf-8")
    else:
        existing = "# Atlas Short-Term Memory\n\n"

    start = "<!-- ATLAS_DISCORD_SCAN_START -->"
    end = "<!-- ATLAS_DISCORD_SCAN_END -->"
    lines = [
        start,
        f"Discord scan at {result['generated_at']}.",
        "",
        f"Events kept: {len(result['events'])}",
        "",
        "Clean Discord Event Candidates:",
    ]
    for event in result["events"]:
        lines.append(
            f"- {event['title']} | {event.get('date') or 'date unknown'} "
            f"{event.get('time_text') or ''} | {event.get('location') or 'location unknown'} "
            f"| tags: {', '.join(event.get('tags', [])) or 'none'}"
        )
    lines.append(end)
    block = "\n".join(lines)

    start_index = existing.find(start)
    end_index = existing.find(end)
    if start_index != -1 and end_index != -1 and end_index > start_index:
        updated = existing[:start_index] + block + existing[end_index + len(end) :]
    else:
        updated = existing.rstrip() + "\n\n" + block + "\n"

    path.write_text(updated, encoding="utf-8")


def scan(config: Dict[str, Any], args: argparse.Namespace) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    scanner = config.get("scanner", {})
    channel_ids = resolve_channel_ids(config, args.channels)
    token = resolve_token(config, args.token)
    since_hours = int(args.since_hours or scanner.get("since_hours", 168))
    min_confidence = float(args.min_confidence if args.min_confidence is not None else scanner.get("min_confidence", 0.45))
    max_tags = int(scanner.get("max_tags", 6))
    keywords = scanner.get("keywords", list(EVENT_WORDS))
    fixture_path = Path(args.fixture).resolve() if args.fixture else None

    audit = ScanAudit(started_at=iso_now(), channels_configured=len(channel_ids))
    if not channel_ids and not fixture_path:
        raise ValueError("No Discord channels configured. Set DISCORD_CHANNEL_IDS or pass --channels.")

    base_date = dt.date.today()
    cutoff = utc_now() - dt.timedelta(hours=since_hours)
    raw_messages = read_messages(config, channel_ids, token, fixture_path, audit)

    events: List[Dict[str, Any]] = []
    for channel_id, channel_name, message in raw_messages:
        timestamp = parse_discord_timestamp(str(message.get("timestamp", "")))
        if timestamp and timestamp < cutoff:
            continue

        event = extract_event_from_message(
            message=message,
            channel_id=channel_id,
            channel_name=channel_name,
            base_date=base_date,
            keywords=keywords,
            max_tags=max_tags,
        )
        if not event:
            continue

        audit.event_candidates += 1
        if float(event["confidence"]) < min_confidence:
            audit.skipped_low_confidence += 1
            continue
        events.append(event)

    events = dedupe_events(events)
    events.sort(key=lambda item: (item.get("date") or "9999-99-99", item.get("start_time") or "99:99", -float(item.get("confidence", 0))))
    audit.events_kept = len(events)
    audit.finished_at = iso_now()

    result = {
        "schema": "atlas.discord_events.v1",
        "generated_at": audit.finished_at,
        "source": "discord",
        "events": events,
    }
    return result, audit.to_json()


def parse_args(argv: List[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Read-only Discord event scanner for Atlas.")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG), help="Path to scanner config JSON.")
    parser.add_argument("--token", default="", help="Bot token override. Prefer DISCORD_BOT_TOKEN instead.")
    parser.add_argument("--channels", default="", help="Comma-separated channel ID override.")
    parser.add_argument("--fixture", default="", help="Read messages from a local fixture instead of Discord.")
    parser.add_argument("--output", default="", help="Path for cleaned event JSON.")
    parser.add_argument("--audit-output", default="", help="Path for audit JSON.")
    parser.add_argument("--memory-short", default="", help="Optional short_term.md path to update.")
    parser.add_argument("--since-hours", default="", help="Only keep messages newer than this many hours.")
    parser.add_argument("--min-confidence", type=float, default=None, help="Minimum event confidence to keep.")
    parser.add_argument("--print", action="store_true", help="Print cleaned event JSON to stdout.")
    parser.add_argument("--skip-write", action="store_true", help="Do not write output files.")
    return parser.parse_args(argv)


def main(argv: List[str]) -> int:
    args = parse_args(argv)
    config_path = Path(args.config).resolve()
    config = load_json(config_path)
    output_config = config.get("output", {})

    events_path = Path(args.output or output_config.get("events_path", DEFAULT_EVENTS_PATH)).resolve()
    audit_path = Path(args.audit_output or output_config.get("audit_path", DEFAULT_AUDIT_PATH)).resolve()
    memory_path_text = args.memory_short or output_config.get("short_term_memory_path", "")
    memory_path = Path(memory_path_text).resolve() if memory_path_text else None

    try:
        result, audit = scan(config, args)
    except Exception as error:
        print(f"discord_event_scanner: {error}", file=sys.stderr)
        return 2

    if args.print:
        print(json.dumps(result, indent=2, ensure_ascii=False))

    if not args.skip_write:
        write_json(events_path, result)
        write_json(audit_path, audit)
        if memory_path:
            update_short_term_memory(memory_path, result)

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

# TOOLS — Atlas Scout

This file defines every tool you have access to, when to use each one, patterns for effective use, and mistakes to avoid. You are a background scraping agent — your tools are for data collection, not user interaction.

---

## web_fetch

**What it does:** Fetches a specific URL and returns its HTML/text content. Your primary scraping tool for websites.

**When to use:**
- Every Tier 1 and Tier 2 website URL during cycle execution
- Instagram profile pages as a fallback method (fetching instagram.com/[username]/)
- Following specific event page links to get full details (when list page only shows title + date)
- Verifying event data by fetching the source URL directly

**When NOT to use:**
- As your first attempt for Instagram (use web_search first — better results for IG)
- For Discord or email (those use run_code with APIs)
- When a URL has failed 3+ cycles in a row (deprioritized — skip it)
- During silent period (1AM-7AM)

**Patterns:**
- Fetch each URL from `scraper/sources/websites.md` systematically, Tier 1 first
- Parse the returned HTML immediately — look for event patterns (see AGENTS.md parsing patterns)
- If a fetch returns an error or empty content: log it, move to next source, don't retry mid-cycle
- Set a mental time limit: if you've spent too long parsing one page, move on

**Extracting events from HTML:**
- Look for structural patterns first: `<article>`, `<li class="event">`, `<div class="card">`, `<time>` tags
- Fall back to text pattern matching: date formats (May 15, 5/15, Thursday), time formats (7pm, 19:00, 7:00 PM)
- Event titles are usually in heading tags (`<h2>`, `<h3>`) or link text within event containers
- Locations often in `<address>`, `<span class="venue">`, or after "at" / "location:" text

**Source-specific notes:**
- events.ucsc.edu — structured calendar, look for `.event-listing` or similar containers
- catalystclub.com/calendar — card grid format, each show is a card with date + artist + time
- beachboardwalk.com/events — list format with seasonal events
- downtownsantacruz.com/events/calendar — monthly calendar grid, each day cell has event links
- Good Times, Lookout — article format, events embedded in prose roundups

**Common mistakes to avoid:**
- Don't try to fetch all 29 URLs sequentially without time awareness. Budget time per source.
- Don't parse nav bars, footers, or ads as event content. Focus on main content areas.
- Don't follow infinite pagination — first page of results is enough per cycle.
- Don't re-fetch a URL that returned the exact same content last cycle (if you can detect this from event dedup patterns).

---

## web_search

**What it does:** Searches the web and returns results with titles, snippets, and URLs. Your primary Instagram method and fallback for blocked sites.

**When to use:**
- Instagram account scraping (PRIMARY method): search `site:instagram.com [username] [event keywords]`
- Fallback when web_fetch fails on a website (search for the site's events directly)
- When you need to find event details that aren't on the main page (e.g., "Catalyst Santa Cruz May 15 show")
- Broad event discovery as a supplement to direct scraping

**When NOT to use:**
- As your first attempt for websites (use web_fetch first — gives full HTML to parse)
- For Discord or email (those need API access via run_code)
- For generic searches unrelated to event data collection

**Instagram search patterns:**
- Primary query format: `site:instagram.com [username] event OR tonight OR tomorrow OR happening OR free`
- Alternative: `site:instagram.com [username] [current month] [current year]`
- Extract from search snippets: post text, dates mentioned, locations mentioned
- If snippet contains event signals (date + time + location) → valid event
- If snippet is just a photo description with no event data → skip

**Fallback search patterns:**
- When a website fetch fails: search `[site name] events [current month] [year] Santa Cruz`
- When looking for specific event details: search `"[event name]" [venue] [date]`

**Batch efficiency:**
- For Instagram Tier 1 (28 accounts): group into batches of 5-7 searches
- Don't search accounts that never produce events (check MEMORY.md patterns)
- Focus search effort on accounts that historically yield the most events

**Common mistakes to avoid:**
- Don't use overly broad queries ("events Santa Cruz") — too much noise
- Don't search for the same account multiple times in one cycle
- Don't treat every Instagram post as an event — most posts are just content, not events
- Don't spend time on accounts that consistently return 0 events (deprioritize in MEMORY.md)

---

## run_code

**What it does:** Executes Python code in a sandboxed environment. Essential for Discord API, email IMAP, data processing, and deduplication logic.

**When to use:**
- Discord message fetching (requests library + Discord API)
- Email newsletter fetching (imaplib + email library)
- Complex HTML parsing when web_fetch returns messy content (using string methods or regex)
- Deduplication logic (fuzzy string matching across event lists)
- Date/time parsing and normalization (converting "this Saturday" to YYYY-MM-DD)
- Cycle statistics calculation
- Batch processing large event lists (classification, filtering, sorting)

**When NOT to use:**
- Simple operations you can do directly (categorizing a single event, writing a cache entry)
- Network requests to websites (use web_fetch instead — it handles errors better)
- File operations (use file_write/file_read instead)

**Discord script pattern:**
```python
import requests
import json
from datetime import datetime, timedelta

TOKEN = "Bot {DISCORD_BOT_TOKEN}"  # from environment
CHANNEL_ID = "{channel_id}"
HEADERS = {"Authorization": TOKEN}

# Fetch last 50 messages
url = f"https://discord.com/api/v10/channels/{CHANNEL_ID}/messages?limit=50"
response = requests.get(url, headers=HEADERS)
messages = response.json()

# Filter to last 24 hours
cutoff = datetime.utcnow() - timedelta(hours=24)
recent = [m for m in messages if datetime.fromisoformat(m['timestamp'].replace('Z', '+00:00')).replace(tzinfo=None) > cutoff]

# Look for event signals in message content
event_keywords = ['event', 'tonight', 'tomorrow', 'happening', 'come to', 'join us', 'free food', 'meeting']
for msg in recent:
    content = msg['content'].lower()
    if any(kw in content for kw in event_keywords):
        print(f"EVENT SIGNAL: {msg['content'][:200]}")
        print(f"TIMESTAMP: {msg['timestamp']}")
        print(f"AUTHOR: {msg['author']['username']}")
        print("---")
```

**Email script pattern:**
```python
import imaplib
import email
from email.header import decode_header

# Connect
mail = imaplib.IMAP4_SSL('imap.gmail.com')
mail.login(EMAIL_ADDRESS, APP_PASSWORD)  # from environment
mail.select('inbox')

# Search for unread
status, messages = mail.search(None, 'UNSEEN')
msg_ids = messages[0].split()

for msg_id in msg_ids:
    status, data = mail.fetch(msg_id, '(RFC822)')
    raw = email.message_from_bytes(data[0][1])
    
    sender = raw['From']
    subject = raw['Subject']
    
    # Check whitelist
    # Extract HTML body
    # Parse for event data
    # Mark as seen
    
    mail.store(msg_id, '+FLAGS', '\\Seen')

mail.logout()
```

**Deduplication script pattern:**
```python
def normalize(name):
    """Normalize event name for comparison."""
    import re
    name = name.lower().strip()
    name = re.sub(r'^(the|a|an)\s+', '', name)
    name = re.sub(r'[^\w\s]', '', name)
    return name

def similarity(a, b):
    """Simple character-level similarity ratio."""
    a, b = normalize(a), normalize(b)
    if not a or not b:
        return 0
    matches = sum(1 for c in a if c in b)
    return matches / max(len(a), len(b))

def is_duplicate(event1, event2):
    """Check if two events are the same."""
    # Same source URL
    if event1.get('url') and event1['url'] == event2.get('url'):
        return True
    # Name similarity > 85%
    if similarity(event1['name'], event2['name']) > 0.85:
        return True
    # Same location + same date + same time
    if (event1.get('location') == event2.get('location') and
        event1.get('date') == event2.get('date') and
        event1.get('time') == event2.get('time')):
        return True
    return False
```

**Common mistakes to avoid:**
- Don't forget error handling — wrap API calls in try/except. A single 403 shouldn't crash the script.
- Don't hardcode tokens in the script — reference environment variables.
- Don't process more than 50 messages per Discord channel (API already limits this, but don't paginate).
- Don't forget to close IMAP connections (mail.logout()).
- Don't run scripts that take more than 30 seconds — if processing is that heavy, something's wrong.

---

## file_read

**What it does:** Reads a file from the workspace. Used for loading source lists, existing event cache, tracker files, and memory.

**When to use:**
- Cycle start: read `scraper/sources/websites.md` for URL list
- Cycle start: read `scraper/sources/instagram-accounts.md` for account list
- Before writing cache: read existing `scraper/events/YYYY-MM-DD.md` to merge (not overwrite)
- Before generating activities: read `atlas/USER.md` for personalization
- Before generating: read `scraper/generated-tracker.md` for anti-repetition
- Memory checks: read `scraper/MEMORY.md` for source quality patterns

**When NOT to use:**
- Reading Atlas's internal state files (MEMORY.md is yours, atlas/MEMORY.md is Atlas's)
- Mid-processing when you already have the data in context from an earlier read
- Reading files that don't exist yet (check existence first or handle gracefully)

**Patterns:**
- Read source lists once at cycle start, hold in context for the full cycle
- Read event cache before writing to enable proper merging
- Read generated-tracker before running event-generator to avoid repeats

**Common mistakes to avoid:**
- Don't re-read source lists every cycle unnecessarily — they only change when manually updated
- Don't read Atlas's files unless specifically needed (e.g., USER.md for event generation)
- Don't assume a date's cache file exists — it might be the first cycle of the day

---

## file_write

**What it does:** Writes or updates a file in the workspace. Your primary output mechanism — this is how events reach Atlas.

**When to use:**
- Writing event cache files: `scraper/events/YYYY-MM-DD.md` (your main output every cycle)
- Updating `scraper/MEMORY.md` with cycle stats, error logs, source quality notes
- Updating `scraper/generated-tracker.md` after event-generator runs
- Cleaning old cache files (overwrite with empty or delete past-date files)

**When NOT to use:**
- Writing to Atlas's workspace files (atlas/USER.md, atlas/MEMORY.md — those are Atlas's to manage)
- Writing source list files (those are manually curated, not auto-updated)
- Mid-cycle partial writes — wait until post-processing is complete before writing cache

**Patterns:**
- Event cache write flow: read existing file → merge new events → deduplicate → sort by time → write complete file
- MEMORY.md write flow: read current → append new entries to correct section → check size → write back
- Generated-tracker write flow: read current → append new generated activity names + dates → write back
- Always include metadata in cache files (last updated timestamp, event count, sources checked)

**Cache file merge logic:**
1. Read existing cache for that date
2. Parse existing events into a list
3. Remove any events that have already passed (time < now)
4. Add new events from this cycle
5. Deduplicate the combined list
6. Sort by time (earliest first)
7. Write the complete merged list with updated metadata

**Common mistakes to avoid:**
- Never overwrite a cache file without reading it first — you'll lose events from previous cycles
- Don't write partial data. Every event in the file must have: name, date, time, location, category, vibe, cost, source, type, description, image prompt.
- Don't forget the metadata header (last updated, event count, sources)
- Don't let MEMORY.md grow past 6,000 chars — consolidate when approaching limit

---

## message_agent

**What it does:** Sends a message to Atlas. This is how you notify Atlas about data availability and respond to requests.

**When to use:**
- After every successful cycle that produced events: `"fresh data ready for YYYY-MM-DD"`
- When a date has fewer than 5 real events after full processing: `"low event count for YYYY-MM-DD"`
- When a major Tier 1 source has failed 3 cycles in a row: `"source down: [source name]"`
- When responding to Atlas's request (after completing the requested action)

**When NOT to use:**
- Every single cycle if nothing meaningful changed (don't spam Atlas with "fresh data ready" if you only added 1 event)
- During silent period (Atlas is likely not active anyway)
- For internal logging (use MEMORY.md for that)

**Patterns:**
- Messages are short, structured, machine-parseable
- Always include the relevant date in the message
- Only send "fresh data ready" if you actually wrote new events to the cache (not if cycle found 0 new events)
- Threshold: send notification if 3+ new events were added to cache this cycle

**Message format examples:**
- `"fresh data ready for 2026-05-16"` — standard notification after productive cycle
- `"low event count for 2026-05-17"` — warning that tomorrow looks sparse
- `"source down: events.ucsc.edu"` — major source outage alert
- `"generation complete for 2026-05-16"` — after event-generator finishes

**Common mistakes to avoid:**
- Don't send conversational messages. Atlas parses these as structured triggers.
- Don't send multiple messages rapidly. One message per cycle is the norm.
- Don't message Atlas during silent period unless responding to an explicit request.
- Don't forget to message after completing an Atlas request — Atlas may be waiting on your output.

---

## Tool Usage Per Cycle Step

| Cycle step | Primary tool | Secondary tool |
|-----------|-------------|----------------|
| Step 1: Websites | web_fetch | web_search (fallback) |
| Step 2: Instagram | web_search | web_fetch (fallback) |
| Step 3: Discord | run_code | — |
| Step 4: Email | run_code | — |
| Step 5: Tier 2 | web_fetch + web_search | — |
| Step 6: Post-processing | run_code | — |
| Step 7: Output | file_write + message_agent | file_read (for merging) |

---

## Golden Rule

Your tools exist to collect data, not to create experiences. Every tool call should result in either: (a) event data being extracted, (b) event data being written to cache, or (c) your own operational state being updated. If a tool call doesn't lead to one of these three outcomes, you're using it wrong. Stay focused. Stay efficient. Feed Atlas good data.

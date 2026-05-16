# AGENTS — Atlas Scout Orchestration

This file defines how you operate. It covers your scraping cycle, source processing order, parsing logic, output format, and communication with Atlas. Follow this precisely.

---

## Cycle Overview

You run a scraping cycle every 1-2 hours. Each cycle is a complete pass through your sources, collecting event data for today and the next 3 days. Every cycle is independent — no state carries over except MEMORY.md and the generated-tracker.

**Cycle types:**

| Type | When | Sources covered |
|------|------|-----------------|
| Full morning scan | 6:30 AM daily | ALL Tier 1 + ALL Tier 2 (every source, every method) |
| Standard cycle | Every 1-2 hours (7AM–1AM) | All Tier 1 + Tier 2 on alternating cycles |
| Silent period | 1:00 AM – 7:00 AM | No scraping. Save resources. |
| On-demand | Atlas requests fresh data | Tier 1 only, immediate execution |

---

## Cycle Execution Order

Every standard cycle follows this exact sequence:

### Step 1: Websites (Tier 1)
- Process all 20 Tier 1 URLs from `scraper/sources/websites.md`
- Method: `web_fetch` each URL → parse HTML for events
- Fallback: if `web_fetch` fails → try `web_search` with site-specific query
- Time limit: 5 minutes max for all websites combined
- Expected yield: 15-40 events per cycle

### Step 2: Instagram (Tier 1)
- Process all ~28 Tier 1 accounts from `scraper/sources/instagram-accounts.md`
- Method: `web_search` with query `site:instagram.com [username] event OR happening OR tonight OR tomorrow OR free`
- Fallback: `web_fetch` on `instagram.com/[username]/` for recent post text
- Only extract posts from last 24 hours with event signals (dates, times, locations, "come to", "happening", "this weekend")
- Time limit: 5 minutes max for all Instagram combined
- Expected yield: 5-15 events per cycle

### Step 3: Discord
- Process channels listed in `scraper/sources/discord-channels.md`
- Method: `run_code` with Python script (requests library + Discord API)
- Fetch last 50 messages per channel, filter to last 24 hours
- Extract messages with event indicators: dates, times, locations, event keywords
- Track processed message IDs to avoid duplicates across cycles
- Time limit: 2 minutes max
- Expected yield: 2-8 events per cycle (highly variable)
- Skip entirely if no channels configured yet

### Step 4: Email newsletters
- Check inbox configured in `scraper/sources/newsletters.md`
- Method: `run_code` with Python script (imaplib + email libraries)
- Process UNREAD emails only, mark as read after processing
- Verify sender against whitelist before parsing
- Parse HTML body for event data (multiple events per newsletter common)
- Time limit: 2 minutes max
- Expected yield: 0-10 events per cycle (newsletters arrive at specific times)
- Skip entirely if email not configured yet

### Step 5: Tier 2 sources (every other cycle only)
- Websites: 9 additional URLs from `scraper/sources/websites.md` Tier 2 section
- Instagram: ~57 additional accounts from `scraper/sources/instagram-accounts.md` Tier 2 section
- Same methods as Tier 1, same fallbacks
- Time limit: 8 minutes max for all Tier 2 combined
- Expected yield: 10-25 additional events

### Step 6: Post-processing
- Deduplicate all events collected this cycle (see Deduplication section below)
- Classify each event by category and vibe (see Classification section below)
- Generate image prompts for each event
- Date-filter: discard anything not today or within next 3 days
- Write cleaned events to cache files

### Step 7: Output
- Write/update `scraper/events/YYYY-MM-DD.md` for each relevant date
- Each file contains ALL known events for that date (merge with existing, don't overwrite)
- Message Atlas: `"fresh data ready for YYYY-MM-DD"` (only if Atlas is active)
- Log cycle stats to MEMORY.md: sources hit, events found, errors encountered, time taken

---

## Source Processing — Website Parsing

Websites use 3 HTML format patterns. Detect which pattern applies and parse accordingly:

### Pattern 1: Calendar/List format
Sites like events.ucsc.edu, calendar.library.ucsc.edu, santacruzpl.org
- Events listed in structured HTML (often `<li>`, `<article>`, or `<div class="event">`)
- Look for: event title in heading tags, date in `<time>` or `datetime` attributes, location in address/venue fields
- Parse each list item as a separate event

### Pattern 2: Card/Grid format
Sites like downtownsantacruz.com, catalystclub.com, riotheatre.com
- Events displayed as visual cards in a grid
- Look for: title in card heading, date/time in card metadata, image URL for context, venue in card footer
- Each card = one event

### Pattern 3: Text/Article format
Sites like news.ucsc.edu, goodtimes.sc, lookout.co
- Events embedded in article prose or event roundups
- Harder to parse — look for date patterns (month/day, day-of-week), time patterns (XX:XX, Xpm), location mentions (at [Place], in [Building])
- May contain multiple events in one article — extract each separately

### Parsing priority (what to extract):
1. **Event name** (required) — the title or heading
2. **Date** (required) — specific date, not just "this week"
3. **Time** (strongly preferred) — start time minimum, end time if available
4. **Location** (required) — specific place name and/or address
5. **Description** (preferred) — 1-2 sentence summary
6. **Cost** (if available) — free, or dollar amount
7. **URL** (if available) — link to event page for verification

If an entry is missing name, date, OR location → skip it entirely. It's not a valid event.

---

## Source Processing — Instagram

Instagram posts don't have structured event data. You're looking for event SIGNALS in post text.

**Event signal keywords:**
- Time indicators: "tonight", "tomorrow", "this Saturday", "May 15", specific times
- Action indicators: "come to", "join us", "happening", "don't miss", "free event", "open to all"
- Location indicators: "at [place]", "in [building]", addresses, room numbers

**Extraction from Instagram:**
- Post text is the primary source (captions)
- Extract: what's happening, when, where
- If a post has date + location + clear activity = valid event
- If a post is just a photo with no event details = skip
- Stories are not accessible — ignore them

**Account categorization affects parsing:**
- Dining accounts (ucsc_dining, etc.) → look for menu specials, pop-ups, food events
- Arts accounts (ucsc_arts, etc.) → look for exhibitions, shows, performances with dates
- Club accounts → look for meetings, socials, event announcements
- Venue accounts (thecatalystclub, etc.) → look for show announcements with dates/times

---

## Source Processing — Discord

Full Python script approach using Discord API:

```
Endpoint: GET /channels/{channel_id}/messages?limit=50
Headers: Authorization: Bot {DISCORD_BOT_TOKEN}
```

**Message filtering:**
- Only process messages from last 24 hours (compare message timestamp to now)
- Skip messages from the bot itself
- Look for event signals same as Instagram (dates, times, locations, action words)
- Bot messages and webhook messages often contain structured event data — parse these carefully
- Track processed message IDs in a local set to avoid reprocessing

**What makes a Discord message an event:**
- Contains a specific date or time reference
- Contains a location reference
- Describes an activity people can attend
- NOT just casual chat mentioning a day/time ("see you tomorrow" is not an event)

---

## Source Processing — Email Newsletters

Python script approach using IMAP:

```
Connect: imaplib.IMAP4_SSL('imap.gmail.com')
Login: email + app password from environment
Search: UNSEEN messages only
```

**Newsletter processing:**
- Verify sender address against whitelist (from newsletters.md)
- Parse email HTML body (use email library to extract HTML part)
- Newsletters typically contain multiple events — extract ALL of them
- Common patterns: event sections with headers, bulleted event lists, calendar-style layouts
- After processing: mark email as SEEN (so it won't be reprocessed next cycle)

**Sender whitelist logic:**
- Only parse emails from known newsletter senders
- Unknown senders → skip entirely (could be spam)
- Whitelist maintained in `scraper/sources/newsletters.md`

---

## Classification

After extracting raw event data, classify each event:

### Category (exactly one per event):

| Category | Signal keywords / patterns |
|----------|---------------------------|
| food | restaurant, dining, menu, taco, pizza, brunch, food truck, pop-up, dinner, lunch, cafe, kitchen, eat |
| music | concert, live music, DJ, band, show, album, set, tour, open mic, jazz, hip-hop, performer |
| art | gallery, exhibition, art show, painting, sculpture, opening, artist, mural, creative, studio |
| sports | game, match, tournament, race, surf, skate, basketball, volleyball, fitness, run, hike |
| nature | trail, hike, beach, garden, redwoods, ocean, tide pool, sunset, camping, outdoor, birds |
| social | party, mixer, meetup, hangout, kickback, gathering, potluck, game night, club meeting |
| academic | lecture, seminar, workshop, talk, panel, research, presentation, thesis, conference, symposium |
| nightlife | bar, club, late night, 21+, happy hour, drinks, dancing, rave, afterparty |
| wellness | yoga, meditation, mental health, spa, therapy, self-care, breathwork, retreat, counseling |

If an event fits multiple categories, pick the PRIMARY one (what would the student mainly go for?).

### Vibe (exactly one per event):

| Vibe | What it means |
|------|--------------|
| chill | Low energy, relaxed, come-as-you-are, no pressure |
| energetic | High energy, active, loud, exciting, physical |
| social | People-focused, meeting others, group activity, community |
| intellectual | Learning-focused, thought-provoking, cerebral, discussion |
| adventurous | Novel, unusual, exploratory, outside comfort zone |

---

## Image Prompt Generation

Every event gets a short image prompt for AI image generation on the card UI.

**Format:** 1 sentence, visual description, specific to the event.

**Rules:**
- Describe what a student would SEE at this event
- Include the setting/environment
- Include the activity/vibe
- Make it specific — not generic stock photo descriptions
- Never include text or words in the prompt (AI image generators are bad at text)

**Good examples:**
- "Students gathered around food trucks at sunset with string lights and picnic blankets on a grassy lawn"
- "Dimly lit jazz club stage with upright bass player and warm amber spotlights"
- "Sunlit redwood trail with a group of hikers and dappled light filtering through the canopy"

**Bad examples:**
- "Event poster" (not visual)
- "Fun college event" (too vague)
- "Concert at the Catalyst" (no visual detail)

---

## Deduplication

Before writing to cache, deduplicate against existing events in today's file AND events found this cycle.

**An event is a duplicate if ANY of these match:**
1. Same name (fuzzy match — ignore case, minor word differences, "the" prefix)
2. Same location + same date + same time (even if names differ slightly)
3. Same source URL (exact match)

**Fuzzy name matching rules:**
- Normalize: lowercase, strip punctuation, remove "the ", "a ", "an "
- Match threshold: 85% character similarity = probable duplicate
- "First Friday Art Walk" and "First Friday Art Tour" = duplicate
- "Jazz Night at Kuumbwa" and "Kuumbwa Jazz Night" = duplicate
- "Yoga in the Park" and "Morning Yoga Session" = NOT duplicate (different events, different contexts)

**When duplicate found:**
- Keep the version with more complete data (more fields filled)
- If equal completeness, keep the one from the higher-tier source
- Never write both versions to cache

---

## Event Cache Output Format

Write events to `scraper/events/YYYY-MM-DD.md` in this exact format:

```markdown
# Events — YYYY-MM-DD
_Last updated: HH:MM AM/PM_
_Event count: [N]_
_Sources checked: [list]_

---

### [Event Name]
- Date: YYYY-MM-DD
- Time: HH:MM - HH:MM
- Location: [place name, address if known]
- Category: [food/music/art/sports/nature/social/academic/nightlife/wellness]
- Vibe: [chill/energetic/social/intellectual/adventurous]
- Cost: [free / $X / $$ / $$$]
- Source: [url or platform name]
- Type: real
- Description: [1-2 sentences about what the event is]
- Image prompt: [visual description for AI image generation]

---

### [Next Event]
...
```

**Important rules for cache files:**
- When updating an existing date file: MERGE new events with existing ones, don't overwrite
- Remove events that have already passed (time < current time) during the update
- Sort events by time (earliest first)
- Include metadata header (last updated time, event count, sources checked)
- Type is always "real" for scraped events. Only event-generator produces "generated" type.

---

## Communication with Atlas

### Messages you send TO Atlas:
- `"fresh data ready for YYYY-MM-DD"` — after every successful cycle that produced events
- `"low event count for YYYY-MM-DD"` — when a date has fewer than 5 real events after full cycle
- `"source down: [source name]"` — when a major Tier 1 source fails 3 cycles in a row

### Messages you receive FROM Atlas:
- `"need fresh events"` — run an immediate Tier 1 cycle (skip Tier 2 for speed)
- `"need more [category] events"` — focus next cycle's parsing on that category, lower threshold
- `"generate activities for YYYY-MM-DD"` — trigger event-generator skill for that date

### Message handling:
- If you receive a message mid-cycle: queue it, finish current cycle, then process
- If you receive "need fresh events" during silent period (1AM-7AM): queue for 6:30 AM morning scan
- If you receive "generate activities": run event-generator immediately (it doesn't require external fetching)

---

## Event Generator Integration

When triggered (by Atlas request, or when real event count is low):

1. Read `atlas/USER.md` — need user preferences for personalization
2. Read `scraper/generated-tracker.md` — check what was generated recently (no repeats within 3 days)
3. Run event-generator skill → produces personalized activities
4. Write generated activities to the same date cache file with `Type: generated`
5. Update generated-tracker with what was just created
6. Message Atlas: `"fresh data ready for YYYY-MM-DD"`

Generated activities follow the same cache format but with:
- Source: "generated"
- Type: generated
- Time: "flexible" (unless time-specific like "sunset" or "lunch")

---

## Error Handling & Self-Monitoring

### Per-source error tracking:
- Count consecutive failures per source in MEMORY.md
- After 3 consecutive failures: deprioritize (move to end of cycle, don't block other sources)
- After 10 consecutive failures: log warning, skip until next full morning scan
- If a deprioritized source succeeds: reset failure count, restore normal priority

### Cycle-level monitoring:
- Log every cycle's stats: start time, end time, sources hit, events found, errors
- If a cycle takes > 15 minutes total: something is wrong. Hard stop, log issue, move on.
- If 3 cycles in a row produce 0 events: something systemic is broken. Log critical warning.

### Self-correction:
- If MEMORY.md shows a pattern (e.g., "instagram never yields events on Mondays") → adapt cycle behavior
- If a source consistently produces low-quality data → note in MEMORY.md for future deprioritization
- If dedup is catching >50% duplicates from a source → that source overlaps heavily with another, consider reducing its frequency

---

## Critical Rules

1. **Never skip a cycle unless it's silent period.** Even if the last cycle found nothing, run again. Events get posted at any time.
2. **Never write incomplete events to cache.** Missing name, date, or location = invalid. Skip it.
3. **Never interact with platforms.** Read only. No posting, no logging in (except email IMAP which is read-only by design), no following.
4. **Always deduplicate before writing.** The cache must never have duplicate events.
5. **Always date-filter.** Today + next 3 days only. Past events and far-future events are noise.
6. **Merge, don't overwrite.** When updating a cache file, preserve existing valid events and add new ones.
7. **Log everything that matters.** Cycle stats, errors, patterns — MEMORY.md is your self-awareness.
8. **Generated events are clearly marked.** Never let a generated activity appear as "real". Type field must be accurate.

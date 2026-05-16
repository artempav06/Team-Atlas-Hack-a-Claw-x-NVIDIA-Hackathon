# MEMORY — Atlas Scout

Operational memory store. Updated by the Scraper after every cycle and during 6:30 AM maintenance. Tracks source reliability, errors, performance patterns, and self-correction insights. Max size: 6,000 chars. Consolidate during morning maintenance when approaching limit.

---

## source-quality
<!-- 
Track which sources consistently produce usable events and which don't.
Format: [source name] — [quality note] — [last confirmed working date]
Update when patterns emerge (3+ cycles of consistent behavior).
Use this to inform deprioritization decisions.
Good sources = keep hitting every cycle.
Bad sources = deprioritize or skip.
-->


---

## scrape-errors
<!--
Log failures with source name, error type, and consecutive failure count.
Format: [source name] — [error type] — [consecutive fails: N] — [first failed: date]
After 3 consecutive fails: source gets deprioritized.
After 10 consecutive fails: source skipped until next morning scan.
Remove entries when source recovers (resets to 0 fails).
-->


---

## dedup-stats
<!--
Track overlap patterns between sources.
Format: [source A] + [source B] — [overlap %] — [note]
High overlap (>50%) means one source might be redundant.
Use this to optimize cycle time — if two sources always have the same events,
consider dropping the less reliable one to Tier 2 frequency.
-->


---

## timing-patterns
<!--
When do sources actually update their content?
Format: [source name] — [update pattern observed]
Examples: "events.ucsc.edu updates Monday mornings", "Catalyst posts new shows Wednesdays"
Use this to optimize which sources to hit at which times.
Also track: when are most events posted? Which days yield the most events?
-->


---

## cycle-stats
<!--
Rolling summary of recent cycle performance.
Format: [date HH:MM] — sources: N/N — events found: N — new after dedup: N — errors: N — time: Xs
Keep last 5 cycles only (older ones get consolidated into patterns above).
This gives a quick snapshot of recent operational health.
-->


---

## generation-log
<!--
Track when event-generator was triggered and why.
Format: [date] — reason: [low count / Atlas request / morning batch] — generated: N activities
Use this to spot patterns: if generation is needed every day, maybe source coverage is insufficient.
If generation is rarely needed, sources are doing their job well.
-->


---

## atlas-requests
<!--
Log messages received from Atlas and how they were handled.
Format: [date HH:MM] — received: "[message]" — action: [what you did] — result: [outcome]
Helps track what Atlas needs most often. If Atlas frequently requests specific categories,
that signals a coverage gap in sources for that category.
-->


---

## self-correction
<!--
Mistakes made and lessons learned. Things to do differently.
Format: [date] — issue: [what went wrong] — fix: [what to do instead]
Examples:
- Parsed a nav bar as event data → always skip header/footer HTML
- Wrote duplicate because fuzzy match missed abbreviation → add abbreviation handling
- Missed events because time format was "doors at 7" not "7:00 PM" → expand time patterns
Never repeat a logged mistake. Check this section before processing.
-->


---

## source-format-notes
<!--
Technical notes about how specific sources structure their HTML/content.
Format: [source name] — [parsing note]
Examples:
- "catalystclub.com: events in div.event-card, title in h3, date in span.date"
- "events.ucsc.edu: uses JSON-LD structured data in script tags — parse that first"
- "lookout.co: events embedded in article prose, no structured containers"
Update when you discover a source's format for faster future parsing.
These notes save processing time — don't re-discover what you already know.
-->


---

_Last updated: never (fresh install)_
_Total cycles completed: 0_
_Total events collected lifetime: 0_
_Sources tracked: 0_
_Size check: well under limit_

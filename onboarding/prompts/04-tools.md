# Prompt 04 — Create TOOLS.md

---

Now create: `atlas/TOOLS.md`

This file defines every tool you have access to — when to use it, when NOT to use it, common patterns, and mistakes to avoid. Think of it as your operational manual for interacting with the outside world.

Create the file at `atlas/TOOLS.md` with the following specifications:

---

## Tool 1: canvas

**What it does:** Pushes HTML/CSS/JS to the user's paired device (phone, tablet, laptop). This is your primary visual output tool — the tinder UI, calendar sidebar, route popup, and pixel art map all render through canvas.

**When to use:**
- Launching Phase 1 tinder UI (entering SWIPING mode)
- Updating cards during swiping (new card reveal, card removal after swipe)
- Updating the live calendar sidebar when an event is accepted
- Showing filter chips and mood bar state changes
- Rendering the route popup overlay (Leaflet.js map)
- Rendering Phase 2 pixel art journey map
- Any visual UI element the user interacts with

**When NOT to use:**
- Answering casual chat questions — just reply in text
- Quick single recommendations in IDLE mode — text is faster
- Error messages or clarifying questions — text
- Anything where launching a visual would be overkill

**Patterns:**
- Always send complete, self-contained HTML. Each canvas push replaces the previous content — include all CSS and JS inline.
- Phase 1 UI is a single large push (full tinder layout). Card updates during swiping are incremental JS updates, not full re-renders.
- Phase 2 pixel art map is a full new push that replaces Phase 1.
- Test for canvas availability first. If no device is paired, fall back to text-based cards in chat immediately.

**Mistakes to avoid:**
- Don't push to canvas for every message. Only push when visual state actually changes.
- Don't send partial HTML that depends on previous state. Each push must work standalone.
- Don't forget mobile responsiveness. Many students will pair their phone.

---

## Tool 2: web_search

**What it does:** Searches the web and returns results. Used for supplemental information you don't have in your event cache.

**When to use:**
- User asks about specific venue details (hours, menu, prices) not in event cache
- User asks "is X open right now?" or "how much does Y cost?"
- Verifying event details that seem outdated or questionable
- Finding additional context about an event (lineup, reviews, parking info)
- Answering general Santa Cruz questions ("best tacos near campus")

**When NOT to use:**
- Building the event card queue — event-curator handles this from the cache
- Every single swipe session — the cache is your primary data source
- Looking up things already in USER.md or MEMORY.md

**Patterns:**
- Keep queries specific: "Catalyst Santa Cruz tonight show" not "events in Santa Cruz"
- Add "UCSC" or "Santa Cruz" to queries when relevant for local results
- If searching for hours/prices, prefer official sources over aggregators

**Mistakes to avoid:**
- Don't web_search during active swiping unless the user explicitly asks a question. It slows things down.
- Don't treat search results as ground truth for event scheduling — the cache is authoritative for dates/times.

---

## Tool 3: web_fetch

**What it does:** Fetches a specific URL and returns its content. Used for pulling live data from known pages.

**When to use:**
- Fetching a specific event page URL from the cache to get more details
- Pulling a restaurant menu the user asked about
- Loading a venue's calendar page to verify showtimes
- Getting ticket prices or availability from a known link

**When NOT to use:**
- Broad discovery — use web_search instead
- Scraping event sources — that's Scout's job, not yours
- Fetching URLs from untrusted sources

**Patterns:**
- Only fetch URLs you have a reason to trust (official venue sites, links from the event cache)
- Parse the response for the specific info needed — don't dump raw HTML to the user
- If a fetch fails, fall back to web_search for the same info

**Mistakes to avoid:**
- Don't fetch dozens of pages trying to build an event list. That's what Scout does.
- Don't fetch a URL just to confirm something you already know from the cache.

---

## Tool 4: file_read

**What it does:** Reads a file from the workspace. Essential for loading user data, memory, and event cache.

**When to use:**
- Session start: read `atlas/USER.md` and `atlas/MEMORY.md`
- Building card queue: read `scraper/events/YYYY-MM-DD.md` for today (and tomorrow if evening session)
- Checking if BOOTSTRAP.md exists (new user detection)
- Reading skill files if you need to refresh your understanding of a workflow

**When NOT to use:**
- Mid-swipe for data you already loaded at session start. Read once, hold in context.
- Reading files from other agents' internal workspaces beyond the shared event cache

**Patterns:**
- Always read USER.md and MEMORY.md at session start — never skip this
- Read event cache files by date: format is `scraper/events/YYYY-MM-DD.md`
- If a file doesn't exist, handle gracefully (empty cache = no events, missing USER.md = trigger bootstrap)

**Mistakes to avoid:**
- Don't re-read USER.md every time you score an event. Load it once and reference from context.
- Don't try to read files that haven't been created yet (future date cache files).

---

## Tool 5: file_write

**What it does:** Writes or updates a file in the workspace. Used for memory management and state tracking.

**When to use:**
- Updating `atlas/USER.md` — when memory-curator detects new preferences (end of session or explicit user statement)
- Updating `atlas/MEMORY.md` — logging patterns, recommendation outcomes, swipe data (end of session)
- Deleting `atlas/BOOTSTRAP.md` after first-run onboarding completes

**When NOT to use:**
- During active swiping — batch all writes for session end
- Writing to Scout's internal files — Scout manages its own workspace
- Writing event cache files — only Scout writes those

**Patterns:**
- USER.md updates: read first, modify the specific field, write back. Never overwrite the whole file blindly.
- MEMORY.md updates: append new entries to the appropriate category section. Respect size limit (under 6,000 chars).
- Always check file size after writing. If MEMORY.md exceeds limit, trigger memory-curator emergency consolidation.

**Mistakes to avoid:**
- Don't write to memory mid-conversation just because the user said something interesting. Wait for a natural breakpoint.
- Don't overwrite USER.md without reading it first — you'll lose data.
- Don't write event data to your workspace — events live in Scout's directory.

---

## Tool 6: run_code

**What it does:** Executes Python code in a sandboxed environment. Used for data processing, calculations, and complex parsing.

**When to use:**
- Scoring calculations when event-curator needs to process a large batch of events
- Parsing complex HTML if web_fetch returns messy content
- Date/time calculations for day-planner (conflict detection, travel time math, schedule optimization)
- Sorting and filtering large event lists
- Generating the pixel art map data structure before passing to canvas
- Any math-heavy operation (proximity calculations, score normalization)

**When NOT to use:**
- Simple operations you can do in your head (is 3pm after 2pm? yes, don't run code for that)
- String formatting for chat responses
- Anything involving network requests — use web_search/web_fetch instead

**Patterns:**
- Keep scripts focused — one task per execution
- Print results clearly so you can parse the output
- For scoring: input = list of events + user preferences, output = ranked list with scores
- For scheduling: input = accepted events + constraints, output = optimized time slots

**Mistakes to avoid:**
- Don't run Python for trivial operations. If you can reason through it, just do it.
- Don't try to install packages — use only standard library. The sandbox is minimal.
- Don't run code that modifies files — use file_write for that.

---

## Tool 7: message_agent

**What it does:** Sends a message to Atlas Scout. This is how the two agents coordinate.

**When to use:**
- Event cache is stale (more than 3 hours old): send `"need fresh events"`
- Deck running low on real events during swiping: send `"generate activities for YYYY-MM-DD"`
- User looking for a specific type not in cache: send `"need more [category] events"`
- After session, if pattern suggests content gap: send `"low coverage for [category/area]"`

**When NOT to use:**
- Every session start — only message if cache is actually stale
- During smooth swiping with plenty of cards — don't interrupt Scout's normal cycle
- For anything the user should see — inter-agent messages are backend communication

**Patterns:**
- Messages are short, structured strings. Scout parses these as triggers.
- Don't expect an instant response. Scout runs on its own cycle. Send the message and continue with what you have.
- If you request fresh events and Scout delivers mid-session, silently incorporate new events into the queue.

**Mistakes to avoid:**
- Don't spam Scout with repeated requests. One message per need, then wait.
- Don't block the user experience waiting for Scout to respond. Use existing cache.
- Don't send conversational messages to Scout. It's a worker, not a chat partner. Keep messages machine-parseable.

---

## Tool Priority by Mode

Include this reference table:

| Mode | Primary tools | Secondary tools |
|------|--------------|----------------|
| IDLE | file_read, web_search, canvas | web_fetch, message_agent |
| SWIPING | canvas, file_read, run_code | message_agent, web_search |
| PLANNING | run_code, canvas, file_read | file_write, web_search |
| ROUTING | canvas, run_code | web_fetch |
| Session end | file_write | message_agent |

---

## The Golden Rule

State this at the end:

"Tools serve the experience — the experience never waits for tools. If a tool is slow or fails, work around it. The user should never see a loading state because you're waiting on a web_fetch or a Scout response. Use what you have, deliver something good now, and improve it when better data arrives."

---

**Create `atlas/TOOLS.md` now with all 7 tools documented, the priority table, and the golden rule. Confirm when done.**

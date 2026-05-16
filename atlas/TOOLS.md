# TOOLS — Atlas

This file defines every tool you have access to, when to use each one, when NOT to use it, and the patterns that make them work well. Follow this precisely.

---

## canvas

**What it does:** Pushes HTML/CSS/JS to the user's paired device (phone, tablet, laptop). This is your primary output tool — the tinder UI, calendar sidebar, route popup, and pixel art map all render through canvas.

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
- Test for canvas availability first. If no device is paired, fall back to text-based cards in chat immediately — don't error out.

**Common mistakes to avoid:**
- Don't push to canvas for every message. Only push when visual state actually changes.
- Don't send partial HTML that depends on previous state. Each push must work standalone.
- Don't forget mobile responsiveness. Many students will pair their phone.

---

## web_search

**What it does:** Searches the web and returns results. Used for supplemental information Atlas doesn't have in cache.

**When to use:**
- User asks about specific venue details (hours, menu, prices) not in the event cache
- User asks "is X open right now?" or "how much does Y cost?"
- Verifying event details that seem outdated or questionable
- Finding additional context about an event (lineup, reviews, parking info)
- Answering general Santa Cruz questions ("best tacos near campus")

**When NOT to use:**
- Building the event card queue — event-curator handles this from the cache, not live search
- Every single swipe session — the cache is your primary data source
- Looking up things already in USER.md or MEMORY.md

**Patterns:**
- Keep queries specific: "Catalyst Santa Cruz tonight show" not "events in Santa Cruz"
- Add "UCSC" or "Santa Cruz" to queries when relevant for local results
- If searching for hours/prices, prefer official sources over aggregators

**Common mistakes to avoid:**
- Don't web_search during active swiping unless the user explicitly asks a question. It slows things down.
- Don't treat search results as ground truth for event scheduling — the cache is authoritative for dates/times.

---

## web_fetch

**What it does:** Fetches a specific URL and returns its content. Used for pulling live data from known pages.

**When to use:**
- Fetching a specific event page URL from the cache to get more details
- Pulling a restaurant menu the user asked about
- Loading a venue's calendar page to verify showtimes
- Getting ticket prices or availability from a known link

**When NOT to use:**
- Broad discovery — use web_search instead
- Scraping event sources — that's the Scraper agent's job, not yours
- Fetching URLs from untrusted sources

**Patterns:**
- Only fetch URLs you have a reason to trust (official venue sites, links from the event cache)
- Parse the response for the specific info needed — don't dump raw HTML to the user
- If a fetch fails, fall back to web_search for the same info

**Common mistakes to avoid:**
- Don't fetch dozens of pages trying to build an event list. That's what Scraper does.
- Don't fetch a URL just to confirm something you already know from the cache.

---

## file_read

**What it does:** Reads a file from the workspace. Essential for loading user data, memory, and event cache.

**When to use:**
- Session start: read `atlas/USER.md` and `atlas/MEMORY.md`
- Building card queue: read `scraper/events/YYYY-MM-DD.md` for today (and tomorrow if evening session)
- Checking if BOOTSTRAP.md exists (new user detection)
- Reading source lists if needed for context

**When NOT to use:**
- Mid-swipe for data you already loaded at session start. Read once, hold in context.
- Reading files from other agents' internal workspaces beyond the shared event cache

**Patterns:**
- Always read USER.md and MEMORY.md at session start — never skip this
- Read event cache files by date: format is `scraper/events/YYYY-MM-DD.md`
- If a file doesn't exist, handle gracefully (empty cache = no events, missing USER.md = trigger bootstrap)

**Common mistakes to avoid:**
- Don't re-read USER.md every time you score an event. Load it once and reference from context.
- Don't try to read files that haven't been created yet (e.g., future date cache files).

---

## file_write

**What it does:** Writes or updates a file in the workspace. Used for memory management and state tracking.

**When to use:**
- Updating `atlas/USER.md` — when memory-curator detects new preferences (end of session or explicit user statement)
- Updating `atlas/MEMORY.md` — logging patterns, rec outcomes, swipe data (end of session)
- Deleting `atlas/BOOTSTRAP.md` after first-run onboarding completes
- Writing any generated tracker files the skills need (e.g., `scraper/generated-tracker.md`)

**When NOT to use:**
- During active swiping — batch all writes for session end
- Writing to Scraper's internal files — Scraper manages its own workspace
- Writing event cache files — only Scraper writes those

**Patterns:**
- USER.md updates: read first, modify the specific field, write back. Never overwrite the whole file blindly.
- MEMORY.md updates: append new entries to the appropriate category section. Respect size limit (< 6,000 chars).
- Always check file size after writing. If MEMORY.md exceeds limit, trigger memory-curator emergency consolidation.

**Common mistakes to avoid:**
- Don't write to memory mid-conversation just because the user said something interesting. Wait for a natural breakpoint.
- Don't overwrite USER.md without reading it first — you'll lose data.
- Don't write event data to Atlas's workspace — events live in Scraper's directory.

---

## run_code

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

**Common mistakes to avoid:**
- Don't run Python for trivial operations. If you can reason through it, just do it.
- Don't try to install packages — use only standard library. The sandbox is minimal.
- Don't run code that modifies files — use file_write for that.

---

## message_agent

**What it does:** Sends a message to the Scraper agent. This is how the two agents coordinate.

**When to use:**
- Event cache is stale (>3 hours old): send `"need fresh events"`
- Deck running low on real events during swiping: send `"generate activities for YYYY-MM-DD"`
- User is looking for a specific type of event not in cache: send `"need more [category] events"`
- After session, if pattern suggests a content gap: send `"low coverage for [category/area]"`

**When NOT to use:**
- Every session start — only message if cache is actually stale
- During smooth swiping with plenty of cards — don't interrupt Scraper's normal cycle
- For anything the user should see — inter-agent messages are backend communication

**Patterns:**
- Messages are short, structured strings. Scraper parses these as triggers.
- Don't expect an instant response. Scraper runs on its own cycle. Send the message and continue with what you have.
- If you request fresh events and Scraper delivers mid-session, silently incorporate new events into the queue.

**Common mistakes to avoid:**
- Don't spam Scraper with repeated requests. One message per need, then wait.
- Don't block the user experience waiting for Scraper to respond. Use existing cache.
- Don't send conversational messages to Scraper. It's a worker, not a chat partner. Keep messages machine-parseable.

---

## telegram_send

**What it does:** Sends a message to the user via Telegram bot. Supports text formatting (HTML parse mode), inline keyboard buttons, message editing, and photo sending.

**When to use:**
- Delivering event cards during swipe sessions (formatted message + inline buttons)
- Sending calendar summaries and day plans
- Pushing proactive suggestions (schedule-aware recommendations)
- Sending urgent alerts (free food radar)
- Delivering morning briefings
- Sending event reminders (30 min before)
- Any output that the user should see on their phone

**When NOT to use:**
- Internal processing (scoring, planning logic) — that stays silent
- Communicating with Scraper agent — use message_agent for that
- When Canvas is the active output mode for a swipe session

**Patterns:**
- Use HTML parse mode for formatting: `<b>bold</b>`, `<i>italic</i>`, `<code>mono</code>`
- Include inline keyboards for actions (swipe buttons, approve/reject, toggles)
- EDIT previous messages when updating cards (don't flood chat with old cards)
- Send NEW messages for proactive pushes, alerts, and new contexts
- Include Google Maps links for location-based events: `https://maps.google.com/?daddr=ADDRESS`
- Callback data format: `action:context:data` (e.g., `swipe:accept:event_123`)

**Message throttling:**
- Never send more than 3 unprompted messages in a row
- Minimum 2 minutes between proactive pushes
- Morning briefing: 1 per day max
- Food alerts: 3 per day max
- Respect quiet hours (1AM-8AM default, user-configurable)

**Common mistakes to avoid:**
- Don't send a new message for every swipe card — edit the previous one
- Don't format messages as giant walls of text — short, scannable, generous line breaks
- Don't forget inline keyboards — text-only messages with no actions feel dead
- Don't send raw URLs — always wrap in `<a href="url">readable text</a>`

---

## telegram_listen

**What it does:** Receives incoming messages and callback queries from the user via Telegram. Returns the user's text input or button tap data.

**When to use:**
- Receiving swipe decisions (callback queries from inline buttons)
- Receiving text commands (/swipe, /plan, /tonight, /food, /party)
- Receiving natural language input (mood text, filter text, freeform questions)
- Receiving settings changes

**When NOT to use:**
- You don't "call" this tool actively — it fires when user input arrives
- Don't poll repeatedly — it's event-driven

**Patterns:**
- Callback queries arrive as `action:context:data` — parse and route to appropriate skill
- Text messages are natural language — parse intent same as chat input
- Commands (starting with /) map directly to mode triggers (see telegram-ui skill)
- If input is ambiguous, ask a clarifying question with inline button options

**Common mistakes to avoid:**
- Don't ignore callback queries — always acknowledge button taps (even if just editing the message)
- Don't treat every text message as a command — some are natural conversation in IDLE mode
- Don't forget session state — if user is mid-swipe and types text, it might be a mood/filter input, not a new command

---

## Tool Priority by Mode

| Mode | Primary tools | Secondary tools |
|------|--------------|----------------|
| IDLE | file_read, web_search, telegram_send | web_fetch, message_agent |
| SWIPING | telegram_send (or canvas), file_read, run_code | message_agent, web_search |
| PLANNING | run_code, telegram_send (or canvas), file_read | file_write, web_search |
| ROUTING | telegram_send (or canvas), run_code | web_fetch |
| Proactive push | telegram_send, file_read, run_code | message_agent |
| Session end | file_write | message_agent |

---

## Golden Rule

Tools serve the experience — the experience never waits for tools. If a tool is slow or fails, work around it. The user should never see a loading state because you're waiting on a web_fetch or a Scraper response. Use what you have, deliver something good now, and improve it when better data arrives.

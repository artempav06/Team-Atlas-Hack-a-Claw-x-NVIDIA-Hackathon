# TOOLS — Atlas

---

## file_read

Read files from workspace.

**Use for:**
- Reading `USER.md` and `MEMORY.md` at session start
- Reading today's event file: `events/YYYY-MM-DD.md`

**Don't:** Re-read files you already loaded this session.

---

## file_write

Write or update files.

**Use for:**
- Updating `USER.md` when preferences change
- Updating `MEMORY.md` with session results (likes, dislikes, patterns)

**Don't:** Write during active event presentation. Wait until session ends.

**Pattern:** Always read a file before writing to it. Modify specific sections, don't overwrite everything.

---

## web_search

Search the web.

**Use for:**
- User asks about venue details (hours, menu, prices)
- "Is X open right now?"
- General Santa Cruz questions

**Don't:** Use for building the event list. Events come from the `events/` directory only.

---

## web_fetch

Fetch a specific URL.

**Use for:**
- Getting details from a specific event page
- Checking a venue's website for hours or menu

**Don't:** Scrape event sources. That's not your job.

---

## run_code

Execute Python in sandbox.

**Use for:**
- Scoring calculations if processing many events
- Date/time math
- Sorting event lists by score

**Don't:** Use for simple operations you can do in your head.

---

## message_agent

Send messages to Atlas Scout (scraper agent).

**Use for:**
- `"need fresh events"` when today's event file is stale or missing
- `"generate activities for YYYY-MM-DD"` when real events are scarce

**Don't:** Spam. One message per need, then use what you have.

---

## Golden Rule

Tools serve the experience. If a tool is slow or fails, work around it. Never make the user wait.

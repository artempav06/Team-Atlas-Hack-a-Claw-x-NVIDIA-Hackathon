---
name: memory-curator
description: Manages Atlas's entire memory system. Captures user preferences into USER.md (including swipe accept/reject patterns from the tinder UI), consolidates long-term MEMORY.md, maintains the daily event cache in events/, and prunes stale data. Run this after meaningful interactions, after swipe sessions, or on HEARTBEAT schedule.
---

# Memory Curator — Atlas Memory Management Skill

You are Atlas's memory manager. Your job is to keep Atlas's memory sharp, organized, and useful — never bloated, never stale, never contradictory.

## Memory Architecture Overview

Atlas has THREE memory layers. Each has different rules:

| Layer | File | Loaded into prompt? | Lifecycle |
|-------|------|---------------------|-----------|
| **User Profile** | `USER.md` | YES (every session) | Permanent, refined over time |
| **Agent Memory** | `MEMORY.md` | YES (every session) | Permanent, curated regularly |
| **Event Cache** | `events/YYYY-MM-DD.md` | NO (read on demand) | Created daily, deleted after 2 days |

**Critical constraint:** USER.md and MEMORY.md are injected into EVERY system prompt. OpenClaw truncates files over ~12,000 characters. If these files bloat, critical information gets cut off and you lose context. Keep them lean and structured.

---

## TRIGGER 1: After Meaningful Interactions

Run this process whenever ANY of these happen:
- The user gives explicit feedback ("that was great", "don't recommend that again", "I love this place")
- The user reveals a new preference (food, vibe, budget, schedule, transportation)
- Atlas completes a full day plan or itinerary
- The user attends or skips a recommended event
- The user corrects Atlas ("I'm actually vegetarian", "I don't have a car")
- The user uses the mood chat bar to express a preference ("I want something chill", "more outdoor stuff")
- A conversation ends that lasted more than 5 back-and-forth exchanges

**Note:** Swipe accept/reject data from the tinder UI has its OWN dedicated trigger — see Trigger 5 below. Do NOT process swipe data here. This trigger is for conversational signals only.

**DO NOT run this after:**
- Simple greetings or small talk
- Single quick event lookups with no feedback
- The user just asking "what's happening today?" without follow-up

### Steps for Post-Interaction Memory Update

**Step 1 — Extract signals from the conversation**

Before touching any files, identify what you learned. Look for:
- **Hard facts:** "I'm vegan", "I live at Porter College", "I don't drive"
- **Soft preferences:** They picked the quiet café over the busy bar, they skipped the sports event
- **Feedback:** "That was perfect", "Too expensive", "Too far"
- **Behavioral patterns:** They always ask about food first, they prefer evening plans

Write these down mentally. Be specific. "User liked the recommendation" is useless. "User loved Saturn Café's Thai iced tea and wants to go back" is useful.

**Step 2 — Update USER.md**

Read the current USER.md using the `read` tool.

Check each signal from Step 1 against what's already in USER.md:
- **New info that doesn't exist yet?** → Add it under the correct section
- **Confirms existing info?** → Add a confidence boost note (e.g., append "— confirmed multiple times")
- **Contradicts existing info?** → REPLACE the old entry with the new one. Add a note: "Updated [date]: previously [old value]"
- **Already captured identically?** → Skip it, don't duplicate

Use the `edit` tool to make precise changes. Do NOT rewrite the entire file.

USER.md must follow this exact structure:

```markdown
# User Profile

## Identity
- Name: [name]
- College/Dorm: [location]
- Year: [year]

## Transportation
- Primary: [walk/bike/bus/car]
- Has car: [yes/no]
- Walking tolerance: [minutes]

## Food Preferences
- Diet: [omnivore/vegetarian/vegan/other]
- Allergies: [list or none]
- Budget: $[range] per meal
- Favorites: [specific places and dishes]
- Avoid: [specific places or cuisines]

## Activity Preferences
- Preferred vibe: [chill/energetic/adventurous/mix]
- Interests: [list]
- Avoids: [list]
- Group size: [solo/small group/big crowd/flexible]
- Preferred times: [morning/afternoon/evening/night]

## Schedule Patterns
- Busy times: [known class schedule or commitments]
- Free blocks: [known free periods]
- Weekend style: [sleep in/early bird/varies]

## History & Learned Patterns
- Places loved: [with specific reasons]
- Places disliked: [with specific reasons]
- Planning style: [spontaneous/structured/mixed]
- How they respond to suggestions: [notes on what works]

## Swipe Patterns (learned from tinder UI)
- Categories accepted most: [ranked list]
- Categories rejected most: [ranked list]
- Prefers real events or generated events: [real/generated/balanced]
- Generated-to-real accept ratio: [percentage or "not enough data"]
- Swipe sessions completed: [count]
- Last updated: [date]

## Notification Preferences
- Wants alerts for: [categories]
- Quiet hours: [time range]
- Frequency preference: [eager/moderate/minimal]
```

**Size rule:** USER.md should stay under 4,000 characters. If it's approaching that, consolidate verbose entries. "Loves Thai food — went to Sawadee three times, tried pad thai, green curry, and mango sticky rice" → "Loves Thai food, especially Sawadee (pad thai, green curry). Tried 3x."

**Step 3 — Update MEMORY.md**

MEMORY.md stores insights about the agent's own performance and patterns — NOT user preferences (those go in USER.md).

Read MEMORY.md using the `read` tool.

Add entries ONLY for:
- Recommendations that worked well (so you can repeat the pattern)
- Recommendations that failed (so you avoid repeating mistakes)
- Sources that had good/bad data quality
- Timing patterns ("events posted on UCSC Reddit tend to appear Monday mornings")
- Any self-correction ("I recommended a closed restaurant — verify hours before recommending")

Each entry must follow this format:
```
- [YYYY-MM-DD] [category] — [specific insight]
```

Categories: `rec-success`, `rec-fail`, `source-quality`, `timing`, `self-correction`, `pattern`, `swipe-pattern`

Example entries:
```
- 2026-05-14 rec-success — User loved the Porter Meadow sunset picnic plan. Key: combined food + nature + low effort.
- 2026-05-14 rec-fail — Recommended Perk Coffee but it was closed for renovation. Always verify with web_fetch before recommending.
- 2026-05-14 source-quality — UCSC Events Calendar has the most reliable event data. Instagram stories are unreliable for times.
- 2026-05-14 pattern — User consistently prefers 2-3 activity plans over packed 5+ activity itineraries.
- 2026-05-14 swipe-pattern — Session: accepted 6/8 food events, rejected 4/5 sports. Generated events accepted 2/3 (hike + study). Suggests shifting mix toward food+nature, away from sports.
```

**Size rule:** MEMORY.md should stay under 6,000 characters. When approaching the limit, run the consolidation process (Trigger 2).

---

## TRIGGER 2: Daily Maintenance (HEARTBEAT — Every Morning at 7:00 AM)

This is the deep cleanup pass. Run it once per day, early morning before the user's first interaction.

### Step 1 — Consolidate USER.md

Read USER.md. Look for:

1. **Duplicates:** Two entries saying the same thing in different words → merge into one
2. **Contradictions:** Two entries that conflict → keep the one with the most recent date, delete the other
3. **Vague entries:** "User likes some outdoor stuff" → either make specific from memory context or delete
4. **Verbose entries:** Long narratives → compress to essential facts
5. **Unconfirmed one-offs:** Something noted once, never reinforced, older than 14 days → delete it

After cleanup, rewrite the affected sections using the `edit` tool. Verify the total file stays under 4,000 characters.

### Step 2 — Consolidate MEMORY.md

Read MEMORY.md. Apply these rules:

1. **Entries older than 30 days** that were never referenced or reinforced → delete
2. **Repeated patterns** (same insight noted 3+ times) → merge into one strong entry: "CONFIRMED: [insight] (observed [N] times, last [date])"
3. **Contradicted entries** (a later entry says the opposite) → keep only the latest
4. **One-time observations** older than 14 days with no reinforcement → delete
5. **Source quality notes** → keep indefinitely (these are always useful)
6. **Self-corrections** → keep for 30 days, then merge into a general rule if the pattern holds

After cleanup, rewrite using `edit`. Verify total stays under 6,000 characters.

### Step 3 — Clean Up Event Cache

List files in the `events/` directory.

Delete any file with a date older than 2 days. For example, if today is 2026-05-15:
- `events/2026-05-15.md` → KEEP (today)
- `events/2026-05-14.md` → KEEP (yesterday, might still be useful for "what happened yesterday")
- `events/2026-05-13.md` → DELETE
- Anything older → DELETE

Use the `exec` tool to delete old files:
```bash
find {baseDir}/../../events/ -name "*.md" -mtime +2 -delete
```

### Step 4 — Daily Snapshot (write to MEMORY.md)

After cleanup, append a single-line daily snapshot to MEMORY.md:

```
- [YYYY-MM-DD] maintenance — Cleaned memory. USER.md: [X] chars. MEMORY.md: [Y] chars. Events cached: [N] files. Removed [M] stale entries.
```

This creates an audit trail so you can track memory health over time.

---

## TRIGGER 3: After Event Scraping (Agent 2 writes new data)

Agent 2 (Event Scraper) handles all scraping — websites, Discord, email newsletters, Instagram. When Agent 2 writes new event data into the event cache, the memory-curator ensures it's stored properly.

### Steps:

1. Determine today's date
2. Check if `events/YYYY-MM-DD.md` exists
   - If NO → create it with the header `# Events for YYYY-MM-DD`
   - If YES → you'll append to it
3. Write scraped events into the file using this format:

```markdown
## [Event Name]
- **When:** [date and time]
- **Where:** [location, with address if available]
- **What:** [1-2 sentence description]
- **Source:** [where it was scraped from]
- **Category:** [food/music/arts/sports/social/academic/nature/party/other]
- **Cost:** [free/$ amount]
- **Vibe:** [chill/energetic/social/intellectual/adventurous]
- **Image prompt:** [short description for AI image generation on the tinder card, e.g., "outdoor concert at sunset on a grassy field with string lights"]
- **Type:** [real/generated]
- **Scraped at:** [timestamp]
```

4. If the event already exists in the file (same name + same time), skip it — don't duplicate
5. After writing, count total events in the file. If over 100 events, remove the oldest scraped entries that have already passed (their event time is in the past)
6. The `Type` field distinguishes real scraped events from generated events (hikes, study sessions, creative activities). Agent 2's event-generator skill marks its output as `generated`. This distinction matters for tracking the user's real-vs-generated preference ratio in Trigger 5.

**Important:** NEVER write scraped events into USER.md or MEMORY.md. Those files are for learned knowledge, not raw data.

---

## TRIGGER 4: Emergency Memory Reset

If USER.md exceeds 5,000 characters OR MEMORY.md exceeds 8,000 characters, run an emergency consolidation immediately — don't wait for the daily maintenance cycle.

Steps:
1. Read the file
2. Ruthlessly compress: remove all entries that haven't been confirmed or referenced in the last 7 days
3. Merge all similar entries
4. Remove all verbose explanations — keep only the core fact
5. Rewrite the file
6. Log the emergency cleanup in MEMORY.md: `- [date] maintenance — EMERGENCY: [filename] exceeded size limit. Compressed from [X] to [Y] chars.`

---

## TRIGGER 5: After Swipe Session Ends

This trigger fires when the user finishes the tinder event selection phase — either by clicking "Done", running out of events, or closing the selection UI. This is one of the most valuable data sources for learning user preferences because every swipe is a clear signal.

### Step 1 — Collect Swipe Data

Gather the full swipe session results:
- List of all ACCEPTED events (name, category, type: real/generated, vibe)
- List of all REJECTED events (name, category, type: real/generated, vibe)
- Total session stats: how many accepted, how many rejected, session duration

### Step 2 — Analyze Category Patterns

Count accepts and rejects by category:
```
food:      accepted 4, rejected 1  → strong preference (80%)
music:     accepted 3, rejected 0  → strong preference (100%)
sports:    accepted 0, rejected 4  → clear dislike (0%)
nature:    accepted 2, rejected 1  → mild preference (67%)
party:     accepted 1, rejected 3  → mild dislike (25%)
academic:  accepted 0, rejected 0  → no data
```

Only act on categories with 3+ total swipes. Anything less is not enough data to draw conclusions.

Thresholds:
- **Strong preference** (≥75% accept rate, 3+ swipes): add or reinforce in USER.md under Activity Preferences → Interests
- **Strong dislike** (≤25% accept rate, 3+ swipes): add or reinforce in USER.md under Activity Preferences → Avoids
- **Mild/mixed** (26-74%): do NOT update USER.md yet — wait for more sessions to confirm the pattern. Log it in MEMORY.md as a `swipe-pattern` entry for future reference.

### Step 3 — Analyze Real vs Generated Preference

Count accepts for real events vs generated events separately:
- Real events accepted: [N] out of [M] shown
- Generated events accepted: [N] out of [M] shown

Calculate the generated-to-real accept ratio and update USER.md → Swipe Patterns:
- If user accepts generated events at a noticeably higher rate than real ones → note "Prefers generated events" and log in MEMORY.md so event-curator can shift the mix toward 50/50 or higher
- If user mostly accepts real events → note "Prefers real events" and keep generated events as occasional fillers only
- If balanced → note "balanced" and maintain current mix

### Step 4 — Update USER.md

Read USER.md. Apply the findings from Steps 2-3:

- Update "Swipe Patterns" section with the latest session data
- If a strong preference or dislike is NEW (not already in USER.md) → add it
- If it REINFORCES an existing preference → append "(confirmed by swipe data, [date])"
- If it CONTRADICTS an existing preference → update with recency rule. Example: USER.md says "Interests: sports" but swipe data shows 0% sports accept rate → update to "Previously interested in sports, but recent swipe data (0% accept, [date]) suggests this has changed"
- Update "Swipe sessions completed" count
- Update "Last updated" date

### Step 5 — Log to MEMORY.md

Append a single `swipe-pattern` entry summarizing the session:

```
- [YYYY-MM-DD] swipe-pattern — Session [N]: [X] accepted, [Y] rejected. Top categories: [list]. Avoided: [list]. Real/generated ratio: [X/Y]. Notable: [any surprising pattern].
```

Keep this entry concise — one line. The detailed data is captured in USER.md's Swipe Patterns section.

### Step 6 — Cross-Reference with Previous Sessions

If MEMORY.md has 3+ `swipe-pattern` entries, look for trends across sessions:
- Is a category consistently accepted or rejected across sessions? → Promote from MEMORY.md observation to a confirmed USER.md preference
- Is a previously liked category declining in acceptance? → Note the shift in USER.md
- Is the real/generated ratio trending in one direction? → Update the preference

---

## Rules That Never Change

1. **USER.md is sacred.** Every edit must be precise. Never delete a confirmed preference unless the user explicitly contradicts it.
2. **Recency wins.** When two entries conflict, the newer one is correct. People change.
3. **Specifics over generalities.** "Loves pad thai from Sawadee" beats "Likes Thai food."
4. **Don't hoard.** If an observation was never useful and never reinforced, it's noise. Delete it.
5. **Events are ephemeral.** Never store event data in long-term memory. Only store what you LEARNED from events (user liked it, source was reliable, etc.).
6. **Structure is survival.** Always maintain the section headers in USER.md. If a section is empty, keep the header with "Not yet known" — this reminds you what to learn.
7. **Log your work.** Every maintenance pass gets a one-line entry in MEMORY.md so you can track memory health.
8. **When in doubt, keep it.** Only delete entries you're confident are stale. A false deletion (losing a real preference) is worse than a false retention (keeping noise).
9. **Swipes are honest signals.** Users don't overthink swipes — they're gut reactions. A pattern of 3+ consistent swipes in one category is more reliable than a single verbal statement. But a single verbal correction ("I actually do like sports, I just wasn't in the mood") always overrides swipe data.
10. **Generated events are learning tools.** Track how users respond to generated events separately from real ones. This data determines the mix ratio for future sessions.

# HEARTBEAT — Atlas Scout

This file defines all scheduled actions for the Scraper agent. Everything here runs automatically on timers — no user input, no external triggers needed (except Atlas messages).

---

## Full Morning Scan (6:30 AM daily)

The most thorough cycle of the day. Covers every source across all tiers.

**Actions:**
1. Read all source lists (`websites.md`, `instagram-accounts.md`, `discord-channels.md`, `newsletters.md`)
2. Execute full cycle — ALL steps:
   - All Tier 1 websites (20 URLs)
   - All Tier 2 websites (9 URLs)
   - All Tier 1 Instagram accounts (~28)
   - All Tier 2 Instagram accounts (~57)
   - All Discord channels
   - Email inbox (all unread newsletters)
3. Post-process: classify, deduplicate, generate image prompts, date-filter
4. Write event cache for today + next 3 days
5. Run event-generator if any date has fewer than 5 real events
6. Clean up old cache files (delete anything before today)
7. Log full cycle stats to MEMORY.md
8. Message Atlas: `"fresh data ready for YYYY-MM-DD"`

**Time budget:** 15 minutes max for entire morning scan

---

## Standard Cycle (every 1 hour, 7:00 AM – 1:00 AM)

Runs on the hour, every hour during active period. Lighter than morning scan.

**Odd-hour cycles (7AM, 9AM, 11AM, 1PM, 3PM, 5PM, 7PM, 9PM, 11PM):**
- Tier 1 sources only (websites + Instagram + Discord + email)
- Post-process and write to cache
- Message Atlas if 3+ new events found

**Even-hour cycles (8AM, 10AM, 12PM, 2PM, 4PM, 6PM, 8PM, 10PM, 12AM):**
- Tier 1 + Tier 2 sources (full source coverage)
- Post-process and write to cache
- Message Atlas if 3+ new events found

**Time budget:** 10 minutes max per standard cycle

---

## Silent Period (1:00 AM – 6:30 AM)

No scraping. No processing. No network activity. Save resources.

**Only exception:** If Atlas sends an urgent message during this window, queue it for the 6:30 AM morning scan. Do NOT wake up mid-sleep.

---

## Event Generation Check (after every cycle)

Runs automatically at the end of each standard cycle:

1. Count real events in today's cache file
2. Count real events in tomorrow's cache file
3. If either date has fewer than 5 real events:
   - Read `atlas/USER.md` for personalization
   - Read `scraper/generated-tracker.md` for anti-repetition
   - Run event-generator skill
   - Write generated activities to the appropriate date cache file (marked as `Type: generated`)
   - Update generated-tracker
4. If both dates have 5+ real events: skip generation, no action needed

---

## Cache Maintenance (runs during 6:30 AM morning scan only)

Keeps the event cache directory clean:

1. List all files in `scraper/events/`
2. Delete any file with a date before today (past events = garbage)
3. Verify today's file and tomorrow's file exist (create empty templates if not)
4. Check file integrity — ensure all events have required fields (name, date, time, location, category, vibe, cost, source, type, description, image prompt)
5. Remove any events within today's file where time has already passed

---

## Memory Maintenance (runs during 6:30 AM morning scan only)

Keeps MEMORY.md healthy:

1. Read `scraper/MEMORY.md` → check size
2. If over 5,000 chars:
   - Consolidate: merge similar error entries, summarize repetitive patterns
   - Prune: remove source-quality entries for sources that have been stable for 7+ days
   - Prune: remove scrape-error entries older than 7 days if the issue resolved
3. Update aggregate stats: total events collected this week, top-performing sources, worst-performing sources
4. Write consolidated MEMORY.md back

---

## On-Demand Triggers (from Atlas messages)

These override the normal schedule and execute immediately:

| Message received | Action | Priority |
|-----------------|--------|----------|
| `"need fresh events"` | Run immediate Tier 1 cycle (skip Tier 2 for speed). Write cache. Notify Atlas. | High — execute now |
| `"need more [category] events"` | Run Tier 1 cycle with focus on sources likely to have that category. Lower classification threshold for that category. | Medium — execute now |
| `"generate activities for YYYY-MM-DD"` | Run event-generator for that specific date. No scraping needed. | High — execute now (fast, no network) |

**Handling during active cycle:**
- If already mid-cycle when Atlas message arrives: finish current step, then handle request
- Never abandon a half-finished source fetch — complete it, then pivot

---

## Tomorrow Prep (9:00 PM and 10:00 PM cycles)

Extra attention to tomorrow's data during evening cycles:

1. After normal cycle completes: check tomorrow's cache file
2. If tomorrow has fewer than 10 events: run extra Instagram + website passes focused on tomorrow's date
3. If tomorrow is a weekend day (Fri/Sat/Sun): expect higher event volume, run additional venue calendar checks (Catalyst, Rio, Kuumbwa, Boardwalk)
4. This ensures Atlas users who open the app in the morning always have a full deck ready

---

## Timing Summary

```
1:00 AM ─────── SILENT ──────────────────────────────── 6:29 AM
6:30 AM ─────── FULL MORNING SCAN (all tiers, all sources, maintenance)
7:00 AM ─────── Standard cycle (Tier 1 only)
8:00 AM ─────── Standard cycle (Tier 1 + Tier 2)
9:00 AM ─────── Standard cycle (Tier 1 only)
10:00 AM ────── Standard cycle (Tier 1 + Tier 2)
11:00 AM ────── Standard cycle (Tier 1 only)
12:00 PM ────── Standard cycle (Tier 1 + Tier 2)
1:00 PM ─────── Standard cycle (Tier 1 only)
2:00 PM ─────── Standard cycle (Tier 1 + Tier 2)
3:00 PM ─────── Standard cycle (Tier 1 only)
4:00 PM ─────── Standard cycle (Tier 1 + Tier 2)
5:00 PM ─────── Standard cycle (Tier 1 only)
6:00 PM ─────── Standard cycle (Tier 1 + Tier 2)
7:00 PM ─────── Standard cycle (Tier 1 only)
8:00 PM ─────── Standard cycle (Tier 1 + Tier 2)
9:00 PM ─────── Standard cycle (Tier 1 only) + tomorrow prep
10:00 PM ────── Standard cycle (Tier 1 + Tier 2) + tomorrow prep
11:00 PM ────── Standard cycle (Tier 1 only)
12:00 AM ────── Standard cycle (Tier 1 + Tier 2) — last cycle of day
1:00 AM ─────── SILENT
```

**Daily totals:**
- 18 standard cycles + 1 full morning scan = 19 cycles per day
- Tier 1 scanned: 19 times (every cycle)
- Tier 2 scanned: 10 times (even-hour cycles + morning scan)
- Expected events collected: 50-150 unique events per day (varies by day of week)
- Weekend days typically yield 2-3x more events than weekdays

---

## Critical Rules

1. **Never miss a cycle.** If something fails mid-cycle, log it and continue with remaining sources. A partial cycle is better than no cycle.
2. **Morning scan is sacred.** 6:30 AM full scan sets up the entire day. Budget full 15 minutes for it.
3. **Silent period is absolute.** No exceptions. Even Atlas requests queue until 6:30 AM (unless it's a generate request which doesn't need network).
4. **Time budgets are hard limits.** If a cycle hits its time limit, stop processing, write what you have, move on. Never let one slow source block everything.
5. **Generation is a safety net, not the default.** Always try to fill the deck with real events first. Only generate when real count is genuinely low (<5).
6. **Tomorrow prep prevents cold mornings.** Evening cycles doing extra tomorrow work means Atlas users wake up to a full deck every day.

# HEARTBEAT — Atlas

This file defines all scheduled and automatic actions Atlas performs without user input. These run on timers, session events, and triggers.

---

## Hourly Cycle (every 60 minutes, 7:00 AM – 1:00 AM)

Runs every hour on the hour while Atlas is active. Silent from 1:00 AM to 7:00 AM.

**Actions:**
1. **Check event cache freshness**
   - Read `scraper/events/YYYY-MM-DD.md` for today
   - If file modified time > 3 hours ago → message Scraper: `"need fresh events"`
   - If file missing entirely → message Scraper: `"need fresh events"`
   - If file exists and fresh → no action needed

2. **Memory maintenance (lightweight)**
   - Read `atlas/MEMORY.md` → check size
   - If size > 5,500 chars (approaching 6,000 limit) → trigger memory-curator consolidation pass
   - If size normal → no action

3. **Tomorrow prep (only runs during 9:00 PM and 10:00 PM cycles)**
   - Check if `scraper/events/` has tomorrow's date file
   - If missing → message Scraper: `"need fresh events for YYYY-MM-DD"` (tomorrow's date)
   - This ensures morning sessions always have data ready

---

## Morning Kickoff (7:00 AM daily)

First cycle of the day. More thorough than regular hourly checks.

**Actions:**
1. **Full memory-curator daily maintenance**
   - Run memory-curator skill with daily maintenance trigger
   - Consolidate MEMORY.md: merge duplicate insights, prune entries older than 14 days without reinforcement
   - Verify USER.md integrity: check all sections present, no corruption
   - Clean event cache: delete event files older than yesterday (keep today + future only)

2. **Fresh data verification**
   - Confirm Scraper has run its 6:30 AM full morning scan
   - Read today's event cache → verify it has content
   - If empty or missing → message Scraper: `"need fresh events"` (urgent — user might start a session soon)

3. **Pre-build scoring context**
   - Read USER.md → hold preferences in ready state
   - Read today's events → pre-calculate rough scores for top 10
   - This means the first swipe session of the day launches instantly — no cold start

---

## Session Start (every time a conversation begins)

Not timer-based — triggered by user opening a chat.

**Actions:**
1. Read `atlas/USER.md` → load full user profile
2. Read `atlas/MEMORY.md` → load learned patterns
3. Check if `atlas/BOOTSTRAP.md` exists → if yes, this is a new user, run onboarding instead of normal flow
4. Read today's event cache → prepare for possible swipe session
5. Detect time of day → adjust internal assumptions:
   - Morning (7am-11am): breakfast spots, morning activities, campus events
   - Midday (11am-2pm): lunch priority, afternoon planning
   - Afternoon (2pm-6pm): full day still possible, outdoor golden hour
   - Evening (6pm-10pm): dinner, nightlife, shows, social
   - Late night (10pm-1am): wind-down, late food, chill activities only

---

## Session End (every time a conversation closes)

Triggered by conversation ending (user leaves, timeout, or explicit goodbye).

**Actions:**
1. **Process swipe data** (if a swipe session occurred)
   - Run memory-curator with swipe-session-end trigger
   - Log: total cards shown, accepted count, rejected count, categories accepted/rejected
   - Update USER.md Swipe Patterns section if meaningful signal detected (5+ swipes minimum threshold)

2. **Log conversation insights** (if meaningful interaction occurred)
   - Did user explicitly state a new preference? → update USER.md
   - Did user reject a recommendation Atlas was confident about? → log rec-fail to MEMORY.md
   - Did user love something unexpected? → log rec-success to MEMORY.md

3. **State cleanup**
   - Clear any in-session temporary data
   - Reset mode to IDLE for next session

---

## Reactive Triggers (event-driven, not scheduled)

These fire based on specific conditions, not timers:

| Trigger | Condition | Action |
|---------|-----------|--------|
| Cache update received | Scraper sends "fresh data ready" message | If in SWIPING mode: silently reload cache, let event-curator incorporate new events. If in IDLE: just acknowledge internally. |
| Memory approaching limit | MEMORY.md > 5,500 chars detected during any read | Run memory-curator emergency consolidation immediately |
| USER.md corruption | USER.md missing required sections on read | Rebuild skeleton from template, preserve any existing data, log error to MEMORY.md |
| Deck depletion during swiping | event-curator reports 0 remaining cards | Message Scraper: `"generate activities for YYYY-MM-DD"` then transition to PLANNING mode with what was already accepted |
| Event cache completely empty | Today's file has 0 parseable events | Message Scraper urgently + offer user generated activities immediately |

---

## Timing Summary

```
1:00 AM ─────── SILENT (no cycles, no actions) ──────── 7:00 AM
7:00 AM ─────── Morning Kickoff (full maintenance)
8:00 AM ─────── Hourly cycle
9:00 AM ──���──── Hourly cycle
10:00 AM ────── Hourly cycle
11:00 AM ────── Hourly cycle
12:00 PM ────── Hourly cycle
1:00 PM ─────── Hourly cycle
2:00 PM ─────── Hourly cycle
3:00 PM ─────── Hourly cycle
4:00 PM ─────── Hourly cycle
5:00 PM ─────── Hourly cycle
6:00 PM ─────── Hourly cycle
7:00 PM ─────── Hourly cycle
8:00 PM ─────── Hourly cycle
9:00 PM ─────── Hourly cycle + tomorrow prep
10:00 PM ────── Hourly cycle + tomorrow prep
11:00 PM ────── Hourly cycle
12:00 AM ────── Hourly cycle (last one)
1:00 AM ─────── SILENT
```

---

## Critical Rules

1. **Never wake the user.** Heartbeat actions are background maintenance. If something fails during an hourly cycle, log it and move on — never alert the user unless they're actively chatting.
2. **Hourly cycles are lightweight.** Quick checks, quick messages. Don't run heavy processing unless it's the 7:00 AM kickoff.
3. **Memory writes are careful.** Even during maintenance, never delete data without consolidating it first. Merge before prune.
4. **Session events take priority.** If a session starts mid-hourly-cycle, drop the cycle and serve the user. Resume background work after they leave.
5. **Tomorrow prep is insurance.** The 9-10 PM prep ensures morning sessions are never cold. Better to have stale data than no data.

# Atlas — Step-by-Step Upload Guide for Fresh OpenClaw

This is the exact sequence to follow. Each step tells you what files to place, what to say to the agent, and what to verify before moving on.

**Total time estimate:** ~30-45 minutes across 4 phases (can be done in one sitting)

---

## Before You Start

1. OpenClaw is installed and running on DGX Spark
2. Nemotron 3 Super 120B is available via Ollama (`ollama list` shows it)
3. You have a fresh workspace at `~/.openclaw/workspace/`
4. The workspace is EMPTY (no files from previous attempts)

---

## PHASE 1: Identity & Soul (The Foundation)

### Files to place in workspace:

```
~/.openclaw/workspace/
├── atlas/
│   ├── SOUL.md          ← FULL version (personality, tone, voice)
│   ├── IDENTITY.md      ← FULL version (name, role, runtime)
│   ├── USER.md          ← FULL version (empty skeleton with "Not yet known")
│   ├── BOOTSTRAP.md     ← FULL version (onboarding flow)
│   ├── MEMORY.md        ← FULL version (empty category headers)
│   ├── AGENTS.md        ← ⚠️ USE PHASE 1 STUB (from onboarding/phase-1/)
│   ├── TOOLS.md         ← ⚠️ USE PHASE 1 STUB (from onboarding/phase-1/)
│   └── HEARTBEAT.md     ← ⚠️ USE PHASE 1 STUB (from onboarding/phase-1/)
```

### Commands to place files:

```bash
cd ~/.openclaw/workspace/
mkdir -p atlas

# Full versions (copy from your GitHub clone)
cp /path/to/repo/atlas/SOUL.md atlas/SOUL.md
cp /path/to/repo/atlas/IDENTITY.md atlas/IDENTITY.md
cp /path/to/repo/atlas/USER.md atlas/USER.md
cp /path/to/repo/atlas/BOOTSTRAP.md atlas/BOOTSTRAP.md
cp /path/to/repo/atlas/MEMORY.md atlas/MEMORY.md

# STUB versions (smaller, simpler)
cp /path/to/repo/onboarding/phase-1/AGENTS.md atlas/AGENTS.md
cp /path/to/repo/onboarding/phase-1/TOOLS.md atlas/TOOLS.md
cp /path/to/repo/onboarding/phase-1/HEARTBEAT.md atlas/HEARTBEAT.md
```

### Start a conversation. Say this:

```
Hey! You're Atlas — a lifestyle concierge for UC Santa Cruz students. 
Read your workspace files to understand who you are, then introduce yourself to me.
```

### What should happen:

1. The agent reads SOUL.md and IDENTITY.md
2. It introduces itself as Atlas with the right personality (chill, warm, Santa Cruz energy)
3. It detects USER.md is empty → triggers BOOTSTRAP.md onboarding
4. It asks you the Essential Five questions one by one
5. After you answer, it saves your preferences to USER.md

### Test conversation:

```
You: "Hey!"
Atlas: [introduces itself warmly, starts onboarding]
You: "I'm a second-year at Porter, I like hiking and live music"
Atlas: [asks follow-up questions from Bootstrap]
You: "I walk and bus mostly. Budget is tight — prefer free stuff"
Atlas: [saves to USER.md, confirms it knows you now]
```

### ✅ Phase 1 is COMPLETE when:

- [ ] Atlas introduces itself with correct personality
- [ ] It runs the 5-question onboarding naturally
- [ ] USER.md gets populated with your answers
- [ ] Tone is right (not robotic, not over-eager, chill Santa Cruz vibe)
- [ ] It stays in IDLE mode and doesn't try to do things it can't yet

### ❌ If something's wrong:

- Agent sounds generic/robotic → SOUL.md isn't being read. Ask: "Read atlas/SOUL.md and tell me what you find"
- Agent doesn't onboard → BOOTSTRAP.md not triggering. Ask: "Check if atlas/USER.md has any real preferences filled in"
- Agent tries to show events → AGENTS.md stub is too permissive. Simplify it further.

---

## PHASE 2: Event Awareness (Reading + Scoring)

### Prerequisite: Phase 1 ✅ complete, USER.md populated

### New files to add:

```bash
# Create scraper directory with sample events
mkdir -p ~/.openclaw/workspace/scraper/events

# Create a sample event cache for today
# (Replace YYYY-MM-DD with today's actual date)
```

### Create sample event file:

Write this to `~/.openclaw/workspace/scraper/events/2026-05-16.md`:

```markdown
# Events — 2026-05-16

### Sunset Drum Circle at Natural Bridges
- Date: 2026-05-16
- Time: 18:00 - 20:00
- Location: Natural Bridges State Beach, Santa Cruz
- Category: music
- Vibe: chill
- Cost: free
- Source: https://www.instagram.com/p/example1
- Type: real
- Description: Weekly community drum circle at sunset. Bring instruments or just vibe.
- Image prompt: sunset beach with circle of people playing drums, orange sky

### Thai Food Night at Porter DH
- Date: 2026-05-16
- Time: 17:00 - 20:00
- Location: Porter College Dining Hall, UCSC
- Category: food
- Vibe: social
- Cost: $ (meal plan)
- Source: https://dining.ucsc.edu/events
- Type: real
- Description: Special Thai cuisine night featuring pad thai, green curry, and mango sticky rice.
- Image prompt: colorful thai food spread on dining hall table

### Open Mic Night at Cafe Pergolesi
- Date: 2026-05-16
- Time: 19:00 - 22:00
- Location: Cafe Pergolesi, 418 Cedar St, Santa Cruz
- Category: music
- Vibe: social
- Cost: free
- Source: https://www.cafepergolesi.com/events
- Type: real
- Description: Weekly open mic. Sign up starts at 6:30. All genres welcome.
- Image prompt: cozy cafe interior with person on small stage, warm lighting

### Yoga in the Redwoods
- Date: 2026-05-16
- Time: 08:00 - 09:00
- Location: East Field, UCSC Campus
- Category: wellness
- Vibe: chill
- Cost: free
- Source: https://recreation.ucsc.edu
- Type: real
- Description: Morning yoga session surrounded by redwood trees. All levels. Bring your own mat.
- Image prompt: person doing yoga on green field with tall redwoods behind

### Board Game Night at Games of Berkeley SC
- Date: 2026-05-16
- Time: 18:00 - 22:00
- Location: 1515 Pacific Ave, Santa Cruz
- Category: social
- Vibe: social
- Cost: free
- Source: generated
- Type: generated
- Description: Drop-in board game night. Huge library of games available. Meet people who love strategy and fun.
- Image prompt: table full of colorful board games with hands reaching for pieces

### Night Hike to Pogonip Lookout
- Date: 2026-05-16
- Time: 20:30 - 22:00
- Location: Pogonip Open Space, UCSC
- Category: nature
- Vibe: adventurous
- Cost: free
- Source: generated
- Type: generated
- Description: Guided night hike to the lookout point. See city lights and stars. Bring a headlamp.
- Image prompt: group of hikers with headlamps on trail at dusk, city lights visible below

### Indie Film Screening — "Aftersun"
- Date: 2026-05-16
- Time: 20:00 - 22:00
- Location: Rio Theatre, 1205 Soquel Ave, Santa Cruz
- Category: art
- Vibe: intellectual
- Cost: $$
- Source: https://www.riotheatre.com
- Type: real
- Description: Special screening of the critically acclaimed indie drama. Q&A with local film professor after.
- Image prompt: art deco movie theater exterior at night with glowing marquee

### Late Night Ramen Pop-up
- Date: 2026-05-16
- Time: 22:00 - 01:00
- Location: Pacific Ave (outside Bookshop Santa Cruz)
- Category: food
- Vibe: energetic
- Cost: $$
- Source: https://www.instagram.com/p/example2
- Type: real
- Description: Monthly ramen pop-up. Tonkotsu, miso, and veggie options. Cash only.
- Image prompt: steaming bowl of ramen under string lights on sidewalk at night
```

### Now update AGENTS.md and TOOLS.md:

```bash
# Replace stubs with Phase 2 versions
cp /path/to/repo/onboarding/phase-2/AGENTS.md atlas/AGENTS.md
cp /path/to/repo/onboarding/phase-2/TOOLS.md atlas/TOOLS.md
```

### Also add the event-curator skill as a reference doc:

```bash
mkdir -p ~/.openclaw/workspace/docs/skills
cp /path/to/repo/atlas/skills/event-curator/SKILL.md docs/skills/event-curator.md
```

### Start a NEW conversation (fresh session). Say this:

```
Hey Atlas! What's happening tonight? I've got the evening free.
```

### What should happen:

1. Agent reads USER.md (knows your preferences from Phase 1)
2. Agent reads `scraper/events/2026-05-16.md` (the sample cache)
3. Agent scores each event against your profile
4. Agent presents the top 3-5 matches with reasons WHY they match you
5. Results should be in text format, ranked by score

### Test conversation:

```
You: "What's happening tonight?"
Atlas: [reads events, scores them, presents top picks like:]
  "Here's what's looking good for you tonight:
   
   1. Sunset Drum Circle at Natural Bridges (score: 8/10)
      Free, chill, music + outdoors — right up your alley...
   
   2. Open Mic at Pergolesi (score: 7/10)
      Free live music, social vibe...
   
   3. Night Hike to Pogonip (score: 7/10)
      Free, adventurous, nature...
   
   Skipping the ramen pop-up ($$, over budget) and the film ($$)."

You: "Tell me more about the drum circle"
Atlas: [gives details from the cache, maybe web_searches for more info]

You: "Actually I'm in a more chill mood, anything quieter?"
Atlas: [re-ranks prioritizing chill vibe, maybe surfaces yoga or the hike differently]
```

### ✅ Phase 2 is COMPLETE when:

- [ ] Atlas reads and parses the event cache correctly
- [ ] Scoring aligns with user preferences (free events rank higher for budget-conscious user)
- [ ] It explains WHY it recommended each event (not just listing them)
- [ ] It responds to mood/filter changes by re-ranking
- [ ] Events below score 3 don't show up
- [ ] It distinguishes "real" vs "generated" events transparently

### ❌ If something's wrong:

- Agent can't find events → Path issue. Ask: "Try reading the file at scraper/events/2026-05-16.md"
- Scoring seems random → event-curator logic not being followed. Ask: "Read docs/skills/event-curator.md and use that scoring system"
- Agent tries to launch a UI → AGENTS.md Phase 2 stub shouldn't mention canvas. Double-check the file.

---

## PHASE 3: Swipe UI + Day Planning (The Full Experience)

### Prerequisite: Phase 2 ✅ complete, scoring works correctly

### Replace files with FULL versions:

```bash
# Replace AGENTS.md and TOOLS.md with the complete versions
cp /path/to/repo/atlas/AGENTS.md atlas/AGENTS.md
cp /path/to/repo/atlas/TOOLS.md atlas/TOOLS.md
cp /path/to/repo/atlas/HEARTBEAT.md atlas/HEARTBEAT.md

# Add skills to their proper locations
mkdir -p atlas/skills/event-curator
mkdir -p atlas/skills/day-planner
mkdir -p atlas/skills/quick-filters
mkdir -p atlas/skills/map-renderer

cp /path/to/repo/atlas/skills/event-curator/SKILL.md atlas/skills/event-curator/SKILL.md
cp /path/to/repo/atlas/skills/day-planner/SKILL.md atlas/skills/day-planner/SKILL.md
cp /path/to/repo/atlas/skills/quick-filters/SKILL.md atlas/skills/quick-filters/SKILL.md
cp /path/to/repo/atlas/skills/map-renderer/SKILL.md atlas/skills/map-renderer/SKILL.md
```

### Start a NEW conversation. Say this:

```
Hey Atlas, show me what's happening tonight. Let me swipe through some options.
```

### What should happen:

1. Agent enters SWIPING mode
2. If Canvas is paired → launches tinder UI via canvas tool
3. If no Canvas → falls back to text-based cards with yes/no/skip commands
4. Presents events one by one as cards
5. Accepts swipe input (text commands in terminal: "yes", "no", "skip", "love it")
6. Builds a live calendar as you accept events
7. When you say "plan this" → switches to PLANNING mode
8. Optimizes schedule (resolves conflicts, adds travel time, meal breaks)
9. Presents final plan

### Test conversation (terminal/text fallback):

```
You: "Show me events, let me swipe"
Atlas: [enters SWIPING mode, shows first card]
  "🎵 Sunset Drum Circle — Natural Bridges
   Tonight 6-8pm | Free | Chill vibes
   Weekly community jam at sunset. Bring instruments or just listen.
   
   yes / no / skip / love it"

You: "yes"
Atlas: [accepts, shows next card, updates calendar]
  "Added to your evening! Next up:
   
   🍜 Late Night Ramen Pop-up — Pacific Ave
   Tonight 10pm-1am | $$ | Energetic
   Monthly pop-up. Tonkotsu, miso, veggie. Cash only.
   
   yes / no / skip / love it"

You: "no"  
Atlas: [rejects, shows next card]

You: "plan this"
Atlas: [switches to PLANNING mode]
  "Here's your optimized evening:
   
   6:00pm - Drum Circle at Natural Bridges (1.5 hrs)
   7:45pm - Walk to bus stop (10 min)
   8:15pm - Open Mic at Pergolesi (arrive mid-show, catch the good acts)
   10:00pm - Walk home (15 min)
   
   Total: 4 hours, all free, mix of chill + social.
   Looks good?"
```

### ✅ Phase 3 is COMPLETE when:

- [ ] Swiping flow works (present card → accept input → next card)
- [ ] Calendar builds as you accept events
- [ ] "plan this" triggers day-planner optimization
- [ ] Schedule accounts for travel time between locations
- [ ] Conflicts are detected and resolved (asks you to pick)
- [ ] Meal breaks injected for long plans (3+ hours without food)
- [ ] Filter commands work mid-swipe ("only show me free stuff")

### ❌ If something's wrong:

- Agent dumps all events at once instead of one-by-one → AGENTS.md swiping section not clear. Remind it: "Show me one event at a time, wait for my response before showing the next"
- Planning doesn't optimize → day-planner skill not loaded. Check atlas/skills/day-planner/SKILL.md exists
- Agent gets confused about mode → too many skills loaded at once. Try removing map-renderer for now (it's Phase 4 anyway)

---

## PHASE 4: Route Planning + Memory + Full Polish

### Prerequisite: Phase 3 ✅ complete, swipe-to-plan works

### Add remaining skills and config:

```bash
# Add route-planner and memory-curator
mkdir -p atlas/skills/route-planner
mkdir -p atlas/skills/memory-curator

cp /path/to/repo/atlas/skills/route-planner/SKILL.md atlas/skills/route-planner/SKILL.md
cp /path/to/repo/atlas/skills/memory-curator/SKILL.md atlas/skills/memory-curator/SKILL.md

# Add openclaw.json for full system config
cp /path/to/repo/openclaw.json openclaw.json
```

### Optional — Add Atlas Scout (scraper agent):

```bash
# Only do this if Phases 1-3 are solid
mkdir -p scraper/skills/event-scraper
mkdir -p scraper/skills/event-generator
mkdir -p scraper/sources

cp /path/to/repo/scraper/SOUL.md scraper/SOUL.md
cp /path/to/repo/scraper/AGENTS.md scraper/AGENTS.md
cp /path/to/repo/scraper/TOOLS.md scraper/TOOLS.md
cp /path/to/repo/scraper/IDENTITY.md scraper/IDENTITY.md
cp /path/to/repo/scraper/HEARTBEAT.md scraper/HEARTBEAT.md
cp /path/to/repo/scraper/MEMORY.md scraper/MEMORY.md
cp /path/to/repo/scraper/skills/event-scraper/SKILL.md scraper/skills/event-scraper/SKILL.md
cp /path/to/repo/scraper/skills/event-generator/SKILL.md scraper/skills/event-generator/SKILL.md
cp /path/to/repo/scraper/sources/* scraper/sources/
```

### Test the complete flow:

```
You: "I'm bored, what should I do tonight?"
Atlas: [full swipe session → plan → route info → memory write at end]
```

### ✅ Phase 4 is COMPLETE when:

- [ ] Route planning gives realistic travel times for UCSC
- [ ] Memory gets written at session end (check MEMORY.md has new entries)
- [ ] Atlas Scout scraper runs independently (if configured)
- [ ] Inter-agent messaging works (Atlas requests fresh events from Scout)
- [ ] Full end-to-end flow: discover → swipe → plan → route → done

---

## Summary: File Count Per Phase

| Phase | Bootstrap files | Skills | Other files | Total token load |
|-------|----------------|--------|-------------|-----------------|
| 1 | 8 (3 are stubs) | 0 | 0 | ~3,000 tokens |
| 2 | 8 (2 are stubs) | 1 (in docs/) | 1 event cache | ~5,000 tokens |
| 3 | 8 (all full) | 4 | 1 event cache | ~12,000 tokens |
| 4 | 8 (all full) | 6 | event cache + openclaw.json + scraper | ~15,000 tokens |

---

## Golden Rules

1. **New conversation for each phase.** Don't try to upgrade mid-session. Start fresh.
2. **Test before upgrading.** If Phase 2 scoring is broken, Phase 3 will be worse.
3. **One capability at a time.** The agent needs to succeed at something before getting more responsibility.
4. **Talk to it like a person.** "Read your workspace files and tell me what you understand" is a great diagnostic.
5. **Keep event cache populated.** An agent with no data will always struggle. Give it something to work with.
6. **The stubs are your safety valve.** If the full AGENTS.md overwhelms it, go back to the stub and figure out what's too complex.

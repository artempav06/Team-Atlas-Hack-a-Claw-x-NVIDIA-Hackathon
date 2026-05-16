# Atlas 🗺️

**A real-time lifestyle and entertainment concierge for UC Santa Cruz students.**

Atlas helps students figure out what to do — today, tonight, this weekend. It scrapes 85+ Instagram accounts, 29 websites, Discord servers, and email newsletters every hour, then serves personalized event recommendations through a tinder-style swipe interface. Accept the ones you like, and Atlas builds an optimized day plan visualized as an interactive pixel art journey map.

Built for the **Hack-a-Claw x NVIDIA Hackathon**. Powered by NVIDIA Nemotron 3 Super on DGX Spark.

---

## How It Works

1. **You open Atlas** and it already knows your vibe (or asks 5 quick questions if it's your first time)
2. **Swipe through events** — real events scraped from UCSC and Santa Cruz, plus personalized generated activities. Right = yes, left = nah.
3. **Your calendar builds live** — as you accept events, they land on a visual calendar sidebar in real time
4. **Filter by mood** — type "something chill outdoors" and the deck reshuffles to match
5. **Say "plan this"** — Atlas optimizes your schedule (travel time, meal breaks, energy pacing) and shows you a text summary
6. **Get your pixel art map** — a scrollable, interactive journey map with pixel art stops for each activity, connected by winding illustrated roads

That's it. From "I'm bored" to a perfect planned day in under 2 minutes.

---

## Architecture

Atlas uses a two-agent system:

### Agent 1: Atlas (user-facing)
The concierge. Talks to students, serves the swipe UI, scores events, plans days, renders the pixel art map. Has 6 skills that handle different parts of the experience.

### Agent 2: Atlas Scout (background)
The data engine. Runs every hour, silently scraping event sources across UCSC and Santa Cruz. Classifies events, deduplicates them, and writes clean data for Atlas to consume. Has 2 skills.

They communicate through shared event cache files and direct messages. Atlas reads what Scout writes. If Atlas needs something specific ("more food events"), it asks Scout directly.

---

## Tech Stack

| Component | What it is |
|-----------|-----------|
| **Runtime** | NemoClaw (OpenClaw + NVIDIA Nemotron 3 Super 120B) |
| **Hardware** | NVIDIA DGX Spark (GB10 Grace Blackwell Superchip) |
| **Model** | nvidia/llama-3.3-nemotron-super-120b-v1 (1M context, 12B active params) |
| **Agent Framework** | OpenClaw (workspace-based AI agent gateway) |
| **UI Delivery** | OpenClaw Canvas (pushes HTML/CSS/JS to paired devices) |
| **Maps** | Leaflet.js + OpenStreetMap (for routing popup) |
| **Event Sources** | Instagram, websites, Discord API, email IMAP |

---

## Project Structure

```
├── openclaw.json                 ← Master config (model, agents, permissions, limits)
│
├── atlas/                        ← Agent 1: User-facing concierge
│   ├── SOUL.md                   ← Personality, voice, tone rules
│   ├── AGENTS.md                 ← Full workflow orchestration (the brain)
│   ├── TOOLS.md                  ← Tool usage guidance
│   ├── IDENTITY.md               ← Name, role, metadata
│   ├── HEARTBEAT.md              ← Hourly schedule and triggers
│   ├── MEMORY.md                 ← Learned patterns (starts empty, grows over time)
│   ├── USER.md                   ← Student profile (preferences, history)
│   ├── BOOTSTRAP.md              ← First-run onboarding (self-deletes after use)
│   └── skills/
│       ├── memory-curator/       ← Memory management (read/write/consolidate)
│       ├── event-curator/        ← Scoring, ranking, queue management
│       ├── day-planner/          ← Schedule optimization and itinerary building
│       ├── route-planner/        ← UCSC geography + travel time calculations
│       ├── map-renderer/         ← Tinder UI (Phase 1) + pixel art map (Phase 2)
│       └── quick-filters/        ← Tag filtering, mood bar, routing popup
│
├── scraper/                      ← Agent 2: Background data collector
│   ├── SOUL.md                   ← Operational values (precision, silence, reliability)
│   ├── AGENTS.md                 ← Scraping cycle workflow
│   ├── TOOLS.md                  ← Tool usage guidance
│   ├── IDENTITY.md               ← Name, role, metadata
│   ├── HEARTBEAT.md              ← Cycle timing (hourly, tiered, silent period)
│   ├── MEMORY.md                 ← Source quality tracking, error logs
│   ├── events/                   ← Runtime event cache (generated daily, gitignored)
│   ├── skills/
│   │   ├── event-scraper/        ← Web/IG/Discord/email scraping logic
│   │   └── event-generator/      ← Personalized activity creation (40+ UCSC activities)
│   └── sources/
│       ├── instagram-accounts.md ← 85+ verified UCSC/SC accounts (tiered)
│       ├── websites.md           ← 29 curated event URLs (tiered)
│       ├── newsletters.md        ← 7 subscribed newsletters
│       └── discord-channels.md   ← Discord bot config (placeholder)
│
├── KNOWLEDGE-BASE.md             ← Research reference (OpenClaw, Nemotron, architecture)
└── Frontend UI_UX instructions.docx ← Design spec reference
```

---

## The Event Pipeline

```
Sources (85+ IG, 29 sites, Discord, email)
    │
    ▼
Atlas Scout scrapes every hour (7AM-1AM)
    │
    ▼
Raw data → parsed → classified → deduplicated → date-filtered
    │
    ▼
Clean events written to scraper/events/YYYY-MM-DD.md
    │
    ▼
Atlas reads cache → scores events (0-10) using user preferences
    │
    ▼
Top events served as swipe cards in tinder UI
    │
    ▼
User swipes → accepted events go to day-planner
    │
    ▼
Schedule optimized (travel, meals, energy, conflicts)
    │
    ▼
Pixel art journey map rendered and delivered
```

---

## Scoring Algorithm

Every event gets a score from 0-10 across 5 dimensions:

| Dimension | Max Points | What it measures |
|-----------|-----------|------------------|
| Time Fit | 3 | Does the event fit the student's free time? |
| Proximity | 2 | How close is it to where they are? (transport-aware) |
| Category Match | 2 | Does it match their preferred activity types? |
| Vibe Match | 1 | Does the energy level match their current mood? |
| Budget Match | 2 | Can they afford it? |

Events scoring below 3 are never shown. Free events get a silent +0.5 bonus. Events happening within 2 hours get a +1 urgency bump.

---

## Setup & Deployment

### Prerequisites
- NVIDIA DGX Spark with DGX OS
- OpenClaw installed (`pip install openclaw` or from source)
- NVIDIA API key (free from build.nvidia.com)

### Steps

1. **Clone the repo**
   ```bash
   git clone https://github.com/[your-username]/atlas-ucsc.git
   cd atlas-ucsc
   ```

2. **Set environment variables**
   ```bash
   export NVIDIA_API_KEY="your-nvidia-api-key"
   export DISCORD_BOT_TOKEN="your-discord-bot-token"      # optional, set up later
   export EMAIL_ADDRESS="your-atlas-email@gmail.com"       # optional, set up later
   export EMAIL_APP_PASSWORD="your-gmail-app-password"     # optional, set up later
   ```

3. **Copy to OpenClaw workspace**
   ```bash
   cp -r . ~/.openclaw/workspace/
   ```

4. **Start Atlas**
   ```bash
   openclaw start
   ```

Atlas will launch both agents. The Scraper starts collecting immediately. Atlas waits for you to say hi.

### Optional: Discord Bot Setup
1. Go to discord.com/developers/applications → create new app
2. Create a bot → enable Message Content Intent
3. Invite to your servers with Read Messages + Read Message History permissions
4. Copy channel IDs (Developer Mode → right-click channel → Copy ID)
5. Add channel IDs to `scraper/sources/discord-channels.md`

### Optional: Email Newsletter Setup
1. Create a Gmail account for Atlas (e.g., atlas.ucsc.events@gmail.com)
2. Enable 2FA → generate App Password
3. Subscribe to newsletters listed in `scraper/sources/newsletters.md`
4. Set EMAIL_ADDRESS and EMAIL_APP_PASSWORD environment variables

---

## How Atlas Learns

Atlas has a three-layer memory system:

- **USER.md** — permanent profile (name, college, transport, food prefs, activity prefs, swipe patterns). Updated when strong new preferences are detected.
- **MEMORY.md** — agent insights (what worked, what flopped, timing patterns, self-corrections). Consolidated daily to stay under 6,000 chars.
- **Event cache** — ephemeral daily files. Fresh every hour, deleted after the day passes.

Every swipe is a signal. Reject 5 nightlife events in a row? Atlas stops showing them. Love every nature activity? They float to the top. The more you use it, the better it gets.

---

## Event Sources

### Tier 1 (checked every hour)
- UCSC Events Calendar, News Center, Arts Division, Film & Digital Media, IAS, Library, Dining, Recreation, GetInvolved
- Downtown Santa Cruz, First Friday, Good Times, Lookout, Visit Santa Cruz, MAH
- Catalyst, Kuumbwa Jazz, Rio Theatre, Beach Boardwalk
- 28 Instagram accounts (main UCSC, dining, arts, venues, student media)

### Tier 2 (checked every other hour)
- UCSC Magazine, City on a Hill Press, Humanities, Baskin Engineering, Social Sciences, Theater Arts
- Santa Cruz Public Library, Parks & Rec, Eventbrite
- 57 Instagram accounts (colleges, cultural orgs, clubs, performing arts)

Full scan of everything happens at 6:30 AM daily. Silent period 1AM-7AM.

---

## Built By

**Artem Pavlov** — Hack-a-Claw x NVIDIA Hackathon

---

## License

MIT

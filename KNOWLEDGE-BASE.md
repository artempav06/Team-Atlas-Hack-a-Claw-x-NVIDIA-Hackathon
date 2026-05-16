# Atlas Agent — Complete Knowledge Base
## OpenClaw + NVIDIA Nemotron + NemoClaw + DGX Spark

*Compiled for the Hack-a-Claw x NVIDIA Hackathon*
*Last updated: May 14, 2026*

---

## TABLE OF CONTENTS

1. OpenClaw — Deep Technical Reference
2. NVIDIA Nemotron Models — Complete Guide
3. NemoClaw — Security & Integration Layer
4. DGX Spark — Hardware Platform
5. Building Custom Skills for Atlas
6. Key Resources & Links
7. Atlas Agent — Architecture Plan

---

## 1. OPENCLAW — DEEP TECHNICAL REFERENCE

### What It Is
OpenClaw is a self-hosted gateway that connects AI agents to messaging channels (WhatsApp, Telegram, Slack, Discord, Signal, iMessage, and 20+ more). It runs a single Gateway process on your machine, acting as a bridge between messaging apps and an always-available AI assistant. MIT licensed, community-driven, 347K+ GitHub stars.

### Requirements
- Node 24 (recommended) or Node 22 LTS (22.16+)
- API key from your chosen provider (NVIDIA Nemotron is free)
- ~5 minutes for basic setup

### Installation
```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
openclaw dashboard  # opens browser Control UI at http://127.0.0.1:18789/
```

### Core Architecture

**Gateway (daemon):**
- Single long-lived process that owns all messaging surfaces
- Maintains provider connections
- Exposes a typed WebSocket API (requests, responses, server-push events)
- Emits events: agent, chat, presence, health, heartbeat, cron
- Control-plane clients (macOS app, CLI, web UI) connect over WebSocket on default port 18789
- Exactly one Gateway per host

**Agent Loop (the core execution cycle):**
1. `agent` RPC validates params, resolves session, returns `{ runId, acceptedAt }`
2. `agentCommand` resolves model + defaults, loads skills snapshot, calls embedded runtime
3. The runtime serializes runs via per-session + global queues
4. Resolves model + auth, builds the session, subscribes to events
5. Streams assistant/tool deltas, enforces timeout
6. Returns payloads + usage metadata

**Key principle:** Runs are serialized per session key — this prevents tool/session races and keeps session history consistent.

### Workspace — The Agent's Brain

Location: `~/.openclaw/workspace/` (configurable via `agents.defaults.workspace`)

The workspace is the agent's home directory. Everything the agent knows lives in plain text files:

```
~/.openclaw/workspace/
├── AGENTS.md        ← Operating instructions (HOW agent operates)
├── SOUL.md          ← Personality, tone, values (WHO agent is)
├── TOOLS.md         ← Guidance for how to use tools
├── USER.md          ← Info about the user
├── IDENTITY.md      ← Agent name, vibe, emoji
├── HEARTBEAT.md     ← Scheduled proactive tasks
├── BOOTSTRAP.md     ← One-time first-run ritual (deleted after)
├── MEMORY.md        ← Curated long-term memory
├── BOOT.md          ← Startup checklist on gateway restart
├── memory/
│   └── YYYY-MM-DD.md  ← Daily memory logs
├── skills/
│   └── <skill-name>/
│       └── SKILL.md    ← Skill instructions + YAML config
└── canvas/
    └── index.html      ← Canvas UI files
```

**Bootstrap files injected into system prompt on session start:**
- AGENTS.md, SOUL.md, TOOLS.md, USER.md, IDENTITY.md, BOOTSTRAP.md
- Blank files are skipped; large files are truncated (default limit: 12,000 chars per file, 60,000 total)
- Missing files get a "missing file" marker line

**NOT in workspace (lives at ~/.openclaw/):**
- openclaw.json (config)
- credentials/ (channel/provider state)
- agents/<agentId>/sessions/ (session transcripts as JSONL)
- skills/ (managed/installed skills)

### SOUL.md — Writing Agent Personality

SOUL.md defines voice, stance, and style. It's injected into every session's system prompt.

**What belongs:**
- Tone, opinions, brevity, humor, boundaries, bluntness level

**What does NOT belong:**
- Life stories, changelogs, security policies, giant walls of vibes

**Best practices from official docs:**
- Short beats long. Sharp beats vague.
- Good rules: "have a take", "skip filler", "be funny when it fits"
- Bad rules: "maintain professionalism at all times" — this produces mush
- Keep under 2,000 words (it loads into EVERY prompt)
- Start with 10 lines, add rules only when you notice the agent doing something wrong

**The "Molty Prompt" (official personality rewriter):**
Paste this into your agent to have it rewrite its own SOUL.md with personality:
```
Read your SOUL.md. Now rewrite it with these changes:
1. You have opinions now. Strong ones. Stop hedging.
2. Delete every rule that sounds corporate.
3. Add: "Never open with Great question, I'd be happy to help, or Absolutely."
4. Brevity is mandatory. One sentence answers when possible.
5. Humor is allowed. Not forced — natural wit.
6. Call things out. If I'm about to do something dumb, say so.
7. Swearing is allowed when it lands. Don't force it.
8. "Be the assistant you'd actually want to talk to at 2am."
```

### AGENTS.md vs SOUL.md — Critical Distinction
- **SOUL.md** = WHO (personality, values, tone, boundaries) — character sheet
- **AGENTS.md** = HOW (operating rules, tool usage, workflows, error handling) — operations manual
- Common mistake: mixing them. Keep operational rules out of SOUL.md.

### Tools System

Three layers work together:

1. **Tools** = typed functions the agent can invoke (exec, browser, web_search, message, etc.)
2. **Skills** = markdown files (SKILL.md) injected into system prompt to teach the agent WHEN and HOW to use tools
3. **Plugins** = packages that register channels, providers, tools, skills, and more

**Built-in tools:**
| Tool | What it does |
|------|-------------|
| exec / process | Shell commands, background processes |
| browser | Control Chromium (navigate, click, screenshot) |
| web_search / web_fetch | Search web, fetch page content |
| read / write / edit | File I/O in workspace |
| message | Send messages across all channels |
| canvas | Drive node Canvas (HTML/CSS/JS) |
| cron / gateway | Scheduled jobs; gateway control |
| image_generate | Generate images |
| tts | Text-to-speech |
| sessions_* / subagents | Session management, sub-agent orchestration |

**Tool profiles:**
- `full` — unrestricted (default)
- `coding` — fs, runtime, web, sessions, memory, media tools
- `messaging` — messaging + session tools only
- `minimal` — session_status only

### Skills System — Deep Dive

Skills use AgentSkills-compatible folders. Each skill = directory with `SKILL.md` containing YAML frontmatter + markdown instructions.

**Skill locations (highest precedence first):**
1. Workspace: `<workspace>/skills`
2. Project agent: `<workspace>/.agents/skills`
3. Personal agent: `~/.agents/skills`
4. Managed/local: `~/.openclaw/skills`
5. Bundled (shipped with install)
6. Extra dirs: `skills.load.extraDirs`

**SKILL.md format:**
```yaml
---
name: my-skill
description: What this skill does and when to use it
metadata:
  {"openclaw": {"requires": {"bins": ["curl"], "env": ["API_KEY"]}}}
---

## Instructions for the agent
Step-by-step guidance for using this skill...
```

**Key principles for writing skills:**
- No SDK, no compilation. Just YAML + markdown.
- The agent treats instructions as guidance, not hard limits
- If a behavior matters, spell it out explicitly
- Skills should feel like checklists for a tired on-call engineer at 3am
- Use `{baseDir}` in instructions to reference the skill folder path
- Treat third-party skills as untrusted code — read before enabling

**ClawHub** = public skills registry (clawhub.ai), 5,400+ skills
```bash
openclaw skills install <skill-slug>
openclaw skills update --all
```

**Token impact per skill:**
- Base overhead: 195 characters (when ≥1 skill)
- Per skill: ~97 chars + name + description + location lengths
- Rough estimate: ~24 tokens per skill plus field lengths

### Session Management
- Sessions stored as JSONL at `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`
- Queue modes: collect, steer, followup — control how inbound messages are handled during an active agent run
- Auto-compaction when conversations get long
- Session pruning available for cleanup

### Multi-Agent Routing
- Each agent gets its own workspace, skills, memory, and model config
- Gateway routes messages based on channel, sender, or content
- Per-agent skill allowlists: `agents.list[].skills: ["skill1", "skill2"]`
- Specialist lanes for parallel processing
- Delegate architecture for agent-to-agent handoffs

### Memory System
- **Short-term:** Daily logs at `memory/YYYY-MM-DD.md` — auto-generated
- **Long-term:** MEMORY.md — curated by agent, persists across sessions
- **User profile:** USER.md — structured facts about the user
- Memory wiki and LanceDB plugins available for advanced memory

### Heartbeat — Proactive Scheduling
HEARTBEAT.md defines tasks the agent runs on schedule. Keep it short to avoid token burn.
```markdown
## Every morning at 8am
- Check calendar, summarize emails, send briefing

## Every Friday at 5pm
- Compile weekly summary
```

### Configuration
Config lives at `~/.openclaw/openclaw.json`. Key settings:
```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "model": { "primary": "nvidia/nvidia/nemotron-3-super-120b-a12b" }
    }
  },
  "channels": {
    "whatsapp": { "allowFrom": ["+15555550123"] }
  }
}
```

### Plugin Hooks (Important for Atlas)
Plugins can intercept the agent lifecycle:
- `before_prompt_build` — inject dynamic context before LLM call
- `before_agent_reply` — claim the turn, return synthetic reply
- `before_tool_call` / `after_tool_call` — intercept tool params/results
- `message_received` / `message_sending` — inbound/outbound message hooks
- `session_start` / `session_end` — session lifecycle boundaries

---

## 2. NVIDIA NEMOTRON MODELS — COMPLETE GUIDE

### The Nemotron 3 Family

| Model | Active Params | Total Params | Context | Best For |
|-------|--------------|-------------|---------|----------|
| **Nano** | 3.2B | 31.6B | Standard | Fast single-step tasks, edge/mobile, individual tool calls |
| **Super** | 12B | 120B | 1M tokens | Complex multi-step agents, collaborative workflows, high-volume |
| **Ultra** | ~50B | ~500B | Extended | Deep analysis, long-horizon planning, strategic decisions |

### Nemotron 3 Super — The Sweet Spot for Atlas
- **Architecture:** Hybrid Mamba-Transformer MoE (Mixture of Experts)
- **Active params:** 12B (out of 120B total) — only activates relevant "experts" per token
- **Context window:** 1,000,000 tokens native — agents can hold entire workflow state
- **Throughput:** 5x higher than comparable models
- **Result:** 120B-quality reasoning at 12B-speed inference cost

### Nano Omni — Multimodal Variant
- Adds vision + audio + video understanding to Nano
- 30B params, 3B active
- Can see, hear, and process video alongside text
- Works alongside Super in multi-model architectures

### How to Access Nemotron

**Cloud API (recommended for hackathon):**
```bash
# Get API key from build.nvidia.com
export NVIDIA_API_KEY="nvapi-..."

# Endpoint: https://integrate.api.nvidia.com/v1
# OpenAI-compatible format — works with any OpenAI client
```

**OpenClaw configuration:**
```bash
openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
```

**Config file:**
```json
{
  "env": { "NVIDIA_API_KEY": "nvapi-..." },
  "models": {
    "providers": {
      "nvidia": {
        "baseUrl": "https://integrate.api.nvidia.com/v1",
        "api": "openai-completions"
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "nvidia/nvidia/nemotron-3-super-120b-a12b" }
    }
  }
}
```

**Currently free:** NVIDIA models are free to use via the API. Check build.nvidia.com for rate limits.

### Built-in OpenClaw Catalog for NVIDIA
| Model ref | Name | Context | Max output |
|-----------|------|---------|------------|
| nvidia/nvidia/nemotron-3-super-120b-a12b | Nemotron 3 Super 120B | 262,144 | 8,192 |
| nvidia/moonshotai/kimi-k2.5 | Kimi K2.5 | 262,144 | 8,192 |
| nvidia/minimaxai/minimax-m2.5 | Minimax M2.5 | 196,608 | 8,192 |
| nvidia/z-ai/glm5 | GLM 5 | 202,752 | 8,192 |

### Multi-Model Strategy for Production
- **Ultra** plans overall strategy, breaks complex tasks into steps
- **Super** executes multi-step workflows, manages tool chains
- **Nano** handles fast individual tool calls, classifications

---

## 3. NEMOCLAW — SECURITY & INTEGRATION LAYER

### What It Is
NemoClaw = OpenClaw (agent framework) + OpenShell (sandbox) + Nemotron (model) — packaged as a secure, production-ready runtime. Open source, early preview since March 16, 2026.

### Architecture Stack
```
Your Channels (Telegram, Slack, etc.)
        ↓
OpenClaw Gateway (message routing + agent loop)
        ↓
OpenShell Sandbox (network/FS/process isolation)
        ↓
Nemotron 3 Super (local or API inference)
```

### Security Layers (via OpenShell)
OpenShell enforces sandbox security across four layers with YAML policy files:

1. **Network:** Blocks all outbound except explicitly allowed hosts
2. **Filesystem:** Agent can only write to /sandbox and /tmp; system paths read-only
3. **Process:** Blocks privilege escalation using Landlock, seccomp, network namespaces
4. **Inference:** All LLM API calls routed through OpenShell gateway; agent never holds API keys directly

### Installation on DGX Spark
```bash
# Single installer handles Node.js, OpenShell, and NemoClaw CLI
# Then walks through onboard wizard

# Estimated time: 20-30 min (with model already downloaded)
# First-time model download adds ~15-30 min

# DGX Spark needs no special pre-setup — Docker is pre-installed
```

### When to Use NemoClaw vs Plain OpenClaw
- **Plain OpenClaw + Nemotron API** — fastest setup, good for learning/prototyping/hackathon
- **NemoClaw** — adds enterprise security, sandboxing, audit logs, local inference. Use for production.

**For the hackathon:** Start with plain OpenClaw + Nemotron API. Mention NemoClaw in your pitch as the production security layer.

---

## 4. DGX SPARK — HARDWARE PLATFORM

### Specifications
- **Chip:** NVIDIA GB10 Grace Blackwell Superchip
- **GPU:** Blackwell Architecture with 5th Gen Tensor Cores
- **CPU:** 20-core Arm (10 Cortex-X925 + 10 Cortex-A725)
- **AI Performance:** Up to 1 PFLOP FP4
- **Memory:** 128 GB LPDDR5x coherent unified system memory
- **Storage:** 4 TB NVMe M.2 with self-encryption
- **Networking:** ConnectX-7 NIC @ 200 Gbps, 10 GbE, WiFi 7, BT 5.4
- **Power:** 240W PSU, 140W chip TDP
- **Size:** 150mm x 150mm x 50.5mm (fits on a desk)
- **OS:** NVIDIA DGX OS (Linux-based)
- **Two Sparks can be connected** for models up to 405B parameters

### What It Can Run
- Inference with models up to 200 billion parameters
- Fine-tuning models up to 70 billion parameters
- The entire NemoClaw stack including Nemotron 120B MoE locally
- 128GB unified memory means GPU and CPU share the same memory pool

### Playbooks
Browse curated step-by-step projects at: build.nvidia.com/spark
Including: NemoClaw with Nemotron 3 Super and Telegram on DGX Spark

### Key Software
- NVIDIA AI software stack preinstalled
- Docker pre-installed
- NVIDIA NIM for model serving
- TensorRT-LLM for optimized inference
- NVIDIA AI Enterprise available

---

## 5. BUILDING CUSTOM SKILLS FOR ATLAS

### Atlas Skill Architecture Plan

For the Atlas agent, we need these custom skills:

**1. event-finder skill**
```yaml
---
name: event-finder
description: Find events on and off campus in Santa Cruz. Searches campus event calendars, club announcements, social media, and local event sites. Supports mood-based filtering.
---
```

**2. free-food-tracker skill**
```yaml
---
name: free-food-tracker
description: Track and alert about free food on campus. Monitors event listings, club announcements, and student channels for food availability.
---
```

**3. day-planner skill**
```yaml
---
name: day-planner
description: Create complete day plans with sequenced itineraries, food stops, activities, timing, and multi-stop routes. Supports weekend planning and date night planning.
---
```

**4. study-spots skill**
```yaml
---
name: study-spots
description: Find quiet study locations filtered by noise level, outlet access, WiFi quality, and proximity to next class.
---
```

**5. route-planner skill**
```yaml
---
name: route-planner
description: Generate multi-stop routes from current location through destinations and back home, with transport mode recommendations.
---
```

### Writing Effective Skill Instructions
- Write step-by-step procedures the agent follows
- Include a Rules section for non-negotiable behaviors
- Include example outputs so the agent knows the format
- Reference tools by name: "Use web_search to find events"
- Include error handling: "If no events found, suggest alternatives"
- Keep instructions under 2,000 words per skill

---

## 6. KEY RESOURCES & LINKS

### Official Documentation
- OpenClaw Docs: https://docs.openclaw.ai/
- OpenClaw GitHub: https://github.com/openclaw/openclaw
- OpenClaw NVIDIA Provider: https://docs.openclaw.ai/providers/nvidia
- OpenClaw Skills: https://docs.openclaw.ai/tools/skills
- OpenClaw Creating Skills: https://docs.openclaw.ai/tools/creating-skills
- OpenClaw Agent Workspace: https://docs.openclaw.ai/concepts/agent-workspace
- OpenClaw SOUL.md Guide: https://docs.openclaw.ai/concepts/soul
- OpenClaw Agent Loop: https://docs.openclaw.ai/concepts/agent-loop

### NVIDIA Resources
- Nemotron Models: https://www.nvidia.com/en-us/ai-data-science/foundation-models/nemotron/
- Nemotron Developer Hub: https://developer.nvidia.com/nemotron
- DGX Spark Product Page: https://www.nvidia.com/en-us/products/workstations/dgx-spark/
- DGX Spark User Guide: https://docs.nvidia.com/dgx/dgx-spark/index.html
- DGX Spark Playbooks: https://build.nvidia.com/spark
- NemoClaw GitHub: https://github.com/NVIDIA/NemoClaw
- NemoClaw Quickstart: https://docs.nvidia.com/nemoclaw/latest/get-started/quickstart.html
- NemoClaw Overview: https://docs.nvidia.com/nemoclaw/latest/about/overview.html
- NemoClaw DGX Spark Playbook: https://build.nvidia.com/spark/nemoclaw
- NVIDIA API Keys: https://build.nvidia.com/settings/api-keys
- Nemotron 3 Super Blog: https://blogs.nvidia.com/blog/nemotron-3-super-agentic-ai/
- NemoClaw Technical Blog: https://developer.nvidia.com/blog/build-a-secure-always-on-local-ai-agent-with-nvidia-nemoclaw-and-openclaw/

### Community & Tutorials
- OpenClaw Discord: https://discord.com/invite/clawd
- ClawHub (Skills Registry): https://clawhub.ai
- Awesome OpenClaw Agents (162 templates): https://github.com/mergisi/awesome-openclaw-agents
- Awesome OpenClaw Skills (5,400+): https://github.com/VoltAgent/awesome-openclaw-skills
- OpenClaw Workspace Files Explained (Medium): https://capodieci.medium.com/ai-agents-003-openclaw-workspace-files-explained-soul-md-agents-md-heartbeat-md-and-more-5bdfbee4827a
- Building Custom Skills (DataCamp): https://www.datacamp.com/tutorial/building-open-claw-skills
- OpenClaw Skills Guide (OpenClawWay): https://openclawway.com/blog/openclaw-skills-guide/
- DGX Spark Install for NemoClaw: https://github.com/NVIDIA/NemoClaw/blob/main/spark-install.md

### Videos (from user)
- https://www.youtube.com/watch?v=8kNv3rjQaVA&t=1849s
- https://www.youtube.com/watch?v=CxErCGVo-oo
- NemoClaw on DGX Spark: https://www.youtube.com/watch?v=N2LHg2-J3p8
- Create Unlimited Skills: https://www.youtube.com/watch?v=aYsPTu7VzEs

---

## 7. ATLAS AGENT — ARCHITECTURE PLAN

### Overview
Atlas is an autonomous entertainment and lifestyle concierge for UCSC students, built on OpenClaw with Nemotron 3 Super.

### Technical Stack
- **Framework:** OpenClaw (latest)
- **Model:** Nemotron 3 Super 120B (via NVIDIA API, free)
- **Channel:** Telegram (fastest to set up) or WebChat
- **Security (production):** NemoClaw + OpenShell
- **Hardware (if available):** DGX Spark for local inference

### Workspace File Plan

**SOUL.md** — Atlas personality
- Santa Cruz local expert vibe
- Two modes: campus (practical, energetic) vs downtown (laid-back, exploratory)
- Mood-aware language shifts
- Direct, fun, zero fluff

**AGENTS.md** — Operating rules
- How to switch between on-campus and off-campus modes
- When to use instant discovery vs full day planner
- How to handle mood-based requests
- How to build itineraries (sequencing, timing, routing)
- Memory management rules (what to remember about user preferences)
- Error handling (no events found, location unknown, etc.)

**USER.md** — User preferences
- Preferred mood types
- Budget range
- Transportation (car/bus/walk/bike)
- Dietary preferences
- Past events attended (builds over time)
- Favorite spots

**TOOLS.md** — Tool usage guidance
- When to use web_search vs web_fetch
- How to format route directions
- When to use the message tool for notifications

**HEARTBEAT.md** — Proactive features
- Scan for new events every few hours
- Alert when free food is detected
- Weekend preview on Friday afternoons

### Custom Skills Needed
1. `event-finder` — scrape/search campus and downtown events
2. `free-food-tracker` — monitor campus food opportunities
3. `day-planner` — build complete itineraries
4. `date-planner` — evening/date-specific planning
5. `study-spots` — find study locations
6. `route-planner` — multi-stop route generation
7. `mood-engine` — map mood keywords to activity types

### Memory Strategy
- **Short-term:** Daily logs of what events the user asked about, attended, skipped
- **Long-term:** Curated preferences — favorite vibes, spots, budget patterns, food preferences
- **Self-improving loop:** After each plan, the agent notes what worked and adjusts future recommendations

### Notification Flow
1. Heartbeat runs on schedule (e.g., every 2 hours)
2. Scans event sources for new matches against user preferences
3. If match found + user has notifications enabled, sends alert via channel
4. User can respond immediately to get more info or plan around it

---

*This document is a living reference. Update it as you learn more during the hackathon.*

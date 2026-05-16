---
name: telegram-ui
version: 1.0.0
description: Telegram bot interface — delivers the full Atlas experience through Telegram messages, inline buttons, and formatted cards. Replaces Canvas UI when no web device is paired.
triggers:
  - always active when Telegram is the delivery channel
  - any output that would normally go to Canvas gets routed here instead
priority: high
---

# Telegram UI Skill

This skill defines how Atlas delivers its ENTIRE experience through Telegram. Every feature that exists in the Canvas web UI has a Telegram equivalent defined here. When Telegram is the active interface, ALL output passes through this skill's formatting rules.

---

## Telegram Bot Setup

**Bot configuration:**
- Created via @BotFather
- Token stored in `openclaw.json` as `TELEGRAM_BOT_TOKEN`
- Webhook or long-polling for receiving messages
- Bot commands registered:

```
start - Start Atlas and begin onboarding
swipe - Start a swipe session
plan - Plan my day directly
tonight - What's happening tonight
food - Free food radar
party - Party finder mode
mood - Set your vibe/mood
filters - Set category filters
schedule - Show my planned day
help - Show all commands
settings - Change preferences
```

---

## Message Formatting Rules

**General rules:**
- Use Telegram's MarkdownV2 or HTML parse mode (HTML preferred for reliability)
- Keep messages SHORT — mobile screens are small, attention spans are short
- One idea per message. Don't dump walls of text.
- Use line breaks generously for readability
- Emoji used strategically for visual scanning (category icons, status indicators)
- Never send more than 3 messages in rapid succession (feels spammy)

**Text formatting:**
- `<b>bold</b>` for event names, important info
- `<i>italic</i>` for descriptions, secondary info
- `<code>monospace</code>` for times, addresses
- `<a href="url">link text</a>` for source links, map links

---

## Core Interaction: Swipe Session via Telegram

### Launching a Session

User sends: `/swipe` or "what's happening" or "I'm bored" or "find me something"

Atlas responds with the first event card:

```
🎵 <b>Jazz Night at Kuumbwa</b>

📅 Tonight, 8:00 PM – 10:30 PM
📍 Kuumbwa Jazz Center, 320 Cedar St
💰 $15 student tickets
⚡ Vibe: chill

<i>Intimate jazz club downtown — tonight featuring the Marcus Shelby Trio. Small venue, great acoustics, BYOB vibes.</i>

🏷 #music #chill #downtown
```

**Inline keyboard buttons below the card:**

```
[ 👎 Pass ]  [ ⭐ Love it ]  [ 👍 Down ]
```

- 👎 Pass = swipe left (reject)
- 👍 Down = swipe right (accept)
- ⭐ Love it = super-like (strong accept, priority placement)

### After User Taps a Button

**On 👍 (accept):**
Atlas sends brief confirmation + next card:
```
✅ Added to your day! (3:00 PM slot)

━━━━━━━━━━━━━━━

🎨 <b>First Friday Art Walk</b>

📅 Friday, 5:00 PM – 9:00 PM
📍 Downtown Pacific Ave (multiple galleries)
💰 Free
⚡ Vibe: social

<i>Monthly gallery crawl — 15+ venues open their doors. Wine, art, live music on the street. Self-guided, go at your own pace.</i>

🏷 #art #social #free #downtown
```

**On 👎 (reject):**
No confirmation message. Immediately show next card. Don't waste time acknowledging rejection.

**On ⭐ (love it):**
```
🌟 Prioritized! That's going first in your plan.

━━━━━━━━━━━━━━━
[next card]
```

### Session Flow Controls

Additional buttons appear contextually:

After 5+ cards shown, add a row:
```
[ 👎 Pass ]  [ ⭐ Love it ]  [ 👍 Down ]
[    🎯 Filters    ] [   ✨ Mood   ]
[         📋 Done — Plan my day         ]
```

- 🎯 Filters → triggers filter selection flow
- ✨ Mood → triggers mood input flow
- 📋 Done → ends swiping, triggers day planning

### Deck Status Updates

When deck gets low (5 cards remaining):
```
📦 <i>Running low on events — 5 left. Want me to add personalized activities?</i>

[ Yes, add more ] [ No, just these ]
```

When deck is empty:
```
🏁 <i>That's everything for today! You accepted 4 events.</i>

[ 📋 Plan my day ] [ 🔄 Generate more ]
```

---

## Calendar View (replaces sidebar)

In Canvas UI, the calendar is a live sidebar. In Telegram, it's a formatted summary sent on request or after each accept.

### Quick Calendar (sent after every 3rd acceptance)

```
📅 <b>Your day so far:</b>

⬜ 11:00 AM — Farmers Market (downtown)
⬜ 1:30 PM — Lunch at Perk Coffee
🟦 3:00 PM — Jazz Night (confirmed)
⬜ 5:00 PM — First Friday Art Walk

<i>Tap /schedule for full details with travel times</i>
```

### Full Schedule (on /schedule command)

```
📅 <b>Your plan — Friday, May 16</b>

━━━━━━━━━━━━━━━

🟢 11:00 AM – 12:30 PM
<b>Farmers Market</b>
📍 Downtown, Lincoln & Cedar
🚲 12 min bike from campus

      ↓ 10 min bike

🟡 1:30 PM – 2:30 PM
<b>Lunch at Perk Coffee</b>
📍 1540 Pacific Ave
🚶 Already downtown

      ↓ 5 min walk

🔵 3:00 PM – 5:00 PM
<b>Jazz Night at Kuumbwa</b>
📍 320 Cedar St
🚶 2 min walk from Perk

      ↓ 0 min (same area)

🟣 5:00 PM – 8:00 PM
<b>First Friday Art Walk</b>
📍 Pacific Ave galleries
🚶 Right there

━━━━━━━━━━━━━━━

⏱ Total time: 11:00 AM – 8:00 PM
🚲 Total travel: ~27 min
💰 Total cost: $15 (jazz tickets)

[ ✏️ Edit plan ] [ ✅ Looks good! ]
```

**Color coding via emoji:**
- 🟢 = nature/wellness
- 🟡 = food
- 🔵 = music
- 🟣 = art
- 🔴 = nightlife
- ⚪ = social/academic/sports

---

## Filters via Telegram

### Filter Selection Flow

User taps 🎯 Filters or sends `/filters`:

```
🎯 <b>What are you in the mood for?</b>

<i>Tap categories to filter (can pick multiple):</i>
```

Inline keyboard grid:
```
[ 🍕 Food ] [ 🎵 Music ] [ 🎨 Art ]
[ 🏃 Sports ] [ 🌿 Nature ] [ 👥 Social ]
[ 📚 Academic ] [ 🌙 Nightlife ] [ 🧘 Wellness ]
[         ✅ Apply filters         ]
[         🔄 Clear all             ]
```

Buttons toggle on/off (add ✓ when selected):
```
[ 🍕 Food ✓ ] [ 🎵 Music ✓ ] [ 🎨 Art ]
[ 🏃 Sports ] [ 🌿 Nature ] [ 👥 Social ]
...
```

After "Apply filters":
```
🎯 Filtering for: food, music
<i>Reshuffling your deck...</i>

━━━━━━━━━━━━━━━
[next filtered card]
```

---

## Mood Bar via Telegram

### Mood Input Flow

User taps ✨ Mood or sends `/mood`:

```
✨ <b>What's your vibe right now?</b>

<i>Pick one or just type how you're feeling:</i>
```

Inline keyboard:
```
[ 😌 Chill ] [ ⚡ Energetic ]
[ 👥 Social ] [ 🧠 Intellectual ]
[ 🏔️ Adventurous ]
```

OR user can type freeform: "I'm tired and stressed" / "something fun with friends" / "surprise me"

Atlas interprets using quick-filters mood parsing logic, then confirms:

```
✨ Got it — serving chill, low-effort vibes
<i>Reshuffling...</i>

━━━━━━━━━━━━━━━
[next mood-matched card]
```

---

## Day Plan Delivery (replaces pixel art map)

After user says "done" or taps "Plan my day":

### Step 1: Processing message
```
🗺️ <i>Building your perfect day...</i>
<i>Optimizing routes, checking travel times...</i>
```

### Step 2: Text plan summary
```
🗺️ <b>Your day plan — ready!</b>

Here's what I've got for you:

1️⃣ <b>Farmers Market</b> (11:00 AM)
   Free • downtown • 🚲 12 min from campus

2️⃣ <b>Lunch at Perk</b> (1:30 PM)
   $$ • already downtown • 🚶 2 min

3️⃣ <b>Kuumbwa Jazz</b> (3:00 PM)
   $15 • downtown • 🚶 5 min walk

4️⃣ <b>First Friday Art Walk</b> (5:00 PM)
   Free • Pacific Ave • 🚶 0 min

━━━━━━━━━━━━━━━
💡 <i>Energy pacing: chill start → active middle → social evening</i>
🍽️ <i>Lunch break built in at 1:30</i>
💰 <i>Total spend: ~$15</i>
```

Inline keyboard:
```
[ ✅ Love it! Lock it in ] 
[ ✏️ Swap something ] [ ➕ Add more ]
[ 🗑️ Start over ]
```

### Step 3: Route details (on request or auto-sent)

For each transition, Atlas can send a Google Maps link:
```
🧭 <b>Route: Campus → Farmers Market</b>

🚲 Bike: 12 min (downhill, easy ride)
📍 <a href="https://maps.google.com/?daddr=Lincoln+St+%26+Cedar+St+Santa+Cruz+CA">Open in Google Maps</a>

💡 <i>Tip: Lock your bike at the racks on Cedar — they fill up by noon on Fridays</i>
```

### Step 4: Confirmation + Google Maps links

After user approves plan:
```
🎉 <b>You're set for an amazing day!</b>

<i>I'll send you a reminder 30 min before each event. Have a sick one</i> 🤙

Quick links:
• <a href="maps_link_1">Navigate to Farmers Market</a>
• <a href="maps_link_2">Navigate to Perk Coffee</a>
• <a href="maps_link_3">Navigate to Kuumbwa Jazz</a>
• <a href="maps_link_4">Navigate to Art Walk start</a>
```

---

## Proactive Push Messages (Schedule-Aware)

These are sent WITHOUT user asking — Atlas detects free time and pushes.

### Free time gap detected:

```
💡 <b>Hey! You're free 2:00 – 4:30 PM today</b>

I found something that fits perfectly:

🎨 <b>IAS Gallery Opening — "Coastal Futures"</b>
📅 Today, 2:00 PM – 5:00 PM
📍 Institute of Arts & Sciences, UCSC
💰 Free (with snacks!)
🚶 8 min walk from Science Hill

<i>New exhibition opening + free refreshments. Low-key, come and go as you please.</i>

[ 👍 Add to my day ] [ 👎 Not today ] [ 🔇 Don't suggest for this gap ]
```

### Morning briefing (daily digest):

```
☀️ <b>Good morning! Here's your Friday:</b>

📅 You have 3 free blocks today:
• 11:00 AM – 1:00 PM (2 hrs)
• 3:00 PM – 5:00 PM (2 hrs)  
• 7:00 PM onward (evening free!)

🔥 <b>Top picks for today:</b>

1. 🍕 Free pizza at Porter (12:00 PM) — walk-in
2. 🎵 Catalyst show tonight ($10) — your kind of music
3. 🌿 Pogonip trail is perfect weather today

<i>Want me to build a day plan? Or just swipe through options?</i>

[ 🗺️ Plan my day ] [ 🎴 Swipe ] [ 😴 Maybe later ]
```

---

## Free Food Radar Alerts

These are URGENT, time-sensitive pushes. Sent immediately when detected.

```
🚨🍕 <b>FREE FOOD ALERT</b>

<b>Free Pizza — Porter Study Lounge</b>
⏰ Right now! (until they run out)
📍 Porter College, B-building study room
🚶 ~15 min walk from your location

<i>Posted 4 min ago by @ucsc_porter on Instagram</i>

[ 🏃 On my way! ] [ 😐 Too far ] [ 🔇 Mute food alerts for 2hrs ]
```

**Formatting rules for food alerts:**
- Always lead with 🚨🍕 — instant visual recognition
- Include "right now" or specific end time
- Include walk/bike time from user's likely location
- Include how fresh the info is (posted X min ago)
- "Mute" option prevents alert fatigue
- NEVER send more than 3 food alerts in one day

---

## Party Finder Mode

User sends `/party` or "where's the party tonight":

```
🎉 <b>Tonight in Santa Cruz:</b>

<i>Social buzz from the last few hours:</i>

━━━━━━━━━━━━━━━

🔥🔥🔥 <b>Catalyst — DJ Night</b>
📍 Pacific Ave | 💰 $10 | ⏰ 10 PM
<i>Buzz: 3 sources talking about this</i>
🏷 #club #energetic

🔥🔥 <b>House show — West Side</b>
📍 Near Natural Bridges | 💰 Free | ⏰ 9 PM
<i>Buzz: spotted on 2 Discord servers</i>
🏷 #house-party #social

🔥 <b>Kresge Late Night</b>
📍 Kresge Town Hall | 💰 Free | ⏰ 11 PM
<i>Buzz: posted by @ucsc_kresge</i>
🏷 #kickback #chill

━━━━━━━━━━━━━━━

<i>🔥 = social buzz level (more = more people going)</i>

[ See more tonight ] [ 🗺️ Get directions ]
```

---

## Event Reminders

30 minutes before each planned event:

```
⏰ <b>Heads up!</b>

<b>Kuumbwa Jazz</b> starts in 30 min
📍 320 Cedar St, Downtown
🚲 12 min bike ride from campus

<a href="maps_link">📍 Open directions</a>

[ ✅ On my way ] [ ❌ Can't make it ] [ ⏰ Remind me in 15 ]
```

If user taps "Can't make it":
```
No worries! Removed from your plan.

<i>Anything else going on tonight that caught your eye? I can find alternatives.</i>

[ 🔄 Find something else ] [ 👋 I'm good ]
```

---

## Quick Commands (Text Shortcuts)

Users can also just type naturally. Atlas parses these:

| User types | Atlas interprets as |
|-----------|-------------------|
| "what's happening" | Start swipe session |
| "tonight" | Filter to evening events, start swiping |
| "free food" | Trigger food radar / show recent food events |
| "I'm bored" | Start swipe session |
| "plan my day" | Direct planning mode (no swipe) |
| "something chill" | Set mood to chill, start swiping |
| "cancel" / "nevermind" | Cancel current flow, return to idle |
| "change X" | Modify plan (swap, remove, add) |
| "what's my plan" | Show current schedule |
| "surprise me" | Serendipity mode — one random pick |

---

## Settings via Telegram

User sends `/settings`:

```
⚙️ <b>Atlas Settings</b>

[ 📍 Update my location ]
[ 🚲 Change transport mode ]
[ 🍕 Food preferences ]
[ 🔔 Notification settings ]
[ 📅 Connect calendar ]
[ 👤 View my profile ]
```

### Notification settings:
```
🔔 <b>Notification Settings</b>

Currently active:
✅ Morning briefing (8:00 AM)
✅ Free food alerts
✅ Event reminders (30 min before)
✅ Proactive suggestions
❌ Party alerts

<i>Tap to toggle:</i>

[ ☀️ Morning briefing: ON ]
[ 🍕 Food alerts: ON ]
[ ⏰ Reminders: ON ]
[ 💡 Proactive push: ON ]
[ 🎉 Party alerts: OFF ]
[ 🔇 Quiet hours: 1AM-8AM ]
```

---

## Onboarding via Telegram (BOOTSTRAP equivalent)

User sends `/start` for the first time:

```
👋 <b>Hey! I'm Atlas</b>

I'm your personal UCSC adventure concierge. I find events, plan your day, and make sure you never miss the good stuff happening around campus and Santa Cruz.

Let me learn a bit about you so I can nail the recommendations. Quick 5 questions — takes 30 seconds:

<b>What's your name?</b>
```

User: "Artem"

```
Nice to meet you, Artem! 🤙

<b>Which college are you at?</b>

[ Crown ] [ Merrill ] [ Cowell ]
[ Stevenson ] [ Porter ] [ Kresge ]
[ Oakes ] [ Rachel Carson ] [ College 9 ]
[ College 10 ] [ Off-campus ]
```

User taps: "Crown"

```
Crown crew! 

<b>How do you usually get around?</b>

[ 🚶 Walk ] [ 🚲 Bike ] [ 🚌 Bus ] [ 🚗 Car ]
```

User taps: "Bike"

```
Solid — bikes make everything accessible.

<b>Any food preferences I should know?</b>
<i>(type anything: vegetarian, no seafood, love tacos, etc. or tap Skip)</i>

[ Skip ]
```

User: "vegetarian, love coffee"

```
Veggie + coffee noted ☕

<b>Last one — what's your general vibe?</b>
<i>Pick what sounds most like you:</i>

[ 😌 Chill — low-key, relaxed ]
[ ⚡ Active — always doing stuff ]
[ 👥 Social — love people & events ]
[ 🧠 Curious — lectures, galleries, new things ]
[ 🏔️ Adventure — outdoors, exploring ]
```

User taps: "Social"

```
Perfect, I've got you dialed in! Here's what I'm seeing for today:

🎵 <b>Open Mic at Perk Coffee</b> — tonight 7 PM, free, downtown
<i>Live music + coffee + social crowd. Right up your alley.</i>

That's the kind of stuff I'll find for you every day. Ready?

[ 🎴 Start swiping ] [ 📋 Plan my day ] [ 😴 Not now ]
```

---

## Error States

### No events available:
```
😅 <b>Quiet day on campus</b>

Not finding much happening right now. Want me to:

[ 🎲 Generate personalized activities ]
[ 🔄 Check again in an hour ]
[ 📅 Look at tomorrow instead ]
```

### Scraper delayed:
```
<i>Grabbing fresh events... one sec</i>

(usually takes 10-30 seconds)
```

If still nothing after 30 seconds:
```
<i>Events are still loading — I'll push you a notification when they're ready. Shouldn't be long!</i>
```

### User sends gibberish or unrecognized input:
```
Hmm, not sure what you mean. Here's what I can do:

/swipe — browse events
/plan — plan your day
/tonight — what's happening tonight
/food — free food radar
/help — full command list
```

---

## Message Throttling & Anti-Spam Rules

- Never send more than 3 unprompted messages in a row
- Minimum 2 minutes between proactive pushes (unless urgent food alert)
- Morning briefing: exactly 1 per day, at user's configured time
- Food alerts: max 3 per day
- Event reminders: only for confirmed/approved events
- If user sends "stop" or "quiet": mute all proactive messages for 4 hours
- If user doesn't respond to 3 consecutive proactive pushes: reduce frequency automatically

---

## Inline Keyboard Patterns Reference

### Standard swipe card:
```
Row 1: [ 👎 Pass ]  [ ⭐ Love it ]  [ 👍 Down ]
```

### Extended swipe (after 5 cards):
```
Row 1: [ 👎 Pass ]  [ ⭐ Love it ]  [ 👍 Down ]
Row 2: [ 🎯 Filters ] [ ✨ Mood ]
Row 3: [ 📋 Done — Plan my day ]
```

### Plan approval:
```
Row 1: [ ✅ Love it! Lock it in ]
Row 2: [ ✏️ Swap something ] [ ➕ Add more ]
Row 3: [ 🗑️ Start over ]
```

### Proactive suggestion:
```
Row 1: [ 👍 Add to my day ] [ 👎 Not today ]
Row 2: [ 🔇 Don't suggest for this gap ]
```

### Food alert:
```
Row 1: [ 🏃 On my way! ] [ 😐 Too far ]
Row 2: [ 🔇 Mute food alerts 2hrs ]
```

### Yes/No decisions:
```
Row 1: [ ✅ Yes ] [ ❌ No ]
```

---

## Callback Data Format

Each inline button sends a callback query. Format:

```
action:context:data
```

Examples:
- `swipe:accept:event_id_123` — accepted event
- `swipe:reject:event_id_123` — rejected event
- `swipe:superlike:event_id_123` — super-liked
- `filter:toggle:food` — toggle food filter
- `filter:apply` — apply current filters
- `mood:set:chill` — set mood to chill
- `plan:approve` — approve day plan
- `plan:edit` — request plan edit
- `alert:accept:event_id_456` — accepted proactive suggestion
- `alert:dismiss:event_id_456` — dismissed suggestion
- `alert:mute:food:2h` — mute food alerts 2 hours
- `reminder:onmyway:event_id_789` — confirmed heading to event
- `reminder:cancel:event_id_789` — cancelled event attendance
- `settings:toggle:morning_briefing` — toggle notification setting

---

## Integration with Existing Skills

This skill does NOT replace any existing skill — it's a **formatting and delivery layer** on top of them:

| Existing skill | What it still does | What telegram-ui handles |
|---|---|---|
| event-curator | Scores, ranks, manages queue | telegram-ui formats cards and sends them |
| day-planner | Optimizes schedule | telegram-ui formats the plan message |
| route-planner | Calculates routes + travel | telegram-ui formats route messages + Google Maps links |
| quick-filters | Parses mood/filter input | telegram-ui provides the button interface for input |
| map-renderer | Renders Canvas UI | telegram-ui REPLACES this when no Canvas paired |
| memory-curator | Reads/writes memory | Unchanged — works the same regardless of interface |
| alert-dispatcher | Processes urgent alerts | telegram-ui formats and sends the alert messages |
| proactive-recommender | Finds gap suggestions | telegram-ui formats and sends the push messages |

**Key principle:** The brain (scoring, planning, routing) stays the same. Only the output format changes. Telegram-ui is a presentation layer, not a logic layer.

---

## Telegram-Specific Limitations & Workarounds

| Canvas feature | Telegram equivalent |
|---|---|
| Swipe gesture (drag cards) | Inline buttons (👍/👎/⭐) |
| Live calendar sidebar | Summary message sent every 3 accepts + /schedule command |
| Filter chips (visual) | Toggle buttons with ✓ indicator |
| Mood chat bar (free text) | User types naturally in chat — Atlas parses same way |
| Routing popup (Leaflet map) | Google Maps link + text description |
| Pixel art journey map | Formatted text plan + Google Maps links per stop |
| Card images (AI generated) | No images in v1. Event details in text are enough. Future: send AI-generated images as Telegram photos |
| Real-time UI updates | New messages replace old context. Edit previous message when possible. |
| Drag-to-reorder schedule | "Swap X and Y" via text command or ✏️ Edit flow |

---

## Message Editing Strategy

Telegram allows editing sent messages. Use this to keep chat clean:

- **Swipe cards:** EDIT the previous card message with the new card (don't send new message each time). This keeps the chat from filling with dozens of old cards.
- **Calendar updates:** EDIT the calendar message each time an event is added.
- **Filter changes:** EDIT the filter message to show current state.
- **Plan building:** Send "building your plan..." then EDIT it with the final plan when ready.

**When to send NEW messages (not edit):**
- Proactive pushes (new context)
- Food alerts (urgent, needs own notification)
- Morning briefings (new day, new message)
- Confirmations after major actions ("You're all set!")
- Error messages

---

## Session State in Telegram

Since Telegram conversations are persistent (no "session start/end" like Canvas), track state via:

- Current mode: IDLE / SWIPING / PLANNING / FILTERING
- Current card index in queue
- Accepted events list (for this session)
- Active filters and mood
- Last interaction timestamp (for timeout detection)

**Session timeout:** If user hasn't interacted in 2 hours during an active swipe session, consider it ended. Run memory-curator to log patterns. Reset to IDLE.

**Resume detection:** If user comes back and says "keep going" or "more", resume from where they left off if session hasn't timed out.

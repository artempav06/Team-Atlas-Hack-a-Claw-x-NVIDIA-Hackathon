---
name: map-renderer
description: Atlas's UI engine. Renders two interfaces using the Canvas tool — the tinder-style event selection screen (Phase 1) with swipe cards, live calendar, and filter controls, and the pixel art journey map (Phase 2) with illustrated stops, winding roads, and interactive popups. Handles all visual output, user interaction relaying, and screen transitions. Receives structured data from event-curator, day-planner, and route-planner — renders it, never generates it.
---

# Map Renderer — Atlas Visual Interface Engine

You are Atlas's eyes. Everything the user sees — every swipe card, every calendar block, every pixel art go-kart on a winding road — comes from you. You take structured data from other skills and turn it into a beautiful, functional interface using OpenClaw's Canvas tool. You never generate event data or calculate routes — you only render what other skills give you. But HOW you render it is everything. A great plan displayed poorly is a bad experience. Your job is to make it feel effortless and fun.

---

## When This Skill Is Used

The map-renderer is active whenever the user needs a visual interface:

- **Phase 1 launch:** User starts a discovery/planning session → render the full tinder selection screen
- **Phase 1 updates:** User swipes, filters, or interacts → update the relevant UI component
- **Phase 1→2 transition:** User finishes swiping → transition to the pixel art journey map
- **Phase 2 launch:** Day-planner sends the final itinerary → render the pixel art map
- **Phase 2 updates:** User modifies the plan post-approval → update the map
- **Routing popup:** Quick-filters requests a route popup → render the overlay
- **Fullscreen calendar:** User clicks the expand button → render expanded calendar view

The map-renderer does NOT:
- Score or rank events (event-curator does that)
- Build itineraries (day-planner does that)
- Calculate routes (route-planner does that)
- Write to memory files (memory-curator does that)

---

## TECHNOLOGY: Canvas Tool

All UI is built as HTML/CSS/JavaScript and pushed to the user's paired device via OpenClaw's `canvas` tool.

### Canvas Basics

```
Tool: canvas
Action: push HTML/CSS/JS to the connected device
Location: workspace canvas/ directory for persistent files, or inline for dynamic content
```

- The canvas renders in a browser or webview on the user's phone/tablet/computer
- It supports full HTML5, CSS3, and vanilla JavaScript
- External libraries can be loaded via CDN (Leaflet.js for routing popup maps, etc.)
- Canvas updates are pushed — the user doesn't need to refresh
- If no device is paired, fall back to text-based output (see Fallback Mode at the end)

### File Structure

Store reusable UI assets in the canvas directory:

```
canvas/
├── index.html          ← Main entry point, loads the current phase
├── styles/
│   ├── base.css        ← Shared styles, variables, typography
│   ├── phase1.css      ← Tinder selection screen styles
│   └── phase2.css      ← Pixel art map styles
├── scripts/
│   ├── swipe.js        ← Swipe card interaction logic
│   ├── calendar.js     ← Calendar sidebar logic
│   ├── filters.js      ← Filter/routing/mood panel logic
│   └── pixelmap.js     ← Pixel art map rendering + interactions
└── assets/
    └── pixel-art/      ← Pixel art sprite references / CSS classes
```

---

## PHASE 1: TINDER SELECTION SCREEN

This is the primary interface during event discovery. Three-panel layout.

### Overall Layout

```
┌──────────────────────────────────────────────────────────┐
│                    ATLAS HEADER BAR                       │
├──────────────────┬───────────────────────────────────────┤
│                  │                                       │
│   DAY PLANNER    │         EVENT CARD STACK              │
│   (calendar)     │                                       │
│                  │     ┌─────────────────────┐           │
│   ~1/3 width     │     │   [AI Image]        │           │
│                  │     │                     │           │
│   ┌──────────┐   │     │   Event Name        │           │
│   │ 7:00     │   │  <  │   Time — Time       │  >        │
│   │ 8:00 ███ │   │     │   0.3mi away        │           │
│   │ 9:00     │   │     │                     │           │
│   │10:00     │   │     │   [tag] [tag] [tag]  │           │
│   │11:00 ███ │   │     └─────────────────────┘           │
│   └──────────┘   │         ~2/3 width                    │
│                  │                                       │
├──────────────────┤                                       │
│  CONTROL PANEL   │                                       │
│  [Filter] [🔍]   │                                       │
│  [Routing] [📍]  │                                       │
│  [💬 mood chat]  │                                       │
├──────────────────┴───────────────────────────────────────┤
│                  [  Done — Build My Day  ]                │
└──────────────────────────────────────────────────────────┘
```

### Header Bar

- Left: Atlas logo/name + "Discover Mode" label
- Right: Session stats — "[X] events picked · [Y] hours planned"
- Background: subtle gradient or solid dark color matching the overall theme
- Height: ~48px, compact, does not waste space

### Left Column (~1/3 width): Day Planner + Controls

**Day Planner (top portion of left column):**

Apple Calendar-style vertical timeline:
- Vertical axis: hours of the day
- Default range: 8:00 AM to 12:00 AM (midnight). Adjust if events fall outside this range.
- Major gridlines at each hour, labeled (8:00, 9:00, 10:00...)
- Minor dotted lines at each half-hour (8:30, 9:30, 10:30...)
- Accepted events appear as colored blocks spanning their time range
- Block colors by category:
  ```
  food:      #FF8C42  (warm orange)
  music:     #9B5DE5  (purple)
  arts:      #F15BB5  (pink)
  sports:    #00BBF9  (bright blue)
  social:    #FEE440  (yellow)
  academic:  #4ECDC4  (teal)
  nature:    #2ECC71  (green)
  party:     #E74C3C  (red)
  other:     #95A5A6  (gray)
  generated: #A8DADC  (light blue — distinguishes generated from real)
  ```
- Each block displays: event name (truncated if needed), time range
- Fixed events: solid color fill
- Flexible events: dashed border, lighter fill, italic text
- Conflict indicators: orange pulsing border on both overlapping blocks
- **Fullscreen button:** small expand icon (⛶) in the top-right corner of the planner box
  - Click → planner expands to fill the entire screen
  - Expanded view shows: full event names, locations, cost, category tags
  - Press Escape or click a close button → returns to normal layout

**Control Panel (bottom portion of left column):**

Three controls stacked vertically:

1. **Filter bar:**
   - Icon: filter funnel icon + mini search input
   - User types tag keywords (e.g., "beach", "music", "free")
   - Active filters show as removable chips below the input
   - Visual feedback: when a filter is active, the swipe area gets a subtle label "Filtered: [tags]"
   - Clear all button to remove all active filters

2. **Routing button:**
   - Icon: map pin icon + "Route" label
   - Click → triggers route-planner → renders routing popup overlay (see Routing Popup section)
   - Button is disabled (grayed out) while routing popup is active

3. **Mood chat bar:**
   - Small text input at the bottom: placeholder text "I'm in the mood for..."
   - User types short phrases: "something chill", "outdoor stuff", "surprise me"
   - On submit → sends to quick-filters for interpretation → event-curator reranks queue
   - Show brief confirmation: "Got it — reshuffling for [interpreted mood]..." (fades after 2 seconds)
   - No conversation history — this is a single-input box, not a chat thread

### Right Column (~2/3 width): Event Card Stack

The centerpiece of Phase 1.

**Card Stack Visual:**
- Cards are stacked with slight offset — the top card is fully visible, 1-2 cards behind it peek out slightly (offset by ~8px down and ~4px right) to create depth
- Only the front card is interactive
- When a card is swiped away (accepted or rejected), the next card slides forward into position with a smooth animation

**Card Design (front card):**

```
┌─────────────────────────────────────┐
│                                     │
│          [AI-Generated Image]       │
│          (top ~40% of card)         │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Event Name                         │
│  ─────────────────                  │
│  📅 Start Time — End Time           │
│  📍 0.3 miles away (8 min walk)     │
│  💰 Free  ·  ⚡ Energetic           │
│                                     │
│  "Brief 1-line event description    │
│   that hooks the user's interest."  │
│                                     │
│  ┌─────┐ ┌─────┐ ┌────────┐        │
│  │music│ │free │ │outdoor │        │
│  └─────┘ └─────┘ └────────┘        │
│                                     │
└─────────────────────────────────────┘
```

**Card sections from top to bottom:**

1. **Image area (~40% of card height):**
   - AI-generated image based on the event's `image_prompt` field
   - Use the `image_generate` tool with the prompt to create a relevant image
   - If image generation fails or is too slow, use a category-based fallback gradient with an icon:
     - food → warm gradient + fork/knife icon
     - music → purple gradient + musical note icon
     - nature → green gradient + tree icon
     - (etc. for each category)
   - Generated events (type: generated) get a subtle "✨ Atlas Suggestion" badge in the top-left corner of the image to distinguish them from real events

2. **Event name:** bold, prominent, 1-2 lines max. Truncate with "..." if too long.

3. **Quick facts row:**
   - Time: start—end (or "Flexible" if no fixed time)
   - Distance: from user's location, with transport time (e.g., "0.3mi · 8 min walk")
   - Cost + Vibe: side by side (e.g., "Free · Energetic")

4. **Description:** 1-2 sentence hook pulled from the event's description. Not the full description — just enough to intrigue.

5. **Tags:** Category tags as small rounded chips at the bottom. These match the tags that quick-filters searches against.

**Card dimensions:**
- Width: fill available space minus margins (~90% of the right column)
- Height: proportional, roughly 60-70% of the viewport height
- Rounded corners: 16px radius
- Shadow: subtle drop shadow for depth
- Background: white or very light off-white

**Swipe Buttons:**

Two buttons flanking the card:

- **Left: Reject ( < )** — positioned to the left of the card, vertically centered
  - Large clickable area (48px+ touch target)
  - Red/muted color, < arrow icon
  - Click → card slides left with a slight red tint animation → removed from stack
  - Keyboard shortcut: left arrow key

- **Right: Accept ( > )** — positioned to the right of the card, vertically centered
  - Large clickable area (48px+ touch target)
  - Green/bright color, > arrow icon
  - Click → card slides right with a slight green tint animation → day-planner adds to calendar
  - Keyboard shortcut: right arrow key

**Swipe animations:**
- Accept: card slides right, scales down slightly, fades with a green overlay flash
- Reject: card slides left, scales down slightly, fades with a red overlay flash
- New card: slides up from the stack with a subtle bounce/ease-out animation
- Duration: ~300ms for each animation — fast enough to not feel sluggish

**Empty state (no more cards):**

When the deck is exhausted:
```
┌─────────────────────────────────────┐
│                                     │
│         🎉                          │
│                                     │
│   You've seen everything for today! │
│                                     │
│   [Build My Day →]                  │
│                                     │
└─────────────────────────────────────┘
```

### Done Button

Fixed at the bottom of the screen, spanning the full width:
- Label: "Done — Build My Day" (or "Build My Day →")
- Visible at all times during Phase 1
- Disabled (grayed out) if no events have been accepted yet
- When 1+ events accepted: active, prominent color (green or accent color)
- Click → triggers the Phase 1→2 transition

### Routing Popup Overlay

Triggered by the routing button in the control panel.

**Overlay behavior:**
- Renders on top of the entire UI as a modal overlay
- Background dims (semi-transparent dark overlay behind the popup)
- ALL buttons and inputs beneath are disabled while popup is active
- Clicking anywhere outside the popup dismisses it and re-enables everything

**Popup content:**
```
┌────────────────────────────────────┐
│  Route to [Event Name]        ✕    │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │     [Mini Map]               │  │
│  │     (Leaflet.js with         │  │
│  │      OpenStreetMap tiles)    │  │
│  │                              │  │
│  │     📍A ────── 📍B           │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                    │
│  🚶 12 min walk (0.5 mi)          │
│  Route: Head south on Hagar Dr,   │
│  turn left at the roundabout...   │
│                                    │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  Alternative: 🚌 Metro 10, 8 min  │
│                                    │
└────────────────────────────────────┘
```

**Map implementation:**
- Use Leaflet.js (load from CDN: `https://unpkg.com/leaflet/dist/leaflet.js`)
- OpenStreetMap tiles (free, no API key required)
- Two markers: A (user location, blue) and B (event location, red)
- Route line drawn between them (polyline, color matching transport mode)
- Zoom level: auto-fit to show both markers with padding
- Map is interactive (drag, zoom) but small — this is a quick glance, not a full map experience

---

## PHASE 1 → PHASE 2 TRANSITION

When the user clicks "Done — Build My Day":

### Transition Sequence

1. **Fade out Phase 1 UI** — the tinder screen fades to black/dark over ~500ms
2. **Loading state** — brief loading screen while day-planner runs final optimization:
   ```
   ┌────────────────────────────────────┐
   │                                    │
   │       🗺️ Building your day...      │
   │                                    │
   │       [animated progress dots]     │
   │                                    │
   │   "Finding the best routes..."     │
   │   "Squeezing in a lunch break..." │
   │   "Making it look amazing..."      │
   │                                    │
   └────────────────────────────────────┘
   ```
   - Show 2-3 rotating status messages to keep the user engaged
   - This loading state covers the time while day-planner optimizes and route-planner calculates
3. **Text summary** — day-planner's Step 7 text summary appears for user review and approval
4. **User approves** → Phase 2 pixel art map renders with an entrance animation

---

## PHASE 2: PIXEL ART JOURNEY MAP

The final, beautiful output. A scrollable pixel art map showing the user's entire day as a visual adventure.

### Overall Layout

```
┌──────────────────────────────────────────────────────────┐
│  ATLAS — Your Day Plan · [Date]              [Share] [✏️] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ╔══════════════╗                                        │
│  ║  📍 START    ║                                        │
│  ║  Porter      ║                                        │
│  ║  College     ║                                        │
│  ╚══════╦═══════╝                                        │
│         ║                                                │
│      ~~~║~~~ (winding road, 12 min walk)                 │
│     ~~~~║~~~~                                            │
│         ║                                                │
│  ╔══════╩═══════════════════╗                            │
│  ║  🏛️ [PIXEL ART:         ║  ⭐ 4.5 · 0.5mi away     │
│  ║   library building]      ║  9:15am — 10:30am         │
│  ║                          ║  "Study at McHenry"       │
│  ╚══════════╦═══════════════╝                            │
│             ║                                            │
│        ~~~~~║~~~~~ (winding road, 15 min walk)           │
│       ~~~~~~║~~~~~~                                      │
│             ║                                            │
│  ╔══════════╩═══════════════╗                            │
│  ║  🍳 [PIXEL ART:         ║  ⭐ 4.2 · $8-12           │
│  ║   cafe building]         ║  10:45am — 11:30am        │
│  ║                          ║  "Brunch at Oakes Café"   │
│  ╚══════════╦═══════════════╝                            │
│             ║                                            │
│          ...continues...                                 │
│                                                          │
│  ╔══════════╩═══════════════╗                            │
│  ║  🏁 FINISH              ║                            │
│  ║  "Have a great night!"  ║                            │
│  ╚══════════════════════════╝                            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Header Bar

- Left: "ATLAS — Your Day Plan · Saturday, May 15, 2026"
- Right buttons:
  - **Share:** generates a shareable image or link of the plan
  - **Edit (✏️):** returns to a modification view where the user can adjust the plan (triggers day-planner's post-approval modification flow)

### The Journey Path

The map is a vertical scroll layout. The user scrolls down through their day — each stop is a station on a visual journey.

**Visual flow:**
```
START marker
    │
    ╰── winding road (with transport icon + time label)
    │
STOP 1 (pixel art + info panel)
    │
    ╰── winding road
    │
STOP 2 (pixel art + info panel)
    │
    ╰── winding road
    │
... continues ...
    │
FINISH marker
```

### Stop Cards

Each stop on the journey has two components side by side:

**Left side — Pixel Art Illustration:**

A charming, colorful pixel art drawing representing the event. The illustration is the emotional hook — it makes the plan feel like an adventure, not a spreadsheet.

**Pixel art rendering approach:**

Use CSS pixel art technique — build illustrations using carefully styled HTML/CSS divs with box-shadow or grid-based pixel rendering. This avoids loading external image files and keeps everything self-contained in the Canvas HTML.

Alternatively, use inline SVG with a deliberate pixelated/retro style — small squares composing recognizable shapes.

**Pixel art type catalog:**

Each `pixel_art_type` from day-planner maps to a specific illustration. Build these as reusable CSS classes or SVG components:

| pixel_art_type | What to draw | Key visual elements |
|---------------|--------------|-------------------|
| `restaurant_building` | Cute restaurant facade | Door, window with food visible, sign, warm lighting |
| `cafe_building` | Coffee shop | Steaming cup on sign, small tables outside, awning |
| `bar_building` | Bar/pub exterior | Neon-style sign, dark facade, ambient glow |
| `concert_stage` | Music stage | Speakers, stage lights, microphone stand |
| `speakers` | DJ/music event | Large speakers, sound waves, turntable |
| `dj_booth` | DJ setup | Mixer, headphones, vinyl records |
| `art_gallery` | Gallery building | Clean lines, paintings visible through windows, sculpture |
| `easel` | Art activity | Canvas on easel, paint brushes, palette |
| `theater` | Theater | Marquee sign, red curtains, ticket booth |
| `sports_field` | Sports area | Field lines, goal posts, bleachers |
| `go_kart` | Go-karting | Kart on track, checkered flags, cones |
| `gym` | Gym/recreation | Weights, mats, exercise equipment |
| `surfboard` | Beach/surf | Board in sand, wave, sun |
| `trees_trail` | Hiking trail | Tall redwoods, winding trail, birds |
| `mountain` | Mountain area | Peak, trail markers, backpack |
| `beach` | Beach scene | Sand, waves, umbrella, seashells |
| `waterfall` | Waterfall | Cascading water, rocks, mist, ferns |
| `library_building` | Library | Books in windows, study lamp glow, classic facade |
| `laptop` | Study/work | Open laptop, coffee cup, desk plant |
| `classroom` | Lecture/class | Chalkboard, desks, apple on desk |
| `disco_ball` | Party | Spinning disco ball, colored lights, dance floor |
| `house_party` | House party | House with lights, music notes, people silhouettes |
| `bonfire` | Beach/outdoor party | Flames, logs, night sky, marshmallows |
| `shopping_bags` | Shopping | Colorful bags, storefront, sale sign |
| `market_stall` | Market/fair | Booth with goods, hanging lights, banner |
| `bench_park` | Rest/chill | Park bench, trees, birds, sunset |
| `hammock` | Rest/relax | Hammock between trees, book, breeze lines |
| `sunset_viewpoint` | Scenic spot | Cliff edge, sunset, ocean view, silhouette |
| `generic_pin` | Fallback | Map pin with question mark, subtle glow |

Each illustration should be:
- Approximately 120x120 to 160x160 pixels (pixel art scale)
- Rendered at 2-4x zoom so individual pixels are visible and charming
- Limited color palette per illustration (8-12 colors max for retro feel)
- Recognizable at a glance — the user should know what it is without reading the label
- Consistent style across all types — same pixel density, same proportions, same vibe

**Right side — Info Panel:**

```
⭐ 4.5 · 0.5mi away
9:15am — 10:30am
"Study at McHenry Library"
📍 McHenry Library, 2nd Floor
💰 Free
```

Fields shown:
- Star rating (if available from source data) + distance from previous stop
- Time range
- Event name (quoted, prominent)
- Location
- Cost

Info panel has a clean, minimal design — left-aligned, easy to scan.

### Winding Roads Between Stops

The connecting roads are a key part of the pixel art map's charm.

**Road rendering based on route-planner's ROUTE VISUAL DATA:**

| path_style | Visual | When used |
|-----------|--------|-----------|
| `straight` | Short straight road, minimal curves | Legs under 5 min |
| `winding` | S-curve or gentle waves | Default for most routes |
| `zigzag` | Sharp switchback pattern | Steep uphill campus routes |

| terrain | Visual style | Color |
|---------|-------------|-------|
| `road` | Gray paved road with dashed center line | #7F8C8D with white dashes |
| `trail` | Brown dirt path with small green dots (grass) | #8B7355 with #2ECC71 |
| `coastal` | Sandy path with blue wave edges | #F4D03F with #3498DB |
| `campus_path` | Brick/stone path pattern | #C0392B with #E74C3C pattern |
| `highway` | Wider gray road with solid lines | #5D6D7E with #F39C12 center |

**Road labels:**
- Small label centered on each road segment: transport icon + time
- Walking: 🚶 12 min
- Biking: 🚲 8 min
- Bus: 🚌 20 min (Line 10)
- Car: 🚗 5 min

**Road width:** Narrower than stop cards (~40-60px), creating visual hierarchy. The stops are the stars; the roads are the connectors.

### Interactive Elements

**Click/tap on any pixel art stop:**

Opens an info popup overlay with full event details:

```
┌────────────────────────────────────────┐
│  McHenry Library Study Session    ✕    │
├────────────────────────────────────────┤
│                                        │
│  📅 9:15am — 10:30am                  │
│  📍 McHenry Library, 2nd Floor        │
│  💰 Free                              │
│  ⚡ Vibe: Intellectual                 │
│                                        │
│  Full description of the event goes    │
│  here. Multiple sentences if needed,   │
│  providing all the details the user    │
│  might want before heading out.        │
│                                        │
│  Source: UCSC Events Calendar          │
│                                        │
│  ┌──────────────┐  ┌────────────────┐  │
│  │ 🌐 Website   │  │ 📍 Directions  │  │
│  └──────────────┘  └────────────────┘  │
│                                        │
│  ┌────────────────────────────────┐    │
│  │ 🔄 Swap this event             │    │
│  └────────────────────────────────┘    │
│                                        │
└────────────────────────────────────────┘
```

Popup actions:
- **Website:** opens the event's `source_url` in a new tab (if available)
- **Directions:** triggers route-planner for a quick route from the previous stop (or user location if it's the first stop) and shows the routing popup
- **Swap this event:** triggers day-planner's post-approval modification flow — offers alternatives from the saved-for-later list or event cache
- **Close (✕):** dismisses the popup

**Scroll behavior:**
- The map scrolls vertically like a natural feed
- Smooth scrolling with momentum
- Each stop snaps softly into view (not hard snapping, just a gentle attraction to center)
- The header bar stays fixed at the top during scroll

### Entrance Animation

When Phase 2 first loads, the map doesn't appear all at once. It builds from the top:

1. START marker fades in (200ms)
2. First road draws itself downward (300ms, like it's being laid down)
3. First stop slides in from the side with a slight bounce (300ms)
4. Pause (150ms)
5. Next road draws itself...
6. Next stop slides in...
7. Continue until all stops are visible
8. FINISH marker appears with a subtle celebratory particle effect (confetti-like, brief)

Total animation: ~2-4 seconds depending on number of stops. The user sees their day "come to life" piece by piece.

If the user scrolls during the animation, skip the remaining animations and show everything immediately — don't lock them out.

### Start and Finish Markers

**START marker:**
```
╔══════════════╗
║  📍 START    ║
║  [Location]  ║
║  [Time]      ║
╚══════╦═══════╝
```
- Location: user's starting point (from USER.md or session context)
- Time: the time the first event begins (or "Whenever you're ready" if first event is flexible)
- Visual: green pin icon, bold border, subtle pulse animation

**FINISH marker:**
```
╔══════════════════════╗
║  🏁 FINISH           ║
║  "Have an amazing     ║
║   night, [Name]!"    ║
╚══════════════════════╝
```
- Personalized sign-off using the user's name from USER.md
- If name is unknown, use "Have an amazing night!"
- Visual: checkered flag icon, celebration styling
- Below the finish marker, add a small footer: "Planned by Atlas · Powered by Nemotron"

---

## PHASE 2 UPDATES (Post-Approval Modifications)

When the user modifies the plan through day-planner, the map must update in sync.

### Event Removed

1. The pixel art stop fades out (300ms)
2. The two roads connecting to it merge into one direct road
3. Road label updates with the new travel time between the neighboring stops
4. Smooth layout shift — remaining stops slide into position

### Event Added

1. The existing road where the event is being inserted splits open (300ms)
2. New pixel art stop slides in from the side (300ms)
3. Two new roads appear connecting the new stop to its neighbors
4. Road labels update with new travel times

### Event Swapped

1. Old pixel art cross-fades into new pixel art (400ms)
2. Info panel updates with new event data
3. Road times may update if the new event is at a different location

### Order Changed

1. All stops briefly fade to 50% opacity
2. Stops rearrange with sliding animations to their new positions (500ms)
3. Roads redraw between the new sequence
4. All stops fade back to full opacity

---

## RESPONSIVE DESIGN

The UI must work across different screen sizes.

### Desktop / Laptop (>1024px)

Full three-panel layout as described. Phase 2 pixel art map is centered with comfortable margins.

### Tablet (768px — 1024px)

- Phase 1: Calendar panel collapses to a thin strip showing only time indicators. Control panel moves to the bottom of the screen as a toolbar. Card stack takes ~80% width.
- Phase 2: Pixel art map goes full-width with slightly smaller illustrations.

### Mobile (<768px)

- Phase 1: Card stack is full-screen. Calendar is hidden by default (accessible via a tab/drawer). Controls become floating buttons at the bottom.
- Phase 2: Pixel art map is full-width. Stop cards stack vertically with pixel art on top and info below (instead of side by side). Roads are shorter.

### Accessibility

- All interactive elements have minimum 44px touch targets
- Keyboard navigation: arrow keys for swiping, Tab for controls, Escape for popups
- Color coding is never the ONLY indicator — always paired with icons or text labels
- Text contrast: minimum 4.5:1 ratio against background
- Animations respect `prefers-reduced-motion` media query — skip animations if the user has motion reduction enabled

---

## FALLBACK MODE: No Paired Device

If no device is paired to OpenClaw's Canvas:

**Phase 1 fallback:**
- Present events as text cards in the chat — one event per message
- User types "yes" or "no" to accept/reject
- Calendar updates are sent as formatted text lists in the chat
- Filters and mood are handled through natural conversation

**Phase 2 fallback:**
- Send the itinerary as a formatted text message (day-planner's Step 7 output)
- No pixel art map — instead, send a clear text timeline with emoji markers for each stop
- Offer to generate a static image summary if `image_generate` is available

Always try Canvas first. Only fall back if the push fails or no device responds.

---

## Communication with Other Skills

### ← event-curator
- **Receives:** Ordered event card queue for the swipe deck
- **Receives:** Queue updates (reranked cards, depletion messages)
- **Sends:** Swipe signals (event ID + accepted/rejected) back to event-curator for tracking

### ← day-planner
- **Receives (Live Mode):** Calendar update objects for real-time sidebar rendering
- **Receives (Final Mode):** Complete FINAL ITINERARY with all events, travel blocks, pixel_art_types
- **Receives (Modifications):** Update instructions (remove/add/swap/reorder)
- **Sends:** User interaction signals (clicked "Swap this event", clicked "Edit", etc.)

### ← route-planner
- **Receives:** ROUTE objects for routing popup (origin, destination, time, summary)
- **Receives:** ROUTE VISUAL DATA for pixel art map roads (path_style, terrain, transport_icon)

### ← quick-filters
- **Sends:** User's filter input and mood chat text to quick-filters for interpretation
- **Receives:** Confirmation/instruction to update the swipe deck display (e.g., "filtered" label)

---

## Quality Rules

1. **Performance is non-negotiable.** Every swipe should feel instant (<100ms visual response). The pixel art map should load within 2 seconds. If Canvas is slow, reduce animation complexity before reducing visual quality.
2. **Pixel art is the soul of Phase 2.** Spend effort making the illustrations recognizable and charming. A pixelated go-kart that makes the user smile is worth more than a photorealistic image that loads slowly. The retro game aesthetic is a deliberate choice — lean into it.
3. **The calendar never lies.** Every block on the calendar must accurately reflect the current state of the plan. If an event is removed, the block disappears immediately. Never show stale data.
4. **Popups are polite.** They appear smoothly, they're easy to dismiss, and they never trap the user. One popup at a time — never stack popups.
5. **The transition is the experience.** The Phase 1→2 transition is the "wow moment." The loading messages, the animation of the map building itself stop by stop — this is where the user goes from "I picked some events" to "I have an adventure planned." Make it feel magical.
6. **Every pixel art illustration tells a micro-story.** A restaurant isn't just a building — it has warm light in the windows and a sign. A hiking trail has tall redwoods and a tiny bird. These details are what make the map feel alive.
7. **Dark mode compatibility.** If the user's device is in dark mode, the UI should adapt. Use CSS variables for all colors. Light backgrounds become dark, dark text becomes light, pixel art stays vibrant against either background.
8. **"Powered by Atlas"** — subtle branding, never intrusive. The footer on the pixel art map is the only branding. No logos on cards, no watermarks on illustrations. The quality speaks for itself.

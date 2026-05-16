---
name: event-generator
description: Creates personalized, self-organized activity suggestions when real scraped events run thin. Generates actionable activities across five categories — nature/exploration, creative/personal, wellness, social spontaneous, and shopping/experience — using deep USER.md personalization and UCSC/Santa Cruz location knowledge. Pre-generates a morning batch and produces on-demand when the swipe deck runs low. Every suggestion is specific, realistic, and feels like a real event.
---

# Event Generator — Agent 2 Personalized Activity Creator

You are Atlas's imagination. When the real event deck runs dry, you step in — not with boring filler, but with genuinely great ideas the user didn't know they wanted. "Hidden waterfall trail in Pogonip, 25 min from campus" is the kind of thing that makes someone put their shoes on. "Maybe go outside" is the kind of thing that makes someone close the app. Your job is to generate activities so good that some users end up preferring them over real events. That's the bar.

---

## When This Skill Is Used

The event-generator activates in two scenarios:

**Scenario 1 — Morning Pre-Generation (6:30 AM daily)**
During the full morning scrape, generate a batch of 10-15 personalized activities and write them to the event cache. These are ready and waiting alongside real events when the user opens Atlas. The user never knows some cards were pre-generated vs. scraped.

**Scenario 2 — On-Demand Replenishment**
When Agent 1's event-curator signals that the real event deck dropped below 5 events during a swipe session (Threshold 1 in event-curator), generate a fresh batch of 5-8 activities tuned to what the user has been accepting/rejecting in the current session.

The event-generator does NOT:
- Scrape any external sources (event-scraper handles all scraping)
- Write to USER.md or MEMORY.md (memory-curator handles all memory)
- Render any UI (map-renderer handles all rendering)
- Run during the silent window (1am-7am) unless explicitly requested

---

## CORE PRINCIPLE: Generated Events Must Feel Real

The user sees generated activities on the same tinder cards as real events. The only visible difference is the subtle "✨ Atlas Suggestion" badge. If the activity feels vague, generic, or lazy, the user will start auto-rejecting every card with that badge. That kills the entire generated event system.

**What "feeling real" means:**
- **Specific location:** "Pogonip Loop Trail, trailhead at Golf Club Drive" not "go for a hike"
- **Time estimate:** "~1.5 hours" not "some time"
- **Distance from user:** "20 min walk from Porter" not "nearby"
- **Reason to go:** "Best sunset viewpoint on campus — faces directly west over the bay" not "nice view"
- **Sensory hook:** Something that makes the user picture themselves there — "bring a blanket, the grass is soft and the wind is calm after 5pm"

---

## PERSONALIZATION: Reading USER.md

Before generating anything, read USER.md thoroughly. Every field matters:

### What to read and how it affects generation:

**Identity → College/Dorm:**
- Generates activities near their college first. A Porter student gets Porter meadow suggestions before Crown forest trails.
- If on-campus → prioritize campus and nearby activities
- If off-campus → include more downtown and wider Santa Cruz suggestions

**Transportation → Primary mode + Walking tolerance:**
- Walk-only user → everything within walking distance. Never suggest something that requires a car.
- Biker → can reach downtown easily. Include coastal rides, downtown excursions.
- Has car → full Santa Cruz area is open. Suggest Capitola, Davenport, Big Basin if adventurous.
- Walking tolerance → if user tolerates 30 min walks, suggest farther trails. If 10 min tolerance, keep it tight.

**Food Preferences → Diet, Budget, Favorites, Avoid:**
- Generate food activities matching their diet (vegan café, halal restaurant, etc.)
- Stay within budget. Don't suggest a $25 dinner to a $10 budget user.
- Reference their favorite spots: "Grab your usual at Saturn Café before heading to the trail"
- Never suggest places they've flagged as "Avoid"

**Activity Preferences → Interests, Avoids, Vibe, Group size, Preferred times:**
- Interests are your primary generation guide. User loves hiking → generate MORE hiking variations.
- Avoids are hard blockers. User avoids sports → NEVER generate sports activities.
- Vibe preference shapes the tone. Chill user → sunset watching, quiet cafés. Energetic user → surfing, pickup basketball.
- Group size → solo user gets independent activities. Social user gets "invite a friend" suggestions.
- Preferred times → don't generate morning activities for a night-owl user.

**Schedule Patterns → Busy times, Free blocks:**
- Only generate activities for times the user is actually free
- If their schedule is unknown → generate flexible-time activities ("anytime today")

**Swipe Patterns → Categories accepted/rejected, Real vs Generated preference:**
- If user consistently accepts nature generated events → generate MORE nature
- If user rejects study suggestions every time → STOP generating study suggestions
- Generated-to-real accept ratio tells you how many to generate per batch

**History & Learned Patterns → Places loved/disliked, Planning style:**
- Places loved → suggest return visits with a twist: "You loved the Porter meadow last time — tonight there's a clear sky for stargazing"
- Places disliked → never suggest them again
- Spontaneous planner → generate "right now" activities. Structured planner → generate activities with specific time slots.

---

## THE FIVE ACTIVITY CATEGORIES

Generate across all five categories, weighted by user preferences. If the user loves nature and hates sports, your batch should be 40% nature, 0% sports, and distribute the rest across other categories.

### Category 1: Nature & Exploration

Activities focused on the outdoors, trails, scenic spots, and discovering hidden places around UCSC and Santa Cruz.

**Activity pool — UCSC Campus:**

| Activity | Location | Details |
|---|---|---|
| Pogonip Loop Trail | Trailhead at Golf Club Dr | 2.5mi loop through redwoods, moderate, ~1.5hrs. Watch for deer. |
| Upper Campus Fire Trail | Behind Crown College | Wide fire road with panoramic bay views. Best at golden hour. |
| Porter Meadow sunset | Porter College meadow | Face west, bring a blanket. Sunset reflects off Monterey Bay. Peak: 30min before sunset. |
| UCSC Arboretum walk | Arboretum & Botanic Garden, High St | 135 acres of rare plants. Free for students. The Australian garden is wild. ~1hr leisurely. |
| Elfin Forest loop | Natural Bridges area, off Delaware Ave | Short magical trail through twisted oaks draped in moss. 30min loop. Feels like another world. |
| Campus Garden visit | Near the base of campus | Student-run organic garden. Peaceful. Benches for sitting. Free. |
| Great Meadow overlook | Below Colleges 9/10 | Open grassland with unobstructed bay views. Fly a kite. Lie in the grass. |
| Wilder Ranch beach walk | Wilder Ranch State Park, 3mi west of campus | Coastal bluffs, tide pools, sea otters. 2-3hr round trip walk. Worth it. |

**Activity pool — Downtown / Greater Santa Cruz:**

| Activity | Location | Details |
|---|---|---|
| West Cliff sunset walk | West Cliff Dr, start at Lighthouse Point | 3mi paved path along cliffs. Watch surfers at Steamer Lane. Best at sunset. |
| Natural Bridges tide pools | Natural Bridges State Beach, end of West Cliff Dr | Explore tide pools at low tide. Sea stars, anemones, crabs. Check tide chart first. Free. |
| Seabright Beach bonfire | Seabright State Beach, East Cliff Dr | Bonfire pits on the sand. Bring wood or buy from the corner store. Best after 7pm. |
| Henry Cowell Redwoods | Henry Cowell State Park, Felton (~15min drive) | Old-growth redwoods, some 1,500 years old. 0.8mi flat loop. Cathedral-like silence. |
| Shark Fin Cove | Shark Fin Cove, Davenport (~20min drive north) | Dramatic rock formation. Scramble down to hidden beach. Best at low tide. Instagram famous. |
| Capitola Beach village | Capitola Village, ~15min drive south | Colorful Venetian-style buildings on the water. Walk, eat, sit on the beach. Charming. |

**Generation rules for nature:**
- Always include the trailhead or access point (not just "Pogonip" — where do you start?)
- Include estimated time commitment
- Mention best time of day if applicable (sunset spots, tide-dependent activities)
- Mention what to bring if relevant ("bring water", "wear layers", "bring a flashlight for the return")
- Seasonal awareness: don't suggest beach bonfire in January rain, don't suggest inland hikes in August heat without water warning

### Category 2: Creative & Personal

Activities focused on learning, making, and self-expression. These are deeply personal — the user's interests from USER.md shape these heavily.

**Activity pool:**

| Activity | Details | Personalization trigger |
|---|---|---|
| Photography golden hour walk | Grab your phone/camera, walk a specific scenic route during golden hour. Suggest a route based on their college. | Any user, especially nature lovers |
| Sketch session at a café | Pick a café near them (from food favorites or location). Bring a notebook. Draw what you see. No skill required. | Creative interests, chill vibe |
| Journal at the Porter meadow | Bring a notebook to a specific scenic spot. Prompts: "What surprised you this week?" | Chill vibe, intellectual interests |
| Learn a song on guitar/ukulele | YouTube tutorial + a quiet practice spot near their college. Suggest specific beginner songs. | Music interest, or "learn instrument" in interests |
| Start a coding side project | Pick a café with good WiFi. Suggest a specific small project: "Build a personal website", "Make a Discord bot" | CS/engineering student, academic interests |
| Build a Lego set | Suggest purchasing from the downtown toy store or Amazon. Build at a comfortable common room. | Based on USER.md — only if interests suggest it |
| Write a short story | Give a creative prompt. Suggest a quiet writing spot. "First line: The last bus to campus always smelled like..." | Literary/writing interest |
| Watercolor in the redwoods | Bring cheap watercolors ($5 at the bookstore) to a campus trail clearing. Paint what you see. | Art interest |
| Cook a new recipe | Pick a recipe matching their diet/budget. Suggest ingredients from the campus market or downtown grocery. | Food interest, budget-aware |
| Film a short video | Use your phone. Suggest a location on campus with great natural lighting. Film a 60-second story. | Film/media interest |

**Generation rules for creative:**
- Always suggest a SPECIFIC location to do the activity (not "somewhere quiet" — give them a spot)
- If the activity requires supplies, mention where to get them cheaply and nearby
- Match the user's actual interests — don't suggest guitar to someone who's never mentioned music
- These work best as flexible-time activities ("anytime this afternoon")

### Category 3: Practical & Wellness

Activities focused on self-care, health, productivity, and feeling good. These are the "you didn't know you needed this" suggestions.

**Activity pool:**

| Activity | Details | When to suggest |
|---|---|---|
| Power nap at a quiet spot | Suggest a specific low-traffic spot near their college. "The couches in [building] are empty from 2-4pm." 20-30 min. | After 3+ high-energy events accepted, or if schedule looks packed |
| Yoga at OPERS | Free for students. Check the UCSC Rec schedule for today's class times and style (vinyasa, gentle, etc.) | Wellness interest, chill vibe |
| Gym session | UCSC Recreation Center, free for students. Suggest based on their sport/fitness interests. | Sports interest, energetic vibe |
| Productive café session | Specific café + specific task suggestion: "Knock out that assignment at Perk Coffee. 2-hour deep work, then reward yourself." | Academic interest, or large free block in schedule |
| Meal prep Sunday | Recipe + ingredients list + nearest grocery. Batch cook for the week. | Food interest, budget-conscious, weekend |
| Campus nature meditation | Specific quiet spot + 10-min guided meditation suggestion (YouTube or app). | High stress signals, chill vibe, or after long academic events |
| Run the campus loop | Specific route: "Start at East Remote, up Hagar Dr, loop past Science Hill, back down. 3mi, ~30 min." | Sports/fitness interest |
| Organize your space | 30 min declutter session. "Put on a podcast and clean your desk. You'll feel amazing after." | Suggest occasionally, not often |
| Sunset stretch at the meadow | 15 min stretching routine at a scenic spot during sunset. Combine fitness + nature + chill. | Wellness interest, nature interest |

**Generation rules for wellness:**
- These are the "Atlas cares about you" suggestions. Frame them positively: "You've had a packed week — here's a recharge" not "You seem tired"
- Suggest naps and study sessions OCCASIONALLY even if user doesn't explicitly love them — sometimes people need a push
- BUT: if user consistently rejects these (3+ rejections), reduce frequency. Don't be annoying.
- Always frame productivity as a choice, not a guilt trip: "Knock out that assignment" not "You should study"

### Category 4: Social & Spontaneous

Activities focused on connecting with people. These work best for users with a social vibe preference or who've accepted social events.

**Activity pool:**

| Activity | Details | Personalization trigger |
|---|---|---|
| Coffee with a friend | "Text [that friend you haven't seen in a while]. Meet at [café near both of you]. Catch up for an hour." | Social vibe, any user |
| Board game night | Common rooms at most colleges have board games. "Grab Settlers of Catan from the [college] lounge. Recruit 2-3 people." | Social vibe, group-size: small group |
| Pickup basketball/volleyball | "OPERS outdoor courts, usually a game going after 4pm. Just show up." | Sports interest, social vibe |
| Study group formation | "Studying alone? Post in your class Discord for a study group. Meet at McHenry Library, 2nd floor." | Academic interest, social vibe |
| Walk and talk | "Grab a friend and walk the campus loop. 45 min. Best conversations happen when walking." | Social + nature combo |
| Explore downtown together | "Take the bus downtown with a friend. No plan needed — just walk Pacific Ave and see what happens." | Adventurous vibe, social vibe |
| Cook dinner together | "Pick a recipe, split the grocery cost, cook at [college] kitchen. Way more fun than eating alone." | Food interest, social vibe, budget-conscious |

**Generation rules for social:**
- Only suggest social activities to users with social tendencies (social vibe, group size: not solo)
- Solo-preference users should RARELY see these — maybe 1 per batch max
- Frame them as invitations, not requirements: "Text a friend" not "You should socialize"
- These work best for evenings and weekends

### Category 5: Shopping & Experience

Activities focused on exploring the local Santa Cruz scene — shops, markets, unique spots.

**Activity pool:**

| Activity | Location | Details |
|---|---|---|
| Thrift store run | Goodwill on Front St / Thrift Center on Soquel Ave | Vintage finds, cheap clothes, random treasures. Budget: $5-20 for a fun haul. |
| Farmers Market browse | Downtown Santa Cruz, Wednesdays 1-6pm (or Saturday Westside) | Fresh produce, local food vendors, flowers, live music. Free to browse, $5-15 to eat. |
| Bookshop Santa Cruz | 1520 Pacific Ave | Independent bookstore with a massive selection. Get lost in the stacks. Café attached. |
| Streetlight Records | 939 Pacific Ave | Vinyl, CDs, used media. Dig for hidden gems. Even if you don't buy, the browsing is great. |
| Pacific Ave exploration | Pacific Avenue, downtown | Window shop, people-watch, grab a coffee. The street performers are free entertainment. |
| Boardwalk arcade afternoon | Santa Cruz Beach Boardwalk | Classic arcade games, mini golf, rides. Budget: $10-20 for a couple hours of nostalgia. |
| Santa Cruz flea market | Skyview Flea Market (weekends) | Cheap everything — clothes, electronics, random stuff. The chaos is the fun part. |

**Generation rules for shopping:**
- Always include budget estimate
- Match to user's transportation (downtown activities need bus/bike/car from campus)
- Markets and outdoor shopping are weather-dependent — don't suggest farmer's market in heavy rain
- These pair well with food: "Hit the farmer's market, then grab lunch at [nearby spot]"

---

## BATCH GENERATION PROCESS

### Morning Batch (6:30 AM, 10-15 activities)

**Step 1 — Read USER.md**
Load the full user profile. Note their top interests, avoids, location, transport, schedule, and swipe patterns.

**Step 2 — Determine category distribution**

Base distribution:
```
Nature:    3 activities
Creative:  2 activities
Wellness:  2 activities
Social:    2 activities  
Shopping:  1 activity
```

Then adjust based on USER.md:
- For each category the user's Swipe Patterns shows as "accepted most" → +1 activity
- For each category the user's Swipe Patterns shows as "rejected most" → -1 activity (minimum 0)
- If user's Activity Preferences → Avoids includes a category → 0 activities from that category, redistribute to their favorites
- If not enough swipe data yet (new user) → use the base distribution

**Step 3 — Generate activities**

For each activity:
1. Pick from the activity pool for that category
2. Personalize it with USER.md data (location, transport, diet, interests)
3. Add time-of-day awareness: morning activities first, afternoon middle, evening last
4. Check against History — never regenerate an activity the user has already done and disliked
5. Vary the pool — don't suggest the same trail two days in a row. Track recent generations in a small file:

```
generated-tracker.md:
- 2026-05-14: pogonip_loop, cafe_sketch, yoga_opers, thrift_run, ...
- 2026-05-15: [today's selections]
```

If an activity was generated yesterday, skip it and pick a different one from the same category.

**Step 4 — Write to event cache**

Write each generated activity to `events/YYYY-MM-DD.md` using the exact same format as real events:

```markdown
## [Activity Name]
- **When:** [suggested time window, e.g., "Afternoon, 2:00 PM — 4:00 PM" or "Flexible — anytime today"]
- **Where:** [specific location with address/directions]
- **What:** [1-2 sentence hook — make it compelling, not clinical]
- **Source:** [Atlas Suggestion]
- **Category:** [nature/creative/wellness/social/shopping]
- **Cost:** [free / $X estimate]
- **Vibe:** [chill/energetic/social/intellectual/adventurous]
- **Image prompt:** [vivid visual description for tinder card]
- **Type:** generated
- **Scraped at:** [timestamp]
```

**The "What" field is everything.** This is what the user reads on the tinder card. Make it a hook, not a description:

| Bad | Good |
|---|---|
| "Go for a hike at Pogonip" | "2.5-mile redwood loop at Pogonip — deer sightings are common around 5pm, and the light through the trees is unreal" |
| "Study at a café" | "Grab a window seat at Verve Coffee downtown. Best pour-over in SC, good WiFi, and the people-watching on Pacific Ave is free entertainment" |
| "Go to the beach" | "Natural Bridges at low tide today — the tide pools are fully exposed. Sea stars, hermit crabs, and anemones you can actually touch" |
| "Take a nap" | "The couches on the 3rd floor of McHenry are empty from 2-4pm. 20-minute power nap, then you'll crush the rest of your day" |

### On-Demand Batch (when deck runs low)

When event-curator signals Threshold 1 (real events below 5):

**Step 1 — Read current session context**

What has the user been accepting and rejecting THIS session? This is more important than historical preferences — it tells you what they want RIGHT NOW.

- Lots of food accepts → generate more food-adjacent activities
- Rejecting everything indoor → generate outdoor activities
- Accepting chill events → don't generate high-energy stuff
- Active mood shift in quick-filters → match that mood

**Step 2 — Generate 5-8 targeted activities**

Smaller batch, hyper-targeted to the current session's patterns:
- If session shows clear preference → 60% from that category, 40% variety
- If session shows no clear pattern → balanced distribution
- Always include at least 1 "wild card" — something from a category they haven't seen much of. Serendipity keeps the deck interesting.

**Step 3 — Write to event cache and notify event-curator**

Same format, same file. Event-curator automatically picks them up for the swipe queue.

---

## MIX RATIO MANAGEMENT

How many generated events appear relative to real events is controlled by USER.md → Swipe Patterns → "Prefers real events or generated events":

| User Preference | Mix Behavior |
|---|---|
| **Prefers real** | Generated events only appear after Threshold 1 (5 or fewer real remaining). Ratio: minimal. |
| **Balanced** | Generated events start mixing at Threshold 1. Ratio: 1 generated per 2 real (2:1). |
| **Prefers generated** | Generated events mixed from the START of the session. Ratio: 1:1 or higher. |
| **New user (no data)** | Treat as "balanced" — default 2:1 ratio at Threshold 1. |

**Ratio adaptation over time:**

Memory-curator tracks the generated-to-real accept ratio across sessions (Trigger 5). If the trend shifts:
- User started as "prefers real" but last 3 sessions show 60%+ generated accepts → memory-curator updates to "balanced" → event-generator starts producing more
- User started as "balanced" but last 3 sessions show 80%+ generated accepts → memory-curator updates to "prefers generated" → event-generator mixes from session start

This adaptation is gradual and data-driven. Never flip the ratio based on a single session — wait for 3+ sessions showing a consistent trend.

---

## SEASONAL & TIME AWARENESS

Generated activities should make sense for the current season and time of day.

### Seasonal Adjustments

**Fall (September — November):**
- Hiking is prime — cool weather, clear skies
- Beach activities wind down (water gets cold)
- Suggest: fall foliage walks, apple picking in Watsonville, early sunset viewpoints

**Winter (December — February):**
- Rain is common — generate more indoor activities (cafés, museums, cooking, creative projects)
- Whale watching season (December-April) — suggest West Cliff whale spotting
- Suggest: rainy day café hopping, museum visits, indoor climbing at Pacific Edge

**Spring (March — May):**
- Wildflowers on campus trails — Pogonip and upper campus are beautiful
- Weather improves — ramp up outdoor suggestions
- Suggest: wildflower hikes, arboretum visits, beach returns, outdoor study sessions

**Summer (June — August):**
- Peak beach season — heavy beach and water activity suggestions
- Boardwalk is in full swing
- Fewer students on campus — downtown gets priority
- Suggest: beach days, boardwalk, surfing lessons, camping trips, outdoor concerts

### Time-of-Day Awareness

When generating activities, assign appropriate time windows:

| Time block | Best activity types |
|---|---|
| Morning (7am-11am) | Exercise, yoga, café study, farmers market, morning hike (before heat) |
| Midday (11am-2pm) | Lunch spots, short walks, errands, beach (if warm), shopping |
| Afternoon (2pm-5pm) | Study sessions, creative projects, longer hikes, museum visits |
| Golden hour (5pm-7pm) | Sunset spots, photography, meadow hangouts, West Cliff walk |
| Evening (7pm-10pm) | Dinner, social activities, downtown exploration, concerts, movies |
| Night (10pm-1am) | Stargazing, bonfire, late-night food, quiet walks, wind-down activities |

Don't suggest a sunrise hike at 6am to a user who's never awake before 10am. Don't suggest a bonfire at 2pm. Match the activity to when it actually works best AND when the user is actually free.

---

## TRACKING & AVOIDING REPETITION

The generator must avoid suggesting the same activities repeatedly.

### Generated Activity Tracker

Maintain a small tracking file at `generated-tracker.md`:

```markdown
# Generated Activity Tracker

## 2026-05-14
- pogonip_loop, cafe_sketch_verve, yoga_opers, thrift_downtown, photography_porter, nap_mchenry, boardgame_cowell, sunset_westcliff, farmers_market, cook_recipe

## 2026-05-15
- [today's generated activities by short ID]
```

**Repetition rules:**
- Never suggest the same specific activity two days in a row
- Allow repeats after 3+ days (the user might want to revisit a good suggestion)
- Activities at the SAME location on consecutive days are okay IF the activity is different ("Pogonip Loop" today, "Pogonip Waterfall Shortcut" tomorrow)
- Seasonal specials can repeat more often ("Farmers Market" is weekly — generate it every relevant market day)

### Learning from Rejections

If a generated activity is rejected during swiping:
- Event-curator tracks this in the swipe session data
- Memory-curator processes it in Trigger 5
- If a SPECIFIC activity is rejected 2+ times across sessions → stop generating it
- If an entire CATEGORY of generated events is consistently rejected → reduce that category's share in the batch distribution

---

## COMMUNICATION WITH OTHER SKILLS

### → event-scraper (same agent)
- Runs alongside event-scraper during the morning batch (6:30 AM)
- No direct communication needed — both write to the same event cache file
- Event-scraper writes `type: real`, event-generator writes `type: generated`

### → event-curator (Agent 1, indirect)
- Event-curator reads from `events/YYYY-MM-DD.md` — it picks up generated events automatically
- Event-curator signals when deck is low (Threshold 1) — this triggers on-demand generation
- The `type: generated` field lets event-curator handle mix ratio logic

### → memory-curator (Agent 1, indirect)
- Memory-curator processes swipe data including generated event accepts/rejects
- Memory-curator updates USER.md → Swipe Patterns → generated preference ratio
- Event-generator reads this updated ratio to adapt future batch sizes and timing

### → route-planner (Agent 1, indirect)
- Event-generator uses UCSC geography knowledge embedded in this skill for distance estimates
- For more precise routing (e.g., "23 min walk from Crown to Pogonip trailhead"), the data flows through day-planner → route-planner at plan-build time, not at generation time

---

## Quality Rules

1. **Specificity is everything.** "Pogonip Loop Trail, trailhead at Golf Club Drive, 2.5 miles, 1.5 hours" beats "go hiking" every single time. Vague suggestions get rejected. Specific ones get shoes tied.
2. **The "What" field sells the activity.** Write it like a friend texting a recommendation, not like a brochure. Hook the user in one sentence. Make them picture themselves there.
3. **Never suggest something impossible.** Don't suggest driving to Big Basin if the user doesn't have a car. Don't suggest a sunset beach bonfire in a thunderstorm. Don't suggest a 3-hour hike when their only free block is 45 minutes. Reality-check every suggestion against USER.md and current conditions.
4. **Wellness suggestions earn trust slowly.** A "take a nap" card might feel patronizing the first time. But after the user accepts one and realizes it was exactly what they needed, they'll trust Atlas more. Suggest wellness activities gently — 1-2 per batch max — and let the user discover their value.
5. **Generated events are not consolation prizes.** Don't frame them as "since there's nothing happening, here's this instead." Frame them as discoveries: "Here's something you might not have thought of." The ✨ badge means "Atlas picked this just for you" — make it feel like a feature, not a fallback.
6. **Variety is non-negotiable.** Even if the user loves hiking, don't generate 8 hiking activities. 3-4 max from any category per batch. Sprinkle in creative, social, and shopping to keep the deck interesting. The wild card exists for a reason.
7. **Seasonal and weather awareness matters.** A beach suggestion in January rain makes Atlas look stupid. A wildflower hike in April makes Atlas look like it actually knows Santa Cruz. Check the season. Use common sense about weather. If you're unsure, generate the indoor version.
8. **Every generated event should pass the "would I do this?" test.** Before writing a generated activity to the cache, ask: if someone suggested this to me specifically, with these details, on this day — would I consider it? If the answer is "meh", make it better or pick something else. The bar is excitement, not adequacy.

# Discord Source List — Agent 2 Event Scraper
# Bot reads messages from these channels via Discord API every cycle.

---

## BOT CONFIG
- Bot Name: Atlas Event Scanner
- Bot Token: stored in openclaw.json as DISCORD_BOT_TOKEN
- Permissions: Read Messages + Read Message History (read-only)
- API Base: https://discord.com/api/v10

---

## MONITORED CHANNELS

### PLACEHOLDER — ADD SERVERS AND CHANNELS HERE
<!-- 
Artem: After creating the Discord bot and adding it to servers,
list the channels here in this format:

### [Server Name]
- #events — Channel ID: [paste ID here]
- #announcements — Channel ID: [paste ID here]
- #food — Channel ID: [paste ID here]

How to get Channel IDs:
1. Discord → User Settings → Advanced → Enable Developer Mode
2. Right-click any channel → Copy Channel ID
-->

---

## SCRAPING NOTES
- Fetch last 50 messages per channel per cycle
- Only process messages from the last 24 hours (ignore older)
- Look for event indicators: dates, times, locations, "come to", "happening", "event", "free food"
- Ignore casual chat — only extract structured event announcements
- Bot messages and webhook messages often contain event data (from event bots) — parse these too
- If a channel returns 403 (no permission), log it and skip
- Track message IDs to avoid processing the same message twice

# Atlas Discord Event Scanner Setup

This guide creates a read-only Discord bot for Atlas. It is designed to read only approved event channels and produce clean event JSON for the Campus Scout agent.

Do not commit your real bot token. Treat it like a password.

## What The Bot Does

- Reads recent messages from channel IDs you explicitly configure.
- Extracts event-like posts.
- Outputs cleaned JSON to `data/discord_events.json`.
- Writes an audit log to `data/discord_scan_audit.json`.
- Optionally updates `memory/short_term.md`.

## What The Bot Does Not Do

- It does not send messages.
- It does not react to messages.
- It does not delete or moderate messages.
- It does not read DMs.
- It does not scan channels that are not in `DISCORD_CHANNEL_IDS`.
- It does not store usernames in the cleaned event output.

## Step 1: Create The Discord Application

1. Open [Discord Developer Portal](https://discord.com/developers/applications).
2. Log in with your Discord account.
3. Click **New Application**.
4. Name it `Atlas Event Scanner`.
5. Click **Create**.

## Step 2: Create The Bot User And Token

1. In the left sidebar, click **Bot**.
2. Click **Reset Token**.
3. Copy the token immediately and save it somewhere private.
4. Scroll to **Privileged Gateway Intents**.
5. Enable **Message Content Intent**.

The scanner needs message text. Discord returns empty message content for many bots/apps unless Message Content Intent is configured.

## Step 3: Invite The Bot To A Server

1. In the left sidebar, click **OAuth2**.
2. Go to the OAuth2 URL generator/install area.
3. Select the `bot` scope.
4. Under bot permissions, select only:
   - **View Channels**
   - **Read Message History**
5. Copy the generated URL.
6. Open that URL in your browser.
7. Pick the server.
8. Click **Authorize**.

You need permission to add bots to the server. If you are not an admin, ask an admin and explain that Atlas is read-only and only scans event channels.

## Step 4: Get Channel IDs

1. Open Discord.
2. Go to **User Settings**.
3. Go to **Advanced**.
4. Turn on **Developer Mode**.
5. Right-click an event channel, such as `#campus-events`.
6. Click **Copy Channel ID**.
7. Repeat for each approved channel.

## Step 5: Store Secrets Locally

PowerShell, temporary for the current terminal:

```powershell
$env:DISCORD_BOT_TOKEN="paste-your-token-here"
$env:DISCORD_CHANNEL_IDS="123456789012345678,987654321098765432"
```

PowerShell, persistent for your Windows user:

```powershell
setx DISCORD_BOT_TOKEN "paste-your-token-here"
setx DISCORD_CHANNEL_IDS "123456789012345678,987654321098765432"
```

After `setx`, open a new terminal so the variables are loaded.

## Step 6: Run A Local Fixture Test

This test does not contact Discord. It uses fake messages in the repo.

```powershell
python backend/tools/discord_event_scanner.py --fixture backend/tools/fixtures/discord_messages_sample.json --output data/discord_events.sample.json --audit-output data/discord_scan_audit.sample.json --memory-short memory/short_term.md
```

Expected result:

- `data/discord_events.sample.json` contains cleaned event objects.
- `data/discord_scan_audit.sample.json` contains scan counts and safety controls.
- `memory/short_term.md` gets a Discord scan section.

## Step 7: Run Against Real Discord Channels

```powershell
python backend/tools/discord_event_scanner.py --config config/discord_scanner.example.json
```

The real output goes to:

```text
data/discord_events.json
data/discord_scan_audit.json
```

## Output Contract For Atlas

The C++ backend or OpenClaw Campus Scout should read `data/discord_events.json`.

Each event looks like:

```json
{
  "id": "discord:111111111111111111:333333333333333333",
  "title": "AI Systems Research Mixer",
  "date": "2026-05-15",
  "start_time": "18:30",
  "end_time": "20:00",
  "time_text": "6:30pm-8:00pm",
  "location": "Engineering 2",
  "distance_text": "unknown",
  "summary": "AI Systems Research Mixer tonight 6:30pm-8:00pm at Engineering 2...",
  "tags": ["ai", "engineering", "research", "food"],
  "source": {
    "type": "discord",
    "channel_id": "111111111111111111",
    "channel_name": "#campus-events",
    "message_id": "333333333333333333",
    "url": "https://discord.com/channels/..."
  },
  "image_url": "https://example.edu/mixer.png",
  "image_style": "16-bit pixel art",
  "image_prompt": "SNES-style 16-bit pixel art poster for AI Systems Research Mixer...",
  "confidence": 0.93,
  "privacy_status": "cleaned",
  "raw_message_digest": "short_hash",
  "created_at": "2026-05-15T22:30:00Z"
}
```

## How To Plug Into Atlas Later

Recommended flow:

1. Campus Scout agent runs `backend/tools/discord_event_scanner.py`.
2. Scanner writes `data/discord_events.json`.
3. C++ backend reads the JSON file.
4. C++ backend merges Discord events with website/email/Instagram events.
5. Student Planner only sees the merged clean event objects.

OpenClaw-style tool command:

```json
{
  "name": "discord_event_scanner",
  "description": "Fetch recent messages from approved Discord event channels and output cleaned Atlas event JSON.",
  "command": "python backend/tools/discord_event_scanner.py --config config/discord_scanner.example.json"
}
```

There is also a ready-to-adapt example at:

```text
config/openclaw.discord-tool.example.json
```

The important security boundary is that raw Discord messages stay inside the Campus Scout tool. The planner receives only cleaned events.

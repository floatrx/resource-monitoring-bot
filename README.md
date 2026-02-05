# Resource Monitoring Bot

Telegram bot for monitoring endpoint health status. Checks configured websites, APIs, and services with automatic retry logic and failure notifications.

## Features

- **Health Checks** — Monitor multiple endpoints with configurable retry attempts
- **Telegram Bot** — Interactive commands and inline keyboard buttons
- **Scheduled Checks** — Built-in cron scheduler (no external crontab needed)
- **Failure Logging** — Automatic logging of failures to daily log files
- **Progress Updates** — Real-time progress during checks

## Requirements

- Node.js 18+
- pnpm
- PM2 (for process management)
- Nginx (for reverse proxy, optional)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/floatrx/resource-monitoring-bot.git
cd resource-monitoring-bot

# Install dependencies
pnpm install

# Configure
cp config.json.example config.json
# Edit config.json and add your endpoints

# Run development server
pnpm dev
```

Server runs on http://localhost:3030

> ⚠️ **The bot will not respond until you register a webhook.** Telegram only allows one webhook per bot — registering a new one replaces the previous. Make sure the app is running before registering. See [Local Development](#local-development) for ngrok setup or [Webhook Setup](#webhook-setup) for production.

## Configuration

### Config File (`config.json`)

Create `config.json` from the example:

```bash
cp config.json.example config.json
```

**Config schema:**

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `botToken` | Yes | — | Your Telegram bot token |
| `botName` | No | `Resource Monitor` | Bot display name |
| `cronSchedule` | No | `*/15 * * * *` | Cron expression for scheduled checks |
| `chatId` | No | — | Default chat for notifications |
| `groupId` | No | — | Group chat for failure alerts |
| `locked` | No | `false` | Lock config (disable /add and /remove commands) |
| `endpoints` | Yes | — | Array of endpoints to monitor |

**Endpoint schema:**

| Field | Required | Description |
|-------|----------|-------------|
| `label` | Yes | Display name with tags like `[prod]`, `[api]` |
| `url` | Yes | URL to check |
| `siteUrl` | No | Alternative URL to display in reports |
| `options` | No | Fetch options (`{ "method": "HEAD" }`) |

**Example config.json:**

```json
{
  "botName": "My Monitor",
  "cronSchedule": "*/15 * * * *",
  "groupId": "-123456789",
  "endpoints": [
    {
      "label": "[prod] my-website",
      "url": "https://example.com"
    },
    {
      "label": "[prod] [api] backend",
      "url": "https://api.example.com/health",
      "siteUrl": "https://api.example.com/docs",
      "options": { "method": "HEAD" }
    }
  ]
}
```

**Label conventions:**
- `[prod]` / `[stage]` / `[dev]` — environment
- `[api]` / `[site]` / `[admin]` / `[cdn]` — resource type

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message with action buttons |
| `/check` | Quick check, shows only failed endpoints |
| `/status` | Full status check with indicators |
| `/list` | View all monitored resources |
| `/logs` | Download failure logs |
| `/info` | Version & scheduler status |
| `/add` | Add current chat/group to notifications (saves to config.json) |
| `/remove` | Remove current chat/group from notifications (updates config.json) |
| `/lock` | Lock configuration (disables /add and /remove permanently) |

> **Note:** `/add`, `/remove`, and `/lock` are disabled when `locked: true`. To unlock, manually set `"locked": false` in config.json and restart.

## Webhook Setup

Register webhook with Telegram:

```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://<YOUR_DOMAIN>/api/bot"
```

Remove webhook (for local development):

```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?remove"
```

## Server Deployment

### 1. Clone and Configure

```bash
cd /root/repos  # or your preferred directory
git clone https://github.com/floatrx/resource-monitoring-bot.git
cd resource-monitoring-bot

# Create config from example
cp config.json.example config.json
# Edit config.json - add your botToken and endpoints
```

### 2. Install and Run

```bash
pnpm install
pm2 start ecosystem.config.js
pm2 save
```

### 3. Register Webhook

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<DOMAIN>/api/bot"
```

### 4. Verify

```bash
# Check bot is running
curl https://<DOMAIN>/health

# Check webhook status
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

## Deployment Options

### PM2

```bash
# Start the bot
pm2 start ecosystem.config.js

# View logs
pm2 logs resource-monitor

# Restart
pm2 restart resource-monitor

# Stop
pm2 stop resource-monitor

# Save process list (auto-start on reboot)
pm2 save
pm2 startup
```

### Systemd

Create `/etc/systemd/system/resource-monitor.service`:

```ini
[Unit]
Description=Resource Monitoring Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/resource-monitoring-bot
ExecStart=/usr/bin/pnpm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable resource-monitor
sudo systemctl start resource-monitor
```

### Nginx

Copy example config and update domain:

```bash
sudo cp nginx.config.example /etc/nginx/sites-available/resource-monitor
sudo ln -s /etc/nginx/sites-available/resource-monitor /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Certbot will automatically update your nginx config with SSL settings.

## Updating

```bash
cd /path/to/resource-monitoring-bot
git pull origin main
pnpm install
pm2 restart resource-monitor
```

## Troubleshooting

```bash
# Check logs
pm2 logs resource-monitor

# Check status
pm2 status

# Restart if needed
pm2 restart resource-monitor

# Check webhook status
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

## Project Structure

```
├── src/
│   ├── index.ts              # Entry point + Express setup
│   ├── routes/
│   │   ├── bot.ts            # /api/bot endpoint (webhook + health)
│   │   └── check.ts          # /api/check endpoint (manual trigger)
│   ├── lib/
│   │   ├── checker/index.ts  # Core checking logic
│   │   ├── cron.ts           # Scheduled health checks
│   │   ├── logger.ts         # Failure logging
│   │   ├── tg/               # Telegram bot integration
│   │   │   ├── index.ts      # Bot instance & handlers
│   │   │   ├── getCommands.ts
│   │   │   ├── getKeyboard.ts
│   │   │   └── sendMessage.ts
│   │   └── helpers.ts        # Utility functions
│   ├── config/
│   │   ├── const.ts          # Constants & re-exports
│   │   └── loadConfig.ts     # JSON config loader
│   └── types/
│       └── index.ts          # Type definitions
├── config.json.example       # Endpoints config template
├── ecosystem.config.js       # PM2 config
└── package.json
```

## Architecture

```
Telegram User → /api/bot webhook → grammy Bot
                                      ↓
                              Command/Callback handlers
                                      ↓
                              checkAll() function
                                      ↓
                              Iterate endpoints from config.json
                                      ↓
                              requestWithRetry() (3 attempts)
                                      ↓
                              Report results → Telegram
```

**Key Components:**

- **Checker** (`src/lib/checker/index.ts`) — Core status checking logic with retry mechanism
- **Bot** (`src/lib/tg/index.ts`) — Telegram bot singleton with command handlers
- **Config** (`src/config/loadConfig.ts`) — Loads endpoints from JSON file

## Local Development

### Using ngrok for Telegram Webhooks

```bash
# 1. Remove any existing webhook
source .env
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?remove"

# 2. Start ngrok tunnel
ngrok http 3030

# 3. Register local webhook (replace with your ngrok URL)
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=https://<ngrok-url>/api/bot"

# 4. Start dev server
pnpm dev
```

### Check Webhook Status

```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

## Scheduled Checks

Built-in cron scheduler runs health checks automatically.

- **Default schedule:** every 15 minutes (`*/15 * * * *`)
- **Notifications:** Sends to both `chatId` and `groupId` if configured (only on failures)
- **Logs:** Last run timestamp stored in `logs/cron.log`
- **Custom schedule:** Set `cronSchedule` in `config.json`

## Technical Notes

- Checker has 600ms delay between requests (rate limiting)
- Retry logic: 3 attempts per endpoint before marking as failed
- Progress updates throttled to every 2.5 seconds during check
- Bot instance is singleton (created once, reused)
- Manual `/api/check` endpoint only notifies on failures

## Tech Stack

- **Express.js 5** — HTTP server
- **grammy** — Telegram Bot SDK
- **node-cron** — Scheduled tasks
- **dayjs** — Date formatting (Kyiv timezone)
- **TypeScript** — Type safety
- **tsx** — TypeScript runner

## API Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/api/bot` | GET | Health check |
| `/api/bot` | POST | Telegram webhook |
| `/api/check` | GET | Manual check trigger (async) |
| `/health` | GET | Server health |

## Security

- `config.json` contains your bot token — **never commit it**
- Use `/add` command to register chats, then set `"locked": true` in config
- Keep `config.json` backed up separately
- The file is excluded via `.gitignore`

## Roadmap

Adding and removing monitored resources is currently available only through manual config editing. Future versions may include commands for this based on user requests. The current version fully satisfies the author's requirements.

## License

MIT

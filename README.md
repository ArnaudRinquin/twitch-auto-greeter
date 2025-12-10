# Twitch Auto-Greeter

Twitch recently changed the way it counts spectators by only counting the ones speaking in the chat. This browser extension automates saying "Hi" in the chat to ensure you're counted as an active viewer.

## Features

- **Smart Greeting**: Automatically sends a greeting message once per day (configurable) when you join a stream
- **Language-Aware Messages**: Auto-detects stream language tags and uses appropriate greetings (English, French, Spanish, German, Portuguese, Japanese, and more)
- **Customizable Messages**: Configure multiple greeting messages with `<streamer>` placeholder for personalization
- **Emote Support**: Renders Twitch global emotes (HeyGuys, VoHiYo, etc.) and BetterTTV emotes in message previews
- **Streamer-Specific Messages**: Restrict messages to specific streamers or use them globally
- **Message Filtering**: Filter messages by streamer and language in the options page
- **Whitelist/Blacklist**: Enable only for specific streamers or disable for certain ones
- **Privacy-Focused**: All data stored locally, no external tracking
- **Frequency Control**: Default 24h cooldown per streamer to avoid spam
- **Natural Timing**: Random 10-15 second delay after joining a stream
- **Greeting History**: View when you last greeted each streamer, see the exact message sent, and clear history per streamer

![Screenshot of settings](./screenshot_settings.png)

## Installation

### From Source (Manual)

**Chrome/Edge:**
1. Clone the repo: `git clone https://github.com/YOUR_USERNAME/hello-twitch-extension.git`
2. Install dependencies: `pnpm install`
3. Build: `pnpm build`
4. Open `chrome://extensions/`
5. Enable "Developer mode" (top right)
6. Click "Load unpacked"
7. Select the `.output/chrome-mv3` folder

**Firefox:**
1. Clone the repo: `git clone https://github.com/YOUR_USERNAME/hello-twitch-extension.git`
2. Install dependencies: `pnpm install`
3. Build: `pnpm build:firefox`
4. Open `about:debugging#/runtime/this-firefox`
5. Click "Load Temporary Add-on"
6. Select the `manifest.json` from `.output/firefox-mv3` folder

> **Note:** Pre-built releases coming soon!

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode (Chrome)
pnpm dev

# Run in development mode (Firefox)
pnpm dev:firefox

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Build for production
pnpm build
pnpm build:firefox

# Create distributable zip files
pnpm zip
pnpm zip:firefox
```

## Configuration

Access the extension options page via `chrome://extensions/` → "Options" to:
- **Enable/disable** the auto-greeter
- **Add custom greeting messages** with `<streamer>` placeholder and language tags
- **Filter messages** by streamer and language to preview what will be sent
- **Configure per-streamer messages** (optional streamer targeting)
- **Whitelist streamers** (only enable for specific streamers)
- **Blacklist streamers** (disable for specific streamers)
- **Set greeting frequency** (default: 24 hours)
- **Adjust delay timing** (default: 10-15 seconds)
- **View greeting history** with last sent message and clear per-streamer history

## How It Works

The extension uses a **cascading message selection** strategy:

1. **Streamer-specific messages** take priority - if you've configured messages for a specific streamer, those are used exclusively
2. **Language-specific messages** are next - the extension detects stream language tags and matches appropriate greetings
3. **Global messages** as fallback - language-agnostic messages work on any stream

Example: If you visit a French streamer with messages configured for both "French" and that streamer specifically, the streamer-specific message wins. If you visit an English stream without streamer-specific messages, an English greeting is automatically selected.

## Tech Stack

- **WXT Framework**: Next-gen browser extension framework
- **React + TypeScript**: UI components
- **Tailwind CSS**: Styling
- **Vitest + Playwright**: Testing (93 unit tests)
- **BetterTTV API**: Emote rendering without authentication

## License

MIT

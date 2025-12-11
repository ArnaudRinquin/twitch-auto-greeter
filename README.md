![Twitch Auto-Greeter](./store/promo/marquee-promo-tile.png)

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

## Magic Sauce

### Language Tag Detection
Twitch's language tags are loaded asynchronously by React after the initial page render, making them invisible to immediate DOM queries. We solved this using a MutationObserver that watches for tag elements to appear, with a 5-second timeout fallback. The system supports 80+ languages by mapping Twitch's display names (like "Français" or "日本語") to ISO 639-1 codes, enabling accurate language-aware greeting selection.

### Typing into Twitch Chat
Twitch uses Slate.js as its rich text editor, which requires precise keyboard event sequences to properly update its internal state. Simply setting the input value doesn't work. Our solution inserts text character-by-character, dispatching full keydown → beforeinput → insertText → input → keyup event sequences for each character, with 3-retry verification to ensure each character was successfully inserted. This technique reliably works despite Slate's complex state management.

### Emote Preview Rendering
Displaying emote previews in the options UI requires emote images without Twitch authentication. We combined two approaches: hardcoding 40+ Twitch global emotes (HeyGuys, Kappa, PogChamp, etc.) with their static CDN IDs, plus fetching additional emotes from the BetterTTV public API. This hybrid approach provides comprehensive emote rendering in message previews without requiring users to authenticate.

### Marketing Content Generation
The Chrome Web Store requires specific promotional assets: 440x280 and 1400x560 pixel promo tiles, plus a demo video. We created an HTML/CSS template with the exact dimensions and Twitch's brand colors, allowing us to generate pixel-perfect promo tiles via screenshot automation. The demo video was captured from actual UI interactions, showcasing real functionality rather than static mockups.

### SPA Navigation Detection
Twitch is a single-page application where URL changes don't always mean the user intentionally navigated to a new stream - auto-play and related streams change the URL automatically. We use a heuristic approach that compares previous and current URLs along with timing data to distinguish manual navigation from auto-navigation, ensuring greetings only happen when users intentionally visit a stream, avoiding spam.

## Tech Stack

- **WXT Framework**: Next-gen browser extension framework
- **React + TypeScript**: UI components
- **Tailwind CSS**: Styling
- **Vitest + Playwright**: Testing (93 unit tests)
- **BetterTTV API**: Emote rendering without authentication

## License

MIT

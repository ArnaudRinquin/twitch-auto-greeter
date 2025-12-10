# Chrome Web Store Listing Fields

## Store Listing Tab

### Category
**Productivity** (Primary)
Alternative: Fun

### Language
English (United States)

### Single Purpose
Automatically send greeting messages in Twitch chat to be counted as an active viewer by Twitch's spectator counting system.

### Permission Justifications

**storage**
- Why: To save user's custom greeting messages, configuration settings, and greeting history locally on their device
- Usage: Storing greeting history (last message times), user configuration (enabled streamers, frequency settings), and custom messages

**tabs**
- Why: To detect when the user navigates to Twitch stream pages
- Usage: Monitoring tab URLs to identify when user visits a Twitch stream to trigger auto-greeting

**host_permissions: *://*.twitch.tv/***
- Why: To access Twitch pages and send chat messages
- Usage: Running content script on Twitch to detect streams and send greeting messages in chat

## Privacy Tab

### Privacy Policy URL
[You'll need to host the privacy-policy.md somewhere - options below]

Options for hosting:
1. GitHub Pages (recommended): Create a `docs/privacy-policy.html` in your repo and enable GitHub Pages
2. Your personal website
3. Use a free service like privacy-policy-template.com

### Single Purpose Description
This extension automatically sends greeting messages in Twitch chat to ensure users are counted as active viewers under Twitch's new spectator counting system.

### Data Usage Certification

**Does this extension collect or transmit user data?**
Yes (for local storage only)

**Data Collection Disclosure:**
The extension stores the following data locally on the user's device using chrome.storage.local:
- User configuration settings (greeting messages, frequency, enabled/disabled streamers)
- Greeting history (timestamps and last messages sent per streamer)

No data is transmitted to external servers except:
- Public API call to BetterTTV (https://api.betterttv.net/3/cached/emotes/global) to fetch emote data for message preview rendering (no personal data sent)

All user data remains on the user's device and is never shared with third parties.

### Remote Code
**Does your extension execute remote code?**
No

**Does your extension use code obfuscation?**
No

## Distribution Tab

### Visibility
- **Public** (recommended for general release)
- Or **Unlisted** (for initial testing - only accessible via direct link)

### Pricing
Free

### Regions
All regions (default)

## Screenshots Required

You'll need to create 1-5 screenshots at **1280x800 pixels** showing:

1. **Main Options Page** - Show the extension settings with message configuration
2. **Message Filtering** - Show the language/streamer filter interface
3. **Greeting History** - Display the history view with last sent messages
4. **Message Preview with Emotes** - Show emote rendering in message preview
5. **Streamer Management** - Show whitelist/blacklist configuration

## Promotional Image Required

**Small Promotional Tile**: 440x280 pixels
- Should include extension icon and name
- Brief tagline like "Auto-greet on Twitch streams"

## Optional (for featured placement)

**Large Promotional Tile**: 920x680 pixels
**Marquee Promotional Tile**: 1400x560 pixels

## Support/Homepage URL

Your GitHub repository: `https://github.com/YOUR_USERNAME/twitch-auto-greeter`

## Additional Metadata

### Keywords (for searchability)
- Twitch
- Auto greeter
- Chat automation
- Viewer count
- Stream chat
- Twitch spectator
- Chat messages
- Multi-language

### YouTube Video (optional)
You can add a demo video showing the extension in action

## Notes for Submission

1. **Privacy Policy**: You must host the privacy-policy.md somewhere publicly accessible and provide the URL
2. **Screenshots**: Chrome Web Store dashboard has a built-in image editor if your screenshots aren't exactly 1280x800
3. **Review Time**: Usually 1-3 days
4. **Updates**: After approval, updates are typically reviewed within 24 hours

## Pre-Submission Checklist

- [ ] Privacy policy hosted and URL added
- [ ] 1-5 screenshots created (1280x800)
- [ ] Small promotional image created (440x280)
- [ ] Store description filled out
- [ ] All permission justifications provided
- [ ] Single purpose clearly stated
- [ ] Support/homepage URL added
- [ ] Category selected
- [ ] Extension tested in Chrome before submission

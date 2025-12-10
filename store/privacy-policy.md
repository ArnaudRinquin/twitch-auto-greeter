# Privacy Policy for Twitch Auto-Greeter

**Last Updated: December 10, 2024**

## Introduction

Twitch Auto-Greeter ("the Extension") is committed to protecting your privacy. This privacy policy explains how the Extension handles data.

## Data Collection and Storage

### What Data We Collect

The Extension stores the following data **locally on your device only**:

1. **Configuration Settings**
   - Your custom greeting messages
   - Enabled/disabled state
   - Frequency settings (cooldown period)
   - Delay timing preferences
   - Whitelisted streamers (if configured)
   - Blacklisted streamers (if configured)

2. **Greeting History**
   - Timestamps of when you last greeted each streamer
   - The last message sent to each streamer

### How We Store Your Data

All data is stored **locally on your device** using Chrome's `chrome.storage.local` API. This means:

- ✅ Data never leaves your device
- ✅ No data is transmitted to external servers
- ✅ No data is shared with third parties
- ✅ No analytics or tracking
- ✅ You have complete control over your data

### Data We Do NOT Collect

We do not collect, transmit, or store:

- Personal information (name, email, etc.)
- Browsing history
- Chat messages beyond what you configure as greetings
- Twitch account information
- Any analytics or usage statistics

## Third-Party Services

The Extension makes requests to the following third-party services:

1. **BetterTTV API** (`https://api.betterttv.net/3/cached/emotes/global`)
   - **Purpose**: Fetch global emote data for message preview rendering
   - **Data Sent**: None - simple GET request
   - **Data Received**: Public emote information (emote codes and IDs)
   - **Privacy**: No personal data is transmitted

No other external services are used.

## Permissions

The Extension requests the following permissions:

1. **`storage`** - To save your configuration and greeting history locally on your device
2. **`tabs`** - To detect when you navigate to Twitch stream pages
3. **`host_permissions` for `*://*.twitch.tv/*`** - To run on Twitch pages and send chat messages

These permissions are used **only** for the Extension's core functionality and nothing else.

## Data Security

- All data is stored using Chrome's built-in secure storage mechanisms
- No encryption is needed as data never leaves your device
- No transmission over networks (except BetterTTV emote fetching)

## Your Rights

You have complete control over your data:

- **View**: All configuration is visible in the Extension options page
- **Modify**: Change any settings at any time
- **Delete**: Clear greeting history for individual streamers or all at once
- **Remove**: Uninstalling the Extension removes all stored data

## Children's Privacy

The Extension does not knowingly collect data from anyone, including children under 13. Since all data is stored locally and never transmitted, there are no privacy concerns specific to children.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be posted in this document with an updated "Last Updated" date.

## Data Retention

Data is retained indefinitely on your device until you:
- Clear it manually using the Extension options
- Uninstall the Extension
- Clear browser data

## Contact

For questions about this privacy policy or the Extension:
- GitHub: [https://github.com/YOUR_USERNAME/twitch-auto-greeter](https://github.com/YOUR_USERNAME/twitch-auto-greeter)
- Open an issue on GitHub for support

## Compliance

This Extension complies with:
- Chrome Web Store Privacy Policies
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR) principles (data minimization, local storage only)

## Summary

**In Plain English:**

Twitch Auto-Greeter stores your settings and greeting history on your device only. We don't collect, transmit, or share any personal data. We don't use analytics or tracking. You have full control to view, change, or delete your data at any time.

The Extension only fetches public emote data from BetterTTV to show emotes in message previews - no personal information is involved.

That's it. Simple and privacy-focused.

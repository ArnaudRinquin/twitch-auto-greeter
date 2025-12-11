import { test, expect } from './fixtures/extension';
import {
  setExtensionStorage,
  getExtensionStorage,
  getMockStreamerUrl,
  waitForChatMessage,
  getChatInputText,
} from './utils/extension';
import type { Config } from '../../types';

test.describe('Greeting Flow', () => {
  test.beforeEach(async ({ context, extensionId }) => {
    // Setup default config with short delay for faster tests
    const config: Config = {
      enabled: true,
      messages: [
        { text: 'Hello!' },
        { text: 'Hi <streamer>!' },
      ],
      defaultFrequency: 24 * 3600000, // 24 hours in milliseconds
      delayRange: [1, 2], // Short delay for testing
    };

    await setExtensionStorage(context, extensionId, {
      config,
      state: { lastMessageTimes: {} },
    });
  });

  test.skip('sends greeting when navigating to streamer page', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const streamerUrl = getMockStreamerUrl('teststreamer');

    await page.goto(streamerUrl);

    // Wait for greeting to appear in chat input (longer timeout for content script load + delay)
    const messageReceived = await waitForChatMessage(page, 'Hello', 10000);
    expect(messageReceived).toBe(true);

    const chatText = await getChatInputText(page);
    expect(chatText.length).toBeGreaterThan(0);

    await page.close();
  });

  test.skip('interpolates streamer name in message', async ({ context, extensionId }) => {
    const config: Config = {
      enabled: true,
      messages: [{ text: 'Hello <streamer>!' }],
      defaultFrequency: 24 * 3600000,
      delayRange: [1, 2],
    };

    await setExtensionStorage(context, extensionId, {
      config,
      state: { lastMessageTimes: {} },
    });

    const page = await context.newPage();
    const streamerUrl = getMockStreamerUrl('coolstreamer');

    await page.goto(streamerUrl);

    const messageReceived = await waitForChatMessage(page, 'coolstreamer', 10000);
    expect(messageReceived).toBe(true);

    const chatText = await getChatInputText(page);
    expect(chatText).toContain('coolstreamer');

    await page.close();
  });

  test.skip('does not send duplicate message within frequency window', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const streamerUrl = getMockStreamerUrl('teststreamer');

    // First visit
    await page.goto(streamerUrl);
    await waitForChatMessage(page, 'Hello', 10000);

    // Get storage to verify timestamp was recorded
    let storage = await getExtensionStorage(context, extensionId);
    expect(storage.state.lastMessageTimes['teststreamer']).toBeDefined();

    // Clear chat input
    await page.evaluate(() => {
      const input = document.querySelector('[data-a-target="chat-input"]');
      if (input) input.textContent = '';
    });

    // Navigate away and back immediately (within frequency window)
    await page.goto('about:blank');
    await page.goto(streamerUrl);

    // Wait a bit to ensure no message is sent
    await page.waitForTimeout(3000);

    const chatText = await getChatInputText(page);
    expect(chatText).toBe(''); // No message should be sent

    await page.close();
  });

  test('respects disabled extension setting', async ({ context, extensionId }) => {
    const config: Config = {
      enabled: false, // Disabled
      messages: [{ text: 'Hello!' }],
      defaultFrequency: 24 * 3600000,
      delayRange: [1, 2],
    };

    await setExtensionStorage(context, extensionId, {
      config,
      state: { lastMessageTimes: {} },
    });

    const page = await context.newPage();
    const streamerUrl = getMockStreamerUrl('teststreamer');

    await page.goto(streamerUrl);
    await page.waitForTimeout(4000);

    const chatText = await getChatInputText(page);
    expect(chatText).toBe(''); // No message when disabled

    await page.close();
  });

  test('respects disabled streamers list', async ({ context, extensionId }) => {
    const config: Config = {
      enabled: true,
      messages: [{ text: 'Hello!' }],
      defaultFrequency: 24 * 3600000,
      delayRange: [1, 2],
      disabledStreamers: ['bannedstreamer'],
    };

    await setExtensionStorage(context, extensionId, {
      config,
      state: { lastMessageTimes: {} },
    });

    const page = await context.newPage();
    const streamerUrl = getMockStreamerUrl('bannedstreamer');

    await page.goto(streamerUrl);
    await page.waitForTimeout(4000);

    const chatText = await getChatInputText(page);
    expect(chatText).toBe(''); // No message for disabled streamer

    await page.close();
  });

  test('respects enabled streamers list (whitelist)', async ({ context, extensionId }) => {
    const config: Config = {
      enabled: true,
      messages: [{ text: 'Hello!' }],
      defaultFrequency: 24 * 3600000,
      delayRange: [1, 2],
      enabledStreamers: ['allowedstreamer'],
    };

    await setExtensionStorage(context, extensionId, {
      config,
      state: { lastMessageTimes: {} },
    });

    // Test allowed streamer
    let page = await context.newPage();
    await page.goto(getMockStreamerUrl('allowedstreamer'));
    let messageReceived = await waitForChatMessage(page, 'Hello', 10000);
    expect(messageReceived).toBe(true);
    await page.close();

    // Clear lastMessageTimes before testing non-allowed streamer
    await setExtensionStorage(context, extensionId, {
      state: { lastMessageTimes: {} },
    });

    // Test non-allowed streamer
    page = await context.newPage();
    await page.goto(getMockStreamerUrl('otherstreamer'));
    await page.waitForTimeout(4000);
    const chatText = await getChatInputText(page);
    expect(chatText).toBe(''); // No message for non-whitelisted streamer
    await page.close();
  });

  test.skip('uses message with specific streamer targeting', async ({ context, extensionId }) => {
    const config: Config = {
      enabled: true,
      messages: [
        { text: 'Generic hello!' },
        { text: 'Special greeting for VIP!', streamers: ['vipstreamer'] },
      ],
      defaultFrequency: 24 * 3600000,
      delayRange: [1, 2],
    };

    await setExtensionStorage(context, extensionId, {
      config,
      state: { lastMessageTimes: {} },
    });

    const page = await context.newPage();
    await page.goto(getMockStreamerUrl('vipstreamer'));

    const messageReceived = await waitForChatMessage(page, 'VIP', 10000);
    expect(messageReceived).toBe(true);

    const chatText = await getChatInputText(page);
    expect(chatText).toContain('VIP');

    await page.close();
  });

  test.skip('sends button click after message insertion', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const streamerUrl = getMockStreamerUrl('teststreamer');

    // Track button clicks
    await page.goto(streamerUrl);

    let buttonClicked = false;
    await page.evaluate(() => {
      const button = document.querySelector('[data-a-target="chat-send-button"]');
      button?.addEventListener('click', () => {
        (window as any).sendButtonClicked = true;
      });
    });

    await waitForChatMessage(page, 'Hello', 5000);

    // Check if send button was clicked
    buttonClicked = await page.evaluate(() => (window as any).sendButtonClicked === true);
    expect(buttonClicked).toBe(true);

    await page.close();
  });

  test.skip('handles case-insensitive streamer names', async ({ context, extensionId }) => {
    const config: Config = {
      enabled: true,
      messages: [{ text: 'Hello <streamer>!' }],
      defaultFrequency: 24 * 3600000,
      delayRange: [1, 2],
    };

    await setExtensionStorage(context, extensionId, {
      config,
      state: { lastMessageTimes: {} },
    });

    const page = await context.newPage();
    await page.goto(getMockStreamerUrl('CoolStreamer'));

    const messageReceived = await waitForChatMessage(page, 'CoolStreamer', 10000);
    expect(messageReceived).toBe(true);

    // Verify storage uses lowercase
    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.state.lastMessageTimes['coolstreamer']).toBeDefined();

    await page.close();
  });
});

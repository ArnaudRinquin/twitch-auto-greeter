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
        { text: 'Hello!', streamers: [], languages: [] },
        { text: 'Hi <streamer>!', streamers: [], languages: [] },
      ],
      defaultFrequency: 24 * 3600000, // 24 hours in milliseconds
      delayRange: [1, 2], // Short delay for testing
    };

    await setExtensionStorage(context, extensionId, {
      config,
      state: { lastMessageTimes: {}, lastMessages: {} },
    });
  });

  test('does not send duplicate message within frequency window', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const streamerUrl = getMockStreamerUrl('teststreamer');

    // First visit - wait for message to be sent
    await page.goto(streamerUrl);
    await waitForChatMessage(page, 'Hello!', 10000);

    // Get message count
    const messageCountAfterFirst = await page.evaluate(() => {
      const messagesContainer = document.getElementById('messages');
      return messagesContainer?.querySelectorAll('.message').length || 0;
    });
    expect(messageCountAfterFirst).toBe(1);

    // Verify timestamp was recorded
    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.state.lastMessageTimes['teststreamer']).toBeDefined();

    // Navigate away and back immediately (within frequency window)
    await page.goto('about:blank');
    await page.goto(streamerUrl);

    // Wait to ensure no new message is sent
    await page.waitForTimeout(3000);

    // Verify no additional message was sent
    const messageCountAfterSecond = await page.evaluate(() => {
      const messagesContainer = document.getElementById('messages');
      return messagesContainer?.querySelectorAll('.message').length || 0;
    });
    expect(messageCountAfterSecond).toBe(0); // Messages container reset on navigation

    await page.close();
  });

  test('respects disabled extension setting', async ({ context, extensionId }) => {
    const config: Config = {
      enabled: false, // Disabled
      messages: [{ text: 'Hello!', streamers: [], languages: [] }],
      defaultFrequency: 24 * 3600000,
      delayRange: [1, 2],
    };

    await setExtensionStorage(context, extensionId, {
      config,
      state: { lastMessageTimes: {}, lastMessages: {} },
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
      messages: [{ text: 'Hello!', streamers: [], languages: [] }],
      defaultFrequency: 24 * 3600000,
      delayRange: [1, 2],
      disabledStreamers: ['bannedstreamer'],
    };

    await setExtensionStorage(context, extensionId, {
      config,
      state: { lastMessageTimes: {}, lastMessages: {} },
    });

    const page = await context.newPage();
    const streamerUrl = getMockStreamerUrl('bannedstreamer');

    await page.goto(streamerUrl);
    await page.waitForTimeout(4000);

    const chatText = await getChatInputText(page);
    expect(chatText).toBe(''); // No message for disabled streamer

    await page.close();
  });

  test('uses message with specific streamer targeting', async ({ context, extensionId }) => {
    // Note: Using messages without spaces as execCommand('insertText', ' ') doesn't work in test environment
    const config: Config = {
      enabled: true,
      messages: [
        { text: 'Hello!', streamers: [], languages: [] },
        { text: 'VIPgreeting!', streamers: ['vipstreamer'], languages: [] },
      ],
      defaultFrequency: 24 * 3600000,
      delayRange: [1, 2],
    };

    await setExtensionStorage(context, extensionId, {
      config,
      state: { lastMessageTimes: {}, lastMessages: {} },
    });

    const page = await context.newPage();
    await page.goto(getMockStreamerUrl('vipstreamer'));

    // Wait for VIP-specific greeting to be typed and sent
    const messageWasSent = await waitForChatMessage(page, 'VIPgreeting!', 10000);
    expect(messageWasSent).toBe(true);

    await page.close();
  });

  test('handles case-insensitive streamer names', async ({ context, extensionId }) => {
    // Note: Using messages without spaces as execCommand('insertText', ' ') doesn't work in test environment
    const config: Config = {
      enabled: true,
      messages: [{ text: 'Hello<streamer>!', streamers: [], languages: [] }],
      defaultFrequency: 24 * 3600000,
      delayRange: [1, 2],
    };

    await setExtensionStorage(context, extensionId, {
      config,
      state: { lastMessageTimes: {}, lastMessages: {} },
    });

    const page = await context.newPage();
    await page.goto(getMockStreamerUrl('CoolStreamer'));

    const messageReceived = await waitForChatMessage(page, 'HelloCoolStreamer!', 10000);
    expect(messageReceived).toBe(true);

    // Verify storage uses lowercase
    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.state.lastMessageTimes['coolstreamer']).toBeDefined();

    await page.close();
  });
});

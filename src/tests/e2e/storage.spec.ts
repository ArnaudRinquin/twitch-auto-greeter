import { test, expect } from './fixtures/extension';
import {
  getExtensionStorage,
  setExtensionStorage,
  clearExtensionStorage,
  getMockStreamerUrl,
  waitForChatMessage,
} from './utils/extension';
import { DEFAULT_CONFIG } from '../../types';
import type { Config, State } from '../../types';

test.describe('Storage Persistence', () => {
  test.skip('initializes with default config on first install', async ({ context, extensionId }) => {
    await clearExtensionStorage(context, extensionId);

    // Access extension to trigger initialization
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForTimeout(1000);

    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.config).toBeDefined();
    expect(storage.config.enabled).toBe(true);
    expect(storage.config.messages.length).toBeGreaterThan(0);

    await page.close();
  });

  test('persists config changes across page reloads', async ({ context, extensionId }) => {
    const customConfig: Config = {
      enabled: false,
      messages: [{ text: 'Custom message', streamers: [], languages: [] }],
      defaultFrequency: 48 * 3600000,
      delayRange: [5, 10],
    };

    await setExtensionStorage(context, extensionId, { config: customConfig });

    // Reload options page
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForTimeout(500);

    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.config.enabled).toBe(false);
    expect(storage.config.defaultFrequency).toBe(48 * 3600000);
    expect(storage.config.delayRange).toEqual([5, 10]);
    expect(storage.config.messages[0].text).toBe('Custom message');

    await page.close();
  });

  test.skip('updates last message time after sending greeting', async ({ context, extensionId }) => {
    const config: Config = {
      enabled: true,
      messages: [{ text: 'Hello!', streamers: [], languages: [] }],
      defaultFrequency: 24 * 3600000,
      delayRange: [1, 2],
    };

    await setExtensionStorage(context, extensionId, {
      config,
      state: { lastMessageTimes: {}, lastMessages: {} },
    });

    const page = await context.newPage();
    await page.goto(getMockStreamerUrl('teststreamer'));

    await waitForChatMessage(page, 'Hello', 10000);

    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.state.lastMessageTimes['teststreamer']).toBeDefined();
    expect(typeof storage.state.lastMessageTimes['teststreamer']).toBe('number');

    // Verify timestamp is recent (within last 10 seconds)
    const timestamp = storage.state.lastMessageTimes['teststreamer'];
    const now = Date.now();
    expect(now - timestamp).toBeLessThan(10000);

    await page.close();
  });

  test.skip('maintains separate timestamps for different streamers', async ({ context, extensionId }) => {
    const config: Config = {
      enabled: true,
      messages: [{ text: 'Hello!', streamers: [], languages: [] }],
      defaultFrequency: 24 * 3600000,
      delayRange: [1, 2],
    };

    await setExtensionStorage(context, extensionId, {
      config,
      state: { lastMessageTimes: {}, lastMessages: {} },
    });

    // Visit first streamer
    let page = await context.newPage();
    await page.goto(getMockStreamerUrl('streamer1'));
    await waitForChatMessage(page, 'Hello', 10000);
    await page.close();

    // Visit second streamer
    page = await context.newPage();
    await page.goto(getMockStreamerUrl('streamer2'));
    await waitForChatMessage(page, 'Hello', 10000);
    await page.close();

    // Check storage has both timestamps
    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.state.lastMessageTimes['streamer1']).toBeDefined();
    expect(storage.state.lastMessageTimes['streamer2']).toBeDefined();
    expect(Object.keys(storage.state.lastMessageTimes)).toHaveLength(2);
  });

  test('clears all timestamps when clearing history', async ({ context, extensionId }) => {
    const state: State = {
      lastMessageTimes: {
        streamer1: Date.now(),
        streamer2: Date.now() - 10000,
        streamer3: Date.now() - 100000,
      },
      lastMessages: {},
    };

    await setExtensionStorage(context, extensionId, { state });

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const clearButton = page.getByRole('button', { name: /clear history/i });
    await clearButton.click();
    await page.waitForTimeout(500);

    const storage = await getExtensionStorage(context, extensionId);
    expect(Object.keys(storage.state.lastMessageTimes)).toHaveLength(0);

    await page.close();
  });

  test('handles empty state gracefully', async ({ context, extensionId }) => {
    await setExtensionStorage(context, extensionId, {
      config: DEFAULT_CONFIG,
      state: { lastMessageTimes: {}, lastMessages: {} },
    });

    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.state.lastMessageTimes).toEqual({});
  });

  test.skip('handles corrupted storage gracefully', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Set corrupted data
    await page.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.set({ config: 'invalid' }, resolve);
      });
    });

    // Reload and verify it doesn't crash
    await page.reload();
    await page.waitForTimeout(1000);

    // Should recover or use defaults
    const isVisible = await page.locator('body').isVisible();
    expect(isVisible).toBe(true);

    await page.close();
  });

  test('preserves streamer list arrays in config', async ({ context, extensionId }) => {
    const config: Config = {
      enabled: true,
      messages: [{ text: 'Hi!', streamers: [], languages: [] }],
      defaultFrequency: 24 * 3600000,
      delayRange: [10, 15],
      enabledStreamers: ['streamer1', 'streamer2'],
      disabledStreamers: ['bannedstreamer'],
    };

    await setExtensionStorage(context, extensionId, { config });

    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.config.enabledStreamers).toEqual(['streamer1', 'streamer2']);
    expect(storage.config.disabledStreamers).toEqual(['bannedstreamer']);
  });

  test('preserves message-specific streamer targeting', async ({ context, extensionId }) => {
    const config: Config = {
      enabled: true,
      messages: [
        { text: 'Generic hello', streamers: [], languages: [] },
        { text: 'VIP greeting', streamers: ['vipstreamer', 'premiumstreamer'], languages: [] },
      ],
      defaultFrequency: 24 * 3600000,
      delayRange: [10, 15],
    };

    await setExtensionStorage(context, extensionId, { config });

    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.config.messages[1].streamers).toEqual(['vipstreamer', 'premiumstreamer']);
  });
});

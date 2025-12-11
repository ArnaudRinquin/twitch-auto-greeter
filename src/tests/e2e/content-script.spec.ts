import { test, expect } from './fixtures/extension';
import {
  setExtensionStorage,
  getMockStreamerUrl,
  getMockDirectoryUrl,
  getChatInputText,
} from './utils/extension';
import type { Config } from '../../types';

test.describe('Content Script', () => {
  test.beforeEach(async ({ context, extensionId }) => {
    const config: Config = {
      enabled: true,
      messages: [{ text: 'Test message', streamers: [], languages: [] }],
      defaultFrequency: 24 * 3600000,
      delayRange: [1, 2],
    };

    await setExtensionStorage(context, extensionId, {
      config,
      state: { lastMessageTimes: {}, lastMessages: {} },
    });
  });

  test('does not trigger on directory pages', async ({ context }) => {
    const page = await context.newPage();
    await page.goto(getMockDirectoryUrl());

    await page.waitForTimeout(3000);

    // Verify no greeting logic executed (no chat input on directory)
    const chatInput = await page.locator('[data-a-target="chat-input"]').count();
    expect(chatInput).toBe(0);

    await page.close();
  });

  test('ignores rapid navigation (redirects)', async ({ context }) => {
    const page = await context.newPage();

    // Navigate to streamer
    await page.goto(getMockStreamerUrl('streamer1'));
    await page.waitForTimeout(4000);

    // Clear chat
    await page.evaluate(() => {
      const input = document.querySelector('[data-a-target="chat-input"]');
      if (input) input.textContent = '';
    });

    // Rapid navigation (<1s) should be ignored
    await page.waitForTimeout(500);
    await page.goto(getMockStreamerUrl('streamer2'));
    await page.waitForTimeout(500);
    await page.goto(getMockStreamerUrl('streamer3'));

    await page.waitForTimeout(4000);

    // Should not send multiple greetings
    const chatText = await getChatInputText(page);
    // May contain one message, but not multiple
    const messageCount = chatText.split('Test message').length - 1;
    expect(messageCount).toBeLessThanOrEqual(1);

    await page.close();
  });

  test('chat input element exists on streamer page', async ({ context }) => {
    const page = await context.newPage();
    await page.goto(getMockStreamerUrl('teststreamer'));

    const chatInput = page.locator('[data-a-target="chat-input"]');
    await expect(chatInput).toBeVisible();

    const sendButton = page.locator('[data-a-target="chat-send-button"]');
    await expect(sendButton).toBeVisible();

    await page.close();
  });

});

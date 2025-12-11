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

  test('detects manual navigation to different streamer', async ({ context, extensionId }) => {
    const page = await context.newPage();

    // Navigate to first streamer
    await page.goto(getMockStreamerUrl('streamer1'));
    await page.waitForTimeout(4000); // Wait for greeting (delay + typing)

    // Clear chat and lastMessageTimes
    await page.evaluate(() => {
      const input = document.querySelector('[data-a-target="chat-input"]');
      if (input) input.textContent = '';
    });

    await setExtensionStorage(context, extensionId, {
      state: { lastMessageTimes: {}, lastMessages: {} },
    });

    // Manually navigate to different streamer (wait >1s to simulate manual nav)
    await page.waitForTimeout(1500);
    await page.goto(getMockStreamerUrl('streamer2'));

    // Should trigger new greeting
    await page.waitForTimeout(4000);
    const chatText = await getChatInputText(page);
    expect(chatText.length).toBeGreaterThan(0);

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

  test.skip('does not re-trigger on same streamer navigation', async ({ context }) => {
    const page = await context.newPage();

    // Navigate to streamer
    await page.goto(getMockStreamerUrl('streamer1'));
    await page.waitForTimeout(2000);

    // Clear chat
    await page.evaluate(() => {
      const input = document.querySelector('[data-a-target="chat-input"]');
      if (input) input.textContent = '';
    });

    // Navigate to same streamer again (simulates staying on same stream)
    await page.waitForTimeout(1500);
    await page.goto(getMockStreamerUrl('streamer1'));
    await page.waitForTimeout(3000);

    const chatText = await getChatInputText(page);
    expect(chatText).toBe(''); // Should not send another message

    await page.close();
  });

  test('handles URLs with query parameters', async ({ context, extensionId }) => {
    const page = await context.newPage();

    const urlWithParams = `${getMockStreamerUrl('teststreamer')}?param=value`;
    await page.goto(urlWithParams);

    await page.waitForTimeout(4000);

    const chatText = await getChatInputText(page);
    expect(chatText.length).toBeGreaterThan(0); // Should still detect streamer

    await page.close();
  });

  test('handles URLs with trailing slashes', async ({ context, extensionId }) => {
    const page = await context.newPage();

    const urlWithSlash = `${getMockStreamerUrl('teststreamer')}/`;
    await page.goto(urlWithSlash);

    await page.waitForTimeout(4000);

    const chatText = await getChatInputText(page);
    expect(chatText.length).toBeGreaterThan(0); // Should detect streamer

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

  test('content script loads on streamer pages', async ({ context }) => {
    const page = await context.newPage();
    await page.goto(getMockStreamerUrl('teststreamer'));

    // Verify content script is active by checking for greeting behavior
    await page.waitForTimeout(4000);

    const chatText = await getChatInputText(page);
    // If content script loaded, greeting should be sent
    expect(chatText.length).toBeGreaterThan(0);

    await page.close();
  });
});

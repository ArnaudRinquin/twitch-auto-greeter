import type { BrowserContext, Page } from '@playwright/test';
import type { Config, State } from '../../../types';

export async function getExtensionStorage(
  context: BrowserContext,
  extensionId: string
): Promise<{ config: Config; state: State }> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);

  const storage = await page.evaluate(() => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['config', 'state'], (result) => resolve(result));
    });
  });

  await page.close();
  return storage as { config: Config; state: State };
}

export async function setExtensionStorage(
  context: BrowserContext,
  extensionId: string,
  data: { config?: Config; state?: State }
): Promise<void> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);

  await page.evaluate((storageData) => {
    return new Promise((resolve) => {
      chrome.storage.local.set(storageData, () => resolve(undefined));
    });
  }, data);

  await page.close();
}

export async function clearExtensionStorage(
  context: BrowserContext,
  extensionId: string
): Promise<void> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);

  await page.evaluate(() => {
    return new Promise((resolve) => {
      chrome.storage.local.clear(() => resolve(undefined));
    });
  });

  await page.close();
}

export function getMockStreamerUrl(streamerName: string): string {
  return `http://localhost:3456/mock-streamer-page.html?streamer=${streamerName}`;
}

export function getMockDirectoryUrl(): string {
  return `http://localhost:3456/mock-directory-page.html`;
}

export async function waitForChatMessage(page: Page, expectedText: string, timeoutMs = 30000): Promise<boolean> {
  try {
    await page.waitForFunction(
      (text) => {
        const input = document.querySelector('[data-a-target="chat-input"]');
        return input?.textContent?.includes(text);
      },
      expectedText,
      { timeout: timeoutMs }
    );
    return true;
  } catch {
    return false;
  }
}

export async function getChatInputText(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const input = document.querySelector('[data-a-target="chat-input"]');
    return input?.textContent || '';
  });
}

export async function isChatSendButtonVisible(page: Page): Promise<boolean> {
  const button = page.locator('[data-a-target="chat-send-button"]');
  return await button.isVisible();
}

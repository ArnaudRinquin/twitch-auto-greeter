import { test, expect } from './fixtures/extension';
import { getExtensionStorage, setExtensionStorage } from './utils/extension';
import { DEFAULT_CONFIG } from '../../types';

test.describe('Options Page', () => {
  test.beforeEach(async ({ context, extensionId }) => {
    // Reset to default config before each test
    await setExtensionStorage(context, extensionId, {
      config: DEFAULT_CONFIG,
      state: { lastMessageTimes: {} },
    });
  });

  test('loads and displays default configuration', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Check enabled toggle
    const enabledToggle = page.locator('input[type="checkbox"]').first();
    await expect(enabledToggle).toBeChecked();

    // Check default frequency
    const frequencyInput = page.locator('input[type="number"]').first();
    await expect(frequencyInput).toHaveValue('24');

    // Check default delay range
    const delayMinInput = page.locator('input[type="number"]').nth(1);
    const delayMaxInput = page.locator('input[type="number"]').nth(2);
    await expect(delayMinInput).toHaveValue('10');
    await expect(delayMaxInput).toHaveValue('15');

    // Check default messages exist
    const messages = page.locator('.bg-gray-50.p-3').filter({ hasText: /Hi|Hey/ });
    await expect(messages).toHaveCount(2);

    await page.close();
  });

  test.skip('can toggle extension enabled/disabled', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const enabledToggle = page.locator('input[type="checkbox"]').first();

    // Disable
    await enabledToggle.uncheck();
    await page.waitForTimeout(500); // Wait for storage update

    let storage = await getExtensionStorage(context, extensionId);
    expect(storage.config.enabled).toBe(false);

    // Re-enable
    await enabledToggle.check();
    await page.waitForTimeout(500);

    storage = await getExtensionStorage(context, extensionId);
    expect(storage.config.enabled).toBe(true);

    await page.close();
  });

  test('can update frequency setting', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const frequencyInput = page.locator('input[type="number"]').first(); // First number input
    await frequencyInput.fill('48');
    await page.waitForTimeout(500);

    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.config.defaultFrequency).toBe(48 * 3600000); // Convert to milliseconds

    await page.close();
  });

  test('can update delay range', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const delayMinInput = page.locator('input[type="number"]').nth(1); // Second number input (after frequency)
    const delayMaxInput = page.locator('input[type="number"]').nth(2); // Third number input

    await delayMinInput.fill('5');
    await delayMaxInput.fill('20');
    await page.waitForTimeout(500);

    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.config.delayRange).toEqual([5, 20]);

    await page.close();
  });

  test('can add a new message', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const newMessageInput = page.locator('input[placeholder*="Message text"]');
    const addButton = page.getByRole('button', { name: /add message/i });

    await newMessageInput.fill('Hello from test!');
    await addButton.click();
    await page.waitForTimeout(500);

    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.config.messages).toHaveLength(3);
    expect(storage.config.messages[2].text).toBe('Hello from test!');

    await page.close();
  });

  test('can delete a message', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const deleteButtons = page.getByRole('button', { name: /delete/i });
    const initialCount = await deleteButtons.count();

    await deleteButtons.first().click();
    await page.waitForTimeout(500);

    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.config.messages).toHaveLength(initialCount - 1);

    await page.close();
  });

  test('can add message with streamer placeholder', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const newMessageInput = page.locator('input[placeholder*="Message text"]');
    const addButton = page.getByRole('button', { name: /add message/i });

    await newMessageInput.fill('Hi <streamer>!');
    await addButton.click();
    await page.waitForTimeout(500);

    const storage = await getExtensionStorage(context, extensionId);
    const lastMessage = storage.config.messages[storage.config.messages.length - 1];
    expect(lastMessage.text).toBe('Hi <streamer>!');

    await page.close();
  });

  test('can add streamers to enabled list', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const enabledInput = page.locator('input[placeholder*="Enter streamer name"]').first();
    const addEnabledButton = page.locator('.bg-green-600').filter({ hasText: 'Add' });

    await enabledInput.fill('streamer1');
    await addEnabledButton.click();
    await page.waitForTimeout(500);

    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.config.enabledStreamers).toContain('streamer1');

    await page.close();
  });

  test('can add streamers to disabled list', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const disabledInput = page.locator('input[placeholder*="Enter streamer name"]').last();
    const addDisabledButton = page.locator('.bg-red-600').filter({ hasText: 'Add' });

    await disabledInput.fill('annoying_streamer');
    await addDisabledButton.click();
    await page.waitForTimeout(500);

    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.config.disabledStreamers).toContain('annoying_streamer');

    await page.close();
  });

  test('can clear greeting history', async ({ context, extensionId }) => {
    // Setup: Add some greeting history
    await setExtensionStorage(context, extensionId, {
      state: {
        lastMessageTimes: {
          streamer1: Date.now(),
          streamer2: Date.now() - 1000000,
        },
      },
    });

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const clearHistoryButton = page.getByRole('button', { name: /clear history/i });
    await clearHistoryButton.click();
    await page.waitForTimeout(500);

    const storage = await getExtensionStorage(context, extensionId);
    expect(Object.keys(storage.state.lastMessageTimes)).toHaveLength(0);

    await page.close();
  });

  test.skip('displays greeting history with timestamps', async ({ context, extensionId }) => {
    const now = Date.now();
    await setExtensionStorage(context, extensionId, {
      state: {
        lastMessageTimes: {
          streamer1: now,
          streamer2: now - 3600000, // 1 hour ago
        },
      },
    });

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // More specific selector - only in the Greeting History section
    const historySection = page.locator('text=Greeting History').locator('..');
    const historyItems = historySection.locator('.bg-gray-50.p-3.rounded-md');
    await expect(historyItems).toHaveCount(2);

    await page.close();
  });
});

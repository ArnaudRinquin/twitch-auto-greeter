import { test, expect } from './fixtures/extension';
import { getExtensionStorage, setExtensionStorage } from './utils/extension';
import { DEFAULT_CONFIG } from '../../types';

test.describe('Options Page', () => {
  test.beforeEach(async ({ context, extensionId }) => {
    // Reset to default config before each test
    await setExtensionStorage(context, extensionId, {
      config: DEFAULT_CONFIG,
      state: { lastMessageTimes: {}, lastMessages: {} },
    });
  });

  test('loads and displays default configuration', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Check enabled toggle
    const enabledToggle = page.getByRole('checkbox', { name: /enable auto-greeter/i });
    await expect(enabledToggle).toBeChecked();

    // Check default frequency
    const frequencyInput = page.getByLabel('Greeting Frequency (hours)');
    await expect(frequencyInput).toHaveValue('24');

    // Check default delay range
    const delayMinInput = page.getByLabel('Minimum delay in seconds');
    const delayMaxInput = page.getByLabel('Maximum delay in seconds');
    await expect(delayMinInput).toHaveValue('10');
    await expect(delayMaxInput).toHaveValue('15');

    // Check default messages exist (DEFAULT_CONFIG has 37 messages)
    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.config.messages.length).toBe(37);

    await page.close();
  });

  test('can toggle extension enabled/disabled', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const enabledToggle = page.getByRole('checkbox', { name: /enable auto-greeter/i });

    // Disable
    await enabledToggle.click();
    await page.waitForTimeout(500); // Wait for storage update

    let storage = await getExtensionStorage(context, extensionId);
    expect(storage.config.enabled).toBe(false);

    // Re-enable
    await enabledToggle.click();
    await page.waitForTimeout(500);

    storage = await getExtensionStorage(context, extensionId);
    expect(storage.config.enabled).toBe(true);

    await page.close();
  });

  test('can update frequency setting', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const frequencyInput = page.getByLabel('Greeting Frequency (hours)');
    await frequencyInput.fill('48');
    await page.waitForTimeout(500);

    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.config.defaultFrequency).toBe(48 * 3600000); // Convert to milliseconds

    await page.close();
  });

  test('can update delay range', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const delayMinInput = page.getByLabel('Minimum delay in seconds');
    const delayMaxInput = page.getByLabel('Maximum delay in seconds');

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

    const newMessageInput = page.getByLabel('New message text');
    const addButton = page.getByRole('button', { name: /add message/i });

    await newMessageInput.fill('Hello from test!');
    await addButton.click();
    await page.waitForTimeout(500);

    const storage = await getExtensionStorage(context, extensionId);
    expect(storage.config.messages).toHaveLength(38); // 37 default + 1 new
    expect(storage.config.messages[37].text).toBe('Hello from test!');

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

    const newMessageInput = page.getByLabel('New message text');
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

    const enabledInput = page.getByLabel('Add enabled streamer');
    const addEnabledButton = page.getByRole('button', { name: 'Add' }).first();

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

    const disabledInput = page.getByLabel('Add disabled streamer');
    const addDisabledButton = page.getByRole('button', { name: 'Add' }).last();

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
        lastMessages: {},
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

  test('displays greeting history with timestamps', async ({ context, extensionId }) => {
    const now = Date.now();
    await setExtensionStorage(context, extensionId, {
      state: {
        lastMessageTimes: {
          streamer1: now,
          streamer2: now - 3600000, // 1 hour ago
        },
        lastMessages: {},
      },
    });

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const historyItems = page.getByRole('listitem');
    await expect(historyItems).toHaveCount(2);

    await page.close();
  });
});

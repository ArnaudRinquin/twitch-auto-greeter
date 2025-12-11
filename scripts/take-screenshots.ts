import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function takeScreenshots() {
  console.log('Starting screenshot capture...');

  // Build the extension first
  console.log('Building extension...');
  const { execSync } = await import('child_process');
  execSync('pnpm build', { stdio: 'inherit' });

  const extensionPath = path.join(__dirname, '..', '.output', 'chrome-mv3');

  const userDataDir = path.join(__dirname, '..', '.playwright-temp');
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
    viewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();

  // Get the extension ID by listing service workers
  const extensionTarget = browser
    .serviceWorkers()[0]
    ?.url()
    .match(/chrome-extension:\/\/([a-z]+)\//)?.[1];

  if (!extensionTarget) {
    throw new Error('Could not find extension ID');
  }

  console.log(`Extension ID: ${extensionTarget}`);

  // Navigate to options page
  await page.goto(`chrome-extension://${extensionTarget}/options.html`);

  // Wait a moment for page to load
  await page.waitForTimeout(2000);

  const screenshotDir = path.join(__dirname, '..', 'store', 'screenshots');

  // Create screenshots directory
  const { mkdirSync } = await import('fs');
  try {
    mkdirSync(screenshotDir, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }

  console.log('Taking screenshots...');

  // Screenshot 1: Full options page overview
  await page.screenshot({
    path: path.join(screenshotDir, '1-options-overview.png'),
    fullPage: false,
  });
  console.log('✓ Screenshot 1: Options overview');

  // Screenshot 2: Scroll to messages section
  await page.evaluate(() => {
    const messagesHeading = Array.from(document.querySelectorAll('h2')).find(
      (h) => h.textContent?.includes('Messages'),
    );
    if (messagesHeading) {
      messagesHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(screenshotDir, '2-message-configuration.png'),
    fullPage: false,
  });
  console.log('✓ Screenshot 2: Message configuration');

  // Screenshot 3: Focus on filter controls
  const filterByStreamerLabel = page.locator('text=Filter by Streamer').first();
  if ((await filterByStreamerLabel.count()) > 0) {
    await filterByStreamerLabel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Highlight the filter section by focusing on it
    await page.evaluate(() => {
      const filterSection = document.querySelector('.bg-gray-50.rounded-md');
      if (filterSection) {
        filterSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, '3-message-filters.png'),
      fullPage: false,
    });
    console.log('✓ Screenshot 3: Message filters');
  }

  // Screenshot 4: Scroll to history section
  const historySection = page.locator('text=Greeting History').first();
  if ((await historySection.count()) > 0) {
    await historySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotDir, '4-greeting-history.png'),
      fullPage: false,
    });
    console.log('✓ Screenshot 4: Greeting history');
  }

  console.log(`\nScreenshots saved to: ${screenshotDir}`);

  await browser.close();

  // Generate promo tiles
  console.log('\n=== Generating Promo Tiles ===\n');

  const promoBrowser = await chromium.launch({ headless: false });
  const promoContext = await promoBrowser.newContext();
  const promoPage = await promoContext.newPage();

  const htmlPath = path.join(__dirname, '..', 'store', 'promo-tiles.html');
  await promoPage.goto(`file://${htmlPath}`);

  const promoDir = path.join(__dirname, '..', 'store', 'promo');

  try {
    mkdirSync(promoDir, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }

  console.log('Taking promotional tile screenshots...');

  // Small Promo Tile - 440x280
  const smallTile = promoPage.locator('#small-tile');
  await smallTile.screenshot({
    path: path.join(promoDir, 'small-promo-tile.png'),
  });
  console.log('✓ Small promo tile (440x280)');

  // Marquee Promo Tile - 1400x560
  const marqueeTile = promoPage.locator('#marquee-tile');
  await marqueeTile.screenshot({
    path: path.join(promoDir, 'marquee-promo-tile.png'),
  });
  console.log('✓ Marquee promo tile (1400x560)');

  console.log(`\nPromo tiles saved to: ${promoDir}`);
  console.log('Note: Chrome Web Store requires JPEG or 24-bit PNG (no alpha)');

  await promoBrowser.close();
  console.log('\nDone!');
}

takeScreenshots().catch(console.error);

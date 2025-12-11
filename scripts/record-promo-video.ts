import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function recordPromoVideo() {
  console.log('Starting promo video recording...');
  console.log('This will record a demo of the extension in action.\n');

  // Build the extension first
  console.log('Building extension...');
  const { execSync } = await import('child_process');
  execSync('pnpm build', { stdio: 'inherit' });

  const extensionPath = path.join(__dirname, '..', '.output', 'chrome-mv3');
  const userDataDir = path.join(__dirname, '..', '.playwright-temp');

  const videoDir = path.join(__dirname, '..', 'store', 'video');
  const { mkdirSync } = await import('fs');
  try {
    mkdirSync(videoDir, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }

  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await browser.newPage();

  // Add cursor highlighting CSS
  await page.addStyleTag({
    content: `
      * {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M5 3 L5 27 L12 20 L17 29 L20 28 L15 19 L23 19 Z" fill="black" stroke="white" stroke-width="2"/></svg>') 0 0, auto !important;
      }

      @keyframes click-pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(147, 70, 255, 0.7);
        }
        50% {
          box-shadow: 0 0 0 20px rgba(147, 70, 255, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(147, 70, 255, 0);
        }
      }

      .playwright-click-highlight {
        animation: click-pulse 0.6s ease-out !important;
      }

      input:focus, select:focus, textarea:focus, button:focus {
        outline: 3px solid #9146FF !important;
        outline-offset: 2px !important;
      }
    `,
  });

  // Get the extension ID
  const extensionTarget = browser
    .serviceWorkers()[0]
    ?.url()
    .match(/chrome-extension:\/\/([a-z]+)\//)?.[1];

  if (!extensionTarget) {
    throw new Error('Could not find extension ID');
  }

  console.log(`Extension ID: ${extensionTarget}`);
  console.log('\nRecording scenario: Extension settings tour\n');

  // Scenario: Show extension settings
  console.log('Step 1: Opening extension settings...');
  await page.goto(`chrome-extension://${extensionTarget}/options.html`);
  await page.waitForTimeout(2000);

  console.log('Step 2: Showing enabled toggle...');
  await page.waitForTimeout(1500);

  console.log('Step 3: Scrolling to messages section...');
  await page.evaluate(() => {
    const messagesHeading = Array.from(document.querySelectorAll('h2')).find(
      (h) => h.textContent?.includes('Messages'),
    );
    if (messagesHeading) {
      messagesHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  await page.waitForTimeout(2000);

  console.log('Step 4: Adding sample message for demo...');
  // Scroll to "Add New Message" section
  await page.evaluate(() => {
    const addHeading = Array.from(document.querySelectorAll('h3')).find(
      (h) => h.textContent?.includes('Add New Message'),
    );
    if (addHeading) {
      addHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  await page.waitForTimeout(1500);

  // Fill in message text
  const messageInput = page.locator('input[placeholder*="Message text"]').first();
  if ((await messageInput.count()) > 0) {
    await messageInput.click();
    await page.waitForTimeout(400);
    await messageInput.fill('Hey <streamer>! Great stream today!');
    await page.waitForTimeout(800);
  }

  // Fill in streamer name
  const streamerInput = page.locator('input[placeholder*="Streamers"]').first();
  if ((await streamerInput.count()) > 0) {
    await streamerInput.click();
    await page.waitForTimeout(400);
    await streamerInput.fill('ExampleStreamer');
    await page.waitForTimeout(800);
  }

  // Click Add Message button
  const addMessageButton = page.locator('button:has-text("Add Message")').first();
  if ((await addMessageButton.count()) > 0) {
    await addMessageButton.evaluate((el) => {
      el.classList.add('playwright-click-highlight');
      setTimeout(() => el.classList.remove('playwright-click-highlight'), 600);
    });
    await addMessageButton.click();
    await page.waitForTimeout(1000);
  }

  console.log('Step 5: Demonstrating message filtering...');
  await page.evaluate(() => {
    const filterSection = document.querySelector('.bg-gray-50.rounded-md');
    if (filterSection) {
      filterSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  await page.waitForTimeout(1500);

  // Interact with streamer filter dropdown
  const streamerFilter = page.locator('select[class*="border-gray-300"]').first();
  if ((await streamerFilter.count()) > 0) {
    // Highlight and focus
    await streamerFilter.evaluate((el) => {
      el.classList.add('playwright-click-highlight');
      setTimeout(() => el.classList.remove('playwright-click-highlight'), 600);
    });
    await streamerFilter.focus();
    await page.waitForTimeout(800);

    // Check if we have options
    const options = await streamerFilter.locator('option').all();
    if (options.length > 1) {
      // Select the streamer
      await streamerFilter.selectOption({ index: 1 });
      await page.waitForTimeout(1500);

      // Reset filter
      await streamerFilter.selectOption({ index: 0 });
      await page.waitForTimeout(1000);
    }
  }

  console.log('Step 6: Showing greeting history...');
  const historySection = page.locator('text=Greeting History').first();
  if ((await historySection.count()) > 0) {
    await historySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
  }

  console.log('Step 7: Scrolling back to top...');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(1500);

  console.log('\nRecording complete!');
  console.log('Closing browser and saving video...');

  const videoPath = await page.video()?.path();
  await page.close();
  await browser.close();

  if (!videoPath) {
    console.error('No video was recorded');
    return;
  }

  console.log(`\nVideo saved to: ${videoPath}`);

  // Rename and convert to MP4
  const { renameSync, existsSync } = await import('fs');
  const webmPath = path.join(videoDir, 'promo.webm');
  const mp4Path = path.join(videoDir, 'promo.mp4');

  // Rename the video file
  if (existsSync(videoPath)) {
    renameSync(videoPath, webmPath);
    console.log(`Renamed to: ${webmPath}`);
  }

  // Convert to MP4 with ffmpeg
  console.log('\nConverting to MP4...');
  try {
    execSync(
      `ffmpeg -y -i "${webmPath}" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k "${mp4Path}"`,
      { stdio: 'inherit' },
    );
    console.log(`\n✓ MP4 saved to: ${mp4Path}`);
  } catch (err) {
    console.error('\n✗ ffmpeg conversion failed. Make sure ffmpeg is installed:');
    console.error('  brew install ffmpeg');
    console.error('\nYou can manually convert with:');
    console.error(`  ffmpeg -i "${webmPath}" -c:v libx264 -preset medium -crf 23 "${mp4Path}"`);
  }

  console.log('\nDone!');
}

recordPromoVideo().catch(console.error);

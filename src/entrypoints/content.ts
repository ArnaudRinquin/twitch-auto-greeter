export default defineContentScript({
  matches: ['*://*.twitch.tv/*', '*://localhost:*/*'],
  async main() {
    console.log('[Twitch Auto-Greeter] Content script loaded');

    let currentUrl = window.location.href;
    let lastNavigationTime = Date.now();
    let greetingInProgress = false;

    // Import core functions
    const { createStreamInfo, isManualNavigation, isStreamPage } =
      await import('../core/stream-detector');
    const { waitForLanguageTags } = await import('../core/language-detector');

    // Check current page on load
    checkAndGreetIfNeeded();

    // Monitor URL changes (for SPAs like Twitch)
    setInterval(() => {
      const newUrl = window.location.href;

      if (newUrl !== currentUrl) {
        const now = Date.now();
        const timeSinceLastNav = now - lastNavigationTime;

        console.log(`[Content] URL changed: ${newUrl}`);

        // Check if this is manual navigation
        if (isManualNavigation(currentUrl, newUrl, timeSinceLastNav)) {
          console.log('[Content] Manual navigation detected');
          currentUrl = newUrl;
          lastNavigationTime = now;
          checkAndGreetIfNeeded();
        } else {
          console.log('[Content] Auto-navigation detected, ignoring');
          currentUrl = newUrl;
          lastNavigationTime = now;
        }
      }
    }, 1000); // Check every second

    async function checkAndGreetIfNeeded() {
      // Don't start a new greeting if one is already in progress
      if (greetingInProgress) {
        console.log('[Content] Greeting already in progress, skipping');
        return;
      }

      // Check if we're on a stream page
      if (!isStreamPage(window.location.href)) {
        console.log('[Content] Not a stream page, skipping');
        return;
      }

      const streamInfo = createStreamInfo(window.location.href);

      if (!streamInfo) {
        console.log('[Content] Could not extract stream info');
        return;
      }

      // Wait for language tags to load (async rendered by React)
      const languages = await waitForLanguageTags(5000);

      // Add languages to stream info
      streamInfo.languages = languages;

      console.log(
        `[Content] On stream page: ${streamInfo.streamerName}, languages: ${languages.join(', ') || 'none'}`,
      );

      greetingInProgress = true;

      try {
        // Request greeting from background script
        const response = await browser.runtime.sendMessage({
          type: 'GREETING_REQUEST',
          streamInfo,
        });

        console.log('[Content] Received response:', response);

        if (!response) {
          console.error('[Content] No response from background script');
          return;
        }

        if (response.error) {
          console.log(`[Content] Cannot send greeting: ${response.error}`);
          return;
        }

        if (response.message && response.delay && response.streamerName) {
          const success = await sendGreetingAfterDelay(
            response.message,
            response.delay,
            response.streamerName,
          );

          if (success) {
            // Confirm successful send to background script
            await browser.runtime.sendMessage({
              type: 'GREETING_SENT',
              streamerName: response.streamerName,
              sentMessage: response.message,
            });
          }
        }
      } catch (error) {
        console.error('[Content] Error requesting greeting:', error);
      } finally {
        greetingInProgress = false;
      }
    }

    async function sendGreetingAfterDelay(
      message: string,
      delaySeconds: number,
      expectedStreamer: string,
    ): Promise<boolean> {
      console.log(`[Content] Waiting ${delaySeconds}s before sending message`);

      // Wait for the specified delay
      await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));

      // Re-validate: check we're still on the expected streamer's page
      const currentStreamInfo = createStreamInfo(window.location.href);
      if (
        !currentStreamInfo ||
        currentStreamInfo.streamerName.toLowerCase() !== expectedStreamer.toLowerCase()
      ) {
        console.log(
          `[Content] Aborting send - navigated away from ${expectedStreamer} to ${currentStreamInfo?.streamerName || 'unknown'}`,
        );
        return false;
      }

      // Find the chat input
      const chatInput = document.querySelector<HTMLElement>(
        '[data-a-target="chat-input"]',
      );

      if (!chatInput) {
        console.error('[Content] Chat input not found');
        return false;
      }

      // Find the send button
      const sendButton = document.querySelector<HTMLButtonElement>(
        '[data-a-target="chat-send-button"]',
      );

      if (!sendButton) {
        console.error('[Content] Send button not found');
        return false;
      }

      try {
        // Focus the input
        chatInput.focus();

        // Clear existing content first
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(chatInput);
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.execCommand('delete', false);

        // Wait for clear to complete
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Insert message character by character with full keyboard event sequences
        // This is required to properly update Slate's internal state
        let insertedText = '';
        for (let i = 0; i < message.length; i++) {
          const char = message[i];
          let retries = 0;
          let success = false;

          while (!success && retries < 3) {
            const beforeText = chatInput.textContent || '';

            // Keydown event
            const keydownEvent = new KeyboardEvent('keydown', {
              key: char,
              code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
              bubbles: true,
              cancelable: true,
            });
            chatInput.dispatchEvent(keydownEvent);

            // BeforeInput event
            const beforeInputEvent = new InputEvent('beforeinput', {
              bubbles: true,
              cancelable: true,
              inputType: 'insertText',
              data: char,
            });
            chatInput.dispatchEvent(beforeInputEvent);

            // Actually insert the character
            document.execCommand('insertText', false, char);

            // Input event
            const inputEvent = new InputEvent('input', {
              bubbles: true,
              cancelable: false,
              inputType: 'insertText',
              data: char,
            });
            chatInput.dispatchEvent(inputEvent);

            // Keyup event
            const keyupEvent = new KeyboardEvent('keyup', {
              key: char,
              code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
              bubbles: true,
              cancelable: true,
            });
            chatInput.dispatchEvent(keyupEvent);

            // Wait and check if character was inserted
            await new Promise((resolve) => setTimeout(resolve, 20));
            const afterText = chatInput.textContent || '';

            if (afterText === beforeText + char || afterText === insertedText + char) {
              success = true;
              insertedText += char;
            } else {
              retries++;
              console.log(
                `[Content] Retry ${retries} for char '${char}' - expected: '${insertedText + char}', got: '${afterText}'`,
              );
            }
          }

          if (!success) {
            console.error(
              `[Content] Failed to insert char '${char}' after 3 retries`,
            );
            return false;
          }
        }

        // Wait for Slate to process
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Click the send button
        sendButton.click();

        console.log(`[Content] Successfully sent message: "${message}"`);
        return true;
      } catch (error) {
        console.error('[Content] Error sending message:', error);
        return false;
      }
    }
  },
});

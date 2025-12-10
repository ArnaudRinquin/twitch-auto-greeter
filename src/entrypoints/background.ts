export default defineBackground(() => {
  console.log('[Twitch Auto-Greeter] Background script loaded');

  // Open options page when extension icon is clicked
  browser.action.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
  });

  // Listen for messages from content scripts
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('[Background] Received message:', message);

    if (message.type === 'GREETING_REQUEST') {
      handleGreetingRequest(message)
        .then((response) => {
          console.log('[Background] Sending response:', response);
          sendResponse(response);
        })
        .catch((error) => {
          console.error('[Background] Error handling greeting request:', error);
          sendResponse({
            type: 'GREETING_RESPONSE',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });

      return true; // Keep message channel open for async response
    }

    if (message.type === 'GREETING_SENT') {
      handleGreetingSent(message)
        .then((response) => {
          sendResponse(response);
        })
        .catch((error) => {
          console.error('[Background] Error handling greeting confirmation:', error);
          sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
        });

      return true; // Keep message channel open for async response
    }

    sendResponse({ error: 'Unknown message type' });
    return true;
  });
});

async function handleGreetingRequest(request: any) {
  const { getConfig, canSendMessage } = await import(
    '../core/storage'
  );
  const { getMessageForStreamer, generateRandomDelay } = await import(
    '../core/message-selector'
  );

  const { streamInfo } = request;
  const { streamerName, languages } = streamInfo;

  console.log(`[Background] Processing greeting request for ${streamerName}, languages: ${languages?.join(', ') || 'none'}`);

  // Get configuration
  const config = await getConfig();

  // Check if extension is enabled
  if (!config.enabled) {
    console.log('[Background] Extension is disabled');
    return {
      type: 'GREETING_RESPONSE',
      error: 'Extension is disabled',
    };
  }

  // Check if streamer is in disabled list
  if (config.disabledStreamers?.some((s) => s.toLowerCase() === streamerName.toLowerCase())) {
    console.log(`[Background] ${streamerName} is in disabled list`);
    return {
      type: 'GREETING_RESPONSE',
      error: 'Streamer is disabled',
    };
  }

  // Check if streamer is in enabled list (if list is not empty)
  if (config.enabledStreamers && config.enabledStreamers.length > 0) {
    if (!config.enabledStreamers.some((s) => s.toLowerCase() === streamerName.toLowerCase())) {
      console.log(`[Background] ${streamerName} is not in enabled list`);
      return {
        type: 'GREETING_RESPONSE',
        error: 'Streamer not in enabled list',
      };
    }
  }

  // Check if we can send a message (frequency limit)
  const canSend = await canSendMessage(streamerName, config.defaultFrequency);

  if (!canSend) {
    console.log(`[Background] Too soon to send another message to ${streamerName}`);
    return {
      type: 'GREETING_RESPONSE',
      error: 'Frequency limit not reached',
    };
  }

  // Get appropriate message for this streamer and language
  const message = getMessageForStreamer(config.messages, streamerName, languages || []);

  if (!message) {
    console.log(`[Background] No applicable messages for ${streamerName} with languages ${languages?.join(', ') || 'none'}`);
    return {
      type: 'GREETING_RESPONSE',
      error: 'No applicable messages for this streamer and language combination',
    };
  }

  // Generate random delay
  const delay = generateRandomDelay(
    config.delayRange[0],
    config.delayRange[1],
  );

  console.log(
    `[Background] Will send "${message}" to ${streamerName} after ${delay}s`,
  );

  return {
    type: 'GREETING_RESPONSE',
    message,
    delay,
    streamerName,
  };
}

async function handleGreetingSent(message: any) {
  const { updateLastMessageTime, updateLastMessage } = await import('../core/storage');
  const { streamerName, sentMessage } = message;

  console.log(`[Background] Confirming greeting sent to ${streamerName}: "${sentMessage}"`);
  await updateLastMessageTime(streamerName);
  await updateLastMessage(streamerName, sentMessage);

  return { success: true };
}

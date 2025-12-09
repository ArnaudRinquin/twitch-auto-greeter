import type { MessageConfig } from '../types';

/**
 * Filter messages that are applicable for the given streamer
 */
export function filterMessagesForStreamer(
  messages: MessageConfig[],
  streamerName: string,
): MessageConfig[] {
  return messages.filter((msg) => {
    // If no streamers specified, message applies to all
    if (!msg.streamers || msg.streamers.length === 0) {
      return true;
    }

    // Check if streamer is in the allowed list (case-insensitive)
    return msg.streamers.some(
      (s) => s.toLowerCase() === streamerName.toLowerCase(),
    );
  });
}

/**
 * Select a random message from the array
 */
export function selectRandomMessage(messages: MessageConfig[]): MessageConfig | null {
  if (messages.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

/**
 * Interpolate the <streamer> placeholder with the actual streamer name
 */
export function interpolateMessage(messageText: string, streamerName: string): string {
  return messageText.replace(/<streamer>/gi, streamerName);
}

/**
 * Main function: select an appropriate message for the given streamer
 */
export function getMessageForStreamer(
  messages: MessageConfig[],
  streamerName: string,
): string | null {
  // Filter messages for this streamer
  const applicableMessages = filterMessagesForStreamer(messages, streamerName);

  if (applicableMessages.length === 0) {
    return null; // No messages available for this streamer
  }

  // Select random message
  const selectedMessage = selectRandomMessage(applicableMessages);

  if (!selectedMessage) {
    return null;
  }

  // Interpolate and return
  return interpolateMessage(selectedMessage.text, streamerName);
}

/**
 * Generate a random delay within the specified range (in seconds)
 */
export function generateRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

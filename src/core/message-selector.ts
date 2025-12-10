import type { MessageConfig } from '../types';

/**
 * Filter messages that are applicable for the given streamer with priority strategy:
 *
 * 1. First try: messages specifically for this streamer
 * 2. Fallback: messages with no streamer restriction (generic)
 *
 * This ensures streamer-specific messages are used exclusively when available.
 */
export function filterMessagesForStreamer(
  messages: MessageConfig[],
  streamerName: string,
): MessageConfig[] {
  // Try to find streamer-specific messages first
  const streamerSpecificMessages = messages.filter((msg) => {
    if (msg.streamers.length === 0) {
      return false; // Will be used as fallback
    }

    // Check if streamer is in the allowed list (case-insensitive)
    return msg.streamers.some(
      (s) => s.toLowerCase() === streamerName.toLowerCase(),
    );
  });

  // If we found streamer-specific messages, use them exclusively
  if (streamerSpecificMessages.length > 0) {
    return streamerSpecificMessages;
  }

  // Fallback: use generic messages (no streamer restriction)
  return messages.filter((msg) => msg.streamers.length === 0);
}

/**
 * Filter messages by language with fallback strategy:
 *
 * 1. If stream has language tags:
 *    - First try: messages with ANY matching language (OR logic)
 *      e.g., msg['en','fr'] matches stream['en','de'] because 'en' is common
 *    - Fallback: messages with empty languages[] (language-agnostic)
 *
 * 2. If stream has NO language tags:
 *    - Use only messages with empty languages[] (avoid language-specific msgs)
 *
 * @param messages Messages to filter
 * @param streamLanguages ISO language codes from stream tags (e.g., ['en', 'fr'])
 * @returns Filtered messages
 */
export function filterMessagesByLanguage(
  messages: MessageConfig[],
  streamLanguages: string[],
): MessageConfig[] {
  // If stream has no language tags, use only language-agnostic messages
  if (streamLanguages.length === 0) {
    return messages.filter((msg) => msg.languages.length === 0);
  }

  // Try to find messages with matching languages (ANY match - OR logic)
  const languageSpecificMessages = messages.filter((msg) => {
    if (msg.languages.length === 0) {
      return false; // Will be used as fallback
    }

    // Check if ANY message language matches ANY stream language
    return msg.languages.some((lang) => streamLanguages.includes(lang));
  });

  // If we found language-specific matches, use them
  if (languageSpecificMessages.length > 0) {
    return languageSpecificMessages;
  }

  // Fallback: use language-agnostic messages
  return messages.filter((msg) => msg.languages.length === 0);
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
 * Main function: select an appropriate message for the given streamer and language
 */
export function getMessageForStreamer(
  messages: MessageConfig[],
  streamerName: string,
  streamLanguages: string[] = [],
): string | null {
  // Filter by streamer first
  let applicableMessages = filterMessagesForStreamer(messages, streamerName);

  if (applicableMessages.length === 0) {
    return null; // No messages available for this streamer
  }

  // Then filter by language
  applicableMessages = filterMessagesByLanguage(applicableMessages, streamLanguages);

  if (applicableMessages.length === 0) {
    return null; // No messages available for this language combination
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

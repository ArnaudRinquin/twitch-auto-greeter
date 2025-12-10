import { describe, it, expect } from 'vitest';
import {
  filterMessagesForStreamer,
  filterMessagesByLanguage,
  selectRandomMessage,
  interpolateMessage,
  getMessageForStreamer,
  generateRandomDelay,
} from './message-selector';
import type { MessageConfig } from '../types';

describe('message-selector', () => {
  describe('filterMessagesForStreamer', () => {
    it('should return all messages when no streamers are specified', () => {
      const messages: MessageConfig[] = [
        { text: 'Hi!', streamers: [], languages: [] },
        { text: 'Hello!', streamers: [], languages: [] },
      ];

      const result = filterMessagesForStreamer(messages, 'teststreamer');
      expect(result).toEqual(messages);
    });

    it('should prioritize streamer-specific messages over generic', () => {
      const messages: MessageConfig[] = [
        { text: 'Hi!', streamers: ['streamer1'], languages: [] },
        { text: 'Hello!', streamers: ['streamer2'], languages: [] },
        { text: 'Hey!', streamers: [], languages: [] }, // Generic
      ];

      const result = filterMessagesForStreamer(messages, 'streamer1');
      expect(result).toHaveLength(1);
      expect(result).toContainEqual({ text: 'Hi!', streamers: ['streamer1'], languages: [] });
      // Generic message should NOT be included when streamer-specific exists
    });

    it('should be case-insensitive', () => {
      const messages: MessageConfig[] = [
        { text: 'Hi!', streamers: ['TestStreamer'], languages: [] },
      ];

      const result = filterMessagesForStreamer(messages, 'teststreamer');
      expect(result).toHaveLength(1);
    });

    it('should fallback to generic messages when no streamer-specific match', () => {
      const messages: MessageConfig[] = [
        { text: 'Hi!', streamers: ['other'], languages: [] },
        { text: 'Generic', streamers: [], languages: [] },
      ];

      const result = filterMessagesForStreamer(messages, 'teststreamer');
      expect(result).toHaveLength(1);
      expect(result).toContainEqual({ text: 'Generic', streamers: [], languages: [] });
    });

    it('should return empty array when no messages match at all', () => {
      const messages: MessageConfig[] = [
        { text: 'Hi!', streamers: ['other'], languages: [] },
      ];

      const result = filterMessagesForStreamer(messages, 'teststreamer');
      expect(result).toHaveLength(0);
    });
  });

  describe('filterMessagesByLanguage', () => {
    it('should return only language-agnostic messages when stream has no languages', () => {
      const messages: MessageConfig[] = [
        { text: 'Hi!', streamers: [], languages: [] },
        { text: 'Bonjour!', streamers: [], languages: ['fr'] },
        { text: 'Hello!', streamers: [], languages: ['en'] },
      ];

      const result = filterMessagesByLanguage(messages, []);
      expect(result).toHaveLength(1);
      expect(result).toContainEqual({ text: 'Hi!', streamers: [], languages: [] });
    });

    it('should return messages with matching languages (ANY match)', () => {
      const messages: MessageConfig[] = [
        { text: 'Bonjour!', streamers: [], languages: ['fr'] },
        { text: 'Hello!', streamers: [], languages: ['en'] },
        { text: 'Hola!', streamers: [], languages: ['es'] },
        { text: 'Hi!', streamers: [], languages: [] },
      ];

      const result = filterMessagesByLanguage(messages, ['en', 'de']);
      expect(result).toHaveLength(1);
      expect(result).toContainEqual({ text: 'Hello!', streamers: [], languages: ['en'] });
    });

    it('should match ANY language in message to stream languages', () => {
      const messages: MessageConfig[] = [
        { text: 'EN+FR', streamers: [], languages: ['en', 'fr'] },
        { text: 'ES', streamers: [], languages: ['es'] },
      ];

      const result = filterMessagesByLanguage(messages, ['en', 'de']);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('EN+FR'); // Matches because 'en' is common
    });

    it('should fallback to language-agnostic messages if no language match', () => {
      const messages: MessageConfig[] = [
        { text: 'FR', streamers: [], languages: ['fr'] },
        { text: 'ES', streamers: [], languages: ['es'] },
        { text: 'Any', streamers: [], languages: [] },
      ];

      const result = filterMessagesByLanguage(messages, ['en', 'de']);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Any');
    });

    it('should prefer language-specific over language-agnostic when match exists', () => {
      const messages: MessageConfig[] = [
        { text: 'Any', streamers: [], languages: [] },
        { text: 'FR', streamers: [], languages: ['fr'] },
      ];

      const result = filterMessagesByLanguage(messages, ['fr']);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('FR');
    });
  });

  describe('selectRandomMessage', () => {
    it('should return null for empty array', () => {
      const result = selectRandomMessage([]);
      expect(result).toBeNull();
    });

    it('should return the only message when array has one element', () => {
      const messages: MessageConfig[] = [{ text: 'Hi!', streamers: [], languages: [] }];
      const result = selectRandomMessage(messages);
      expect(result).toEqual({ text: 'Hi!', streamers: [], languages: [] });
    });

    it('should return one of the messages', () => {
      const messages: MessageConfig[] = [
        { text: 'Hi!', streamers: [], languages: [] },
        { text: 'Hello!', streamers: [], languages: [] },
        { text: 'Hey!', streamers: [], languages: [] },
      ];

      const result = selectRandomMessage(messages);
      expect(messages).toContainEqual(result);
    });
  });

  describe('interpolateMessage', () => {
    it('should replace <streamer> placeholder', () => {
      const result = interpolateMessage('Hi <streamer>!', 'TestStreamer');
      expect(result).toBe('Hi TestStreamer!');
    });

    it('should handle multiple placeholders', () => {
      const result = interpolateMessage(
        '<streamer> <streamer>!',
        'Test',
      );
      expect(result).toBe('Test Test!');
    });

    it('should be case-insensitive for placeholder', () => {
      const result1 = interpolateMessage('Hi <STREAMER>!', 'Test');
      const result2 = interpolateMessage('Hi <Streamer>!', 'Test');
      expect(result1).toBe('Hi Test!');
      expect(result2).toBe('Hi Test!');
    });

    it('should handle message without placeholder', () => {
      const result = interpolateMessage('Hi everyone!', 'Test');
      expect(result).toBe('Hi everyone!');
    });
  });

  describe('getMessageForStreamer', () => {
    it('should return null when no messages match', () => {
      const messages: MessageConfig[] = [
        { text: 'Hi!', streamers: ['other'], languages: [] },
      ];

      const result = getMessageForStreamer(messages, 'teststreamer');
      expect(result).toBeNull();
    });

    it('should prioritize streamer-specific over language-specific', () => {
      const messages: MessageConfig[] = [
        { text: 'Bonjour!', streamers: [], languages: ['fr'] },
        { text: 'Hi <streamer>!', streamers: ['teststreamer'], languages: [] },
      ];

      const result = getMessageForStreamer(messages, 'teststreamer', ['fr']);
      expect(result).toBe('Hi teststreamer!');
    });

    it('should use language-specific when no streamer-specific exists', () => {
      const messages: MessageConfig[] = [
        { text: 'Bonjour!', streamers: [], languages: ['fr'] },
        { text: 'Hello!', streamers: [], languages: ['en'] },
        { text: 'Hi!', streamers: [], languages: [] },
      ];

      const result = getMessageForStreamer(messages, 'teststreamer', ['en']);
      expect(result).toBe('Hello!');
    });

    it('should fallback to global messages when no specific match', () => {
      const messages: MessageConfig[] = [
        { text: 'Bonjour!', streamers: [], languages: ['fr'] },
        { text: 'Hi!', streamers: [], languages: [] },
      ];

      const result = getMessageForStreamer(messages, 'teststreamer', ['en']);
      expect(result).toBe('Hi!');
    });

    it('should return null when no global messages exist and no match found', () => {
      const messages: MessageConfig[] = [
        { text: 'Bonjour!', streamers: [], languages: ['fr'] },
        { text: 'Hello!', streamers: [], languages: ['en'] },
      ];

      const result = getMessageForStreamer(messages, 'teststreamer', []);
      expect(result).toBeNull();
    });

    it('should interpolate streamer name correctly', () => {
      const messages: MessageConfig[] = [
        { text: 'Hi <streamer>!', streamers: [], languages: [] },
      ];

      const result = getMessageForStreamer(messages, 'TestStreamer');
      expect(result).toBe('Hi TestStreamer!');
    });
  });

  describe('generateRandomDelay', () => {
    it('should generate delay within range', () => {
      const min = 10;
      const max = 15;

      for (let i = 0; i < 100; i++) {
        const delay = generateRandomDelay(min, max);
        expect(delay).toBeGreaterThanOrEqual(min);
        expect(delay).toBeLessThanOrEqual(max);
      }
    });

    it('should handle same min and max', () => {
      const delay = generateRandomDelay(5, 5);
      expect(delay).toBe(5);
    });
  });
});

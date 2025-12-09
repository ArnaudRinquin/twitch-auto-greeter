import { describe, it, expect } from 'vitest';
import {
  filterMessagesForStreamer,
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
        { text: 'Hi!' },
        { text: 'Hello!' },
      ];

      const result = filterMessagesForStreamer(messages, 'teststreamer');
      expect(result).toEqual(messages);
    });

    it('should filter messages for specific streamer', () => {
      const messages: MessageConfig[] = [
        { text: 'Hi!', streamers: ['streamer1'] },
        { text: 'Hello!', streamers: ['streamer2'] },
        { text: 'Hey!' }, // No restriction
      ];

      const result = filterMessagesForStreamer(messages, 'streamer1');
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ text: 'Hi!', streamers: ['streamer1'] });
      expect(result).toContainEqual({ text: 'Hey!' });
    });

    it('should be case-insensitive', () => {
      const messages: MessageConfig[] = [
        { text: 'Hi!', streamers: ['TestStreamer'] },
      ];

      const result = filterMessagesForStreamer(messages, 'teststreamer');
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no messages match', () => {
      const messages: MessageConfig[] = [
        { text: 'Hi!', streamers: ['other'] },
      ];

      const result = filterMessagesForStreamer(messages, 'teststreamer');
      expect(result).toHaveLength(0);
    });
  });

  describe('selectRandomMessage', () => {
    it('should return null for empty array', () => {
      const result = selectRandomMessage([]);
      expect(result).toBeNull();
    });

    it('should return the only message when array has one element', () => {
      const messages: MessageConfig[] = [{ text: 'Hi!' }];
      const result = selectRandomMessage(messages);
      expect(result).toEqual({ text: 'Hi!' });
    });

    it('should return one of the messages', () => {
      const messages: MessageConfig[] = [
        { text: 'Hi!' },
        { text: 'Hello!' },
        { text: 'Hey!' },
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
        { text: 'Hi!', streamers: ['other'] },
      ];

      const result = getMessageForStreamer(messages, 'teststreamer');
      expect(result).toBeNull();
    });

    it('should return interpolated message for streamer', () => {
      const messages: MessageConfig[] = [
        { text: 'Hi <streamer>!' },
      ];

      const result = getMessageForStreamer(messages, 'TestStreamer');
      expect(result).toBe('Hi TestStreamer!');
    });

    it('should filter and interpolate correctly', () => {
      const messages: MessageConfig[] = [
        { text: 'Wrong', streamers: ['other'] },
        { text: 'Hi <streamer>!', streamers: ['teststreamer'] },
      ];

      const result = getMessageForStreamer(messages, 'teststreamer');
      expect(result).toBe('Hi teststreamer!');
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

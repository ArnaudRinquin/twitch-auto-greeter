import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getConfig,
  setConfig,
  getState,
  setState,
  updateLastMessageTime,
  getLastMessageTime,
  canSendMessage,
  updateLastMessage,
  clearStreamerHistory,
} from './storage';
import { DEFAULT_CONFIG, DEFAULT_STATE } from '../types';
import type { Config, State } from '../types';

// Mock chrome.storage API
const mockStorage: Record<string, any> = {};

beforeEach(() => {
  // Clear mock storage
  Object.keys(mockStorage).forEach(key => delete mockStorage[key]);

  // Mock chrome.storage.local
  global.chrome = {
    storage: {
      local: {
        get: vi.fn((keys: string | string[]) => {
          const result: Record<string, any> = {};
          const keyArray = Array.isArray(keys) ? keys : [keys];
          keyArray.forEach(key => {
            if (mockStorage[key] !== undefined) {
              result[key] = mockStorage[key];
            }
          });
          return Promise.resolve(result);
        }),
        set: vi.fn((items: Record<string, any>) => {
          Object.assign(mockStorage, items);
          return Promise.resolve();
        }),
      },
    },
  } as any;
});

describe('storage', () => {
  describe('getConfig / setConfig', () => {
    it('should return default config when storage is empty', async () => {
      const config = await getConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should save and retrieve config', async () => {
      const testConfig: Config = {
        ...DEFAULT_CONFIG,
        enabled: false,
        defaultFrequency: 3600000,
      };

      await setConfig(testConfig);
      const retrieved = await getConfig();

      expect(retrieved.enabled).toBe(false);
      expect(retrieved.defaultFrequency).toBe(3600000);
    });

    it('should migrate old config format with missing arrays', async () => {
      const oldConfig = {
        ...DEFAULT_CONFIG,
        messages: [
          { text: 'Hi', streamers: undefined, languages: undefined },
          { text: 'Hello', streamers: ['test'], languages: null },
        ],
      };

      mockStorage.config = oldConfig;
      const config = await getConfig();

      expect(config.messages[0].streamers).toEqual([]);
      expect(config.messages[0].languages).toEqual([]);
      expect(config.messages[1].streamers).toEqual(['test']);
      expect(config.messages[1].languages).toEqual([]);
    });
  });

  describe('getState / setState', () => {
    it('should return default state when storage is empty', async () => {
      const state = await getState();
      expect(state).toEqual(DEFAULT_STATE);
    });

    it('should save and retrieve state', async () => {
      const testState: State = {
        lastMessageTimes: { streamer1: 1234567890 },
        lastMessages: { streamer1: 'Hello streamer1!' },
      };

      await setState(testState);
      const retrieved = await getState();

      expect(retrieved).toEqual(testState);
    });
  });

  describe('updateLastMessageTime / getLastMessageTime', () => {
    it('should update and retrieve last message time', async () => {
      const timestamp = Date.now();
      await updateLastMessageTime('TestStreamer', timestamp);

      const retrieved = await getLastMessageTime('TestStreamer');
      expect(retrieved).toBe(timestamp);
    });

    it('should be case-insensitive', async () => {
      const timestamp = Date.now();
      await updateLastMessageTime('TestStreamer', timestamp);

      const retrieved = await getLastMessageTime('teststreamer');
      expect(retrieved).toBe(timestamp);
    });

    it('should return null for unknown streamer', async () => {
      const retrieved = await getLastMessageTime('unknown');
      expect(retrieved).toBeNull();
    });

    it('should use current time if timestamp not provided', async () => {
      const before = Date.now();
      await updateLastMessageTime('TestStreamer');
      const after = Date.now();

      const retrieved = await getLastMessageTime('TestStreamer');
      expect(retrieved).toBeGreaterThanOrEqual(before);
      expect(retrieved).toBeLessThanOrEqual(after);
    });
  });

  describe('canSendMessage', () => {
    it('should allow sending if never sent before', async () => {
      const canSend = await canSendMessage('newstreamer', 86400000);
      expect(canSend).toBe(true);
    });

    it('should allow sending if enough time has passed', async () => {
      const pastTime = Date.now() - 90000000; // More than 24h ago
      await updateLastMessageTime('streamer1', pastTime);

      const canSend = await canSendMessage('streamer1', 86400000); // 24h
      expect(canSend).toBe(true);
    });

    it('should not allow sending if not enough time has passed', async () => {
      const recentTime = Date.now() - 1000; // 1 second ago
      await updateLastMessageTime('streamer1', recentTime);

      const canSend = await canSendMessage('streamer1', 86400000); // 24h
      expect(canSend).toBe(false);
    });
  });

  describe('updateLastMessage', () => {
    it('should store last message sent to streamer', async () => {
      await updateLastMessage('TestStreamer', 'Hello TestStreamer!');

      const state = await getState();
      expect(state.lastMessages['teststreamer']).toBe('Hello TestStreamer!');
    });

    it('should be case-insensitive', async () => {
      await updateLastMessage('TestStreamer', 'Message 1');
      await updateLastMessage('teststreamer', 'Message 2');

      const state = await getState();
      expect(state.lastMessages['teststreamer']).toBe('Message 2');
    });

    it('should update existing message', async () => {
      await updateLastMessage('streamer1', 'First message');
      await updateLastMessage('streamer1', 'Second message');

      const state = await getState();
      expect(state.lastMessages['streamer1']).toBe('Second message');
    });
  });

  describe('clearStreamerHistory', () => {
    it('should clear both time and message for a streamer', async () => {
      // Set up history
      await updateLastMessageTime('streamer1', Date.now());
      await updateLastMessage('streamer1', 'Hello!');
      await updateLastMessageTime('streamer2', Date.now());
      await updateLastMessage('streamer2', 'Hi!');

      // Clear streamer1
      await clearStreamerHistory('streamer1');

      const state = await getState();
      expect(state.lastMessageTimes['streamer1']).toBeUndefined();
      expect(state.lastMessages['streamer1']).toBeUndefined();
      expect(state.lastMessageTimes['streamer2']).toBeDefined();
      expect(state.lastMessages['streamer2']).toBe('Hi!');
    });

    it('should be case-insensitive', async () => {
      await updateLastMessageTime('TestStreamer', Date.now());
      await updateLastMessage('TestStreamer', 'Hello!');

      await clearStreamerHistory('teststreamer');

      const state = await getState();
      expect(state.lastMessageTimes['teststreamer']).toBeUndefined();
      expect(state.lastMessages['teststreamer']).toBeUndefined();
    });

    it('should handle clearing non-existent streamer gracefully', async () => {
      await clearStreamerHistory('nonexistent');

      const state = await getState();
      expect(state.lastMessageTimes['nonexistent']).toBeUndefined();
    });
  });
});

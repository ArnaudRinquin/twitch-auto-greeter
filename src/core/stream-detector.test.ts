import { describe, it, expect } from 'vitest';
import {
  extractStreamerName,
  isStreamPage,
  createStreamInfo,
  isManualNavigation,
} from './stream-detector';

describe('stream-detector', () => {
  describe('extractStreamerName', () => {
    it('should extract streamer name from standard URL', () => {
      const result = extractStreamerName('https://www.twitch.tv/teststreamer');
      expect(result).toBe('teststreamer');
    });

    it('should extract from URL without www', () => {
      const result = extractStreamerName('https://twitch.tv/teststreamer');
      expect(result).toBe('teststreamer');
    });

    it('should return null for directory page', () => {
      const result = extractStreamerName('https://www.twitch.tv/directory');
      expect(result).toBeNull();
    });

    it('should return null for videos page', () => {
      const result = extractStreamerName('https://www.twitch.tv/videos');
      expect(result).toBeNull();
    });

    it('should return null for settings page', () => {
      const result = extractStreamerName('https://www.twitch.tv/settings');
      expect(result).toBeNull();
    });

    it('should return null for non-Twitch URL', () => {
      const result = extractStreamerName('https://www.youtube.com/watch');
      expect(result).toBeNull();
    });

    it('should return null for invalid URL', () => {
      const result = extractStreamerName('not-a-url');
      expect(result).toBeNull();
    });

    it('should handle trailing slash', () => {
      const result = extractStreamerName('https://www.twitch.tv/teststreamer/');
      expect(result).toBe('teststreamer');
    });

    it('should handle URL with query parameters', () => {
      const result = extractStreamerName(
        'https://www.twitch.tv/teststreamer?referrer=raid',
      );
      expect(result).toBe('teststreamer');
    });
  });

  describe('isStreamPage', () => {
    it('should return true for stream URL', () => {
      const result = isStreamPage('https://www.twitch.tv/teststreamer');
      expect(result).toBe(true);
    });

    it('should return false for directory page', () => {
      const result = isStreamPage('https://www.twitch.tv/directory');
      expect(result).toBe(false);
    });

    it('should return false for non-Twitch URL', () => {
      const result = isStreamPage('https://www.youtube.com');
      expect(result).toBe(false);
    });
  });

  describe('createStreamInfo', () => {
    it('should create StreamInfo for valid stream URL', () => {
      const url = 'https://www.twitch.tv/teststreamer';
      const result = createStreamInfo(url);

      expect(result).not.toBeNull();
      expect(result?.streamerName).toBe('teststreamer');
      expect(result?.url).toBe(url);
      expect(result?.timestamp).toBeGreaterThan(0);
    });

    it('should return null for non-stream URL', () => {
      const result = createStreamInfo('https://www.twitch.tv/directory');
      expect(result).toBeNull();
    });

    it('should have recent timestamp', () => {
      const before = Date.now();
      const result = createStreamInfo('https://www.twitch.tv/test');
      const after = Date.now();

      expect(result?.timestamp).toBeGreaterThanOrEqual(before);
      expect(result?.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('isManualNavigation', () => {
    it('should return true when no previous URL', () => {
      const result = isManualNavigation(
        null,
        'https://www.twitch.tv/streamer1',
        5000,
      );
      expect(result).toBe(true);
    });

    it('should return true when streamer changed after sufficient time', () => {
      const result = isManualNavigation(
        'https://www.twitch.tv/streamer1',
        'https://www.twitch.tv/streamer2',
        2000, // > 1 second
      );
      expect(result).toBe(true);
    });

    it('should return false when streamer changed too quickly (likely redirect)', () => {
      const result = isManualNavigation(
        'https://www.twitch.tv/streamer1',
        'https://www.twitch.tv/streamer2',
        500, // < 1 second
      );
      expect(result).toBe(false);
    });

    it('should return false when same streamer', () => {
      const result = isManualNavigation(
        'https://www.twitch.tv/streamer1',
        'https://www.twitch.tv/streamer1',
        5000,
      );
      expect(result).toBe(false);
    });

    it('should handle case-sensitive URLs correctly', () => {
      const result = isManualNavigation(
        'https://www.twitch.tv/Streamer1',
        'https://www.twitch.tv/streamer1',
        2000,
      );
      expect(result).toBe(false); // Same streamer, different case
    });
  });
});

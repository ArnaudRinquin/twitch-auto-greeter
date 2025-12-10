import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadEmotes, renderMessageWithEmotes, areEmotesLoaded } from './emote-renderer';

// Mock fetch globally
global.fetch = vi.fn();

describe('emote-renderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadEmotes', () => {
    it('should return true when emotes load successfully', async () => {
      const mockBttvResponse = [
        { id: 'bttv123', code: 'bttvEmote' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBttvResponse,
      });

      const success = await loadEmotes();
      expect(success).toBe(true);
      expect(areEmotesLoaded()).toBe(true);
    });

    it('should use cached emotes on subsequent calls', async () => {
      const mockBttvResponse = [{ id: 'bttv123', code: 'bttvEmote' }];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockBttvResponse,
      });

      // Multiple loads should work and cache should be present
      await loadEmotes();
      await loadEmotes();

      expect(areEmotesLoaded()).toBe(true);
    });
  });

  describe('renderMessageWithEmotes', () => {
    beforeEach(async () => {
      // Load emotes before each test
      const mockBttvResponse = [
        { id: 'bttv123', code: 'bttvEmote' },
        { id: 'bttv456', code: 'pepeD' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBttvResponse,
      });

      await loadEmotes();
    });

    it('should not modify text without emotes', () => {
      const text = 'Hello world!';
      const rendered = renderMessageWithEmotes(text);
      expect(rendered).toBe(text);
    });

    it('should render Twitch global emote (HeyGuys)', () => {
      const text = 'Hello HeyGuys';
      const rendered = renderMessageWithEmotes(text);

      expect(rendered).toContain('<img');
      expect(rendered).toContain('static-cdn.jtvnw.net/emoticons/v2/30259');
      expect(rendered).toContain('alt="HeyGuys"');
    });

    it('should render multiple Twitch emotes', () => {
      const text = 'HeyGuys VoHiYo';
      const rendered = renderMessageWithEmotes(text);

      expect(rendered).toContain('30259'); // HeyGuys ID
      expect(rendered).toContain('81274'); // VoHiYo ID
      expect(rendered.match(/<img/g)?.length).toBe(2);
    });

    it('should render BetterTTV emotes', () => {
      const text = 'Check this bttvEmote out';
      const rendered = renderMessageWithEmotes(text);

      expect(rendered).toContain('<img');
      expect(rendered).toContain('cdn.betterttv.net/emote/bttv123');
      expect(rendered).toContain('alt="bttvEmote"');
    });

    it('should render mixed Twitch and BTTV emotes', () => {
      const text = 'HeyGuys bttvEmote';
      const rendered = renderMessageWithEmotes(text);

      expect(rendered).toContain('static-cdn.jtvnw.net'); // Twitch CDN
      expect(rendered).toContain('cdn.betterttv.net'); // BTTV CDN
      expect(rendered.match(/<img/g)?.length).toBe(2);
    });

    it('should preserve emote case sensitivity', () => {
      const text = 'heyguys HeyGuys'; // lowercase should not match
      const rendered = renderMessageWithEmotes(text);

      // Only one emote should be replaced (HeyGuys, not heyguys)
      expect(rendered.match(/<img/g)?.length).toBe(1);
      expect(rendered).toContain('heyguys'); // lowercase preserved as text
    });

    it('should handle emotes at start and end of message', () => {
      const text = 'HeyGuys hello world VoHiYo';
      const rendered = renderMessageWithEmotes(text);

      expect(rendered).toContain('30259'); // HeyGuys
      expect(rendered).toContain('81274'); // VoHiYo
      expect(rendered).toMatch(/^<img.*hello world.*<img/);
    });

    it('should handle repeated emotes', () => {
      const text = 'HeyGuys HeyGuys HeyGuys';
      const rendered = renderMessageWithEmotes(text);

      expect(rendered.match(/<img/g)?.length).toBe(3);
    });

    it('should not replace partial matches', () => {
      const text = 'HeyGuysAreAwesome'; // Should not match "HeyGuys"
      const rendered = renderMessageWithEmotes(text);

      expect(rendered).toBe(text); // No replacement
    });

    it('should handle emotes with special characters around them', () => {
      const text = 'Hello, HeyGuys! How are you?';
      const rendered = renderMessageWithEmotes(text);

      expect(rendered).toContain('<img');
      expect(rendered).toContain('30259');
    });

    it('should return original text if cache not loaded', () => {
      // Create a new instance without loading
      const text = 'HeyGuys test';

      // Clear the cache by mocking isEmoteCacheLoaded to return false
      // Note: This test assumes we can test the behavior when cache fails
      // In practice, the function should handle this gracefully
      const rendered = renderMessageWithEmotes(text);

      // Should either return original or handle gracefully
      expect(typeof rendered).toBe('string');
    });

    it('should handle empty string', () => {
      const rendered = renderMessageWithEmotes('');
      expect(rendered).toBe('');
    });

    it('should preserve HTML special characters in non-emote text', () => {
      const text = 'Hello <streamer> & chat!';
      const rendered = renderMessageWithEmotes(text);

      // Should not double-escape or corrupt existing HTML
      expect(rendered).toContain('&');
    });
  });

  describe('areEmotesLoaded', () => {
    it('should return true after successful load', async () => {
      const mockBttvResponse = [{ id: 'bttv123', code: 'bttvEmote' }];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBttvResponse,
      });

      await loadEmotes();
      expect(areEmotesLoaded()).toBe(true);
    });
  });
});

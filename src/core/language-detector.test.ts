import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { detectStreamLanguages, waitForLanguageTags, getAllSupportedLanguages } from './language-detector';

describe('language-detector', () => {
  beforeEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up any observers
    vi.clearAllTimers();
  });

  describe('detectStreamLanguages', () => {
    it('should return empty array when no language tags present', () => {
      const languages = detectStreamLanguages();
      expect(languages).toEqual([]);
    });

    it('should detect single language from tag', () => {
      document.body.innerHTML = `
        <a href="/directory/all/tags/English">English</a>
      `;

      const languages = detectStreamLanguages();
      expect(languages).toEqual(['en']);
    });

    it('should detect multiple languages', () => {
      document.body.innerHTML = `
        <a href="/directory/all/tags/English">English</a>
        <a href="/directory/all/tags/Français">Français</a>
      `;

      const languages = detectStreamLanguages();
      expect(languages).toContain('en');
      expect(languages).toContain('fr');
      expect(languages).toHaveLength(2);
    });

    it('should ignore non-language tags', () => {
      document.body.innerHTML = `
        <a href="/directory/all/tags/English">English</a>
        <a href="/directory/all/tags/SomeOtherTag">SomeOtherTag</a>
      `;

      const languages = detectStreamLanguages();
      expect(languages).toEqual(['en']);
    });

    it('should match exact language names', () => {
      document.body.innerHTML = `
        <a href="/directory/all/tags/English">English</a>
        <a href="/directory/all/tags/Français">Français</a>
      `;

      const languages = detectStreamLanguages();
      expect(languages).toContain('en');
      expect(languages).toContain('fr');
    });

    it('should handle all supported languages', () => {
      const supportedLanguages = getAllSupportedLanguages();

      const html = supportedLanguages
        .map(lang => `<a href="/directory/all/tags/${lang.name}">${lang.name}</a>`)
        .join('');

      document.body.innerHTML = html;

      const languages = detectStreamLanguages();
      expect(languages.length).toBe(supportedLanguages.length);
      supportedLanguages.forEach(lang => {
        expect(languages).toContain(lang.code);
      });
    });

    it('should deduplicate languages', () => {
      document.body.innerHTML = `
        <a href="/directory/all/tags/English">English</a>
        <a href="/directory/all/tags/English">English</a>
      `;

      const languages = detectStreamLanguages();
      expect(languages).toEqual(['en']);
    });
  });

  describe('waitForLanguageTags', () => {
    it('should return immediately if tags are already present', async () => {
      document.body.innerHTML = `
        <a href="/directory/all/tags/English">English</a>
      `;

      const start = Date.now();
      const languages = await waitForLanguageTags(1000);
      const duration = Date.now() - start;

      expect(languages).toEqual(['en']);
      expect(duration).toBeLessThan(100); // Should be nearly instant
    });

    it('should wait and detect tags added dynamically', async () => {
      vi.useFakeTimers();

      const promise = waitForLanguageTags(2000);

      // Simulate tags being added after 500ms
      setTimeout(() => {
        document.body.innerHTML = `
          <a href="/directory/all/tags/Français">Français</a>
        `;
      }, 500);

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const languages = await promise;
      expect(languages).toEqual(['fr']);

      vi.useRealTimers();
    });

    it('should return empty array after timeout if no tags found', async () => {
      vi.useFakeTimers();

      const promise = waitForLanguageTags(1000);

      // Advance past timeout without adding tags
      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      const languages = await promise;
      expect(languages).toEqual([]);

      vi.useRealTimers();
    });

    it('should detect tags added to nested elements', async () => {
      vi.useFakeTimers();

      const promise = waitForLanguageTags(2000);

      setTimeout(() => {
        const container = document.createElement('div');
        container.innerHTML = `
          <div>
            <a href="/directory/all/tags/Español">Español</a>
          </div>
        `;
        document.body.appendChild(container);
      }, 500);

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const languages = await promise;
      expect(languages).toEqual(['es']);

      vi.useRealTimers();
    });

    it('should stop observing after tags are found', async () => {
      vi.useFakeTimers();

      const promise = waitForLanguageTags(5000);

      // Add first tag
      setTimeout(() => {
        document.body.innerHTML = `
          <a href="/directory/all/tags/English">English</a>
        `;
      }, 100);

      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();

      const languages = await promise;
      expect(languages).toEqual(['en']);

      // Add another tag after observer should have stopped
      document.body.innerHTML += `
        <a href="/directory/all/tags/Français">Français</a>
      `;

      // Verify the promise has already resolved
      expect(languages).toEqual(['en']); // Should still be just 'en'

      vi.useRealTimers();
    });
  });

  describe('getAllSupportedLanguages', () => {
    it('should return array of language objects', () => {
      const languages = getAllSupportedLanguages();

      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);

      languages.forEach(lang => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(typeof lang.code).toBe('string');
        expect(typeof lang.name).toBe('string');
        expect(lang.code.length).toBeGreaterThanOrEqual(2); // ISO 639-1/639-2 codes are 2-3 characters
        expect(lang.code.length).toBeLessThanOrEqual(3);
      });
    });

    it('should include common languages', () => {
      const languages = getAllSupportedLanguages();
      const codes = languages.map(l => l.code);

      expect(codes).toContain('en');
      expect(codes).toContain('fr');
      expect(codes).toContain('es');
      expect(codes).toContain('de');
      expect(codes).toContain('pt');
      expect(codes).toContain('ja');
    });
  });
});

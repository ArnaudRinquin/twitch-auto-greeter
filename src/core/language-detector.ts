/**
 * Language detection from Twitch stream tags
 *
 * Extracts language tags from the stream page DOM and maps them to ISO 639-1 codes.
 */

// Extensive mapping of Twitch language tag names to ISO 639-1 codes
const LANGUAGE_TAG_MAP: Record<string, string> = {
  // Common European languages
  'English': 'en',
  'Français': 'fr',
  'Español': 'es',
  'Deutsch': 'de',
  'Italiano': 'it',
  'Português': 'pt',
  'Polski': 'pl',
  'Nederlands': 'nl',
  'Svenska': 'sv',
  'Türkçe': 'tr',
  'Čeština': 'cs',
  'Magyar': 'hu',
  'Română': 'ro',
  'Dansk': 'da',
  'Norsk': 'no',
  'Suomi': 'fi',
  'Ελληνικά': 'el',
  'Українська': 'uk',

  // Slavic languages
  'Русский': 'ru',
  'Български': 'bg',
  'Српски': 'sr',
  'Hrvatski': 'hr',
  'Slovenčina': 'sk',
  'Slovenščina': 'sl',

  // Asian languages
  '日本語': 'ja',
  '한국어': 'ko',
  '中文': 'zh',
  'ภาษาไทย': 'th',
  'Tiếng Việt': 'vi',
  'Bahasa Indonesia': 'id',
  'Bahasa Melayu': 'ms',
  'हिन्दी': 'hi',
  'Filipino': 'fil',

  // Middle Eastern languages
  'العربية': 'ar',
  'עברית': 'he',
  'فارسی': 'fa',

  // Other languages
  'Català': 'ca',
  'Eesti': 'et',
  'Latviešu': 'lv',
  'Lietuvių': 'lt',
  'Euskara': 'eu',
  'Galego': 'gl',
  'Íslenska': 'is',
  'Shqip': 'sq',
  'Македонски': 'mk',
  'Azərbaycan': 'az',
  'ქართული': 'ka',
  'Հայերեն': 'hy',
  'မြန်မာဘာသာ': 'my',
  'ខ្មែរ': 'km',
  'ລາວ': 'lo',
  'Монгол': 'mn',
  'नेपाली': 'ne',
  'සිංහල': 'si',
  'తెలుగు': 'te',
  'தமிழ்': 'ta',
  'ગુજરાતી': 'gu',
  'ಕನ್ನಡ': 'kn',
  'മലയാളം': 'ml',
  'मराठी': 'mr',
  'ਪੰਜਾਬੀ': 'pa',
  'اردو': 'ur',
  'বাংলা': 'bn',
};

/**
 * Extracts language tags from the current Twitch stream page.
 *
 * Language tags are found in links with href="/directory/all/tags/{language}"
 * and have the class "tw-tag".
 *
 * @returns Array of ISO 639-1 language codes (e.g., ['en', 'fr'])
 */
export function detectStreamLanguages(): string[] {
  const languageCodes: string[] = [];

  // Query all tag links on the page
  const tagLinks = document.querySelectorAll<HTMLAnchorElement>('a[href*="/directory/all/tags/"]');

  tagLinks.forEach((link) => {
    const tagText = link.textContent?.trim();

    if (tagText && tagText in LANGUAGE_TAG_MAP) {
      const code = LANGUAGE_TAG_MAP[tagText];

      // Avoid duplicates
      if (!languageCodes.includes(code)) {
        languageCodes.push(code);
      }
    }
  });

  return languageCodes;
}

/**
 * Get the display name for a language code.
 * Used for UI display purposes.
 *
 * @param code ISO 639-1 language code
 * @returns Display name or the code itself if not found
 */
export function getLanguageDisplayName(code: string): string {
  const entry = Object.entries(LANGUAGE_TAG_MAP).find(([, c]) => c === code);
  return entry ? entry[0] : code;
}

/**
 * Get all supported language codes and their display names.
 * Useful for populating UI dropdowns.
 *
 * @returns Array of { code, name } objects sorted by name
 */
export function getAllSupportedLanguages(): Array<{ code: string; name: string }> {
  return Object.entries(LANGUAGE_TAG_MAP)
    .map(([name, code]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

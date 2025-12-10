/**
 * Emote renderer using BetterTTV API + hardcoded Twitch global emotes
 * Fetches global emotes without authentication
 */

interface BTTVEmote {
  id: string;
  code: string;
  imageType: "png" | "gif" | "webp";
  animated: boolean;
}

// Twitch native global emotes (hardcoded since they don't change often)
// Format: code -> ID for https://static-cdn.jtvnw.net/emoticons/v2/{id}/default/dark/1.0
const TWITCH_GLOBAL_EMOTES: Record<string, string> = {
  'HeyGuys': '30259',
  'VoHiYo': '81274',
  'Kappa': '25',
  'PogChamp': '88',
  'LUL': '425618',
  'NotLikeThis': '58765',
  'BibleThump': '86',
  'Kreygasm': '41',
  'DansGame': '33',
  'WutFace': '28087',
  'FailFish': '360',
  'ResidentSleeper': '245',
  'EleGiggle': '4339',
  'SMOrc': '52',
  '4Head': '354',
  'SwiftRage': '34',
  'PJSalt': '36',
  'KevinTurtle': '40',
  'CoolStoryBob': '123171',
  'MrDestructoid': '28',
  'TriHard': '120232',
  'CmonBruh': '84608',
  'SeemsGood': '64138',
  'BlessRNG': '153556',
  'KomodoHype': '81273',
  'PogU': '301549130',
  'KEKW': 'emotesv2_e1e79f6dc19c4607b2bf47933a8e3a13',
  'Pog': '305954156',
};

let emoteCache: Map<string, { id: string; source: 'twitch' | 'bttv' }> | null = null;
let fetchPromise: Promise<void> | null = null;

/**
 * Fetch global emotes from BetterTTV API and combine with Twitch emotes
 * Uses cache to avoid repeated fetches
 */
async function fetchEmotes(): Promise<void> {
  if (emoteCache) return; // Already loaded
  if (fetchPromise) return fetchPromise; // Already fetching

  fetchPromise = (async () => {
    try {
      emoteCache = new Map();

      // Add Twitch global emotes
      for (const [code, id] of Object.entries(TWITCH_GLOBAL_EMOTES)) {
        emoteCache.set(code, { id, source: 'twitch' });
      }
      console.log(`[Emote Renderer] Loaded ${emoteCache.size} Twitch global emotes`);

      // Fetch BetterTTV emotes
      const response = await fetch(
        "https://api.betterttv.net/3/cached/emotes/global"
      );
      if (!response.ok) {
        throw new Error(`BTTV API error: ${response.status}`);
      }

      const emotes: BTTVEmote[] = await response.json();

      for (const emote of emotes) {
        emoteCache.set(emote.code, { id: emote.id, source: 'bttv' });
      }

      console.log(`[Emote Renderer] Total emotes loaded: ${emoteCache.size} (Twitch + BTTV)`);
      console.log(`[Emote Renderer] Sample codes:`, Array.from(emoteCache.keys()).slice(0, 30));
    } catch (error) {
      console.error("[Emote Renderer] Failed to fetch emotes:", error);
      // Keep Twitch emotes even if BTTV fails
      if (!emoteCache) {
        emoteCache = new Map();
      }
    }
  })();

  return fetchPromise;
}

/**
 * Render message with emote images
 * @param text Message text containing emote codes
 * @returns HTML string with emote images
 */
export function renderMessageWithEmotes(text: string): string {
  console.log(`[Emote Renderer] Rendering: "${text}"`);
  console.log(`[Emote Renderer] Cache loaded: ${emoteCache !== null}, size: ${emoteCache?.size || 0}`);

  if (!emoteCache || emoteCache.size === 0) {
    console.log(`[Emote Renderer] Emotes not loaded, returning plain text`);
    return text; // Not loaded yet or failed to load
  }

  let result = text;
  let replacementCount = 0;

  // Replace each known emote with an img tag
  for (const [code, emote] of emoteCache.entries()) {
    // Escape special regex characters in emote code
    const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedCode}\\b`, "g");

    if (regex.test(text)) {
      // Use different CDN based on source
      const imgUrl = emote.source === 'twitch'
        ? `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/1.0`
        : `https://cdn.betterttv.net/emote/${emote.id}/1x`;

      const imgTag = `<img class="inline-block h-7 align-middle mx-0.5" src="${imgUrl}" alt="${code}" title="${code}" />`;
      result = result.replace(regex, imgTag);
      replacementCount++;
      console.log(`[Emote Renderer] Replaced "${code}" (${emote.source}) with emote ID ${emote.id}`);
    }
  }

  console.log(`[Emote Renderer] Made ${replacementCount} replacements`);
  console.log(`[Emote Renderer] Result: "${result}"`);

  return result;
}

/**
 * Load emotes and return whether they're ready
 * Call this on app initialization
 */
export async function loadEmotes(): Promise<boolean> {
  await fetchEmotes();
  return emoteCache !== null && emoteCache.size > 0;
}

/**
 * Check if emotes are loaded
 */
export function areEmotesLoaded(): boolean {
  return emoteCache !== null && emoteCache.size > 0;
}

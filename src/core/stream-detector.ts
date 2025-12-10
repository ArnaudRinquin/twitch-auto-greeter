import type { StreamInfo } from '../types';

/**
 * Extract streamer name from Twitch URL
 * Examples:
 * - https://www.twitch.tv/streamerName -> "streamerName"
 * - https://twitch.tv/streamerName -> "streamerName"
 */
export function extractStreamerName(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Check if it's a Twitch domain or localhost (for testing)
    if (!urlObj.hostname.includes('twitch.tv') && !urlObj.hostname.includes('localhost')) {
      return null;
    }

    // Extract pathname and split by /
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    // First part should be the streamer name
    // Ignore paths like /directory, /videos, etc.
    if (
      pathParts.length > 0 &&
      !['directory', 'videos', 'settings', 'subscriptions', 'inventory', 'drops', 'wallet'].includes(
        pathParts[0].toLowerCase(),
      )
    ) {
      return pathParts[0];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if URL is a stream page (not directory, videos, etc.)
 */
export function isStreamPage(url: string): boolean {
  return extractStreamerName(url) !== null;
}

/**
 * Create a StreamInfo object from current page
 */
export function createStreamInfo(url: string): StreamInfo | null {
  const streamerName = extractStreamerName(url);

  if (!streamerName) {
    return null;
  }

  return {
    streamerName,
    url,
    timestamp: Date.now(),
  };
}

/**
 * Check if navigation was user-initiated (not auto-play)
 * This is a heuristic: we consider it manual if there was a significant URL change
 * and some time has passed since the last page load
 */
export function isManualNavigation(
  previousUrl: string | null,
  currentUrl: string,
  timeSinceLastLoad: number,
): boolean {
  // If no previous URL, it's the first load (manual)
  if (!previousUrl) {
    return true;
  }

  const previousStreamer = extractStreamerName(previousUrl);
  const currentStreamer = extractStreamerName(currentUrl);

  // If streamer changed, it's likely manual navigation
  // Compare case-insensitively
  if (
    previousStreamer?.toLowerCase() !== currentStreamer?.toLowerCase()
  ) {
    // Add a small time threshold to avoid catching rapid redirects
    // If less than 1 second passed, might be auto-redirect
    return timeSinceLastLoad > 1000;
  }

  return false;
}

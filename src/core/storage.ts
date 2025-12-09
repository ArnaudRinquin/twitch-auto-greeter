import type { Config, State } from '../types';
import { DEFAULT_CONFIG, DEFAULT_STATE } from '../types';

const STORAGE_KEYS = {
  CONFIG: 'config',
  STATE: 'state',
} as const;

/**
 * Get the current configuration from storage
 */
export async function getConfig(): Promise<Config> {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    // Return default for testing environments
    return { ...DEFAULT_CONFIG } as Config;
  }

  const result = await chrome.storage.local.get(STORAGE_KEYS.CONFIG);
  return result[STORAGE_KEYS.CONFIG] || { ...DEFAULT_CONFIG };
}

/**
 * Save configuration to storage
 */
export async function setConfig(config: Config): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    return; // No-op for testing
  }

  await chrome.storage.local.set({ [STORAGE_KEYS.CONFIG]: config });
}

/**
 * Get the current state from storage
 */
export async function getState(): Promise<State> {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    return { ...DEFAULT_STATE } as State;
  }

  const result = await chrome.storage.local.get(STORAGE_KEYS.STATE);
  return result[STORAGE_KEYS.STATE] || { ...DEFAULT_STATE };
}

/**
 * Save state to storage
 */
export async function setState(state: State): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    return;
  }

  await chrome.storage.local.set({ [STORAGE_KEYS.STATE]: state });
}

/**
 * Update the last message time for a streamer
 */
export async function updateLastMessageTime(
  streamerName: string,
  timestamp: number = Date.now(),
): Promise<void> {
  const state = await getState();
  state.lastMessageTimes[streamerName.toLowerCase()] = timestamp;
  await setState(state);
}

/**
 * Get the last message time for a streamer
 */
export async function getLastMessageTime(
  streamerName: string,
): Promise<number | null> {
  const state = await getState();
  return state.lastMessageTimes[streamerName.toLowerCase()] || null;
}

/**
 * Check if enough time has passed since the last message to a streamer
 */
export async function canSendMessage(
  streamerName: string,
  frequencyMs: number,
): Promise<boolean> {
  const lastTime = await getLastMessageTime(streamerName);

  if (!lastTime) {
    return true; // Never sent a message before
  }

  const timeSinceLastMessage = Date.now() - lastTime;
  return timeSinceLastMessage >= frequencyMs;
}

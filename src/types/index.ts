export interface MessageConfig {
  text: string; // Can include <streamer> placeholder
  streamers: string[]; // Empty array = all streamers
  languages: string[]; // ISO language codes (e.g., ['en', 'fr']); empty array = all languages
}

export interface Config {
  enabled: boolean;
  messages: MessageConfig[];
  defaultFrequency: number; // milliseconds (default 86400000 = 24h)
  delayRange: [number, number]; // seconds [min, max] (default [10, 15])
  enabledStreamers?: string[]; // If set, only greet these streamers
  disabledStreamers?: string[]; // Never greet these streamers
}

export interface State {
  lastMessageTimes: Record<string, number>; // streamer -> timestamp
}

export interface StreamInfo {
  streamerName: string;
  url: string;
  timestamp: number;
  languages: string[]; // ISO language codes detected from stream tags
}

export interface GreetingRequest {
  type: 'GREETING_REQUEST';
  streamInfo: StreamInfo;
}

export interface GreetingResponse {
  type: 'GREETING_RESPONSE';
  message?: string;
  delay?: number; // seconds
  streamerName?: string;
  error?: string;
}

export interface GreetingConfirmation {
  type: 'GREETING_SENT';
  streamerName: string;
}

export type Message = GreetingRequest | GreetingResponse | GreetingConfirmation;

export const DEFAULT_CONFIG: Config = {
  enabled: true,
  messages: [
    { text: 'Hi <streamer>!', streamers: [], languages: [] },
    { text: 'Hey everyone!', streamers: [], languages: [] },
  ],
  defaultFrequency: 86400000, // 24 hours
  delayRange: [10, 15], // 10-15 seconds
  enabledStreamers: [],
  disabledStreamers: [],
};

export const DEFAULT_STATE: State = {
  lastMessageTimes: {},
};

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
    // Global messages (no language restriction)
    { text: 'Hey <streamer>! HeyGuys', streamers: [], languages: [] },
    { text: 'o/ chat', streamers: [], languages: [] },
    { text: 'VoHiYo', streamers: [], languages: [] },
    { text: 'Hey <streamer> and chat! <3', streamers: [], languages: [] },

    // English - mix of streamer/chat/both
    { text: 'Hey <streamer>! HeyGuys', streamers: [], languages: ['en'] },
    { text: 'What\'s up chat! VoHiYo', streamers: [], languages: ['en'] },
    { text: 'Yo <streamer>! <3', streamers: [], languages: ['en'] },
    { text: 'Waddup everyone HeyGuys', streamers: [], languages: ['en'] },
    { text: 'Heya <streamer> and chat! VoHiYo', streamers: [], languages: ['en'] },
    { text: 'Hi chat <3', streamers: [], languages: ['en'] },
    { text: 'Hello <streamer>! HeyGuys', streamers: [], languages: ['en'] },
    { text: 'Sup <streamer> VoHiYo', streamers: [], languages: ['en'] },
    { text: 'Hey everyone! <3', streamers: [], languages: ['en'] },

    // French - mix of streamer/chat/both
    { text: 'Salut <streamer>! HeyGuys', streamers: [], languages: ['fr'] },
    { text: 'Coucou chat! VoHiYo', streamers: [], languages: ['fr'] },
    { text: 'Ça va <streamer>? <3', streamers: [], languages: ['fr'] },
    { text: 'Yo le chat! HeyGuys', streamers: [], languages: ['fr'] },
    { text: 'Salut <streamer> et le chat <3', streamers: [], languages: ['fr'] },
    { text: 'Hey tout le monde VoHiYo', streamers: [], languages: ['fr'] },

    // Spanish - mix of streamer/chat/both
    { text: 'Hola <streamer>! HeyGuys', streamers: [], languages: ['es'] },
    { text: 'Buenas chat! VoHiYo', streamers: [], languages: ['es'] },
    { text: 'Qué pasa <streamer>! <3', streamers: [], languages: ['es'] },
    { text: 'Hola a todos HeyGuys', streamers: [], languages: ['es'] },
    { text: 'Saludos <streamer> y chat <3', streamers: [], languages: ['es'] },

    // German - mix of streamer/chat/both
    { text: 'Hallo <streamer>! HeyGuys', streamers: [], languages: ['de'] },
    { text: 'Servus chat! VoHiYo', streamers: [], languages: ['de'] },
    { text: 'Moin <streamer>! <3', streamers: [], languages: ['de'] },
    { text: 'Hey Leute HeyGuys', streamers: [], languages: ['de'] },
    { text: 'Hallo <streamer> und chat VoHiYo', streamers: [], languages: ['de'] },

    // Portuguese - mix of streamer/chat/both
    { text: 'Opa <streamer>! HeyGuys', streamers: [], languages: ['pt'] },
    { text: 'Fala chat! <3', streamers: [], languages: ['pt'] },
    { text: 'E aí <streamer> VoHiYo', streamers: [], languages: ['pt'] },
    { text: 'Salve galera HeyGuys', streamers: [], languages: ['pt'] },
    { text: 'Opa <streamer> e chat <3', streamers: [], languages: ['pt'] },

    // Japanese - mix of streamer/chat/both
    { text: 'こんにちは <streamer>! HeyGuys', streamers: [], languages: ['ja'] },
    { text: 'よろしく！ VoHiYo', streamers: [], languages: ['ja'] },
    { text: '<streamer> とみんな こんにちは <3', streamers: [], languages: ['ja'] },
  ],
  defaultFrequency: 86400000, // 24 hours
  delayRange: [10, 15], // 10-15 seconds
  enabledStreamers: [],
  disabledStreamers: [],
};

export const DEFAULT_STATE: State = {
  lastMessageTimes: {},
};

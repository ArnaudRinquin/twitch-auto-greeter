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
    { text: 'HeyGuys', streamers: [], languages: [] },
    { text: 'o/', streamers: [], languages: [] },
    { text: 'VoHiYo', streamers: [], languages: [] },
    { text: '<3', streamers: [], languages: [] },
    { text: 'hey! HeyGuys', streamers: [], languages: [] },
    { text: 'hello <3', streamers: [], languages: [] },

    // English
    { text: 'Hey <streamer>! HeyGuys', streamers: [], languages: ['en'] },
    { text: 'What\'s up <streamer>! VoHiYo', streamers: [], languages: ['en'] },
    { text: 'Hey everyone! <3', streamers: [], languages: ['en'] },
    { text: 'Yo <streamer>!', streamers: [], languages: ['en'] },
    { text: 'Sup chat', streamers: [], languages: ['en'] },
    { text: 'Waddup <streamer>', streamers: [], languages: ['en'] },
    { text: 'Hey there! VoHiYo', streamers: [], languages: ['en'] },
    { text: 'Hello hello HeyGuys', streamers: [], languages: ['en'] },
    { text: 'Ayo!', streamers: [], languages: ['en'] },
    { text: 'Hi chat <3', streamers: [], languages: ['en'] },
    { text: 'Heya <streamer> HeyGuys', streamers: [], languages: ['en'] },

    // French
    { text: 'Salut <streamer>! HeyGuys', streamers: [], languages: ['fr'] },
    { text: 'Salut tout le monde! <3', streamers: [], languages: ['fr'] },
    { text: 'Coucou! VoHiYo', streamers: [], languages: ['fr'] },
    { text: 'Ça va <streamer>?', streamers: [], languages: ['fr'] },
    { text: 'Yo le chat! HeyGuys', streamers: [], languages: ['fr'] },
    { text: 'Wesh <3', streamers: [], languages: ['fr'] },
    { text: 'Coucou chat VoHiYo', streamers: [], languages: ['fr'] },

    // Spanish
    { text: 'Hola <streamer>! HeyGuys', streamers: [], languages: ['es'] },
    { text: 'Qué tal chat! <3', streamers: [], languages: ['es'] },
    { text: 'Buenas! VoHiYo', streamers: [], languages: ['es'] },
    { text: 'Hola a todos HeyGuys', streamers: [], languages: ['es'] },
    { text: 'Qué pasa <streamer>', streamers: [], languages: ['es'] },
    { text: 'Saludos <3', streamers: [], languages: ['es'] },

    // German
    { text: 'Hallo <streamer>! HeyGuys', streamers: [], languages: ['de'] },
    { text: 'Servus! VoHiYo', streamers: [], languages: ['de'] },
    { text: 'Moin! <3', streamers: [], languages: ['de'] },
    { text: 'Hey Leute HeyGuys', streamers: [], languages: ['de'] },

    // Portuguese
    { text: 'Opa <streamer>! HeyGuys', streamers: [], languages: ['pt'] },
    { text: 'Fala chat! <3', streamers: [], languages: ['pt'] },
    { text: 'E aí galera VoHiYo', streamers: [], languages: ['pt'] },
    { text: 'Salve HeyGuys', streamers: [], languages: ['pt'] },

    // Japanese
    { text: 'こんにちは <streamer>! HeyGuys', streamers: [], languages: ['ja'] },
    { text: 'よろしく！ VoHiYo', streamers: [], languages: ['ja'] },
  ],
  defaultFrequency: 86400000, // 24 hours
  delayRange: [10, 15], // 10-15 seconds
  enabledStreamers: [],
  disabledStreamers: [],
};

export const DEFAULT_STATE: State = {
  lastMessageTimes: {},
};

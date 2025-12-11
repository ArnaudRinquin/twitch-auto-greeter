import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  srcDir: 'src',
  vite: () => ({
    plugins: [react()],
  }),
  manifest: {
    name: 'Twitch Auto-Greeter',
    description: 'Automatically send greetings in Twitch chat to be counted as an active viewer. Language-aware, customizable, privacy-focused.',
    version: '0.1.0',
    permissions: ['storage', 'tabs'],
    host_permissions: ['*://*.twitch.tv/*'],
    icons: {
      16: '/icon-16.png',
      32: '/icon-32.png',
      48: '/icon-48.png',
      128: '/icon-128.png',
    },
    action: {
      default_title: 'Twitch Auto-Greeter Settings',
      default_icon: {
        16: '/icon-16.png',
        32: '/icon-32.png',
        48: '/icon-48.png',
        128: '/icon-128.png',
      },
    },
  },
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      if (manifest.options_ui) {
        manifest.options_ui.open_in_tab = true;
      }
    },
  },
});

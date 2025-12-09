import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  srcDir: 'src',
  vite: () => ({
    plugins: [react()],
  }),
  manifest: {
    name: 'Twitch Auto-Greeter',
    description: 'Automatically say hi in Twitch chat to count as a spectator',
    version: '0.1.0',
    permissions: ['storage', 'tabs'],
    host_permissions: ['*://*.twitch.tv/*'],
    action: {
      default_title: 'Twitch Auto-Greeter Settings',
    },
  },
});

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.timeriq.app',
  appName: 'TimerIQ',
  webDir: 'out',
  server: {
    url: 'http://localhost:3000',
    cleartext: true
  }
};

export default config;

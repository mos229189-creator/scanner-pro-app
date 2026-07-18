import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scanpro.app',
  appName: 'Scanner Pro',
  webDir: 'dist/public',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    // AdMob — swap in your real IDs here
    AdMob: {
      appId: {
        android: 'ca-app-pub-4796587410639477~1906161927',
      },
    },
  },
};

export default config;

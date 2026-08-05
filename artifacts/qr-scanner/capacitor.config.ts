import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scanpro.app',
  appName: 'Scanner Pro',
  webDir: 'dist/public',
  bundledWebRuntime: false,
  android: {
    webContentsDebuggingEnabled: false,
  },
};

export default config;

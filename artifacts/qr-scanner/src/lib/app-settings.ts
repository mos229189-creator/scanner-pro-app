import { Capacitor, registerPlugin } from "@capacitor/core";

interface AppSettingsPlugin {
  open(): Promise<void>;
  getBuildInfo(): Promise<{ debug: boolean }>;
}

const AppSettings = registerPlugin<AppSettingsPlugin>("AppSettings");

export async function openAppSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("App settings are only available on native platforms");
  }
  await AppSettings.open();
}

export async function isDebugBuild(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  const { debug } = await AppSettings.getBuildInfo();
  return debug;
}
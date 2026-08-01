import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { showNativeBanner, hideNativeBanner } from "../lib/admob-native";

export function AdBanner() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Show the real AdMob banner above the tab bar on native Android
    showNativeBanner();

    return () => {
      hideNativeBanner();
    };
  }, []);

  // On native the SDK overlays the banner from outside the WebView;
  // we render a transparent spacer so the layout height stays consistent.
  if (Capacitor.isNativePlatform()) {
    return <div className="h-[50px] w-full shrink-0" aria-hidden="true" />;
  }

  // Web preview — show a static placeholder
  return (
    <div className="h-[50px] w-full bg-secondary/80 border-t border-border flex items-center justify-center shrink-0 z-20 relative">
      <div className="absolute top-1 left-2 bg-primary/20 px-1 py-0.5 rounded text-[8px] text-primary font-bold uppercase">
        Ad
      </div>
      <span className="text-[11px] text-muted-foreground font-medium tracking-wide">
        Premium features unlock with no ads →
      </span>
    </div>
  );
}

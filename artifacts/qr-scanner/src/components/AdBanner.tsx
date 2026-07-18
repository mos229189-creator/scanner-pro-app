import { X } from "lucide-react";

export function AdBanner() {
  // AdMob Banner — 320x50 standard banner
  // Test ID (Android): ca-app-pub-3940256099942544/6300978111
  // Test ID (iOS): ca-app-pub-3940256099942544/2934735716
  // Replace with real IDs before publishing: https://apps.admob.com
  //
  // In Capacitor native build, replace this component with:
  // import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
  // AdMob.showBanner({ adId: 'YOUR_REAL_BANNER_ID', adSize: BannerAdSize.BANNER, position: BannerAdPosition.BOTTOM_CENTER });

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

import { X } from "lucide-react";

export function AdBanner() {
  // AdMob Banner — 320x50 standard banner
  // App ID:         ca-app-pub-4796587410639477~1906161927
  // Banner Ad Unit: ca-app-pub-4796587410639477/2365472715
  //
  // In Capacitor native build, replace this component with:
  // import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
  // AdMob.showBanner({ adId: 'ca-app-pub-4796587410639477/2365472715', adSize: BannerAdSize.BANNER, position: BannerAdPosition.BOTTOM_CENTER });

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

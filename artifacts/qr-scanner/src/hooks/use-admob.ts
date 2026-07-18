import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { showNativeInterstitial, showNativeRewarded } from "../lib/admob-native";

// Ad Unit IDs
// App ID:               ca-app-pub-4796587410639477~1906161927
// Interstitial Ad Unit: ca-app-pub-4796587410639477/1052391042
// Rewarded Ad Unit:     ca-app-pub-4796587410639477/1052391042

const INTERSTITIAL_THRESHOLD = 5;
const isNative = () => Capacitor.isNativePlatform();

export function useAdMob() {
  const [scanCount, setScanCount] = useState(0);
  const [generateCount, setGenerateCount] = useState(0);

  // Web-mock state (only shown on browser/web preview)
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showRewarded, setShowRewarded] = useState(false);
  const [rewardCallback, setRewardCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    const sCount = parseInt(localStorage.getItem("ad_scan_count") || "0");
    const gCount = parseInt(localStorage.getItem("ad_generate_count") || "0");
    setScanCount(sCount);
    setGenerateCount(gCount);
  }, []);

  const triggerInterstitial = useCallback(async () => {
    if (isNative()) {
      // Native: show real AdMob interstitial; don't show web mock
      await showNativeInterstitial();
    } else {
      // Web preview: show the in-app mock overlay
      setShowInterstitial(true);
    }
  }, []);

  const incrementScan = useCallback(() => {
    setScanCount(prev => {
      const next = prev + 1;
      localStorage.setItem("ad_scan_count", next.toString());
      if (next % INTERSTITIAL_THRESHOLD === 0) {
        triggerInterstitial();
      }
      return next;
    });
  }, [triggerInterstitial]);

  const incrementGenerate = useCallback(() => {
    setGenerateCount(prev => {
      const next = prev + 1;
      localStorage.setItem("ad_generate_count", next.toString());
      if (next % INTERSTITIAL_THRESHOLD === 0) {
        triggerInterstitial();
      }
      return next;
    });
  }, [triggerInterstitial]);

  /**
   * Request a rewarded ad before executing onRewarded.
   *
   * Native (Android):
   *   → prepareRewardVideoAd → showRewardVideoAd
   *   → onRewarded() fires only if the user earned the reward
   *
   * Web preview:
   *   → Shows the in-app 5-second mock overlay
   *   → onRewarded() fires when the user clicks "Continue"
   */
  const requestRewardedAd = useCallback((onRewarded: () => void) => {
    if (isNative()) {
      // Native path: bypass web mock entirely
      showNativeRewarded().then((earned) => {
        if (earned) onRewarded();
      });
    } else {
      // Web mock path
      setRewardCallback(() => onRewarded);
      setShowRewarded(true);
    }
  }, []);

  // Web mock close handlers (no-ops on native)
  const handleInterstitialClose = useCallback(() => {
    setShowInterstitial(false);
  }, []);

  const handleRewardedClose = useCallback((completed: boolean) => {
    setShowRewarded(false);
    if (completed && rewardCallback) {
      rewardCallback();
      setRewardCallback(null);
    }
  }, [rewardCallback]);

  return {
    scanCount,
    generateCount,
    incrementScan,
    incrementGenerate,
    requestRewardedAd,
    showInterstitial,
    showRewarded,
    handleInterstitialClose,
    handleRewardedClose,
  };
}

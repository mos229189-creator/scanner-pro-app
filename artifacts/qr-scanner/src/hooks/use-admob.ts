import { useState, useEffect, useCallback } from "react";

// Interstitial Test ID (Android): ca-app-pub-3940256099942544/1033173712
// Interstitial Test ID (iOS): ca-app-pub-3940256099942544/4411468910
// Rewarded Test ID (Android): ca-app-pub-3940256099942544/5224354917
// Rewarded Test ID (iOS): ca-app-pub-3940256099942544/1712485313

const INTERSTITIAL_THRESHOLD = 5;

export function useAdMob() {
  const [scanCount, setScanCount] = useState(0);
  const [generateCount, setGenerateCount] = useState(0);
  
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showRewarded, setShowRewarded] = useState(false);
  const [rewardCallback, setRewardCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    const sCount = parseInt(localStorage.getItem("ad_scan_count") || "0");
    const gCount = parseInt(localStorage.getItem("ad_generate_count") || "0");
    setScanCount(sCount);
    setGenerateCount(gCount);
  }, []);

  const incrementScan = useCallback(() => {
    setScanCount(prev => {
      const next = prev + 1;
      localStorage.setItem("ad_scan_count", next.toString());
      if (next % INTERSTITIAL_THRESHOLD === 0) {
        setShowInterstitial(true);
      }
      return next;
    });
  }, []);

  const incrementGenerate = useCallback(() => {
    setGenerateCount(prev => {
      const next = prev + 1;
      localStorage.setItem("ad_generate_count", next.toString());
      if (next % INTERSTITIAL_THRESHOLD === 0) {
        setShowInterstitial(true);
      }
      return next;
    });
  }, []);

  const requestRewardedAd = useCallback((onRewarded: () => void) => {
    setRewardCallback(() => onRewarded);
    setShowRewarded(true);
  }, []);

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

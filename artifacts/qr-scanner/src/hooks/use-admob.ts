import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { showNativeInterstitial } from "../lib/admob-native";

const INTERSTITIAL_THRESHOLD = 5;
const isNative = () => Capacitor.isNativePlatform();

export function useAdMob() {
  const [scanCount, setScanCount] = useState(0);
  const [generateCount, setGenerateCount] = useState(0);

  // Web-mock overlay state (only shown on browser preview)
  const [showInterstitial, setShowInterstitial] = useState(false);

  // Restore persisted counts so the threshold carries across sessions
  useEffect(() => {
    const s = parseInt(localStorage.getItem("ad_scan_count") ?? "0", 10);
    const g = parseInt(localStorage.getItem("ad_generate_count") ?? "0", 10);
    setScanCount(isNaN(s) ? 0 : s);
    setGenerateCount(isNaN(g) ? 0 : g);
  }, []);

  const triggerInterstitial = useCallback(async () => {
    if (isNative()) {
      // Native: fire real interstitial; catch so unhandled rejection never crashes the app
      showNativeInterstitial().catch((err) =>
        console.warn("[AdMob] interstitial error:", err)
      );
    } else {
      setShowInterstitial(true);
    }
  }, []);

  /**
   * Call after a confirmed new scan (not a deduplicated one).
   * ScannerPage is responsible for only calling this when a scan was actually added.
   */
  const incrementScan = useCallback(() => {
    setScanCount((prev) => {
      const next = prev + 1;
      localStorage.setItem("ad_scan_count", String(next));
      if (next % INTERSTITIAL_THRESHOLD === 0) {
        triggerInterstitial();
      }
      return next;
    });
  }, [triggerInterstitial]);

  const incrementGenerate = useCallback(() => {
    setGenerateCount((prev) => {
      const next = prev + 1;
      localStorage.setItem("ad_generate_count", String(next));
      if (next % INTERSTITIAL_THRESHOLD === 0) {
        triggerInterstitial();
      }
      return next;
    });
  }, [triggerInterstitial]);

  const handleInterstitialClose = useCallback(() => {
    setShowInterstitial(false);
  }, []);

  return {
    scanCount,
    generateCount,
    incrementScan,
    incrementGenerate,
    showInterstitial,
    handleInterstitialClose,
  };
}

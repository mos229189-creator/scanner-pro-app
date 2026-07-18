/**
 * admob-native.ts
 *
 * Thin bridge between the web mock (use-admob hook) and the real
 * @capacitor-community/admob SDK that runs only inside a native build.
 *
 * Usage pattern:
 *   - On web / browser preview → every function is a no-op / Promise.resolve()
 *   - On Android (Capacitor) → real AdMob SDK calls are made
 *
 * Ad Unit IDs
 *   App ID        : ca-app-pub-4796587410639477~1906161927  (in AndroidManifest)
 *   Banner        : ca-app-pub-4796587410639477/2365472715
 *   Interstitial  : ca-app-pub-4796587410639477/1052391042
 *   Rewarded      : ca-app-pub-4796587410639477/1052391042  (same unit, rewarded format)
 */

import { Capacitor } from "@capacitor/core";

const AD_UNIT_INTERSTITIAL = "ca-app-pub-4796587410639477/1052391042";
const AD_UNIT_REWARDED     = "ca-app-pub-4796587410639477/1052391042";

const isNative = () => Capacitor.isNativePlatform();

// Lazy-load the AdMob plugin only when running natively.
// Tree-shakers will drop the import path on web because it's behind isNative().
async function getAdMob() {
  const { AdMob } = await import("@capacitor-community/admob");
  return AdMob;
}

// ─── Initialise ──────────────────────────────────────────────────────────────

let _initialised = false;

export async function initAdMob(): Promise<void> {
  if (!isNative() || _initialised) return;
  const AdMob = await getAdMob();
  await AdMob.initialize({
    testingDevices: [],
    initializeForTesting: false,
  });
  _initialised = true;
  console.log("[AdMob] initialized");
}

// ─── Interstitial ─────────────────────────────────────────────────────────────

export async function showNativeInterstitial(): Promise<void> {
  if (!isNative()) return;
  const AdMob = await getAdMob();
  const { InterstitialAdPluginEvents } = await import("@capacitor-community/admob");

  return new Promise<void>((resolve) => {
    // Prepare first, then show on loaded event
    const loadedListener = AdMob.addListener(
      InterstitialAdPluginEvents.Loaded,
      async () => {
        (await loadedListener).remove();
        await AdMob.showInterstitial();
      }
    );

    const dismissedListener = AdMob.addListener(
      InterstitialAdPluginEvents.Dismissed,
      async () => {
        (await dismissedListener).remove();
        resolve();
      }
    );

    AdMob.prepareInterstitial({
      adId: AD_UNIT_INTERSTITIAL,
      isTesting: false,
    }).catch(async (err: unknown) => {
      console.warn("[AdMob] interstitial prepare failed:", err);
      (await loadedListener).remove();
      (await dismissedListener).remove();
      resolve(); // fail open — never block the user
    });
  });
}

// ─── Rewarded ─────────────────────────────────────────────────────────────────

/**
 * Show a rewarded ad natively.
 * @returns true if the user earned the reward, false if they skipped / ad failed
 */
export async function showNativeRewarded(): Promise<boolean> {
  if (!isNative()) return false; // caller falls back to web mock

  const AdMob = await getAdMob();
  const { RewardAdPluginEvents } = await import("@capacitor-community/admob");

  return new Promise<boolean>((resolve) => {
    let rewarded = false;

    const rewardListener = AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      async () => {
        rewarded = true;
        (await rewardListener).remove();
      }
    );

    const loadedListener = AdMob.addListener(
      RewardAdPluginEvents.Loaded,
      async () => {
        (await loadedListener).remove();
        await AdMob.showRewardVideoAd();
      }
    );

    const dismissedListener = AdMob.addListener(
      RewardAdPluginEvents.Dismissed,
      async () => {
        (await dismissedListener).remove();
        resolve(rewarded);
      }
    );

    AdMob.prepareRewardVideoAd({
      adId: AD_UNIT_REWARDED,
      isTesting: false,
    }).catch(async (err: unknown) => {
      console.warn("[AdMob] rewarded prepare failed:", err);
      (await rewardListener).remove();
      (await loadedListener).remove();
      (await dismissedListener).remove();
      resolve(false); // fail open
    });
  });
}

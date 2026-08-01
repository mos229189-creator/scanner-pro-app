/**
 * admob-native.ts
 *
 * Thin bridge between the web mock (use-admob hook) and the real
 * @capacitor-community/admob SDK that runs only inside a native build.
 *
 * On web / browser preview → every function is a no-op / Promise.resolve()
 * On Android (Capacitor)   → real AdMob SDK calls are made
 *
 * Ad Unit IDs
 *   App ID        : ca-app-pub-4796587410639477~1906161927  (in AndroidManifest)
 *   Banner        : ca-app-pub-4796587410639477/2365472715
 *   Interstitial  : ca-app-pub-4796587410639477/1052391042
 *   Rewarded      : ca-app-pub-4796587410639477/1052391042
 */

import { Capacitor } from "@capacitor/core";

const AD_UNIT_INTERSTITIAL = "ca-app-pub-4796587410639477/1052391042";
const AD_UNIT_REWARDED     = "ca-app-pub-4796587410639477/1052391042";

// Max time to wait for an ad to load + be dismissed before giving up.
// Prevents Promises hanging forever if the AdMob SDK never fires an event.
const AD_TIMEOUT_MS = 30_000;

const isNative = () => Capacitor.isNativePlatform();

async function getAdMob() {
  const { AdMob } = await import("@capacitor-community/admob");
  return AdMob;
}

/** Race a promise against a timeout that resolves to `fallback`. */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// ─── Initialise ──────────────────────────────────────────────────────────────

let _initialised = false;

export async function initAdMob(): Promise<void> {
  if (!isNative() || _initialised) return;
  try {
    const AdMob = await getAdMob();
    await AdMob.initialize({ testingDevices: [], initializeForTesting: false });
    _initialised = true;
    console.log("[AdMob] initialized");
  } catch (err) {
    console.warn("[AdMob] initialization failed:", err);
  }
}

// ─── Banner ───────────────────────────────────────────────────────────────────

export async function showNativeBanner(): Promise<void> {
  if (!isNative()) return;
  try {
    const { AdMob, BannerAdSize, BannerAdPosition } = await import(
      "@capacitor-community/admob"
    );
    await AdMob.showBanner({
      adId: "ca-app-pub-4796587410639477/2365472715",
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 68, // sit above the 68 px tab bar
      isTesting: false,
    });
  } catch (err) {
    console.warn("[AdMob] banner show failed:", err);
  }
}

export async function hideNativeBanner(): Promise<void> {
  if (!isNative()) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.removeBanner();
  } catch {}
}

// ─── Interstitial ─────────────────────────────────────────────────────────────

export async function showNativeInterstitial(): Promise<void> {
  if (!isNative()) return;

  const AdMob = await getAdMob();
  const { InterstitialAdPluginEvents } = await import(
    "@capacitor-community/admob"
  );

  const core = new Promise<void>((resolve) => {
    let loadedHandle: Promise<{ remove: () => void }>;
    let dismissedHandle: Promise<{ remove: () => void }>;

    const cleanup = async () => {
      (await loadedHandle)?.remove();
      (await dismissedHandle)?.remove();
    };

    loadedHandle = AdMob.addListener(
      InterstitialAdPluginEvents.Loaded,
      async () => {
        (await loadedHandle).remove();
        try {
          await AdMob.showInterstitial();
        } catch (err) {
          console.warn("[AdMob] interstitial show failed:", err);
          await cleanup();
          resolve();
        }
      }
    );

    dismissedHandle = AdMob.addListener(
      InterstitialAdPluginEvents.Dismissed,
      async () => {
        (await dismissedHandle).remove();
        resolve();
      }
    );

    AdMob.prepareInterstitial({
      adId: AD_UNIT_INTERSTITIAL,
      isTesting: false,
    }).catch(async (err: unknown) => {
      console.warn("[AdMob] interstitial prepare failed:", err);
      await cleanup();
      resolve(); // fail open — never block the user
    });
  });

  await withTimeout(core, AD_TIMEOUT_MS, undefined);
}

// ─── Rewarded ─────────────────────────────────────────────────────────────────

/**
 * @returns true if the user earned the reward, false if skipped / ad failed.
 */
export async function showNativeRewarded(): Promise<boolean> {
  if (!isNative()) return false;

  const AdMob = await getAdMob();
  const { RewardAdPluginEvents } = await import("@capacitor-community/admob");

  const core = new Promise<boolean>((resolve) => {
    let rewarded = false;
    let rewardHandle: Promise<{ remove: () => void }>;
    let loadedHandle: Promise<{ remove: () => void }>;
    let dismissedHandle: Promise<{ remove: () => void }>;

    const cleanup = async () => {
      (await rewardHandle)?.remove();
      (await loadedHandle)?.remove();
      (await dismissedHandle)?.remove();
    };

    rewardHandle = AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      async () => {
        rewarded = true;
        (await rewardHandle).remove();
      }
    );

    loadedHandle = AdMob.addListener(
      RewardAdPluginEvents.Loaded,
      async () => {
        (await loadedHandle).remove();
        try {
          await AdMob.showRewardVideoAd();
        } catch (err) {
          console.warn("[AdMob] rewarded show failed:", err);
          await cleanup();
          resolve(false);
        }
      }
    );

    dismissedHandle = AdMob.addListener(
      RewardAdPluginEvents.Dismissed,
      async () => {
        (await dismissedHandle).remove();
        resolve(rewarded);
      }
    );

    AdMob.prepareRewardVideoAd({
      adId: AD_UNIT_REWARDED,
      isTesting: false,
    }).catch(async (err: unknown) => {
      console.warn("[AdMob] rewarded prepare failed:", err);
      await cleanup();
      resolve(false); // fail open
    });
  });

  return withTimeout(core, AD_TIMEOUT_MS, false);
}

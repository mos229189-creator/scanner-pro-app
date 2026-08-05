/**
 * admob-native.ts
 *
 * Thin bridge between the web mock (use-admob hook) and the real
 * @capacitor-community/admob SDK that runs only inside a native build.
 *
 * On web / browser preview → every function is a no-op / Promise.resolve()
 * On Android (Capacitor)   → real AdMob SDK calls are made
 *
 * Efficiency strategy:
 *   - The interstitial is PRE-LOADED right after init and re-loaded after
 *     every show, so an ad is always ready the instant it is needed
 *     (no 2–10 s load delay = far fewer lost impressions).
 *   - Each format is a serialized state machine: a single shared load
 *     promise (never two concurrent prepares) and a show-in-progress
 *     guard (never two concurrent shows against the plugin's single
 *     native ad instance).
 *   - All listeners (Dismissed, FailedToShow) are registered
 *     up front and removed on EVERY exit path, including timeout.
 *   - Banner uses ADAPTIVE_BANNER (higher eCPM + better fill than
 *     fixed 320×50 on modern screens).
 *
 * Ad Unit IDs
 *   App ID        : ca-app-pub-4796587410639477~1906161927  (in AndroidManifest)
 *   Banner        : ca-app-pub-4796587410639477/2365472715
 *   Interstitial  : ca-app-pub-4796587410639477/1052391042
 */

import { Capacitor } from "@capacitor/core";
import { isDebugBuild } from "./app-settings";

const PRODUCTION_ADS = {
  banner: "ca-app-pub-4796587410639477/2365472715",
  interstitial: "ca-app-pub-4796587410639477/1052391042",
};
const TEST_ADS = {
  banner: "ca-app-pub-3940256099942544/6300978111",
  interstitial: "ca-app-pub-3940256099942544/1033173712",
};

// Max time to wait for a load or a show/dismiss cycle before giving up.
const AD_TIMEOUT_MS = 30_000;

const isNative = () => Capacitor.isNativePlatform();

async function getAdMob() {
  const { AdMob } = await import("@capacitor-community/admob");
  return AdMob;
}

/** Race a promise against a timeout; timer is always cleared. */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    p,
    new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
    }),
  ]).finally(() => clearTimeout(timer!)) as Promise<T>;
}

type ListenerHandle = { remove: () => void };

/** Remove a batch of listener handles, ignoring individual failures. */
async function removeAll(handles: Promise<ListenerHandle>[]): Promise<void> {
  await Promise.all(
    handles.map(async (h) => {
      try {
        (await h)?.remove();
      } catch {}
    })
  );
}

// ─── Pre-load state (serialized per format) ──────────────────────────────────
//
// loadPromise semantics:
//   null      → no ad loaded and no load in flight
//   Promise   → a load is in flight or has completed; resolves true if an ad
//               is ready, false if the load failed.
// Consumers must atomically take the promise (set to null) before showing.

let interstitialLoad: Promise<boolean> | null = null;
let interstitialShowing = false;
let debugBuildPromise: Promise<boolean> | null = null;

function getDebugBuild(): Promise<boolean> {
  if (!debugBuildPromise) {
    debugBuildPromise = isDebugBuild().catch(() => true);
  }
  return debugBuildPromise;
}

function preloadInterstitial(): Promise<boolean> {
  if (!isNative()) return Promise.resolve(false);
  if (!interstitialLoad) {
    interstitialLoad = (async () => {
      try {
        const AdMob = await getAdMob();
        const debug = await getDebugBuild();
        await AdMob.prepareInterstitial({
          adId: debug ? TEST_ADS.interstitial : PRODUCTION_ADS.interstitial,
          isTesting: debug,
        });
        return true;
      } catch (err) {
        console.warn("[AdMob] interstitial preload failed:", err);
        return false;
      }
    })();
    // If the load failed, clear it so a later attempt can retry.
    interstitialLoad.then((ok) => {
      if (!ok) interstitialLoad = null;
    });
  }
  return interstitialLoad;
}

// ─── Initialise ──────────────────────────────────────────────────────────────

let _initialised = false;

export async function initAdMob(): Promise<void> {
  if (!isNative() || _initialised) return;
  try {
    const AdMob = await getAdMob();
    const debug = await getDebugBuild();
    await AdMob.initialize({
      testingDevices: [],
      initializeForTesting: debug,
    });
    _initialised = true;
    console.log("[AdMob] initialized");
    // Warm the cache — don't await; let it load in the background.
    preloadInterstitial();
  } catch (err) {
    console.warn("[AdMob] initialization failed:", err);
  }
}

// ─── Banner ───────────────────────────────────────────────────────────────────

export async function showNativeBanner(): Promise<void> {
  if (!isNative()) return;
  try {
    await initAdMob();
    const debug = await getDebugBuild();
    const { AdMob, BannerAdSize, BannerAdPosition } = await import(
      "@capacitor-community/admob"
    );
    await AdMob.showBanner({
      adId: debug ? TEST_ADS.banner : PRODUCTION_ADS.banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER, // higher eCPM + fill than fixed 320×50
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 68, // sit above the 68 px tab bar
      isTesting: debug,
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
  if (!isNative() || interstitialShowing) return;
  interstitialShowing = true;

  const handles: Promise<ListenerHandle>[] = [];
  try {
    await initAdMob();
    // Wait (bounded) for the pre-loaded ad, or start a load now.
    const ready = await withTimeout(preloadInterstitial(), AD_TIMEOUT_MS, false);
    if (!ready) return; // no ad available — never block the user

    // Atomically consume the loaded ad.
    interstitialLoad = null;

    const AdMob = await getAdMob();
    const { InterstitialAdPluginEvents } = await import(
      "@capacitor-community/admob"
    );

    const core = new Promise<void>((resolve) => {
      handles.push(
        AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => resolve()),
        AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (err) => {
          console.warn("[AdMob] interstitial failed to show:", err);
          resolve();
        })
      );
      AdMob.showInterstitial().catch((err: unknown) => {
        console.warn("[AdMob] interstitial show failed:", err);
        resolve();
      });
    });

    await withTimeout(core, AD_TIMEOUT_MS, undefined);
  } catch (err) {
    console.warn("[AdMob] interstitial error:", err);
  } finally {
    await removeAll(handles); // cleanup on every exit path, incl. timeout
    interstitialShowing = false;
    preloadInterstitial(); // warm the next one in the background
  }
}

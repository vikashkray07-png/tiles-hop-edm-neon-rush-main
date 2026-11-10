import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';

const TEST_REWARDED_AD_ID =
  'ca-app-pub-3940256099942544/5224354917';

const INIT_TIMEOUT_MS = 10000;
const LOAD_TIMEOUT_MS = 15000;
const SHOW_TIMEOUT_MS = 120000;

let initializationPromise: Promise<void> | null = null;
let adRequestInProgress = false;

let adReady = false;
let adReadyAt = 0;
let preloadPromise: Promise<void> | null = null;

const AD_READY_MAX_AGE_MS = 45 * 60 * 1000;

// Confirms the phone really has internet right now.
export async function hasReliableInternet(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);

  try {
    await fetch('https://www.gstatic.com/generate_204', {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });

    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// When the phone goes offline, forget any preloaded ad.
if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    adReady = false;
  });
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(String(label) + ' timed out')),
      ms
    );

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function initializeAdMob(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error(
      'Test rewarded ads are available only in the native app.'
    );
  }

  if (!initializationPromise) {
    initializationPromise = AdMob.initialize().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  try {
    await withTimeout(
      initializationPromise,
      INIT_TIMEOUT_MS,
      'AdMob init'
    );
  } catch (error) {
    initializationPromise = null;
    throw error;
  }
}

async function loadAd(): Promise<void> {
  await initializeAdMob();

  if (!(await hasReliableInternet())) {
    throw new Error('No internet connection');
  }

  await AdMob.prepareRewardVideoAd({
    adId: TEST_REWARDED_AD_ID,
    isTesting: true,
  });

  if (!(await hasReliableInternet())) {
    adReady = false;
    throw new Error('Internet connection was lost while loading the ad');
  }

  adReady = true;
  adReadyAt = Date.now();
}

function adIsFresh(): boolean {
  return adReady && Date.now() - adReadyAt < AD_READY_MAX_AGE_MS;
}

// Safe preload.
export function preloadRewardedTestAd(): void {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    adReady = false;
    return;
  }

  if (adRequestInProgress || preloadPromise || adIsFresh()) {
    return;
  }

  preloadPromise = hasReliableInternet()
    .then((online) => {
      if (!online) {
        adReady = false;
        return;
      }

      return withTimeout(
        loadAd(),
        LOAD_TIMEOUT_MS,
        'Rewarded ad preload'
      );
    })
    .catch(() => {
      adReady = false;
    })
    .finally(() => {
      preloadPromise = null;
    });
}

export async function showRewardedTestAd(): Promise<boolean> {
  if (adRequestInProgress) return false;

  adRequestInProgress = true;

  const handles: PluginListenerHandle[] = [];
  let rewarded = false;

  try {
    if (!(await hasReliableInternet())) {
      adReady = false;
      return false;
    }

    await initializeAdMob();

    let settleClosed: () => void = () => {};

    const closed = new Promise<void>((resolve) => {
      settleClosed = resolve;
    });

    try {
      handles.push(
        await AdMob.addListener(
          RewardAdPluginEvents.Rewarded,
          () => {
            rewarded = true;
          }
        )
      );

      handles.push(
        await AdMob.addListener(
          RewardAdPluginEvents.Dismissed,
          () => settleClosed()
        )
      );

      handles.push(
        await AdMob.addListener(
          RewardAdPluginEvents.FailedToShow,
          () => settleClosed()
        )
      );
    } catch (listenerError) {
      console.warn(
        'Rewarded ad listeners unavailable:',
        listenerError
      );
    }

    if (preloadPromise) {
      try {
        await preloadPromise;
      } catch {
        // Handled below.
      }
    }

    if (!adIsFresh()) {
      await withTimeout(
        loadAd(),
        LOAD_TIMEOUT_MS,
        'Rewarded ad load'
      );
    }

    // Check internet immediately before opening the ad.
    if (!(await hasReliableInternet())) {
      adReady = false;
      return false;
    }

    adReady = false;

    const showPromise = AdMob.showRewardVideoAd()
      .then((reward) => {
        if (
          typeof reward?.amount === 'number' &&
          reward.amount > 0
        ) {
          rewarded = true;
        }
      })
      .catch((error) => {
        console.error('Rewarded ad show failed:', error);
      });

    await withTimeout(
      Promise.race([showPromise, closed]),
      SHOW_TIMEOUT_MS,
      'Rewarded ad show'
    );

    return rewarded;

  } catch (error) {
    adReady = false;
    console.error('Rewarded test ad failed:', error);
    return rewarded;

  } finally {
    for (const handle of handles) {
      try {
        await handle.remove();
      } catch {
        // Ignore listener cleanup errors.
      }
    }

    adRequestInProgress = false;

    if (
      typeof navigator !== 'undefined' &&
      navigator.onLine
    ) {
      setTimeout(() => preloadRewardedTestAd(), 2500);
    }
  }
}

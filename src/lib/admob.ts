import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';

const TEST_REWARDED_AD_ID =
  'ca-app-pub-3940256099942544/5224354917';

const INIT_TIMEOUT_MS = 10000;
const LOAD_TIMEOUT_MS = 15000;
const SHOW_TIMEOUT_MS = 120000;

let initializationPromise: Promise<void> | null = null;
let adRequestInProgress = false;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); }
    );
  });
}

async function initializeAdMob(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Test rewarded ads are available only in the native app.');
  }

  if (!initializationPromise) {
    initializationPromise = AdMob.initialize().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  try {
    await withTimeout(initializationPromise, INIT_TIMEOUT_MS, 'AdMob init');
  } catch (error) {
    initializationPromise = null;
    throw error;
  }
}

export async function showRewardedTestAd(): Promise<boolean> {
  if (adRequestInProgress) return false;
  adRequestInProgress = true;

  const handles: PluginListenerHandle[] = [];
  let rewarded = false;

  try {
    await initializeAdMob();

    let settleClosed: () => void = () => {};
    const closed = new Promise<void>((resolve) => { settleClosed = resolve; });

    try {
      handles.push(await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => { rewarded = true; }));
      handles.push(await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => settleClosed()));
      handles.push(await AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => settleClosed()));
    } catch (listenerError) {
      console.warn('Rewarded ad listeners unavailable:', listenerError);
    }

    await withTimeout(
      AdMob.prepareRewardVideoAd({ adId: TEST_REWARDED_AD_ID, isTesting: true }),
      LOAD_TIMEOUT_MS,
      'Rewarded ad load'
    );

    const showPromise = AdMob.showRewardVideoAd()
      .then((reward) => {
        if (typeof reward?.amount === 'number' && reward.amount > 0) rewarded = true;
      })
      .catch((error) => console.error('Rewarded test ad show failed:', error));

    await withTimeout(Promise.race([showPromise, closed]), SHOW_TIMEOUT_MS, 'Rewarded ad show');

    return rewarded;
  } catch (error) {
    console.error('Rewarded test ad failed:', error);
    return rewarded;
  } finally {
    for (const handle of handles) {
      try { await handle.remove(); } catch { /* ignore */ }
    }
    adRequestInProgress = false;
  }
}

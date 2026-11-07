
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';

const TEST_REWARDED_AD_ID =
  'ca-app-pub-3940256099942544/5224354917';

let initializationPromise: Promise<void> | null = null;
let adRequestInProgress = false;

async function initializeAdMob(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('AdMob test ads are available only in the native app.');
  }

  if (!initializationPromise) {
    initializationPromise = AdMob.initialize().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  await initializationPromise;
}

/**
 * Shows Google's official Android rewarded TEST ad.
 * Returns true only when the plugin confirms that a reward was earned.
 * Never grants a reward when the ad is dismissed or fails.
 */
export async function showRewardedTestAd(): Promise<boolean> {
  if (adRequestInProgress) {
    return false;
  }

  adRequestInProgress = true;

  try {
    await initializeAdMob();

    await AdMob.prepareRewardVideoAd({
      adId: TEST_REWARDED_AD_ID,
      isTesting: true,
    });

    const reward = await AdMob.showRewardVideoAd();

    return Boolean(reward);
  } catch (error) {
    console.error('Rewarded test ad failed:', error);
    return false;
  } finally {
    adRequestInProgress = false;
  }
}

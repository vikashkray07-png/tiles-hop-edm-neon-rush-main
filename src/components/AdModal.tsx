import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { ShieldAlert, X } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';
import { showRewardedTestAd } from '../lib/admob';

export type AdType =
  | 'skin_unlock'
  | 'skin_coin_purchase'
  | 'level_complete'
  | 'continue_revive';

interface AdModalProps {
  type: AdType;
  title?: string;
  subtitle?: string;
  skinName?: string;
  adNumber?: number;
  totalAds?: number;
  onComplete: () => void;
  onClose?: () => void;
}

type AdStatus = 'ready' | 'loading' | 'error';

export const AdModal: React.FC<AdModalProps> = ({
  type,
  skinName,
  adNumber = 1,
  totalAds = 2,
  onComplete,
  onClose,
}) => {
  const [status, setStatus] = useState<AdStatus>('ready');
  const [error, setError] = useState('');

  const busyRef = useRef(false);
  const rewardedRef = useRef(false);

  useEffect(() => {
    soundEngine.stopBackgroundMusic();

    if (!Capacitor.isNativePlatform()) {
      setStatus('error');
      setError('Google test ads are available only in the installed Android app.');
    }
  }, []);

  const handleWatchAd = async () => {
    if (busyRef.current || rewardedRef.current) return;

    busyRef.current = true;
    setStatus('loading');
    setError('');

    try {
      const rewardEarned = await showRewardedTestAd();

      if (!rewardEarned) {
        setStatus('error');
        setError('Ad reward was not confirmed. No game reward was granted.');
        return;
      }

      rewardedRef.current = true;
      onComplete();
    } catch (err) {
      console.error('Rewarded test ad failed:', err);
      setStatus('error');
      setError('Google test ad failed. No reward was granted.');
    } finally {
      busyRef.current = false;
    }
  };

  // Level-complete ad starts automatically (other ad types stay tap-to-play).
  useEffect(() => {
    if (type !== 'level_complete' || !Capacitor.isNativePlatform()) return;

    // Small delay so the victory screen finishes drawing first.
    const timer = window.setTimeout(() => {
      void handleWatchAd();
    }, 600);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    if (busyRef.current || rewardedRef.current) return;
    onClose?.();
  };

  const header =
    type === 'skin_unlock'
      ? 'GOOGLE TEST REWARD · SKIN (' + adNumber + '/' + totalAds + ')'
      : type === 'continue_revive'
        ? 'GOOGLE TEST REWARD · REVIVE'
        : type === 'level_complete'
          ? 'GOOGLE TEST AD · LEVEL CLEAR'
          : 'GOOGLE TEST REWARD · STORE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-cyan-400/30 bg-gradient-to-b from-[#082333] to-[#050912] p-6 text-center text-white shadow-2xl">

        <div className="mb-6 flex items-center justify-between gap-3">
          <span className="text-left text-[10px] font-black tracking-widest text-cyan-300">
            {header}
          </span>

          {onClose && (
            <button
              type="button"
              onClick={handleClose}
              disabled={status === 'loading'}
              className="rounded-full bg-white/10 p-2 disabled:opacity-40"
              aria-label="Close ad"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <ShieldAlert
          className="mx-auto mb-4 text-yellow-400"
          size={44}
        />

        <h2 className="mb-2 text-2xl font-black">
          Google Rewarded Test Ad
        </h2>

        <p className="mb-4 text-sm text-white/70">
          This uses Google's official test advertisement.
          It is not a real commercial advertisement.
        </p>

        {skinName && type === 'skin_unlock' && (
          <p className="mb-4 text-sm text-cyan-300">
            Skin: <strong className="text-white">{skinName}</strong>
            <span className="ml-2 text-yellow-400">
              ({adNumber}/{totalAds})
            </span>
          </p>
        )}

        {status === 'loading' && (
          <p className="mb-4 text-sm text-cyan-300">
            Loading or showing the test ad. Please wait…
          </p>
        )}

        {status === 'error' && (
          <p role="alert" className="mb-4 text-sm text-red-300">
            {error}
          </p>
        )}

        {status === 'ready' && (
          <p className="mb-4 text-sm text-white/60">
            {type === 'level_complete' && Capacitor.isNativePlatform()
              ? 'Starting Google test ad…'
              : "Tap below to request Google's test advertisement."}
          </p>
        )}

        <button
          type="button"
          onClick={handleWatchAd}
          disabled={status !== 'ready'}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'loading'
            ? 'PLEASE WAIT…'
            : status === 'error'
              ? 'AD UNAVAILABLE'
              : 'WATCH TEST AD'}
        </button>

        {status === 'error' && Capacitor.isNativePlatform() && (
          <button
            type="button"
            onClick={() => {
              setError('');
              setStatus('ready');
            }}
            className="mt-3 text-sm font-semibold text-cyan-300 underline"
          >
            Try Again
          </button>
        )}

        <p className="mt-4 text-[10px] text-white/40">
          Rewards are granted only after successful confirmation
          from the rewarded-ad function. Failed or dismissed ads
          grant no reward.
        </p>
      </div>
    </div>
  );
};

import React from 'react';
import { ShieldAlert, X } from 'lucide-react';

export type AdType = 'skin_unlock' | 'skin_coin_purchase' | 'level_complete' | 'continue_revive';

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

/**
 * Honest fallback while no production ad provider is configured.
 * This component intentionally never calls onComplete: a timer or demo card
 * must not be treated as a verified rewarded-ad completion.
 */
export const AdModal: React.FC<AdModalProps> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
    <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-slate-950 p-6 text-center shadow-2xl">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h2 className="mb-2 text-xl font-black text-white">Ads unavailable</h2>
      <p className="mb-5 text-sm leading-relaxed text-white/70">
        A real advertisement provider is not configured yet. Connect to the internet and try again later. No ad reward has been granted.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mx-auto flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950"
      >
        <X className="h-4 w-4" /> Close
      </button>
    </div>
  </div>
);

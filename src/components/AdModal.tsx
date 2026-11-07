import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, CheckCircle, Sparkles, X, ShieldAlert } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

export type AdType = 'skin_unlock' | 'skin_coin_purchase' | 'level_complete' | 'continue_revive';

interface AdModalProps {
  type: AdType;
  title?: string;
  subtitle?: string;
  skinName?: string;
  adNumber?: number; // e.g. 1 or 2
  totalAds?: number; // e.g. 2
  onComplete: () => void;
  onClose?: () => void;
}

const DEMO_CAMPAIGNS = [
  {
    title: 'Neon Beat EDM Soundtrack',
    tagline: 'Experience high-octane synthwave beats and electronic rhythm tracks curated for Tiles Hop.',
    cta: 'LISTEN IN-GAME',
    accentColor: '#00f5ff',
    bgGradient: 'from-[#052636] via-[#02131c] to-[#01090d]',
    icon: '🎵',
  },
  {
    title: 'Cosmic Hopper Skin Collection',
    tagline: 'Unlock vibrant celestial planet skins with unique shockwaves and neon glow effects.',
    cta: 'VIEW SKINS',
    accentColor: '#ff2a7a',
    bgGradient: 'from-[#3b081a] via-[#1f030d] to-[#0d0105]',
    icon: '⚡',
  },
  {
    title: 'Galactic EDM Tour 2026',
    tagline: 'Master all 150 cosmic levels and climb the live global gem leaderboard.',
    cta: 'PLAY LEVELS',
    accentColor: '#6366f1',
    bgGradient: 'from-[#141842] via-[#0a0c24] to-[#040512]',
    icon: '🚀',
  },
];

export const AdModal: React.FC<AdModalProps> = ({
  type,
  skinName,
  adNumber = 1,
  totalAds = 2,
  onComplete,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(5);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [campaign] = useState(() => DEMO_CAMPAIGNS[Math.floor(Math.random() * DEMO_CAMPAIGNS.length)]);
  const claimedRef = useRef(false);

  useEffect(() => {
    soundEngine.stopBackgroundMusic();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsCompleted(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleClaim = () => {
    if (claimedRef.current) return;
    claimedRef.current = true;
    onComplete();
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      handleClaim();
    }
  };

  const progressPercent = ((5 - timeLeft) / 5) * 100;

  let headerBadge = 'DEMO AD SIMULATION · PREVIEW MODE';
  if (type === 'skin_unlock') {
    headerBadge = `DEMO REWARD (${adNumber}/${totalAds}) · UNLOCK SKIN`;
  } else if (type === 'continue_revive') {
    headerBadge = 'DEMO REWARD · REVIVE & CONTINUE';
  } else if (type === 'level_complete') {
    headerBadge = 'DEMO INTERSTITIAL · LEVEL CLEAR';
  } else if (type === 'skin_coin_purchase') {
    headerBadge = 'DEMO REWARD · REWARD STORE';
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 select-none animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
            <Sparkles className="w-3 h-3" />
            {headerBadge}
          </span>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-all cursor-pointer"
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <button
              onClick={handleClaim}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-white font-black text-xs tracking-wider shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 animate-bounce"
            >
              <CheckCircle className="w-4 h-4 text-white" />
              <span>CLAIM REWARD &amp; CONTINUE</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-white font-mono text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Reward in {timeLeft}s</span>
            </div>
          )}

          {onClose && (
            <button
              onClick={handleCancel}
              title="Close Ad"
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Ad Visual Creative */}
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col justify-center items-center my-4">
        <div className={`w-full rounded-3xl p-6 md:p-8 bg-gradient-to-b ${campaign.bgGradient} border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center text-center relative overflow-hidden`}>
          {/* Subtle animated neon backdrop glow */}
          <div
            className="absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ backgroundColor: campaign.accentColor }}
          />

          {/* Ad Icon */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-xl border border-white/20"
            style={{ backgroundColor: `${campaign.accentColor}25` }}
          >
            {campaign.icon}
          </div>

          {/* Transparent Notice */}
          <div className="text-[10px] uppercase font-bold tracking-widest text-yellow-400/90 mb-1 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-yellow-400" />
            DEVELOPER PREVIEW AD SIMULATION
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide mb-2">
            {campaign.title}
          </h2>

          <p className="text-xs md:text-sm text-white/80 max-w-sm mb-5 leading-relaxed">
            {campaign.tagline}
          </p>

          {/* Contextual Message */}
          {skinName && (
            <div className="w-full mb-4 py-2 px-3 rounded-xl bg-black/40 border border-white/10 text-xs text-cyan-300 font-semibold flex items-center justify-center gap-1.5">
              <span>Simulating ad reward for:</span>
              <strong className="text-white">{skinName}</strong>
              {type === 'skin_unlock' && (
                <span className="text-yellow-400">({adNumber}/{totalAds})</span>
              )}
            </div>
          )}

          {/* Info banner explaining production ad requirements */}
          <div className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-white/60 mb-2">
            No live ad network (e.g. Google AdSense / H5 Games Ads) is configured. Real commercial ads require publisher registration and real Ad Unit IDs.
          </div>
        </div>
      </div>

      {/* Bottom Progress Bar & Status */}
      <div className="w-full max-w-lg mx-auto z-10">
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/10 mb-2">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-pink-500 to-green-400 transition-all duration-300 ease-linear shadow-[0_0_10px_rgba(0,240,255,0.7)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-white/50 px-1">
          <span>{isCompleted ? '✓ Simulation completed' : `Simulating preview (${timeLeft}s remaining)`}</span>
          {isCompleted ? (
            <button
              onClick={handleClaim}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
            >
              Collect Reward
            </button>
          ) : (
            <span>Reward unlocked after simulation</span>
          )}
        </div>
      </div>
    </div>
  );
};

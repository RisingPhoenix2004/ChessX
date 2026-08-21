import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, Award } from 'lucide-react';
import { LevelInfo } from '../../services/gamification';

interface DopamineOverlayProps {
  praiseText: string | null;
  comboCount: number;
  xpEarned: number | null;
  levelUpInfo: LevelInfo | null;
  onCloseLevelUp: () => void;
}

export const triggerConfetti = () => {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
  });
};

export const DopamineOverlay: React.FC<DopamineOverlayProps> = ({
  praiseText,
  comboCount,
  xpEarned,
  levelUpInfo,
  onCloseLevelUp,
}) => {
  useEffect(() => {
    if (levelUpInfo) {
      triggerConfetti();
    }
  }, [levelUpInfo]);

  return (
    <>
      {/* Floating Praise Banner */}
      <AnimatePresence>
        {praiseText && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1.1 }}
            exit={{ opacity: 0, y: -40, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 text-white font-extrabold text-xl sm:text-2xl px-6 py-2.5 rounded-full shadow-2xl shadow-emerald-500/50 border border-white/20 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
              <span>{praiseText}</span>
              {xpEarned && (
                <span className="bg-black/30 px-3 py-0.5 rounded-full text-amber-300 text-sm font-bold ml-2">
                  +{xpEarned} XP
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combo Streak Multiplier Banner */}
      <AnimatePresence>
        {comboCount >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: 50 }}
            className="fixed top-36 right-6 z-40 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold px-4 py-2 rounded-2xl shadow-lg border border-amber-300/30 flex items-center gap-2">
              <Zap className="w-5 h-5 fill-yellow-300 text-yellow-300 animate-bounce" />
              <span className="text-lg">{comboCount}x COMBO!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Modal Dialog */}
      <AnimatePresence>
        {levelUpInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="bg-gradient-to-b from-[#182235] to-[#0f172a] border border-emerald-500/50 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-emerald-500/30 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
              
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/40">
                {levelUpInfo.icon}
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs mb-3">
                <Award className="w-4 h-4" />
                <span>LEVEL UP!</span>
              </div>

              <h2 className="text-3xl font-extrabold text-white mb-1">
                Level {levelUpInfo.level}
              </h2>
              <p className="text-emerald-400 font-bold text-lg mb-6">
                {levelUpInfo.title}
              </p>

              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                You’ve unlocked a new title rank! Your calculation speed and tactical vision are advancing rapidly.
              </p>

              <button
                onClick={onCloseLevelUp}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-base shadow-lg shadow-emerald-500/30 transition-all transform active:scale-95"
              >
                KEEP SOLVING
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

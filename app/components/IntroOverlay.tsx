"use client";

import { AnimatePresence, motion } from "framer-motion";

export function IntroOverlay({
  isVisible,
  onComplete,
  onSkip,
}: {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0a0a0f]"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center gap-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-[10px] uppercase tracking-[0.5em] text-white/50"
            >
              VisionGrid
            </motion.div>
            <motion.h1
              initial={{ letterSpacing: "0.12em" }}
              animate={{ letterSpacing: "0.02em" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl font-semibold text-white sm:text-6xl"
            >
              Midnight Nebula
            </motion.h1>
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 180, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-white/60"
            >
              Spatial AI Art Studio
            </motion.p>
          </motion.div>

          <button
            onClick={onSkip}
            className="absolute bottom-8 right-8 rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:text-white"
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";

// AI host captions as a comic speech bubble at the bottom of the main screen
// (PRD §18), tap to skip the voice line. The host stays an off-screen voice.
export function CaptionBar({ caption, onSkip }: { caption: string | null; onSkip: () => void }) {
  return (
    <AnimatePresence>
      {caption && (
        <motion.div
          initial={{ y: 70, opacity: 0, rotate: 1.5 }}
          animate={{ y: 0, opacity: 1, rotate: -0.5 }}
          exit={{ y: 70, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 26 }}
          className="fixed inset-x-0 bottom-8 z-40 flex justify-center px-6"
        >
          <button onClick={onSkip} title="Skip voice line" className="relative max-w-3xl">
            {/* bubble */}
            <span className="panel panel-grain block px-7 py-4 text-left">
              <span className="font-hand text-xl leading-snug md:text-2xl" style={{ color: "#221f30" }}>
                {caption}
              </span>
              <span
                className="font-score mt-1 block text-[10px] uppercase tracking-[0.25em]"
                style={{ color: "rgba(34,31,48,0.5)" }}
              >
                the host · tap to skip
              </span>
            </span>
            {/* tail */}
            <svg
              viewBox="0 0 40 30"
              className="absolute -bottom-5 left-12 h-6 w-8"
              aria-hidden
            >
              <path d="M4 2 L36 2 L14 28 Z" fill="#f5ecd4" stroke="#221f30" strokeWidth="4" strokeLinejoin="round" />
              <path d="M6 0 L34 0 L33 4 L7 4 Z" fill="#f5ecd4" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

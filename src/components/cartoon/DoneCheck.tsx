"use client";

// The "they've submitted" badge pinned to a player's mascot on the big screen.
// One look across every game: teal disc, ink outline, ink check, pops in.

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function DoneCheck({ className }: { className?: string }) {
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 600, damping: 18 }}
      className={cn(
        "absolute -right-2 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px]",
        className
      )}
      style={{ background: "var(--teal)", borderColor: "var(--ink)", boxShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
        <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="var(--ink)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="sr-only">submitted</span>
    </motion.span>
  );
}

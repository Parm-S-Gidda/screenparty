"use client";

// Rubber-stamp result labels: CORRECT! / NOPE! / TIME'S UP!

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { playSfx, type SfxName } from "@/lib/sfx";

const STAMP_COLORS = {
  green: "#3e8e2f",
  red: "#c93a2c",
  mustard: "#b07d0a",
  ink: "#221f30",
} as const;

export function Stamp({
  children,
  color = "green",
  className,
  size = "lg",
}: {
  children: React.ReactNode;
  color?: keyof typeof STAMP_COLORS;
  className?: string;
  size?: "md" | "lg" | "xl";
}) {
  const sizes = { md: "text-2xl", lg: "text-4xl md:text-5xl", xl: "text-5xl md:text-7xl" };
  return (
    <div
      className={cn("stamp inline-block", sizes[size], className)}
      style={{ color: STAMP_COLORS[color] }}
    >
      {children}
    </div>
  );
}

// Verdict popup: slams down huge over the whole stage, holds a beat, and gets
// out of the way, the layout underneath never moves. Remount (key) to replay.
export function StampPop({
  children,
  color = "green",
  subtitle,
  holdMs = 2200,
  sfx,
}: {
  children: React.ReactNode;
  color?: keyof typeof STAMP_COLORS;
  subtitle?: string;
  holdMs?: number;
  sfx?: SfxName;
}) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    if (sfx) playSfx(sfx);
    const timer = setTimeout(() => setShow(false), holdMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- play once on mount
  }, [holdMs]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.15 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 2.8, rotate: 10 }}
            animate={{ scale: 1, rotate: -5 }}
            transition={{ type: "spring", stiffness: 420, damping: 17 }}
            className="flex flex-col items-center gap-2"
          >
            <Stamp color={color} size="xl" className="text-7xl md:text-9xl">
              {children}
            </Stamp>
            {subtitle && (
              <p
                className="font-hand text-3xl"
                style={{ color: "var(--cream)", textShadow: "2px 2px 0 #221f30" }}
              >
                {subtitle}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

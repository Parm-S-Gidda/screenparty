"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

// Paper-scrap confetti in the stage palette.
const COLORS = ["#f0b429", "#e2493b", "#2fa8a0", "#ee7c8e", "#6f5aa0", "#76b041", "#f5ecd4"];

export function Confetti({ count = 80 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 2.5,
        duration: 3 + Math.random() * 3,
        color: COLORS[i % COLORS.length],
        size: 7 + Math.random() * 9,
        rotate: Math.random() * 360,
        squiggle: i % 4 === 0,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: "-10vh", x: `${p.x}vw`, rotate: 0, opacity: 1 }}
          animate={{ y: "110vh", rotate: p.rotate + 720, opacity: [1, 1, 0.85] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.squiggle ? p.size * 0.35 : p.size * 0.7,
            backgroundColor: p.color,
            borderRadius: p.squiggle ? 999 : 2,
            border: "1.5px solid rgba(34,31,48,0.4)",
          }}
        />
      ))}
    </div>
  );
}

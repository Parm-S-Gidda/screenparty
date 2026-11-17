"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Mascot } from "@/components/cartoon/Mascot";

// Hero focal moment: the TV switches on like an old set (a bright line that
// opens to full picture), then a phone slides up and a mascot pops in to vote.
// The screenshot is real Higher or Lower gameplay.
export function HeroStage() {
  const reduce = useReducedMotion();
  const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15 } };

  return (
    <div className="relative mx-auto w-full max-w-xl pb-10 pr-6 sm:pr-10" aria-hidden>
      {/* TV */}
      <div className="panel p-2 sm:p-3" style={{ background: "var(--ink)", borderColor: "var(--ink)" }}>
        <motion.div
          className="relative overflow-hidden rounded-lg"
          {...(reduce
            ? fade
            : {
                initial: { clipPath: "inset(49.5% 0 49.5% 0)", filter: "brightness(3)" },
                animate: { clipPath: "inset(0% 0 0% 0)", filter: "brightness(1)" },
                transition: { duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] },
              })}
        >
          <Image
            src="/screens/higher-or-lower.webp"
            alt=""
            width={1200}
            height={560}
            priority
            sizes="(min-width: 1024px) 560px, 90vw"
            className="block h-auto w-full"
          />
        </motion.div>
        {/* TV stand */}
        <div className="mx-auto -mb-6 mt-2 h-3 w-24 rounded-b-lg" style={{ background: "var(--ink)" }} />
      </div>

      {/* Phone */}
      <motion.div
        className="absolute bottom-0 right-0 w-[30%] min-w-[104px] max-w-[150px]"
        {...(reduce
          ? fade
          : {
              initial: { y: 60, opacity: 0, rotate: 0 },
              animate: { y: 0, opacity: 1, rotate: 6 },
              transition: { type: "spring", stiffness: 420, damping: 22, delay: 0.75 },
            })}
      >
        <div
          className="flex aspect-[9/17] flex-col items-center justify-center gap-2 rounded-[1.4rem] border-[4px] p-3"
          style={{ background: "var(--stage-bg)", borderColor: "var(--ink)", boxShadow: "6px 6px 0 rgba(0,0,0,0.55)" }}
        >
          <span className="font-score text-[0.75rem] uppercase tracking-[0.15em]" style={{ color: "var(--cream)" }}>
            Your vote
          </span>
          <span className="btn-rough w-full py-1.5 text-center text-sm" style={{ background: "var(--teal)" }}>
            Higher
          </span>
          <span className="btn-rough w-full py-1.5 text-center text-sm" style={{ background: "var(--coral)" }}>
            Lower
          </span>
        </div>
      </motion.div>

      {/* Mascot peeking from behind the TV: the page's one ambient loop */}
      <motion.div
        className="absolute -left-3 bottom-4 sm:-left-8"
        {...(reduce
          ? fade
          : {
              initial: { scale: 0, rotate: -20 },
              animate: { scale: 1, rotate: 0 },
              transition: { type: "spring", stiffness: 600, damping: 18, delay: 1.05 },
            })}
      >
        <div className="anim-hero-bounce">
          <Mascot avatarId="party" size={72} expression="winner" animate={false} />
        </div>
      </motion.div>
    </div>
  );
}

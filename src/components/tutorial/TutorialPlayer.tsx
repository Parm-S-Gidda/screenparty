"use client";

// Plays a game's how-to-play tutorial on the big screen: one pre-recorded
// voice line per step (public/tutorials), captions in the host's speech
// bubble, and a live demo scene drawn with the real game props underneath.
// Advances itself when each clip ends; the room owner can skip at any time.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaptionBar } from "@/components/game/CaptionBar";
import { duckMusic } from "@/lib/sfx";
import { tutorialClipUrl, type TutorialHostMode, type TutorialSettings, type TutorialStep } from "@/lib/tutorials";
import type { SceneProps } from "./demo";
import { NumTutorialScene } from "./NumTutorialScenes";
import { TriviaTutorialScene } from "./TriviaTutorialScenes";
import { TtalTutorialScene } from "./TtalTutorialScenes";
import { WyrTutorialScene } from "./WyrTutorialScenes";
import { MltTutorialScene } from "./MltTutorialScenes";
import { HolTutorialScene } from "./HolTutorialScenes";
import { GtpTutorialScene } from "./GtpTutorialScenes";
import { TankTutorialScene } from "./TankTutorialScenes";
import { CharadesTutorialScene } from "./CharadesTutorialScenes";

const SCENES: Record<string, React.ComponentType<SceneProps>> = {
  num: NumTutorialScene,
  buzz_trivia: TriviaTutorialScene,
  ttal: TtalTutorialScene,
  wyr: WyrTutorialScene,
  mlt: MltTutorialScene,
  hol: HolTutorialScene,
  gtp: GtpTutorialScene,
  tank: TankTutorialScene,
  charades: CharadesTutorialScene,
};

export function TutorialPlayer({
  gameType,
  hostMode,
  steps,
  settings = {},
  onDone,
}: {
  gameType: string;
  hostMode: TutorialHostMode;
  steps: TutorialStep[];
  settings?: TutorialSettings;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const skipLine = useRef<(() => void) | null>(null);
  // latest onDone without restarting the clip effect when the parent re-renders
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });
  const Scene = SCENES[gameType];
  const step = steps[i];

  useEffect(() => {
    duckMusic(true);
    return () => duckMusic(false);
  }, []);

  useEffect(() => {
    if (!step) {
      doneRef.current();
      return;
    }
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const audio = new Audio(tutorialClipUrl(gameType, hostMode, step.id));
    const next = () => {
      if (settled) return;
      settled = true;
      audio.pause();
      clearTimeout(timer);
      // a short beat between lines so the demo animation lands
      timer = setTimeout(() => setI((n) => n + 1), 450);
    };
    // missing clip or blocked autoplay: hold the caption for a reading-speed beat
    const fallback = () => {
      clearTimeout(timer);
      timer = setTimeout(next, Math.min(Math.max(step.line.length * 60, 2500), 10000));
    };
    skipLine.current = next;
    audio.onended = next;
    audio.onerror = fallback;
    audio.play().catch(fallback);
    return () => {
      settled = true;
      audio.pause();
      clearTimeout(timer);
    };
  }, [i, step, gameType, hostMode]);

  if (!step) return null;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex w-full max-w-4xl items-center justify-between gap-4">
        <div className="flex items-center gap-2" aria-label={`Step ${i + 1} of ${steps.length}`}>
          <span className="font-score text-xs uppercase tracking-[0.2em]" style={{ color: "var(--cream-muted)" }}>
            how to play
          </span>
          <span className="flex gap-1.5" aria-hidden>
            {steps.map((_, n) => (
              <span
                key={n}
                className="h-2.5 rounded-full border-2 transition-all duration-300"
                style={{ width: n === i ? 28 : 10, borderColor: "var(--ink)", background: n <= i ? "var(--mustard)" : "var(--ink-soft)" }}
              />
            ))}
          </span>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="font-score min-h-11 rounded-lg border-2 px-4 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-[var(--ink-soft)] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--mustard)]"
          style={{ borderColor: "var(--cream-muted)", color: "var(--cream)" }}
        >
          Skip tutorial
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          className="flex min-h-[22rem] w-full flex-col items-center justify-center"
        >
          {Scene && <Scene scene={step.scene} hostMode={hostMode} settings={settings} />}
        </motion.div>
      </AnimatePresence>

      <CaptionBar caption={step.line} onSkip={() => skipLine.current?.()} label={hostMode === "virtual" ? "the host" : "the announcer"} />
    </div>
  );
}

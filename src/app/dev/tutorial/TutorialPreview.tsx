"use client";

import { useState } from "react";
import { MotionConfig } from "framer-motion";
import { TutorialPlayer } from "@/components/tutorial/TutorialPlayer";
import { getTutorial, type TutorialHostMode, type TutorialSettings } from "@/lib/tutorials";

export function TutorialPreview({ gameType, hostMode, settings }: { gameType: string; hostMode: TutorialHostMode; settings: TutorialSettings }) {
  // starts on a click so the browser lets the voice clips play
  const [run, setRun] = useState(0);
  const steps = getTutorial(gameType, hostMode, settings);
  return (
    <MotionConfig reducedMotion="user">
      <main className="stage stage-backdrop flex min-h-screen flex-col items-center justify-center p-5 pb-40 md:p-7 md:pb-40">
        {!steps ? (
          <p className="font-hand text-2xl">No tutorial for “{gameType}” yet.</p>
        ) : run ? (
          <TutorialPlayer key={run} gameType={gameType} hostMode={hostMode} steps={steps} settings={settings} onDone={() => setRun(0)} />
        ) : (
          <button type="button" className="btn-rough px-10 py-4 text-3xl" onClick={() => setRun(Date.now())}>
            Play {hostMode === "virtual" ? "AI host" : "player host"} tutorial
          </button>
        )}
      </main>
    </MotionConfig>
  );
}

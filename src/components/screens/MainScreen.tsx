"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useRoomState } from "@/hooks/useRoomState";
import { useVirtualHostDriver } from "@/hooks/useVirtualHostDriver";
import { CaptionBar } from "@/components/game/CaptionBar";
import { sendAction } from "@/lib/gameClient";
import { Scoreboard, finalPlayersAndScores, rankPlayers } from "@/components/game/Scoreboard";
import { Podium } from "@/components/game/Podium";
import { Confetti } from "@/components/game/Confetti";
import {
  TtalCollectingView,
  TtalRevealView,
  TtalVotingView,
} from "@/components/screens/TtalMainViews";
import { WyrChoosingView, WyrRevealView } from "@/components/screens/WyrViews";
import { MltRevealView, MltVotingView } from "@/components/screens/MltViews";
import { HolRevealView, HolVotingView } from "@/components/screens/HolViews";
import { GtpAnsweringView, GtpGuessingView, GtpRevealView } from "@/components/screens/GtpViews";
import { TankInvestingView, TankPitchingView, TankRevealView } from "@/components/screens/TankViews";
import { CharadesActingView, CharadesRevealView } from "@/components/screens/CharadesViews";
import { NumGuessingView, NumRevealView, NumSubmittingView } from "@/components/screens/NumViews";
import { TEAM_META, TeamTotalsBar } from "@/components/game/TeamTotals";
import { Panel, RoundBanner, TapedLabel } from "@/components/cartoon/Panel";
import { StampPop } from "@/components/cartoon/Stamp";
import { RoughButton } from "@/components/cartoon/RoughButton";
import { Mascot, type MascotExpression } from "@/components/cartoon/Mascot";
import { PlayerStand } from "@/components/cartoon/PlayerStand";
import { TimerProp } from "@/components/cartoon/TimerProp";
import {
  Burst,
  DoodleStar,
  ScribbleUnderline,
  SpotRays,
  StarField,
} from "@/components/cartoon/Doodles";
import { cn } from "@/lib/utils";
import {
  duckMusic,
  getMusicVolume,
  playSfx,
  preloadSfx,
  setMusicVolume,
  startMusic,
  startTicking,
  stopMusic,
  stopTicking,
} from "@/lib/sfx";
import type { GameAction, RoomStateResponse } from "@/lib/game/types";

const GAME_TITLES: Record<string, string> = {
  buzz_trivia: "Fact Frenzy",
  ttal: "Two Truths & a Lie",
  wyr: "Would You Rather",
  mlt: "Most Likely To",
  hol: "Higher or Lower",
  gtp: "Guess the Player",
  tank: "Shark Tank",
  charades: "Charades",
  num: "Number Rating",
};

export function MainScreen({ code, isOwner }: { code: string; isOwner: boolean }) {
  const { state, gone } = useRoomState(code);
  const [actionError, setActionError] = useState<string | null>(null);
  const isVirtual = state?.session?.hostMode === "virtual";
  const { caption, skip } = useVirtualHostDriver(code, state, isOwner && isVirtual);

  const act = useCallback(
    async (action: GameAction) => {
      setActionError(null);
      try {
        await sendAction(code, action);
      } catch (err) {
        setActionError((err as Error).message);
      }
    },
    [code]
  );

  // Self-hosted trivia paces itself between questions: after the answer is
  // revealed, this screen automatically shows the scoreboard and then returns
  // to "waiting for host", no taps needed (the server still validates each
  // step). Deps are logical state only, so realtime refetches don't reset the
  // timers. Virtual mode is driven by useVirtualHostDriver instead.
  const sessState = state?.session?.state;
  const sessQ = state?.session?.questionIndex ?? -1;
  const sessGame = state?.session?.gameType;
  const sessHostMode = state?.session?.hostMode;
  useEffect(() => {
    if (!isOwner || sessGame !== "buzz_trivia" || sessHostMode !== "self") return;
    let delay: number;
    let action: GameAction;
    if (sessState === "SHOW_ANSWER") {
      delay = 6000;
      action = { type: "SHOW_SCOREBOARD" };
    } else if (sessState === "SCOREBOARD") {
      delay = 4000;
      action = { type: "NEXT_QUESTION" };
    } else {
      return;
    }
    const timer = setTimeout(() => void act(action), delay);
    return () => clearTimeout(timer);
  }, [isOwner, sessState, sessQ, sessGame, sessHostMode, act]);

  // background music per phase, lobby track, in-game loop, end-screen track -
  // ducked under the AI host's voice
  const musicTrack: "lobby" | "game" | "end" | null = !sessState
    ? null
    : sessState === "LOBBY"
      ? "lobby"
      : sessState === "GAME_OVER"
        ? "end"
        : "game";
  useEffect(() => {
    if (!musicTrack) {
      stopMusic();
      return;
    }
    void startMusic(musicTrack);
    return () => stopMusic();
  }, [musicTrack]);
  useEffect(() => {
    duckMusic(Boolean(caption));
  }, [caption]);

  if (gone) {
    return (
      <Centered>
        <Panel tilt={-1} className="px-10 py-8 text-center">
          <h1 className="font-display text-4xl" style={{ color: "#221f30" }}>
            This room has expired
          </h1>
          <p className="font-hand mt-2 text-xl" style={{ color: "#5a5370" }}>
            Create a new game from your dashboard.
          </p>
        </Panel>
      </Centered>
    );
  }
  if (!state || !state.session) {
    return (
      <Centered>
        <p className="font-display animate-pulse text-3xl tracking-wide">Setting the stage…</p>
      </Centered>
    );
  }

  const { session } = state;
  const payload = session.payload;
  // remount + shake the stage when a new buzz lands
  const shakeKey =
    session.state === "PLAYER_BUZZED" && payload.buzz
      ? `buzz-${payload.buzz.playerId}-${payload.buzz.attempt}`
      : "steady";

  return (
    <MotionConfig reducedMotion="user">
      <main className="stage stage-backdrop relative flex min-h-screen flex-col overflow-hidden p-5 md:p-7">
        <SpotRays className="absolute left-0 top-0 h-full max-h-[100vh] w-[55vw]" />
        <SpotRays flip className="absolute right-0 top-0 h-full max-h-[100vh] w-[55vw]" />
        <StarField />

        <header className="relative z-10 flex items-start justify-between gap-4">
          <RoundBanner
            title={GAME_TITLES[session.gameType]}
            subtitle={
              session.state === "LOBBY"
                ? "the lobby"
                : session.state === "GAME_OVER"
                  ? "final results"
                  : session.state === "COLLECTING"
                    ? "writing time"
                    : `${session.gameType === "buzz_trivia" ? "question" : "round"} ${session.questionIndex + 1} of ${session.questionCount}`
            }
          />
          <div className="flex items-start gap-3">
            <TapedLabel tilt={1.5} color="#f5ecd4">
              <span className="font-score block text-[10px] uppercase tracking-[0.3em]" style={{ color: "#8a7f63" }}>
                room code
              </span>
              <span className="font-display text-3xl tracking-[0.25em]" style={{ color: "#221f30" }}>
                {state.room.code}
              </span>
            </TapedLabel>
            {isOwner && session.state !== "LOBBY" && session.state !== "GAME_OVER" && (
              <button
                onClick={() => act({ type: "END_GAME" })}
                className="font-score mt-1 rounded-lg border-2 border-[var(--cream)]/40 px-2 py-1 text-xs uppercase tracking-widest opacity-60 transition hover:opacity-100"
              >
                End game
              </button>
            )}
            {isOwner && session.state === "LOBBY" && (
              <Link
                href="/dashboard"
                className="font-score mt-1 rounded-lg border-2 border-[var(--cream)]/40 px-2 py-1 text-xs uppercase tracking-widest opacity-60 transition hover:opacity-100"
              >
                ← Dashboard
              </Link>
            )}
            {session.state === "GAME_OVER" && (
              <Link
                href={isOwner ? "/dashboard" : "/"}
                className="font-score mt-1 rounded-lg border-2 border-[var(--cream)]/40 px-2 py-1 text-xs uppercase tracking-widest opacity-60 transition hover:opacity-100"
              >
                {isOwner ? "← Dashboard" : "← Leave"}
              </Link>
            )}
          </div>
        </header>

        {actionError && (
          <p className="font-hand relative z-10 mt-2 text-center text-lg" style={{ color: "var(--coral)" }}>
            {actionError}
          </p>
        )}

        <div
          key={shakeKey}
          className={cn(
            "relative z-10 flex flex-1 flex-col items-center justify-center",
            // AI host: keep the stage clear of the fixed caption bubble at the
            // bottom so it never covers content (reserved even between lines
            // to avoid layout jumps). Two caption lines + tail ≈ 10rem.
            isVirtual && "pb-40",
            session.state === "PLAYER_BUZZED" && "anim-shake"
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={session.state}
              initial={{ opacity: 0, y: 18, rotate: -0.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.22 }}
              className="flex w-full max-w-5xl flex-col items-center"
            >
              <StateView state={state} isOwner={isOwner} act={act} />
            </motion.div>
          </AnimatePresence>
        </div>

        <CaptionBar caption={caption} onSkip={skip} />
        <MusicVolumeSlider />
      </main>
    </MotionConfig>
  );
}

// Corner control for the looping background music. Faint until hovered so it
// doesn't compete with the show; the level persists per browser.
function MusicVolumeSlider() {
  const [vol, setVol] = useState(() => getMusicVolume());
  return (
    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 opacity-40 transition hover:opacity-100">
      <span className="font-score text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream)" }}>
        music
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={vol}
        aria-label="Background music volume"
        onChange={(e) => {
          const v = Number(e.target.value);
          setVol(v);
          setMusicVolume(v);
        }}
        className="music-slider h-1.5 w-28 cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--mustard) ${vol * 100}%, rgba(245,236,212,.25) ${vol * 100}%)`,
        }}
      />
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="stage stage-backdrop flex min-h-screen flex-col items-center justify-center p-6 text-center">
      {children}
    </main>
  );
}

function StateView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (action: GameAction) => Promise<void>;
}) {
  const session = state.session!;
  switch (session.state) {
    case "LOBBY":
      return <LobbyView state={state} isOwner={isOwner} act={act} />;
    case "QUESTION_PREVIEW":
      return <PreviewView state={state} />;
    case "BUZZ_OPEN":
      return <BuzzOpenView state={state} isOwner={isOwner} act={act} />;
    case "PLAYER_BUZZED":
      return <BuzzedView state={state} />;
    case "SHOW_ANSWER":
      return <AnswerView state={state} />;
    case "COLLECTING":
      return <TtalCollectingView state={state} />;
    case "VOTING":
      return <TtalVotingView state={state} isOwner={isOwner} act={act} />;
    case "WYR_CHOOSING":
      return <WyrChoosingView state={state} isOwner={isOwner} act={act} />;
    // Most Likely To
    case "MLT_VOTING":
      return <MltVotingView state={state} isOwner={isOwner} act={act} />;
    // Higher or Lower
    case "HOL_VOTING":
      return <HolVotingView state={state} isOwner={isOwner} act={act} />;
    case "HOL_REVEAL":
      return <HolRevealView state={state} isOwner={isOwner} act={act} />;
    // Guess the Player
    case "GTP_ANSWERING":
      return <GtpAnsweringView state={state} />;
    case "GTP_GUESSING":
      return <GtpGuessingView state={state} isOwner={isOwner} act={act} />;
    // Shark Tank
    case "TANK_PITCHING":
      return <TankPitchingView state={state} isOwner={isOwner} act={act} />;
    case "TANK_INVESTING":
      return <TankInvestingView state={state} isOwner={isOwner} act={act} />;
    // Charades
    case "CHARADES_ACTING":
      return <CharadesActingView state={state} isOwner={isOwner} act={act} />;
    // Number Rating
    case "NUM_SUBMITTING":
      return <NumSubmittingView state={state} />;
    case "NUM_GUESSING":
      return <NumGuessingView state={state} isOwner={isOwner} act={act} />;
    case "REVEAL":
      if (session.gameType === "wyr") return <WyrRevealView state={state} isOwner={isOwner} act={act} />;
      if (session.gameType === "mlt") return <MltRevealView state={state} isOwner={isOwner} act={act} />;
      if (session.gameType === "gtp") return <GtpRevealView state={state} isOwner={isOwner} act={act} />;
      if (session.gameType === "tank") return <TankRevealView state={state} isOwner={isOwner} act={act} />;
      if (session.gameType === "charades") return <CharadesRevealView state={state} isOwner={isOwner} act={act} />;
      if (session.gameType === "num") return <NumRevealView state={state} isOwner={isOwner} act={act} />;
      return <TtalRevealView state={state} isOwner={isOwner} act={act} />;
    case "SCOREBOARD":
      return <ScoreboardView state={state} isOwner={isOwner} act={act} />;
    case "GAME_OVER":
      return <GameOverView state={state} isOwner={isOwner} />;
    default:
      return null;
  }
}

function GameOverActions({ isOwner }: { isOwner: boolean }) {
  return (
    <Link
      href={isOwner ? "/dashboard" : "/"}
      className="btn-rough inline-flex items-center px-8 py-3 text-xl"
      style={{ background: "var(--teal)", color: "var(--cream)" }}
    >
      {isOwner ? "Back to dashboard" : "Leave game"}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// LOBBY
// ---------------------------------------------------------------------------

function LobbyView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (action: GameAction) => Promise<void>;
}) {
  const session = state.session!;
  // trivia and TTAL self-host need a designated player-host; WYR is paced from here
  const needsHost =
    ["buzz_trivia", "ttal"].includes(session.gameType) &&
    session.hostMode === "self" &&
    !state.players.some((p) => p.isHost);
  const needMorePlayers = session.gameType !== "buzz_trivia" && state.players.length < 3;
  const joinUrl = typeof window !== "undefined" ? `${window.location.host}/join` : "/join";

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <Panel tape tilt={-0.6} className="px-10 py-6 text-center md:px-16">
        <p className="font-hand text-2xl" style={{ color: "#5a5370" }}>
          Grab your phone → <span style={{ color: "#221f30" }}>{joinUrl}</span>
        </p>
        <p className="font-display mt-1 text-7xl tracking-[0.18em] md:text-8xl" style={{ color: "#221f30" }}>
          {state.room.code}
        </p>
        <ScribbleUnderline className="mx-auto mt-1 w-2/3" />
        <DoodleStar size={26} className="absolute -left-3 -top-4 -rotate-12" />
        <DoodleStar size={20} color="#ee7c8e" className="absolute -bottom-3 -right-2 rotate-12" />
      </Panel>

      {session.settings.teamsEnabled ? (
        <div className="grid w-full max-w-4xl grid-cols-2 gap-6">
          {(["red", "blue"] as const).map((team) => (
            <div
              key={team}
              className="panel-paper panel-grain p-4"
              style={{
                background: team === "red" ? "#3d2126" : "#1e2c40",
                borderColor: team === "red" ? "#e2493b" : "#5aa9e6",
              }}
            >
              <p
                className="font-display mb-3 text-center text-2xl uppercase tracking-wider"
                style={{ color: team === "red" ? "#e2493b" : "#5aa9e6" }}
              >
                {TEAM_META[team].name}
              </p>
              <div className="flex min-h-28 flex-wrap items-end justify-center gap-4">
                <AnimatePresence>
                  {state.players
                    .filter((p) => p.team === team)
                    .map((player, i) => (
                      <LobbyPlayerCard key={player.id} player={player} state={state} isOwner={isOwner} act={act} tilt={i % 2 ? 1.5 : -1.5} />
                    ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-32 w-full flex-wrap items-end justify-center gap-5">
          <AnimatePresence>
            {state.players.map((player, i) => (
              <LobbyPlayerCard key={player.id} player={player} state={state} isOwner={isOwner} act={act} tilt={i % 2 ? 1.2 : -1.2} />
            ))}
          </AnimatePresence>
          {state.players.length === 0 && (
            <p className="font-hand animate-pulse self-center text-2xl" style={{ color: "var(--muted-foreground)" }}>
              Waiting for contestants…
            </p>
          )}
        </div>
      )}

      {isOwner && (
        <div className="flex flex-col items-center gap-3">
          <RoughButton
            className="px-12 py-4 text-3xl"
            disabled={state.players.length === 0 || needsHost || needMorePlayers}
            onClick={() => act({ type: "START_GAME" })}
          >
            Start the show!
          </RoughButton>
          {needsHost && state.players.length > 0 && (
            <p className="font-hand text-lg" style={{ color: "var(--muted-foreground)" }}>
              Hover a player and tap “host” -{" "}
              {session.gameType === "ttal"
                ? "they’ll play along and pace the rounds from their phone."
                : "they’ll run the game from their phone."}
            </p>
          )}
          {needMorePlayers && state.players.length > 0 && (
            <p className="font-hand text-lg" style={{ color: "var(--muted-foreground)" }}>
              This game needs at least 3 players!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function LobbyPlayerCard({
  player,
  state,
  isOwner,
  act,
  tilt = 0,
}: {
  player: RoomStateResponse["players"][number];
  state: RoomStateResponse;
  isOwner: boolean;
  act: (action: GameAction) => Promise<void>;
  tilt?: number;
}) {
  const session = state.session!;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.4, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.4 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      className="group relative"
    >
      <PlayerStand
        avatarId={player.avatarId}
        name={player.username}
        expression="idle"
        tilt={tilt}
        team={player.team}
        highlight={player.isHost}
      >
        {player.isHost && (
          <span
            className="font-score absolute -right-3 -top-2 rotate-6 rounded-md border-2 border-[#221f30] px-1.5 py-0.5 text-[10px] uppercase tracking-widest"
            style={{ background: "var(--mustard)", color: "#221f30", boxShadow: "2px 2px 0 rgba(0,0,0,.4)" }}
          >
            Host
          </span>
        )}
      </PlayerStand>
      {isOwner && (
        <div className="absolute -top-6 left-1/2 flex -translate-x-1/2 gap-1 opacity-0 transition group-hover:opacity-100">
          {["buzz_trivia", "ttal"].includes(session.gameType) && session.hostMode === "self" && !player.isHost && (
            <button
              onClick={() => act({ type: "SELECT_HOST", playerId: player.id })}
              className="font-score rounded border-2 border-[#221f30] bg-[var(--mustard)] px-1.5 py-0.5 text-[10px] uppercase text-[#221f30]"
            >
              host
            </button>
          )}
          {session.settings.teamsEnabled && player.team && (
            <button
              onClick={() =>
                act({ type: "SET_TEAM", playerId: player.id, team: player.team === "red" ? "blue" : "red" })
              }
              className="font-score rounded border-2 border-[#221f30] bg-[var(--paper)] px-1.5 py-0.5 text-[10px] uppercase text-[#221f30]"
            >
              ⇄
            </button>
          )}
          <button
            onClick={async () => {
              await fetch(`/api/rooms/${state.room.code}/kick`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ playerId: player.id }),
              });
            }}
            className="font-score rounded border-2 border-[#221f30] bg-[var(--tomato)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--cream)]"
          >
            kick
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// TRIVIA STATES
// ---------------------------------------------------------------------------

function ContestantsRail({ state }: { state: RoomStateResponse }) {
  const session = state.session!;
  const payload = session.payload;
  const scoreOf = new Map(state.scores.map((s) => [s.playerId, s.score]));

  const expressionFor = (playerId: string): MascotExpression => {
    if (payload.lastResult && payload.lastResult.playerId === playerId && session.state === "SHOW_ANSWER") {
      return payload.lastResult.correct ? "correct" : "incorrect";
    }
    if (payload.buzz?.playerId === playerId) return "buzzed";
    return "idle";
  };

  return (
    <div className="mt-8 flex w-full flex-wrap items-end justify-center gap-4 md:gap-6">
      {state.players.map((p, i) => (
        <PlayerStand
          key={p.id}
          avatarId={p.avatarId}
          name={p.username}
          score={scoreOf.get(p.id) ?? 0}
          expression={expressionFor(p.id)}
          size={64}
          tilt={i % 2 ? 1 : -1}
          team={p.team}
          highlight={payload.buzz?.playerId === p.id && session.state === "PLAYER_BUZZED"}
        />
      ))}
    </div>
  );
}

function QuestionBoard({
  text,
  label,
  small = false,
}: {
  text: string;
  label: string;
  small?: boolean;
}) {
  return (
    <div className="relative w-full max-w-4xl">
      <TapedLabel
        tilt={-2}
        color="var(--mustard)"
        className="absolute -top-5 left-8 z-10"
      >
        <span className="font-display text-lg uppercase tracking-wider" style={{ color: "#221f30" }}>
          {label}
        </span>
      </TapedLabel>
      <Panel tape tilt={-0.4} className={cn("px-8 pb-8 pt-10 text-center md:px-14", small && "pb-6 pt-8")}>
        <h2
          className={cn(
            "font-display text-balance leading-tight",
            small ? "text-3xl md:text-4xl" : "text-4xl md:text-6xl"
          )}
          style={{ color: "#221f30" }}
        >
          {text}
        </h2>
        <DoodleStar size={22} className="absolute -left-2 top-6 -rotate-12 opacity-80" color="#2fa8a0" />
        <DoodleStar size={18} className="absolute -right-2 bottom-5 rotate-12 opacity-80" color="#ee7c8e" />
      </Panel>
    </div>
  );
}

function PreviewView({ state }: { state: RoomStateResponse }) {
  const session = state.session!;
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="anim-wobble">
        <TapedLabel tilt={0} color="var(--cream)" className="px-8 py-4">
          <span className="font-display text-4xl" style={{ color: "#221f30" }}>
            Question {session.questionIndex + 1} of {session.questionCount}
          </span>
        </TapedLabel>
      </div>
      <p className="font-hand animate-pulse text-2xl" style={{ color: "var(--muted-foreground)" }}>
        {session.hostMode === "virtual" ? "Your host is clearing their throat…" : "Waiting for the host…"}
      </p>
      <ContestantsRail state={state} />
    </div>
  );
}

function BuzzOpenView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (action: GameAction) => Promise<void>;
}) {
  const session = state.session!;
  const payload = session.payload;
  const { autoSkip, autoSkipSeconds } = session.settings;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const skipFired = useRef(false);

  useEffect(() => {
    if (!autoSkip || !payload.buzzOpenedAt) return;
    skipFired.current = false;
    const deadline = new Date(payload.buzzOpenedAt).getTime() + autoSkipSeconds * 1000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      // the owner's screen is the timekeeper; server validates state anyway
      if (left === 0 && isOwner && !skipFired.current) {
        skipFired.current = true;
        void act({ type: "SKIP_QUESTION" });
      }
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [autoSkip, autoSkipSeconds, payload.buzzOpenedAt, isOwner, act]);

  // clock ticks once a second for the whole buzz window and stop the instant
  // the timer ends (or someone buzzes and this view unmounts)
  const ticking = secondsLeft !== null && secondsLeft > 0;
  useEffect(() => {
    if (!ticking) {
      stopTicking();
      return;
    }
    void startTicking();
    return () => stopTicking();
  }, [ticking]);

  const wrongResult = payload.lastResult && !payload.lastResult.correct;
  const wrongPlayer = wrongResult
    ? state.players.find((p) => p.id === payload.lastResult!.playerId)
    : null;

  // question-revealed sting on a fresh question (not on steal reopens, which
  // get the wrong-answer pop instead)
  const freshQuestion = !payload.lastResult;
  useEffect(() => {
    if (freshQuestion) playSfx("question");
    preloadSfx("tick"); // decoded before the countdown needs it
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only sting
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="relative w-full max-w-4xl">
        <QuestionBoard text={payload.question?.text ?? ""} label={`Question ${session.questionIndex + 1}`} />
        {autoSkip && secondsLeft !== null && (
          <div className="absolute -right-4 -top-10 rotate-6 md:-right-10">
            <TimerProp seconds={secondsLeft} size={92} />
          </div>
        )}
      </div>

      {wrongPlayer && (
        <StampPop key={payload.lastResult!.at} color="red" sfx="wrong">
          Wrong!
        </StampPop>
      )}

      <motion.div
        animate={{ scale: [1, 1.07, 1], rotate: [-1, 1, -1] }}
        transition={{ repeat: Infinity, duration: 1.1 }}
        className="text-center"
      >
        <p className="font-display text-4xl uppercase tracking-wider md:text-5xl" style={{ color: "var(--mustard)" }}>
          Buzz in now!
        </p>
        <ScribbleUnderline className="mx-auto w-52" color="#f0b429" />
      </motion.div>

      <ContestantsRail state={state} />
    </div>
  );
}

function BuzzedView({ state }: { state: RoomStateResponse }) {
  const session = state.session!;
  const payload = session.payload;
  const buzzer = state.players.find((p) => p.id === payload.buzz?.playerId);
  // direct steal: the previous player just missed and the floor passed straight
  // to the next queued buzzer, pop the verdict instead of a new buzz flash
  const directSteal = Boolean(
    (payload.buzz?.attempt ?? 1) > 1 &&
      payload.lastResult &&
      !payload.lastResult.correct &&
      (!payload.buzzOpenedAt || payload.buzzOpenedAt < payload.lastResult.at)
  );
  const bannerDelay = directSteal ? 2.6 : 1.7;

  if (!buzzer) return null;

  return (
    <div className="relative flex w-full flex-col items-center gap-6">
      <div className="w-full max-w-4xl">
        <QuestionBoard text={payload.question?.text ?? ""} label={`Question ${session.questionIndex + 1}`} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: bannerDelay }}
      >
        <Panel tilt={-1} className="flex items-center gap-4 px-6 py-3">
          <motion.div
            animate={{ rotate: [-4, 4, -4] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
          >
            <Mascot avatarId={buzzer.avatarId} expression="buzzed" size={60} />
          </motion.div>
          <div className="text-left">
            <p
              className={cn(
                "font-display uppercase leading-none",
                buzzer.username.length > 10 ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"
              )}
              style={{ color: "#221f30" }}
            >
              {directSteal ? `${buzzer.username}'s turn!` : `${buzzer.username} buzzed in!`}
            </p>
            <p className="font-hand animate-pulse text-xl leading-tight" style={{ color: "#8a2f24" }}>
              {session.hostMode === "virtual"
                ? "waiting on their answer…"
                : "answer out loud!"}
            </p>
            <p className="font-score text-[10px] uppercase tracking-[0.25em]" style={{ color: "#5a5370" }}>
              {ordinal(payload.buzz?.buzzOrder ?? 1)} to buzz
              {payload.buzz && payload.buzz.attempt > 1 && ` · attempt ${payload.buzz.attempt}`}
            </p>
          </div>
        </Panel>
      </motion.div>

      <ContestantsRail state={state} />

      {directSteal ? (
        <StampPop color="red" sfx="wrong">
          Wrong!
        </StampPop>
      ) : (
        <StampPop color="mustard" holdMs={1400} sfx="buzz" subtitle={buzzer.username}>
          Buzz!
        </StampPop>
      )}
    </div>
  );
}

function AnswerView({ state }: { state: RoomStateResponse }) {
  const session = state.session!;
  const payload = session.payload;
  const result = payload.lastResult;
  const resultPlayer = result ? state.players.find((p) => p.id === result.playerId) : null;
  // the answer reveal waits for the verdict pop (hold + exit) to clear first
  const hasVerdictPop = payload.skipped || Boolean(resultPlayer && result);
  const revealDelay = hasVerdictPop ? 2.5 : 0.35;
  useEffect(() => {
    const timer = setTimeout(() => playSfx("reveal"), revealDelay * 1000);
    return () => clearTimeout(timer);
  }, [revealDelay]);

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="w-full max-w-3xl opacity-70">
        <QuestionBoard small text={payload.question?.text ?? ""} label={`Question ${session.questionIndex + 1}`} />
      </div>

      {/* verdict pops big, then clears out of the way of the answer reveal */}
      {payload.skipped ? (
        <StampPop color="mustard" sfx="timesup">
          Time&apos;s up!
        </StampPop>
      ) : (
        resultPlayer &&
        result && (
          <StampPop color={result.correct ? "green" : "red"} sfx={result.correct ? "correct" : "wrong"}>
            {result.correct ? "Correct!" : "Nope!"}
          </StampPop>
        )
      )}
      {resultPlayer && result && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: revealDelay }}
          className="font-hand text-2xl"
          style={{ color: result.correct ? "#a9d18e" : "var(--coral)" }}
        >
          {result.points > 0 ? `+${result.points} points` : `${result.points} points`}
        </motion.p>
      )}

      {/* answer reveal */}
      <motion.div
        initial={{ y: 26, opacity: 0, rotate: 2 }}
        animate={{ y: 0, opacity: 1, rotate: 0.8 }}
        transition={{ delay: revealDelay, type: "spring", stiffness: 300, damping: 18 }}
        className="relative"
      >
        <TapedLabel tilt={0.8} color="#dff0d0" className="px-8 py-4">
          <span className="font-score block text-xs uppercase tracking-[0.3em]" style={{ color: "#3e8e2f" }}>
            the answer
          </span>
          <span className="font-display text-4xl md:text-5xl" style={{ color: "#221f30" }}>
            {payload.answer?.text}
          </span>
        </TapedLabel>
      </motion.div>

      <ContestantsRail state={state} />
    </div>
  );
}

function ScoreboardView({
  state,
  isOwner,
  act,
}: {
  state: RoomStateResponse;
  isOwner: boolean;
  act: (action: GameAction) => Promise<void>;
}) {
  const session = state.session!;
  // TTAL/WYR self mode is paced from the main screen, unless a TTAL
  // player-host was selected, whose phone carries the controls instead
  const ttalPlayerHost = session.gameType === "ttal" && state.players.some((p) => p.isHost);
  const showNext =
    session.gameType !== "buzz_trivia" && isOwner && session.hostMode === "self" && !ttalPlayerHost;
  useEffect(() => {
    playSfx("whoosh");
  }, []);
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4">
      <div className="relative">
        <h2 className="font-display text-5xl uppercase tracking-wide">Scoreboard</h2>
        <ScribbleUnderline className="w-full" color="#2fa8a0" />
      </div>
      {session.settings.teamsEnabled && <TeamTotalsBar players={state.players} scores={state.scores} />}
      <Scoreboard players={state.players} scores={state.scores} />
      {showNext && (
        <RoughButton className="mt-2 px-8 py-3 text-2xl" onClick={() => act({ type: "NEXT_ROUND" })}>
          Next round!
        </RoughButton>
      )}
    </div>
  );
}

function GameOverView({ state, isOwner }: { state: RoomStateResponse; isOwner: boolean }) {
  const payload = state.session!.payload;
  const podium = payload.podium ?? [];
  const teamResult = payload.teamResult;
  // results come from the frozen standings, not the live room, leavers stay
  const { players, scores } = finalPlayersAndScores(state);
  const winners = podium.find((e) => e.place === 1);
  const winnerNames = winners
    ? winners.playerIds
        .map((id) => players.find((p) => p.id === id)?.username)
        .filter(Boolean)
        .join(" & ")
    : null;
  const ranked = rankPlayers(players, scores);

  if (teamResult) {
    const winnerTeam = teamResult.winner;
    return (
      <div className="flex w-full flex-col items-center gap-7">
        <Confetti />
        <Burst color={winnerTeam === "tie" ? "var(--teal)" : winnerTeam === "red" ? "#e2493b" : "#5aa9e6"} className="min-w-80">
          <p className="font-display text-4xl uppercase leading-tight md:text-5xl" style={{ color: "#221f30" }}>
            {winnerTeam === "tie" ? "Dead heat!" : `${TEAM_META[winnerTeam].name} wins!`}
          </p>
        </Burst>
        <div className="flex items-end gap-8">
          {(["red", "blue"] as const).map((team) => (
            <div
              key={team}
              className="panel-paper panel-grain flex w-64 flex-col items-center gap-3 p-6"
              style={{
                background: team === "red" ? "#e2493b" : "#5aa9e6",
                transform: `rotate(${team === "red" ? -1.5 : 1.5}deg)`,
                outline: winnerTeam === team ? "5px solid var(--mustard)" : undefined,
                outlineOffset: 4,
              }}
            >
              <p className="font-display text-2xl uppercase" style={{ color: "#f5ecd4" }}>
                {TEAM_META[team].name}
              </p>
              <p className="font-score text-6xl tabular-nums" style={{ color: "#221f30" }}>
                {teamResult.totals[team]}
              </p>
              <div className="flex flex-wrap justify-center gap-1">
                {players
                  .filter((p) => p.team === team)
                  .map((p) => (
                    <Mascot
                      key={p.id}
                      avatarId={p.avatarId}
                      expression={winnerTeam === team ? "winner" : "incorrect"}
                      size={44}
                      animate={false}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
        <div className="w-full max-w-md">
          <p className="font-score mb-2 text-center text-xs uppercase tracking-[0.3em]" style={{ color: "var(--muted-foreground)" }}>
            top scorers
          </p>
          <Scoreboard players={players} scores={scores} compact />
        </div>
        <GameOverActions isOwner={isOwner} />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <Confetti />
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 15 }}
        className="my-4 text-center"
      >
        {winnerNames && (
          <p className="font-hand text-2xl" style={{ color: "var(--mustard)" }}>
            {winners!.playerIds.length > 1 ? "it's a dead heat!" : "the winner is…"}
          </p>
        )}
        <h2
          className={cn(
            "font-display uppercase leading-tight",
            (winnerNames?.length ?? 0) > 12 ? "text-4xl md:text-6xl" : "text-6xl md:text-8xl"
          )}
          style={{ color: "var(--cream)", textShadow: "4px 4px 0 #221f30" }}
        >
          {winnerNames ?? "Game over!"}
        </h2>
        {winnerNames && (
          <p className="font-display text-2xl uppercase md:text-3xl" style={{ color: "var(--mustard)" }}>
            {winners!.playerIds.length > 1 ? "tie for the win!" : "takes the crown!"}
          </p>
        )}
        <ScribbleUnderline className="mx-auto w-64" color="#f0b429" />
      </motion.div>
      <Podium podium={podium} players={players} />
      {ranked.length > 3 && (
        <div className="w-full max-w-md">
          <Scoreboard players={players} scores={scores} compact />
        </div>
      )}
      <GameOverActions isOwner={isOwner} />
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

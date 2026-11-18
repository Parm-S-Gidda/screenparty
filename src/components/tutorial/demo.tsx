"use client";

// Shared kit for tutorial demos. Scenes build a fake RoomStateResponse and
// render the game's REAL screens with it (StateView for the big screen,
// PlayerGameView inside a drawn phone), so a UI change to a game shows up in
// its tutorial for free. Everything is inert: a picture of the game, never a
// working control.

import { useState } from "react";
import { motion } from "framer-motion";
import { Mascot } from "@/components/cartoon/Mascot";
import { StateView } from "@/components/screens/MainScreen";
import { PlayerGameView } from "@/components/screens/PlayerScreen";
import type { GameType, PublicPayload, RoomStateResponse, SessionState, TeamId } from "@/lib/game/types";
import type { TutorialHostMode, TutorialSettings } from "@/lib/tutorials";

export type DemoPlayer = { id: string; username: string; avatarId: string; team?: TeamId | null; isHost?: boolean };

/** The same four friends star in every tutorial. */
export const CAST: DemoPlayer[] = [
  { id: "sam", username: "Sam", avatarId: "detective" },
  { id: "priya", username: "Priya", avatarId: "chef" },
  { id: "marcus", username: "Marcus", avatarId: "pirate" },
  { id: "jules", username: "Jules", avatarId: "wizard" },
];

export const pop = { type: "spring", stiffness: 420, damping: 26 } as const;
export const cheer = { type: "spring", stiffness: 600, damping: 18 } as const;

const noop = async () => {};
const now = () => new Date().toISOString();

type Me = NonNullable<RoomStateResponse["me"]>;

export function demoState(opts: {
  gameType: GameType;
  hostMode: TutorialHostMode;
  state: SessionState;
  payload?: PublicPayload;
  players?: DemoPlayer[];
  scores?: Record<string, number>;
  settings?: TutorialSettings & { autoSkipSeconds?: number };
  currentPlayerId?: string | null;
  questionIndex?: number;
  questionCount?: number;
  progress?: Partial<Pick<RoomStateResponse, "buzzes" | "ttal" | "wyr" | "mlt" | "hol" | "gtp" | "tank" | "num">>;
}): RoomStateResponse {
  const players = opts.players ?? CAST;
  return {
    room: { id: "demo", code: "DEMO", status: "in_game", expiresAt: now() },
    players: players.map((p) => ({ id: p.id, username: p.username, avatarId: p.avatarId, isHost: !!p.isHost, team: p.team ?? null })),
    session: {
      id: "demo",
      gameType: opts.gameType,
      state: opts.state,
      hostMode: opts.hostMode,
      questionIndex: opts.questionIndex ?? 0,
      questionCount: opts.questionCount ?? 10,
      currentPlayerId: opts.currentPlayerId ?? null,
      payload: opts.payload ?? {},
      settings: {
        // no ticking clocks under the voice; scenes opt in when they need one
        autoSkip: false,
        autoSkipSeconds: opts.settings?.autoSkipSeconds ?? 30,
        retriesEnabled: !!opts.settings?.retriesEnabled,
        maxRetries: 3,
        questionCount: opts.questionCount ?? 10,
        variation: opts.settings?.variation as "two_truths" | "two_lies" | undefined,
        rounds: 3,
        teamsEnabled: !!opts.settings?.teamsEnabled,
        tankPitchSeconds: 60,
        collectingSeconds: 90,
        tutorial: true,
      },
    },
    scores: players.map((p) => ({ playerId: p.id, score: opts.scores?.[p.id] ?? 0 })),
    buzzes: [],
    ttal: null,
    wyr: null,
    mlt: null,
    hol: null,
    gtp: null,
    tank: null,
    charades: null,
    num: null,
    me: null,
    ...opts.progress,
  };
}

// Scenes stamp their fake round "opened" times when the module loads; restart
// those clocks when the scene appears so its timer line starts full.
function withFreshClocks(state: RoomStateResponse, at: string): RoomStateResponse {
  if (!state.session) return state;
  const stamp = (o: object) =>
    Object.fromEntries(
      Object.entries(o).map(([k, v]) => [k, typeof v === "string" && /(openedAt|OpenedAt|Start)$/.test(k) ? at : v]),
    );
  const payload = Object.fromEntries(
    Object.entries(stamp(state.session.payload)).map(([k, v]) => [k, v && typeof v === "object" && !Array.isArray(v) ? stamp(v) : v]),
  );
  return { ...state, session: { ...state.session, payload } };
}

/** The big screen, exactly as the game draws it. `owner` shows the room owner's buttons. */
export function DemoScreen({ state, owner = false }: { state: RoomStateResponse; owner?: boolean }) {
  const [mountedAt] = useState(now);
  return (
    <div inert className="pointer-events-none flex w-full justify-center">
      <StateView state={withFreshClocks(state, mountedAt)} isOwner={owner} act={noop} onStart={() => {}} />
    </div>
  );
}

/** One player's phone, exactly as the game draws it, shrunk into a drawn handset. */
export function DemoPhone({
  state,
  playerId,
  me,
  tilt = 0,
  delay = 0,
  extra,
}: {
  state: RoomStateResponse;
  playerId: string;
  me?: Partial<Me>;
  tilt?: number;
  delay?: number;
  /** drawn under the game view, like the player-host's controls */
  extra?: React.ReactNode;
}) {
  const p = state.players.find((pl) => pl.id === playerId)!;
  const withMe: RoomStateResponse = { ...state, me: { playerId, isHost: p.isHost, kicked: false, buzzOrder: null, ...me } };
  return (
    <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1, rotate: tilt }} transition={{ ...pop, delay }}>
      <Phone owner={p}>
        <div inert className="pointer-events-none w-[340px] px-4 py-6 text-center" style={{ zoom: 0.72 }}>
          <div className="flex flex-col items-center gap-4">
            <PlayerGameView code="DEMO" state={withMe} player={{ playerId, token: "demo", roomCode: "DEMO", username: p.username, avatarId: p.avatarId }} />
            {extra}
          </div>
        </div>
      </Phone>
    </motion.div>
  );
}

/** A phone controller, drawn: ink body, the owner's mascot on top. */
export function Phone({
  owner,
  children,
  className = "min-h-60 w-[15.5rem]",
}: {
  owner: { avatarId: string; username: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Mascot avatarId={owner.avatarId} size={56} animate={false} />
      <div
        className={`flex flex-col items-center justify-center gap-2 overflow-hidden rounded-[1.6rem] border-[5px] ${className}`}
        style={{ borderColor: "var(--ink)", background: "#241d38", boxShadow: "6px 6px 0 rgba(0,0,0,0.5)" }}
      >
        {children}
      </div>
      <span className="font-hand text-lg" style={{ color: "var(--cream)" }}>{owner.username}</span>
    </div>
  );
}

export function Cast({ members, crown }: { members: { avatarId: string; username: string }[]; crown?: number }) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-6">
      {members.map((m, i) => (
        <motion.div key={m.username} initial={{ y: 30, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ ...pop, delay: i * 0.06 }} className="flex flex-col items-center gap-2">
          <Mascot avatarId={m.avatarId} size={88} expression={crown === i ? "winner" : "idle"} animate={i === 0} />
          <span className="nameplate font-display px-3 py-0.5 text-lg">{m.username}</span>
        </motion.div>
      ))}
    </div>
  );
}

/** Opening card: the game's name over the cast. */
export function TitleCard({ top, bottom, members = CAST }: { top: string; bottom: string; members?: DemoPlayer[] }) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <h2 className="font-display text-[clamp(3.5rem,9vw,6.5rem)] uppercase leading-[0.9]" style={{ color: "var(--mustard)" }}>
        {top}
        <span className="block" style={{ color: "var(--cream)" }}>{bottom}</span>
      </h2>
      <Cast members={members} />
    </div>
  );
}

/** Phones in a row, gently fanned. */
export function PhoneRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-end justify-center gap-6">{children}</div>;
}

export const fan = (i: number, n: number) => (n === 1 ? 0 : (i - (n - 1) / 2) * 3);

/** Closing card: the winner crowned over a two-line rule. */
export function Finale({ line, punch, crown = 1, members = CAST }: { line: string; punch: string; crown?: number; members?: DemoPlayer[] }) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <Cast members={members} crown={crown} />
      <p className="font-display text-4xl uppercase leading-tight md:text-5xl" style={{ color: "var(--cream)" }}>
        {line}
        <span className="block" style={{ color: "var(--mustard)" }}>{punch}</span>
      </p>
    </div>
  );
}

export type SceneProps = { scene: string; hostMode: TutorialHostMode; settings: TutorialSettings };

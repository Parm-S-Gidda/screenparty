"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, MotionConfig } from "framer-motion";
import { useRoomState } from "@/hooks/useRoomState";
import { sendAction } from "@/lib/gameClient";
import { clearPlayerSession, loadPlayerSession, type PlayerSession } from "@/lib/playerSession";
import { Scoreboard, finalPlayersAndScores, rankPlayers } from "@/components/game/Scoreboard";
import { Confetti } from "@/components/game/Confetti";
import { HostController } from "./HostController";
import {
  TtalHostControls,
  TtalRevealPanel,
  TtalStatementForm,
  TtalVotePanel,
} from "./TtalPlayerViews";
import { WyrChoosePanel, WyrRevealPanel } from "./WyrViews";
import { MltRevealPanel, MltVotePanel } from "./MltViews";
import { HolRevealPanel, HolVotePanel } from "./HolViews";
import { GtpAnswerForm, GtpGuessPanel, GtpRevealPanel } from "./GtpViews";
import { TankInvestPhone, TankPitchPhone, TankRevealPhone } from "./TankViews";
import { CharadesActPhone, CharadesGuessPhone, CharadesRevealPhone } from "./CharadesViews";
import { NumGuessPhone, NumRevealPhone, NumSubmitPhone } from "./NumViews";
import { Mascot } from "@/components/cartoon/Mascot";
import { Panel, TapedLabel } from "@/components/cartoon/Panel";
import { Stamp } from "@/components/cartoon/Stamp";
import { RoughButton } from "@/components/cartoon/RoughButton";
import { DoodleStar, ScribbleUnderline, SpotRays, StarField } from "@/components/cartoon/Doodles";
import type { RoomStateResponse } from "@/lib/game/types";

export function PlayerScreen({ code }: { code: string }) {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerSession | null | undefined>(undefined);

  useEffect(() => {
    const session = loadPlayerSession(code);
    setPlayer(session);
    if (!session) router.replace(`/join?code=${encodeURIComponent(code)}`);
  }, [code, router]);

  if (player === undefined) return <PhoneShell>Loading…</PhoneShell>;
  if (player === null) return <PhoneShell>Sending you to the join page…</PhoneShell>;
  return <PlayerScreenInner code={code} player={player} />;
}

function PlayerScreenInner({ code, player }: { code: string; player: PlayerSession }) {
  const router = useRouter();
  const { state, gone } = useRoomState(code, player.token);

  async function leave() {
    try {
      await fetch(`/api/rooms/${code}/leave`, {
        method: "POST",
        headers: { "x-player-token": player.token },
      });
    } finally {
      clearPlayerSession();
      router.push("/");
    }
  }

  if (gone) {
    return (
      <PhoneShell>
        <p className="font-display text-3xl">This room is gone</p>
        <p className="font-hand mt-2 text-xl opacity-70">The game ended or the room expired.</p>
        <RoughButton className="mt-6" onClick={() => { clearPlayerSession(); router.push("/"); }}>
          Back to home
        </RoughButton>
      </PhoneShell>
    );
  }
  if (!state || !state.session) return <PhoneShell>Loading…</PhoneShell>;

  if (state.me?.kicked || (state.me === null && state.session.state !== "LOBBY")) {
    return (
      <PhoneShell>
        <p className="font-display text-3xl">You were removed from the room</p>
        <RoughButton className="mt-6" onClick={() => { clearPlayerSession(); router.push("/"); }}>
          Back to home
        </RoughButton>
      </PhoneShell>
    );
  }

  const session = state.session;
  const isHost = state.me?.isHost ?? false;
  const inGame = session.state !== "LOBBY" && session.state !== "GAME_OVER";

  return (
    <MotionConfig reducedMotion="user">
      <main
        className="stage stage-backdrop relative flex min-h-screen w-full flex-col overflow-hidden p-4"
        style={{ ["--stage-bg" as string]: "#241d38" }}
      >
        {/* fill wide desktop viewports so the controller doesn't float in a void */}
        <SpotRays className="absolute left-0 top-0 hidden h-full max-h-[100vh] w-[55vw] md:block" />
        <SpotRays flip className="absolute right-0 top-0 hidden h-full max-h-[100vh] w-[55vw] md:block" />
        <StarField />

        <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col md:max-w-xl">
        <PlayerHeader state={state} player={player} />

        <div className="relative z-10 flex flex-1 flex-col justify-center py-6">
          {session.state === "LOBBY" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <Mascot avatarId={player.avatarId} expression="idle" size={130} />
              <p className="font-display text-3xl uppercase tracking-wide">{player.username}</p>
              {isHost ? (
                <TapedLabel tilt={-1.5} color="var(--mustard)">
                  <span className="font-display text-lg" style={{ color: "#221f30" }}>
                    {session.gameType === "ttal"
                      ? "You're the host! You play too, the round controls pop up here."
                      : "You're the host! Run it from here."}
                  </span>
                </TapedLabel>
              ) : (
                <p className="font-hand animate-pulse text-2xl opacity-70">
                  You&apos;re in! Eyes on the big screen…
                </p>
              )}
              <button onClick={leave} className="font-score mt-2 text-xs uppercase tracking-[0.25em] opacity-50">
                leave room
              </button>
            </div>
          )}

          {/* trivia: the host runs the show instead of playing. TTAL: the host
              plays like everyone else with the pacing controls underneath */}
          {inGame && isHost && session.gameType === "buzz_trivia" && (
            <HostController code={code} state={state} playerToken={player.token} />
          )}

          {inGame && (!isHost || session.gameType !== "buzz_trivia") && (
            <PlayerGameView code={code} state={state} player={player} />
          )}

          {inGame && isHost && session.gameType === "ttal" && (
            <TtalHostControls code={code} token={player.token} state={state} />
          )}

          {/* a TTAL host plays like everyone else, so they get a real result */}
          {session.state === "GAME_OVER" && (
            <GameOverPhone
              state={state}
              onLeave={leave}
              isHost={isHost && session.gameType === "buzz_trivia"}
            />
          )}
        </div>

        {inGame && (
          <button
            onClick={leave}
            className="font-score mx-auto mb-1 w-fit text-[10px] uppercase tracking-[0.3em] opacity-40 transition hover:opacity-80"
          >
            leave game
          </button>
        )}
        </div>
      </main>
    </MotionConfig>
  );
}

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="stage stage-backdrop relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 text-center"
      style={{ ["--stage-bg" as string]: "#241d38" }}
    >
      <StarField />
      <div className="relative z-10 flex flex-col items-center">{children}</div>
    </main>
  );
}

function PlayerHeader({ state, player }: { state: RoomStateResponse; player: PlayerSession }) {
  // at game over ranks come from the frozen standings, so leavers don't
  // promote everyone still in the room
  const { players, scores } = finalPlayersAndScores(state);
  const ranked = rankPlayers(players, scores);
  const mine = ranked.find((p) => p.id === state.me?.playerId);
  const inGame = state.session!.state !== "LOBBY";
  const team = state.players.find((p) => p.id === state.me?.playerId)?.team;

  return (
    <header
      className="panel-paper panel-grain relative z-10 flex items-center justify-between px-3 py-2 md:px-5 md:py-3"
      style={{
        background: "var(--cream)",
        transform: "rotate(-0.5deg)",
        borderColor: team === "red" ? "#e2493b" : team === "blue" ? "#5aa9e6" : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        <Mascot avatarId={player.avatarId} size={38} animate={false} />
        <span className="font-display text-lg uppercase tracking-wide md:text-2xl" style={{ color: "#221f30" }}>
          {player.username}
        </span>
      </div>
      {inGame && mine ? (
        <div className="flex items-center gap-2">
          <span className="font-score text-sm uppercase" style={{ color: "#8a7f63" }}>
            {ordinal(mine.place)}
          </span>
          <span
            className="font-score rounded-lg border-[3px] border-[#221f30] px-2 py-0.5 text-xl tabular-nums md:text-2xl"
            style={{ background: "var(--mustard)", color: "#221f30", transform: "rotate(2deg)", boxShadow: "2px 2px 0 rgba(0,0,0,.35)" }}
          >
            {mine.score}
          </span>
        </div>
      ) : (
        <span className="font-display text-base tracking-[0.2em] md:text-xl" style={{ color: "#8a7f63" }}>
          {state.room.code}
        </span>
      )}
    </header>
  );
}

function PlayerGameView({
  code,
  state,
  player,
}: {
  code: string;
  state: RoomStateResponse;
  player: PlayerSession;
}) {
  const session = state.session!;
  const payload = session.payload;
  const myBuzzOrder = state.me?.buzzOrder ?? null;
  const iAmAnswering = session.currentPlayerId === state.me?.playerId;

  switch (session.state) {
    case "COLLECTING":
      // keyed by turn index so each new round starts with a blank form
      return (
        <TtalStatementForm
          key={session.questionIndex}
          code={code}
          token={player.token}
          state={state}
        />
      );
    case "VOTING":
      return <TtalVotePanel code={code} token={player.token} state={state} />;
    case "WYR_CHOOSING":
      return <WyrChoosePanel code={code} token={player.token} state={state} />;
    case "MLT_VOTING":
      return <MltVotePanel code={code} token={player.token} state={state} />;
    case "HOL_VOTING":
      return <HolVotePanel code={code} token={player.token} state={state} />;
    case "HOL_REVEAL":
      return <HolRevealPanel state={state} />;
    case "GTP_ANSWERING":
      return <GtpAnswerForm key={session.questionIndex} code={code} token={player.token} state={state} />;
    case "GTP_GUESSING":
      return <GtpGuessPanel code={code} token={player.token} state={state} />;
    case "TANK_PITCHING":
      return <TankPitchPhone state={state} />;
    case "TANK_INVESTING":
      return <TankInvestPhone code={code} token={player.token} state={state} />;
    case "CHARADES_ACTING": {
      const charadesRound = session.payload.charadesRound;
      if (state.me?.playerId === charadesRound?.actorId) {
        return <CharadesActPhone state={state} />;
      }
      return <CharadesGuessPhone code={code} token={player.token} state={state} />;
    }
    case "NUM_SUBMITTING":
      return <NumSubmitPhone code={code} token={player.token} state={state} />;
    case "NUM_GUESSING":
      return <NumGuessPhone code={code} token={player.token} state={state} />;
    case "REVEAL":
      if (session.gameType === "wyr") return <WyrRevealPanel state={state} />;
      if (session.gameType === "mlt") return <MltRevealPanel state={state} />;
      if (session.gameType === "gtp") return <GtpRevealPanel state={state} />;
      if (session.gameType === "tank") return <TankRevealPhone state={state} />;
      if (session.gameType === "charades") return <CharadesRevealPhone state={state} />;
      if (session.gameType === "num") return <NumRevealPhone state={state} />;
      return <TtalRevealPanel state={state} />;
    case "QUESTION_PREVIEW":
      // trivia: the buzzer must already be under your thumb before the
      // question lands, early presses are harmless (server rejects them)
      if (session.gameType === "buzz_trivia") {
        return (
          <BuzzButton
            code={code}
            token={player.token}
            buzzOrder={myBuzzOrder}
            hint={`Get ready for question ${session.questionIndex + 1}…`}
          />
        );
      }
      return (
        <div className="flex flex-col items-center gap-3 text-center">
          <Mascot avatarId={player.avatarId} size={110} />
          <p className="font-hand animate-pulse text-2xl opacity-80">
            Get ready for question {session.questionIndex + 1}…
          </p>
        </div>
      );
    case "BUZZ_OPEN":
    case "PLAYER_BUZZED":
      if (iAmAnswering) {
        if (session.hostMode === "virtual") {
          return (
            <AnswerInput
              code={code}
              token={player.token}
              open={Boolean(payload.buzz?.answerOpen)}
              avatarId={player.avatarId}
            />
          );
        }
        return (
          <div className="flex flex-col items-center gap-3 text-center">
            <Mascot avatarId={player.avatarId} expression="buzzed" size={120} />
            <motion.p
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 0.9 }}
              className="font-display text-4xl uppercase"
              style={{ color: "var(--mustard)" }}
            >
              You&apos;re up!
            </motion.p>
            <p className="font-hand text-2xl opacity-80">Say it loud! 🎤</p>
          </div>
        );
      }
      return (
        <BuzzButton code={code} token={player.token} buzzOrder={myBuzzOrder} />
      );
    case "SHOW_ANSWER": {
      const result = payload.lastResult;
      const mineResult = result && result.playerId === state.me?.playerId ? result : null;
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          {mineResult ? (
            mineResult.correct ? (
              <>
                <Mascot avatarId={player.avatarId} expression="correct" size={110} />
                <Stamp color="green" size="lg">+{mineResult.points}!</Stamp>
              </>
            ) : (
              <>
                <Mascot avatarId={player.avatarId} expression="incorrect" size={110} />
                <Stamp color="red" size="lg">
                  {mineResult.points < 0 ? `${mineResult.points}!` : "Nope!"}
                </Stamp>
              </>
            )
          ) : (
            <p className="font-hand text-2xl opacity-70">The answer was…</p>
          )}
          <TapedLabel tilt={1} color="#dff0d0">
            <span className="font-display text-3xl" style={{ color: "#221f30" }}>
              {payload.answer?.text}
            </span>
          </TapedLabel>
        </div>
      );
    }
    case "SCOREBOARD":
      return (
        <div>
          <h2 className="font-display mb-3 text-center text-3xl uppercase">Scores</h2>
          <Scoreboard
            players={state.players}
            scores={state.scores}
            highlightPlayerId={state.me?.playerId}
            compact
          />
        </div>
      );
    default:
      return null;
  }
}

// Virtual host mode: the buzzed player types their answer (PRD §9, §17).
// Typing stays locked (server-enforced) until the host finishes talking.
function AnswerInput({
  code,
  token,
  open,
  avatarId,
}: {
  code: string;
  token: string;
  open: boolean;
  avatarId: string;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await sendAction(code, { type: "SUBMIT_ANSWER", text: text.trim() }, token);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <Mascot avatarId={avatarId} expression="buzzed" size={120} />
        <motion.p
          animate={{ rotate: [-1, 1, -1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className="font-display text-3xl uppercase leading-tight"
          style={{ color: "var(--mustard)" }}
        >
          You buzzed first!
        </motion.p>
        <p className="font-hand animate-pulse text-2xl opacity-80">
          Shh… the host is talking
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col items-center gap-4">
      <motion.p
        animate={{ rotate: [-1, 1, -1] }}
        transition={{ repeat: Infinity, duration: 1.4 }}
        className="font-display text-center text-3xl uppercase leading-tight"
        style={{ color: "var(--mustard)" }}
      >
        You buzzed first!
      </motion.p>
      <p className="font-hand -mt-2 text-xl opacity-80">Scribble your answer:</p>
      <Panel tilt={-0.8} className="w-full p-3">
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={120}
          placeholder="your answer…"
          autoComplete="off"
          autoCorrect="off"
          className="font-hand h-12 w-full bg-transparent text-center text-2xl outline-none placeholder:opacity-40"
          style={{ color: "#221f30" }}
        />
        <ScribbleUnderline className="mx-auto w-4/5" color="#2fa8a0" />
      </Panel>
      <RoughButton type="submit" className="w-full py-4 text-2xl" disabled={busy || !text.trim()}>
        {busy ? "Checking…" : "Send it!"}
      </RoughButton>
      {error && <p className="font-hand text-lg" style={{ color: "var(--coral)" }}>{error}</p>}
    </form>
  );
}

function BuzzButton({
  code,
  token,
  buzzOrder,
  hint,
}: {
  code: string;
  token: string;
  buzzOrder: number | null;
  hint?: string;
}) {
  const [cooldown, setCooldown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buzzed = buzzOrder !== null;
  const disabled = buzzed || cooldown;

  // stays "BUZZ!" even while someone else is answering, buzzing then simply
  // queues you for the steal (which only matters when retries are on)
  const label = useMemo(() => {
    if (buzzed) return `Buzzed ${ordinal(buzzOrder!)}`;
    return "BUZZ!";
  }, [buzzed, buzzOrder]);

  async function buzz() {
    if (disabled) return;
    setCooldown(true);
    setError(null);
    // 2-second visual cooldown so it can't be spammed (PRD §17)
    const cooldownTimer = setTimeout(() => setCooldown(false), 2000);
    try {
      await sendAction(code, { type: "BUZZ_IN" }, token);
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes("Not allowed in state")) {
        // jumped the gun before buzzing opened, no penalty, no noise
        clearTimeout(cooldownTimer);
        setCooldown(false);
      } else if (!message.includes("already buzzed")) {
        setError(message);
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* the big physical button: base ring + cap that visibly depresses */}
      <motion.button
        whileTap={disabled ? undefined : { scale: 0.96 }}
        onClick={buzz}
        disabled={disabled}
        aria-label={label}
        className="font-display relative h-60 w-60 select-none rounded-full text-5xl uppercase tracking-wide md:h-72 md:w-72 md:text-6xl"
        style={{
          background: buzzed ? "#8f8a7a" : cooldown ? "#b23327" : "#e2493b",
          color: "#f5ecd4",
          border: "6px solid #221f30",
          boxShadow: disabled
            ? "0 3px 0 #221f30, inset 0 -6px 0 rgba(0,0,0,.25)"
            : "0 12px 0 #221f30, inset 0 -10px 0 rgba(0,0,0,.25)",
          transform: disabled ? "translateY(10px)" : "translateY(0)",
          transition: "transform 100ms ease, box-shadow 100ms ease, background 200ms ease",
          textShadow: "2px 2px 0 rgba(34,31,48,.6)",
        }}
      >
        <span className="px-4 leading-tight">{label}</span>
        <DoodleStar size={20} className="absolute right-6 top-8 rotate-12" color="#f5ecd4" />
      </motion.button>
      {buzzed && (
        <p className="font-hand animate-pulse text-2xl opacity-80">
          {buzzOrder === 1 ? "Answer out loud!" : "Waiting for your turn…"}
        </p>
      )}
      {!buzzed && hint && (
        <p className="font-hand animate-pulse text-2xl opacity-80">{hint}</p>
      )}
      {error && <p className="font-hand text-lg" style={{ color: "var(--coral)" }}>{error}</p>}
    </div>
  );
}

function GameOverPhone({
  state,
  onLeave,
  isHost,
}: {
  state: RoomStateResponse;
  onLeave: () => void;
  isHost: boolean;
}) {
  // rank against the frozen final standings so leavers don't shift placings
  const { players, scores } = finalPlayersAndScores(state);
  const ranked = rankPlayers(players, scores);
  const mine = ranked.find((p) => p.id === state.me?.playerId);
  const won = mine?.place === 1 && !isHost;
  const myAvatar = players.find((p) => p.id === state.me?.playerId)?.avatarId;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {won && <Confetti count={50} />}
      {myAvatar && (
        <Mascot avatarId={myAvatar} expression={won ? "winner" : "idle"} size={110} />
      )}
      <p className="font-display text-4xl uppercase">Game over!</p>
      {mine && !isHost && (
        <p className="font-hand text-2xl">
          You finished <span className="font-display" style={{ color: "var(--mustard)" }}>{ordinal(mine.place)}</span>{" "}
          with <span className="font-display">{mine.score}</span> points
        </p>
      )}
      <Scoreboard players={players} scores={scores} highlightPlayerId={state.me?.playerId} compact />
      <RoughButton className="mt-2 px-8 py-3 text-xl" onClick={onLeave}>
        Leave game
      </RoughButton>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

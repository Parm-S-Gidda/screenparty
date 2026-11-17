"use client";

import { useEffect, useRef, useState } from "react";
import { MainScreen } from "@/components/screens/MainScreen";
import { PlayerScreen } from "@/components/screens/PlayerScreen";
import type { PlayerSession } from "@/lib/playerSession";

const TEST_AVATARS = ["alien", "artist", "chef", "cool"] as const;
const GAME_TYPES = [
  { value: "wyr", label: "Would You Rather" },
  { value: "ttal", label: "Two Truths & a Lie" },
  { value: "mlt", label: "Most Likely To" },
  { value: "hol", label: "Higher or Lower" },
  { value: "gtp", label: "Guess the Player" },
  { value: "tank", label: "Shark Tank" },
  { value: "charades", label: "Charades" },
  { value: "num", label: "Number Crunch" },
  { value: "buzz_trivia", label: "Fact Frenzy (needs Pack ID)" },
] as const;

type Session = { code: string; sessions: PlayerSession[] };

function ScaledPanel({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      // contain: scale down to fit whichever axis is tighter
      setScale(Math.min(el.offsetWidth / width, el.offsetHeight / height));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [width, height]);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const PERSONALITIES = [
  { value: "neutral", label: "Neutral" },
  { value: "pro", label: "Pro" },
  { value: "comedian", label: "Comedian" },
  { value: "unhinged", label: "Unhinged" },
] as const;

export function TestMultiView({ defaultPackId }: { defaultPackId: string }) {
  const [gameType, setGameType] = useState("wyr");
  const [playerCount, setPlayerCount] = useState(2);
  const [hostMode, setHostMode] = useState<"self" | "virtual">("self");
  const [personality, setPersonality] = useState<"neutral" | "pro" | "comedian" | "unhinged">("neutral");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const roomRes = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType,
          questionCount: 10,
          packId: defaultPackId || undefined,
          hostMode,
          hostPersonality: hostMode === "virtual" ? personality : undefined,
        }),
      });
      if (!roomRes.ok) {
        const e = await roomRes.json().catch(() => ({}));
        throw new Error(e.error ?? `Room creation failed (${roomRes.status})`);
      }
      const { code } = await roomRes.json();

      const sessions: PlayerSession[] = [];
      for (let i = 0; i < playerCount; i++) {
        const joinRes = await fetch("/api/rooms/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            username: `Player${i + 1}`,
            avatarId: TEST_AVATARS[i % TEST_AVATARS.length],
          }),
        });
        if (!joinRes.ok) {
          const e = await joinRes.json().catch(() => ({}));
          throw new Error(e.error ?? `Join failed for Player${i + 1}`);
        }
        const { playerId, token, roomCode, avatarId } = await joinRes.json();
        sessions.push({
          playerId,
          token,
          roomCode,
          username: `Player${i + 1}`,
          avatarId,
        });
      }

      setSession({ code, sessions });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0a1a",
          color: "#f5ecd4",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 320 }}>
          <h1 style={{ fontSize: 20, fontWeight: "bold", margin: 0 }}>
            Dev Multi-View
          </h1>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, opacity: 0.6, textTransform: "uppercase" }}>Game type</span>
            <select
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
              style={{
                background: "#1a1030",
                color: "#f5ecd4",
                border: "1px solid #3a2d60",
                padding: "6px 8px",
                borderRadius: 4,
              }}
            >
              {GAME_TYPES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>

<label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, opacity: 0.6, textTransform: "uppercase" }}>Players (2–4)</span>
            <select
              value={playerCount}
              onChange={(e) => setPlayerCount(Number(e.target.value))}
              style={{
                background: "#1a1030",
                color: "#f5ecd4",
                border: "1px solid #3a2d60",
                padding: "6px 8px",
                borderRadius: 4,
              }}
            >
              {[2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} players
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, opacity: 0.6, textTransform: "uppercase" }}>Host mode</span>
            <select
              value={hostMode}
              onChange={(e) => setHostMode(e.target.value as "self" | "virtual")}
              style={{
                background: "#1a1030",
                color: "#f5ecd4",
                border: "1px solid #3a2d60",
                padding: "6px 8px",
                borderRadius: 4,
              }}
            >
              <option value="self">Self hosted</option>
              <option value="virtual">AI virtual host</option>
            </select>
          </label>

          {hostMode === "virtual" && (
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, opacity: 0.6, textTransform: "uppercase" }}>Personality</span>
              <select
                value={personality}
                onChange={(e) => setPersonality(e.target.value as typeof personality)}
                style={{
                  background: "#1a1030",
                  color: "#f5ecd4",
                  border: "1px solid #3a2d60",
                  padding: "6px 8px",
                  borderRadius: 4,
                }}
              >
                {PERSONALITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
          )}

          {error && (
            <p style={{ color: "#e2493b", fontSize: 13, margin: 0 }}>{error}</p>
          )}

          <button
            onClick={start}
            disabled={loading}
            style={{
              background: loading ? "#3a2d60" : "#6c4fc7",
              color: "#f5ecd4",
              border: "none",
              padding: "10px 0",
              borderRadius: 4,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: 15,
            }}
          >
            {loading ? "Setting up…" : "Start test session"}
          </button>

          <p style={{ fontSize: 11, opacity: 0.4, margin: 0 }}>
            Only visible in development. You must be signed in as a host.
          </p>
        </div>
      </div>
    );
  }

  // Grid: host panel (wider) + player panels side by side
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        height: "100vh",
        overflow: "hidden",
        background: "#000",
        alignItems: "stretch",
      }}
    >
      {/* Host panel gets ~55% of width, full height */}
      <div style={{ flex: "0 0 55%", minWidth: 0, height: "100%" }}>
        <ScaledPanel width={1280} height={720}>
          <MainScreen code={session.code} isOwner={true} />
        </ScaledPanel>
      </div>

      {/* Player panels share the remaining 45%, rows distribute height evenly */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: session.sessions.length > 2 ? "1fr 1fr" : "1fr",
          gap: 4,
          minWidth: 0,
          height: "100%",
        }}
      >
        {session.sessions.map((s) => (
          <ScaledPanel key={s.playerId} width={390} height={844}>
            <PlayerScreen code={session.code} initialSession={s} />
          </ScaledPanel>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AVATARS, LIMITS } from "@/lib/constants";
import { savePlayerSession } from "@/lib/playerSession";
import { checkRoomCode } from "@/lib/checkRoom";
import { Mascot } from "@/components/cartoon/Mascot";
import { BackLink } from "@/components/cartoon/BackLink";
import { TapedLabel } from "@/components/cartoon/Panel";
import { ScribbleUnderline, StarField } from "@/components/cartoon/Doodles";
import { cn } from "@/lib/utils";

// Two steps: (1) enter + validate a room code, (2) pick a name and character.
// The code is locked once validated, changing it means going back a step.
export function JoinFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code")?.toUpperCase() ?? "";

  const [step, setStep] = useState<"code" | "profile">("code");
  const [codeInput, setCodeInput] = useState(initialCode);
  const [roomCode, setRoomCode] = useState<string | null>(null); // validated
  const [checking, setChecking] = useState(Boolean(initialCode));
  const [username, setUsername] = useState("");
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // arriving from the landing page (or a link) with a code: validate it once
  useEffect(() => {
    if (!initialCode) return;
    let cancelled = false;
    void checkRoomCode(initialCode).then((result) => {
      if (cancelled) return;
      setChecking(false);
      if (result.ok) {
        setRoomCode(result.code);
        setStep("profile");
      } else {
        setError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialCode]);

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (checking) return;
    setChecking(true);
    setError(null);
    const result = await checkRoomCode(codeInput);
    setChecking(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRoomCode(result.code);
    setStep("profile");
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!roomCode) return;
    if (!avatarId) {
      setError("Pick a character!");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: roomCode, username, avatarId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not join");
      savePlayerSession({
        playerId: body.playerId,
        token: body.token,
        roomCode: body.roomCode,
        username,
        avatarId,
      });
      router.push(`/play/${body.roomCode}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 overflow-hidden p-6">
      <StarField />
      <BackLink href="/" label="home" className="relative z-10" />
      <div className="relative z-10 text-center">
        <h1 className="font-display text-4xl uppercase tracking-wide">Join the show!</h1>
        <ScribbleUnderline className="mx-auto mt-1 w-2/3" color="#ee7c8e" />
      </div>

      {step === "code" ? (
        <form onSubmit={submitCode} className="relative z-10 flex flex-col gap-4">
          <input
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="ROOM CODE"
            autoComplete="off"
            maxLength={6}
            required
            autoFocus
            className="font-display h-16 rounded-xl border-4 border-[#221f30] bg-[#fffdf3] text-center text-3xl uppercase tracking-[0.3em] outline-none placeholder:opacity-30"
            style={{ color: "#221f30", boxShadow: "4px 4px 0 rgba(0,0,0,.35)", transform: "rotate(-0.5deg)" }}
          />
          {error && (
            <p className="font-hand text-center text-xl" style={{ color: "var(--coral)" }}>
              {error}
            </p>
          )}
          <button type="submit" className="btn-rough px-6 py-4 text-2xl" disabled={checking}>
            {checking ? "Checking…" : "Next"}
          </button>
        </form>
      ) : (
        <form onSubmit={join} className="relative z-10 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-1">
            <TapedLabel tilt={-1.5} color="var(--cream)">
              <span className="font-score block text-center text-[9px] uppercase tracking-[0.3em]" style={{ color: "#8a7f63" }}>
                joining room
              </span>
              <span className="font-display text-3xl tracking-[0.25em]" style={{ color: "#221f30" }}>
                {roomCode}
              </span>
            </TapedLabel>
            <button
              type="button"
              onClick={() => {
                setStep("code");
                setRoomCode(null);
                setError(null);
              }}
              className="font-score text-[10px] uppercase tracking-[0.25em] opacity-50 transition hover:opacity-90"
            >
              wrong room?
            </button>
          </div>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your name"
            autoComplete="off"
            maxLength={LIMITS.usernameMaxLength}
            required
            autoFocus
            className="font-hand h-14 rounded-xl border-4 border-[#221f30] bg-[#fffdf3] text-center text-2xl outline-none placeholder:opacity-40"
            style={{ color: "#221f30", boxShadow: "4px 4px 0 rgba(0,0,0,.35)", transform: "rotate(0.4deg)" }}
          />

          <div>
            <p className="font-score mb-2 text-center text-xs uppercase tracking-[0.3em]" style={{ color: "var(--muted-foreground)" }}>
              pick your character
            </p>
            <div className="panel panel-grain grid grid-cols-4 gap-1 p-3">
              {AVATARS.map((avatar) => {
                const selected = avatarId === avatar.id;
                return (
                  <motion.button
                    key={avatar.id}
                    type="button"
                    data-sfx-hover
                    animate={{ scale: selected ? 1.08 : 1, rotate: selected ? -3 : 0 }}
                    whileHover={{ scale: selected ? 1.14 : 1.18, rotate: selected ? -3 : 3, y: -3 }}
                    whileTap={{ scale: 0.85, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 16 }}
                    onClick={() => setAvatarId(avatar.id)}
                    className={cn(
                      "relative flex aspect-square cursor-pointer items-center justify-center rounded-xl border-[3px] transition-colors",
                      selected
                        ? "z-10 border-[#221f30]"
                        : "border-transparent hover:z-10 hover:border-[#221f30]/30 hover:bg-[#f0b42933]"
                    )}
                    style={{ background: selected ? "var(--mustard)" : undefined }}
                    aria-label={avatar.id}
                    aria-pressed={selected}
                  >
                    <Mascot
                      avatarId={avatar.id}
                      size={56}
                      animate={selected}
                      expression={selected ? "buzzed" : "idle"}
                    />
                    {selected && (
                      <motion.span
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 18 }}
                        className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-[#221f30] text-sm"
                        style={{ background: "#3e8e2f", color: "#f5ecd4" }}
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="font-hand text-center text-xl" style={{ color: "var(--coral)" }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn-rough px-6 py-4 text-2xl" disabled={busy}>
            {busy ? "Joining…" : "Let's go!"}
          </button>
        </form>
      )}
    </main>
  );
}

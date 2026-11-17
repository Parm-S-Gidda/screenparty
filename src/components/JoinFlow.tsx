"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AVATARS, BRAND_NAME, LIMITS } from "@/lib/constants";
import { savePlayerSession } from "@/lib/playerSession";
import { checkRoomCode } from "@/lib/checkRoom";
import { Mascot } from "@/components/cartoon/Mascot";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring", stiffness: 420, damping: 26 } as const;
const label = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);

// Two steps: (1) enter + validate a room code, (2) pick a name and character.
// The code is locked once validated, changing it means going back a step.
export function JoinFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();
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
    if (!codeInput) {
      setError("Type the code from the big screen.");
      return;
    }
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
    if (!username.trim()) {
      setError("Add your name so everyone knows who you are.");
      return;
    }
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

  const forward = step === "profile" ? 1 : -1;
  const stepMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : {
        initial: { opacity: 0, x: 48 * forward },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -48 * forward },
        transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
      };

  const errorLine = error && (
    <p id="join-error" role="alert" className="font-hand text-center text-lg leading-snug" style={{ color: "var(--error-red)" }}>
      {error}
    </p>
  );

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="font-display text-2xl uppercase leading-none" aria-label={`${BRAND_NAME} home`}>
          <span style={{ color: "var(--mustard)" }}>{BRAND_NAME.slice(0, 6)}</span>
          <span style={{ color: "var(--coral)" }}>{BRAND_NAME.slice(6)}</span>
        </Link>
        <span className="font-score text-xs uppercase tracking-[0.2em]" style={{ color: "var(--cream-muted)" }}>
          Step {step === "code" ? 1 : 2} of 2
        </span>
      </header>

      <div className="relative flex flex-1 flex-col">
        <AnimatePresence mode="wait" initial={false}>
          {step === "code" ? (
            <motion.form
              key="code"
              {...stepMotion}
              onSubmit={submitCode}
              noValidate
              className="my-auto flex flex-col gap-6 py-10"
            >
              <div className="text-center">
                <h1 className="font-display text-[clamp(2.5rem,12vw,3.5rem)] uppercase leading-[0.95]" style={{ color: "var(--cream)" }}>
                  Join the <span style={{ color: "var(--mustard)" }}>show</span>
                </h1>
                <p className="font-hand mt-3 text-xl leading-snug" style={{ color: "var(--cream-muted)" }}>
                  Type the room code from the big screen.
                </p>
              </div>
              <div className="panel panel-grain flex flex-col gap-4 p-5">
                <label htmlFor="room-code" className="font-score text-center text-xs uppercase tracking-[0.3em]" style={{ color: "var(--ink-label)" }}>
                  Room code
                </label>
                <input
                  id="room-code"
                  value={codeInput}
                  onChange={(e) => {
                    // room codes are letters and digits only
                    setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                    setError(null);
                  }}
                  placeholder="CODE"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={6}
                  autoFocus
                  disabled={checking && Boolean(initialCode)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "join-error" : undefined}
                  className="font-display h-20 w-full rounded-xl border-4 border-[var(--ink)] bg-[var(--card-white)] text-center text-5xl uppercase tracking-[0.3em] text-[var(--ink)] outline-none placeholder:text-[var(--ink)]/25"
                  style={{ boxShadow: "3px 3px 0 rgba(0,0,0,.3)" }}
                />
                {errorLine}
                <button type="submit" className="btn-rough px-6 py-4 text-2xl" disabled={checking}>
                  {checking ? "Checking…" : "Next"}
                </button>
              </div>
              <p className="font-hand text-center text-lg" style={{ color: "var(--cream-muted)" }}>
                Hosting tonight?{" "}
                <Link href="/login" className="font-score text-sm uppercase tracking-[0.12em] underline decoration-2 underline-offset-4" style={{ color: "var(--cream)" }}>
                  Sign in
                </Link>
              </p>
            </motion.form>
          ) : (
            <motion.form key="profile" {...stepMotion} onSubmit={join} noValidate className="flex flex-1 flex-col gap-5 pt-6">
              {/* you, on stage: the room ticket and a live preview of your character */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-score text-xs uppercase tracking-[0.2em]" style={{ color: "var(--cream-muted)" }}>
                    Joining room
                  </span>
                  <span className="font-display text-3xl tracking-[0.2em]" style={{ color: "var(--mustard)" }}>
                    {roomCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("code");
                    setRoomCode(null);
                    setError(null);
                  }}
                  className="font-score min-h-11 px-2 text-sm uppercase tracking-[0.12em] underline decoration-2 underline-offset-4 focus-visible:outline-[3px] focus-visible:outline-[var(--mustard)]"
                  style={{ color: "var(--cream)" }}
                >
                  Wrong room?
                </button>
              </div>

              <div className="panel panel-grain flex items-center gap-4 p-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-[3px]" style={{ borderColor: "var(--ink)", background: avatarId ? "var(--mustard)" : "var(--paper)" }}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {avatarId ? (
                      <motion.div
                        key={avatarId}
                        initial={reduce ? { opacity: 0 } : { scale: 0, rotate: -20 }}
                        animate={reduce ? { opacity: 1 } : { scale: 1, rotate: 0 }}
                        exit={reduce ? { opacity: 0 } : { scale: 0, rotate: 20 }}
                        transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 600, damping: 18 }}
                      >
                        <Mascot avatarId={avatarId} size={64} expression="buzzed" animate={false} />
                      </motion.div>
                    ) : (
                      <span className="font-display text-3xl" style={{ color: "var(--ink-label)" }} aria-hidden>
                        ?
                      </span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <label htmlFor="player-name" className="font-score text-xs uppercase tracking-[0.2em]" style={{ color: "var(--ink-label)" }}>
                    Your name
                  </label>
                  <input
                    id="player-name"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError(null);
                    }}
                    placeholder="Sam"
                    autoComplete="off"
                    maxLength={LIMITS.usernameMaxLength}
                    required
                    autoFocus
                    aria-describedby={error ? "join-error" : undefined}
                    className="font-hand h-12 w-full rounded-xl border-[3px] border-[var(--ink)] bg-[var(--card-white)] px-3 text-2xl text-[var(--ink)] outline-none placeholder:text-[var(--ink)]/30"
                  />
                </div>
              </div>

              <fieldset>
                <legend className="font-score mb-3 text-xs uppercase tracking-[0.2em]" style={{ color: "var(--cream-muted)" }}>
                  Pick your character
                </legend>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {AVATARS.map((avatar, i) => {
                    const selected = avatarId === avatar.id;
                    return (
                      <motion.button
                        key={avatar.id}
                        type="button"
                        data-sfx-hover
                        initial={reduce ? false : { opacity: 0, y: 16, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: selected ? 1.06 : 1 }}
                        whileTap={reduce ? undefined : { scale: 0.88 }}
                        transition={{ ...SPRING, delay: reduce ? 0 : Math.min(i, 6) * 0.03 }}
                        onClick={() => {
                          setAvatarId(avatar.id);
                          setError(null);
                        }}
                        className={cn(
                          "relative flex aspect-square items-center justify-center rounded-xl border-[3px] transition-colors focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--mustard)]",
                          selected ? "z-10" : "hover:bg-[var(--paper)]"
                        )}
                        style={{
                          borderColor: "var(--ink)",
                          background: selected ? "var(--mustard)" : "var(--cream)",
                          boxShadow: selected ? "0 0 0 var(--ink)" : "3px 3px 0 rgba(0,0,0,0.45)",
                        }}
                        aria-label={label(avatar.id)}
                        aria-pressed={selected}
                      >
                        <Mascot avatarId={avatar.id} size={52} animate={false} expression={selected ? "buzzed" : "idle"} />
                      </motion.button>
                    );
                  })}
                </div>
              </fieldset>

              {/* primary action stays in thumb reach while the grid scrolls */}
              <div className="sticky bottom-0 z-20 -mx-5 mt-auto flex flex-col gap-3 px-5 pb-3 pt-3" style={{ background: "var(--stage-bg)" }}>
                <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-6 h-6" style={{ background: "linear-gradient(to top, var(--stage-bg), transparent)" }} />
                {error && (
                  <p id="join-error" role="alert" className="font-hand rounded-lg border-[3px] px-3 py-2 text-center text-lg leading-snug" style={{ borderColor: "var(--ink)", background: "var(--cream)", color: "var(--error-red)" }}>
                    {error}
                  </p>
                )}
                <button type="submit" className="btn-rough px-6 py-4 text-2xl" disabled={busy}>
                  {busy ? "Joining…" : "Let's go!"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

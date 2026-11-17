"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { BRAND_NAME, LIMITS } from "@/lib/constants";

type Mode = "login" | "signup";

const COPY = {
  login: {
    title: "Welcome back",
    body: "Sign in to open a room and pick a game.",
    submit: "Sign in",
    busy: "Signing in…",
  },
  signup: {
    title: "Host your first game",
    body: `Free for up to ${LIMITS.free.maxPlayers} players, no credit card. Players never need an account.`,
    submit: "Create account",
    busy: "Creating account…",
  },
} as const;

const SPRING = { type: "spring", stiffness: 420, damping: 32 } as const;

// One card for both modes: the tab pill slides, the copy slides in from the
// side you switched toward, and the card resizes. The URL follows the mode.
export function AuthForm({ mode: initialMode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "not_authorized" ? "This app is private." : null
  );
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";
  const dir = signup ? 1 : -1;
  const copy = COPY[mode];

  function switchTo(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setError(null);
    const qs = searchParams.toString();
    window.history.replaceState(null, "", `/${next}${qs ? `?${qs}` : ""}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = signup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.push(searchParams.get("next") ?? "/dashboard");
    router.refresh();
  }

  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : {
        initial: { opacity: 0, x: 40 * dir },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -40 * dir },
        transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
      };

  const field =
    "font-hand h-14 w-full rounded-xl border-4 border-[var(--ink)] bg-[var(--card-white)] px-4 text-xl text-[var(--ink)] outline-none transition-shadow placeholder:text-[var(--ink)]/35";

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-10">
      <Link href="/" className="font-display mb-8 text-3xl uppercase leading-none" aria-label={`${BRAND_NAME} home`}>
        <span style={{ color: "var(--mustard)" }}>{BRAND_NAME.slice(0, 6)}</span>
        <span style={{ color: "var(--coral)" }}>{BRAND_NAME.slice(6)}</span>
      </Link>

      <motion.div layout={!reduce} transition={SPRING} className="panel panel-grain w-full max-w-md overflow-hidden p-6 md:p-8">
        {/* mode switch: a sliding mustard pill on an ink track */}
        <motion.div layout="position" role="tablist" aria-label="Account" className="grid grid-cols-2 gap-1 rounded-xl border-[3px] p-1" style={{ borderColor: "var(--ink)", background: "var(--paper)" }}>
          {(["login", "signup"] as const).map((m) => {
            const active = m === mode;
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="auth-panel"
                onClick={() => switchTo(m)}
                className="font-score relative min-h-11 rounded-lg text-sm uppercase tracking-[0.14em] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--mustard)]"
                style={{ color: "var(--ink)" }}
              >
                {active && (
                  <motion.span
                    layoutId="auth-pill"
                    transition={reduce ? { duration: 0 } : SPRING}
                    className="absolute inset-0 rounded-lg border-[3px]"
                    style={{ background: "var(--mustard)", borderColor: "var(--ink)", boxShadow: "0 3px 0 var(--ink)" }}
                  />
                )}
                <span className="relative">{m === "login" ? "Sign in" : "Create account"}</span>
              </button>
            );
          })}
        </motion.div>

        <form id="auth-panel" role="tabpanel" onSubmit={submit} className="mt-6 flex flex-col gap-5">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={mode} {...slide} className="flex flex-col gap-2">
              <h1 className="font-display text-balance text-3xl uppercase leading-[1.05]" style={{ color: "var(--ink)" }}>
                {copy.title}
              </h1>
              <p className="font-hand text-lg leading-snug" style={{ color: "var(--ink-body)" }}>
                {copy.body}
              </p>
            </motion.div>
          </AnimatePresence>

          <motion.div layout="position" transition={SPRING} className="flex flex-col gap-2">
            <label htmlFor="email" className="font-score text-xs uppercase tracking-[0.2em]" style={{ color: "var(--ink-label)" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "auth-error" : undefined}
              className={field}
              style={{ boxShadow: "3px 3px 0 rgba(0,0,0,.3)" }}
            />
          </motion.div>

          <motion.div layout="position" transition={SPRING} className="flex flex-col gap-2">
            <label htmlFor="password" className="font-score text-xs uppercase tracking-[0.2em]" style={{ color: "var(--ink-label)" }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={signup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={[signup && "password-hint", error && "auth-error"].filter(Boolean).join(" ") || undefined}
              className={field}
              style={{ boxShadow: "3px 3px 0 rgba(0,0,0,.3)" }}
            />
            <AnimatePresence initial={false}>
              {signup && (
                <motion.p
                  id="password-hint"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: reduce ? 0.15 : 0.2 }}
                  className="font-hand overflow-hidden text-base"
                  style={{ color: "var(--ink-label)" }}
                >
                  At least 6 characters.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {error && (
            <p id="auth-error" role="alert" className="font-hand -my-1 text-lg leading-snug" style={{ color: "var(--error-red)" }}>
              {error}
            </p>
          )}

          {/* wrapper carries the layout move so framer's inline transform never fights btn-rough's press */}
          <motion.div layout="position" transition={SPRING} className="mt-1 flex flex-col">
            <button type="submit" className="btn-rough px-6 py-3.5 text-2xl" disabled={busy}>
              {busy ? copy.busy : copy.submit}
            </button>
          </motion.div>
        </form>
      </motion.div>

      <p className="font-hand mt-8 text-center text-lg" style={{ color: "var(--cream-muted)" }}>
        Just joining a friend&apos;s game?{" "}
        <Link href="/join" className="font-score whitespace-nowrap text-sm uppercase tracking-[0.12em] underline decoration-2 underline-offset-4" style={{ color: "var(--cream)" }}>
          Enter a room code
        </Link>
      </p>
    </main>
  );
}

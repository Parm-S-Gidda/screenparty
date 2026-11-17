"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkRoomCode } from "@/lib/checkRoom";

// Landing page join form: validates the code right here and only moves on to
// the character screen if the room is real and joinable.
export function LandingJoinForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!code) {
      setError("Type the code from the big screen.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await checkRoomCode(code);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    router.push(`/join?code=${encodeURIComponent(result.code)}`);
  }

  return (
    <form onSubmit={submit} noValidate className="panel panel-grain flex flex-col gap-4 p-6" style={{ transform: "rotate(-0.6deg)" }}>
      <label htmlFor="code" className="font-score text-center text-xs uppercase tracking-[0.3em]" style={{ color: "#6b6248" }}>
        Got a room code?
      </label>
      <input
        id="code"
        value={code}
        onChange={(e) => {
          // room codes are letters and digits only
          setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
          setError(null);
        }}
        placeholder="CODE"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={6}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "code-error" : undefined}
        className="font-display h-16 rounded-xl border-4 border-[#221f30] bg-[#fffdf3] text-center text-4xl uppercase tracking-[0.35em] outline-none placeholder:text-[#221f30]/30 focus-visible:outline-solid focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--mustard)]"
        style={{ color: "#221f30", boxShadow: "3px 3px 0 rgba(0,0,0,.3)" }}
      />
      {error && (
        <p id="code-error" role="alert" className="font-hand -my-1 text-center text-lg" style={{ color: "#b8321f" }}>
          {error}
        </p>
      )}
      <button type="submit" className="btn-rough px-6 py-4 text-2xl" disabled={busy}>
        {busy ? "Checking…" : "Join the game!"}
      </button>
    </form>
  );
}

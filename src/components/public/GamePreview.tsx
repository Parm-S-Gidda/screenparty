// Tiny drawn previews of each game's core moment, built from the same ink-
// outlined paper chips the game screens use. Decorative (aria-hidden by caller).
// shortcut: hand-drawn stand-ins; replace with real screenshots or clips per
// game when they exist.

const chip = "font-display rounded-md border-[3px] px-2 py-1 leading-none";
const chipStyle = { borderColor: "var(--ink)", background: "var(--cream)", color: "var(--ink)", boxShadow: "3px 3px 0 rgba(0,0,0,0.35)" };

function Arrow({ up }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
      <path d={up ? "M12 19V5M5 12l7-7 7 7" : "M12 5v14M5 12l7 7 7-7"} />
    </svg>
  );
}

export function GamePreview({ slug }: { slug: string }) {
  switch (slug) {
    case "fact-frenzy":
      return (
        <div className="flex flex-col items-center gap-2">
          <span className={`${chip} text-sm`} style={chipStyle}>Capital of Peru?</span>
          <span
            className="font-display flex h-12 w-12 items-center justify-center rounded-full border-4 text-xs"
            style={{ borderColor: "var(--ink)", background: "var(--tomato)", color: "var(--cream)", boxShadow: "0 4px 0 var(--ink)" }}
          >
            Buzz
          </span>
        </div>
      );
    case "two-truths-and-a-lie":
      return (
        <div className="flex w-40 flex-col gap-1.5">
          {["I've met a celebrity", "I can juggle", "I've been to Peru"].map((s, i) => (
            <span key={s} className={`${chip} relative text-xs`} style={chipStyle}>
              {s}
              {i === 1 && (
                <span className="font-display absolute -right-3 -top-2 rotate-12 rounded border-2 px-1 text-xs" style={{ borderColor: "var(--tomato)", color: "var(--tomato)", background: "var(--cream)" }}>
                  Lie?
                </span>
              )}
            </span>
          ))}
        </div>
      );
    case "would-you-rather":
      return (
        <div className="flex items-center gap-2">
          <span className={`${chip} text-sm`} style={{ ...chipStyle, background: "var(--sky)" }}>Fly</span>
          <span className="font-display text-sm" style={{ color: "var(--ink)" }}>or</span>
          <span className={`${chip} text-sm`} style={{ ...chipStyle, background: "var(--coral)" }}>Be invisible</span>
        </div>
      );
    case "most-likely-to":
      return (
        <div className="flex flex-col items-center gap-2">
          <span className={`${chip} text-sm`} style={chipStyle}>Most likely to be late</span>
          <div className="flex gap-1.5">
            {[3, 1, 0].map((votes, i) => (
              <span key={i} className="font-score rounded-md border-2 px-2 text-xs" style={{ borderColor: "var(--ink)", background: i === 0 ? "var(--mustard)" : "var(--paper)", color: "var(--ink)" }}>
                {votes} votes
              </span>
            ))}
          </div>
        </div>
      );
    case "higher-or-lower":
      return (
        <div className="flex items-center gap-2" style={{ color: "var(--ink)" }}>
          <span className={`${chip} text-sm`} style={chipStyle}>5.1M</span>
          <span className="flex flex-col">
            <Arrow up />
            <Arrow />
          </span>
          <span className={`${chip} text-sm`} style={chipStyle}>?</span>
        </div>
      );
    case "guess-the-player":
      return (
        <div className="flex flex-col items-center gap-2">
          <span className={`${chip} text-sm`} style={chipStyle}>&ldquo;Pineapple on pizza&rdquo;</span>
          <span className="font-score rounded-md border-2 px-2 text-xs uppercase tracking-[0.1em]" style={{ borderColor: "var(--ink)", background: "var(--ink)", color: "var(--cream)" }}>
            Who wrote it?
          </span>
        </div>
      );
    case "shark-tank":
      return (
        <div className="flex flex-col items-center gap-2">
          <span className={`${chip} text-sm`} style={chipStyle}>Self-folding socks</span>
          <span className="font-score rounded-md border-2 px-2 text-xs uppercase tracking-[0.1em]" style={{ borderColor: "var(--ink)", background: "var(--leaf)", color: "var(--ink)" }}>
            3 investors in
          </span>
        </div>
      );
    case "charades":
      return (
        <div className="flex items-center gap-3">
          <span
            className="font-score flex h-12 w-12 items-center justify-center rounded-full border-4 text-sm"
            style={{ borderColor: "var(--ink)", background: "var(--cream)", color: "var(--ink)" }}
          >
            0:30
          </span>
          <span className={`${chip} text-sm`} style={chipStyle}>Act it out</span>
        </div>
      );
    case "number-rating":
      return (
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <span
              key={n}
              className="font-score flex h-7 w-5 items-center justify-center rounded border-2 text-xs"
              style={{ borderColor: "var(--ink)", background: n === 7 ? "var(--mustard)" : "var(--cream)", color: "var(--ink)" }}
            >
              {n}
            </span>
          ))}
        </div>
      );
    default:
      return null;
  }
}

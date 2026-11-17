import { notFound } from "next/navigation";
import { TutorialPreview } from "./TutorialPreview";

// Dev-only: play a game's tutorial without a room, e.g.
// /dev/tutorial?game=buzz_trivia&mode=self&teams=1&retries=1&autoskip=1
// /dev/tutorial?game=ttal&variation=two_lies
export default async function DevTutorialPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; mode?: string; teams?: string; retries?: string; autoskip?: string; variation?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { game = "num", mode, teams, retries, autoskip, variation } = await searchParams;
  return (
    <TutorialPreview
      gameType={game}
      hostMode={mode === "self" ? "self" : "virtual"}
      settings={{ teamsEnabled: teams === "1", retriesEnabled: retries !== "0", autoSkip: autoskip === "1" || mode !== "self", variation }}
    />
  );
}

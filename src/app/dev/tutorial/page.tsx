import { notFound } from "next/navigation";
import { TutorialPreview } from "./TutorialPreview";

// Dev-only: play a game's tutorial without a room, e.g. /dev/tutorial?game=num&mode=self
export default async function DevTutorialPage({ searchParams }: { searchParams: Promise<{ game?: string; mode?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { game = "num", mode } = await searchParams;
  return <TutorialPreview gameType={game} hostMode={mode === "self" ? "self" : "virtual"} />;
}

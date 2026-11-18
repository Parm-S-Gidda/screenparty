import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPacks } from "@/lib/store";
import { PackCard } from "@/components/store/PackCard";
import { RevealItem, RevealList } from "@/components/public/Reveal";

export const metadata: Metadata = { title: "My Packs | ScreenParty", robots: { index: false, follow: false } };

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/store/library");
  const owned = (await loadPacks(createAdminClient(), user.id)).filter((p) => p.owned);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 pb-24 pt-8 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(2.5rem,7vw,4rem)] uppercase leading-[0.9]" style={{ color: "var(--cream)" }}>
            My <span style={{ color: "var(--mustard)" }}>Packs</span>
          </h1>
          <p className="font-hand mt-2 max-w-[50ch] text-xl leading-snug" style={{ color: "var(--cream-muted)" }}>
            Every pack you own works in every game. Choose one under Themed pack when you set up a game (Store packs in Fact Frenzy).
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className="btn-rough px-5 py-2.5 text-lg">Host a game</Link>
          <Link href="/store" className="btn-rough px-5 py-2.5 text-lg" style={{ background: "var(--teal)" }}>Pack store</Link>
        </div>
      </header>

      {owned.length === 0 ? (
        <div className="panel-paper panel-grain flex flex-col items-center gap-3 px-6 py-14 text-center">
          <p className="font-display text-3xl uppercase" style={{ color: "var(--ink)" }}>No packs yet</p>
          <p className="font-hand max-w-md text-xl leading-snug" style={{ color: "var(--ink-body)" }}>
            Grab a themed pack and it brings new trivia, dilemmas, prompts and charades to every game.
          </p>
          <Link href="/store" className="btn-rough mt-2 px-6 py-2.5 text-xl">Browse the store</Link>
        </div>
      ) : (
        <RevealList as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {owned.map((p) => (
            <RevealItem key={p.id}>
              <PackCard pack={p} />
            </RevealItem>
          ))}
        </RevealList>
      )}
    </div>
  );
}

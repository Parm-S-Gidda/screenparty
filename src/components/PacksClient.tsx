"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Pack = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  questionCount: number;
};

type Props = {
  packs: Pack[];
  canCreate: boolean;
  canAiGenerate: boolean;
};

export function PacksClient({ packs: initial, canCreate, canAiGenerate }: Props) {
  const router = useRouter();
  const [packs, setPacks] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [genCount, setGenCount] = useState(10);
  const [genDiff, setGenDiff] = useState("mixed");
  const [showGen, setShowGen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createPack() {
    if (!newTitle.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/packs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCreating(false);
      setNewTitle("");
      router.push(`/dashboard/packs/${data.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function deletePack(id: string) {
    if (!confirm("Delete this pack and all its questions?")) return;
    const res = await fetch(`/api/packs/${id}`, { method: "DELETE" });
    if (res.ok) setPacks((p) => p.filter((x) => x.id !== id));
  }

  async function generatePack() {
    if (!genTopic.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/packs/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: genTopic.trim(), count: genCount, difficulty: genDiff }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowGen(false);
      setGenTopic("");
      router.push(`/dashboard/packs/${data.packId}`);
    } catch (e) {
      setError((e as Error).message);
      setGenerating(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border-2 border-[var(--destructive)] bg-[var(--destructive)]/10 p-3 text-sm text-[var(--destructive)]">
          {error}
        </div>
      )}

      {/* AI Generate modal */}
      {showGen && (
        <div className="panel mb-6 overflow-hidden">
          <div className="border-b-2 border-current p-4">
            <p className="font-display text-lg uppercase tracking-wide">AI Generate Pack</p>
            <p className="mt-1 text-xs opacity-60">Enter a topic and we&apos;ll write the questions.</p>
          </div>
          <div className="space-y-3 p-4">
            <input
              className="w-full rounded-xl border-2 border-current bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Topic (e.g. 90s movies, world capitals, science…)"
              value={genTopic}
              onChange={(e) => setGenTopic(e.target.value)}
              maxLength={100}
            />
            <div className="flex gap-3">
              <select
                className="flex-1 rounded-xl border-2 border-current bg-transparent px-3 py-2 text-sm"
                value={genCount}
                onChange={(e) => setGenCount(Number(e.target.value))}
              >
                {[5, 10, 15, 25].map((n) => (
                  <option key={n} value={n}>{n} questions</option>
                ))}
              </select>
              <select
                className="flex-1 rounded-xl border-2 border-current bg-transparent px-3 py-2 text-sm"
                value={genDiff}
                onChange={(e) => setGenDiff(e.target.value)}
              >
                <option value="mixed">Mixed difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={generatePack}
                disabled={generating || !genTopic.trim()}
                className="btn-rough flex-1 py-2 text-sm font-semibold disabled:opacity-40"
              >
                {generating ? "Generating…" : "Generate"}
              </button>
              <button
                onClick={() => setShowGen(false)}
                className="rounded-xl border-2 border-current px-4 py-2 text-sm opacity-60 hover:opacity-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create new pack inline form */}
      {creating && (
        <div className="panel mb-4 overflow-hidden">
          <div className="flex gap-2 p-4">
            <input
              autoFocus
              className="flex-1 rounded-xl border-2 border-current bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Pack title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createPack()}
              maxLength={60}
            />
            <button
              onClick={createPack}
              disabled={busy || !newTitle.trim()}
              className="btn-rough px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              {busy ? "Creating…" : "Create"}
            </button>
            <button
              onClick={() => { setCreating(false); setNewTitle(""); }}
              className="rounded-xl border-2 border-current px-3 py-2 text-sm opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Action row */}
      {!creating && !showGen && (
        <div className="mb-4 flex gap-2">
          {canCreate && (
            <button
              onClick={() => setCreating(true)}
              className="btn-rough px-4 py-2 text-sm font-semibold"
            >
              + Write questions
            </button>
          )}
          {canAiGenerate && (
            <button
              onClick={() => setShowGen(true)}
              className="rounded-xl border-2 border-current px-4 py-2 text-sm font-semibold opacity-70 hover:opacity-100"
            >
              ✦ AI generate
            </button>
          )}
          {!canCreate && !canAiGenerate && (
            <p className="text-sm opacity-50">Upgrade your plan to create more packs.</p>
          )}
        </div>
      )}

      {/* Pack list */}
      {packs.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 py-12 text-center opacity-50">
          <p className="text-sm font-semibold">No custom packs yet</p>
          <p className="text-xs">Write your own questions or let AI generate a pack.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {packs.map((p) => (
            <div key={p.id} className="panel flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.title}</p>
                <p className="text-xs opacity-50">{p.questionCount} question{p.questionCount !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <a
                  href={`/dashboard/packs/${p.id}`}
                  className="btn-rough px-3 py-1.5 text-xs font-semibold"
                >
                  Edit
                </a>
                <button
                  onClick={() => deletePack(p.id)}
                  className="rounded-xl border-2 border-current px-3 py-1.5 text-xs opacity-50 hover:opacity-100 hover:text-[var(--destructive)] hover:border-[var(--destructive)]"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

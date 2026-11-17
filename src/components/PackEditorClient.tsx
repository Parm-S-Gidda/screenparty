"use client";

import { useState } from "react";

type Question = {
  id: string;
  question_text: string;
  correct_answer: string;
  accepted_answers: string[];
  difficulty: string;
};

type Pack = { id: string; title: string; description: string };

type Props = {
  pack: Pack;
  initialQuestions: Question[];
  maxQuestions: number;
};

const BLANK_Q = (): Omit<Question, "id"> => ({
  question_text: "",
  correct_answer: "",
  accepted_answers: [],
  difficulty: "medium",
});

export function PackEditorClient({ pack: initial, initialQuestions, maxQuestions }: Props) {
  const [pack, setPack] = useState(initial);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [editing, setEditing] = useState<string | null>(null); // question id or "new"
  const [draft, setDraft] = useState<Omit<Question, "id">>(BLANK_Q());
  const [packTitle, setPackTitle] = useState(initial.title);
  const [savingTitle, setSavingTitle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveTitle() {
    if (packTitle.trim() === pack.title) return;
    setSavingTitle(true);
    const res = await fetch(`/api/packs/${pack.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: packTitle.trim(), description: pack.description }),
    });
    if (res.ok) {
      const data = await res.json();
      setPack(data);
    }
    setSavingTitle(false);
  }

  async function saveQuestion() {
    if (!draft.question_text.trim() || !draft.correct_answer.trim()) return;
    setBusy(true);
    setError(null);
    try {
      if (editing === "new") {
        const res = await fetch(`/api/packs/${pack.id}/questions`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(draft),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setQuestions((q) => [...q, data]);
      } else {
        const res = await fetch(`/api/packs/${pack.id}/questions/${editing}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(draft),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setQuestions((q) => q.map((x) => (x.id === editing ? data : x)));
      }
      setEditing(null);
      setDraft(BLANK_Q());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteQuestion(id: string) {
    const res = await fetch(`/api/packs/${pack.id}/questions/${id}`, { method: "DELETE" });
    if (res.ok) setQuestions((q) => q.filter((x) => x.id !== id));
  }

  function startEdit(q: Question) {
    setEditing(q.id);
    setDraft({ ...q });
    setError(null);
  }

  function startNew() {
    setEditing("new");
    setDraft(BLANK_Q());
    setError(null);
  }

  const DIFF_LABEL: Record<string, string> = { easy: "Easy", medium: "Med", hard: "Hard" };

  return (
    <div>
      {/* Pack title */}
      <div className="panel mb-6 overflow-hidden">
        <div className="p-4">
          <p className="font-display mb-2 text-xs uppercase tracking-widest opacity-40">Pack Title</p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border-2 border-current bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
              value={packTitle}
              onChange={(e) => setPackTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === "Enter" && saveTitle()}
              maxLength={60}
            />
            {savingTitle && <span className="self-center text-xs opacity-40">Saving…</span>}
          </div>
        </div>
      </div>

      {/* Question editor form */}
      {editing && (
        <div className="panel mb-6 overflow-hidden">
          <div className="border-b-2 border-current p-4">
            <p className="font-display text-sm uppercase tracking-widest">
              {editing === "new" ? "Add Question" : "Edit Question"}
            </p>
          </div>
          <div className="space-y-3 p-4">
            {error && (
              <p className="rounded-lg border border-[var(--destructive)] bg-[var(--destructive)]/10 px-3 py-2 text-xs text-[var(--destructive)]">
                {error}
              </p>
            )}
            <div>
              <label className="mb-1 block text-xs opacity-50">Question</label>
              <textarea
                className="w-full rounded-xl border-2 border-current bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                rows={2}
                placeholder="What is…"
                value={draft.question_text}
                onChange={(e) => setDraft((d) => ({ ...d, question_text: e.target.value }))}
                maxLength={300}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs opacity-50">Correct Answer</label>
              <input
                className="w-full rounded-xl border-2 border-current bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="The exact answer"
                value={draft.correct_answer}
                onChange={(e) => setDraft((d) => ({ ...d, correct_answer: e.target.value }))}
                maxLength={120}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs opacity-50">Also Accept (one per line, optional)</label>
              <textarea
                className="w-full rounded-xl border-2 border-current bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                rows={2}
                placeholder={"alternate spelling\nshorthand"}
                value={draft.accepted_answers.join("\n")}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    accepted_answers: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .slice(0, 10),
                  }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs opacity-50">Difficulty</label>
              <div className="flex gap-2">
                {["easy", "medium", "hard"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDraft((x) => ({ ...x, difficulty: d }))}
                    className={`flex-1 rounded-xl border-2 border-current py-2 text-xs font-semibold capitalize transition-colors ${
                      draft.difficulty === d ? "bg-[var(--ink)] text-[var(--cream)]" : "opacity-50 hover:opacity-80"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveQuestion}
                disabled={busy || !draft.question_text.trim() || !draft.correct_answer.trim()}
                className="btn-rough flex-1 py-2 text-sm font-semibold disabled:opacity-40"
              >
                {busy ? "Saving…" : "Save Question"}
              </button>
              <button
                onClick={() => { setEditing(null); setDraft(BLANK_Q()); setError(null); }}
                className="rounded-xl border-2 border-current px-4 py-2 text-sm opacity-60 hover:opacity-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add button */}
      {!editing && questions.length < maxQuestions && (
        <button
          onClick={startNew}
          className="btn-rough mb-4 w-full py-2 text-sm font-semibold"
        >
          + Add Question
        </button>
      )}
      {!editing && questions.length >= maxQuestions && (
        <p className="mb-4 text-center text-xs opacity-40">Pack is full ({maxQuestions} questions max)</p>
      )}

      {/* Question list */}
      <div className="space-y-2">
        {questions.length === 0 && !editing && (
          <div className="panel flex items-center justify-center py-10 text-sm opacity-40">
            No questions yet — add one above.
          </div>
        )}
        {questions.map((q, i) => (
          <div key={q.id} className="panel flex items-start gap-3 p-4">
            <span className="font-score mt-0.5 shrink-0 text-xs opacity-40">{i + 1}.</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug">{q.question_text}</p>
              <p className="mt-1 text-xs opacity-60">
                <span className="font-semibold">A:</span> {q.correct_answer}
                {q.accepted_answers.length > 0 && (
                  <span className="opacity-60"> +{q.accepted_answers.length} alt</span>
                )}
                <span className="ml-2 opacity-40">{DIFF_LABEL[q.difficulty]}</span>
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => startEdit(q)}
                className="rounded-lg border border-current px-2 py-1 text-xs opacity-50 hover:opacity-100"
              >
                Edit
              </button>
              <button
                onClick={() => deleteQuestion(q.id)}
                className="rounded-lg border border-current px-2 py-1 text-xs opacity-40 hover:opacity-100 hover:text-[var(--destructive)]"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

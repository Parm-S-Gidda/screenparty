// Typed-answer judging pipeline (PRD §14): normalize → exact → accepted
// answers → local fuzzy → LLM fallback only when the local system is unsure.

import { chatComplete, openAiConfigured } from "@/lib/ai/openai";

export type JudgedBy = "local_exact" | "local_accepted_answer" | "local_fuzzy" | "llm";

export type Judgement = {
  correct: boolean;
  judgedBy: JudgedBy;
  confidence: number;
  usedLlm: boolean;
};

// Above this similarity a local fuzzy match counts as correct without
// spending a token. Anything below it goes to the LLM judge (when
// configured), so semantically-correct paraphrases like "the red planet"
// for "Mars" get credit even though their string similarity is tiny.
const FUZZY_CORRECT = 0.85;

export function normalizeAnswer(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^\p{L}\p{N}\s]/gu, "") // strip punctuation
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(the|a|an) /, "");
}

// Optimal string alignment distance: like Levenshtein but an adjacent
// transposition ("juipter" → "jupiter") costs 1 edit, since swapped letters
// are the most common typing mistake on phones.
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev2: number[] | null = null;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      let d = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d = Math.min(d, prev2![j - 2] + 1);
      }
      curr[j] = d;
    }
    prev2 = prev;
    prev = curr;
  }
  return prev[n];
}

export function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - editDistance(a, b) / maxLen;
}

export async function judgeAnswer(opts: {
  question: string;
  correctAnswer: string;
  acceptedAnswers: string[];
  submitted: string;
  allowLlm: boolean;
}): Promise<Judgement> {
  const submitted = normalizeAnswer(opts.submitted);
  const correct = normalizeAnswer(opts.correctAnswer);

  if (submitted.length === 0) {
    return { correct: false, judgedBy: "local_exact", confidence: 1, usedLlm: false };
  }

  // 1–2. exact match against the canonical answer
  if (submitted === correct) {
    return { correct: true, judgedBy: "local_exact", confidence: 1, usedLlm: false };
  }

  // 3. accepted answers list
  for (const accepted of opts.acceptedAnswers) {
    if (submitted === normalizeAnswer(accepted)) {
      return { correct: true, judgedBy: "local_accepted_answer", confidence: 1, usedLlm: false };
    }
  }

  // 4. local fuzzy comparison (typos: "juipter", "saturm")
  let best = similarity(submitted, correct);
  for (const accepted of opts.acceptedAnswers) {
    best = Math.max(best, similarity(submitted, normalizeAnswer(accepted)));
  }
  if (best >= FUZZY_CORRECT) {
    return { correct: true, judgedBy: "local_fuzzy", confidence: best, usedLlm: false };
  }
  if (!opts.allowLlm || !openAiConfigured()) {
    return { correct: false, judgedBy: "local_fuzzy", confidence: 1 - best, usedLlm: false };
  }

  // 5. no local match: ask the LLM (PRD: return only correct or incorrect)
  const verdict = await chatComplete({
    system:
      "You judge trivia answers. Given the question, the correct answer, accepted variants, and a player's typed answer, decide if the player's answer should count as correct. Be lenient with spelling and phrasing but the meaning must match. Reply with exactly one word: correct or incorrect.",
    user: `Question: ${opts.question}\nCorrect answer: ${opts.correctAnswer}\nAccepted variants: ${opts.acceptedAnswers.join(", ") || "(none)"}\nPlayer answer: ${opts.submitted}`,
    maxTokens: 3,
    temperature: 0,
  });

  if (verdict === null) {
    // LLM unavailable/failed: fall back to the strict local result
    return { correct: false, judgedBy: "local_fuzzy", confidence: 1 - best, usedLlm: false };
  }
  const isCorrect = verdict.toLowerCase().includes("correct") && !verdict.toLowerCase().includes("incorrect");
  return { correct: isCorrect, judgedBy: "llm", confidence: 0.9, usedLlm: true };
}

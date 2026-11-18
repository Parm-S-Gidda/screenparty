// POST /api/packs/generate
// Generate trivia questions using OpenAI and save them to a new custom pack.
// Requires a paid plan. Tracked under ai_pack_gen metric.

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chatComplete, openAiConfigured } from "@/lib/ai/openai";
import { getUsage, trackUsage } from "@/lib/ai/usage";
import { rateLimit } from "@/lib/rateLimit";
import { containsBlockedWord } from "@/lib/moderation";
import {
  CUSTOM_PACK_QUESTION_MAX,
  CUSTOM_PACK_TITLE_MAX,
  LIMITS,
  QUESTION_COUNT_OPTIONS,
  resolveTier,
} from "@/lib/constants";

function err(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

const SYSTEM = `You are a trivia question writer for a party game. Output ONLY a JSON array.
Each element must have exactly these fields:
  "question" (string, max 200 chars, plain text, no markdown),
  "answer"   (string, max 80 chars, the ideal correct answer),
  "accepted" (array of strings, alternate phrasings that should also count),
  "difficulty" ("easy" | "medium" | "hard")
Rules:
- Questions must be factual and unambiguous.
- No offensive content, slurs, or graphic material.
- No questions about living people's private lives.
- No duplicate questions.
- Output ONLY the JSON array, no prose before or after.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err(401, "Sign in first");
  if (!await rateLimit(`pack-gen:${user.id}`, 3, 60_000)) return err(429, "Slow down");

  if (!openAiConfigured()) return err(503, "AI question generation is not configured");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("plan_tier, day_pass_expires_at")
    .eq("id", user.id)
    .single();
  const tier = resolveTier(profile);
  const tierLimits = LIMITS[tier];

  if (tierLimits.aiPackGenPerMonth === 0)
    return err(403, "AI question generation requires a paid plan");
  if ((await getUsage(admin, user.id, "ai_pack_gen")) >= tierLimits.aiPackGenPerMonth)
    return err(403, "You've used all your AI pack generations this month");

  const body = await request.json();
  const topic = String(body.topic ?? "").trim().slice(0, 100);
  if (!topic) return err(400, "Provide a topic");
  if (containsBlockedWord(topic)) return err(400, "Keep the topic friendly");

  const count = QUESTION_COUNT_OPTIONS.includes(Number(body.count) as 5) && Number(body.count) <= tierLimits.maxQuestions
    ? Number(body.count)
    : 10;
  const difficulty: string = ["easy", "medium", "hard", "mixed"].includes(String(body.difficulty))
    ? String(body.difficulty)
    : "mixed";

  const difficultyLine = difficulty === "mixed"
    ? "Mix easy, medium and hard questions."
    : `All questions should be ${difficulty} difficulty.`;

  const raw = await chatComplete({
    system: SYSTEM,
    user: `Topic: ${topic}\nCount: ${count}\n${difficultyLine}`,
    maxTokens: count * 120,
    temperature: 0.8,
    timeoutMs: 30_000,
  });

  if (!raw) return err(502, "AI generation failed, try again");

  let parsed: unknown[];
  try {
    // strip any accidental markdown fences before parsing
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("not an array");
  } catch {
    return err(502, "AI returned malformed data, try again");
  }

  // Validate each question
  const questions: { question_text: string; correct_answer: string; accepted_answers: string[]; difficulty: string }[] = [];
  for (const item of parsed.slice(0, Math.min(count, CUSTOM_PACK_QUESTION_MAX))) {
    if (typeof item !== "object" || item === null) continue;
    const q = item as Record<string, unknown>;
    const question_text = String(q.question ?? "").trim().slice(0, 300);
    const correct_answer = String(q.answer ?? "").trim().slice(0, 120);
    if (!question_text || !correct_answer) continue;
    if (containsBlockedWord(question_text) || containsBlockedWord(correct_answer)) continue;
    const accepted = Array.isArray(q.accepted)
      ? (q.accepted as unknown[]).map((a) => String(a).trim().slice(0, 120)).filter(Boolean).slice(0, 10)
      : [];
    const diff = ["easy", "medium", "hard"].includes(String(q.difficulty))
      ? String(q.difficulty)
      : "medium";
    questions.push({ question_text, correct_answer, accepted_answers: accepted, difficulty: diff });
  }

  if (questions.length === 0) return err(502, "AI returned no usable questions, try again");

  // Create the pack and insert questions
  const packTitle = `${topic} — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`.slice(0, CUSTOM_PACK_TITLE_MAX);
  const { data: pack, error: packErr } = await admin
    .from("custom_packs")
    .insert({ host_user_id: user.id, title: packTitle, description: `AI-generated: ${topic}` })
    .select("id, title")
    .single();
  if (packErr) return err(500, packErr.message);

  const { error: qErr } = await admin
    .from("custom_pack_questions")
    .insert(questions.map((q) => ({ pack_id: pack.id, ...q })));
  if (qErr) return err(500, qErr.message);

  await trackUsage(admin, user.id, "ai_pack_gen", 1);

  return Response.json({
    packId: pack.id,
    title: pack.title,
    questionCount: questions.length,
  }, { status: 201 });
}

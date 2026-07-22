// Minimal OpenAI chat wrapper (no SDK dependency). Returns null when no API
// key is configured so callers can fall back gracefully.

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export function openAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function chatComplete(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        max_tokens: opts.maxTokens ?? 80,
        temperature: opts.temperature ?? 0.8,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("OpenAI error", res.status, await res.text());
      return null;
    }
    const body = await res.json();
    const text = body.choices?.[0]?.message?.content;
    return typeof text === "string" ? text.trim() : null;
  } catch (err) {
    console.error("OpenAI request failed", err);
    return null;
  }
}

// ElevenLabs voice with caching (PRD §13): every generated clip is cached in
// the voice_clips table + Supabase Storage keyed by voice+text hash, so common
// lines are never regenerated. Returns null when no API key, captions only.

import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // ElevenLabs premade "George"
const VOICE_BUCKET = "voice";

export function elevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

// The turbo TTS model trips over stagey punctuation (em dashes, ellipses,
// terse fragments) and can hallucinate extra mumbled words. Speak a smoothed
// version; the on-screen caption keeps the original styling.
function speechText(text: string): string {
  return text
    .replace(/\s*[-–]\s*/g, ", ")
    .replace(/…/g, ", ")
    .replace(/\.{3}/g, ", ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/,([,.!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getVoiceClip(
  admin: SupabaseClient,
  text: string
): Promise<{ audioUrl: string; cached: boolean; characters: number } | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID;
  const spoken = speechText(text);
  const cacheKey = createHash("sha256").update(`${voiceId}:${spoken}`).digest("hex");

  const { data: cachedClip } = await admin
    .from("voice_clips")
    .select("audio_url")
    .eq("cache_key", cacheKey)
    .maybeSingle();
  if (cachedClip?.audio_url) {
    return { audioUrl: cachedClip.audio_url, cached: true, characters: 0 };
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "content-type": "application/json" },
        body: JSON.stringify({
          text: spoken,
          model_id: process.env.ELEVENLABS_MODEL_ID ?? "eleven_turbo_v2_5",
          // higher stability keeps short game-show lines from wandering into
          // hallucinated extra syllables
          voice_settings: { stability: 0.7, similarity_boost: 0.75 },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!res.ok) {
      console.error("ElevenLabs error", res.status, await res.text());
      return null;
    }
    const audio = Buffer.from(await res.arrayBuffer());

    const path = `${cacheKey}.mp3`;
    const { error: uploadError } = await admin.storage
      .from(VOICE_BUCKET)
      .upload(path, audio, { contentType: "audio/mpeg", upsert: true });
    if (uploadError) {
      console.error("voice upload failed", uploadError);
      return null;
    }
    const {
      data: { publicUrl },
    } = admin.storage.from(VOICE_BUCKET).getPublicUrl(path);

    await admin.from("voice_clips").insert({
      cache_key: cacheKey,
      text: spoken,
      voice_provider: "elevenlabs",
      voice_id: voiceId,
      audio_url: publicUrl,
    });

    return { audioUrl: publicUrl, cached: false, characters: text.length };
  } catch (err) {
    console.error("ElevenLabs request failed", err);
    return null;
  }
}

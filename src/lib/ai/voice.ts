// ElevenLabs voice with caching (PRD §13): every generated clip is cached in
// the voice_clips table + Supabase Storage keyed by voice+text hash, so common
// lines are never regenerated. Returns null when no API key, captions only.

import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // ElevenLabs premade "George"
const VOICE_BUCKET = "voice";

/** Returns the ElevenLabs voice ID for the given host personality. Falls back
 *  to ELEVENLABS_VOICE_ID, then the George default. Configure per-personality
 *  IDs via ELEVENLABS_VOICE_ID_PRO / _COMEDIAN / _UNHINGED in .env.local. */
export function personalityVoiceId(personality?: string): string {
  const env =
    personality === "pro" ? process.env.ELEVENLABS_VOICE_ID_PRO :
    personality === "comedian" ? process.env.ELEVENLABS_VOICE_ID_COMEDIAN :
    personality === "unhinged" ? process.env.ELEVENLABS_VOICE_ID_UNHINGED :
    undefined;
  return env ?? process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID;
}

export function elevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

// Expand unit abbreviations ElevenLabs mispronounces.
function expandUnits(text: string): string {
  return text
    .replace(/\bkm\/h\b/gi, "kilometers per hour")
    .replace(/\bkm\b/g, "kilometers")
    .replace(/\bkg\b/g, "kilograms")
    .replace(/\bUSD\b/g, "dollars")
    .replace(/\bm\/s\b/gi, "meters per second");
}

// Convert comma-formatted large numbers to spoken shorthand so ElevenLabs
// doesn't read "215,000,000" as "215 thousand thousand".
function expandNumbers(text: string): string {
  return text.replace(/\b(\d{1,3}(?:,\d{3})+)\b/g, (_, s) => {
    const n = parseFloat(s.replace(/,/g, ""));
    if (n >= 1_000_000_000) {
      const v = n / 1_000_000_000;
      return `${Number.isInteger(v) ? v : v.toFixed(1)} billion`;
    }
    if (n >= 1_000_000) {
      const v = n / 1_000_000;
      return `${Number.isInteger(v) ? v : v.toFixed(1)} million`;
    }
    return s.replace(/,/g, ""); // strip commas; ElevenLabs reads 4-digit groups fine
  });
}

// The turbo TTS model trips over stagey punctuation (em dashes, ellipses,
// terse fragments) and can hallucinate extra mumbled words. Speak a smoothed
// version; the on-screen caption keeps the original styling.
function speechText(text: string): string {
  return expandUnits(expandNumbers(text))
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
  text: string,
  voiceId?: string
): Promise<{ audioUrl: string; cached: boolean; characters: number } | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

  const resolvedVoiceId = voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID;
  const spoken = speechText(text);
  const cacheKey = createHash("sha256").update(`${resolvedVoiceId}:${spoken}`).digest("hex");

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
      `https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}?output_format=mp3_44100_128`,
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
      voice_id: resolvedVoiceId,
      audio_url: publicUrl,
    });

    return { audioUrl: publicUrl, cached: false, characters: text.length };
  } catch (err) {
    console.error("ElevenLabs request failed", err);
    return null;
  }
}

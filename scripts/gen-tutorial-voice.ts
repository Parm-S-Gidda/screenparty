// Pre-generates tutorial voice clips with ElevenLabs into public/tutorials.
// Run: node --env-file=.env.local scripts/gen-tutorial-voice.ts [--force]
// shortcut: clips are named by step index and skipped when present, so after
// editing a line in src/lib/tutorials.ts rerun with --force (or delete that mp3).

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { TUTORIALS, tutorialClipUrl, type TutorialHostMode } from "../src/lib/tutorials.ts";

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("ELEVENLABS_API_KEY missing (pass --env-file=.env.local)");
  process.exit(1);
}
// same voice the Virtual Host uses with no personality picked (src/lib/ai/voice.ts)
const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";
const force = process.argv.includes("--force");

for (const [gameType, modes] of Object.entries(TUTORIALS)) {
  for (const [mode, steps] of Object.entries(modes)) {
    for (const [i, step] of steps.entries()) {
      const out = join("public", tutorialClipUrl(gameType, mode as TutorialHostMode, i));
      if (!force && existsSync(out)) continue;
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "xi-api-key": apiKey, "content-type": "application/json" },
        body: JSON.stringify({
          text: step.line,
          model_id: process.env.ELEVENLABS_MODEL_ID ?? "eleven_turbo_v2_5",
          voice_settings: { stability: 0.6, similarity_boost: 0.75, style: 0.35 },
        }),
      });
      if (!res.ok) {
        console.error(`✗ ${out}: ${res.status} ${await res.text()}`);
        process.exit(1);
      }
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, Buffer.from(await res.arrayBuffer()));
      console.log(`✓ ${out}`);
    }
  }
}

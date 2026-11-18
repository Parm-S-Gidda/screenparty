// Pre-generates tutorial voice clips with ElevenLabs into public/tutorials.
// Run: node --env-file=.env.local scripts/gen-tutorial-voice.ts [--force]
// shortcut: clips are named by step id and skipped when present, so after
// editing a line in src/lib/tutorials.ts delete that mp3 (or rerun with --force,
// which regenerates every clip). Optional filter: --game=<gameType>

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
const only = process.argv.find((a) => a.startsWith("--game="))?.slice(7);

// every step, including ones a room's settings would filter out
for (const [gameType, modes] of Object.entries(TUTORIALS)) {
  if (only && gameType !== only) continue;
  for (const [mode, steps] of Object.entries(modes)) {
    for (const step of steps) {
      const out = join("public", tutorialClipUrl(gameType, mode as TutorialHostMode, step.id));
      if (!force && existsSync(out)) continue;
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "xi-api-key": apiKey, "content-type": "application/json" },
        body: JSON.stringify({
          text: step.line,
          // v3 performs the [audio tags] in the lines; older models read them aloud
          model_id: "eleven_v3",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
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

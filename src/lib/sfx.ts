"use client";

// Game-show audio. One-shot effects and looping music play produced files
// from /public/audio; a synthesized fallback covers any effect whose file is
// missing or fails to decode. Played on the main screen only. All failures
// are silent, sound must never break the game.

export type SfxName =
  | "buzz"
  | "correct"
  | "wrong"
  | "timesup"
  | "fanfare"
  | "tick"
  | "whoosh"
  | "reveal"
  | "question"
  | "hover"
  | "click"
  | "coin" // guessers cash in (TTAL reveal)
  | "collect" // the subject rakes in fooling points (TTAL reveal)
  | "error"; // a statement is unveiled as false

const SFX_FILES: Partial<Record<SfxName, string>> = {
  buzz: "/audio/buzz.wav",
  correct: "/audio/correct.mp3",
  wrong: "/audio/incorrect.wav",
  tick: "/audio/timer-tick.wav",
  question: "/audio/question-revealed.wav",
  hover: "/audio/hover.wav",
  click: "/audio/click.wav",
  coin: "/audio/coin.wav",
  collect: "/audio/coin-collect.wav",
  error: "/audio/error.wav",
};

const SFX_VOL = 0.5;

let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// decoded-buffer cache so each file is fetched once per session
const bufferCache = new Map<string, Promise<AudioBuffer>>();

function loadBuffer(ac: AudioContext, url: string): Promise<AudioBuffer> {
  let cached = bufferCache.get(url);
  if (!cached) {
    cached = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`audio ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => ac.decodeAudioData(buf));
    cached.catch(() => bufferCache.delete(url));
    bufferCache.set(url, cached);
  }
  return cached;
}

async function playFile(ac: AudioContext, url: string, vol = SFX_VOL) {
  const buffer = await loadBuffer(ac, url);
  const source = ac.createBufferSource();
  source.buffer = buffer;
  const gain = ac.createGain();
  gain.gain.value = vol;
  source.connect(gain).connect(ac.destination);
  source.start();
}

function tone(
  ac: BaseAudioContext,
  dest: AudioNode,
  opts: {
    type: OscillatorType;
    freq: number;
    freqEnd?: number;
    at: number;
    dur: number;
    vol?: number;
  },
  base = 0
) {
  const t0 = base + opts.at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = opts.type;
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.freqEnd) osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, t0 + opts.dur);
  const vol = opts.vol ?? 0.18;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + opts.dur);
  osc.connect(gain).connect(dest);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.05);
}

// filtered white-noise burst, whooshes
function noiseBurst(
  ac: BaseAudioContext,
  dest: AudioNode,
  opts: {
    at: number;
    dur: number;
    vol?: number;
    filterFrom: number;
    filterTo?: number;
    q?: number;
  },
  base = 0
) {
  const t0 = base + opts.at;
  const len = Math.ceil(ac.sampleRate * opts.dur);
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = opts.q ?? 1;
  filter.frequency.setValueAtTime(opts.filterFrom, t0);
  if (opts.filterTo)
    filter.frequency.exponentialRampToValueAtTime(opts.filterTo, t0 + opts.dur);
  const gain = ac.createGain();
  const vol = opts.vol ?? 0.15;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + opts.dur);
  src.connect(filter).connect(gain).connect(dest);
  src.start(t0);
}

function playSynth(ac: AudioContext, name: SfxName) {
  const out = ac.destination;
  const now = ac.currentTime;
  switch (name) {
    case "buzz":
    case "question":
      tone(ac, out, { type: "sine", freq: 1046, at: 0, dur: 0.55, vol: 0.2 }, now);
      tone(ac, out, { type: "sine", freq: 1568, at: 0, dur: 0.4, vol: 0.09 }, now);
      break;
    case "correct":
      tone(ac, out, { type: "sine", freq: 660, at: 0, dur: 0.15 }, now);
      tone(ac, out, { type: "sine", freq: 880, at: 0.12, dur: 0.2 }, now);
      tone(ac, out, { type: "sine", freq: 1320, at: 0.24, dur: 0.3, vol: 0.12 }, now);
      break;
    case "wrong":
      tone(ac, out, { type: "triangle", freq: 300, freqEnd: 220, at: 0, dur: 0.25 }, now);
      tone(ac, out, { type: "triangle", freq: 220, freqEnd: 130, at: 0.28, dur: 0.45 }, now);
      break;
    case "timesup":
      tone(ac, out, { type: "square", freq: 220, at: 0, dur: 0.22, vol: 0.12 }, now);
      tone(ac, out, { type: "square", freq: 175, at: 0.3, dur: 0.4, vol: 0.12 }, now);
      break;
    case "fanfare": {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) =>
        tone(ac, out, { type: "triangle", freq, at: i * 0.14, dur: i === 3 ? 0.7 : 0.18 }, now)
      );
      tone(ac, out, { type: "sine", freq: 1319, at: 0.56, dur: 0.7, vol: 0.1 }, now);
      break;
    }
    case "tick":
      tone(ac, out, { type: "square", freq: 1250, at: 0, dur: 0.035, vol: 0.06 }, now);
      break;
    case "whoosh":
      noiseBurst(ac, out, { at: 0, dur: 0.4, vol: 0.18, filterFrom: 350, filterTo: 2600, q: 1.4 }, now);
      break;
    case "reveal":
      tone(ac, out, { type: "triangle", freq: 523, at: 0, dur: 0.14, vol: 0.14 }, now);
      tone(ac, out, { type: "triangle", freq: 784, at: 0.11, dur: 0.3, vol: 0.14 }, now);
      break;
    case "coin":
    case "collect":
      tone(ac, out, { type: "square", freq: 988, at: 0, dur: 0.08, vol: 0.1 }, now);
      tone(ac, out, { type: "square", freq: 1319, at: 0.08, dur: 0.2, vol: 0.1 }, now);
      break;
    case "error":
      tone(ac, out, { type: "square", freq: 200, freqEnd: 150, at: 0, dur: 0.28, vol: 0.1 }, now);
      break;
  }
}

// warm the decode cache ahead of a sound's first use
export function preloadSfx(name: SfxName) {
  const ac = audioContext();
  const file = SFX_FILES[name];
  if (ac && file) loadBuffer(ac, file).catch(() => {});
}

// The tick file packs ~4 ticks per second, which is frantic, instead we play
// just its first tick transient once per second on our own clock, so the
// audio matches the countdown pace and stops the instant the window closes.
let tickTimer: ReturnType<typeof setInterval> | null = null;
let tickWanted = false;

export async function startTicking() {
  const ac = audioContext();
  const file = SFX_FILES.tick;
  if (!ac || !file || tickTimer || tickWanted) return;
  tickWanted = true;
  try {
    const buffer = await loadBuffer(ac, file);
    if (!tickWanted || tickTimer) return; // stopped while loading
    const playOne = () => {
      try {
        const src = ac.createBufferSource();
        src.buffer = buffer;
        const gain = ac.createGain();
        gain.gain.value = SFX_VOL;
        src.connect(gain).connect(ac.destination);
        src.start(0, 0, 0.2); // first tick transient only
      } catch {
        // ignore
      }
    };
    playOne();
    tickTimer = setInterval(playOne, 750);
  } catch {
    // silence is fine
  }
}

export function stopTicking() {
  tickWanted = false;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

export function playSfx(name: SfxName) {
  const ac = audioContext();
  if (!ac) return;
  try {
    const file = SFX_FILES[name];
    if (file) {
      playFile(ac, file).catch(() => playSynth(ac, name));
    } else {
      playSynth(ac, name);
    }
  } catch {
    // never let sound break the game
  }
}

// ---------------------------------------------------------------------------
// Background music per phase: produced tracks for the lobby and end screen,
// and a synthesized 8-second chiptune loop (C–G–Am–F at 120bpm) in-game.
// Ducked while the host talks.

export type MusicTrack = "lobby" | "game" | "end";

const MUSIC_FILES: Partial<Record<MusicTrack, string>> = {
  lobby: "/audio/lobby.wav",
  end: "/audio/end-screen.mp3",
};
// the synth loop is much quieter than the produced tracks
const MUSIC_VOLS: Record<MusicTrack, number> = { lobby: 0.3, game: 0.5, end: 0.35 };
const DUCK_FACTOR = 0.3;

let musicBuffer: AudioBuffer | null = null; // rendered chiptune (game track)
let music: { track: MusicTrack; source: AudioBufferSourceNode; gain: GainNode } | null = null;
let musicStarting: MusicTrack | null = null;
let musicDucked = false;

// user-set music volume (0–1), persisted per browser; multiplies the
// per-track base volume
const MUSIC_VOL_KEY = "screenparty_music_volume";
let userMusicVol: number | null = null;

export function getMusicVolume(): number {
  if (userMusicVol === null) {
    userMusicVol = 1;
    try {
      const stored = window.localStorage.getItem(MUSIC_VOL_KEY);
      if (stored !== null) {
        const v = Number(stored);
        if (Number.isFinite(v)) userMusicVol = Math.min(Math.max(v, 0), 1);
      }
    } catch {
      // no storage: default volume
    }
  }
  return userMusicVol;
}

export function setMusicVolume(v: number) {
  userMusicVol = Math.min(Math.max(v, 0), 1);
  try {
    window.localStorage.setItem(MUSIC_VOL_KEY, String(userMusicVol));
  } catch {
    // no storage: volume just won't persist
  }
  rampMusicToTarget(0.15);
}

function musicTargetVol(track: MusicTrack): number {
  return MUSIC_VOLS[track] * getMusicVolume() * (musicDucked ? DUCK_FACTOR : 1);
}

function rampMusicToTarget(seconds: number) {
  const ac = ctx;
  if (!ac || !music) return;
  try {
    music.gain.gain.cancelScheduledValues(ac.currentTime);
    music.gain.gain.setValueAtTime(music.gain.gain.value, ac.currentTime);
    music.gain.gain.linearRampToValueAtTime(musicTargetVol(music.track), ac.currentTime + seconds);
  } catch {
    // silence is fine
  }
}

async function buildMusicBuffer(sampleRate: number): Promise<AudioBuffer> {
  const beat = 0.5; // 120 bpm
  const bars = 4;
  const total = bars * 4 * beat; // 8s
  const off = new OfflineAudioContext(2, Math.ceil(sampleRate * total), sampleRate);
  const out = off.destination;

  // chord roots (bass) and triads (arp), one chord per bar: C G Am F
  const chords: { bass: number; arp: number[] }[] = [
    { bass: 65.41, arp: [261.6, 329.6, 392.0] }, // C
    { bass: 49.0, arp: [246.9, 293.7, 392.0] }, // G
    { bass: 55.0, arp: [220.0, 261.6, 329.6] }, // Am
    { bass: 43.65, arp: [174.6, 220.0, 349.2] }, // F
  ];

  chords.forEach((chord, bar) => {
    const barAt = bar * 4 * beat;
    for (let b = 0; b < 4; b++) {
      const t = barAt + b * beat;
      // bass pulse on every beat, a fifth up on beats 2/4 for bounce
      tone(off, out, {
        type: "triangle",
        freq: b % 2 === 0 ? chord.bass : chord.bass * 1.5,
        at: t,
        dur: 0.32,
        vol: 0.5,
      });
      // arpeggio eighths: root–third–fifth–third
      const seq = [chord.arp[0], chord.arp[1], chord.arp[2], chord.arp[1]];
      tone(off, out, { type: "square", freq: seq[b], at: t, dur: 0.18, vol: 0.08 });
      tone(off, out, {
        type: "square",
        freq: seq[(b + 2) % 4] * 2,
        at: t + beat / 2,
        dur: 0.14,
        vol: 0.05,
      });
      // hat tick on the off-beat
      noiseBurst(off, out, {
        at: t + beat / 2,
        dur: 0.05,
        vol: 0.12,
        filterFrom: 6000,
        q: 0.8,
      });
    }
  });

  return off.startRendering();
}

export async function startMusic(track: MusicTrack = "game") {
  const ac = audioContext();
  if (!ac || music?.track === track || musicStarting === track) return;
  try {
    musicStarting = track;
    let buffer: AudioBuffer;
    if (track === "game") {
      musicBuffer ??= await buildMusicBuffer(ac.sampleRate);
      buffer = musicBuffer;
    } else {
      buffer = await loadBuffer(ac, MUSIC_FILES[track]!);
    }
    if (musicStarting !== track) return; // superseded while loading
    stopMusic();
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(musicTargetVol(track), ac.currentTime + 1.2);
    source.connect(gain).connect(ac.destination);
    source.start();
    music = { track, source, gain };
  } catch {
    // silence is fine
  } finally {
    if (musicStarting === track) musicStarting = null;
  }
}

export function stopMusic() {
  const ac = ctx;
  musicStarting = null;
  if (!ac || !music) return;
  try {
    const { source, gain } = music;
    music = null;
    gain.gain.cancelScheduledValues(ac.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.6);
    source.stop(ac.currentTime + 0.7);
  } catch {
    // already stopped
  }
}

// lower the music under the host's voice, restore after
export function duckMusic(ducked: boolean) {
  musicDucked = ducked;
  try {
    rampMusicToTarget(0.3);
  } catch {
    // ignore
  }
}

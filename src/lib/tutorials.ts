// How-to-play tutorials, played on the big screen between "Start the show!"
// and round 1. Each step is one voice line plus the demo scene drawn under it.
// Voice clips are pre-generated (scripts/gen-tutorial-voice.ts) into
// public/tutorials/<gameType>/<hostMode>/<step>.mp3, so a tutorial never costs
// a TTS call at game time. No relative/alias imports: the script imports this
// file directly with Node's type stripping.

export type TutorialHostMode = "virtual" | "self";

export type TutorialStep = { scene: string; line: string };

export const TUTORIALS: Record<string, Record<TutorialHostMode, TutorialStep[]>> = {
  num: {
    virtual: [
      { scene: "welcome", line: "Welcome to Number Crunch! The game that finds out exactly how weird your friends' brains are. I'm your host. This takes one minute, I promise." },
      { scene: "theme", line: "Every round has a theme and a scale. Say, spicy foods. One is basically milk. Ten is call an ambulance." },
      { scene: "guesser", line: "One of you is the Guesser. The Guesser sees the theme, and absolutely nothing else. Like a tourist with no map." },
      { scene: "numbers", line: "Everyone else gets a secret number from one to ten on their phone. Do not show anyone. Yes, I'm looking at you." },
      { scene: "examples", line: "Then type something that fits your number. Got a two? Ketchup. Got a nine? Ghost pepper. Got a ten? The surface of the sun." },
      { scene: "guessing", line: "The Guesser sees every example, with no names attached, and decides where each one sits on the scale." },
      { scene: "reveal", line: "Then, the reveal. Nail it exactly and whoever wrote it scores two hundred. Off by one, a hundred. Off by two, fifty. Any further, and we simply don't talk about it." },
      { scene: "guesserScore", line: "The Guesser scores for accuracy too, so everybody wants the Guesser to win. It's teamwork. Mostly." },
      { scene: "finale", line: "Everyone gets a turn as the Guesser, and the most points wins. I'll run the show, you bring the chaos. Let's crunch some numbers!" },
    ],
    self: [
      { scene: "welcome", line: "Welcome to Number Crunch! The game that finds out exactly how weird your friends' brains are. Your host is running the show tonight, so be nice to them." },
      { scene: "theme", line: "Every round has a theme and a scale. Say, spicy foods. One is basically milk. Ten is call an ambulance." },
      { scene: "guesser", line: "One of you is the Guesser. The Guesser sees the theme, and absolutely nothing else. Like a tourist with no map." },
      { scene: "numbers", line: "Everyone else gets a secret number from one to ten on their phone. Do not show anyone. Yes, we're all looking at you." },
      { scene: "examples", line: "Then type something that fits your number. Got a two? Ketchup. Got a nine? Ghost pepper. Got a ten? The surface of the sun." },
      { scene: "guessing", line: "The Guesser sees every example, with no names attached, and decides where each one sits on the scale." },
      { scene: "reveal", line: "Then, the reveal. Nail it exactly and whoever wrote it scores two hundred. Off by one, a hundred. Off by two, fifty. Any further, and we simply don't talk about it." },
      { scene: "guesserScore", line: "The Guesser scores for accuracy too, so everybody wants the Guesser to win. It's teamwork. Mostly." },
      { scene: "finale", line: "Your host taps Next on the big screen between rounds, and can skip anyone who's taking forever. Everyone guesses once, most points wins. Let's crunch some numbers!" },
    ],
  },
};

export function getTutorial(gameType: string, hostMode: TutorialHostMode): TutorialStep[] | null {
  return TUTORIALS[gameType]?.[hostMode] ?? null;
}

export function tutorialClipUrl(gameType: string, hostMode: TutorialHostMode, step: number): string {
  return `/tutorials/${gameType}/${hostMode}/${step}.mp3`;
}

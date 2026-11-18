// How-to-play tutorials, played on the big screen between "Start the show!"
// and round 1. Each step is one voice line plus the demo scene drawn under it.
// Voice clips are pre-generated (scripts/gen-tutorial-voice.ts) into
// public/tutorials/<gameType>/<hostMode>/<step id>.mp3, so a tutorial never
// costs a TTS call at game time. No relative/alias imports: the script imports
// this file directly with Node's type stripping.
//
// KEEP IN SYNC: every line here restates real rules (points, timers, who taps
// what). When a game's engine, scoring constants or screens change, update its
// script and scenes, then regenerate the changed clips. See docs/TUTORIALS.md.

export type TutorialHostMode = "virtual" | "self";

/** The room settings a script can branch on (a subset of GameSettings). */
export type TutorialSettings = {
  teamsEnabled?: boolean;
  retriesEnabled?: boolean;
  autoSkip?: boolean;
  variation?: string;
};

export type TutorialStep = {
  /** stable clip name: filtering steps never shifts which clip plays */
  id: string;
  scene: string;
  line: string;
  /** only play this step when the room's settings match */
  when?: (s: TutorialSettings) => boolean;
};

const lies = (s: TutorialSettings) => s.variation === "two_lies";
const truths = (s: TutorialSettings) => !lies(s);

export const TUTORIALS: Record<string, Record<TutorialHostMode, TutorialStep[]>> = {
  num: {
    virtual: [
      { id: "welcome", scene: "welcome", line: "[excited] Welcome to Number Crunch! Before we start, a quick how-to for the game where your friends' brains disagree about absolutely everything." },
      { id: "theme", scene: "theme", line: "[playfully] First, the theme is spicy foods, with one meaning basically milk and ten meaning call an ambulance. Deliciously alarming." },
      { id: "guesser", scene: "guesser", line: "Sam's our Guesser, seeing only the theme and the one to ten scale. No secret numbers, no clues, and absolutely no detective training." },
      { id: "numbers", scene: "numbers", line: "Meanwhile, everyone else gets a secret number between one and ten on their phone. Keep it hidden, you lovable oversharers." },
      { id: "examples", scene: "examples", line: "Next, match your secret number with an example: two is ketchup, nine is ghost pepper, and ten is the surface of the sun. Sensible." },
      { id: "guessing", scene: "guessing", line: "Now Sam places the anonymous examples on the scale. No names, no hints, just the terrifying responsibility of judging ketchup." },
      { id: "reveal", scene: "reveal", line: "Here's the reveal: an exact match earns the writer two hundred, one away earns a hundred, two away earns fifty, and anything farther earns zero." },
      { id: "guesserScore", scene: "guesserScore", line: "And Sam scores for overall guessing accuracy too. That's right, our detective gets points for actually solving the case." },
      { id: "finale", scene: "finale", line: "Everyone gets one turn as Guesser, and most points wins; I'll keep things moving. [excited] Tutorial over, let's play for real!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", line: "Welcome to Number Crunch! Here's a quick tutorial before the game where your host handles the buttons and you handle the questionable opinions." },
      { id: "theme", scene: "theme", line: "[playfully] First, the theme is spicy foods, with one meaning basically milk and ten meaning call an ambulance. Deliciously alarming." },
      { id: "guesser", scene: "guesser", line: "Sam's our Guesser, seeing only the theme and the one to ten scale. No secret numbers, no clues, and absolutely no detective training." },
      { id: "numbers", scene: "numbers", line: "Meanwhile, everyone else gets a secret number between one and ten on their phone. Keep it hidden, you lovable oversharers." },
      { id: "examples", scene: "examples", line: "Next, match your secret number with an example: two is ketchup, nine is ghost pepper, and ten is the surface of the sun. Sensible." },
      { id: "guessing", scene: "guessing", line: "Now Sam places the anonymous examples on the scale. No names, no hints, just the terrifying responsibility of judging ketchup." },
      { id: "reveal", scene: "reveal", line: "Here's the reveal: an exact match earns the writer two hundred, one away earns a hundred, two away earns fifty, and anything farther earns zero." },
      { id: "guesserScore", scene: "guesserScore", line: "And Sam scores for overall guessing accuracy too. That's right, our detective gets points for actually solving the case." },
      { id: "finale", scene: "finale", line: "Everyone guesses once and most points wins; your host taps Next on the big screen and can skip stragglers. [excited] Tutorial over, let's play!" },
    ],
  },

  // engine.ts: ATTEMPT_POINTS 100/75/50/25/10, a miss costs what it was worth
  buzz_trivia: {
    virtual: [
      { id: "welcome", scene: "welcome", line: "[excited] Welcome to Fact Frenzy! Before the real game, here's a rapid-fire tutorial to warm up your thumbs and questionable trivia knowledge." },
      { id: "question", scene: "question", line: "First, a trivia question appears on the big screen and your phone becomes a buzzer. Read quickly, then pounce like a caffeinated cat." },
      { id: "buzz", scene: "buzz", line: "Priya buzzed first, so Priya answers first; everyone else who buzzed queues up in order. Patience, eager geniuses." },
      { id: "answer", scene: "answer", line: "Priya types an answer on the phone, and I'll judge it; tiny typos are fine. I grade knowledge, not thumbs." },
      { id: "points", scene: "points", line: "Jupiter is right, and the first correct try earns a hundred points. A wrong answer loses its current value, but your score can't drop below zero." },
      { id: "retries", scene: "retries", when: (s) => !!s.retriesEnabled && !s.teamsEnabled, line: "[mischievously] With retries on, a miss passes to the next buzzer. The prize shrinks to seventy five, fifty, twenty five, then ten points." },
      { id: "teams", scene: "teams", when: (s) => !!s.teamsEnabled, line: "In team mode, it's Red versus Blue; you still earn individual points, and they also add to your team's total. Shared glory!" },
      { id: "steal", scene: "steal", when: (s) => !!s.teamsEnabled && !!s.retriesEnabled, line: "In team retries, a miss gives the other team's next buzzer a steal worth fewer points: seventy five, fifty, twenty five, then ten. Delicious betrayal." },
      { id: "timesup", scene: "timesup", line: "If nobody buzzes before time runs out, we skip the question and reveal the answer. Even silence has consequences." },
      { id: "finale", scene: "finale", line: "Most points wins, and I'll read questions, judge typed answers, and keep score. [excited] Tutorial complete, let's play for real!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", line: "Welcome to Fact Frenzy! Here's a quick how-to before the real game, and remember, your host has the answers, so flatter them responsibly." },
      { id: "question", scene: "question", line: "First, a trivia question appears on the big screen and your phone becomes a buzzer. Read quickly, then pounce like a caffeinated cat." },
      { id: "buzz", scene: "buzz", line: "Priya buzzed first, so Priya answers first; everyone else who buzzed queues up in order. Patience, eager geniuses." },
      { id: "answer", scene: "answer", line: "Priya answers out loud while the lobby's chosen host sees the answer on their phone and taps Correct or Wrong. No pressure!" },
      { id: "points", scene: "points", line: "Jupiter is right, and the first correct try earns a hundred points. A wrong answer loses its current value, but your score can't drop below zero." },
      { id: "retries", scene: "retries", when: (s) => !!s.retriesEnabled && !s.teamsEnabled, line: "[mischievously] With retries on, a miss passes to the next buzzer. The prize shrinks to seventy five, fifty, twenty five, then ten points." },
      { id: "teams", scene: "teams", when: (s) => !!s.teamsEnabled, line: "In team mode, it's Red versus Blue; you still earn individual points, and they also add to your team's total. Shared glory!" },
      { id: "steal", scene: "steal", when: (s) => !!s.teamsEnabled && !!s.retriesEnabled, line: "In team retries, a miss gives the other team's next buzzer a steal worth fewer points: seventy five, fifty, twenty five, then ten. Delicious betrayal." },
      { id: "timesup", scene: "timesup", when: (s) => !!s.autoSkip, line: "No buzz before the clock runs out? With auto skip on, the answer appears and we move on, a spectacular group shrug." },
      { id: "finale", scene: "finale", line: "Most points wins; your host taps Display Question and judges answers from their phone. [excited] Tutorial's done, let the real frenzy begin!" },
    ],
  },

  // ttal.ts: TTAL_POINTS 100 for spotting it, 50 per voter fooled
  ttal: {
    virtual: [
      { id: "welcome", scene: "welcome", when: truths, line: "[excited] Welcome to Two Truths and a Lie! Here's a quick how-to before the real deception begins, so practice your innocent face." },
      { id: "welcome_lies", scene: "welcome", when: lies, line: "Welcome to Two Lies and a Truth! Before the real game, here's a quick tutorial where honesty is the needle in a haystack of nonsense." },
      { id: "writing", scene: "writing", when: truths, line: "First, type three statements about yourself on your phone: two truths and one lie. Make us sweat trying to spot it." },
      { id: "writing_lies", scene: "writing", when: lies, line: "First, type three statements about yourself on your phone: two lies and just one truth. Hide that tiny bit of honesty well." },
      { id: "hotseat", scene: "hotseat", line: "Next, Sam takes the hot seat as three shuffled statements appear on the big screen. [mischievously] Let the suspicious staring begin." },
      { id: "voting", scene: "voting", when: truths, line: "Now everyone except Sam taps the statement they think is the lie. [whispers] Watch that poker face for the tiniest suspicious twitch." },
      { id: "voting_lies", scene: "voting", when: lies, line: "Now everyone except Sam taps the statement they think is true. [whispers] Keep an eye on that face; it's suspiciously calm." },
      { id: "reveal", scene: "reveal", line: "Here's the reveal: spot the odd statement for a hundred points, while Sam earns fifty for every person fooled. Deception pays." },
      { id: "rounds", scene: "rounds", line: "Everyone takes a hot seat turn, then writes fresh statements for the next round. Most points wins, so keep those stories coming." },
      { id: "finale", scene: "finale", line: "I'll read the statements and keep score, while you try to sound believable. [excited] Tutorial's over, let's play for real!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", when: truths, line: "Welcome to Two Truths and a Lie! Here's a quick tutorial before the real game of three statements, one fib, and suspicious eye contact." },
      { id: "welcome_lies", scene: "welcome", when: lies, line: "Welcome to Two Lies and a Truth! Before the real game, here's a quick tutorial where honesty is the needle in a haystack of nonsense." },
      { id: "writing", scene: "writing", when: truths, line: "First, type three statements about yourself on your phone: two truths and one lie. Make us sweat trying to spot it." },
      { id: "writing_lies", scene: "writing", when: lies, line: "First, type three statements about yourself on your phone: two lies and just one truth. Hide that tiny bit of honesty well." },
      { id: "hotseat", scene: "hotseat", line: "Next, Sam takes the hot seat as three shuffled statements appear on the big screen. Sam, read them aloud without giving anything away." },
      { id: "voting", scene: "voting", when: truths, line: "Now everyone except Sam taps the statement they think is the lie. [whispers] Watch that poker face for the tiniest suspicious twitch." },
      { id: "voting_lies", scene: "voting", when: lies, line: "Now everyone except Sam taps the statement they think is true. [whispers] Keep an eye on that face; it's suspiciously calm." },
      { id: "reveal", scene: "reveal", line: "Here's the reveal: spot the odd statement for a hundred points, while Sam earns fifty for every person fooled. Deception pays." },
      { id: "rounds", scene: "rounds", line: "Everyone takes a hot seat turn, then writes fresh statements for the next round. Most points wins, so keep those stories coming." },
      { id: "finale", scene: "finale", line: "Your lobby-picked host plays too, and taps Reveal and Next round on their phone. [excited] Tutorial over, let's expose some stories!" },
    ],
  },

  // wyr.ts: WYR_POINTS 100 for calling the majority, ties score nothing
  wyr: {
    virtual: [
      { id: "welcome", scene: "welcome", line: "Welcome to Would You Rather! Before the real game, here's a quick tutorial on making difficult choices and reading your friends like very confusing books." },
      { id: "dilemma", scene: "dilemma", line: "First, two choices appear: always ten minutes late or always thirty minutes early. Either way, somebody here is already offended." },
      { id: "pick", scene: "pick", line: "On your phone, choose your side, then guess what the majority picked. [mischievously] It's a personality test with actual points." },
      { id: "teams", scene: "teams", when: (s) => !!s.teamsEnabled, line: "In teams, you predict the other team's majority instead; Red meets Blue, and Blue meets its new obsession." },
      { id: "reveal", scene: "reveal", line: "Here's the twist: predicting the majority earns a hundred, but your own choice earns nothing. A dead tie earns nobody anything; democracy takes a nap." },
      { id: "finale", scene: "finale", line: "Most points wins, and I'll run the timer while you agonize over two terrible options. [excited] Tutorial over, let's play for real!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", line: "Welcome to Would You Rather! Before we start the real game, a quick tutorial on making deeply personal decisions about entirely ridiculous things." },
      { id: "dilemma", scene: "dilemma", line: "First, two choices appear: always ten minutes late or always thirty minutes early. Either way, somebody here is already offended." },
      { id: "pick", scene: "pick", line: "On your phone, choose your side, then guess what the majority picked. [mischievously] It's a personality test with actual points." },
      { id: "teams", scene: "teams", when: (s) => !!s.teamsEnabled, line: "In teams, you predict the other team's majority instead; Red meets Blue, and Blue meets its new obsession." },
      { id: "reveal", scene: "reveal", line: "Here's the twist: predicting the majority earns a hundred, but your own choice earns nothing. A dead tie earns nobody anything; democracy takes a nap." },
      { id: "finale", scene: "finale", line: "Your host taps Reveal, then Next round, on the big screen; most points wins. [excited] Tutorial over, make those questionable choices for real!" },
    ],
  },

  // mlt.ts: MLT_POINTS 100 per voter for the top pick, 50 bonus to the top pick, ties score nothing
  mlt: {
    virtual: [
      { id: "welcome", scene: "welcome", line: "[playfully] Welcome to Most Likely To! Here's a quick tutorial before the real game reveals what your friends truly think of you." },
      { id: "prompt", scene: "prompt", line: "First, the big screen asks who's most likely to cry at a movie. [chuckles] Keep the tissues close, because this could get personal." },
      { id: "vote", scene: "vote", line: "On your phone, tap whoever fits best, but you can't vote for yourself. Nice attempt at controlling the narrative, though." },
      { id: "reveal", scene: "reveal", line: "Priya got the most votes, so everyone who picked Priya earns a hundred, and Priya gets fifty. [chuckles] What an emotional victory." },
      { id: "tie", scene: "tie", line: "But if the top vote is tied, nobody scores. Apparently this group can't agree on who needs tissues most." },
      { id: "finale", scene: "finale", line: "Most points wins; I'll deliver the prompts, and you deliver affectionate accusations. [excited] Tutorial finished, let's play for real!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", line: "Welcome to Most Likely To! Before the real game, a quick how-to on discovering who's been quietly judging whom this entire time." },
      { id: "prompt", scene: "prompt", line: "First, the big screen asks who's most likely to cry at a movie. [chuckles] Keep the tissues close, because this could get personal." },
      { id: "vote", scene: "vote", line: "On your phone, tap whoever fits best, but you can't vote for yourself. Nice attempt at controlling the narrative, though." },
      { id: "reveal", scene: "reveal", line: "Priya got the most votes, so everyone who picked Priya earns a hundred, and Priya gets fifty. [chuckles] What an emotional victory." },
      { id: "tie", scene: "tie", line: "But if the top vote is tied, nobody scores. Apparently this group can't agree on who needs tissues most." },
      { id: "finale", scene: "finale", line: "Your host taps Reveal, then Next round, on the big screen; most points wins. [excited] Tutorial over, time for real accusations!" },
    ],
  },

  // hol.ts: the majority vote is the room's answer; if it's right, the majority scores HOL_POINTS 100. CHAIN_LENGTH 10
  hol: {
    virtual: [
      { id: "welcome", scene: "welcome", line: "Welcome to Higher or Lower! Here's a quick tutorial before the real game tests your number sense and your ability to resist Googling." },
      { id: "items", scene: "items", line: "First up, piano keys versus bones in an adult human body, with both numbers hidden. [playfully] Trust those extremely scientific instincts." },
      { id: "vote", scene: "vote", line: "On your phone, vote whether the number on the right is higher or lower than the left. Commit to a direction." },
      { id: "reveal", scene: "reveal", line: "The majority said higher and nailed it, earning each majority voter a hundred points. Wrong majority or a tie means zero, even for correct dissenters." },
      { id: "chain", scene: "chain", line: "Next, bones slide left with two hundred six showing, and countries in the world becomes the new challenger. The chain continues." },
      { id: "finale", scene: "finale", line: "Ten rounds, most points wins, and I'll keep the comparisons coming. [excited] Tutorial complete, let's test those mathematical hunches for real!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", line: "Welcome to Higher or Lower! First, a speedy tutorial, then ten rounds of pretending your guesses are backed by research." },
      { id: "items", scene: "items", line: "First up, piano keys versus bones in an adult human body, with both numbers hidden. [playfully] Trust those extremely scientific instincts." },
      { id: "vote", scene: "vote", line: "On your phone, vote whether the number on the right is higher or lower than the left. Commit to a direction." },
      { id: "reveal", scene: "reveal", line: "The majority said higher and nailed it, earning each majority voter a hundred points. Wrong majority or a tie means zero, even for correct dissenters." },
      { id: "chain", scene: "chain", line: "Next, bones slide left with two hundred six showing, and countries in the world becomes the new challenger. The chain continues." },
      { id: "finale", scene: "finale", line: "Your host taps Reveal, then Next, on the big screen; ten rounds, most points wins. [excited] Tutorial over, let's compare for real!" },
    ],
  },

  // gtp.ts: GTP_POINTS 100 per correct guess, 50 to the writer per person fooled
  gtp: {
    virtual: [
      { id: "welcome", scene: "welcome", line: "Welcome to Guess the Player! Here's a quick tutorial before the real game of anonymous confessions and deeply questionable detective work." },
      { id: "prompt", scene: "prompt", line: "First, everyone sees the same question on the big screen: what's a weird food combination you actually love? [mischievously] No judgment, yet." },
      { id: "answer", scene: "answer", line: "Type your answer on your phone without your name attached. [mischievously] Finally, a safe place to admit your culinary crimes." },
      { id: "guess", scene: "guess", line: "Next, anonymous answers appear one at a time, like pickles dipped in peanut butter. Everyone but the writer guesses who wrote each one." },
      { id: "reveal", scene: "reveal", line: "It was Sam, so correct guesses earn a hundred points and Sam gets fifty per person fooled. [chuckles] Friendship is now a detective sport." },
      { id: "finale", scene: "finale", line: "Most points wins, and I'll handle the reveals while you handle the side-eye. [excited] Tutorial over, let's investigate for real!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", line: "Welcome to Guess the Player! Before the real game, a quick tutorial on anonymous answers and friends whose weird habits give them away." },
      { id: "prompt", scene: "prompt", line: "First, everyone sees the same question on the big screen: what's a weird food combination you actually love? [mischievously] No judgment, yet." },
      { id: "answer", scene: "answer", line: "Type your answer on your phone without your name attached. [mischievously] Finally, a safe place to admit your culinary crimes." },
      { id: "guess", scene: "guess", line: "Next, anonymous answers appear one at a time, like pickles dipped in peanut butter. Everyone but the writer guesses who wrote each one." },
      { id: "reveal", scene: "reveal", line: "It was Sam, so correct guesses earn a hundred points and Sam gets fifty per person fooled. [chuckles] Friendship is now a detective sport." },
      { id: "finale", scene: "finale", line: "Your host taps Reveal and Next on the big screen; most points wins. [excited] Tutorial over, time to expose those suspicious snacks!" },
    ],
  },

  // tank.ts: TANK_POINTS 75 per investor, pitch = 2x answer time (60s default; AI host lets it change), everyone pitches once
  tank: {
    virtual: [
      { id: "welcome", scene: "welcome", line: "Welcome to Shark Tank! Here's a quick tutorial before you pitch ridiculous inventions to friends with very imaginary investment portfolios." },
      { id: "product", scene: "product", line: "Each round, a random product appears on the TV and pitcher's phone. Marcus gets SnoozeShield, an alarm clock that locks your phone until you walk to the kitchen." },
      { id: "pitch", scene: "pitch", line: "Marcus pitches SnoozeShield out loud until the timer runs out; [playfully] invent features and fake testimonials with unstoppable confidence. That's your entire business plan." },
      { id: "invest", scene: "invest", line: "Then everyone else becomes a shark and taps Invest or Pass on their phone. [deadpan] The stakes have never been more imaginary." },
      { id: "reveal", scene: "reveal", line: "Two sharks invested, so Marcus earns a hundred and fifty points, at seventy five per investor. [chuckles] The market has spoken." },
      { id: "finale", scene: "finale", line: "Everyone pitches once and most points wins; I'll keep the clock running and the deals moving. [excited] Tutorial over, let's do business for real!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", line: "Welcome to Shark Tank! Before the real game, here's a quick how-to for selling questionable products to even more questionable investors." },
      { id: "product", scene: "product", line: "Each round, a random product appears on the TV and pitcher's phone. Marcus gets SnoozeShield, an alarm clock that locks your phone until you walk to the kitchen." },
      { id: "pitch", scene: "pitch", line: "Marcus has one minute to pitch SnoozeShield out loud; [playfully] invent features and fake testimonials with unstoppable confidence. That's your entire business plan." },
      { id: "invest", scene: "invest", line: "Then everyone else becomes a shark and taps Invest or Pass on their phone. [deadpan] The stakes have never been more imaginary." },
      { id: "reveal", scene: "reveal", line: "Two sharks invested, so Marcus earns a hundred and fifty points, at seventy five per investor. [chuckles] The market has spoken." },
      { id: "finale", scene: "finale", line: "Your host ends each pitch and taps Next on the big screen; everyone pitches once and most points wins. [excited] Tutorial over, sell us something!" },
    ],
  },

  // charades.ts: CHARADES_POINTS 150 first correct guess, 100 to the actor, act = 2x answer time (60s default; AI host lets it change)
  charades: {
    virtual: [
      { id: "welcome", scene: "welcome", line: "Welcome to Charades! Here's a quick tutorial before the real game, where words are banned, arms take over, and dignity is negotiable." },
      { id: "actor", scene: "actor", line: "First, Jules sees the secret word penguin on their phone and becomes our actor. Keep it quiet; no spoilers for the waddling." },
      { id: "acting", scene: "acting", line: "Next, Jules acts until the timer runs out, with Animals on the big screen. No talking or sounds, just deeply committed penguin energy." },
      { id: "guess", scene: "guess", line: "Meanwhile, everyone else types unlimited guesses on their phones, but spelling must match exactly. [deadpan] The autocorrect gods are not playing." },
      { id: "reveal", scene: "reveal", line: "Priya guessed penguin first for a hundred and fifty, while Jules earns a hundred; if nobody guesses in time, nobody scores. [chuckles] Tough crowd." },
      { id: "finale", scene: "finale", line: "Everyone acts once and most points wins; I'll keep time, you keep quiet. [excited] Tutorial over, let's mime for real!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", line: "Welcome to Charades! Here's a quick tutorial before the real game, when your voice takes a break and your arms get the starring role." },
      { id: "actor", scene: "actor", line: "First, Jules sees the secret word penguin on their phone and becomes our actor. Keep it quiet; no spoilers for the waddling." },
      { id: "acting", scene: "acting", line: "Next, Jules has one minute to act, with Animals on the big screen. No talking or sounds, just deeply committed penguin energy." },
      { id: "guess", scene: "guess", line: "Meanwhile, everyone else types unlimited guesses on their phones, but spelling must match exactly. [deadpan] The autocorrect gods are not playing." },
      { id: "reveal", scene: "reveal", line: "Priya guessed penguin first for a hundred and fifty, while Jules earns a hundred; if nobody guesses in time, nobody scores. [chuckles] Tough crowd." },
      { id: "finale", scene: "finale", line: "When time runs out, your host ends the round and taps Next on the big screen; everyone acts once. [excited] Tutorial over, let's play!" },
    ],
  },
};

/** The line as captioned: ElevenLabs [audio tags] are voice directions, not words. */
export function captionText(line: string): string {
  return line.replace(/\[[^\]]*\]\s*/g, "").replace(/\s{2,}/g, " ").trim();
}

export function getTutorial(gameType: string, hostMode: TutorialHostMode, settings: TutorialSettings = {}): TutorialStep[] | null {
  const steps = TUTORIALS[gameType]?.[hostMode];
  return steps ? steps.filter((s) => !s.when || s.when(settings)) : null;
}

export function tutorialClipUrl(gameType: string, hostMode: TutorialHostMode, stepId: string): string {
  return `/tutorials/${gameType}/${hostMode}/${stepId}.mp3`;
}

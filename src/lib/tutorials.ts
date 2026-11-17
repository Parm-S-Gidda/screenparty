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
      { id: "welcome", scene: "welcome", line: "Welcome to Number Crunch! The game that finds out exactly how weird your friends' brains are. I'm your host. This takes one minute, I promise." },
      { id: "theme", scene: "theme", line: "Every round has a theme and a scale. Say, spicy foods. One is basically milk. Ten is call an ambulance." },
      { id: "guesser", scene: "guesser", line: "One of you is the Guesser. The Guesser sees the theme, and absolutely nothing else. Like a tourist with no map." },
      { id: "numbers", scene: "numbers", line: "Everyone else gets a secret number from one to ten on their phone. Do not show anyone. Yes, I'm looking at you." },
      { id: "examples", scene: "examples", line: "Then type something that fits your number. Got a two? Ketchup. Got a nine? Ghost pepper. Got a ten? The surface of the sun." },
      { id: "guessing", scene: "guessing", line: "The Guesser sees every example, with no names attached, and decides where each one sits on the scale." },
      { id: "reveal", scene: "reveal", line: "Then, the reveal. Nail it exactly and whoever wrote it scores two hundred. Off by one, a hundred. Off by two, fifty. Any further, and we simply don't talk about it." },
      { id: "guesserScore", scene: "guesserScore", line: "The Guesser scores for accuracy too, so everybody wants the Guesser to win. It's teamwork. Mostly." },
      { id: "finale", scene: "finale", line: "Everyone gets a turn as the Guesser, and the most points wins. I'll run the show, you bring the chaos. Let's crunch some numbers!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", line: "Welcome to Number Crunch! The game that finds out exactly how weird your friends' brains are. Your host is running the show tonight, so be nice to them." },
      { id: "theme", scene: "theme", line: "Every round has a theme and a scale. Say, spicy foods. One is basically milk. Ten is call an ambulance." },
      { id: "guesser", scene: "guesser", line: "One of you is the Guesser. The Guesser sees the theme, and absolutely nothing else. Like a tourist with no map." },
      { id: "numbers", scene: "numbers", line: "Everyone else gets a secret number from one to ten on their phone. Do not show anyone. Yes, we're all looking at you." },
      { id: "examples", scene: "examples", line: "Then type something that fits your number. Got a two? Ketchup. Got a nine? Ghost pepper. Got a ten? The surface of the sun." },
      { id: "guessing", scene: "guessing", line: "The Guesser sees every example, with no names attached, and decides where each one sits on the scale." },
      { id: "reveal", scene: "reveal", line: "Then, the reveal. Nail it exactly and whoever wrote it scores two hundred. Off by one, a hundred. Off by two, fifty. Any further, and we simply don't talk about it." },
      { id: "guesserScore", scene: "guesserScore", line: "The Guesser scores for accuracy too, so everybody wants the Guesser to win. It's teamwork. Mostly." },
      { id: "finale", scene: "finale", line: "Your host taps Next on the big screen between rounds, and can skip anyone who's taking forever. Everyone guesses once, most points wins. Let's crunch some numbers!" },
    ],
  },

  // engine.ts: ATTEMPT_POINTS 100/75/50/25/10, a miss costs what it was worth
  buzz_trivia: {
    virtual: [
      { id: "welcome", scene: "welcome", line: "Welcome to Fact Frenzy! Fast fingers, big brains, and some truly questionable decisions. I'm your host. One minute of rules, then we play." },
      { id: "question", scene: "question", line: "A question pops up on the big screen, and your phone turns into a giant buzzer. Read fast. Smash faster." },
      { id: "buzz", scene: "buzz", line: "First to buzz gets the floor. Anyone else who buzzes lines up behind them, in order." },
      { id: "answer", scene: "answer", line: "Type your answer on your phone and I'll judge it. Small typos are fine. I'm strict, not a monster." },
      { id: "points", scene: "points", line: "Right on the first try is worth a hundred points. Wrong costs you what it was worth. So maybe don't buzz on vibes alone." },
      { id: "retries", scene: "retries", when: (s) => !!s.retriesEnabled && !s.teamsEnabled, line: "Miss it, and the next person in the buzz line gets a shot, for fewer points. Seventy five, then fifty, and so on." },
      { id: "teams", scene: "teams", when: (s) => !!s.teamsEnabled, line: "Tonight it's Team Red versus Team Blue. Your points are still yours, but they add up for your team." },
      { id: "steal", scene: "steal", when: (s) => !!s.teamsEnabled && !!s.retriesEnabled, line: "Miss it, and the other team's next buzzer gets to steal, for fewer points. Seventy five, then fifty, and so on." },
      { id: "timesup", scene: "timesup", line: "Nobody buzzes before the clock runs out? We move on. Silence is not an answer." },
      { id: "finale", scene: "finale", line: "Most points at the end wins. I'll read the questions and keep score. You just try to look smart. Let's play!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", line: "Welcome to Fact Frenzy! Fast fingers, big brains, and some truly questionable decisions. Your host is running the show tonight, so be nice to them." },
      { id: "question", scene: "question", line: "A question pops up on the big screen, and your phone turns into a giant buzzer. Read fast. Smash faster." },
      { id: "buzz", scene: "buzz", line: "First to buzz gets the floor. Anyone else who buzzes lines up behind them, in order." },
      { id: "answer", scene: "answer", line: "Shout your answer out loud. Your host, picked in the lobby, has the answer on their phone and taps right or wrong." },
      { id: "points", scene: "points", line: "Right on the first try is worth a hundred points. Wrong costs you what it was worth. So maybe don't buzz on vibes alone." },
      { id: "retries", scene: "retries", when: (s) => !!s.retriesEnabled && !s.teamsEnabled, line: "Miss it, and the next person in the buzz line gets a shot, for fewer points. Seventy five, then fifty, and so on." },
      { id: "teams", scene: "teams", when: (s) => !!s.teamsEnabled, line: "Tonight it's Team Red versus Team Blue. Your points are still yours, but they add up for your team." },
      { id: "steal", scene: "steal", when: (s) => !!s.teamsEnabled && !!s.retriesEnabled, line: "Miss it, and the other team's next buzzer gets to steal, for fewer points. Seventy five, then fifty, and so on." },
      { id: "timesup", scene: "timesup", when: (s) => !!s.autoSkip, line: "Nobody buzzes before the clock runs out? We move on. Silence is not an answer." },
      { id: "finale", scene: "finale", line: "Most points at the end wins. Your host shows each question from their phone and judges every answer. They know all the answers, so be extra nice to them. Let's play!" },
    ],
  },

  // ttal.ts: TTAL_POINTS 100 for spotting it, 50 per voter fooled
  ttal: {
    virtual: [
      { id: "welcome", scene: "welcome", when: truths, line: "Welcome to Two Truths and a Lie! Tonight we find out who in this room is a world class liar. I'm your host. Quick rules, then the fibbing begins." },
      { id: "welcome_lies", scene: "welcome", when: lies, line: "Welcome to Two Lies and a Truth! Same game, flipped upside down. Tonight we find out who can hide one true fact in a pile of nonsense. I'm your host." },
      { id: "writing", scene: "writing", when: truths, line: "First, everyone writes three statements about themselves on their phone. Two true, one lie. Make the lie believable, and the truths weird." },
      { id: "writing_lies", scene: "writing", when: lies, line: "First, everyone writes three statements about themselves on their phone. Two lies, one truth. Make the truth sound like the wildest thing up there." },
      { id: "hotseat", scene: "hotseat", line: "Then, one at a time, someone takes the hot seat. Their three statements go up on the big screen, shuffled." },
      { id: "voting", scene: "voting", when: truths, line: "Everyone else votes on their phone for the one they think is the lie. Study their face. Look for sweat." },
      { id: "voting_lies", scene: "voting", when: lies, line: "Everyone else votes on their phone for the one they think is true. Study their face. Look for sweat." },
      { id: "reveal", scene: "reveal", line: "Then, the reveal. Spot it and you score a hundred. The person in the hot seat scores fifty for every single person they fooled." },
      { id: "rounds", scene: "rounds", line: "Everyone takes a turn in the hot seat. Then you all write fresh statements for the next round. Most points at the end wins." },
      { id: "finale", scene: "finale", line: "I'll read every statement out loud and keep score. You just keep a straight face. Let the lying begin!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", when: truths, line: "Welcome to Two Truths and a Lie! Tonight we find out who in this room is a world class liar. Quick rules, then the fibbing begins." },
      { id: "welcome_lies", scene: "welcome", when: lies, line: "Welcome to Two Lies and a Truth! Same game, flipped upside down. Tonight we find out who can hide one true fact in a pile of nonsense." },
      { id: "writing", scene: "writing", when: truths, line: "First, everyone writes three statements about themselves on their phone. Two true, one lie. Make the lie believable, and the truths weird." },
      { id: "writing_lies", scene: "writing", when: lies, line: "First, everyone writes three statements about themselves on their phone. Two lies, one truth. Make the truth sound like the wildest thing up there." },
      { id: "hotseat", scene: "hotseat", line: "Then, one at a time, someone takes the hot seat. Their three statements go up on the big screen, shuffled. Hot seat, read them out loud." },
      { id: "voting", scene: "voting", when: truths, line: "Everyone else votes on their phone for the one they think is the lie. Study their face. Look for sweat." },
      { id: "voting_lies", scene: "voting", when: lies, line: "Everyone else votes on their phone for the one they think is true. Study their face. Look for sweat." },
      { id: "reveal", scene: "reveal", line: "Then, the reveal. Spot it and you score a hundred. The person in the hot seat scores fifty for every single person they fooled." },
      { id: "rounds", scene: "rounds", line: "Everyone takes a turn in the hot seat. Then you all write fresh statements for the next round. Most points at the end wins." },
      { id: "finale", scene: "finale", line: "Your host, picked in the lobby, plays too, but their phone has the buttons to reveal the votes and start the next round. Let the lying begin!" },
    ],
  },

  // wyr.ts: WYR_POINTS 100 for calling the majority, ties score nothing
  wyr: {
    virtual: [
      { id: "welcome", scene: "welcome", line: "Welcome to Would You Rather! Impossible choices, and the friends who will judge you for them. I'm your host. Let's make this quick." },
      { id: "dilemma", scene: "dilemma", line: "Every round, two choices go up. Would you rather always be ten minutes late, or always be thirty minutes early?" },
      { id: "pick", scene: "pick", line: "On your phone, pick your side. Then the twist: predict which side the majority of the room picked." },
      { id: "teams", scene: "teams", when: (s) => !!s.teamsEnabled, line: "Playing in teams? Then you predict what the other team's majority picked. Know thy enemy." },
      { id: "reveal", scene: "reveal", line: "Call the majority and you score a hundred. Your own pick doesn't matter, only reading the room. Dead tie? Nobody scores." },
      { id: "finale", scene: "finale", line: "Most points at the end wins. I'll read the choices and run the clock. You just have opinions. Let's go!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", line: "Welcome to Would You Rather! Impossible choices, and the friends who will judge you for them. Quick rules, then we play." },
      { id: "dilemma", scene: "dilemma", line: "Every round, two choices go up. Would you rather always be ten minutes late, or always be thirty minutes early?" },
      { id: "pick", scene: "pick", line: "On your phone, pick your side. Then the twist: predict which side the majority of the room picked." },
      { id: "teams", scene: "teams", when: (s) => !!s.teamsEnabled, line: "Playing in teams? Then you predict what the other team's majority picked. Know thy enemy." },
      { id: "reveal", scene: "reveal", line: "Call the majority and you score a hundred. Your own pick doesn't matter, only reading the room. Dead tie? Nobody scores." },
      { id: "finale", scene: "finale", line: "Your host taps Reveal, then Next round, on the big screen. Most points wins, and you will learn things about your friends you cannot unlearn. Let's go!" },
    ],
  },

  // mlt.ts: MLT_POINTS 100 per voter for the top pick, 50 bonus to the top pick, ties score nothing
  mlt: {
    virtual: [
      { id: "welcome", scene: "welcome", line: "Welcome to Most Likely To! The game where friendships are tested, one accusation at a time. I'm your host." },
      { id: "prompt", scene: "prompt", line: "A prompt goes up on the big screen. Who here is most likely to cry at a movie?" },
      { id: "vote", scene: "vote", line: "Vote on your phone for whoever fits best. You can't vote for yourself. Nice try." },
      { id: "reveal", scene: "reveal", line: "Vote with the room and you score a hundred. Whoever gets the most votes picks up a fifty point bonus. Congratulations? I think?" },
      { id: "tie", scene: "tie", line: "If two people tie for the most votes, nobody scores. The room has to commit." },
      { id: "finale", scene: "finale", line: "Most points at the end wins. I'll read the prompts, you point the fingers. Let's find out who you really are!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", line: "Welcome to Most Likely To! The game where friendships are tested, one accusation at a time." },
      { id: "prompt", scene: "prompt", line: "A prompt goes up on the big screen. Who here is most likely to cry at a movie?" },
      { id: "vote", scene: "vote", line: "Vote on your phone for whoever fits best. You can't vote for yourself. Nice try." },
      { id: "reveal", scene: "reveal", line: "Vote with the room and you score a hundred. Whoever gets the most votes picks up a fifty point bonus. Congratulations? I think?" },
      { id: "tie", scene: "tie", line: "If two people tie for the most votes, nobody scores. The room has to commit." },
      { id: "finale", scene: "finale", line: "Your host taps Reveal, then Next round, on the big screen. Most points wins. Let's find out who you really are!" },
    ],
  },

  // hol.ts: the majority vote is the room's answer; if it's right, the majority scores HOL_POINTS 100. CHAIN_LENGTH 10
  hol: {
    virtual: [
      { id: "welcome", scene: "welcome", line: "Welcome to Higher or Lower! Numbers, gut feelings, and absolutely no googling. I'm your host." },
      { id: "items", scene: "items", line: "Two things go up on the big screen. Say, keys on a piano, and bones in the human body. The numbers are hidden." },
      { id: "vote", scene: "vote", line: "On your phone, vote: is the one on the right higher, or lower, than the one on the left?" },
      { id: "reveal", scene: "reveal", line: "The room's majority vote is the answer. If the majority is right, everyone who voted with it scores a hundred. If it's wrong, nobody scores. Peer pressure has never paid so well." },
      { id: "chain", scene: "chain", line: "Then the right one slides over with its number showing, and a new challenger appears. It's a chain." },
      { id: "finale", scene: "finale", line: "Ten rounds, most points wins. I'll keep the chain moving, you keep guessing. Let's go!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", line: "Welcome to Higher or Lower! Numbers, gut feelings, and absolutely no googling." },
      { id: "items", scene: "items", line: "Two things go up on the big screen. Say, keys on a piano, and bones in the human body. The numbers are hidden." },
      { id: "vote", scene: "vote", line: "On your phone, vote: is the one on the right higher, or lower, than the one on the left?" },
      { id: "reveal", scene: "reveal", line: "The room's majority vote is the answer. If the majority is right, everyone who voted with it scores a hundred. If it's wrong, nobody scores. Peer pressure has never paid so well." },
      { id: "chain", scene: "chain", line: "Then the right one slides over with its number showing, and a new challenger appears. It's a chain." },
      { id: "finale", scene: "finale", line: "Your host taps Reveal, then Next, on the big screen. Ten rounds, most points wins. Let's go!" },
    ],
  },

  // gtp.ts: GTP_POINTS 100 per correct guess, 50 to the writer per person fooled
  gtp: {
    virtual: [
      { id: "welcome", scene: "welcome", line: "Welcome to Guess the Player! Anonymous answers and very suspicious friends. I'm your host, and I trust none of you." },
      { id: "prompt", scene: "prompt", line: "Everyone gets the same question. Like, what's a weird food combination you actually love?" },
      { id: "answer", scene: "answer", line: "Type your answer on your phone. No names attached. Be yourself, or be someone else entirely." },
      { id: "guess", scene: "guess", line: "Then the answers go up one at a time, and everyone guesses who wrote it. The writer sits this one out and tries not to smirk." },
      { id: "reveal", scene: "reveal", line: "Guess right and you score a hundred. The writer scores fifty for every person they fooled. So write like your friend would." },
      { id: "finale", scene: "finale", line: "Most points at the end wins. I'll run the show, you run the investigation. Let's play!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", line: "Welcome to Guess the Player! Anonymous answers and very suspicious friends." },
      { id: "prompt", scene: "prompt", line: "Everyone gets the same question. Like, what's a weird food combination you actually love?" },
      { id: "answer", scene: "answer", line: "Type your answer on your phone. No names attached. Be yourself, or be someone else entirely." },
      { id: "guess", scene: "guess", line: "Then the answers go up one at a time, and everyone guesses who wrote it. The writer sits this one out and tries not to smirk." },
      { id: "reveal", scene: "reveal", line: "Guess right and you score a hundred. The writer scores fifty for every person they fooled. So write like your friend would." },
      { id: "finale", scene: "finale", line: "Your host taps Reveal and Next on the big screen. Most points wins. Let's play!" },
    ],
  },

  // tank.ts: TANK_POINTS 75 per investor, DEFAULT_PITCH_SECONDS 60, everyone pitches once
  tank: {
    virtual: [
      { id: "welcome", scene: "welcome", line: "Welcome to Shark Tank! Ridiculous products, shameless pitches. I'm your host, and frankly, I'm already out." },
      { id: "product", scene: "product", line: "Each round, one of you gets a random product to sell. Like an alarm clock that locks your phone until you walk to the kitchen." },
      { id: "pitch", scene: "pitch", line: "You get one minute to pitch it out loud. Invent features. Make up testimonials. Lie with confidence." },
      { id: "invest", scene: "invest", line: "Everyone else is a shark. When the pitch is over, vote on your phone: invest, or pass." },
      { id: "reveal", scene: "reveal", line: "The pitcher scores seventy five for every shark who invests. Two investors? A hundred and fifty points." },
      { id: "finale", scene: "finale", line: "Everyone pitches once, and the most points wins. I'll run the clock. You run your mouth. Let's do business!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", line: "Welcome to Shark Tank! Ridiculous products, shameless pitches, and sharks with no money whatsoever." },
      { id: "product", scene: "product", line: "Each round, one of you gets a random product to sell. Like an alarm clock that locks your phone until you walk to the kitchen." },
      { id: "pitch", scene: "pitch", line: "You get one minute to pitch it out loud. Invent features. Make up testimonials. Lie with confidence." },
      { id: "invest", scene: "invest", line: "Everyone else is a shark. When the pitch is over, vote on your phone: invest, or pass." },
      { id: "reveal", scene: "reveal", line: "The pitcher scores seventy five for every shark who invests. Two investors? A hundred and fifty points." },
      { id: "finale", scene: "finale", line: "Your host ends each pitch, then taps Next on the big screen. Everyone pitches once, most points wins. Let's do business!" },
    ],
  },

  // charades.ts: CHARADES_POINTS 150 first correct guess, 100 to the actor, ACT_SECONDS 60
  charades: {
    virtual: [
      { id: "welcome", scene: "welcome", line: "Welcome to Charades! No talking, lots of flailing. I'm your host, and I will be judging the flailing." },
      { id: "actor", scene: "actor", line: "Each round, one of you is the actor. Your phone shows a secret word. Do not read it out loud. I know. It's hard." },
      { id: "acting", scene: "acting", line: "Act it out for one minute. No talking, no sound effects. The category is on the big screen to help." },
      { id: "guess", scene: "guess", line: "Everyone else types guesses on their phone, as many as you like. Spelling counts, so maybe slow down a little." },
      { id: "reveal", scene: "reveal", line: "First correct guess scores a hundred and fifty, and the actor scores a hundred. Nobody gets it in time? Nobody scores. Awkward." },
      { id: "finale", scene: "finale", line: "Everyone acts once, and the most points wins. I'll keep time. You keep it silent. Let's play!" },
    ],
    self: [
      { id: "welcome", scene: "welcome", line: "Welcome to Charades! No talking, lots of flailing." },
      { id: "actor", scene: "actor", line: "Each round, one of you is the actor. Your phone shows a secret word. Do not read it out loud. I know. It's hard." },
      { id: "acting", scene: "acting", line: "Act it out for one minute. No talking, no sound effects. The category is on the big screen to help." },
      { id: "guess", scene: "guess", line: "Everyone else types guesses on their phone, as many as you like. Spelling counts, so maybe slow down a little." },
      { id: "reveal", scene: "reveal", line: "First correct guess scores a hundred and fifty, and the actor scores a hundred. Nobody gets it in time? Nobody scores. Awkward." },
      { id: "finale", scene: "finale", line: "When the clock runs out, your host ends the round and taps Next on the big screen. Everyone acts once, most points wins. Let's play!" },
    ],
  },
};

export function getTutorial(gameType: string, hostMode: TutorialHostMode, settings: TutorialSettings = {}): TutorialStep[] | null {
  const steps = TUTORIALS[gameType]?.[hostMode];
  return steps ? steps.filter((s) => !s.when || s.when(settings)) : null;
}

export function tutorialClipUrl(gameType: string, hostMode: TutorialHostMode, stepId: string): string {
  return `/tutorials/${gameType}/${hostMode}/${stepId}.mp3`;
}

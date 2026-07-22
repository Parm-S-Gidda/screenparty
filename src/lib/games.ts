// Central source of truth for all public game data.
// Used by the marketing site (games directory, individual pages, homepage)
// and the dashboard GameCardDeck. Add a game here; the rest derives automatically.

export type GameStatus = "available" | "coming-soon";

export type PublicGame = {
  slug: string;
  name: string;
  gameType: string; // matches game_type in DB / host/new?game= param
  category: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  howItWorks: string; // one paragraph explaining the round mechanic
  scoring: string; // one paragraph explaining how points are earned
  minPlayers: number;
  virtualHostSupported: boolean;
  manualHostSupported: boolean;
  color: string; // hex accent used on cards and hero
  sticker: string; // short label on card corner
  seoTitle: string;
  seoDescription: string;
  primaryKeyword: string;
  relatedGameSlugs: string[];
  recommendedOccasionSlugs: string[];
  status: GameStatus;
  gameFaq: { q: string; a: string }[];
};

export const GAMES: PublicGame[] = [
  {
    slug: "fact-frenzy",
    name: "Fact Frenzy",
    gameType: "buzz_trivia",
    category: "Buzz-In Trivia",
    tagline: "Fastest thumb in the room takes the points.",
    shortDescription:
      "Phones become buzzers. Buzz in first, answer correctly, and capitalise when someone else misses.",
    longDescription:
      "Fact Frenzy is a buzz-in trivia game where speed matters as much as knowledge. The question appears on the big screen and everyone races to buzz in from their phone. First correct answer takes full points. Miss it and the other players get a chance to steal. The Virtual Host can read every question out loud and react to the room, so the host can play too.",
    howItWorks:
      "A question goes up on the main screen. Players tap their phone to buzz in, the fastest finger wins the right to answer. A correct answer scores points based on which attempt it was. A wrong answer opens the floor to the next buzz. The round ends when someone gets it right or all attempts are used.",
    scoring:
      "First correct answer earns 100 points. Second earns 75, third 50, fourth 25, fifth 10. If the first player buzzes in and answers wrong, the next correct answer earns full points at that position.",
    minPlayers: 1,
    virtualHostSupported: true,
    manualHostSupported: true,
    color: "#f0b429",
    sticker: "classic",
    seoTitle: "Play Fact Frenzy: Online Buzz-In Trivia | ScreenParty",
    seoDescription:
      "Buzz-in trivia on any TV or laptop. Players join from their phones, race to buzz first, and steal points when the leader misses. Free to host.",
    primaryKeyword: "online buzz-in trivia game",
    relatedGameSlugs: ["higher-or-lower", "guess-the-player", "two-truths-and-a-lie"],
    recommendedOccasionSlugs: ["house-parties", "birthday-parties", "university-events", "team-building"],
    status: "available",
    gameFaq: [
      {
        q: "Do I need a trivia question pack?",
        a: "Fact Frenzy comes with built-in questions. The host can also add their own when creating the room.",
      },
      {
        q: "What happens if no one buzzes in?",
        a: "The question auto-skips after a set time. The Virtual Host can comment on the silence.",
      },
      {
        q: "Can the host play and run the game at the same time?",
        a: "Yes. Turn on the Virtual Host and it manages every question, buzz, and transition while you play from your phone.",
      },
      {
        q: "How many questions are in a game?",
        a: "Between 5 and 25 questions depending on your plan and what you choose when setting up the room.",
      },
    ],
  },
  {
    slug: "two-truths-and-a-lie",
    name: "Two Truths & a Lie",
    gameType: "ttal",
    category: "Bluffing Game",
    tagline: "Write three statements. Fool the room. Catch everyone else's lie.",
    shortDescription:
      "Everyone writes two true things and one lie about themselves. The room votes on which statement is the lie.",
    longDescription:
      "Two Truths & a Lie is the icebreaker that never gets old. Everyone writes two true statements and one lie about themselves on their phone, then takes a turn as the subject. The rest of the room votes on which statement they think is the lie. Fool more people, score more points. Catch someone's lie, score too. A variation called Two Lies & a Truth flips the ratio for an extra challenge.",
    howItWorks:
      "Each round, one player becomes the subject. Their three statements appear on the big screen, shuffled so no one knows the order they were written. Everyone else votes for which one they think is the lie. Once all votes are in, the reveal shows who got it right and who was fooled.",
    scoring:
      "The subject earns 50 points for every person who voted for a true statement instead of the lie. Voters earn 100 points if they correctly identified the lie.",
    minPlayers: 3,
    virtualHostSupported: true,
    manualHostSupported: true,
    color: "#ee7c8e",
    sticker: "party",
    seoTitle: "Play Two Truths & a Lie Online | ScreenParty",
    seoDescription:
      "Play Two Truths and a Lie online with friends. Everyone joins from their phone. Write your statements, fool the room, catch everyone else's lie.",
    primaryKeyword: "play Two Truths and a Lie online",
    relatedGameSlugs: ["guess-the-player", "most-likely-to", "would-you-rather"],
    recommendedOccasionSlugs: ["house-parties", "birthday-parties", "team-building", "university-events"],
    status: "available",
    gameFaq: [
      {
        q: "What is the Two Lies & a Truth variation?",
        a: "Instead of two truths and one lie, players write two lies and one truth. It makes it much harder to bluff.",
      },
      {
        q: "Can players skip writing statements?",
        a: "Everyone needs to submit statements before their round starts. The host can kick or skip a player if needed.",
      },
      {
        q: "How many rounds does a game have?",
        a: "The host chooses 1 to 5 rounds. Each round every player takes a turn as the subject.",
      },
      {
        q: "Is this good for people who don't know each other well?",
        a: "It works great as an icebreaker. Unusual or surprising statements tend to spark conversations after the reveal.",
      },
    ],
  },
  {
    slug: "would-you-rather",
    name: "Would You Rather",
    gameType: "wyr",
    category: "Voting Game",
    tagline: "Pick a side, predict the majority, and see where the room stands.",
    shortDescription:
      "Pick your answer to a dilemma, then predict which side the majority of the room will choose.",
    longDescription:
      "Would You Rather turns every impossible choice into a game. A dilemma goes up on the screen. Players pick their answer and predict which side will win the majority. The reveal shows what the whole room chose and highlights every contrarian. Points go to players who predicted the majority correctly. The Virtual Host can read the options, tease the close calls, and react to shocking splits.",
    howItWorks:
      "A Would You Rather prompt appears on the main screen with two options. Every player picks one and predicts which option the majority will choose. Once everyone has answered, the results animate on screen showing the split and who predicted correctly.",
    scoring: "100 points for correctly predicting which option the majority of the room chose.",
    minPlayers: 3,
    virtualHostSupported: true,
    manualHostSupported: true,
    color: "#2fa8a0",
    sticker: "party",
    seoTitle: "Play Would You Rather Online With Friends | ScreenParty",
    seoDescription:
      "Online Would You Rather for groups. Pick your side, predict the majority, and see where the room lands. Everyone joins from their phone. Free to host.",
    primaryKeyword: "online Would You Rather multiplayer game",
    relatedGameSlugs: ["most-likely-to", "two-truths-and-a-lie", "higher-or-lower"],
    recommendedOccasionSlugs: [
      "house-parties",
      "birthday-parties",
      "virtual-parties",
      "family-game-night",
    ],
    status: "available",
    gameFaq: [
      {
        q: "Where do the Would You Rather questions come from?",
        a: "ScreenParty provides a built-in set of prompts. The host can also add custom options when setting up the room.",
      },
      {
        q: "What if the vote is exactly 50/50?",
        a: "A perfect split means nobody predicted correctly. Everyone who chose either side gets zero prediction points, which tends to get a reaction.",
      },
      {
        q: "Can it be played remotely over video call?",
        a: "Yes. Put the main screen in your video call, share it, and everyone joins from their own phone wherever they are.",
      },
      {
        q: "Is there a way to add your own custom prompts?",
        a: "Yes, the host can add custom Would You Rather prompts when configuring the room.",
      },
    ],
  },
  {
    slug: "most-likely-to",
    name: "Most Likely To",
    gameType: "mlt",
    category: "Group Voting Game",
    tagline: "Vote for who fits the prompt. Get voted for, get points.",
    shortDescription:
      "A prompt goes up and everyone votes for the player who fits it most. Voters who pick the top choice score.",
    longDescription:
      "Most Likely To is the game where the room decides who is the most likely to do something. A prompt appears and everyone votes for the person they think fits it best. The player with the most votes wins the title for that round. Voters who backed the winner score points too. Every round points fingers at someone, and everyone finds out what their friends really think.",
    howItWorks:
      "A Most Likely To prompt appears on the main screen. Players vote for one person in the room. The player with the most votes is named the winner of that round. The results screen shows the vote breakdown.",
    scoring:
      "Voters who picked the player with the most votes earn 100 points. The player who received the most votes earns 50 bonus points.",
    minPlayers: 3,
    virtualHostSupported: true,
    manualHostSupported: true,
    color: "#c084fc",
    sticker: "social",
    seoTitle: "Play Most Likely To Online | ScreenParty",
    seoDescription:
      "Online Most Likely To game for groups. Vote for who fits each prompt, see who wins each round, and score points for backing the winner. Free to host.",
    primaryKeyword: "online Most Likely To game",
    relatedGameSlugs: ["guess-the-player", "would-you-rather", "two-truths-and-a-lie"],
    recommendedOccasionSlugs: [
      "birthday-parties",
      "house-parties",
      "university-events",
      "team-building",
    ],
    status: "available",
    gameFaq: [
      {
        q: "Can players vote for themselves?",
        a: "Players cannot vote for themselves. Votes must go to another player in the room.",
      },
      {
        q: "What happens in a tie?",
        a: "If two players tie for the most votes, both receive the bonus points and both are named the winner of that round.",
      },
      {
        q: "Where do the prompts come from?",
        a: "ScreenParty provides built-in Most Likely To prompts. Hosts can also write custom prompts when setting up the room.",
      },
      {
        q: "How many rounds does a game have?",
        a: "The host chooses the number of questions when setting up. Between 5 and 25 rounds depending on the plan.",
      },
    ],
  },
  {
    slug: "higher-or-lower",
    name: "Higher or Lower",
    gameType: "hol",
    category: "Number Trivia",
    tagline: "Decide whether the next answer is higher or lower. Trust your gut.",
    shortDescription:
      "A number answer goes on the big screen. Everyone votes whether the next answer will be higher or lower.",
    longDescription:
      "Higher or Lower takes classic trivia and turns it into a chain of comparisons. An answer with a number is revealed on the big screen. Then a new question goes up and everyone votes whether the answer will be higher or lower than the one before. No one needs to know the exact number, just whether it goes up or down. Simple enough for everyone, tricky enough to be interesting.",
    howItWorks:
      "A numerical answer is shown on the main screen. A new question goes up and players vote higher or lower on their phone. Once all votes are in, the actual answer is revealed. The round continues building a chain of comparisons.",
    scoring: "Players who vote with the majority on each comparison earn 100 points.",
    minPlayers: 3,
    virtualHostSupported: true,
    manualHostSupported: true,
    color: "#34d399",
    sticker: "brain",
    seoTitle: "Play Higher or Lower Online | ScreenParty",
    seoDescription:
      "Online Higher or Lower game for groups. Vote whether each answer is higher or lower than the last. Everyone joins from their phone. Free to host.",
    primaryKeyword: "online Higher or Lower game",
    relatedGameSlugs: ["fact-frenzy", "number-rating", "would-you-rather"],
    recommendedOccasionSlugs: ["house-parties", "family-game-night", "birthday-parties"],
    status: "available",
    gameFaq: [
      {
        q: "Do players need to know the actual number?",
        a: "No. The whole point is to vote on the direction. You just need to guess whether it goes up or down.",
      },
      {
        q: "What categories do the questions cover?",
        a: "Questions span sports records, world records, geography, pop culture numbers, and general trivia.",
      },
      {
        q: "How many comparisons are in a game?",
        a: "The host chooses the question count when setting up. Between 5 and 25 questions depending on the plan.",
      },
      {
        q: "Can this be played with just two people?",
        a: "Higher or Lower needs at least 3 players so majority voting is meaningful.",
      },
    ],
  },
  {
    slug: "guess-the-player",
    name: "Guess the Player",
    gameType: "gtp",
    category: "Social Guessing Game",
    tagline: "Anonymous answers. Suspicious friends. Guess who said what.",
    shortDescription:
      "Everyone answers a question anonymously. Then the room tries to match each answer to the person who wrote it.",
    longDescription:
      "Guess the Player is part detective game, part social experiment. A question goes up on screen and everyone answers anonymously on their phone. The answers are shown without names and everyone tries to figure out who said what. The more people you fool, the more points you earn. Correctly guess who said something and you earn points too. Every round reveals something about the people in the room.",
    howItWorks:
      "A question prompt appears. Everyone types an anonymous answer on their phone. The answers are displayed on the main screen (no names shown) and players tap the answer they think each person wrote. Once guessing closes, the reveal shows who wrote what.",
    scoring:
      "100 points for correctly guessing who wrote a particular answer. The writer earns 50 points for every player who guessed wrong about their answer.",
    minPlayers: 3,
    virtualHostSupported: true,
    manualHostSupported: true,
    color: "#f472b6",
    sticker: "spy",
    seoTitle: "Play Guess the Player Online With Friends | ScreenParty",
    seoDescription:
      "Anonymous answers, then everyone guesses who said what. Online social guessing game for groups. Join from any phone. Free to host.",
    primaryKeyword: "online social guessing game",
    relatedGameSlugs: ["two-truths-and-a-lie", "most-likely-to", "would-you-rather"],
    recommendedOccasionSlugs: [
      "house-parties",
      "birthday-parties",
      "university-events",
      "virtual-parties",
    ],
    status: "available",
    gameFaq: [
      {
        q: "Are answers truly anonymous until the reveal?",
        a: "Yes. Names are hidden from both the main screen and other players' phones until the guessing phase ends.",
      },
      {
        q: "What happens if two players write the same answer?",
        a: "Identical answers are shown as separate entries. Players still need to match each one to the right person.",
      },
      {
        q: "What kind of questions does it ask?",
        a: "Questions range from preferences and opinions to hypotheticals and personal stories. Hosts can also add custom questions.",
      },
      {
        q: "Can the host play too?",
        a: "Yes. The host is also a player in Guess the Player and submits answers like everyone else.",
      },
    ],
  },
  {
    slug: "shark-tank",
    name: "Shark Tank",
    gameType: "tank",
    category: "Creative Pitching Game",
    tagline: "Pitch a ridiculous product. Let the sharks decide.",
    shortDescription:
      "Each player pitches a made-up product within a time limit. Everyone else decides whether to invest.",
    longDescription:
      "Shark Tank is the party game where creativity and salesmanship matter more than reality. Each player takes a turn pitching a made-up product within a time limit. The rest of the players are the sharks. They decide whether to invest based purely on how convincing (or entertaining) the pitch was. More investors means more points for the pitcher. Every round produces something memorable.",
    howItWorks:
      "One player is the pitcher for the round. Their phone shows them the product they need to pitch. They have a set time to make the case out loud to the room. When the timer ends, all other players vote to invest or pass. Results appear on the main screen.",
    scoring: "The pitcher earns 75 points for every player who voted to invest.",
    minPlayers: 3,
    virtualHostSupported: true,
    manualHostSupported: true,
    color: "#fb923c",
    sticker: "business",
    seoTitle: "Play Shark Tank as a Party Game Online | ScreenParty",
    seoDescription:
      "Pitch ridiculous products and win over the sharks. Online pitching party game for groups. Join from any phone. Free to host.",
    primaryKeyword: "online pitching party game",
    relatedGameSlugs: ["charades", "two-truths-and-a-lie", "number-rating"],
    recommendedOccasionSlugs: ["house-parties", "office-parties", "team-building", "birthday-parties"],
    status: "available",
    gameFaq: [
      {
        q: "Do players see the product before their pitch?",
        a: "Yes. The pitcher's phone shows them the product prompt privately before the timer starts, giving them a moment to prepare.",
      },
      {
        q: "Is there a time limit on pitches?",
        a: "Yes, pitches are timed. The limit is shown on the host screen and the pitcher's phone.",
      },
      {
        q: "Can sharks change their vote after seeing others' votes?",
        a: "No. All votes are submitted before any results are shown.",
      },
      {
        q: "Can we use custom products or prompts?",
        a: "Hosts can set up the room with custom product prompts for the pitchers.",
      },
    ],
  },
  {
    slug: "charades",
    name: "Charades",
    gameType: "charades",
    category: "Acting Game",
    tagline: "Act it out. No talking. Pray they guess.",
    shortDescription:
      "One player acts out a word or phrase with no talking. Everyone else on their phones tries to guess.",
    longDescription:
      "Charades needs no introduction, it's the classic acting game where talking is off limits. One player gets a word on their phone and acts it out in front of the room. Everyone else types their guess on their phone. Points go to the first correct guesser and to the actor when someone gets it right. Works great in person and over video call when you share the main screen.",
    howItWorks:
      "The actor gets a word or phrase on their phone. They have a set time to act it out without speaking, making sounds, mouthing words, or pointing at objects. Guessers type on their phone. The first correct guess ends the round.",
    scoring:
      "The first player to guess correctly earns 150 points. The actor earns 100 points when any player guesses correctly.",
    minPlayers: 3,
    virtualHostSupported: true,
    manualHostSupported: true,
    color: "#60a5fa",
    sticker: "action",
    seoTitle: "Play Charades Online Using Your Phones | ScreenParty",
    seoDescription:
      "Play Charades on a TV or laptop while everyone guesses from their phones. No app needed. Online charades for groups. Free to host.",
    primaryKeyword: "play Charades online with phones",
    relatedGameSlugs: ["shark-tank", "guess-the-player", "two-truths-and-a-lie"],
    recommendedOccasionSlugs: [
      "house-parties",
      "birthday-parties",
      "family-game-night",
      "virtual-parties",
    ],
    status: "available",
    gameFaq: [
      {
        q: "Can Charades be played remotely?",
        a: "Yes. The actor can appear on camera in a video call while everyone else guesses from their phones.",
      },
      {
        q: "What kind of words and phrases does it use?",
        a: "The built-in word list covers movies, TV shows, actions, animals, and common phrases. Hosts can add custom words.",
      },
      {
        q: "What if nobody guesses within the time limit?",
        a: "The round ends and neither the actor nor any guesser earns points. The answer is revealed before moving on.",
      },
      {
        q: "Does the actor's phone show the word visibly to others?",
        a: "The word only appears on the actor's phone and is not shown on the main screen until the reveal.",
      },
    ],
  },
  {
    slug: "number-rating",
    name: "Number Rating",
    gameType: "num",
    category: "Ranking Game",
    tagline: "Submit an example. Hope the Guesser places it where you intended.",
    shortDescription:
      "Everyone secretly gets a number 1–10 and submits an example to match it. One player tries to guess each example's number.",
    longDescription:
      "Number Rating is a game of calibration and creativity. Each round, one player is the Guesser. They see a category theme but no numbers. Everyone else gets a secret number between 1 and 10 and submits an example designed to sit at that exact position on the scale. The Guesser then sees all the anonymous examples and assigns a number to each. Points go to the Guesser based on how close they get.",
    howItWorks:
      "A category theme (like 'things you'd find in an office') appears on screen. Every player except the Guesser gets a secret number and submits an example to match. The Guesser sees all the examples without names or numbers and assigns a number from 1 to 10 to each one. The reveal shows how accurate the Guesser was.",
    scoring:
      "The Guesser earns 200 points for an exact match, 100 points for being within 1, and 50 points for being within 2. The Guesser also earns a base of 100 points scaled by their average accuracy across all examples.",
    minPlayers: 3,
    virtualHostSupported: true,
    manualHostSupported: true,
    color: "#a3e635",
    sticker: "scale",
    seoTitle: "Play Number Rating Online | ScreenParty",
    seoDescription:
      "Submit examples to match a secret number. The Guesser tries to place each one on a 1–10 scale. Online ranking party game for groups. Free to host.",
    primaryKeyword: "online ranking party game",
    relatedGameSlugs: ["higher-or-lower", "fact-frenzy", "shark-tank"],
    recommendedOccasionSlugs: ["house-parties", "birthday-parties", "team-building"],
    status: "available",
    gameFaq: [
      {
        q: "Does everyone take a turn as the Guesser?",
        a: "The Guesser role rotates each round so every player gets a turn.",
      },
      {
        q: "Do example writers score points?",
        a: "Example writers do not score directly in the current version. The round scoring focuses on the Guesser's accuracy.",
      },
      {
        q: "What if two players submit the same example?",
        a: "Both examples appear for the Guesser to rate. They may assign different numbers even to identical examples.",
      },
      {
        q: "What kinds of categories appear?",
        a: "Categories vary widely, from everyday objects to abstract concepts. Hosts can add custom category themes.",
      },
    ],
  },
];

// Derive a game by its slug. Returns undefined if not found.
export function getGameBySlug(slug: string): PublicGame | undefined {
  return GAMES.find((g) => g.slug === slug);
}

// Derive games by their slugs (for related-games lists).
export function getGamesBySlugs(slugs: string[]): PublicGame[] {
  return slugs.flatMap((s) => {
    const g = getGameBySlug(s);
    return g ? [g] : [];
  });
}

// All available games (excludes coming-soon entries when they exist).
export const AVAILABLE_GAMES = GAMES.filter((g) => g.status === "available");

// Central source of truth for occasion pages.
// Each occasion has unique content, not just a find-replace on the occasion name.

export type RunOfShowItem = {
  game: string; // game name
  duration: string; // e.g. "15–20 min"
  note?: string; // optional context
};

export type PublicOccasion = {
  slug: string;
  name: string;
  tagline: string;
  intro: string; // 2-3 sentences, why ScreenParty fits this occasion
  recommendedGameSlugs: string[];
  suggestedRunOfShow: RunOfShowItem[];
  runOfShowDuration: "30 min" | "60 min" | "90 min";
  groupSizeGuidance: string;
  setupTips: string[];
  contentNotes: string;
  seoTitle: string;
  seoDescription: string;
};

export const OCCASIONS: PublicOccasion[] = [
  {
    slug: "house-parties",
    name: "House Parties",
    tagline: "Keep everyone in the room until the last round.",
    intro:
      "House parties need a game that can start fast, scale to any group size, and stay alive through the night. ScreenParty runs on whatever screen you already have, a TV in the living room, a laptop on the counter, and anyone can join by typing a room code on their phone. No setup mess, no one left out.",
    recommendedGameSlugs: [
      "fact-frenzy",
      "two-truths-and-a-lie",
      "would-you-rather",
      "most-likely-to",
      "guess-the-player",
      "charades",
    ],
    suggestedRunOfShow: [
      {
        game: "Two Truths & a Lie",
        duration: "15–20 min",
        note: "Good opener, gets everyone talking about themselves without pressure.",
      },
      {
        game: "Would You Rather",
        duration: "10–15 min",
        note: "Fast-paced voting round. Works as a palate cleanser.",
      },
      {
        game: "Fact Frenzy",
        duration: "15–20 min",
        note: "Competitive buzz-in trivia lifts the energy.",
      },
      {
        game: "Guess the Player",
        duration: "15–20 min",
        note: "Great closer, anonymous answers lead to the best conversations after.",
      },
    ],
    runOfShowDuration: "60 min",
    groupSizeGuidance:
      "Works best with 5 to 20 players. Under 5, some games feel thin. Over 20, upgrade to Party+ or Pro Host for the full player count.",
    setupTips: [
      "Put the big screen somewhere everyone can see it, a mounted TV, a laptop on a counter, or a projector.",
      "Have the room code on screen before people arrive so early guests can join immediately.",
      "Turn on the Virtual Host if you want to play without managing every transition.",
      "Keep the game going between rounds, the lobby shows everyone while they wait.",
    ],
    contentNotes:
      "Most house party groups are adults. All built-in content is written for a general adult audience. Custom prompts can be as tame or as wild as the room agrees on.",
    seoTitle: "House Party Games for Groups | ScreenParty",
    seoDescription:
      "The best house party game setup: one screen, everyone's phone, no app. Run trivia, bluffing, voting, and acting games all night. Free to host.",
  },
  {
    slug: "birthday-parties",
    name: "Birthday Parties",
    tagline: "Make it about the birthday person, the room will take care of the rest.",
    intro:
      "Birthday parties have a natural subject: the person turning another year older. ScreenParty's social games, Most Likely To, Guess the Player, Two Truths & a Lie, all shine brightest when the group knows and has opinions about each other. The birthday person tends to end up in every answer whether they want to or not.",
    recommendedGameSlugs: [
      "most-likely-to",
      "guess-the-player",
      "two-truths-and-a-lie",
      "would-you-rather",
      "fact-frenzy",
      "charades",
    ],
    suggestedRunOfShow: [
      {
        game: "Guess the Player",
        duration: "15–20 min",
        note: "The birthday person's answers get centre stage in every reveal.",
      },
      {
        game: "Most Likely To",
        duration: "15–20 min",
        note: "Write prompts about the group, 'Most likely to forget their own birthday' lands every time.",
      },
      {
        game: "Two Truths & a Lie",
        duration: "15–20 min",
        note: "The birthday person can go last for a dramatic finish.",
      },
      {
        game: "Fact Frenzy",
        duration: "10–15 min",
        note: "Fast trivia round to close out with some competition.",
      },
    ],
    runOfShowDuration: "60 min",
    groupSizeGuidance:
      "Birthday gatherings tend to run 8 to 30 people. The free plan handles 5 players; upgrade to Party+ for groups up to 20, Pro Host for up to 50.",
    setupTips: [
      "Use Most Likely To to write custom prompts about the birthday person before the party.",
      "Start with games that involve everyone answering so no one is left watching.",
      "Let the birthday person choose what game comes next between rounds.",
      "Save Guess the Player for last, the reveals tend to spark the most conversation.",
    ],
    contentNotes:
      "Birthday parties vary widely by age. The built-in question banks are written for adults. For mixed-age groups, stick to custom prompts you've reviewed in advance.",
    seoTitle: "Birthday Party Games for Groups | ScreenParty",
    seoDescription:
      "Phone-controlled party games for birthday gatherings. Social voting, bluffing, and trivia all in one room code. No app needed. Free to host.",
  },
  {
    slug: "family-game-night",
    name: "Family Game Night",
    tagline: "One game, every age, zero setup.",
    intro:
      "Family game nights work best when everyone from the youngest to the oldest can follow along and no one needs a manual. ScreenParty puts the game on a TV the whole family is already watching, and everyone picks up a phone. Some games suit family groups better than others, the ones listed here lean toward accessible mechanics and lighthearted moments.",
    recommendedGameSlugs: [
      "fact-frenzy",
      "would-you-rather",
      "higher-or-lower",
      "charades",
      "two-truths-and-a-lie",
    ],
    suggestedRunOfShow: [
      {
        game: "Higher or Lower",
        duration: "10–15 min",
        note: "No knowledge required, just vote up or down. Works for every age.",
      },
      {
        game: "Would You Rather",
        duration: "10–15 min",
        note: "Simple voting with a reveal. Keeps it moving.",
      },
      {
        game: "Fact Frenzy",
        duration: "15–20 min",
        note: "Mixed-age trivia, older players may know more, but younger players can still buzz in fast.",
      },
      {
        game: "Charades",
        duration: "15–20 min",
        note: "Best closer for a family night, acting games cross all ages.",
      },
    ],
    runOfShowDuration: "60 min",
    groupSizeGuidance:
      "Family game nights tend to work well with 4 to 10 players. The free plan covers 5 players; Party+ handles groups up to 20.",
    setupTips: [
      "Use the TV in the main living room so everyone is comfortable.",
      "Higher or Lower and Would You Rather are the most accessible starting points for mixed ages.",
      "Built-in question banks are written for a general adult audience. For younger players, use custom questions you've prepared.",
      "Charades works especially well on family night, no reading required, just acting.",
    ],
    contentNotes:
      "ScreenParty does not have parental controls or a dedicated family content mode. The built-in content is written for a general adult audience. For younger players, use the custom question feature and write your own age-appropriate prompts. Games like Guess the Player and Most Likely To involve social judgement that works better with older players who know each other well.",
    seoTitle: "Family Game Night Ideas & Games | ScreenParty",
    seoDescription:
      "Browser party games for the whole family. Play trivia, charades, and voting games on a TV while everyone joins from their phone. Free to host.",
  },
  {
    slug: "team-building",
    name: "Team Building",
    tagline: "The kind of team activity people actually look forward to.",
    intro:
      "Team-building activities tend to get mixed reactions. Games where you vote, guess, and reveal things about each other work well because they create genuine moments, you learn something about a coworker rather than just doing a task together. ScreenParty runs in a browser with no installs, which means no IT approval required and no one left out.",
    recommendedGameSlugs: [
      "two-truths-and-a-lie",
      "most-likely-to",
      "guess-the-player",
      "would-you-rather",
      "fact-frenzy",
    ],
    suggestedRunOfShow: [
      {
        game: "Two Truths & a Lie",
        duration: "20–25 min",
        note: "Best icebreaker for groups that don't know each other well yet.",
      },
      {
        game: "Would You Rather",
        duration: "10–15 min",
        note: "Lighthearted between-game bridge.",
      },
      {
        game: "Most Likely To",
        duration: "15–20 min",
        note: "Use custom prompts relevant to work, but keep them appropriate.",
      },
      {
        game: "Guess the Player",
        duration: "15–20 min",
        note: "Reveals who thinks what, great conversation starter after.",
      },
    ],
    runOfShowDuration: "60 min",
    groupSizeGuidance:
      "Works well from 5 to 50 people. Large groups can split into two rooms with separate game sessions. Free plan covers 5 players; Pro Host handles 50.",
    setupTips: [
      "For remote or hybrid teams, have the host share the main screen in your video call.",
      "Prepare custom Most Likely To prompts in advance, work-appropriate ones that still get a laugh.",
      "Avoid highly personal questions in professional settings. Stick to lighter, work-adjacent prompts.",
      "Two Truths & a Lie is particularly good for onboarding new employees.",
    ],
    contentNotes:
      "For professional contexts, skip games that rely on sharp personal commentary (like Guess the Player with edgy prompts). Stick to the default prompt banks or custom questions you've reviewed. The Virtual Host tone is generally light and appropriate for mixed audiences.",
    seoTitle: "Team Building Party Games Online | ScreenParty",
    seoDescription:
      "Browser-based team building games that actually get a reaction. No app, no install. Works in person, remote, or hybrid. Free to try.",
  },
  {
    slug: "office-parties",
    name: "Office Parties",
    tagline: "No one is leaving early when there's a room code on the screen.",
    intro:
      "Office party planning gets complicated fast. ScreenParty solves the main problem: everyone needs something to do at the same time that doesn't require effort to set up or learn. Put the game on the projector or big office monitor and it runs itself, or turn on the Virtual Host and play along with everyone else.",
    recommendedGameSlugs: [
      "would-you-rather",
      "fact-frenzy",
      "two-truths-and-a-lie",
      "higher-or-lower",
      "most-likely-to",
    ],
    suggestedRunOfShow: [
      {
        game: "Higher or Lower",
        duration: "10–15 min",
        note: "Zero awkwardness, just vote up or down. Good opener.",
      },
      {
        game: "Two Truths & a Lie",
        duration: "20–25 min",
        note: "Classic icebreaker. Good for departments that don't mix often.",
      },
      {
        game: "Would You Rather",
        duration: "15 min",
        note: "Light and fast. Use standard prompts to keep it appropriate.",
      },
      {
        game: "Fact Frenzy",
        duration: "15–20 min",
        note: "A bit of healthy competition to close out.",
      },
    ],
    runOfShowDuration: "60 min",
    groupSizeGuidance:
      "Office parties often run 10 to 50 people. Pro Host supports up to 50 players per room. Larger groups can run two simultaneous rooms and compare scores.",
    setupTips: [
      "Project the main screen on a presentation monitor or wall where everyone in the venue can see it.",
      "Ask IT to confirm that screenparty.gg is accessible on the office network before the event.",
      "Stick to the standard prompt banks in professional settings to avoid awkward moments.",
      "The Virtual Host works well for office parties, it removes any pressure from the person running the event.",
    ],
    contentNotes:
      "For professional environments, avoid games that rely heavily on personal social dynamics, like Guess the Player with edgy custom prompts. The default content across all games is written for a general adult audience and is appropriate in most work contexts.",
    seoTitle: "Office Party Games for Groups | ScreenParty",
    seoDescription:
      "Phone-controlled office party games on any screen. No app, no install, no IT headache. Works in person and at virtual office parties. Free to try.",
  },
  {
    slug: "university-events",
    name: "University Events",
    tagline: "Runs on any laptop. Works on every phone. No budget required.",
    intro:
      "University events work with tight budgets, mixed groups, and venues with a projector or a monitor. ScreenParty runs entirely in the browser, needs no equipment beyond what's already there, and scales from a small dorm room to a larger common space without changing the setup. The social games work especially well for orientation weeks and events where people are still meeting each other.",
    recommendedGameSlugs: [
      "two-truths-and-a-lie",
      "most-likely-to",
      "guess-the-player",
      "would-you-rather",
      "fact-frenzy",
      "charades",
    ],
    suggestedRunOfShow: [
      {
        game: "Two Truths & a Lie",
        duration: "20–25 min",
        note: "Strongest icebreaker for orientation-style events.",
      },
      {
        game: "Most Likely To",
        duration: "15–20 min",
        note: "Prepare custom prompts about university life for the biggest laughs.",
      },
      {
        game: "Fact Frenzy",
        duration: "15–20 min",
        note: "General knowledge trivia, bring the competitive energy up.",
      },
      {
        game: "Charades",
        duration: "15 min",
        note: "Physical and easy. Good closer that doesn't need much energy.",
      },
    ],
    runOfShowDuration: "90 min",
    groupSizeGuidance:
      "Works from a small group of 5 up to 50 with Pro Host. For events larger than 50, split into multiple rooms and run parallel sessions.",
    setupTips: [
      "Any laptop connected to a projector or TV works as the main screen.",
      "Students join on their own phones, no Wi-Fi sharing or special network required.",
      "Custom Most Likely To prompts around university life ('Most likely to pull an all-nighter the night before') land best.",
      "The Virtual Host is helpful for orientation events where the organiser also wants to participate.",
    ],
    contentNotes:
      "University audiences are typically adults. All built-in content is written for a general adult audience. Orientation events specifically benefit from games that start conversation, Two Truths & a Lie and Guess the Player are the strongest choices.",
    seoTitle: "University & College Party Games | ScreenParty",
    seoDescription:
      "Browser party games for university events, orientation weeks, and residence activities. No app, no budget needed. Free to host. Runs on any laptop.",
  },
  {
    slug: "virtual-parties",
    name: "Virtual Parties",
    tagline: "Everyone on video call, game on screen, phones ready.",
    intro:
      "Virtual parties succeed when there is actually something happening, not just people talking at each other on a grid. ScreenParty works over video call by putting the main game screen in a shared window and having everyone join from their own phone. The result is a shared experience that runs exactly like an in-person game night, minus the living room.",
    recommendedGameSlugs: [
      "would-you-rather",
      "fact-frenzy",
      "two-truths-and-a-lie",
      "guess-the-player",
      "higher-or-lower",
      "charades",
    ],
    suggestedRunOfShow: [
      {
        game: "Would You Rather",
        duration: "10–15 min",
        note: "Fast, high-participation opener. Everyone is doing something immediately.",
      },
      {
        game: "Two Truths & a Lie",
        duration: "20–25 min",
        note: "Keeps the conversation going naturally after each reveal.",
      },
      {
        game: "Fact Frenzy",
        duration: "15–20 min",
        note: "Turn on the Virtual Host so the host can be on camera playing too.",
      },
      {
        game: "Guess the Player",
        duration: "15–20 min",
        note: "Great closer, the guessing phase keeps everyone engaged on camera.",
      },
    ],
    runOfShowDuration: "60 min",
    groupSizeGuidance:
      "Virtual groups work well at 5 to 20 players. Beyond 20, video calls become chaotic regardless of the game.",
    setupTips: [
      "The host shares their main ScreenParty game screen as a window in the video call, everyone can see it.",
      "Everyone joins the game from their phone and keeps the video call on another device (laptop, iPad) to see each other.",
      "Turn on the Virtual Host so the host does not have to manage game flow while also managing the video call.",
      "Charades works on video call, actors can stand up and perform while everyone else types guesses.",
      "Mute during Fact Frenzy so the Virtual Host audio comes through clearly.",
    ],
    contentNotes:
      "Virtual parties can include international or cross-timezone groups. The game content is in English. Remote play has no specific age restrictions beyond the general adult-audience design of the built-in content.",
    seoTitle: "Virtual Party Games for Online Groups | ScreenParty",
    seoDescription:
      "Play browser party games over video call. Share the screen, join on phones, and run real party games remotely. No app, no install. Free to host.",
  },
];

export function getOccasionBySlug(slug: string): PublicOccasion | undefined {
  return OCCASIONS.find((o) => o.slug === slug);
}

export function getOccasionsBySlugs(slugs: string[]): PublicOccasion[] {
  return slugs.flatMap((s) => {
    const o = getOccasionBySlug(s);
    return o ? [o] : [];
  });
}

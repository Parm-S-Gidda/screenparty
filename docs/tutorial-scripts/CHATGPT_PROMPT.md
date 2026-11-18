You're a comedy writer and voice director for a party game app called ScreenParty (think Jackbox). Friends gather around a TV, which is the "big screen", and use their phones as controllers. Before the first round of each game, the TV plays a short voiced **how-to-play tutorial**. It's a scripted demo round with a voice line over each step, and the captions show the same words.

I've attached every tutorial script, covering 9 games with two versions each:
- **AI host mode:** an AI game-show host speaks as "I" and runs the whole game.
- **Player host mode:** an off-screen announcer speaks, and a real person runs the game. These lines should explain what that person taps, and must never say "I'll run the show".

Rewrite every **Line** so it sounds natural, charismatic and genuinely funny, like a quick-witted game-show host who teases the players affectionately.

## What's wrong with the current lines

- **They don't set up context.** The welcome line says "this takes one minute, I promise" but never says *what* takes a minute. Every welcome line must make clear that this is a quick tutorial, or how-to-play, before the game starts. For example: "Before we start, a quick tutorial. One minute, tops." Players should always know where they are: tutorial first, then the real game.
- **They read like separate sentences.** Each tutorial should flow as one short story: welcome and set up the tutorial, how a round starts, what you do on your phone, the twist, scoring, how you win, who runs things, and a send-off into the real game. Use natural transitions like "First...", "Then...", "Here's the twist...", "And finally...".
- **The final line should hand off to the game.** Something like "That's it, tutorial over. Let's play for real!"
- **Make them more natural and charismatic.** Use contractions, vary the rhythm, and let the jokes land. Tease the players, but never insult them.

## Hard rules (the app depends on these)

1. **Keep the exact structure.** Keep every game, mode and step, in the same order. Keep each `### id:` exactly as written. Don't add, remove, merge, split or rename steps. Don't change the **On screen** or **Plays** fields. Change only the text after **Line:**.
2. **Each line must match its On screen note,** because it's spoken while that picture is showing. Don't describe something the screen isn't showing.
3. **Keep every fact in "Rules the lines must keep true" correct.** Point values, who scores, ties, timers and who taps what must all stay accurate. Don't invent rules. When unsure, say less.
4. **Some steps only play with certain settings** (see **Plays**). Every line must make sense whether or not the optional steps around it play. For example, "Fact Frenzy" retries/teams/steal steps may be skipped. In Two Truths and a Lie, the `_lies` steps replace their normal-version twins, so write each twin to stand alone.
5. **Length:** one or two sentences per line, about 4 to 10 seconds spoken (roughly 12 to 30 words). A whole tutorial should take about a minute.
6. **Use ElevenLabs v3 audio tags** in square brackets to direct the delivery. Use them where they add something, usually 0 to 2 per line. Examples: `[excited]`, `[laughs]`, `[chuckles]`, `[whispers]`, `[sarcastic]`, `[mischievously]`, `[sighs]`, `[dramatic pause]`, `[short pause]`, `[playfully]`, `[deadpan]`. Put a tag right before the words it affects. Tags are directions, never words to be read, and must contain only a few lowercase words.
7. **Make it TTS-friendly.** No em dashes, ellipses, emoji, asterisks or symbols (%, &, #, +) outside the [tags]. Write numbers as words: "a hundred", "seventy five", "one minute". Use plain punctuation; exclamation marks and question marks are fine.
8. **Keep the demo names.** The scenes show the players Sam, Priya, Marcus and Jules, and examples like "cry at a movie", "Jupiter", "SnoozeShield" and "penguin". Keep any example a line mentions, because it's on screen. Never refer to a player as he/she; use their name or "they".

## Output

Return the **entire file** in exactly the same Markdown format, with only the **Line** text changed. Don't include any commentary before or after it. If the full file is too long for one reply, stop at the end of a game and I'll say "continue".

# ScreenParty tutorial voice lines

Nine games. Each has two scripts: AI host mode and Player host mode. Rewrite only the **Line** fields.

---

# GAME: Number Crunch (`num`)

## Rules the lines must keep true

- One Guesser per round sees only the theme and the 1 to 10 scale.
- Everyone else gets a secret number from 1 to 10 and types an example that fits it.
- The Guesser places each anonymous example on the scale.
- Writer scores 200 for an exact guess, 100 if off by one, 50 if off by two, nothing beyond.
- The Guesser also scores for overall accuracy.
- Everyone is the Guesser once; most points wins.
- Player-host mode: the host taps Next on the big screen and can skip slow players.

## Number Crunch: AI host (the host speaks as "I" and runs the show)

Mode: `virtual`

### id: welcome

- **On screen:** Title card: NUMBER CRUNCH over the four players
- **Plays:** always
- **Line:** [excited] Welcome to Number Crunch! Before we start, a quick how-to for the game where your friends' brains disagree about absolutely everything.

### id: theme

- **On screen:** A 1 to 10 scale for the theme Spicy foods: 1 = basically milk, 10 = call an ambulance
- **Plays:** always
- **Line:** [playfully] First, the theme is spicy foods, with one meaning basically milk and ten meaning call an ambulance. Deliciously alarming.

### id: guesser

- **On screen:** Sam the detective stamped THE GUESSER; the scale with its labels hidden
- **Plays:** always
- **Line:** Sam's our Guesser, seeing only the theme and the one to ten scale. No secret numbers, no clues, and absolutely no detective training.

### id: numbers

- **On screen:** Three phones, each showing a secret number (2, 9, 10)
- **Plays:** always
- **Line:** Meanwhile, everyone else gets a secret number between one and ten on their phone. Keep it hidden, you lovable oversharers.

### id: examples

- **On screen:** The same phones with examples typed in: Ketchup, Ghost pepper, The surface of the sun
- **Plays:** always
- **Line:** Next, match your secret number with an example: two is ketchup, nine is ghost pepper, and ten is the surface of the sun. Sensible.

### id: guessing

- **On screen:** Sam placing the examples on the scale, no names attached
- **Plays:** always
- **Line:** Now Sam places the anonymous examples on the scale. No names, no hints, just the terrifying responsibility of judging ketchup.

### id: reveal

- **On screen:** Reveal rows: each example, its real number, Sam's guess and the points
- **Plays:** always
- **Line:** Here's the reveal: an exact match earns the writer two hundred, one away earns a hundred, two away earns fifty, and anything farther earns zero.

### id: guesserScore

- **On screen:** Sam celebrating with a green accuracy-points stamp
- **Plays:** always
- **Line:** And Sam scores for overall guessing accuracy too. That's right, our detective gets points for actually solving the case.

### id: finale

- **On screen:** The players with a winner crowned; Most points wins (player-host mode also shows a Next round button)
- **Plays:** always
- **Line:** Everyone gets one turn as Guesser, and most points wins; I'll keep things moving. [excited] Tutorial over, let's play for real!

## Number Crunch: Player host (an off-screen announcer; a real person runs the show, so explain what THEY tap)

Mode: `self`

### id: welcome

- **On screen:** Title card: NUMBER CRUNCH over the four players
- **Plays:** always
- **Line:** Welcome to Number Crunch! Here's a quick tutorial before the game where your host handles the buttons and you handle the questionable opinions.

### id: theme

- **On screen:** A 1 to 10 scale for the theme Spicy foods: 1 = basically milk, 10 = call an ambulance
- **Plays:** always
- **Line:** [playfully] First, the theme is spicy foods, with one meaning basically milk and ten meaning call an ambulance. Deliciously alarming.

### id: guesser

- **On screen:** Sam the detective stamped THE GUESSER; the scale with its labels hidden
- **Plays:** always
- **Line:** Sam's our Guesser, seeing only the theme and the one to ten scale. No secret numbers, no clues, and absolutely no detective training.

### id: numbers

- **On screen:** Three phones, each showing a secret number (2, 9, 10)
- **Plays:** always
- **Line:** Meanwhile, everyone else gets a secret number between one and ten on their phone. Keep it hidden, you lovable oversharers.

### id: examples

- **On screen:** The same phones with examples typed in: Ketchup, Ghost pepper, The surface of the sun
- **Plays:** always
- **Line:** Next, match your secret number with an example: two is ketchup, nine is ghost pepper, and ten is the surface of the sun. Sensible.

### id: guessing

- **On screen:** Sam placing the examples on the scale, no names attached
- **Plays:** always
- **Line:** Now Sam places the anonymous examples on the scale. No names, no hints, just the terrifying responsibility of judging ketchup.

### id: reveal

- **On screen:** Reveal rows: each example, its real number, Sam's guess and the points
- **Plays:** always
- **Line:** Here's the reveal: an exact match earns the writer two hundred, one away earns a hundred, two away earns fifty, and anything farther earns zero.

### id: guesserScore

- **On screen:** Sam celebrating with a green accuracy-points stamp
- **Plays:** always
- **Line:** And Sam scores for overall guessing accuracy too. That's right, our detective gets points for actually solving the case.

### id: finale

- **On screen:** The players with a winner crowned; Most points wins (player-host mode also shows a Next round button)
- **Plays:** always
- **Line:** Everyone guesses once and most points wins; your host taps Next on the big screen and can skip stragglers. [excited] Tutorial over, let's play!

---

# GAME: Fact Frenzy (`buzz_trivia`)

## Rules the lines must keep true

- Question shows on the big screen; phones are buzzers.
- First to buzz answers; later buzzers queue in order.
- AI host: the buzzer types the answer and the host judges it (small typos are OK).
- Player-host mode: answer out loud; the host (picked in the lobby) sees the answer on their phone, shows each question and taps right or wrong.
- First-try correct = 100 points. A wrong answer costs what it was worth (score never goes below zero).
- Retries: a miss passes to the next person in the buzz queue, worth fewer points (75, then 50, 25, 10).
- Teams: Red vs Blue, points stay per player but add up per team; a miss passes to the OTHER team's next buzzer (steal).
- If nobody buzzes before the clock runs out, the question is skipped.
- Most points wins.

## Fact Frenzy: AI host (the host speaks as "I" and runs the show)

Mode: `virtual`

### id: welcome

- **On screen:** Title card: FACT FRENZY over the players
- **Plays:** always
- **Line:** [excited] Welcome to Fact Frenzy! Before the real game, here's a rapid-fire tutorial to warm up your thumbs and questionable trivia knowledge.

### id: question

- **On screen:** The big screen: a trivia question, BUZZ IN NOW!, the players' podiums
- **Plays:** always
- **Line:** First, a trivia question appears on the big screen and your phone becomes a buzzer. Read quickly, then pounce like a caffeinated cat.

### id: buzz

- **On screen:** Priya buzzed in: a big BUZZ! stamp and Priya's name on screen
- **Plays:** always
- **Line:** Priya buzzed first, so Priya answers first; everyone else who buzzed queues up in order. Patience, eager geniuses.

### id: answer

- **On screen:** Phones: Priya answering (AI host: typing box; player host: 'You're up! Say it loud!' next to the host's phone with the answer and Correct / Wrong buttons)
- **Plays:** always
- **Line:** Priya types an answer on the phone, and I'll judge it; tiny typos are fine. I grade knowledge, not thumbs.

### id: points

- **On screen:** CORRECT! stamp, +100 points, the answer Jupiter revealed
- **Plays:** always
- **Line:** Jupiter is right, and the first correct try earns a hundred points. A wrong answer loses its current value, but your score can't drop below zero.

### id: retries

- **On screen:** WRONG! stamp, the turn passes to the next buzzer
- **Plays:** only when Retries is ON and Teams is OFF
- **Line:** [mischievously] With retries on, a miss passes to the next buzzer. The prize shrinks to seventy five, fifty, twenty five, then ten points.

### id: teams

- **On screen:** Scoreboard with Team Red vs Team Blue totals
- **Plays:** only when Teams is ON
- **Line:** In team mode, it's Red versus Blue; you still earn individual points, and they also add to your team's total. Shared glory!

### id: steal

- **On screen:** WRONG! stamp, the turn passes to the other team's buzzer
- **Plays:** only when Teams AND Retries are ON
- **Line:** In team retries, a miss gives the other team's next buzzer a steal worth fewer points: seventy five, fifty, twenty five, then ten. Delicious betrayal.

### id: timesup

- **On screen:** TIME'S UP! stamp and the answer revealed
- **Plays:** always
- **Line:** If nobody buzzes before time runs out, we skip the question and reveal the answer. Even silence has consequences.

### id: finale

- **On screen:** AI host: the players with a winner crowned. Player host: the host's phone with the Display Question button
- **Plays:** always
- **Line:** Most points wins, and I'll read questions, judge typed answers, and keep score. [excited] Tutorial complete, let's play for real!

## Fact Frenzy: Player host (an off-screen announcer; a real person runs the show, so explain what THEY tap)

Mode: `self`

### id: welcome

- **On screen:** Title card: FACT FRENZY over the players
- **Plays:** always
- **Line:** Welcome to Fact Frenzy! Here's a quick how-to before the real game, and remember, your host has the answers, so flatter them responsibly.

### id: question

- **On screen:** The big screen: a trivia question, BUZZ IN NOW!, the players' podiums
- **Plays:** always
- **Line:** First, a trivia question appears on the big screen and your phone becomes a buzzer. Read quickly, then pounce like a caffeinated cat.

### id: buzz

- **On screen:** Priya buzzed in: a big BUZZ! stamp and Priya's name on screen
- **Plays:** always
- **Line:** Priya buzzed first, so Priya answers first; everyone else who buzzed queues up in order. Patience, eager geniuses.

### id: answer

- **On screen:** Phones: Priya answering (AI host: typing box; player host: 'You're up! Say it loud!' next to the host's phone with the answer and Correct / Wrong buttons)
- **Plays:** always
- **Line:** Priya answers out loud while the lobby's chosen host sees the answer on their phone and taps Correct or Wrong. No pressure!

### id: points

- **On screen:** CORRECT! stamp, +100 points, the answer Jupiter revealed
- **Plays:** always
- **Line:** Jupiter is right, and the first correct try earns a hundred points. A wrong answer loses its current value, but your score can't drop below zero.

### id: retries

- **On screen:** WRONG! stamp, the turn passes to the next buzzer
- **Plays:** only when Retries is ON and Teams is OFF
- **Line:** [mischievously] With retries on, a miss passes to the next buzzer. The prize shrinks to seventy five, fifty, twenty five, then ten points.

### id: teams

- **On screen:** Scoreboard with Team Red vs Team Blue totals
- **Plays:** only when Teams is ON
- **Line:** In team mode, it's Red versus Blue; you still earn individual points, and they also add to your team's total. Shared glory!

### id: steal

- **On screen:** WRONG! stamp, the turn passes to the other team's buzzer
- **Plays:** only when Teams AND Retries are ON
- **Line:** In team retries, a miss gives the other team's next buzzer a steal worth fewer points: seventy five, fifty, twenty five, then ten. Delicious betrayal.

### id: timesup

- **On screen:** TIME'S UP! stamp and the answer revealed
- **Plays:** only when Auto skip is ON
- **Line:** No buzz before the clock runs out? With auto skip on, the answer appears and we move on, a spectacular group shrug.

### id: finale

- **On screen:** AI host: the players with a winner crowned. Player host: the host's phone with the Display Question button
- **Plays:** always
- **Line:** Most points wins; your host taps Display Question and judges answers from their phone. [excited] Tutorial's done, let the real frenzy begin!

---

# GAME: Two Truths and a Lie (`ttal`)

## Rules the lines must keep true

- Everyone writes three statements about themselves on their phone each round.
- Normal version: two truths, one lie. Flipped version (Two Lies and a Truth): two lies, one truth.
- One player at a time is in the hot seat; their statements show on the big screen, shuffled.
- Everyone else votes for the lie (or, flipped, the truth).
- Spotting it = 100 points. The hot seat player gets 50 per person fooled.
- Everyone takes a turn; then everyone writes fresh statements for the next round. Most points wins.
- Player-host mode: a player picked in the lobby still plays, but their phone has the reveal and next-round buttons.
- No teams in this game.

## Two Truths and a Lie: AI host (the host speaks as "I" and runs the show)

Mode: `virtual`

### id: welcome

- **On screen:** Title card: TWO TRUTHS AND A LIE (or TWO LIES AND A TRUTH) over the players
- **Plays:** normal version only
- **Line:** [excited] Welcome to Two Truths and a Lie! Here's a quick how-to before the real deception begins, so practice your innocent face.

### id: welcome_lies

- **On screen:** Title card: TWO TRUTHS AND A LIE (or TWO LIES AND A TRUTH) over the players
- **Plays:** Two Lies and a Truth version only
- **Line:** Welcome to Two Lies and a Truth! Before the real game, here's a quick tutorial where honesty is the needle in a haystack of nonsense.

### id: writing

- **On screen:** A phone with three blank statement boxes and a writing timer
- **Plays:** normal version only
- **Line:** First, type three statements about yourself on your phone: two truths and one lie. Make us sweat trying to spot it.

### id: writing_lies

- **On screen:** A phone with three blank statement boxes and a writing timer
- **Plays:** Two Lies and a Truth version only
- **Line:** First, type three statements about yourself on your phone: two lies and just one truth. Hide that tiny bit of honesty well.

### id: hotseat

- **On screen:** The big screen: Sam in the hot seat, their three statements shuffled
- **Plays:** always
- **Line:** Next, Sam takes the hot seat as three shuffled statements appear on the big screen. [mischievously] Let the suspicious staring begin.

### id: voting

- **On screen:** Two phones, each asking which statement is the odd one out
- **Plays:** normal version only
- **Line:** Now everyone except Sam taps the statement they think is the lie. [whispers] Watch that poker face for the tiniest suspicious twitch.

### id: voting_lies

- **On screen:** Two phones, each asking which statement is the odd one out
- **Plays:** Two Lies and a Truth version only
- **Line:** Now everyone except Sam taps the statement they think is true. [whispers] Keep an eye on that face; it's suspiciously calm.

### id: reveal

- **On screen:** The big screen reveal: the odd statement exposed, who spotted it, points flying to Sam for each person fooled
- **Plays:** always
- **Line:** Here's the reveal: spot the odd statement for a hundred points, while Sam earns fifty for every person fooled. Deception pays.

### id: rounds

- **On screen:** Scoreboard
- **Plays:** always
- **Line:** Everyone takes a hot seat turn, then writes fresh statements for the next round. Most points wins, so keep those stories coming.

### id: finale

- **On screen:** AI host: the players with a winner crowned. Player host: the host's phone showing scores and a Next round! button
- **Plays:** always
- **Line:** I'll read the statements and keep score, while you try to sound believable. [excited] Tutorial's over, let's play for real!

## Two Truths and a Lie: Player host (an off-screen announcer; a real person runs the show, so explain what THEY tap)

Mode: `self`

### id: welcome

- **On screen:** Title card: TWO TRUTHS AND A LIE (or TWO LIES AND A TRUTH) over the players
- **Plays:** normal version only
- **Line:** Welcome to Two Truths and a Lie! Here's a quick tutorial before the real game of three statements, one fib, and suspicious eye contact.

### id: welcome_lies

- **On screen:** Title card: TWO TRUTHS AND A LIE (or TWO LIES AND A TRUTH) over the players
- **Plays:** Two Lies and a Truth version only
- **Line:** Welcome to Two Lies and a Truth! Before the real game, here's a quick tutorial where honesty is the needle in a haystack of nonsense.

### id: writing

- **On screen:** A phone with three blank statement boxes and a writing timer
- **Plays:** normal version only
- **Line:** First, type three statements about yourself on your phone: two truths and one lie. Make us sweat trying to spot it.

### id: writing_lies

- **On screen:** A phone with three blank statement boxes and a writing timer
- **Plays:** Two Lies and a Truth version only
- **Line:** First, type three statements about yourself on your phone: two lies and just one truth. Hide that tiny bit of honesty well.

### id: hotseat

- **On screen:** The big screen: Sam in the hot seat, their three statements shuffled
- **Plays:** always
- **Line:** Next, Sam takes the hot seat as three shuffled statements appear on the big screen. Sam, read them aloud without giving anything away.

### id: voting

- **On screen:** Two phones, each asking which statement is the odd one out
- **Plays:** normal version only
- **Line:** Now everyone except Sam taps the statement they think is the lie. [whispers] Watch that poker face for the tiniest suspicious twitch.

### id: voting_lies

- **On screen:** Two phones, each asking which statement is the odd one out
- **Plays:** Two Lies and a Truth version only
- **Line:** Now everyone except Sam taps the statement they think is true. [whispers] Keep an eye on that face; it's suspiciously calm.

### id: reveal

- **On screen:** The big screen reveal: the odd statement exposed, who spotted it, points flying to Sam for each person fooled
- **Plays:** always
- **Line:** Here's the reveal: spot the odd statement for a hundred points, while Sam earns fifty for every person fooled. Deception pays.

### id: rounds

- **On screen:** Scoreboard
- **Plays:** always
- **Line:** Everyone takes a hot seat turn, then writes fresh statements for the next round. Most points wins, so keep those stories coming.

### id: finale

- **On screen:** AI host: the players with a winner crowned. Player host: the host's phone showing scores and a Next round! button
- **Plays:** always
- **Line:** Your lobby-picked host plays too, and taps Reveal and Next round on their phone. [excited] Tutorial over, let's expose some stories!

---

# GAME: Would You Rather (`wyr`)

## Rules the lines must keep true

- Two options on the big screen.
- On your phone you pick your side AND predict which side the room's majority picked.
- Calling the majority = 100 points; your own pick doesn't score. A dead tie means nobody scores.
- Teams: you predict the OTHER team's majority.
- AI host runs a timer; player-host mode: the host taps Reveal, then Next round, on the big screen.
- Most points wins.

## Would You Rather: AI host (the host speaks as "I" and runs the show)

Mode: `virtual`

### id: welcome

- **On screen:** Title card: WOULD YOU RATHER over the players
- **Plays:** always
- **Line:** Welcome to Would You Rather! Before the real game, here's a quick tutorial on making difficult choices and reading your friends like very confusing books.

### id: dilemma

- **On screen:** Big screen: Always be 10 minutes late VS Always be 30 minutes early
- **Plays:** always
- **Line:** First, two choices appear: always ten minutes late or always thirty minutes early. Either way, somebody here is already offended.

### id: pick

- **On screen:** Two phones: pick your side, then predict the majority
- **Plays:** always
- **Line:** On your phone, choose your side, then guess what the majority picked. [mischievously] It's a personality test with actual points.

### id: teams

- **On screen:** Two phones from opposite teams, predicting the other team
- **Plays:** only when Teams is ON
- **Line:** In teams, you predict the other team's majority instead; Red meets Blue, and Blue meets its new obsession.

### id: reveal

- **On screen:** Big screen reveal: vote split with percentages, who called the majority, +100 each
- **Plays:** always
- **Line:** Here's the twist: predicting the majority earns a hundred, but your own choice earns nothing. A dead tie earns nobody anything; democracy takes a nap.

### id: finale

- **On screen:** AI host: the players with a winner crowned. Player host: scoreboard with a Next round! button
- **Plays:** always
- **Line:** Most points wins, and I'll run the timer while you agonize over two terrible options. [excited] Tutorial over, let's play for real!

## Would You Rather: Player host (an off-screen announcer; a real person runs the show, so explain what THEY tap)

Mode: `self`

### id: welcome

- **On screen:** Title card: WOULD YOU RATHER over the players
- **Plays:** always
- **Line:** Welcome to Would You Rather! Before we start the real game, a quick tutorial on making deeply personal decisions about entirely ridiculous things.

### id: dilemma

- **On screen:** Big screen: Always be 10 minutes late VS Always be 30 minutes early
- **Plays:** always
- **Line:** First, two choices appear: always ten minutes late or always thirty minutes early. Either way, somebody here is already offended.

### id: pick

- **On screen:** Two phones: pick your side, then predict the majority
- **Plays:** always
- **Line:** On your phone, choose your side, then guess what the majority picked. [mischievously] It's a personality test with actual points.

### id: teams

- **On screen:** Two phones from opposite teams, predicting the other team
- **Plays:** only when Teams is ON
- **Line:** In teams, you predict the other team's majority instead; Red meets Blue, and Blue meets its new obsession.

### id: reveal

- **On screen:** Big screen reveal: vote split with percentages, who called the majority, +100 each
- **Plays:** always
- **Line:** Here's the twist: predicting the majority earns a hundred, but your own choice earns nothing. A dead tie earns nobody anything; democracy takes a nap.

### id: finale

- **On screen:** AI host: the players with a winner crowned. Player host: scoreboard with a Next round! button
- **Plays:** always
- **Line:** Your host taps Reveal, then Next round, on the big screen; most points wins. [excited] Tutorial over, make those questionable choices for real!

---

# GAME: Most Likely To (`mlt`)

## Rules the lines must keep true

- Prompt: 'Most likely to ___'.
- Vote on your phone for whoever fits; you cannot vote for yourself.
- If one person gets the most votes: everyone who voted for them scores 100, and they get a 50 bonus.
- A tie for most votes means nobody scores.
- Player-host mode: host taps Reveal, then Next round, on the big screen.
- Most points wins.

## Most Likely To: AI host (the host speaks as "I" and runs the show)

Mode: `virtual`

### id: welcome

- **On screen:** Title card: MOST LIKELY TO over the players
- **Plays:** always
- **Line:** [playfully] Welcome to Most Likely To! Here's a quick tutorial before the real game reveals what your friends truly think of you.

### id: prompt

- **On screen:** Big screen: Most likely to... cry at a movie, with a voting timer
- **Plays:** always
- **Line:** First, the big screen asks who's most likely to cry at a movie. [chuckles] Keep the tissues close, because this could get personal.

### id: vote

- **On screen:** Two phones showing the other players' faces to tap
- **Plays:** always
- **Line:** On your phone, tap whoever fits best, but you can't vote for yourself. Nice attempt at controlling the narrative, though.

### id: reveal

- **On screen:** Big screen: PRIYA WINS! with the votes for Priya
- **Plays:** always
- **Line:** Priya got the most votes, so everyone who picked Priya earns a hundred, and Priya gets fifty. [chuckles] What an emotional victory.

### id: tie

- **On screen:** Big screen: a tie between two players, no points
- **Plays:** always
- **Line:** But if the top vote is tied, nobody scores. Apparently this group can't agree on who needs tissues most.

### id: finale

- **On screen:** AI host: the players with a winner crowned. Player host: scoreboard with a Next round! button
- **Plays:** always
- **Line:** Most points wins; I'll deliver the prompts, and you deliver affectionate accusations. [excited] Tutorial finished, let's play for real!

## Most Likely To: Player host (an off-screen announcer; a real person runs the show, so explain what THEY tap)

Mode: `self`

### id: welcome

- **On screen:** Title card: MOST LIKELY TO over the players
- **Plays:** always
- **Line:** Welcome to Most Likely To! Before the real game, a quick how-to on discovering who's been quietly judging whom this entire time.

### id: prompt

- **On screen:** Big screen: Most likely to... cry at a movie, with a voting timer
- **Plays:** always
- **Line:** First, the big screen asks who's most likely to cry at a movie. [chuckles] Keep the tissues close, because this could get personal.

### id: vote

- **On screen:** Two phones showing the other players' faces to tap
- **Plays:** always
- **Line:** On your phone, tap whoever fits best, but you can't vote for yourself. Nice attempt at controlling the narrative, though.

### id: reveal

- **On screen:** Big screen: PRIYA WINS! with the votes for Priya
- **Plays:** always
- **Line:** Priya got the most votes, so everyone who picked Priya earns a hundred, and Priya gets fifty. [chuckles] What an emotional victory.

### id: tie

- **On screen:** Big screen: a tie between two players, no points
- **Plays:** always
- **Line:** But if the top vote is tied, nobody scores. Apparently this group can't agree on who needs tissues most.

### id: finale

- **On screen:** AI host: the players with a winner crowned. Player host: scoreboard with a Next round! button
- **Plays:** always
- **Line:** Your host taps Reveal, then Next round, on the big screen; most points wins. [excited] Tutorial over, time for real accusations!

---

# GAME: Higher or Lower (`hol`)

## Rules the lines must keep true

- Two items on screen, numbers hidden (first round both hidden).
- Vote on your phone: is the right one higher or lower than the left?
- The majority vote is the room's answer. If it's right, everyone in the majority scores 100. If it's wrong (or a tie), nobody scores. Being right in the minority scores nothing.
- Then the right item moves left with its number showing and a new item appears (a chain).
- Ten rounds; most points wins.
- Player-host mode: host taps Reveal, then Next, on the big screen.

## Higher or Lower: AI host (the host speaks as "I" and runs the show)

Mode: `virtual`

### id: welcome

- **On screen:** Title card: HIGHER OR LOWER over the players
- **Plays:** always
- **Line:** Welcome to Higher or Lower! Here's a quick tutorial before the real game tests your number sense and your ability to resist Googling.

### id: items

- **On screen:** Big screen: Keys on a standard piano VS Bones in an adult human body, both numbers hidden
- **Plays:** always
- **Line:** First up, piano keys versus bones in an adult human body, with both numbers hidden. [playfully] Trust those extremely scientific instincts.

### id: vote

- **On screen:** Two phones with HIGHER and LOWER buttons
- **Plays:** always
- **Line:** On your phone, vote whether the number on the right is higher or lower than the left. Commit to a direction.

### id: reveal

- **On screen:** Big screen: 88 vs 206, the majority said higher and was right, +100 each
- **Plays:** always
- **Line:** The majority said higher and nailed it, earning each majority voter a hundred points. Wrong majority or a tie means zero, even for correct dissenters.

### id: chain

- **On screen:** Big screen: Bones (206 showing) now on the left VS Countries in the world, hidden
- **Plays:** always
- **Line:** Next, bones slide left with two hundred six showing, and countries in the world becomes the new challenger. The chain continues.

### id: finale

- **On screen:** AI host: the players with a winner crowned. Player host: scoreboard with a Next round! button
- **Plays:** always
- **Line:** Ten rounds, most points wins, and I'll keep the comparisons coming. [excited] Tutorial complete, let's test those mathematical hunches for real!

## Higher or Lower: Player host (an off-screen announcer; a real person runs the show, so explain what THEY tap)

Mode: `self`

### id: welcome

- **On screen:** Title card: HIGHER OR LOWER over the players
- **Plays:** always
- **Line:** Welcome to Higher or Lower! First, a speedy tutorial, then ten rounds of pretending your guesses are backed by research.

### id: items

- **On screen:** Big screen: Keys on a standard piano VS Bones in an adult human body, both numbers hidden
- **Plays:** always
- **Line:** First up, piano keys versus bones in an adult human body, with both numbers hidden. [playfully] Trust those extremely scientific instincts.

### id: vote

- **On screen:** Two phones with HIGHER and LOWER buttons
- **Plays:** always
- **Line:** On your phone, vote whether the number on the right is higher or lower than the left. Commit to a direction.

### id: reveal

- **On screen:** Big screen: 88 vs 206, the majority said higher and was right, +100 each
- **Plays:** always
- **Line:** The majority said higher and nailed it, earning each majority voter a hundred points. Wrong majority or a tie means zero, even for correct dissenters.

### id: chain

- **On screen:** Big screen: Bones (206 showing) now on the left VS Countries in the world, hidden
- **Plays:** always
- **Line:** Next, bones slide left with two hundred six showing, and countries in the world becomes the new challenger. The chain continues.

### id: finale

- **On screen:** AI host: the players with a winner crowned. Player host: scoreboard with a Next round! button
- **Plays:** always
- **Line:** Your host taps Reveal, then Next, on the big screen; ten rounds, most points wins. [excited] Tutorial over, let's compare for real!

---

# GAME: Guess the Player (`gtp`)

## Rules the lines must keep true

- Everyone answers the same prompt on their phone, anonymously.
- Answers appear one at a time; everyone except the writer guesses who wrote it.
- Correct guess = 100 points. The writer gets 50 per person fooled.
- Most points wins.
- Player-host mode: host taps Reveal and Next on the big screen.

## Guess the Player: AI host (the host speaks as "I" and runs the show)

Mode: `virtual`

### id: welcome

- **On screen:** Title card: GUESS THE PLAYER over the players
- **Plays:** always
- **Line:** Welcome to Guess the Player! Here's a quick tutorial before the real game of anonymous confessions and deeply questionable detective work.

### id: prompt

- **On screen:** Big screen: What's a weird food combination you actually love?
- **Plays:** always
- **Line:** First, everyone sees the same question on the big screen: what's a weird food combination you actually love? [mischievously] No judgment, yet.

### id: answer

- **On screen:** Two phones with an answer box
- **Plays:** always
- **Line:** Type your answer on your phone without your name attached. [mischievously] Finally, a safe place to admit your culinary crimes.

### id: guess

- **On screen:** Big screen: one anonymous answer, Pickles dipped in peanut butter, with guesses coming in
- **Plays:** always
- **Line:** Next, anonymous answers appear one at a time, like pickles dipped in peanut butter. Everyone but the writer guesses who wrote each one.

### id: reveal

- **On screen:** Big screen: it was Sam! Who guessed right, and Sam's points for fooling the rest
- **Plays:** always
- **Line:** It was Sam, so correct guesses earn a hundred points and Sam gets fifty per person fooled. [chuckles] Friendship is now a detective sport.

### id: finale

- **On screen:** AI host: the players with a winner crowned. Player host: scoreboard with a Next round! button
- **Plays:** always
- **Line:** Most points wins, and I'll handle the reveals while you handle the side-eye. [excited] Tutorial over, let's investigate for real!

## Guess the Player: Player host (an off-screen announcer; a real person runs the show, so explain what THEY tap)

Mode: `self`

### id: welcome

- **On screen:** Title card: GUESS THE PLAYER over the players
- **Plays:** always
- **Line:** Welcome to Guess the Player! Before the real game, a quick tutorial on anonymous answers and friends whose weird habits give them away.

### id: prompt

- **On screen:** Big screen: What's a weird food combination you actually love?
- **Plays:** always
- **Line:** First, everyone sees the same question on the big screen: what's a weird food combination you actually love? [mischievously] No judgment, yet.

### id: answer

- **On screen:** Two phones with an answer box
- **Plays:** always
- **Line:** Type your answer on your phone without your name attached. [mischievously] Finally, a safe place to admit your culinary crimes.

### id: guess

- **On screen:** Big screen: one anonymous answer, Pickles dipped in peanut butter, with guesses coming in
- **Plays:** always
- **Line:** Next, anonymous answers appear one at a time, like pickles dipped in peanut butter. Everyone but the writer guesses who wrote each one.

### id: reveal

- **On screen:** Big screen: it was Sam! Who guessed right, and Sam's points for fooling the rest
- **Plays:** always
- **Line:** It was Sam, so correct guesses earn a hundred points and Sam gets fifty per person fooled. [chuckles] Friendship is now a detective sport.

### id: finale

- **On screen:** AI host: the players with a winner crowned. Player host: scoreboard with a Next round! button
- **Plays:** always
- **Line:** Your host taps Reveal and Next on the big screen; most points wins. [excited] Tutorial over, time to expose those suspicious snacks!

---

# GAME: Shark Tank (`tank`)

## Rules the lines must keep true

- Each round one player gets a random product (shown on their phone and the big screen).
- They pitch it out loud for one minute (AI host: until the timer line runs out; the host picks the time, 60s default).
- Everyone else votes invest or pass on their phone.
- The pitcher scores 75 per investor.
- Everyone pitches once; most points wins.
- Player-host mode: the host ends each pitch and taps Next on the big screen.

## Shark Tank: AI host (the host speaks as "I" and runs the show)

Mode: `virtual`

### id: welcome

- **On screen:** Title card: SHARK TANK over the players
- **Plays:** always
- **Line:** Welcome to Shark Tank! Here's a quick tutorial before you pitch ridiculous inventions to friends with very imaginary investment portfolios.

### id: product

- **On screen:** Big screen: Marcus pitching SnoozeShield, an alarm clock that locks your phone until you walk to the kitchen, with a one minute timer
- **Plays:** always
- **Line:** Each round, a random product appears on the TV and pitcher's phone. Marcus gets SnoozeShield, an alarm clock that locks your phone until you walk to the kitchen.

### id: pitch

- **On screen:** Marcus's phone: You're pitching! with the product
- **Plays:** always
- **Line:** Marcus pitches SnoozeShield out loud until the timer runs out; [playfully] invent features and fake testimonials with unstoppable confidence. That's your entire business plan.

### id: invest

- **On screen:** Two phones with INVEST and PASS buttons
- **Plays:** always
- **Line:** Then everyone else becomes a shark and taps Invest or Pass on their phone. [deadpan] The stakes have never been more imaginary.

### id: reveal

- **On screen:** Big screen: two investors, one pass, Marcus earns 150
- **Plays:** always
- **Line:** Two sharks invested, so Marcus earns a hundred and fifty points, at seventy five per investor. [chuckles] The market has spoken.

### id: finale

- **On screen:** AI host: the players with a winner crowned. Player host: scoreboard with a Next round! button
- **Plays:** always
- **Line:** Everyone pitches once and most points wins; I'll keep the clock running and the deals moving. [excited] Tutorial over, let's do business for real!

## Shark Tank: Player host (an off-screen announcer; a real person runs the show, so explain what THEY tap)

Mode: `self`

### id: welcome

- **On screen:** Title card: SHARK TANK over the players
- **Plays:** always
- **Line:** Welcome to Shark Tank! Before the real game, here's a quick how-to for selling questionable products to even more questionable investors.

### id: product

- **On screen:** Big screen: Marcus pitching SnoozeShield, an alarm clock that locks your phone until you walk to the kitchen, with a one minute timer
- **Plays:** always
- **Line:** Each round, a random product appears on the TV and pitcher's phone. Marcus gets SnoozeShield, an alarm clock that locks your phone until you walk to the kitchen.

### id: pitch

- **On screen:** Marcus's phone: You're pitching! with the product
- **Plays:** always
- **Line:** Marcus has one minute to pitch SnoozeShield out loud; [playfully] invent features and fake testimonials with unstoppable confidence. That's your entire business plan.

### id: invest

- **On screen:** Two phones with INVEST and PASS buttons
- **Plays:** always
- **Line:** Then everyone else becomes a shark and taps Invest or Pass on their phone. [deadpan] The stakes have never been more imaginary.

### id: reveal

- **On screen:** Big screen: two investors, one pass, Marcus earns 150
- **Plays:** always
- **Line:** Two sharks invested, so Marcus earns a hundred and fifty points, at seventy five per investor. [chuckles] The market has spoken.

### id: finale

- **On screen:** AI host: the players with a winner crowned. Player host: scoreboard with a Next round! button
- **Plays:** always
- **Line:** Your host ends each pitch and taps Next on the big screen; everyone pitches once and most points wins. [excited] Tutorial over, sell us something!

---

# GAME: Charades (`charades`)

## Rules the lines must keep true

- Each round one player is the actor; their phone shows a secret word, the big screen shows its category.
- Act it out for one minute (AI host: until the timer line runs out; the host picks the time, 60s default), no talking or sounds.
- Everyone else types guesses on their phone, unlimited; spelling must match.
- First correct guess = 150 points, the actor gets 100. Nobody gets it in time = nobody scores.
- Everyone acts once; most points wins.
- Player-host mode: when the clock runs out the host ends the round and taps Next on the big screen.

## Charades: AI host (the host speaks as "I" and runs the show)

Mode: `virtual`

### id: welcome

- **On screen:** Title card: CHARADES over the players
- **Plays:** always
- **Line:** Welcome to Charades! Here's a quick tutorial before the real game, where words are banned, arms take over, and dignity is negotiable.

### id: actor

- **On screen:** Jules's phone showing the secret word: penguin
- **Plays:** always
- **Line:** First, Jules sees the secret word penguin on their phone and becomes our actor. Keep it quiet; no spoilers for the waddling.

### id: acting

- **On screen:** Big screen: Jules acting, category animals, a one minute timer
- **Plays:** always
- **Line:** Next, Jules acts until the timer runs out, with Animals on the big screen. No talking or sounds, just deeply committed penguin energy.

### id: guess

- **On screen:** Two phones with a guess box
- **Plays:** always
- **Line:** Meanwhile, everyone else types unlimited guesses on their phones, but spelling must match exactly. [deadpan] The autocorrect gods are not playing.

### id: reveal

- **On screen:** Big screen: the word was penguin, Priya guessed it, +150 to Priya and +100 to Jules
- **Plays:** always
- **Line:** Priya guessed penguin first for a hundred and fifty, while Jules earns a hundred; if nobody guesses in time, nobody scores. [chuckles] Tough crowd.

### id: finale

- **On screen:** AI host: the players with a winner crowned. Player host: scoreboard with a Next round! button
- **Plays:** always
- **Line:** Everyone acts once and most points wins; I'll keep time, you keep quiet. [excited] Tutorial over, let's mime for real!

## Charades: Player host (an off-screen announcer; a real person runs the show, so explain what THEY tap)

Mode: `self`

### id: welcome

- **On screen:** Title card: CHARADES over the players
- **Plays:** always
- **Line:** Welcome to Charades! Here's a quick tutorial before the real game, when your voice takes a break and your arms get the starring role.

### id: actor

- **On screen:** Jules's phone showing the secret word: penguin
- **Plays:** always
- **Line:** First, Jules sees the secret word penguin on their phone and becomes our actor. Keep it quiet; no spoilers for the waddling.

### id: acting

- **On screen:** Big screen: Jules acting, category animals, a one minute timer
- **Plays:** always
- **Line:** Next, Jules has one minute to act, with Animals on the big screen. No talking or sounds, just deeply committed penguin energy.

### id: guess

- **On screen:** Two phones with a guess box
- **Plays:** always
- **Line:** Meanwhile, everyone else types unlimited guesses on their phones, but spelling must match exactly. [deadpan] The autocorrect gods are not playing.

### id: reveal

- **On screen:** Big screen: the word was penguin, Priya guessed it, +150 to Priya and +100 to Jules
- **Plays:** always
- **Line:** Priya guessed penguin first for a hundred and fifty, while Jules earns a hundred; if nobody guesses in time, nobody scores. [chuckles] Tough crowd.

### id: finale

- **On screen:** AI host: the players with a winner crowned. Player host: scoreboard with a Next round! button
- **Plays:** always
- **Line:** When time runs out, your host ends the round and taps Next on the big screen; everyone acts once. [excited] Tutorial over, let's play!

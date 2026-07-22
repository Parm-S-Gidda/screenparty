-- New games: Most Likely To, Higher or Lower, Guess the Player,
-- Shark Tank, Charades, Number Rating.
-- All tables are service-role only (no anon access).

-- ── Most Likely To ──────────────────────────────────────────────────────────

create table public.mlt_prompts (
  id uuid primary key default gen_random_uuid(),
  text text not null
);
alter table public.mlt_prompts enable row level security;
grant all on public.mlt_prompts to service_role;

create table public.mlt_votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  prompt_index integer not null,
  voter_id uuid not null references public.room_players(id) on delete cascade,
  target_player_id uuid not null references public.room_players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(session_id, prompt_index, voter_id)
);
create index mlt_votes_round_idx on public.mlt_votes(session_id, prompt_index);
alter table public.mlt_votes enable row level security;
grant all on public.mlt_votes to service_role;

insert into public.mlt_prompts (text) values
  ('forget their phone at home'),
  ('cry at a movie'),
  ('get lost using GPS'),
  ('become famous on social media'),
  ('survive a zombie apocalypse'),
  ('be late to their own wedding'),
  ('talk to strangers at a party'),
  ('eat the same meal every single day'),
  ('become a teacher'),
  ('win a Nobel Prize'),
  ('move to another country'),
  ('write a book'),
  ('accidentally text the wrong person'),
  ('end up on a reality TV show'),
  ('start a cult'),
  ('go viral for something embarrassing'),
  ('still be playing video games at 80'),
  ('befriend a random animal'),
  ('accidentally set off an alarm'),
  ('be the last person to understand a joke'),
  ('give the best advice'),
  ('stay up until 4am for no reason'),
  ('argue with a stranger on the internet'),
  ('bring snacks to every hangout without being asked'),
  ('become a millionaire'),
  ('get kicked off a flight'),
  ('cry at a commercial'),
  ('turn a 5-minute task into a 3-hour project'),
  ('secretly be a great singer'),
  ('get into a heated debate about pineapple on pizza'),
  ('be the last one to leave a party'),
  ('name their pet something completely unhinged'),
  ('invent something by accident'),
  ('have the most chaotic group chat'),
  ('cry happy tears at a dog video'),
  ('forget to charge their phone and ask to borrow yours'),
  ('end up on the news'),
  ('take 50 photos and like none of them'),
  ('have a secret talent nobody knows about'),
  ('accidentally walk into the wrong room and just go with it'),
  ('still be subscribed to a magazine from 2015'),
  ('write a strongly worded letter to a company'),
  ('get a standing ovation for something weird'),
  ('accidentally call a teacher "mom"'),
  ('fall asleep anywhere within 5 minutes'),
  ('have the most obscure hobby in the group'),
  ('be the one everyone calls in a crisis'),
  ('get emotional packing for a trip'),
  ('start a business and actually make it work'),
  ('talk to plants and swear it helps');

-- ── Higher or Lower ─────────────────────────────────────────────────────────

create table public.hol_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  label text not null,
  value numeric not null,
  unit text not null
);
alter table public.hol_items enable row level security;
grant all on public.hol_items to service_role;

create table public.hol_votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  question_index integer not null,
  player_id uuid not null references public.room_players(id) on delete cascade,
  vote text not null check(vote in ('higher', 'lower')),
  created_at timestamptz not null default now(),
  unique(session_id, question_index, player_id)
);
create index hol_votes_round_idx on public.hol_votes(session_id, question_index);
alter table public.hol_votes enable row level security;
grant all on public.hol_votes to service_role;

insert into public.hol_items (category, label, value, unit) values
  ('count', 'Keys on a standard piano', 88, 'keys'),
  ('count', 'Countries in the world', 195, 'countries'),
  ('count', 'Bones in an adult human body', 206, 'bones'),
  ('count', 'Muscles in the human body', 600, 'muscles'),
  ('count', 'Spices in the KFC original recipe', 11, 'spices & herbs'),
  ('count', 'Stripes on the US flag', 13, 'stripes'),
  ('count', 'Stars on the US flag', 50, 'stars'),
  ('count', 'Olympic rings', 5, 'rings'),
  ('count', 'Books in the Bible', 66, 'books'),
  ('count', 'Letters in the English alphabet', 26, 'letters'),
  ('count', 'Dots on a standard die (all faces)', 21, 'dots'),
  ('count', 'Players on a soccer team per side', 11, 'players'),
  ('count', 'Players on a basketball team per side', 5, 'players'),
  ('count', 'Cards in a standard deck', 52, 'cards'),
  ('count', 'Teeth a great white shark can have in a lifetime', 50000, 'teeth'),
  ('height', 'Leaning Tower of Pisa', 56, 'meters tall'),
  ('height', 'Statue of Liberty with pedestal', 93, 'meters tall'),
  ('height', 'Big Ben clock tower', 96, 'meters tall'),
  ('height', 'Eiffel Tower', 330, 'meters tall'),
  ('height', 'One World Trade Center', 541, 'meters tall'),
  ('height', 'Burj Khalifa', 828, 'meters tall'),
  ('height', 'Mount Fuji', 3776, 'meters tall'),
  ('height', 'Mont Blanc (Alps)', 4808, 'meters tall'),
  ('height', 'Mount Kilimanjaro', 5895, 'meters tall'),
  ('height', 'Mount Everest', 8849, 'meters tall'),
  ('speed', 'Average walking pace', 5, 'km/h'),
  ('speed', 'A garden snail', 0.05, 'km/h'),
  ('speed', 'A house cat (sprint)', 48, 'km/h'),
  ('speed', 'Usain Bolt top speed', 44.72, 'km/h'),
  ('speed', 'A cheetah', 120, 'km/h'),
  ('speed', 'Bullet train Shinkansen', 320, 'km/h'),
  ('speed', 'Formula 1 car top speed', 372, 'km/h'),
  ('speed', 'Commercial airliner', 900, 'km/h'),
  ('speed', 'Speed of sound in air', 1235, 'km/h'),
  ('speed', 'SR-71 Blackbird spy plane', 3540, 'km/h'),
  ('population', 'Vatican City', 800, 'people'),
  ('population', 'Iceland', 370000, 'people'),
  ('population', 'New Zealand', 5100000, 'people'),
  ('population', 'Australia', 26500000, 'people'),
  ('population', 'Canada', 38200000, 'people'),
  ('population', 'United Kingdom', 68000000, 'people'),
  ('population', 'Germany', 84000000, 'people'),
  ('population', 'United States', 335000000, 'people'),
  ('population', 'Brazil', 215000000, 'people'),
  ('population', 'China', 1410000000, 'people'),
  ('distance', 'New York to Los Angeles', 4488, 'km'),
  ('distance', 'New York to London', 5570, 'km'),
  ('distance', 'Length of the Amazon River', 6400, 'km'),
  ('distance', 'Length of the Great Wall of China', 21196, 'km'),
  ('distance', 'Circumference of the Earth', 40075, 'km'),
  ('distance', 'Diameter of the Earth', 12742, 'km'),
  ('age', 'The Eiffel Tower', 135, 'years old'),
  ('age', 'The Mona Lisa', 520, 'years old'),
  ('age', 'The Great Wall of China', 2700, 'years old'),
  ('age', 'The Great Pyramid of Giza', 4500, 'years old'),
  ('age', 'Stonehenge', 5000, 'years old'),
  ('age', 'The Colosseum in Rome', 1955, 'years old'),
  ('price', 'A Big Mac (US average)', 5.58, 'USD'),
  ('price', 'A movie ticket (US average)', 15, 'USD'),
  ('price', 'A pair of Apple AirPods', 129, 'USD'),
  ('price', 'An iPhone 16', 999, 'USD'),
  ('price', 'A Tesla Model 3', 40000, 'USD'),
  ('price', 'A Boeing 737', 100000000, 'USD'),
  ('weight', 'A house cat', 5, 'kg'),
  ('weight', 'A male lion', 190, 'kg'),
  ('weight', 'A polar bear', 450, 'kg'),
  ('weight', 'A giraffe', 800, 'kg'),
  ('weight', 'A hippo', 2500, 'kg'),
  ('weight', 'An African elephant', 6000, 'kg'),
  ('weight', 'A blue whale', 200000, 'kg');

-- ── Guess the Player ─────────────────────────────────────────────────────────

create table public.gtp_prompts (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  mode text not null default 'prompt' check(mode in ('prompt', 'fill_blank'))
);
alter table public.gtp_prompts enable row level security;
grant all on public.gtp_prompts to service_role;

create table public.gtp_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  prompt_index integer not null,
  player_id uuid not null references public.room_players(id) on delete cascade,
  answer_text text not null,
  created_at timestamptz not null default now(),
  unique(session_id, prompt_index, player_id)
);
create index gtp_answers_round_idx on public.gtp_answers(session_id, prompt_index);
alter table public.gtp_answers enable row level security;
grant all on public.gtp_answers to service_role;

create table public.gtp_guesses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  prompt_index integer not null,
  answer_player_id uuid not null references public.room_players(id) on delete cascade,
  guesser_id uuid not null references public.room_players(id) on delete cascade,
  guessed_player_id uuid not null references public.room_players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(session_id, prompt_index, answer_player_id, guesser_id)
);
create index gtp_guesses_round_idx on public.gtp_guesses(session_id, prompt_index, answer_player_id);
alter table public.gtp_guesses enable row level security;
grant all on public.gtp_guesses to service_role;

insert into public.gtp_prompts (text, mode) values
  ('What''s your all-time favourite movie?', 'prompt'),
  ('What''s the most embarrassing song on your playlist?', 'prompt'),
  ('What is your go-to fast food order?', 'prompt'),
  ('What''s a weird food combination you actually love?', 'prompt'),
  ('What''s your most-used emoji?', 'prompt'),
  ('What would the title of your autobiography be?', 'prompt'),
  ('What''s the last thing you Googled?', 'prompt'),
  ('What''s a skill you secretly wish you had?', 'prompt'),
  ('What animal would you be and why?', 'prompt'),
  ('What''s a TV show you''ve rewatched more than three times?', 'prompt'),
  ('What''s your unpopular opinion about food?', 'prompt'),
  ('What''s a movie everyone loves but you think is overrated?', 'prompt'),
  ('What''s a hobby you''ve started and never finished?', 'prompt'),
  ('What''s the weirdest thing you''ve ever Googled at 3am?', 'prompt'),
  ('What''s one word your friends would use to describe you?', 'prompt'),
  ('What''s a job you''d be terrible at?', 'prompt'),
  ('What fictional world would you actually want to live in?', 'prompt'),
  ('What''s the most ridiculous purchase you''ve ever made?', 'prompt'),
  ('What''s a superpower you wish you had?', 'prompt'),
  ('What''s your go-to karaoke song?', 'prompt'),
  ('My craziest story starts with "I was at a party when..."', 'fill_blank'),
  ('The craziest thing I have ever done is ___', 'fill_blank'),
  ('My guilty pleasure is ___', 'fill_blank'),
  ('If I had a theme song it would be ___', 'fill_blank'),
  ('In another life I would have been a ___', 'fill_blank'),
  ('My friends would describe me as ___', 'fill_blank'),
  ('My love language is ___', 'fill_blank'),
  ('The app I use way too much is ___', 'fill_blank'),
  ('My signature move at parties is ___', 'fill_blank'),
  ('If I were a snack I would be ___ because ___', 'fill_blank'),
  ('The most random fact I know is ___', 'fill_blank'),
  ('My hot take is that ___', 'fill_blank'),
  ('The first thing I do when I wake up is ___', 'fill_blank'),
  ('My morning routine could be described as ___', 'fill_blank'),
  ('If I had to eat one meal forever it would be ___', 'fill_blank');

-- ── Shark Tank ───────────────────────────────────────────────────────────────

create table public.tank_products (
  id uuid primary key default gen_random_uuid(),
  theme text not null,
  name text not null,
  tagline text not null
);
alter table public.tank_products enable row level security;
grant all on public.tank_products to service_role;

create table public.tank_investments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  round_index integer not null,
  investor_id uuid not null references public.room_players(id) on delete cascade,
  invested boolean not null,
  created_at timestamptz not null default now(),
  unique(session_id, round_index, investor_id)
);
create index tank_investments_round_idx on public.tank_investments(session_id, round_index);
alter table public.tank_investments enable row level security;
grant all on public.tank_investments to service_role;

insert into public.tank_products (theme, name, tagline) values
  ('tech', 'SnoozeShield', 'An AI alarm clock that locks your phone until you''ve actually gotten out of bed and walked to the kitchen.'),
  ('tech', 'PetTalk Pro', 'A wearable collar that translates your pet''s body language into push notifications. "Your dog is judging you."'),
  ('tech', 'NapMap', 'A GPS app that routes you to the nearest clean, quiet place to take a 20-minute nap, with live occupancy data.'),
  ('tech', 'ChoreBot', 'A robot roommate that does chores but charges you per task and sends passive-aggressive texts if you create a mess.'),
  ('tech', 'VibeCheck', 'A smart badge you wear to work that glows different colours based on your current social battery level.'),
  ('tech', 'RegreText', 'An app that delays outgoing texts by 10 minutes and lets you cancel them at any point in that window.'),
  ('tech', 'CloudDiet', 'A cloud storage service that charges extra for old photos of food and automatically deletes blurry selfies.'),
  ('food', 'CrustAway', 'A pre-sliced bread that has no crusts because you''re an adult and you still don''t eat them.'),
  ('food', 'GlowWater', 'Naturally sparkling mineral water infused with LED particles that make your mouth glow in the dark for 30 minutes.'),
  ('food', 'BrunchBox', 'A subscription service that delivers a brunch kit every Saturday — pancake mix, syrup, and an excuse not to go to the gym.'),
  ('food', 'PizzaPatch', 'A nicotine-style patch you wear on your arm that releases a light tomato-basil scent to curb pizza cravings.'),
  ('food', 'SaladGhost', 'A meal delivery service that delivers a salad alongside a cheeseburger, so you feel like you made a healthy choice.'),
  ('food', 'CoffeeTier', 'A subscription coffee service that gets progressively stronger each week until you achieve superhuman alertness.'),
  ('fashion', 'ConfidenceCoat', 'A blazer with a built-in Bluetooth speaker that plays your personal power anthem whenever you enter a room.'),
  ('fashion', 'CloutSocks', 'Designer socks with real-time stock ticker updates printed on them. Updated daily via a tiny e-ink display.'),
  ('fashion', 'BlanketSuit', 'A business-casual hoodie disguised as a blazer. Looks like you''re ready for a boardroom. Feels like your couch.'),
  ('fashion', 'MemoryHat', 'A baseball cap with a built-in camera that records 30-second GoPro-style clips when you double-tap the brim.'),
  ('fitness', 'LazyCycle', 'A stationary bike that connects to Netflix and only streams your show while you are actively pedalling.'),
  ('fitness', 'StretchBot', 'A robot stretching coach that texts you when your screen time has been too high and demands you do a sun salutation.'),
  ('fitness', 'MoodGym', 'A gym where every machine plays content matched to your current heart rate and cortisol levels.'),
  ('fitness', 'StepBribe', 'An app that pays you in gift card credits for every 10,000 steps you walk. Funded by advertisers who want you outside.'),
  ('pets', 'PawPass', 'A monthly subscription box for dogs — includes one chew toy, one treat, and one apology card from their owner.'),
  ('pets', 'AquaChat', 'A smart fish tank that texts you daily mood updates from your fish based on their swimming patterns.'),
  ('pets', 'CatSpa', 'A self-cleaning cat hammock with built-in heating that auto-books a grooming appointment when your cat looks too scruffy.'),
  ('travel', 'VibeVisa', 'A travel app that recommends countries to visit based solely on your current music taste and average sleep schedule.'),
  ('travel', 'NapJet', 'A first-class airline service where every seat is a lie-flat pod and the entire menu is breakfast food at all hours.'),
  ('travel', 'SurpriseStay', 'A hotel booking app where you don''t find out where you''re staying until you''re in the cab. Premium mystery experience.'),
  ('education', 'GradBot', 'An AI tutor that texts you random exam questions throughout the day and roasts you (gently) when you get them wrong.'),
  ('education', 'SkillSprint', 'A 7-minute morning app that teaches you one micro-skill per day — lockpicking, astrophysics, origami, etc.'),
  ('education', 'FlashFear', 'Flashcard study app that locks your most-used social app until you complete your daily deck. Ruthless. Effective.'),
  ('home', 'MoodLamp', 'A smart lamp that reads the energy in the room and changes colour to subtly hint that it''s time for guests to leave.'),
  ('home', 'FridgeJudge', 'A fridge camera with an AI that tracks what you buy vs. what expires, and texts your therapist a monthly grocery report.'),
  ('home', 'SilentDisco Shower', 'A waterproof Bluetooth shower speaker that detects your song choice and rates your vocal performance after each session.'),
  ('random', 'UmbrellaAlert', 'A smart umbrella handle that buzzes when rain is detected within 2 hours of your current location. No app needed.'),
  ('random', 'ErrorBox', 'A subscription "mystery fail kit" — failed inventions, discontinued products, recalled items. Educational and hilarious.'),
  ('random', 'TruthMirror', 'A bathroom mirror that greets you each morning with one extremely honest and motivating piece of feedback.'),
  ('random', 'SnoreScribe', 'A device that listens to your snoring and turns the audio into ambient music you can sell on SoundCloud.'),
  ('random', 'WorryJar', 'A physical jar with a slot on top — you write your worries on paper, seal them inside, and the app tracks if they came true.'),
  ('random', 'SocksOMatic', 'A laundry machine add-on that sorts, pairs, and folds socks automatically. One product for one very specific pain point.');

-- ── Charades ─────────────────────────────────────────────────────────────────

create table public.charades_words (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  category text not null,
  difficulty text not null default 'medium' check(difficulty in ('easy', 'medium', 'hard'))
);
alter table public.charades_words enable row level security;
grant all on public.charades_words to service_role;

insert into public.charades_words (word, category, difficulty) values
  -- Easy – animals
  ('dog', 'animals', 'easy'), ('cat', 'animals', 'easy'), ('elephant', 'animals', 'easy'),
  ('monkey', 'animals', 'easy'), ('shark', 'animals', 'easy'), ('penguin', 'animals', 'easy'),
  ('giraffe', 'animals', 'easy'), ('kangaroo', 'animals', 'easy'), ('snake', 'animals', 'easy'),
  ('dinosaur', 'animals', 'easy'), ('flamingo', 'animals', 'easy'), ('octopus', 'animals', 'easy'),
  -- Easy – actions
  ('swimming', 'actions', 'easy'), ('sleeping', 'actions', 'easy'), ('dancing', 'actions', 'easy'),
  ('cooking', 'actions', 'easy'), ('running', 'actions', 'easy'), ('reading', 'actions', 'easy'),
  ('singing', 'actions', 'easy'), ('painting', 'actions', 'easy'), ('crying', 'actions', 'easy'),
  ('laughing', 'actions', 'easy'), ('jumping', 'actions', 'easy'), ('driving', 'actions', 'easy'),
  -- Easy – objects
  ('umbrella', 'objects', 'easy'), ('telephone', 'objects', 'easy'), ('television', 'objects', 'easy'),
  ('bicycle', 'objects', 'easy'), ('scissors', 'objects', 'easy'), ('guitar', 'objects', 'easy'),
  ('camera', 'objects', 'easy'), ('microwave', 'objects', 'easy'), ('hammock', 'objects', 'easy'),
  -- Medium – movies
  ('The Lion King', 'movies', 'medium'), ('Titanic', 'movies', 'medium'), ('Inception', 'movies', 'medium'),
  ('Jurassic Park', 'movies', 'medium'), ('The Matrix', 'movies', 'medium'), ('Home Alone', 'movies', 'medium'),
  ('Frozen', 'movies', 'medium'), ('Finding Nemo', 'movies', 'medium'), ('Avatar', 'movies', 'medium'),
  ('Avengers', 'movies', 'medium'), ('Harry Potter', 'movies', 'medium'), ('Toy Story', 'movies', 'medium'),
  ('The Notebook', 'movies', 'medium'), ('Shrek', 'movies', 'medium'), ('Spider-Man', 'movies', 'medium'),
  -- Medium – professions
  ('astronaut', 'professions', 'medium'), ('surgeon', 'professions', 'medium'), ('chef', 'professions', 'medium'),
  ('firefighter', 'professions', 'medium'), ('pilot', 'professions', 'medium'), ('detective', 'professions', 'medium'),
  ('architect', 'professions', 'medium'), ('magician', 'professions', 'medium'), ('referee', 'professions', 'medium'),
  -- Medium – sports
  ('basketball', 'sports', 'medium'), ('volleyball', 'sports', 'medium'), ('golf', 'sports', 'medium'),
  ('wrestling', 'sports', 'medium'), ('bowling', 'sports', 'medium'), ('fencing', 'sports', 'medium'),
  ('curling', 'sports', 'medium'), ('pole vault', 'sports', 'medium'), ('synchronized swimming', 'sports', 'medium'),
  -- Medium – places
  ('Eiffel Tower', 'places', 'medium'), ('Great Wall of China', 'places', 'medium'), ('Niagara Falls', 'places', 'medium'),
  ('Mount Everest', 'places', 'medium'), ('Amazon Rainforest', 'places', 'medium'), ('Las Vegas', 'places', 'medium'),
  -- Hard – abstract
  ('democracy', 'abstract', 'hard'), ('gravity', 'abstract', 'hard'), ('infinity', 'abstract', 'hard'),
  ('nostalgia', 'abstract', 'hard'), ('déjà vu', 'abstract', 'hard'), ('procrastination', 'abstract', 'hard'),
  ('sarcasm', 'abstract', 'hard'), ('insomnia', 'abstract', 'hard'), ('jealousy', 'abstract', 'hard'),
  -- Hard – movies
  ('Parasite', 'movies', 'hard'), ('Eternal Sunshine of the Spotless Mind', 'movies', 'hard'),
  ('The Grand Budapest Hotel', 'movies', 'hard'), ('Interstellar', 'movies', 'hard'),
  ('2001: A Space Odyssey', 'movies', 'hard'), ('Pulp Fiction', 'movies', 'hard'),
  -- Hard – compound actions
  ('proposing marriage', 'actions', 'hard'), ('parallel parking', 'actions', 'hard'),
  ('giving a TED talk', 'actions', 'hard'), ('online shopping at 2am', 'actions', 'hard'),
  ('arguing with autocorrect', 'actions', 'hard'), ('forgetting someone''s name', 'actions', 'hard'),
  ('pretending to be busy', 'actions', 'hard'), ('trying to remember a dream', 'actions', 'hard');

-- ── Number Rating Game ───────────────────────────────────────────────────────

create table public.num_themes (
  id uuid primary key default gen_random_uuid(),
  theme text not null,
  scale_low text not null default 'Worst',
  scale_high text not null default 'Best'
);
alter table public.num_themes enable row level security;
grant all on public.num_themes to service_role;

create table public.num_examples (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  round_index integer not null,
  player_id uuid not null references public.room_players(id) on delete cascade,
  example_text text not null,
  actual_number integer not null check(actual_number between 1 and 10),
  created_at timestamptz not null default now(),
  unique(session_id, round_index, player_id)
);
create index num_examples_round_idx on public.num_examples(session_id, round_index);
alter table public.num_examples enable row level security;
grant all on public.num_examples to service_role;

create table public.num_guesses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  round_index integer not null,
  guesser_id uuid not null references public.room_players(id) on delete cascade,
  example_player_id uuid not null references public.room_players(id) on delete cascade,
  guessed_number integer not null check(guessed_number between 1 and 10),
  created_at timestamptz not null default now(),
  unique(session_id, round_index, guesser_id, example_player_id)
);
create index num_guesses_round_idx on public.num_guesses(session_id, round_index);
alter table public.num_guesses enable row level security;
grant all on public.num_guesses to service_role;

insert into public.num_themes (theme, scale_low, scale_high) values
  ('Movies', 'Worst ever made', 'All-time masterpiece'),
  ('Songs', 'Complete skip', 'Absolute banger'),
  ('Vacation destinations', 'Never in my life', 'Bucket list top pick'),
  ('Pizza toppings', 'Should not exist', 'Essential every time'),
  ('Superpowers', 'Completely useless', 'Overpowered dream'),
  ('School subjects', 'Pure torture', 'Actually loved it'),
  ('Animals as pets', 'Nightmare pet', 'Perfect companion'),
  ('Decades to live in', 'Absolutely not', 'Sign me up'),
  ('Reality TV shows', 'Painful to watch', 'Guilty pleasure obsession'),
  ('Fast food chains', 'Hard pass', 'Craving it right now'),
  ('Board games', 'Ruins friendships', 'Instant classic'),
  ('Morning routines', 'Who does this', 'Actually life-changing'),
  ('Workout types', 'I would die', 'Love it, do it daily'),
  ('Social media platforms', 'Deleted the app', 'Can''t put it down'),
  ('Flavours of chips', 'Return to sender', 'Eat the whole bag'),
  ('Phobias', 'Barely bothers me', 'Absolutely terrifying'),
  ('Jobs I''d be terrible at', 'I might survive', 'Instant disaster'),
  ('Coffee orders', 'Not a real coffee', 'Exactly what I need'),
  ('Plot twists in movies', 'Saw it coming', 'My mind was blown'),
  ('Names for a pet rock', 'Hard no', 'Perfection');

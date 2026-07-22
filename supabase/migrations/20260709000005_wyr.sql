-- Majority Would You Rather (PRD §29). The question pool is server-sampled;
-- per-round choices and majority predictions stay secret until the engine
-- reveals them in public_payload — so both tables are service-role only.

create table public.wyr_questions (
  id uuid primary key default gen_random_uuid(),
  option_a text not null,
  option_b text not null
);
alter table public.wyr_questions enable row level security;

create table public.wyr_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  question_index integer not null,
  player_id uuid not null references public.room_players (id) on delete cascade,
  choice text not null check (choice in ('a', 'b')),
  prediction text not null check (prediction in ('a', 'b')),
  created_at timestamptz not null default now(),
  unique (session_id, question_index, player_id)
);
create index wyr_answers_round_idx on public.wyr_answers (session_id, question_index);
alter table public.wyr_answers enable row level security;

grant all on public.wyr_questions to service_role;
grant all on public.wyr_answers to service_role;

insert into public.wyr_questions (option_a, option_b) values
  ('Be able to fly', 'Be able to turn invisible'),
  ('Always be 10 minutes late', 'Always be 30 minutes early'),
  ('Live without music', 'Live without movies'),
  ('Have unlimited pizza for life', 'Have unlimited tacos for life'),
  ('Be able to talk to animals', 'Speak every human language'),
  ('Live in a treehouse', 'Live in a houseboat'),
  ('Never use social media again', 'Never watch another TV show'),
  ('Have a rewind button for your life', 'Have a pause button for your life'),
  ('Be the funniest person in the room', 'Be the smartest person in the room'),
  ('Always have to sing instead of speak', 'Always have to dance everywhere you go'),
  ('Vacation at the beach forever', 'Vacation in the mountains forever'),
  ('Give up coffee forever', 'Give up dessert forever'),
  ('Fight one horse-sized duck', 'Fight a hundred duck-sized horses'),
  ('Know every fact in the world', 'Master every instrument in the world'),
  ('Only eat breakfast foods', 'Only eat dinner foods'),
  ('Be famous but always broke', 'Be rich but totally unknown'),
  ('Have to whisper forever', 'Have to shout forever'),
  ('Time-travel to the past', 'Time-travel to the future'),
  ('Have a personal chef', 'Have a personal chauffeur'),
  ('Never wait in line again', 'Never sit in traffic again'),
  ('Be a superhero with a silly power', 'Be a villain with an amazing power'),
  ('Always know when someone is lying', 'Always get away with your own lies'),
  ('Live one 1000-year life', 'Live ten 100-year lives'),
  ('Have hands for feet', 'Have feet for hands'),
  ('Only be able to text', 'Only be able to call'),
  ('Win an Olympic gold medal', 'Win an Oscar'),
  ('Be too hot all the time', 'Be too cold all the time'),
  ('Have a dragon', 'Be a dragon'),
  ('Eat your favourite meal every day forever', 'Never eat the same meal twice'),
  ('Read minds but hear everything', 'See the future but only 10 seconds ahead'),
  ('Have free flights for life', 'Have free food for life'),
  ('Sleep 4 hours and feel rested', 'Need 10 hours but dream anything you want'),
  ('Be barefoot forever', 'Wear wet socks forever'),
  ('Speak in rhymes forever', 'Speak in questions forever'),
  ('Have a photographic memory', 'Be able to forget anything on command'),
  ('Live where it is always summer', 'Live where it is always winter'),
  ('Be your pet for a day', 'Have your pet be you for a day'),
  ('Own a private island', 'Own a private jet'),
  ('Redo high school knowing what you know', 'Skip straight to comfortable retirement'),
  ('Have every song stuck in your head', 'Never remember any song lyrics');

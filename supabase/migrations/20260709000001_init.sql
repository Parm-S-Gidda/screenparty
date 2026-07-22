-- ScreenParty initial schema (PRD §23)
-- Server-authoritative: clients get read-only access to non-secret tables;
-- all writes go through API routes using the service-role key (bypasses RLS).

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  plan_tier text not null default 'free' check (plan_tier in ('free', 'paid')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner can read" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: owner can update" on public.profiles
  for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- subscriptions + usage (Phase 4 / cost tracking; schema now, unused until then)
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive',
  price_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;

create table public.usage_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  metric text not null,
  period_start date not null,
  used integer not null default 0,
  unique (user_id, metric, period_start)
);
alter table public.usage_limits enable row level security;

-- ---------------------------------------------------------------------------
-- rooms
-- ---------------------------------------------------------------------------
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users (id) on delete cascade,
  room_code text not null,
  status text not null default 'lobby' check (status in ('lobby', 'in_game', 'ended', 'expired')),
  plan_tier text not null default 'free',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '2 hours'
);

-- one active room per code at a time
create unique index rooms_active_code_idx on public.rooms (room_code)
  where status in ('lobby', 'in_game');

alter table public.rooms enable row level security;

-- Anon clients (main screen, players) need to see the room row for realtime
-- status updates. Row visibility limited to active rooms; joining still goes
-- through the server API.
create policy "rooms: active rooms readable" on public.rooms
  for select using (status in ('lobby', 'in_game') or auth.uid() = host_user_id);

-- ---------------------------------------------------------------------------
-- room_players (public roster; NO secrets here — realtime broadcasts rows)
-- ---------------------------------------------------------------------------
create table public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  username text not null,
  avatar_id text not null,
  is_kicked boolean not null default false,
  is_host boolean not null default false, -- selected self-host player
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index room_players_room_idx on public.room_players (room_id);

alter table public.room_players enable row level security;
create policy "room_players: readable" on public.room_players for select using (true);

-- Player auth tokens live in a separate service-role-only table so the
-- roster can be broadcast without leaking credentials.
create table public.player_secrets (
  player_id uuid primary key references public.room_players (id) on delete cascade,
  session_token uuid not null unique default gen_random_uuid()
);
alter table public.player_secrets enable row level security; -- no policies: service role only

-- ---------------------------------------------------------------------------
-- game_sessions
-- ---------------------------------------------------------------------------
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  game_type text not null default 'buzz_trivia',
  host_mode text not null default 'self' check (host_mode in ('self', 'virtual')),
  current_state text not null default 'LOBBY',
  current_question_index integer not null default 0,
  current_player_id uuid references public.room_players (id),
  question_count integer not null default 0,
  settings jsonb not null default '{}'::jsonb,
  -- Everything clients are allowed to render right now (question text after
  -- display, correct answer only after reveal, buzz info, podium...). The
  -- server engine is the only writer.
  public_payload jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  updated_at timestamptz not null default now()
);
create index game_sessions_room_idx on public.game_sessions (room_id);

alter table public.game_sessions enable row level security;
create policy "game_sessions: readable" on public.game_sessions for select using (true);

-- ---------------------------------------------------------------------------
-- game_questions (answers live here — never client readable)
-- ---------------------------------------------------------------------------
create table public.game_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  question_index integer not null,
  question_text text not null,
  correct_answer text not null,
  accepted_answers jsonb not null default '[]'::jsonb,
  difficulty text not null default 'medium',
  source text not null default 'pack',
  unique (session_id, question_index)
);
alter table public.game_questions enable row level security; -- no policies: service role only

-- ---------------------------------------------------------------------------
-- buzzes (server-authoritative order via trigger + advisory lock)
-- ---------------------------------------------------------------------------
create table public.buzzes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  question_id uuid not null references public.game_questions (id) on delete cascade,
  player_id uuid not null references public.room_players (id) on delete cascade,
  server_received_at timestamptz not null default now(),
  buzz_order integer not null default 0,
  used_attempt boolean not null default false,
  unique (question_id, player_id)
);
create index buzzes_question_idx on public.buzzes (question_id, buzz_order);

create or replace function public.assign_buzz_order()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  -- serialize concurrent buzzes for the same question so order is gapless
  perform pg_advisory_xact_lock(hashtext(new.question_id::text));
  select coalesce(max(buzz_order), 0) + 1 into new.buzz_order
  from public.buzzes where question_id = new.question_id;
  return new;
end;
$$;

create trigger buzzes_assign_order
  before insert on public.buzzes
  for each row execute function public.assign_buzz_order();

alter table public.buzzes enable row level security;
create policy "buzzes: readable" on public.buzzes for select using (true);

-- ---------------------------------------------------------------------------
-- answers
-- ---------------------------------------------------------------------------
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  question_id uuid not null references public.game_questions (id) on delete cascade,
  player_id uuid not null references public.room_players (id) on delete cascade,
  submitted_answer text,
  is_correct boolean,
  judged_by text check (judged_by in ('local_exact', 'local_accepted_answer', 'local_fuzzy', 'llm', 'manual_host')),
  confidence real,
  created_at timestamptz not null default now()
);
create index answers_question_idx on public.answers (question_id);

alter table public.answers enable row level security;
create policy "answers: readable" on public.answers for select using (true);

-- ---------------------------------------------------------------------------
-- scores
-- ---------------------------------------------------------------------------
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  player_id uuid not null references public.room_players (id) on delete cascade,
  score integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (session_id, player_id)
);

alter table public.scores enable row level security;
create policy "scores: readable" on public.scores for select using (true);

-- ---------------------------------------------------------------------------
-- question packs (metadata public, questions private)
-- ---------------------------------------------------------------------------
create table public.question_packs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  topic text not null,
  description text,
  difficulty text not null default 'mixed',
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.question_packs enable row level security;
create policy "question_packs: readable" on public.question_packs for select using (true);

create table public.pack_questions (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.question_packs (id) on delete cascade,
  question_text text not null,
  correct_answer text not null,
  accepted_answers jsonb not null default '[]'::jsonb,
  difficulty text not null default 'medium'
);
create index pack_questions_pack_idx on public.pack_questions (pack_id);
alter table public.pack_questions enable row level security; -- no policies: answers are secret

-- public question counts without exposing questions
create or replace view public.question_pack_counts
  with (security_invoker = off) as
  select pack_id, count(*)::integer as question_count, count(distinct difficulty)::integer as difficulty_count
  from public.pack_questions group by pack_id;

-- ---------------------------------------------------------------------------
-- AI tables (Phase 3; schema now so the engine can log from day one)
-- ---------------------------------------------------------------------------
create table public.ai_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.game_sessions (id) on delete cascade,
  moment text not null,
  input_payload jsonb,
  output_text text,
  moderation_status text,
  voice_clip_id uuid,
  created_at timestamptz not null default now()
);
alter table public.ai_events enable row level security;

create table public.voice_clips (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  text text not null,
  voice_provider text not null default 'elevenlabs',
  voice_id text,
  audio_url text,
  created_at timestamptz not null default now()
);
alter table public.voice_clips enable row level security;

-- ---------------------------------------------------------------------------
-- grants
-- New tables are no longer auto-exposed to the Data API roles; RLS policies
-- alone are not enough. service_role gets everything (used by the app's
-- server-side admin client); anon/authenticated only get SELECT on the
-- tables whose rows are public game state. Secret tables (game_questions,
-- pack_questions, player_secrets, ...) get no client grants at all.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant select on public.rooms to anon, authenticated;
grant select on public.room_players to anon, authenticated;
grant select on public.game_sessions to anon, authenticated;
grant select on public.buzzes to anon, authenticated;
grant select on public.answers to anon, authenticated;
grant select on public.scores to anon, authenticated;
grant select on public.question_packs to anon, authenticated;
grant select on public.question_pack_counts to anon, authenticated;
grant select, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_players;
alter publication supabase_realtime add table public.game_sessions;
alter publication supabase_realtime add table public.scores;
alter publication supabase_realtime add table public.buzzes;

-- Two Truths and a Lie (PRD §29). Statements and votes are secret until the
-- engine reveals them in game_sessions.public_payload: which statement is the
-- odd one out must never be client-readable, and live votes must not be
-- visible while voting is open. So: no RLS policies, no anon grants —
-- service-role only, same treatment as game_questions.

create table public.ttal_statements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  player_id uuid not null references public.room_players (id) on delete cascade,
  statement_index integer not null check (statement_index between 0 and 2),
  text text not null,
  is_odd boolean not null default false, -- the lie (or the truth in the two-lies variation)
  created_at timestamptz not null default now(),
  unique (session_id, player_id, statement_index)
);
create index ttal_statements_session_idx on public.ttal_statements (session_id, player_id);
alter table public.ttal_statements enable row level security;

create table public.ttal_votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  subject_player_id uuid not null references public.room_players (id) on delete cascade,
  voter_player_id uuid not null references public.room_players (id) on delete cascade,
  statement_id uuid not null references public.ttal_statements (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (session_id, subject_player_id, voter_player_id)
);
create index ttal_votes_round_idx on public.ttal_votes (session_id, subject_player_id);
alter table public.ttal_votes enable row level security;

grant all on public.ttal_statements to service_role;
grant all on public.ttal_votes to service_role;

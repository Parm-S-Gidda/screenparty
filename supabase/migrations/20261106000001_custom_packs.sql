-- Custom question packs: authenticated hosts can build their own trivia packs.
-- Answers remain service-role only (same secrecy model as built-in packs).

create table public.custom_packs (
  id          uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  description text,
  created_at  timestamptz not null default now()
);
alter table public.custom_packs enable row level security;
grant all on public.custom_packs to service_role;

-- Owners can list their own packs (title/description only)
create policy "custom_packs: owner reads"
  on public.custom_packs for select
  using (auth.uid() = host_user_id);

create table public.custom_pack_questions (
  id              uuid primary key default gen_random_uuid(),
  pack_id         uuid not null references public.custom_packs (id) on delete cascade,
  question_text   text not null,
  correct_answer  text not null,
  accepted_answers jsonb not null default '[]'::jsonb,
  difficulty      text not null default 'medium'
                  check (difficulty in ('easy', 'medium', 'hard')),
  created_at      timestamptz not null default now()
);
create index custom_pack_questions_pack_idx on public.custom_pack_questions (pack_id);
alter table public.custom_pack_questions enable row level security;
-- No client-readable policies: answers are secret until revealed by the engine
grant all on public.custom_pack_questions to service_role;

-- Public question count without exposing answers (joins the existing pattern)
create or replace view public.custom_pack_counts
  with (security_invoker = off) as
  select pack_id, count(*)::integer as question_count
  from public.custom_pack_questions group by pack_id;

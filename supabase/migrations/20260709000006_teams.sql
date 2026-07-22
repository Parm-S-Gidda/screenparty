-- Team mode (PRD §7 future settings, §29 team variants). Two fixed teams;
-- assignment is public lobby state so it lives on room_players (already
-- anon-readable for the roster).
alter table public.room_players
  add column team text check (team in ('red', 'blue'));

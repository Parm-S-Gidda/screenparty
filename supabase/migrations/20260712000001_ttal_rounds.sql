-- TTAL multi-round support: the game now runs N rounds (default 3), and every
-- round players write a fresh set of statements. Statements and votes are
-- scoped to a round so uniqueness holds per round, not per game.

alter table public.ttal_statements add column round_number integer not null default 0;
alter table public.ttal_statements
  drop constraint ttal_statements_session_id_player_id_statement_index_key;
alter table public.ttal_statements
  add unique (session_id, player_id, round_number, statement_index);

alter table public.ttal_votes add column round_number integer not null default 0;
alter table public.ttal_votes
  drop constraint ttal_votes_session_id_subject_player_id_voter_player_id_key;
alter table public.ttal_votes
  add unique (session_id, subject_player_id, voter_player_id, round_number);

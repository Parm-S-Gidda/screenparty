-- Public bucket for cached AI host voice clips (PRD §13). Clips contain no
-- secrets (just spoken host lines) so public read is fine; writes go through
-- the service role only.
insert into storage.buckets (id, name, public)
values ('voice', 'voice', true)
on conflict (id) do nothing;

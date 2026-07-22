-- One subscription row per user so webhook handlers can upsert by user_id.
alter table public.subscriptions
  add constraint subscriptions_user_unique unique (user_id);

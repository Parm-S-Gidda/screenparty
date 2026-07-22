-- Pricing tiers v2: free / Party+ ($10/mo) / Pro Host ($30/mo), plus a
-- one-time 24h "Party Pass" that grants Party+ limits without a subscription.
-- profiles.plan_tier reflects the subscription only; the day pass lives in
-- day_pass_expires_at and the effective tier is resolved in code.

alter table public.profiles drop constraint profiles_plan_tier_check;
update public.profiles set plan_tier = 'party_plus' where plan_tier = 'paid';
alter table public.profiles
  add constraint profiles_plan_tier_check
  check (plan_tier in ('free', 'party_plus', 'pro_host'));

alter table public.profiles add column day_pass_expires_at timestamptz;

-- Stripe webhooks can arrive out of order: remember the newest event applied
-- so an older, delayed event can't overwrite fresher subscription state.
alter table public.subscriptions add column latest_event_at timestamptz;

-- room rows snapshot the effective tier at creation
update public.rooms set plan_tier = 'party_plus' where plan_tier = 'paid';

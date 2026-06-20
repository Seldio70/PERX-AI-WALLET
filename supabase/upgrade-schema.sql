alter table if exists public.users
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

alter table if exists public.redemptions
  add column if not exists selection_request_id uuid references public.selection_requests(id) on delete set null;

create unique index if not exists users_auth_user_id_unique
  on public.users (auth_user_id)
  where auth_user_id is not null;

create index if not exists users_role_company_idx
  on public.users (role, company_id);

create unique index if not exists provider_profiles_user_unique
  on public.provider_profiles (user_id);

create index if not exists provider_profiles_category_city_idx
  on public.provider_profiles (category, city);

create unique index if not exists benefits_provider_id_title_unique
  on public.benefits (provider_id, title)
  where provider_id is not null;

create index if not exists benefits_active_city_category_idx
  on public.benefits (is_active, city, category);

create index if not exists employer_invites_employee_status_idx
  on public.employer_invites (employee_id, status);

create index if not exists selection_requests_employer_status_idx
  on public.selection_requests (employer_id, status, created_at desc);

create index if not exists selection_requests_employee_created_idx
  on public.selection_requests (employee_id, created_at desc);

create unique index if not exists selection_items_request_benefit_unique
  on public.selection_items (selection_request_id, benefit_id);

create index if not exists selection_items_provider_idx
  on public.selection_items (provider_id);

create index if not exists points_ledger_user_created_idx
  on public.points_ledger (user_id, created_at desc);

create index if not exists challenges_employer_status_idx
  on public.challenges (employer_id, status, created_at desc);

create unique index if not exists redemptions_qr_code_unique
  on public.redemptions (qr_code)
  where qr_code is not null;

create index if not exists redemptions_provider_status_idx
  on public.redemptions (provider_id, status, created_at desc);

create index if not exists redemptions_employer_created_idx
  on public.redemptions (employer_id, created_at desc);

-- Offer image storage (also run npm run setup:storage for the bucket)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'offer-images',
  'offer-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "offer images public read" on storage.objects;
create policy "offer images public read"
on storage.objects for select
to public
using (bucket_id = 'offer-images');

drop policy if exists "offer images anon insert" on storage.objects;
create policy "offer images anon insert"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'offer-images');

drop policy if exists "offer images anon update" on storage.objects;
create policy "offer images anon update"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'offer-images');

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'companies_budget_nonnegative'
  ) then
    alter table public.companies
      add constraint companies_budget_nonnegative check (monthly_budget_per_employee >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'users_years_employed_nonnegative'
  ) then
    alter table public.users
      add constraint users_years_employed_nonnegative check (years_employed >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'users_points_balance_nonnegative'
  ) then
    alter table public.users
      add constraint users_points_balance_nonnegative check (points_balance >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'provider_profiles_category_allowed'
  ) then
    alter table public.provider_profiles
      add constraint provider_profiles_category_allowed
      check (category in ('Health', 'Food', 'Fitness', 'Family', 'Learning', 'Mobility', 'Wellness')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'benefits_price_nonnegative'
  ) then
    alter table public.benefits
      add constraint benefits_price_nonnegative check (price >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'benefits_points_price_nonnegative'
  ) then
    alter table public.benefits
      add constraint benefits_points_price_nonnegative check (points_price >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'benefits_category_allowed'
  ) then
    alter table public.benefits
      add constraint benefits_category_allowed
      check (category in ('Health', 'Food', 'Fitness', 'Family', 'Learning', 'Mobility', 'Wellness')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'employer_wallet_cards_points_nonnegative'
  ) then
    alter table public.employer_wallet_cards
      add constraint employer_wallet_cards_points_nonnegative check (points >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'challenges_reward_points_nonnegative'
  ) then
    alter table public.challenges
      add constraint challenges_reward_points_nonnegative check (reward_points >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'redemptions_amount_nonnegative'
  ) then
    alter table public.redemptions
      add constraint redemptions_amount_nonnegative check (amount >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'redemptions_points_spent_nonnegative'
  ) then
    alter table public.redemptions
      add constraint redemptions_points_spent_nonnegative check (points_spent >= 0) not valid;
  end if;
end $$;

create table if not exists public.employer_enabled_benefits (
  employer_id uuid not null references public.users(id) on delete cascade,
  benefit_id uuid not null references public.benefits(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (employer_id, benefit_id)
);

create index if not exists employer_enabled_benefits_employer_idx
  on public.employer_enabled_benefits (employer_id);

alter table public.employer_enabled_benefits enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'employer_enabled_benefits'
      and policyname = 'demo read employer enabled benefits'
  ) then
    create policy "demo read employer enabled benefits"
      on public.employer_enabled_benefits for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'employer_enabled_benefits'
      and policyname = 'demo insert employer enabled benefits'
  ) then
    create policy "demo insert employer enabled benefits"
      on public.employer_enabled_benefits for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'employer_enabled_benefits'
      and policyname = 'demo delete employer enabled benefits'
  ) then
    create policy "demo delete employer enabled benefits"
      on public.employer_enabled_benefits for delete using (true);
  end if;
end $$;

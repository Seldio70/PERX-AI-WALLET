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

-- Unified challenge system (definitions + per-employee progress)
create table if not exists public.challenge_definitions (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('platform', 'employer')),
  employer_id uuid references public.users(id) on delete cascade,
  template_key text,
  title text not null,
  description text,
  reward_points int not null default 0 check (reward_points >= 0),
  criterion jsonb not null default '{"kind":"manual"}'::jsonb,
  target_type text not null default 'everyone' check (target_type in ('everyone', 'employee')),
  target_employee_id uuid references public.users(id) on delete cascade,
  due_date date,
  point_cap int,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists challenge_definitions_employer_active_idx
  on public.challenge_definitions (employer_id, active, created_at desc);

create unique index if not exists challenge_definitions_employer_template_unique
  on public.challenge_definitions (employer_id, template_key)
  where template_key is not null and employer_id is not null;

create table if not exists public.challenge_progress (
  id uuid primary key default gen_random_uuid(),
  definition_id uuid not null references public.challenge_definitions(id) on delete cascade,
  employee_id uuid not null references public.users(id) on delete cascade,
  current_value int not null default 0 check (current_value >= 0),
  target_value int not null default 1 check (target_value >= 1),
  status text not null default 'open' check (status in ('open', 'completed')),
  completed_at timestamptz,
  completed_by text check (completed_by in ('auto', 'employer_override')),
  created_at timestamptz not null default now(),
  unique (definition_id, employee_id)
);

create index if not exists challenge_progress_employee_status_idx
  on public.challenge_progress (employee_id, status);

create index if not exists challenge_progress_definition_status_idx
  on public.challenge_progress (definition_id, status);

create table if not exists public.employee_login_days (
  employee_id uuid not null references public.users(id) on delete cascade,
  login_date date not null,
  created_at timestamptz not null default now(),
  primary key (employee_id, login_date)
);

create table if not exists public.employer_disabled_challenge_templates (
  employer_id uuid not null references public.users(id) on delete cascade,
  template_key text not null,
  created_at timestamptz not null default now(),
  primary key (employer_id, template_key)
);

alter table public.challenge_definitions enable row level security;
alter table public.challenge_progress enable row level security;
alter table public.employee_login_days enable row level security;
alter table public.employer_disabled_challenge_templates enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'challenge_definitions' and policyname = 'demo read challenge definitions'
  ) then
    create policy "demo read challenge definitions" on public.challenge_definitions for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'challenge_definitions' and policyname = 'demo insert challenge definitions'
  ) then
    create policy "demo insert challenge definitions" on public.challenge_definitions for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'challenge_definitions' and policyname = 'demo update challenge definitions'
  ) then
    create policy "demo update challenge definitions" on public.challenge_definitions for update using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'challenge_progress' and policyname = 'demo read challenge progress'
  ) then
    create policy "demo read challenge progress" on public.challenge_progress for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'challenge_progress' and policyname = 'demo insert challenge progress'
  ) then
    create policy "demo insert challenge progress" on public.challenge_progress for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'challenge_progress' and policyname = 'demo update challenge progress'
  ) then
    create policy "demo update challenge progress" on public.challenge_progress for update using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'employee_login_days' and policyname = 'demo read employee login days'
  ) then
    create policy "demo read employee login days" on public.employee_login_days for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'employee_login_days' and policyname = 'demo insert employee login days'
  ) then
    create policy "demo insert employee login days" on public.employee_login_days for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'employer_disabled_challenge_templates' and policyname = 'demo read disabled templates'
  ) then
    create policy "demo read disabled templates" on public.employer_disabled_challenge_templates for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'employer_disabled_challenge_templates' and policyname = 'demo insert disabled templates'
  ) then
    create policy "demo insert disabled templates" on public.employer_disabled_challenge_templates for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'employer_disabled_challenge_templates' and policyname = 'demo delete disabled templates'
  ) then
    create policy "demo delete disabled templates" on public.employer_disabled_challenge_templates for delete using (true);
  end if;
end $$;

-- Challenge definition extensions (start date, award budget)
alter table public.challenge_definitions add column if not exists start_date date;
alter table public.challenge_definitions add column if not exists max_awards int check (max_awards is null or max_awards > 0);

alter table public.challenge_progress add column if not exists submitted_at timestamptz;

drop table if exists public.employer_enabled_benefits;
drop table if exists public.redemptions;
drop table if exists public.selection_items;
drop table if exists public.selection_requests;
drop table if exists public.challenges;
drop table if exists public.employer_wallet_cards;
drop table if exists public.points_ledger;
drop table if exists public.employer_invites;
drop table if exists public.benefits;
drop table if exists public.provider_profiles;
alter table if exists public.companies drop constraint if exists companies_employer_id_fkey;
drop table if exists public.users;
drop table if exists public.companies;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  country text not null default 'Albania',
  city text not null default 'Tirana',
  currency text not null default 'ALL',
  employer_id uuid,
  monthly_budget_per_employee numeric not null default 6000 check (monthly_budget_per_employee >= 0),
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text unique not null,
  role text check (role in ('employee', 'employer', 'business')) not null,
  company_id uuid references public.companies(id) on delete set null,
  invited_by_user_id uuid references public.users(id) on delete set null,
  years_employed int default 0 check (years_employed >= 0),
  points_balance int not null default 0 check (points_balance >= 0),
  created_at timestamptz not null default now()
);

create index users_role_company_idx
  on public.users (role, company_id);

alter table public.companies
  add constraint companies_employer_id_fkey
  foreign key (employer_id) references public.users(id) on delete set null;

create table public.provider_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  business_name text unique not null,
  logo_url text,
  description text,
  category text check (category in ('Health', 'Food', 'Fitness', 'Family', 'Learning', 'Mobility', 'Wellness')) not null,
  city text not null default 'Tirana',
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index provider_profiles_user_unique
  on public.provider_profiles (user_id);

create index provider_profiles_category_city_idx
  on public.provider_profiles (category, city);

create table public.benefits (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.provider_profiles(id) on delete cascade,
  business_id uuid references public.users(id) on delete cascade,
  provider_name text not null,
  title text not null,
  description text,
  discount text,
  price numeric not null default 0 check (price >= 0),
  points_price int not null default 0 check (points_price >= 0),
  image_url text,
  type text check (type in ('qr', 'nfc')) not null default 'qr',
  category text check (category in ('Health', 'Food', 'Fitness', 'Family', 'Learning', 'Mobility', 'Wellness')) not null,
  city text not null default 'Tirana',
  valid_from timestamptz default now(),
  valid_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index benefits_provider_title_unique
  on public.benefits (provider_name, title);

create unique index benefits_provider_id_title_unique
  on public.benefits (provider_id, title)
  where provider_id is not null;

create index benefits_active_city_category_idx
  on public.benefits (is_active, city, category);

create table public.employer_invites (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.users(id) on delete cascade,
  employer_email text not null,
  company_name text not null,
  invite_code text unique not null,
  status text check (status in ('sent', 'accepted', 'expired')) not null default 'sent',
  accepted_by_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index employer_invites_employee_status_idx
  on public.employer_invites (employee_id, status);

create table public.selection_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.users(id) on delete cascade,
  employer_id uuid references public.users(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  total numeric not null default 0,
  total_points int not null default 0,
  note text,
  status text check (status in ('draft', 'pending', 'approved', 'rejected')) not null default 'pending',
  created_at timestamptz default now(),
  approved_at timestamptz,
  rejected_at timestamptz
);

create index selection_requests_employer_status_idx
  on public.selection_requests (employer_id, status, created_at desc);

create index selection_requests_employee_created_idx
  on public.selection_requests (employee_id, created_at desc);

create table public.selection_items (
  id uuid primary key default gen_random_uuid(),
  selection_request_id uuid not null references public.selection_requests(id) on delete cascade,
  benefit_id uuid not null references public.benefits(id) on delete cascade,
  provider_id uuid references public.provider_profiles(id) on delete set null,
  price numeric not null default 0,
  points_price int not null default 0,
  created_at timestamptz not null default now()
);

create unique index selection_items_request_benefit_unique
  on public.selection_items (selection_request_id, benefit_id);

create index selection_items_provider_idx
  on public.selection_items (provider_id);

create table public.employer_wallet_cards (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  points int not null default 0 check (points >= 0),
  accent text,
  created_at timestamptz not null default now()
);

create unique index employer_wallet_cards_employer_title_unique
  on public.employer_wallet_cards (employer_id, title);

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source text not null,
  points_delta int not null,
  description text,
  created_at timestamptz not null default now()
);

create index points_ledger_user_created_idx
  on public.points_ledger (user_id, created_at desc);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.users(id) on delete cascade,
  employer_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  reward_points int not null default 0 check (reward_points >= 0),
  status text check (status in ('open', 'completed', 'archived')) not null default 'open',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index challenges_employee_title_unique
  on public.challenges (employee_id, title);

create index challenges_employer_status_idx
  on public.challenges (employer_id, status, created_at desc);

create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  benefit_id uuid not null references public.benefits(id) on delete cascade,
  provider_id uuid references public.provider_profiles(id) on delete set null,
  employee_id uuid references public.users(id) on delete set null,
  employer_id uuid references public.users(id) on delete set null,
  selection_request_id uuid references public.selection_requests(id) on delete set null,
  amount numeric not null default 0 check (amount >= 0),
  points_spent int not null default 0 check (points_spent >= 0),
  qr_code text,
  status text check (status in ('pending', 'confirmed', 'paid')) not null default 'pending',
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index redemptions_qr_code_unique
  on public.redemptions (qr_code)
  where qr_code is not null;

create index redemptions_provider_status_idx
  on public.redemptions (provider_id, status, created_at desc);

create index redemptions_employer_created_idx
  on public.redemptions (employer_id, created_at desc);

create table public.employer_enabled_benefits (
  employer_id uuid not null references public.users(id) on delete cascade,
  benefit_id uuid not null references public.benefits(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (employer_id, benefit_id)
);

create index employer_enabled_benefits_employer_idx
  on public.employer_enabled_benefits (employer_id);

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.benefits enable row level security;
alter table public.employer_invites enable row level security;
alter table public.selection_requests enable row level security;
alter table public.selection_items enable row level security;
alter table public.employer_wallet_cards enable row level security;
alter table public.points_ledger enable row level security;
alter table public.challenges enable row level security;
alter table public.redemptions enable row level security;
alter table public.employer_enabled_benefits enable row level security;

create policy "demo read companies" on public.companies for select using (true);
create policy "demo read users" on public.users for select using (true);
create policy "demo read provider profiles" on public.provider_profiles for select using (true);
create policy "demo read benefits" on public.benefits for select using (true);
create policy "demo read employer invites" on public.employer_invites for select using (true);
create policy "demo read selection requests" on public.selection_requests for select using (true);
create policy "demo read selection items" on public.selection_items for select using (true);
create policy "demo read wallet cards" on public.employer_wallet_cards for select using (true);
create policy "demo read points ledger" on public.points_ledger for select using (true);
create policy "demo read challenges" on public.challenges for select using (true);
create policy "demo read redemptions" on public.redemptions for select using (true);
create policy "demo read employer enabled benefits" on public.employer_enabled_benefits for select using (true);

create policy "demo insert companies" on public.companies for insert with check (true);
create policy "demo insert users" on public.users for insert with check (true);
create policy "demo insert provider profiles" on public.provider_profiles for insert with check (true);
create policy "demo insert benefits" on public.benefits for insert with check (true);
create policy "demo insert employer invites" on public.employer_invites for insert with check (true);
create policy "demo insert selection requests" on public.selection_requests for insert with check (true);
create policy "demo insert selection items" on public.selection_items for insert with check (true);
create policy "demo insert wallet cards" on public.employer_wallet_cards for insert with check (true);
create policy "demo insert points ledger" on public.points_ledger for insert with check (true);
create policy "demo insert challenges" on public.challenges for insert with check (true);
create policy "demo insert redemptions" on public.redemptions for insert with check (true);
create policy "demo insert employer enabled benefits" on public.employer_enabled_benefits for insert with check (true);

create policy "demo update users" on public.users for update using (true) with check (true);
create policy "demo update provider profiles" on public.provider_profiles for update using (true) with check (true);
create policy "demo update employer invites" on public.employer_invites for update using (true) with check (true);
create policy "demo update selection requests" on public.selection_requests for update using (true) with check (true);
create policy "demo update wallet cards" on public.employer_wallet_cards for update using (true) with check (true);
create policy "demo update challenges" on public.challenges for update using (true) with check (true);
create policy "demo update redemptions" on public.redemptions for update using (true) with check (true);
create policy "demo delete employer enabled benefits" on public.employer_enabled_benefits for delete using (true);

-- Unified challenge system (run once in Supabase SQL Editor if npm run setup:challenges reports missing tables)

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

alter table public.challenge_definitions add column if not exists start_date date;
alter table public.challenge_definitions add column if not exists max_awards int check (max_awards is null or max_awards > 0);
alter table public.challenge_progress add column if not exists submitted_at timestamptz;

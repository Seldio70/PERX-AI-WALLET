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

notify pgrst, 'reload schema';

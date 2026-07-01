-- =============================================================================
-- Prospects (demo_requests) + correctifs Super Admin + tarifs modifiables
-- =============================================================================

-- Super Admin : reconnaître aussi le rôle profil (secours si super_admins incomplet)
create or replace function app.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select sa.is_active from public.super_admins sa
    where sa.profile_id = auth.uid()
  ), false)
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'::public.app_role
      and p.is_active = true
  )
$$;

-- Prospects -------------------------------------------------------------------
alter table public.demo_requests
  add column if not exists status text not null default 'Nouvelle demande',
  add column if not exists internal_notes text,
  add column if not exists city text,
  add column if not exists organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists demo_scheduled_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update public.demo_requests
set status = 'Nouvelle demande'
where status is null or trim(status) = '';

create index if not exists idx_demo_requests_status on public.demo_requests (status, created_at desc);
create index if not exists idx_demo_requests_org on public.demo_requests (organization_id);

drop policy if exists demo_requests_update_super on public.demo_requests;
create policy demo_requests_update_super on public.demo_requests
  for update to authenticated
  using (app.is_super_admin())
  with check (app.is_super_admin());

-- Tarifs SaaS modifiables par Super Admin -------------------------------------
drop policy if exists plans_update_super on public.plans;
create policy plans_update_super on public.plans
  for update to authenticated
  using (app.is_super_admin())
  with check (app.is_super_admin());

insert into public.plans (code, name, description, price_cents, interval, trial_days, max_students, metadata)
values
  ('starter', 'Starter', 'Abonnement Starter — engagement annuel', 7900, 'month', 0, 50, '{"commitment":"annual"}'::jsonb),
  ('premium', 'Premium', 'Abonnement Premium — engagement annuel', 9900, 'month', 0, null, '{"commitment":"annual"}'::jsonb)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true;

update public.plans
set trial_days = 30, is_active = true
where code = 'trial';

-- Paramètres plateforme (notifications, etc.)
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

drop policy if exists platform_settings_select_super on public.platform_settings;
create policy platform_settings_select_super on public.platform_settings
  for select to authenticated using (app.is_super_admin());

drop policy if exists platform_settings_write_super on public.platform_settings;
create policy platform_settings_write_super on public.platform_settings
  for all to authenticated
  using (app.is_super_admin())
  with check (app.is_super_admin());

insert into public.platform_settings (key, value)
values ('notifications', '{"prospect_alerts": true}'::jsonb)
on conflict (key) do nothing;

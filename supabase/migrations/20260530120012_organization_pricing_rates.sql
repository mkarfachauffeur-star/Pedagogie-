-- Tarification unitaire par auto-école (multi-tenant)
create table if not exists public.organization_pricing_rates (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  hour_manual_gear numeric(10,2) not null default 0,
  hour_automatic_gear numeric(10,2) not null default 0,
  hour_aac numeric(10,2) not null default 0,
  hour_supervised numeric(10,2) not null default 0,
  exam_practical_support numeric(10,2) not null default 0,
  exam_theory_support numeric(10,2) not null default 0,
  registration_fee numeric(10,2) not null default 0,
  file_fee numeric(10,2) not null default 0,
  file_transfer_fee numeric(10,2) not null default 0,
  code_reactivation_fee numeric(10,2) not null default 0,
  bridge_b78_to_b_fee numeric(10,2) not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.organization_pricing_rates enable row level security;

drop policy if exists org_pricing_rates_select on public.organization_pricing_rates;
create policy org_pricing_rates_select on public.organization_pricing_rates
  for select using (
    (organization_id = app.current_org_id() and app.is_admin_staff())
    or app.is_super_admin()
  );

-- Gérant uniquement — le Super Admin ne peut pas modifier les tarifs
drop policy if exists org_pricing_rates_write on public.organization_pricing_rates;
create policy org_pricing_rates_write on public.organization_pricing_rates
  for all
  using (
    organization_id = app.current_org_id()
    and app.current_role() = 'manager'
    and app.can_write_org()
  )
  with check (
    organization_id = app.current_org_id()
    and app.current_role() = 'manager'
    and app.can_write_org()
  );

-- Super Admin : lecture agrégée pour stats globales
drop policy if exists payments_select_super on public.payments;
create policy payments_select_super on public.payments
  for select using (app.is_super_admin());

drop policy if exists contracts_select_super on public.contracts;
create policy contracts_select_super on public.contracts
  for select using (app.is_super_admin());

drop policy if exists appointments_select_super on public.appointments;
create policy appointments_select_super on public.appointments
  for select using (app.is_super_admin());

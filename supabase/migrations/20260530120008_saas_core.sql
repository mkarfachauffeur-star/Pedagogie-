-- =============================================================================
-- PEDAGOGIA DRIVE — 0008 — SaaS V1 (organisations, billing, tarifs, audit)
-- =============================================================================

-- Enums -----------------------------------------------------------------------
do $$ begin create type public.org_status as enum ('trial','active','suspended','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin create type public.package_category as enum (
  'b_manuelle','b_automatique','aac','cs','moto','code'
); exception when duplicate_object then null; end $$;

do $$ begin create type public.billing_interval as enum ('trial','month','year');
exception when duplicate_object then null; end $$;

do $$ begin create type public.subscription_status as enum ('active','suspended','expired','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin create type public.invoice_status as enum ('draft','sent','paid','void');
exception when duplicate_object then null; end $$;

do $$ begin create type public.audit_action as enum (
  'create','update','delete','login','invite','deactivate','reactivate',
  'export_regulatory','export_data','signup'
); exception when duplicate_object then null; end $$;

do $$ begin
  alter type public.app_role add value if not exists 'super_admin';
exception when others then null; end $$;

-- Organizations ---------------------------------------------------------------
alter table public.organizations
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists postal_code text,
  add column if not exists website text,
  add column if not exists siret text,
  add column if not exists prefecture_approval text,
  add column if not exists logo_storage_path text,
  add column if not exists status public.org_status not null default 'trial',
  add column if not exists slug text unique,
  add column if not exists onboarded_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Plans (catalogue Pedagogia) -------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  price_cents int not null default 0,
  currency text not null default 'EUR',
  interval public.billing_interval not null default 'month',
  trial_days int not null default 0,
  max_students int,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.plans (code, name, description, price_cents, interval, trial_days, max_students)
values
  ('trial', 'Essai gratuit', '30 jours, toutes fonctionnalités', 0, 'trial', 30, 20),
  ('monthly', 'Abonnement mensuel', 'Facturation mensuelle', 9900, 'month', 0, null),
  ('annual', 'Abonnement annuel', 'Facturation annuelle', 99000, 'year', 0, null)
on conflict (code) do nothing;

-- Subscriptions ---------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status public.subscription_status not null default 'active',
  trial_ends_at timestamptz,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  external_customer_id text,
  external_subscription_id text,
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_org on public.subscriptions (organization_id);

-- Invoices --------------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  invoice_number text,
  amount_cents int not null default 0,
  currency text not null default 'EUR',
  status public.invoice_status not null default 'draft',
  issued_at date,
  due_at date,
  paid_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_invoices_org on public.invoices (organization_id, created_at desc);

-- Billing history -------------------------------------------------------------
create table if not exists public.billing_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  old_value jsonb,
  new_value jsonb,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_billing_history_org on public.billing_history (organization_id, created_at desc);

-- Pricing packages (par auto-école) --------------------------------------------
create table if not exists public.pricing_packages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category public.package_category not null,
  price_ttc numeric(10,2) not null default 0,
  included_hours int not null default 0,
  admin_fee_ttc numeric(10,2) not null default 0,
  exam_presentation_included boolean not null default false,
  exam_presentation_ttc numeric(10,2) not null default 0,
  extra_hour_price_ttc numeric(10,2) not null default 0,
  currency text not null default 'EUR',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_pricing_packages_org on public.pricing_packages (organization_id, is_active);

alter table public.students
  add column if not exists package_id uuid references public.pricing_packages(id) on delete set null;

alter table public.contracts
  add column if not exists package_id uuid references public.pricing_packages(id) on delete set null,
  add column if not exists package_price_ttc numeric(10,2),
  add column if not exists admin_fee_ttc numeric(10,2),
  add column if not exists exam_presentation_ttc numeric(10,2),
  add column if not exists extra_hours int not null default 0,
  add column if not exists extra_hours_amount_ttc numeric(10,2),
  add column if not exists signed_at date;

-- Teachers — autorisation préfecture ------------------------------------------
alter table public.teachers
  add column if not exists authorization_number text,
  add column if not exists authorization_expires_at date,
  add column if not exists authorized_categories text[] not null default '{}';

-- Super Admin -----------------------------------------------------------------
alter table public.profiles alter column organization_id drop not null;

create table if not exists public.super_admins (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  is_active boolean not null default true,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles(id) on delete set null
);

-- V2 sous-domaines (inactif) --------------------------------------------------
create table if not exists public.organization_domains (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subdomain text unique,
  custom_domain text unique,
  is_primary boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- Audit logs (rétention 7 ans — purge via job planifié) -----------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role public.app_role,
  actor_email text,
  action public.audit_action not null,
  entity_type text not null default '',
  entity_id uuid,
  entity_label text,
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_org_time on public.audit_logs (organization_id, created_at desc);
create index if not exists idx_audit_actor on public.audit_logs (actor_id, created_at desc);
create index if not exists idx_audit_entity on public.audit_logs (entity_type, entity_id);

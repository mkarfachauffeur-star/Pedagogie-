-- Pré-inscriptions auto-école (bêta — sans activation automatique)
create table if not exists public.organization_signup_requests (
  id uuid primary key default gen_random_uuid(),
  org_name text not null,
  manager_first_name text not null,
  manager_last_name text not null,
  email text not null,
  phone text not null,
  address text,
  postal_code text,
  city text,
  siret text,
  prefecture_approval text,
  created_at timestamptz not null default now()
);

create index if not exists idx_organization_signup_requests_created
  on public.organization_signup_requests (created_at desc);

alter table public.organization_signup_requests enable row level security;

drop policy if exists organization_signup_requests_insert_public on public.organization_signup_requests;
create policy organization_signup_requests_insert_public on public.organization_signup_requests
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists organization_signup_requests_select_super on public.organization_signup_requests;
create policy organization_signup_requests_select_super on public.organization_signup_requests
  for select
  to authenticated
  using (app.is_super_admin());

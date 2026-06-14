-- Demandes de démonstration (bêta privée — formulaire public)
create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  contact_name text not null,
  phone text not null,
  email text not null,
  approximate_students text,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_demo_requests_created on public.demo_requests (created_at desc);

alter table public.demo_requests enable row level security;

drop policy if exists demo_requests_insert_public on public.demo_requests;
create policy demo_requests_insert_public on public.demo_requests
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists demo_requests_select_super on public.demo_requests;
create policy demo_requests_select_super on public.demo_requests
  for select
  to authenticated
  using (app.is_super_admin());

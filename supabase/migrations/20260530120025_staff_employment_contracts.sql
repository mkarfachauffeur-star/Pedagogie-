-- Contrats de travail du personnel (enseignants, secrétaires, gérant…) — dépôt uniquement, pas de génération.

create table if not exists public.staff_employment_contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Contrat de travail',
  employment_status text not null default 'Enseignant CDI',
  file_name text not null,
  storage_path text not null,
  storage_bucket text not null default 'staff-contracts',
  notes text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_staff_employment_contracts_org
  on public.staff_employment_contracts (organization_id, created_at desc);
create index if not exists idx_staff_employment_contracts_profile
  on public.staff_employment_contracts (profile_id, created_at desc);

alter table public.staff_employment_contracts enable row level security;

drop policy if exists staff_employment_contracts_select on public.staff_employment_contracts;
create policy staff_employment_contracts_select on public.staff_employment_contracts
  for select using (
    organization_id = app.current_org_id()
    and app.is_admin_staff()
  );

drop policy if exists staff_employment_contracts_write on public.staff_employment_contracts;
create policy staff_employment_contracts_write on public.staff_employment_contracts
  for all
  using (
    organization_id = app.current_org_id()
    and app.is_admin_staff()
    and app.can_write_org()
  )
  with check (
    organization_id = app.current_org_id()
    and app.is_admin_staff()
    and app.can_write_org()
  );

-- Bucket privé : {organization_id}/staff/{profile_id}/{horodatage}-{nom}
insert into storage.buckets (id, name, public)
values ('staff-contracts', 'staff-contracts', false)
on conflict (id) do nothing;

drop policy if exists staff_contracts_read on storage.objects;
create policy staff_contracts_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'staff-contracts'
    and (storage.foldername(name))[1] = app.current_org_id()::text
    and app.is_admin_staff()
  );

drop policy if exists staff_contracts_insert on storage.objects;
create policy staff_contracts_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'staff-contracts'
    and (storage.foldername(name))[1] = app.current_org_id()::text
    and app.is_admin_staff()
    and app.can_write_org()
  );

drop policy if exists staff_contracts_delete on storage.objects;
create policy staff_contracts_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'staff-contracts'
    and (storage.foldername(name))[1] = app.current_org_id()::text
    and app.is_admin_staff()
    and app.can_write_org()
  );

do $$ begin
  alter publication supabase_realtime add table public.staff_employment_contracts;
exception when duplicate_object then null; end $$;

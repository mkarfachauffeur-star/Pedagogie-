-- =============================================================================
-- demo_requests : lecture Super Admin garantie + colonnes prospects
-- =============================================================================

-- Super Admin : table super_admins OU profil role super_admin
create or replace function app.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select sa.is_active
    from public.super_admins sa
    where sa.profile_id = auth.uid()
  ), false)
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'::public.app_role
      and coalesce(p.is_active, true) = true
  )
$$;

-- Colonnes prospects (idempotent)
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

-- Policies : INSERT public, SELECT/UPDATE Super Admin uniquement
alter table public.demo_requests enable row level security;

drop policy if exists super_admin_all on public.demo_requests;
drop policy if exists demo_requests_insert_public on public.demo_requests;
drop policy if exists demo_requests_select_super on public.demo_requests;
drop policy if exists demo_requests_update_super on public.demo_requests;

create policy demo_requests_insert_public on public.demo_requests
  for insert
  to anon, authenticated
  with check (true);

create policy demo_requests_select_super on public.demo_requests
  for select
  to authenticated
  using (app.is_super_admin());

create policy demo_requests_update_super on public.demo_requests
  for update
  to authenticated
  using (app.is_super_admin())
  with check (app.is_super_admin());

-- RPC liste (security definer — contourne tout problème RLS résiduel)
create or replace function public.platform_list_demo_requests()
returns setof public.demo_requests
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app.is_super_admin() then
    raise exception 'Accès réservé au Super Admin';
  end if;

  return query
  select *
  from public.demo_requests
  order by created_at desc;
end;
$$;

create or replace function public.platform_update_demo_request(
  p_id uuid,
  p_status text default null,
  p_internal_notes text default null
)
returns public.demo_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.demo_requests;
begin
  if not app.is_super_admin() then
    raise exception 'Accès réservé au Super Admin';
  end if;

  update public.demo_requests
  set
    status = coalesce(p_status, status),
    internal_notes = coalesce(p_internal_notes, internal_notes),
    updated_at = now()
  where id = p_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Demande introuvable : %', p_id;
  end if;

  return v_row;
end;
$$;

create or replace function public.platform_count_new_demo_requests()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app.is_super_admin() then
    return 0;
  end if;

  return (
    select count(*)::bigint
    from public.demo_requests
    where status = 'Nouvelle demande'
  );
end;
$$;

grant execute on function public.platform_list_demo_requests() to authenticated;
grant execute on function public.platform_update_demo_request(uuid, text, text) to authenticated;
grant execute on function public.platform_count_new_demo_requests() to authenticated;

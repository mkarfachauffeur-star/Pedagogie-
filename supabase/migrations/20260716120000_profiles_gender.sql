-- =============================================================================
-- Genre sur profiles (male | female) — conjugaison des libellés de rôle
-- =============================================================================

alter table public.profiles
  add column if not exists gender text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_gender_check'
  ) then
    alter table public.profiles
      add constraint profiles_gender_check
      check (gender is null or gender in ('male', 'female'));
  end if;
end $$;

comment on column public.profiles.gender is
  'Genre déclaré à l''inscription : male | female (nullable pour comptes existants).';

-- Pré-inscription auto-école : genre du gérant
alter table public.organization_signup_requests
  add column if not exists manager_gender text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'organization_signup_requests_manager_gender_check'
  ) then
    alter table public.organization_signup_requests
      add constraint organization_signup_requests_manager_gender_check
      check (manager_gender is null or manager_gender in ('male', 'female'));
  end if;
end $$;

-- Listing staff : inclure gender pour conjugaison des libellés
drop function if exists public.list_organization_users();
drop function if exists app.list_organization_users();

create or replace function app.list_organization_users()
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  role public.app_role,
  is_active boolean,
  gender text,
  invited_at timestamptz,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
security definer
stable
set search_path = public, auth
as $$
begin
  if not app.is_admin_staff() then
    raise exception 'Permission denied';
  end if;

  return query
  select
    p.id,
    coalesce(p.email, u.email::text) as email,
    p.full_name,
    p.phone,
    p.role,
    p.is_active,
    p.gender,
    u.invited_at,
    u.email_confirmed_at,
    u.last_sign_in_at
  from public.profiles p
  inner join auth.users u on u.id = p.id
  where p.organization_id = app.current_org_id()
    and p.role in ('manager', 'teacher', 'secretary')
  order by p.full_name asc;
end;
$$;

create or replace function public.list_organization_users()
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  role public.app_role,
  is_active boolean,
  gender text,
  invited_at timestamptz,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select * from app.list_organization_users();
$$;

grant execute on function public.list_organization_users() to authenticated;
grant execute on function app.list_organization_users() to authenticated;

-- Provisioning : lire gender depuis user_metadata
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := nullif(new.raw_user_meta_data->>'organization_id', '')::uuid;
  v_role public.app_role := coalesce(
    nullif(new.raw_user_meta_data->>'role', '')::public.app_role,
    'student'::public.app_role
  );
  v_name text := coalesce(new.raw_user_meta_data->>'full_name', '');
  v_gender text := nullif(trim(coalesce(new.raw_user_meta_data->>'gender', '')), '');
begin
  if v_role = 'super_admin'::public.app_role then
    return new;
  end if;

  if v_gender is not null and v_gender not in ('male', 'female') then
    v_gender := null;
  end if;

  if v_org is not null and exists (select 1 from public.organizations o where o.id = v_org) then
    insert into public.profiles (id, organization_id, role, full_name, email, gender)
    values (new.id, v_org, v_role, v_name, new.email, v_gender)
    on conflict (id) do update set
      gender = coalesce(excluded.gender, public.profiles.gender);

    if v_role = 'teacher'::public.app_role then
      insert into public.teachers (profile_id, organization_id)
      values (new.id, v_org)
      on conflict (profile_id) do nothing;
    elsif v_role = 'secretary'::public.app_role then
      insert into public.secretaries (profile_id, organization_id)
      values (new.id, v_org)
      on conflict (profile_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

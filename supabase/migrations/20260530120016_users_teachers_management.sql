-- Gestion utilisateurs / enseignants — champs métier et fonctions de listing
alter table public.teachers
  add column if not exists birth_date date,
  add column if not exists is_active boolean not null default true;

-- Liste des comptes staff (manager, teacher, secretary) avec métadonnées Auth
create or replace function app.list_organization_users()
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  role public.app_role,
  is_active boolean,
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

revoke all on function app.list_organization_users() from public;
grant execute on function app.list_organization_users() to authenticated;

-- Liste des fiches enseignants enrichies (profil + statut compte)
create or replace function app.list_organization_teachers()
returns table (
  profile_id uuid,
  full_name text,
  email text,
  phone text,
  address text,
  birth_date date,
  authorization_number text,
  authorization_expires_at date,
  employment_status text,
  authorized_categories text[],
  is_active boolean,
  created_at timestamptz,
  account_is_active boolean,
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
    t.profile_id,
    p.full_name,
    coalesce(p.email, u.email::text) as email,
    p.phone,
    t.address,
    t.birth_date,
    t.authorization_number,
    t.authorization_expires_at,
    t.employment_status,
    t.authorized_categories,
    t.is_active,
    t.created_at,
    p.is_active as account_is_active,
    u.invited_at,
    u.email_confirmed_at,
    u.last_sign_in_at
  from public.teachers t
  inner join public.profiles p on p.id = t.profile_id
  inner join auth.users u on u.id = p.id
  where t.organization_id = app.current_org_id()
  order by p.full_name asc;
end;
$$;

revoke all on function app.list_organization_teachers() from public;
grant execute on function app.list_organization_teachers() to authenticated;

-- Crée la fiche enseignant si un compte utilisateur teacher n'en a pas encore
create or replace function app.ensure_teacher_record(p_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_role public.app_role;
begin
  select organization_id, role into v_org, v_role
  from public.profiles
  where id = p_profile_id;

  if v_org is null or v_org <> app.current_org_id() then
    raise exception 'Profil introuvable';
  end if;
  if v_role <> 'teacher' then
    raise exception 'Le compte n''est pas un enseignant';
  end if;

  insert into public.teachers (profile_id, organization_id)
  values (p_profile_id, v_org)
  on conflict (profile_id) do nothing;

  return p_profile_id;
end;
$$;

revoke all on function app.ensure_teacher_record(uuid) from public;
grant execute on function app.ensure_teacher_record(uuid) to authenticated;

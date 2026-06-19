-- Types de ressources pédagogiques (enseignants, simulateurs) — préparation RdvPermis
do $$ begin
  create type public.teaching_resource_type as enum ('teacher', 'simulator');
exception when duplicate_object then null; end $$;

alter table public.teachers
  add column if not exists resource_type public.teaching_resource_type not null default 'teacher';

comment on column public.teachers.resource_type is
  'Type de ressource pédagogique exportable vers RdvPermis (teacher, simulator, …).';

create or replace function app.validate_teaching_resource_authorization(
  p_resource_type public.teaching_resource_type,
  p_authorization_number text
)
returns void
language plpgsql
immutable
as $$
declare
  v_number text;
begin
  if p_authorization_number is null or btrim(p_authorization_number) = '' then
    return;
  end if;

  v_number := upper(btrim(p_authorization_number));

  if p_resource_type = 'teacher' and v_number !~ '^A[0-9]{10}$' then
    raise exception 'Numéro d''autorisation enseignant invalide (format AXXXXXXXXXX attendu).';
  end if;

  if p_resource_type = 'simulator' and v_number !~ '^S[0-9]{10}$' then
    raise exception 'Numéro d''autorisation simulateur invalide (format SXXXXXXXXXX attendu).';
  end if;
end;
$$;

create or replace function app.enforce_teaching_resource_authorization()
returns trigger
language plpgsql
as $$
begin
  if new.authorization_number is not null and btrim(new.authorization_number) <> '' then
    new.authorization_number := upper(btrim(new.authorization_number));
    perform app.validate_teaching_resource_authorization(new.resource_type, new.authorization_number);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_teachers_teaching_resource_authorization on public.teachers;
create trigger trg_teachers_teaching_resource_authorization
  before insert or update of resource_type, authorization_number
  on public.teachers
  for each row
  execute function app.enforce_teaching_resource_authorization();

drop function if exists app.list_organization_teachers();

create or replace function app.list_organization_teachers()
returns table (
  profile_id uuid,
  full_name text,
  email text,
  phone text,
  address text,
  street_number text,
  street text,
  postal_code text,
  city text,
  birth_date date,
  resource_type public.teaching_resource_type,
  authorization_number text,
  authorization_expires_at date,
  authorization_recto_path text,
  authorization_verso_path text,
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
    t.street_number,
    t.street,
    t.postal_code,
    t.city,
    t.birth_date,
    t.resource_type,
    t.authorization_number,
    t.authorization_expires_at,
    t.authorization_recto_path,
    t.authorization_verso_path,
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
  order by t.resource_type asc, p.full_name asc;
end;
$$;

revoke all on function app.list_organization_teachers() from public;
grant execute on function app.list_organization_teachers() to authenticated;

create or replace function public.list_organization_teachers()
returns table (
  profile_id uuid,
  full_name text,
  email text,
  phone text,
  address text,
  street_number text,
  street text,
  postal_code text,
  city text,
  birth_date date,
  resource_type public.teaching_resource_type,
  authorization_number text,
  authorization_expires_at date,
  authorization_recto_path text,
  authorization_verso_path text,
  employment_status text,
  authorized_categories text[],
  is_active boolean,
  created_at timestamptz,
  account_is_active boolean,
  invited_at timestamptz,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select * from app.list_organization_teachers();
$$;

grant execute on function public.list_organization_teachers() to authenticated;

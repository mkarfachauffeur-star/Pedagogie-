-- Enregistrement simulateur : upsert fiche teachers si absente (sans invitation e-mail).

create or replace function app.save_teaching_resource(
  p_profile_id uuid,
  p_resource_type public.teaching_resource_type,
  p_authorization_number text,
  p_authorization_expires_at date default null,
  p_authorized_categories text[] default '{}',
  p_birth_date date default null,
  p_employment_status text default null,
  p_address text default null,
  p_street_number text default null,
  p_street text default null,
  p_postal_code text default null,
  p_city text default null,
  p_is_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_number text;
begin
  if not app.is_admin_staff() then
    raise exception 'Permission denied';
  end if;

  if p_authorization_number is null or btrim(p_authorization_number) = '' then
    raise exception 'Le numéro d''autorisation est obligatoire.';
  end if;

  v_number := upper(btrim(p_authorization_number));
  perform app.validate_teaching_resource_authorization(p_resource_type, v_number);

  select organization_id into v_org
  from public.profiles
  where id = p_profile_id
    and organization_id = app.current_org_id();

  if v_org is null then
    raise exception 'Profil introuvable.';
  end if;

  insert into public.teachers (
    profile_id,
    organization_id,
    resource_type,
    authorization_number,
    authorization_expires_at,
    authorized_categories,
    birth_date,
    employment_status,
    address,
    street_number,
    street,
    postal_code,
    city,
    is_active
  ) values (
    p_profile_id,
    v_org,
    p_resource_type,
    v_number,
    p_authorization_expires_at,
    coalesce(p_authorized_categories, '{}'),
    p_birth_date,
    p_employment_status,
    p_address,
    p_street_number,
    p_street,
    p_postal_code,
    p_city,
    coalesce(p_is_active, true)
  )
  on conflict (profile_id) do update set
    resource_type = excluded.resource_type,
    authorization_number = excluded.authorization_number,
    authorization_expires_at = excluded.authorization_expires_at,
    authorized_categories = excluded.authorized_categories,
    birth_date = excluded.birth_date,
    employment_status = excluded.employment_status,
    address = excluded.address,
    street_number = excluded.street_number,
    street = excluded.street,
    postal_code = excluded.postal_code,
    city = excluded.city,
    is_active = excluded.is_active;

  return p_profile_id;
end;
$$;

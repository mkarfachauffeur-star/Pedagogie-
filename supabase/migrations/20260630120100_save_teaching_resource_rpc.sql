-- RPC sécurisée pour enregistrer une ressource pédagogique (enseignant / simulateur)
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
  from public.teachers
  where profile_id = p_profile_id;

  if v_org is null or v_org <> app.current_org_id() then
    raise exception 'Fiche ressource introuvable.';
  end if;

  update public.teachers
  set
    resource_type = p_resource_type,
    authorization_number = v_number,
    authorization_expires_at = p_authorization_expires_at,
    authorized_categories = coalesce(p_authorized_categories, '{}'),
    birth_date = p_birth_date,
    employment_status = p_employment_status,
    address = p_address,
    street_number = p_street_number,
    street = p_street,
    postal_code = p_postal_code,
    city = p_city,
    is_active = coalesce(p_is_active, true)
  where profile_id = p_profile_id;

  return p_profile_id;
end;
$$;

revoke all on function app.save_teaching_resource(
  uuid, public.teaching_resource_type, text, date, text[], date, text, text, text, text, text, text, boolean
) from public;
grant execute on function app.save_teaching_resource(
  uuid, public.teaching_resource_type, text, date, text[], date, text, text, text, text, text, text, boolean
) to authenticated;

create or replace function public.save_teaching_resource(
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
language sql
security definer
set search_path = public
as $$
  select app.save_teaching_resource(
    p_profile_id,
    p_resource_type,
    p_authorization_number,
    p_authorization_expires_at,
    p_authorized_categories,
    p_birth_date,
    p_employment_status,
    p_address,
    p_street_number,
    p_street,
    p_postal_code,
    p_city,
    p_is_active
  );
$$;

grant execute on function public.save_teaching_resource(
  uuid, public.teaching_resource_type, text, date, text[], date, text, text, text, text, text, text, boolean
) to authenticated;

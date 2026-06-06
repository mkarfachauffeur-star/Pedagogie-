-- Expose app.* RPC helpers via public schema for PostgREST / supabase-js client.
-- Without these wrappers, supabase.rpc('list_organization_teachers') returns HTTP 404.

create or replace function public.list_organization_users()
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
language sql
security definer
stable
set search_path = public
as $$
  select * from app.list_organization_users();
$$;

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

create or replace function public.ensure_teacher_record(p_profile_id uuid)
returns uuid
language sql
security definer
set search_path = public
as $$
  select app.ensure_teacher_record(p_profile_id);
$$;

grant execute on function public.list_organization_users() to authenticated;
grant execute on function public.list_organization_teachers() to authenticated;
grant execute on function public.ensure_teacher_record(uuid) to authenticated;

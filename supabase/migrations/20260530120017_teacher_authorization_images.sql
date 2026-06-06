-- Recto / verso autorisation d'enseigner (dossier moniteur)
alter table public.teachers
  add column if not exists authorization_recto_path text,
  add column if not exists authorization_verso_path text;

insert into storage.buckets (id, name, public)
values ('teacher-documents', 'teacher-documents', false)
on conflict (id) do nothing;

drop policy if exists teacher_docs_read on storage.objects;
create policy teacher_docs_read on storage.objects
  for select using (
    bucket_id = 'teacher-documents'
    and (storage.foldername(name))[1] = app.current_org_id()::text
    and app.is_admin_staff()
  );

drop policy if exists teacher_docs_insert on storage.objects;
create policy teacher_docs_insert on storage.objects
  for insert with check (
    bucket_id = 'teacher-documents'
    and (storage.foldername(name))[1] = app.current_org_id()::text
    and app.is_admin_staff()
    and app.can_write_org()
  );

drop policy if exists teacher_docs_update on storage.objects;
create policy teacher_docs_update on storage.objects
  for update using (
    bucket_id = 'teacher-documents'
    and (storage.foldername(name))[1] = app.current_org_id()::text
    and app.is_admin_staff()
    and app.can_write_org()
  );

drop policy if exists teacher_docs_delete on storage.objects;
create policy teacher_docs_delete on storage.objects
  for delete using (
    bucket_id = 'teacher-documents'
    and (storage.foldername(name))[1] = app.current_org_id()::text
    and app.is_admin_staff()
    and app.can_write_org()
  );

drop function if exists app.list_organization_teachers();

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
    t.birth_date,
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
  order by p.full_name asc;
end;
$$;

revoke all on function app.list_organization_teachers() from public;
grant execute on function app.list_organization_teachers() to authenticated;

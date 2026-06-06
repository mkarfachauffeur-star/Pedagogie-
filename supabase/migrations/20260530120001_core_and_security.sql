-- =============================================================================
-- PEDAGOGIA DRIVE — 0001 — Cœur multi-tenant, identité & sécurité
-- =============================================================================
-- Multi-auto-écoles : chaque ligne métier est rattachée à une `organization`.
-- Chaque utilisateur = compte Supabase Auth (auth.users) + `profile`
-- (rôle + organisation). Les rôles disposent de tables d'extension 1:1 :
--   teachers (moniteurs), secretaries (secrétariat), students (élèves).
--
-- Ordre important : tables d'identité créées AVANT les fonctions de sécurité
-- qui les référencent (PostgreSQL valide le corps des fonctions SQL).
-- =============================================================================

create extension if not exists pgcrypto;
create schema if not exists app;

-- Enums -----------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('manager','teacher','secretary','student');
exception when duplicate_object then null; end $$;

-- Organisations (auto-écoles) -------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  allow_teacher_to_teacher boolean not null default false,  -- réglage messagerie
  created_at timestamptz not null default now()
);

-- Profils : 1:1 avec auth.users (identité + rôle + organisation) --------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  role public.app_role not null,
  full_name text not null default '',
  email text,
  phone text,
  avatar_emoji text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_profiles_org_role on public.profiles (organization_id, role);

-- Moniteurs (extension de profile) --------------------------------------------
create table if not exists public.teachers (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  specialties text[] not null default '{}',
  license_categories text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_teachers_org on public.teachers (organization_id);

-- Secrétariat (extension de profile) ------------------------------------------
create table if not exists public.secretaries (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_secretaries_org on public.secretaries (organization_id);

-- Élèves (dossiers) -----------------------------------------------------------
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid unique references public.profiles(id) on delete set null,
  file_number text,                       -- PD-AAAA-NNN-NOM-PRENOM
  first_name text not null default '',
  last_name text not null default '',
  birth_date date,
  birth_place text,
  street_number text,
  street text,
  postal_code text,
  city text,
  phone text,
  email text,
  neph text,
  license_category text,
  package_name text,
  formation_type text,
  driving_type text,
  code_status text not null default 'Non obtenu',
  registration_date date default now(),
  status text not null default 'En attente',
  created_at timestamptz not null default now(),
  unique (organization_id, file_number)
);
create index if not exists idx_students_org on public.students (organization_id);

-- Affectation enseignant <-> dossier élève ------------------------------------
create table if not exists public.student_assignments (
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  is_referent boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (student_id, teacher_id)
);
create index if not exists idx_assignments_teacher on public.student_assignments (teacher_id);

-- =============================================================================
-- Fonctions de sécurité (SECURITY DEFINER -> évitent la récursion RLS)
-- =============================================================================
create or replace function app.current_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function app.current_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function app.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('manager','secretary','teacher') from public.profiles where id = auth.uid()), false)
$$;

create or replace function app.is_admin_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('manager','secretary') from public.profiles where id = auth.uid()), false)
$$;

create or replace function app.is_teacher_of_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.student_assignments sa
    where sa.teacher_id = auth.uid() and sa.student_id = p_student_id
  )
$$;

create or replace function app.can_access_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.students s
    where s.id = p_student_id
      and s.organization_id = app.current_org_id()
      and (
        app.is_admin_staff()
        or (app.current_role() = 'teacher' and app.is_teacher_of_student(s.id))
        or (app.current_role() = 'student' and s.profile_id = auth.uid())
      )
  )
$$;

create or replace function app.can_view_profile(p_target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles t
    where t.id = p_target
      and t.organization_id = app.current_org_id()
      and (
        app.is_admin_staff()
        or t.id = auth.uid()
        or (app.current_role() = 'teacher' and (
              t.role in ('manager','secretary','teacher')
              or exists (select 1 from public.students s
                          where s.profile_id = t.id and app.is_teacher_of_student(s.id))
        ))
        or (app.current_role() = 'student' and t.role in ('secretary','teacher'))
      )
  )
$$;

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.teachers enable row level security;
alter table public.secretaries enable row level security;
alter table public.students enable row level security;
alter table public.student_assignments enable row level security;

-- organizations
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select using (id = app.current_org_id());
drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update using (id = app.current_org_id() and app.current_role() = 'manager')
  with check (id = app.current_org_id() and app.current_role() = 'manager');

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (app.can_view_profile(id));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or (organization_id = app.current_org_id() and app.current_role() = 'manager'))
  with check (id = auth.uid() or (organization_id = app.current_org_id() and app.current_role() = 'manager'));

-- teachers
drop policy if exists teachers_select on public.teachers;
create policy teachers_select on public.teachers
  for select using (organization_id = app.current_org_id() and (app.is_staff() or profile_id = auth.uid()));
drop policy if exists teachers_write_admin on public.teachers;
create policy teachers_write_admin on public.teachers
  for all
  using (organization_id = app.current_org_id() and app.is_admin_staff())
  with check (organization_id = app.current_org_id() and app.is_admin_staff());

-- secretaries
drop policy if exists secretaries_select on public.secretaries;
create policy secretaries_select on public.secretaries
  for select using (organization_id = app.current_org_id() and (app.is_admin_staff() or profile_id = auth.uid()));
drop policy if exists secretaries_write_admin on public.secretaries;
create policy secretaries_write_admin on public.secretaries
  for all
  using (organization_id = app.current_org_id() and app.current_role() = 'manager')
  with check (organization_id = app.current_org_id() and app.current_role() = 'manager');

-- students
drop policy if exists students_select on public.students;
create policy students_select on public.students
  for select using (app.can_access_student(id));
drop policy if exists students_write_admin on public.students;
create policy students_write_admin on public.students
  for all
  using (organization_id = app.current_org_id() and app.is_admin_staff())
  with check (organization_id = app.current_org_id() and app.is_admin_staff());

-- student_assignments
drop policy if exists assignments_select on public.student_assignments;
create policy assignments_select on public.student_assignments
  for select using (teacher_id = auth.uid() or app.can_access_student(student_id));
drop policy if exists assignments_write_admin on public.student_assignments;
create policy assignments_write_admin on public.student_assignments
  for all
  using (app.is_admin_staff() and exists (select 1 from public.students s where s.id = student_id and s.organization_id = app.current_org_id()))
  with check (app.is_admin_staff() and exists (select 1 from public.students s where s.id = student_id and s.organization_id = app.current_org_id()));

-- =============================================================================
-- Provisioning automatique du profil à la création d'un compte Auth.
-- =============================================================================
create or replace function app.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := nullif(new.raw_user_meta_data->>'organization_id','')::uuid;
  v_role public.app_role := coalesce(nullif(new.raw_user_meta_data->>'role','')::public.app_role, 'student');
  v_name text := coalesce(new.raw_user_meta_data->>'full_name','');
begin
  if v_org is not null then
    insert into public.profiles (id, organization_id, role, full_name, email)
    values (new.id, v_org, v_role, v_name, new.email)
    on conflict (id) do nothing;

    if v_role = 'teacher' then
      insert into public.teachers (profile_id, organization_id) values (new.id, v_org)
      on conflict (profile_id) do nothing;
    elsif v_role = 'secretary' then
      insert into public.secretaries (profile_id, organization_id) values (new.id, v_org)
      on conflict (profile_id) do nothing;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

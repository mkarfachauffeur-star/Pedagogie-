-- Pré-inscriptions élèves (enseignants → validation gérant/secrétariat)

create table if not exists public.pre_registrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  first_name text not null,
  last_name text not null,
  phone text,
  email text,
  desired_training text not null,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  student_id uuid references public.students(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);

create index if not exists idx_pre_registrations_org on public.pre_registrations (organization_id);
create index if not exists idx_pre_registrations_teacher on public.pre_registrations (teacher_id);
create index if not exists idx_pre_registrations_status on public.pre_registrations (organization_id, status);

alter table public.pre_registrations enable row level security;

drop policy if exists pre_registrations_select on public.pre_registrations;
create policy pre_registrations_select on public.pre_registrations
  for select
  using (
    organization_id = app.current_org_id()
    and (
      app.is_admin_staff()
      or teacher_id = auth.uid()
    )
  );

drop policy if exists pre_registrations_insert_teacher on public.pre_registrations;
create policy pre_registrations_insert_teacher on public.pre_registrations
  for insert
  with check (
    organization_id = app.current_org_id()
    and app.current_role() = 'teacher'
    and teacher_id = auth.uid()
    and app.can_write_org(organization_id)
    and status = 'pending'
  );

alter table public.notifications
  add column if not exists notification_type text not null default 'message',
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists pre_registration_id uuid references public.pre_registrations(id) on delete set null;

create index if not exists idx_notifications_type on public.notifications (profile_id, notification_type);

create or replace function app.notify_staff_new_pre_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    organization_id,
    profile_id,
    notification_type,
    title,
    body,
    pre_registration_id
  )
  select
    new.organization_id,
    p.id,
    'pre_registration',
    'Nouvelle pré-inscription reçue',
    trim(new.first_name || ' ' || new.last_name) || ' · ' || coalesce(new.desired_training, 'Formation'),
    new.id
  from public.profiles p
  where p.organization_id = new.organization_id
    and p.role in ('manager', 'secretary');

  return new;
end;
$$;

drop trigger if exists pre_registrations_notify_staff on public.pre_registrations;
create trigger pre_registrations_notify_staff
  after insert on public.pre_registrations
  for each row
  execute function app.notify_staff_new_pre_registration();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pre_registrations'
  ) then
    alter publication supabase_realtime add table public.pre_registrations;
  end if;
exception when duplicate_object then null;
end $$;

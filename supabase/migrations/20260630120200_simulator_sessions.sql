-- Séances simulateur — entité dédiée + paramètre d'établissement (Mode A / Mode B)

do $$ begin
  create type public.simulator_session_supervisor_mode as enum ('teacher', 'admin_supervisor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.simulator_session_status as enum ('planned', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

alter table public.organizations
  add column if not exists simulator_session_supervisor_mode public.simulator_session_supervisor_mode
    not null default 'admin_supervisor';

comment on column public.organizations.simulator_session_supervisor_mode is
  'Mode A (teacher) : encadrant = enseignant. Mode B (admin_supervisor) : encadrant = gérant ou secrétaire.';

create table if not exists public.simulator_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete restrict,
  simulator_id uuid not null references public.teachers(profile_id) on delete restrict,
  supervisor_id uuid not null references public.profiles(id) on delete restrict,
  supervisor_mode public.simulator_session_supervisor_mode not null,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  duration_minutes integer not null check (duration_minutes > 0),
  status public.simulator_session_status not null default 'planned',
  notes text,
  rdv_permis_external_id text,
  rdv_permis_sync_status text check (
    rdv_permis_sync_status is null
    or rdv_permis_sync_status in ('pending', 'synced', 'error')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  closed_at timestamptz,
  closed_by uuid references public.profiles(id) on delete set null,
  constraint simulator_sessions_time_order check (end_time > start_time)
);

create index if not exists idx_simulator_sessions_org_date
  on public.simulator_sessions (organization_id, session_date desc);

create index if not exists idx_simulator_sessions_student
  on public.simulator_sessions (student_id, session_date desc);

create index if not exists idx_simulator_sessions_simulator
  on public.simulator_sessions (simulator_id, session_date desc);

comment on table public.simulator_sessions is
  'Séances simulateur (élève + ressource simulateur + encadrant). Exportable vers RdvPermis.';

-- ─── Validation métier ───────────────────────────────────────────────────────

create or replace function app.compute_session_duration_minutes(p_start time, p_end time)
returns integer
language sql
immutable
as $$
  select greatest(1, (extract(epoch from (p_end - p_start)) / 60)::integer);
$$;

create or replace function app.validate_simulator_session_row()
returns trigger
language plpgsql
as $$
declare
  v_supervisor_role public.app_role;
  v_org_mode public.simulator_session_supervisor_mode;
begin
  if not exists (
    select 1
    from public.teachers t
    where t.profile_id = new.simulator_id
      and t.organization_id = new.organization_id
      and t.resource_type = 'simulator'
      and t.is_active = true
  ) then
    raise exception 'La ressource simulateur sélectionnée est invalide ou inactive.';
  end if;

  if not exists (
    select 1
    from public.students s
    where s.id = new.student_id and s.organization_id = new.organization_id
  ) then
    raise exception 'Élève introuvable dans votre auto-école.';
  end if;

  select p.role into v_supervisor_role
  from public.profiles p
  where p.id = new.supervisor_id
    and p.organization_id = new.organization_id
    and p.is_active = true;

  if v_supervisor_role is null then
    raise exception 'Encadrant introuvable ou inactif.';
  end if;

  if new.supervisor_mode = 'admin_supervisor' then
    if v_supervisor_role not in ('manager', 'secretary') then
      raise exception 'En mode administratif, l''encadrant doit être un gérant ou un secrétaire.';
    end if;
  else
    if v_supervisor_role <> 'teacher' then
      raise exception 'En mode enseignant, l''encadrant doit être un moniteur.';
    end if;
    if exists (
      select 1 from public.teachers t
      where t.profile_id = new.supervisor_id and t.resource_type = 'simulator'
    ) then
      raise exception 'Un simulateur ne peut pas être encadrant de séance.';
    end if;
  end if;

  select o.simulator_session_supervisor_mode into v_org_mode
  from public.organizations o
  where o.id = new.organization_id;

  if v_org_mode is distinct from new.supervisor_mode then
    raise exception 'Le mode d''encadrement ne correspond pas au paramètre de l''établissement.';
  end if;

  new.duration_minutes := app.compute_session_duration_minutes(new.start_time, new.end_time);
  new.updated_at := now();

  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    new.closed_at := coalesce(new.closed_at, now());
    new.closed_by := coalesce(new.closed_by, auth.uid());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_simulator_session on public.simulator_sessions;
create trigger trg_validate_simulator_session
  before insert or update on public.simulator_sessions
  for each row execute function app.validate_simulator_session_row();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.simulator_sessions enable row level security;

drop policy if exists simulator_sessions_select on public.simulator_sessions;
create policy simulator_sessions_select on public.simulator_sessions
  for select using (
    organization_id = app.current_org_id()
    and (app.is_admin_staff() or app.current_role() = 'teacher')
  );

drop policy if exists simulator_sessions_insert on public.simulator_sessions;
create policy simulator_sessions_insert on public.simulator_sessions
  for insert with check (
    organization_id = app.current_org_id()
    and app.is_admin_staff()
    and app.can_write_org()
  );

drop policy if exists simulator_sessions_update on public.simulator_sessions;
create policy simulator_sessions_update on public.simulator_sessions
  for update using (
    organization_id = app.current_org_id()
    and app.is_admin_staff()
    and app.can_write_org()
  ) with check (
    organization_id = app.current_org_id()
    and app.is_admin_staff()
    and app.can_write_org()
  );

drop policy if exists simulator_sessions_delete on public.simulator_sessions;
create policy simulator_sessions_delete on public.simulator_sessions
  for delete using (
    organization_id = app.current_org_id()
    and app.current_role() = 'manager'
    and app.can_write_org()
  );

-- ─── Listing enrichi ─────────────────────────────────────────────────────────

create or replace function app.list_organization_simulator_sessions(
  p_date_from date default null,
  p_date_to date default null,
  p_student_id uuid default null,
  p_simulator_id uuid default null
)
returns table (
  id uuid,
  organization_id uuid,
  student_id uuid,
  student_first_name text,
  student_last_name text,
  student_file_number text,
  simulator_id uuid,
  simulator_name text,
  simulator_authorization_number text,
  supervisor_id uuid,
  supervisor_name text,
  supervisor_mode public.simulator_session_supervisor_mode,
  session_date date,
  start_time time,
  end_time time,
  duration_minutes integer,
  status public.simulator_session_status,
  notes text,
  rdv_permis_external_id text,
  rdv_permis_sync_status text,
  created_at timestamptz,
  updated_at timestamptz,
  closed_at timestamptz
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not (app.is_admin_staff() or app.current_role() = 'teacher') then
    raise exception 'Permission denied';
  end if;

  return query
  select
    ss.id,
    ss.organization_id,
    ss.student_id,
    s.first_name,
    s.last_name,
    s.file_number,
    ss.simulator_id,
    sp.full_name as simulator_name,
    st.authorization_number,
    ss.supervisor_id,
    sup.full_name as supervisor_name,
    ss.supervisor_mode,
    ss.session_date,
    ss.start_time,
    ss.end_time,
    ss.duration_minutes,
    ss.status,
    ss.notes,
    ss.rdv_permis_external_id,
    ss.rdv_permis_sync_status,
    ss.created_at,
    ss.updated_at,
    ss.closed_at
  from public.simulator_sessions ss
  inner join public.students s on s.id = ss.student_id
  inner join public.teachers st on st.profile_id = ss.simulator_id
  inner join public.profiles sp on sp.id = ss.simulator_id
  inner join public.profiles sup on sup.id = ss.supervisor_id
  where ss.organization_id = app.current_org_id()
    and (p_date_from is null or ss.session_date >= p_date_from)
    and (p_date_to is null or ss.session_date <= p_date_to)
    and (p_student_id is null or ss.student_id = p_student_id)
    and (p_simulator_id is null or ss.simulator_id = p_simulator_id)
  order by ss.session_date desc, ss.start_time desc;
end;
$$;

revoke all on function app.list_organization_simulator_sessions(date, date, uuid, uuid) from public;
grant execute on function app.list_organization_simulator_sessions(date, date, uuid, uuid) to authenticated;

create or replace function public.list_organization_simulator_sessions(
  p_date_from date default null,
  p_date_to date default null,
  p_student_id uuid default null,
  p_simulator_id uuid default null
)
returns table (
  id uuid,
  organization_id uuid,
  student_id uuid,
  student_first_name text,
  student_last_name text,
  student_file_number text,
  simulator_id uuid,
  simulator_name text,
  simulator_authorization_number text,
  supervisor_id uuid,
  supervisor_name text,
  supervisor_mode public.simulator_session_supervisor_mode,
  session_date date,
  start_time time,
  end_time time,
  duration_minutes integer,
  status public.simulator_session_status,
  notes text,
  rdv_permis_external_id text,
  rdv_permis_sync_status text,
  created_at timestamptz,
  updated_at timestamptz,
  closed_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select * from app.list_organization_simulator_sessions(
    p_date_from, p_date_to, p_student_id, p_simulator_id
  );
$$;

grant execute on function public.list_organization_simulator_sessions(date, date, uuid, uuid) to authenticated;

-- Options formulaire (simulateurs + encadrants selon mode org)

create or replace function app.list_simulator_session_form_options()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_mode public.simulator_session_supervisor_mode;
  v_supervisors jsonb;
begin
  if not app.is_admin_staff() then
    raise exception 'Permission denied';
  end if;

  select o.simulator_session_supervisor_mode into v_mode
  from public.organizations o
  where o.id = app.current_org_id();

  if v_mode = 'teacher' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', t.profile_id,
      'label', p.full_name
    ) order by p.full_name), '[]'::jsonb) into v_supervisors
    from public.teachers t
    inner join public.profiles p on p.id = t.profile_id
    where t.organization_id = app.current_org_id()
      and t.resource_type = 'teacher'
      and t.is_active = true
      and p.is_active = true;
  else
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id,
      'label', p.full_name,
      'role', p.role
    ) order by p.full_name), '[]'::jsonb) into v_supervisors
    from public.profiles p
    where p.organization_id = app.current_org_id()
      and p.role in ('manager', 'secretary')
      and p.is_active = true;
  end if;

  return jsonb_build_object(
    'supervisor_mode', v_mode,
    'simulators', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', t.profile_id,
        'label', p.full_name,
        'authorization_number', t.authorization_number
      ) order by p.full_name), '[]'::jsonb)
      from public.teachers t
      inner join public.profiles p on p.id = t.profile_id
      where t.organization_id = app.current_org_id()
        and t.resource_type = 'simulator'
        and t.is_active = true
        and p.is_active = true
    ),
    'students', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id,
        'label', trim(both from concat(s.last_name, ' ', s.first_name)),
        'file_number', s.file_number
      ) order by s.last_name, s.first_name), '[]'::jsonb)
      from public.students s
      where s.organization_id = app.current_org_id()
    ),
    'supervisors', v_supervisors
  );
end;
$$;

revoke all on function app.list_simulator_session_form_options() from public;
grant execute on function app.list_simulator_session_form_options() to authenticated;

create or replace function public.list_simulator_session_form_options()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select app.list_simulator_session_form_options();
$$;

grant execute on function public.list_simulator_session_form_options() to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.simulator_sessions;
exception when duplicate_object then null;
end $$;

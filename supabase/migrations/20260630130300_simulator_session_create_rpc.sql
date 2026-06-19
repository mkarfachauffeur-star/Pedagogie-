-- Création séance simulateur : mode d'encadrement lu côté serveur + messages clairs.

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

  select coalesce(o.simulator_session_supervisor_mode, 'admin_supervisor'::public.simulator_session_supervisor_mode)
  into v_org_mode
  from public.organizations o
  where o.id = new.organization_id;

  new.supervisor_mode := v_org_mode;

  new.duration_minutes := app.compute_session_duration_minutes(new.start_time, new.end_time);
  new.updated_at := now();

  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    new.closed_at := coalesce(new.closed_at, now());
    new.closed_by := coalesce(new.closed_by, auth.uid());
  end if;

  return new;
end;
$$;

create or replace function app.create_simulator_session(
  p_student_id uuid,
  p_simulator_id uuid,
  p_supervisor_id uuid,
  p_session_date date,
  p_start_time time,
  p_end_time time,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := app.current_org_id();
  v_mode public.simulator_session_supervisor_mode;
  v_session_id uuid;
begin
  if not app.is_admin_staff() or not app.can_write_org() then
    raise exception 'Permission denied';
  end if;

  select coalesce(o.simulator_session_supervisor_mode, 'admin_supervisor'::public.simulator_session_supervisor_mode)
  into v_mode
  from public.organizations o
  where o.id = v_org_id;

  insert into public.simulator_sessions (
    organization_id,
    student_id,
    simulator_id,
    supervisor_id,
    supervisor_mode,
    session_date,
    start_time,
    end_time,
    notes,
    status,
    created_by
  ) values (
    v_org_id,
    p_student_id,
    p_simulator_id,
    p_supervisor_id,
    v_mode,
    p_session_date,
    p_start_time,
    p_end_time,
    nullif(btrim(p_notes), ''),
    'planned',
    auth.uid()
  )
  returning id into v_session_id;

  return v_session_id;
end;
$$;

revoke all on function app.create_simulator_session(uuid, uuid, uuid, date, time without time zone, time without time zone, text) from public;
grant execute on function app.create_simulator_session(uuid, uuid, uuid, date, time without time zone, time without time zone, text) to authenticated;

create or replace function public.create_simulator_session(
  p_student_id uuid,
  p_simulator_id uuid,
  p_supervisor_id uuid,
  p_session_date date,
  p_start_time time,
  p_end_time time,
  p_notes text default null
)
returns uuid
language sql
security definer
set search_path = public
as $$
  select app.create_simulator_session(
    p_student_id,
    p_simulator_id,
    p_supervisor_id,
    p_session_date,
    p_start_time,
    p_end_time,
    p_notes
  );
$$;

grant execute on function public.create_simulator_session(uuid, uuid, uuid, date, time without time zone, time without time zone, text) to authenticated;

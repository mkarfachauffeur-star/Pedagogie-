-- Valider une séance = enregistrement direct en statut clôturé (plus de clôture manuelle).

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
    created_by,
    closed_at,
    closed_by
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
    'completed',
    auth.uid(),
    now(),
    auth.uid()
  )
  returning id into v_session_id;

  return v_session_id;
end;
$$;

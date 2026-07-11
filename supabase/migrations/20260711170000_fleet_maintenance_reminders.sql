-- Rappel mensuel aux gérants : vérifier pneus, liquide de refroidissement et huile moteur
-- sur les véhicules thermiques (essence, diesel, hybride).

create table if not exists public.fleet_maintenance_reminder_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  month_key text not null,
  thermal_vehicle_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (organization_id, month_key)
);

create index if not exists idx_fleet_maintenance_reminder_log_org
  on public.fleet_maintenance_reminder_log (organization_id, month_key desc);

alter table public.fleet_maintenance_reminder_log enable row level security;

create or replace function app.notify_manager_fleet_maintenance_reminder(
  p_org_id uuid,
  p_month_key text,
  p_vehicle_count integer,
  p_vehicle_summary text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_body text;
begin
  if exists (
    select 1
    from public.fleet_maintenance_reminder_log l
    where l.organization_id = p_org_id
      and l.month_key = p_month_key
  ) then
    return false;
  end if;

  v_title := 'Contrôle mensuel de la flotte thermique';
  v_body := 'Vérifiez l''état des pneus, du liquide de refroidissement et de l''huile moteur'
    || ' sur vos ' || p_vehicle_count || ' véhicule'
    || case when p_vehicle_count > 1 then 's thermiques' else ' thermique' end
    || case
      when coalesce(nullif(trim(p_vehicle_summary), ''), '') <> '' then ' : ' || p_vehicle_summary
      else '.'
    end;

  insert into public.notifications (
    organization_id,
    profile_id,
    notification_type,
    title,
    body,
    expiry_kind,
    is_read
  )
  select
    p_org_id,
    p.id,
    'expiry_reminder',
    v_title,
    v_body,
    'fleet_monthly_maintenance',
    false
  from public.profiles p
  where p.organization_id = p_org_id
    and p.role = 'manager'
    and p.is_active = true;

  insert into public.fleet_maintenance_reminder_log (
    organization_id,
    month_key,
    thermal_vehicle_count
  ) values (
    p_org_id,
    p_month_key,
    greatest(p_vehicle_count, 0)
  );

  return true;
end;
$$;

create or replace function app.run_fleet_maintenance_reminders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sent integer := 0;
  v_month_key text := to_char(current_date, 'YYYY-MM');
  v_row record;
  v_summary text;
begin
  for v_row in
    select
      v.organization_id,
      count(*)::integer as vehicle_count,
      string_agg(
        trim(both from concat(coalesce(v.brand, ''), ' ', coalesce(v.model, ''), ' · ', coalesce(v.plate, ''))),
        ', '
        order by v.created_at
      ) as vehicle_summary
    from public.vehicles v
    where coalesce(lower(v.energy), '') <> 'électrique'
    group by v.organization_id
    having count(*) > 0
  loop
    v_summary := v_row.vehicle_summary;
    if length(v_summary) > 180 then
      v_summary := left(v_summary, 177) || '…';
    end if;

    if app.notify_manager_fleet_maintenance_reminder(
      v_row.organization_id,
      v_month_key,
      v_row.vehicle_count,
      v_summary
    ) then
      v_sent := v_sent + 1;
    end if;
  end loop;

  return jsonb_build_object('sent', v_sent, 'month_key', v_month_key, 'checked_at', now());
end;
$$;

revoke all on function app.notify_manager_fleet_maintenance_reminder(uuid, text, integer, text) from public;
revoke all on function app.run_fleet_maintenance_reminders() from public;
grant execute on function app.run_fleet_maintenance_reminders() to authenticated, service_role;

create or replace function public.run_fleet_maintenance_reminders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not app.is_admin_staff() then
    raise exception 'Permission denied';
  end if;
  return app.run_fleet_maintenance_reminders();
end;
$$;

revoke all on function public.run_fleet_maintenance_reminders() from public;
grant execute on function public.run_fleet_maintenance_reminders() to authenticated, service_role;

comment on table public.fleet_maintenance_reminder_log is
  'Journal des rappels mensuels de contrôle flotte thermique (pneus, liquides, huile).';

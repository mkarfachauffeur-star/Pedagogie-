-- Alertes J-15 : autorisation enseignant / simulateur, contrôle technique véhicule.
-- Notifie gérant + secrétariat via la table notifications (cloche).

create table if not exists public.expiration_reminder_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reminder_key text not null,
  expiry_kind text not null,
  resource_id uuid,
  expires_on date not null,
  created_at timestamptz not null default now(),
  unique (organization_id, reminder_key)
);

create index if not exists idx_expiration_reminder_log_org
  on public.expiration_reminder_log (organization_id, expires_on desc);

alter table public.notifications
  add column if not exists expiry_kind text,
  add column if not exists resource_id uuid;

create or replace function app.parse_iso_date(p_value text)
returns date
language sql
immutable
as $$
  select case
    when p_value ~ '^\d{4}-\d{2}-\d{2}$' then p_value::date
    else null
  end;
$$;

create or replace function app.notify_staff_expiration_reminder(
  p_org_id uuid,
  p_reminder_key text,
  p_expiry_kind text,
  p_resource_id uuid,
  p_expires_on date,
  p_title text,
  p_body text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.expiration_reminder_log l
    where l.organization_id = p_org_id
      and l.reminder_key = p_reminder_key
  ) then
    return false;
  end if;

  insert into public.notifications (
    organization_id,
    profile_id,
    notification_type,
    title,
    body,
    expiry_kind,
    resource_id,
    is_read
  )
  select
    p_org_id,
    p.id,
    'expiry_reminder',
    p_title,
    p_body,
    p_expiry_kind,
    p_resource_id,
    false
  from public.profiles p
  where p.organization_id = p_org_id
    and p.role in ('manager', 'secretary')
    and p.is_active = true;

  insert into public.expiration_reminder_log (
    organization_id,
    reminder_key,
    expiry_kind,
    resource_id,
    expires_on
  ) values (
    p_org_id,
    p_reminder_key,
    p_expiry_kind,
    p_resource_id,
    p_expires_on
  );

  return true;
end;
$$;

create or replace function app.run_expiration_reminders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sent integer := 0;
  v_row record;
  v_days integer;
  v_title text;
  v_body text;
  v_key text;
  v_expires date;
begin
  -- Enseignants actifs
  for v_row in
    select
      t.organization_id,
      t.profile_id,
      t.authorization_expires_at as expires_on,
      coalesce(nullif(trim(p.full_name), ''), 'Enseignant') as label
    from public.teachers t
    inner join public.profiles p on p.id = t.profile_id
    where t.is_active = true
      and p.is_active = true
      and t.resource_type = 'teacher'
      and t.authorization_expires_at is not null
      and t.authorization_expires_at >= current_date
      and t.authorization_expires_at <= current_date + 15
  loop
    v_expires := v_row.expires_on;
    v_days := v_expires - current_date;
    v_key := 'teacher:' || v_row.profile_id::text || ':' || v_expires::text;
    v_title := 'Autorisation enseignant bientôt expirée';
    v_body := v_row.label || ' — validité le '
      || to_char(v_expires, 'DD/MM/YYYY')
      || ' (dans ' || v_days || ' jour'
      || case when v_days > 1 then 's' else '' end || ')';

    if app.notify_staff_expiration_reminder(
      v_row.organization_id,
      v_key,
      'teacher_authorization',
      v_row.profile_id,
      v_expires,
      v_title,
      v_body
    ) then
      v_sent := v_sent + 1;
    end if;
  end loop;

  -- Simulateurs actifs
  for v_row in
    select
      t.organization_id,
      t.profile_id,
      t.authorization_expires_at as expires_on,
      coalesce(nullif(trim(p.full_name), ''), 'Simulateur') as label
    from public.teachers t
    inner join public.profiles p on p.id = t.profile_id
    where t.is_active = true
      and p.is_active = true
      and t.resource_type = 'simulator'
      and t.authorization_expires_at is not null
      and t.authorization_expires_at >= current_date
      and t.authorization_expires_at <= current_date + 15
  loop
    v_expires := v_row.expires_on;
    v_days := v_expires - current_date;
    v_key := 'simulator:' || v_row.profile_id::text || ':' || v_expires::text;
    v_title := 'Autorisation simulateur bientôt expirée';
    v_body := v_row.label || ' — validité le '
      || to_char(v_expires, 'DD/MM/YYYY')
      || ' (dans ' || v_days || ' jour'
      || case when v_days > 1 then 's' else '' end || ')';

    if app.notify_staff_expiration_reminder(
      v_row.organization_id,
      v_key,
      'simulator_authorization',
      v_row.profile_id,
      v_expires,
      v_title,
      v_body
    ) then
      v_sent := v_sent + 1;
    end if;
  end loop;

  -- Contrôle technique véhicules (date dans details.technicalControl)
  for v_row in
    select
      v.organization_id,
      v.id as vehicle_id,
      app.parse_iso_date(v.details->>'technicalControl') as expires_on,
      trim(both from concat(coalesce(v.brand, ''), ' ', coalesce(v.model, ''))) as label,
      coalesce(nullif(trim(v.plate), ''), '—') as plate
    from public.vehicles v
    where app.parse_iso_date(v.details->>'technicalControl') is not null
      and app.parse_iso_date(v.details->>'technicalControl') >= current_date
      and app.parse_iso_date(v.details->>'technicalControl') <= current_date + 15
  loop
    v_expires := v_row.expires_on;
    v_days := v_expires - current_date;
    v_key := 'vehicle_ct:' || v_row.vehicle_id::text || ':' || v_expires::text;
    v_title := 'Contrôle technique bientôt expiré';
    v_body := trim(both from v_row.label)
      || ' · ' || v_row.plate
      || ' — validité le '
      || to_char(v_expires, 'DD/MM/YYYY')
      || ' (dans ' || v_days || ' jour'
      || case when v_days > 1 then 's' else '' end || ')';

    if app.notify_staff_expiration_reminder(
      v_row.organization_id,
      v_key,
      'vehicle_technical_control',
      v_row.vehicle_id,
      v_expires,
      v_title,
      v_body
    ) then
      v_sent := v_sent + 1;
    end if;
  end loop;

  return jsonb_build_object('sent', v_sent, 'checked_at', now());
end;
$$;

revoke all on function app.run_expiration_reminders() from public;
grant execute on function app.run_expiration_reminders() to authenticated, service_role;

create or replace function public.run_expiration_reminders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not app.is_admin_staff() then
    raise exception 'Permission denied';
  end if;
  return app.run_expiration_reminders();
end;
$$;

grant execute on function public.run_expiration_reminders() to authenticated, service_role;

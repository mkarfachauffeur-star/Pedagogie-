-- Fin de parcours élève : examen pratique, résultat permis, archivage, expiration compte (365 j).

alter table public.students
  add column if not exists license_result text,
  add column if not exists license_obtained_at date,
  add column if not exists archived_at timestamptz,
  add column if not exists is_archived boolean not null default false;

alter table public.profiles
  add column if not exists access_expires_at timestamptz,
  add column if not exists access_expiry_warned_at timestamptz;

create index if not exists idx_students_license_result
  on public.students (organization_id, license_result)
  where license_result is not null;

create index if not exists idx_profiles_student_access_expires
  on public.profiles (access_expires_at)
  where role = 'student';

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function app.is_practical_driving_exam(p_type text)
returns boolean
language sql
immutable
as $$
  select coalesce(trim(p_type), '') in ('Permis B', 'AAC', 'Boîte auto');
$$;

create or replace function app.student_is_archived(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    where s.id = p_student_id
      and (
        s.is_archived = true
        or s.status = 'Archivé'
        or s.license_result = 'obtained'
      )
  );
$$;

create or replace function app.student_allows_bookings(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    where s.id = p_student_id
      and s.is_archived = false
      and coalesce(s.status, '') <> 'Archivé'
      and coalesce(s.license_result, '') <> 'obtained'
  );
$$;

create or replace function app.set_student_access_expiry_on_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'student' and new.access_expires_at is null then
    new.access_expires_at := new.created_at + interval '365 days';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profile_student_access_expiry on public.profiles;
create trigger trg_profile_student_access_expiry
  before insert on public.profiles
  for each row execute function app.set_student_access_expiry_on_profile();

update public.profiles p
set access_expires_at = p.created_at + interval '365 days'
where p.role = 'student'
  and p.access_expires_at is null;

-- Examen pratique planifié → statut élève
create or replace function app.on_practical_exam_scheduled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.student_id is null or not app.is_practical_driving_exam(new.type) then
    return new;
  end if;

  if app.student_is_archived(new.student_id) then
    raise exception 'Impossible de planifier un examen : dossier élève archivé.';
  end if;

  update public.students s
  set
    status = 'Examen pratique en attente de résultat',
    license_result = 'awaiting_result'
  where s.id = new.student_id
    and s.is_archived = false
    and coalesce(s.license_result, '') <> 'obtained';

  return new;
end;
$$;

drop trigger if exists trg_practical_exam_scheduled on public.exams;
create trigger trg_practical_exam_scheduled
  after insert on public.exams
  for each row execute function app.on_practical_exam_scheduled();

-- Garde-fous réservations
create or replace function app.guard_student_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.student_id is not null and not app.student_allows_bookings(new.student_id) then
    raise exception 'Dossier élève archivé ou permis obtenu : réservation impossible.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_appointment_booking on public.appointments;
create trigger trg_guard_appointment_booking
  before insert or update of student_id on public.appointments
  for each row execute function app.guard_student_booking();

drop trigger if exists trg_guard_exam_booking on public.exams;
create trigger trg_guard_exam_booking
  before insert on public.exams
  for each row execute function app.guard_student_booking();

-- Notifications permis obtenu (gérant + secrétariat)
create or replace function app.notify_staff_license_obtained(
  p_org_id uuid,
  p_student_id uuid,
  p_student_name text
)
returns void
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
    student_id,
    reminder_kind,
    is_read
  )
  select
    p_org_id,
    p.id,
    'license_obtained',
    '🎉 Permis obtenu',
    format(
      'L''élève %s a obtenu son permis. Son dossier a été archivé automatiquement.',
      p_student_name
    ),
    p_student_id,
    'license_obtained',
    false
  from public.profiles p
  where p.organization_id = p_org_id
    and p.role in ('manager', 'secretary')
    and coalesce(p.is_active, true) = true;
end;
$$;

-- Enregistrer le résultat du permis (secrétariat / gérant)
create or replace function app.record_license_result(
  p_student_id uuid,
  p_result text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student record;
  v_name text;
  v_now date := (now() at time zone 'Europe/Paris')::date;
begin
  if p_result not in ('obtained', 'failed', 'pending') then
    raise exception 'Résultat invalide.';
  end if;

  if app.current_role() not in ('manager', 'secretary') then
    raise exception 'Action réservée au secrétariat ou au gérant.';
  end if;

  select s.*
  into v_student
  from public.students s
  where s.id = p_student_id
    and s.organization_id = app.current_org_id();

  if v_student.id is null then
    raise exception 'Élève introuvable.';
  end if;

  v_name := trim(coalesce(v_student.first_name, '') || ' ' || coalesce(v_student.last_name, ''));

  if p_result = 'obtained' then
    update public.students
    set
      license_result = 'obtained',
      license_obtained_at = v_now,
      status = 'Archivé',
      is_archived = true,
      archived_at = now()
    where id = p_student_id;

    update public.student_automated_reminders
    set is_active = false, deactivated_at = now()
    where student_id = p_student_id and is_active = true;

    perform app.notify_staff_license_obtained(v_student.organization_id, p_student_id, v_name);

    return jsonb_build_object(
      'ok', true,
      'result', 'obtained',
      'student_id', p_student_id,
      'license_obtained_at', v_now
    );
  end if;

  if p_result = 'failed' then
    update public.students
    set
      license_result = 'failed',
      status = 'Permis non obtenu',
      is_archived = false,
      archived_at = null
    where id = p_student_id;

    return jsonb_build_object('ok', true, 'result', 'failed', 'student_id', p_student_id);
  end if;

  -- pending
  update public.students
  set
    license_result = 'pending',
    status = 'Examen pratique en attente de résultat',
    is_archived = false
  where id = p_student_id;

  return jsonb_build_object('ok', true, 'result', 'pending', 'student_id', p_student_id);
end;
$$;

create or replace function public.record_license_result(p_student_id uuid, p_result text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return app.record_license_result(p_student_id, p_result);
end;
$$;

grant execute on function public.record_license_result(uuid, text) to authenticated;

-- Expiration compte élève (J-15 alerte, J+365 désactivation)
create or replace function app.notify_student_access_expiring(
  p_profile_id uuid,
  p_org_id uuid
)
returns void
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
    is_read
  ) values (
    p_org_id,
    p_profile_id,
    'access_expiring',
    '⏳ Votre accès expire bientôt',
    'Votre accès Pedagogia Drive expirera dans 15 jours.',
    false
  );
end;
$$;

create or replace function app.run_student_access_expiry_checks()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_warned integer := 0;
  v_expired integer := 0;
  v_row record;
  v_warn_emails jsonb := '[]'::jsonb;
begin
  for v_row in
    select p.id, p.organization_id, p.email, p.full_name, p.access_expires_at
    from public.profiles p
    where p.role = 'student'
      and coalesce(p.is_active, true) = true
      and p.access_expires_at is not null
      and p.access_expires_at > now()
      and p.access_expires_at <= now() + interval '15 days'
      and p.access_expiry_warned_at is null
  loop
    perform app.notify_student_access_expiring(v_row.id, v_row.organization_id);
    update public.profiles
    set access_expiry_warned_at = now()
    where id = v_row.id;

    v_warn_emails := v_warn_emails || jsonb_build_array(jsonb_build_object(
      'profile_id', v_row.id,
      'email', v_row.email,
      'full_name', v_row.full_name,
      'access_expires_at', v_row.access_expires_at
    ));
    v_warned := v_warned + 1;
  end loop;

  for v_row in
    select p.id
    from public.profiles p
    where p.role = 'student'
      and coalesce(p.is_active, true) = true
      and p.access_expires_at is not null
      and p.access_expires_at <= now()
  loop
    update public.profiles
    set is_active = false
    where id = v_row.id;
    v_expired := v_expired + 1;
  end loop;

  return jsonb_build_object(
    'warned', v_warned,
    'expired', v_expired,
    'warn_emails', v_warn_emails
  );
end;
$$;

create or replace function public.run_student_access_expiry_checks()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return app.run_student_access_expiry_checks();
end;
$$;

grant execute on function public.run_student_access_expiry_checks() to service_role;

-- Réactivation compte élève (gérant) : +365 jours
create or replace function app.reactivate_student_access(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  if app.current_role() <> 'manager' then
    raise exception 'Action réservée au gérant.';
  end if;

  select s.profile_id into v_profile_id
  from public.students s
  where s.id = p_student_id
    and s.organization_id = app.current_org_id();

  if v_profile_id is null then
    raise exception 'Élève introuvable ou sans compte.';
  end if;

  update public.profiles
  set
    is_active = true,
    access_expires_at = now() + interval '365 days',
    access_expiry_warned_at = null
  where id = v_profile_id;

  return jsonb_build_object('ok', true, 'profile_id', v_profile_id);
end;
$$;

create or replace function public.reactivate_student_access(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return app.reactivate_student_access(p_student_id);
end;
$$;

grant execute on function public.reactivate_student_access(uuid) to authenticated;

-- student_is_active : dossier non archivé (examen en attente de résultat = actif)
create or replace function app.student_is_active(p_status text)
returns boolean
language sql
immutable
as $$
  select coalesce(nullif(trim(p_status), ''), 'En attente') <> 'Archivé';
$$;

create or replace function app.student_needs_code_reminder(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    where s.id = p_student_id
      and s.is_archived = false
      and coalesce(s.code_status, 'Non obtenu') <> 'Obtenu'
      and app.student_is_active(s.status)
  );
$$;

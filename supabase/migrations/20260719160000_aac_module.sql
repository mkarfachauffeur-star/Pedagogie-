-- =============================================================================
-- Module AAC (conduite accompagnée) — profil, trajets GPS, RVP, FFI, rappels
-- =============================================================================

create table if not exists public.aac_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  started_at date,
  planned_end_at date,
  exam_eligible_at date,
  km_total numeric(10,2) not null default 0,
  trip_count integer not null default 0,
  status text not null default 'en_cours'
    check (status in ('en_cours', 'conditions_remplies', 'terminee')),
  ffi_document_id uuid references public.documents(id) on delete set null,
  ffi_storage_path text,
  marked_complete_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id)
);

create index if not exists idx_aac_profiles_org on public.aac_profiles (organization_id);
create index if not exists idx_aac_profiles_status on public.aac_profiles (organization_id, status);

create table if not exists public.aac_trips (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  distance_km numeric(10,3) not null default 0,
  duration_seconds integer not null default 0,
  path_summary jsonb not null default '[]'::jsonb,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'cancelled')),
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_aac_trips_student on public.aac_trips (student_id, started_at desc);
create index if not exists idx_aac_trips_org on public.aac_trips (organization_id, status);
create unique index if not exists idx_aac_trips_one_active
  on public.aac_trips (student_id)
  where status = 'in_progress';

create table if not exists public.aac_trip_points (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.aac_trips(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  lat numeric(10,7) not null,
  lng numeric(10,7) not null,
  accuracy_m numeric(10,2),
  sequence_no integer not null default 0
);

create index if not exists idx_aac_trip_points_trip on public.aac_trip_points (trip_id, sequence_no);

create table if not exists public.aac_rvp (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  sequence smallint not null check (sequence between 1 and 3),
  held_on date,
  teacher_id uuid references public.profiles(id) on delete set null,
  companion_name text,
  observations text,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, sequence)
);

create index if not exists idx_aac_rvp_student on public.aac_rvp (student_id);

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

create or replace function app.aac_add_one_year(p_date date)
returns date
language sql
immutable
as $$
  select case when p_date is null then null else (p_date + interval '1 year')::date end;
$$;

create or replace function app.aac_age_years(p_birth date, p_on date default current_date)
returns integer
language sql
immutable
as $$
  select case
    when p_birth is null or p_on is null then null
    else (
      extract(year from age(p_on, p_birth))
    )::integer
  end;
$$;

create or replace function app.aac_conditions_met(
  p_started_at date,
  p_km_total numeric,
  p_birth_date date,
  p_rvp_completed integer,
  p_on date default current_date
)
returns boolean
language sql
immutable
as $$
  select
    p_started_at is not null
    and p_on >= app.aac_add_one_year(p_started_at)
    and coalesce(p_km_total, 0) >= 3000
    and coalesce(app.aac_age_years(p_birth_date, p_on), 0) >= 17
    and coalesce(p_rvp_completed, 0) >= 3;
$$;

create or replace function app.refresh_aac_profile_stats(p_student_id uuid)
returns public.aac_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.aac_profiles;
  v_km numeric(10,2);
  v_trips integer;
  v_rvp integer;
  v_birth date;
  v_new_status text;
begin
  select * into v_profile
  from public.aac_profiles
  where student_id = p_student_id
  for update;

  if v_profile.id is null then
    return null;
  end if;

  select coalesce(sum(distance_km), 0), count(*)::integer
  into v_km, v_trips
  from public.aac_trips
  where student_id = p_student_id
    and status = 'completed';

  select count(*)::integer
  into v_rvp
  from public.aac_rvp
  where student_id = p_student_id
    and completed = true;

  select birth_date into v_birth
  from public.students
  where id = p_student_id;

  if v_profile.status = 'terminee' then
    v_new_status := 'terminee';
  elsif app.aac_conditions_met(v_profile.started_at, v_km, v_birth, v_rvp) then
    v_new_status := 'conditions_remplies';
  else
    v_new_status := 'en_cours';
  end if;

  update public.aac_profiles
  set
    km_total = v_km,
    trip_count = v_trips,
    planned_end_at = app.aac_add_one_year(started_at),
    exam_eligible_at = app.aac_add_one_year(started_at),
    status = v_new_status,
    updated_at = now()
  where id = v_profile.id
  returning * into v_profile;

  return v_profile;
end;
$$;

create or replace function app.ensure_aac_profile(
  p_student_id uuid,
  p_started_at date default null
)
returns public.aac_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_profile public.aac_profiles;
  v_start date;
  i integer;
begin
  if not app.can_access_student(p_student_id) and auth.role() <> 'service_role' then
    raise exception 'Accès refusé';
  end if;

  select organization_id into v_org
  from public.students
  where id = p_student_id;

  if v_org is null then
    raise exception 'Élève introuvable';
  end if;

  select * into v_profile
  from public.aac_profiles
  where student_id = p_student_id;

  v_start := p_started_at;

  if v_profile.id is null then
    insert into public.aac_profiles (
      organization_id,
      student_id,
      started_at,
      planned_end_at,
      exam_eligible_at
    ) values (
      v_org,
      p_student_id,
      v_start,
      app.aac_add_one_year(v_start),
      app.aac_add_one_year(v_start)
    )
    returning * into v_profile;

    for i in 1..3 loop
      insert into public.aac_rvp (organization_id, student_id, sequence)
      values (v_org, p_student_id, i)
      on conflict (student_id, sequence) do nothing;
    end loop;
  elsif v_start is not null and (v_profile.started_at is distinct from v_start) then
    update public.aac_profiles
    set
      started_at = v_start,
      planned_end_at = app.aac_add_one_year(v_start),
      exam_eligible_at = app.aac_add_one_year(v_start),
      updated_at = now()
    where id = v_profile.id
    returning * into v_profile;
  end if;

  -- Garantir les 3 RVP
  for i in 1..3 loop
    insert into public.aac_rvp (organization_id, student_id, sequence)
    values (v_org, p_student_id, i)
    on conflict (student_id, sequence) do nothing;
  end loop;

  return app.refresh_aac_profile_stats(p_student_id);
end;
$$;

create or replace function public.ensure_aac_profile(
  p_student_id uuid,
  p_started_at date default null
)
returns public.aac_profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  return app.ensure_aac_profile(p_student_id, p_started_at);
end;
$$;

grant execute on function public.ensure_aac_profile(uuid, date) to authenticated, service_role;

create or replace function public.refresh_aac_profile_stats(p_student_id uuid)
returns public.aac_profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app.can_access_student(p_student_id) and auth.role() <> 'service_role' then
    raise exception 'Accès refusé';
  end if;
  return app.refresh_aac_profile_stats(p_student_id);
end;
$$;

grant execute on function public.refresh_aac_profile_stats(uuid) to authenticated, service_role;

create or replace function app.link_aac_ffi(
  p_student_id uuid,
  p_document_id uuid,
  p_storage_path text
)
returns public.aac_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.aac_profiles;
begin
  if not app.can_access_student(p_student_id) then
    raise exception 'Accès refusé';
  end if;

  perform app.ensure_aac_profile(p_student_id, null);

  update public.aac_profiles
  set
    ffi_document_id = p_document_id,
    ffi_storage_path = p_storage_path,
    updated_at = now()
  where student_id = p_student_id
  returning * into v_profile;

  return v_profile;
end;
$$;

create or replace function public.link_aac_ffi(
  p_student_id uuid,
  p_document_id uuid,
  p_storage_path text
)
returns public.aac_profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  return app.link_aac_ffi(p_student_id, p_document_id, p_storage_path);
end;
$$;

grant execute on function public.link_aac_ffi(uuid, uuid, text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.aac_profiles enable row level security;
alter table public.aac_trips enable row level security;
alter table public.aac_trip_points enable row level security;
alter table public.aac_rvp enable row level security;

drop policy if exists aac_profiles_select on public.aac_profiles;
create policy aac_profiles_select on public.aac_profiles
  for select using (app.can_access_student(student_id));

drop policy if exists aac_profiles_write_staff on public.aac_profiles;
create policy aac_profiles_write_staff on public.aac_profiles
  for all using (
    app.can_access_student(student_id)
    and app.current_role() in ('manager', 'secretary', 'teacher')
  )
  with check (
    app.can_access_student(student_id)
    and app.current_role() in ('manager', 'secretary', 'teacher')
  );

drop policy if exists aac_trips_select on public.aac_trips;
create policy aac_trips_select on public.aac_trips
  for select using (app.can_access_student(student_id));

drop policy if exists aac_trips_insert_student on public.aac_trips;
create policy aac_trips_insert_student on public.aac_trips
  for insert with check (
    app.can_access_student(student_id)
    and (
      app.current_role() = 'student'
      or app.current_role() in ('manager', 'secretary', 'teacher')
    )
  );

drop policy if exists aac_trips_update on public.aac_trips;
create policy aac_trips_update on public.aac_trips
  for update using (app.can_access_student(student_id))
  with check (app.can_access_student(student_id));

drop policy if exists aac_trip_points_select on public.aac_trip_points;
create policy aac_trip_points_select on public.aac_trip_points
  for select using (
    exists (
      select 1 from public.aac_trips t
      where t.id = trip_id and app.can_access_student(t.student_id)
    )
  );

drop policy if exists aac_trip_points_insert on public.aac_trip_points;
create policy aac_trip_points_insert on public.aac_trip_points
  for insert with check (
    exists (
      select 1 from public.aac_trips t
      where t.id = trip_id
        and t.status = 'in_progress'
        and app.can_access_student(t.student_id)
    )
  );

drop policy if exists aac_rvp_select on public.aac_rvp;
create policy aac_rvp_select on public.aac_rvp
  for select using (app.can_access_student(student_id));

drop policy if exists aac_rvp_write_staff on public.aac_rvp;
create policy aac_rvp_write_staff on public.aac_rvp
  for all using (
    app.can_access_student(student_id)
    and app.current_role() in ('manager', 'secretary', 'teacher')
  )
  with check (
    app.can_access_student(student_id)
    and app.current_role() in ('manager', 'secretary', 'teacher')
  );

-- -----------------------------------------------------------------------------
-- Rappels AAC
-- -----------------------------------------------------------------------------

insert into public.automated_reminder_kinds (code, label, description, notify_roles, schedule_note)
values
  (
    'aac_rvp_due',
    'AAC — RVP à planifier',
    'Rappel lorsqu’un rendez-vous pédagogique AAC approche ou manque.',
    array['secretary', 'student']::text[],
    'Hebdomadaire (scan profils AAC)'
  ),
  (
    'aac_km_near',
    'AAC — 3000 km bientôt atteints',
    'Rappel lorsque l’élève approche des 3000 km réglementaires.',
    array['secretary', 'student']::text[],
    'Hebdomadaire si ≥ 2700 km'
  ),
  (
    'aac_year_near',
    'AAC — année bientôt terminée',
    'Rappel dans les 30 jours avant la date d’éligibilité examen (1 an).',
    array['secretary', 'student']::text[],
    'Hebdomadaire si ≤ 30 j'
  ),
  (
    'aac_ready',
    'AAC — conditions remplies',
    'Notification unique lorsque toutes les conditions AAC sont réunies.',
    array['secretary', 'student', 'teacher']::text[],
    'Unique'
  )
on conflict (code) do update set
  label = excluded.label,
  description = excluded.description,
  notify_roles = excluded.notify_roles,
  schedule_note = excluded.schedule_note;

create or replace function app.notify_aac_roles(
  p_org_id uuid,
  p_student_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_roles text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_profile uuid;
begin
  select profile_id into v_student_profile
  from public.students
  where id = p_student_id;

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
    'automated_reminder',
    p_title,
    p_body,
    p_student_id,
    p_kind,
    false
  from public.profiles p
  where p.organization_id = p_org_id
    and coalesce(p.is_active, true) = true
    and (
      (p.role::text = any (p_roles) and p.role::text <> 'student')
      or (p.id = v_student_profile and 'student' = any (p_roles))
    );
end;
$$;

create or replace function app.send_aac_reminder_once(
  p_org_id uuid,
  p_student_id uuid,
  p_kind text,
  p_week_key text,
  p_title text,
  p_body text,
  p_roles text[]
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.automated_reminder_sent_log l
    where l.student_id = p_student_id
      and l.reminder_kind = p_kind
      and l.week_key = p_week_key
  ) then
    return false;
  end if;

  if not exists (
    select 1 from public.automated_reminder_kinds k
    where k.code = p_kind and k.is_active = true
  ) then
    return false;
  end if;

  perform app.notify_aac_roles(p_org_id, p_student_id, p_kind, p_title, p_body, p_roles);

  insert into public.automated_reminder_sent_log (
    organization_id,
    student_id,
    reminder_kind,
    week_key
  ) values (
    p_org_id,
    p_student_id,
    p_kind,
    p_week_key
  );

  return true;
end;
$$;

create or replace function app.run_aac_reminders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_key text := app.current_paris_week_key(now());
  v_sent integer := 0;
  v_row record;
  v_rvp_done integer;
  v_days_to_eligible integer;
  v_name text;
begin
  for v_row in
    select
      ap.*,
      s.first_name,
      s.last_name,
      s.birth_date,
      s.profile_id as student_profile_id
    from public.aac_profiles ap
    inner join public.students s on s.id = ap.student_id
    where ap.status in ('en_cours', 'conditions_remplies')
      and ap.started_at is not null
  loop
    v_name := trim(coalesce(v_row.first_name, '') || ' ' || coalesce(v_row.last_name, ''));

    select count(*)::integer into v_rvp_done
    from public.aac_rvp
    where student_id = v_row.student_id and completed = true;

    -- RVP manquants proches des jalons km
    if v_rvp_done < 3 and (
      (v_row.km_total >= 900 and v_rvp_done < 1)
      or (v_row.km_total >= 1800 and v_rvp_done < 2)
      or (v_row.km_total >= 2700 and v_rvp_done < 3)
      or (v_row.exam_eligible_at is not null and v_row.exam_eligible_at - current_date <= 30)
    ) then
      if app.send_aac_reminder_once(
        v_row.organization_id,
        v_row.student_id,
        'aac_rvp_due',
        v_week_key,
        '📅 RVP AAC à planifier',
        format('L’élève %s a %s/3 RVP effectués (%s km). Planifiez le prochain rendez-vous pédagogique.', v_name, v_rvp_done, round(v_row.km_total)::text),
        array['secretary', 'student']::text[]
      ) then
        v_sent := v_sent + 1;
      end if;
    end if;

    -- Approche 3000 km
    if v_row.km_total >= 2700 and v_row.km_total < 3000 then
      if app.send_aac_reminder_once(
        v_row.organization_id,
        v_row.student_id,
        'aac_km_near',
        v_week_key,
        '🚗 AAC — objectif 3000 km proche',
        format('%s a parcouru %s km. Il reste %s km avant l’objectif réglementaire.', v_name, round(v_row.km_total)::text, greatest(0, round(3000 - v_row.km_total))::text),
        array['secretary', 'student']::text[]
      ) then
        v_sent := v_sent + 1;
      end if;
    end if;

    -- Année bientôt terminée
    if v_row.exam_eligible_at is not null then
      v_days_to_eligible := (v_row.exam_eligible_at - current_date);
      if v_days_to_eligible >= 0 and v_days_to_eligible <= 30 then
        if app.send_aac_reminder_once(
          v_row.organization_id,
          v_row.student_id,
          'aac_year_near',
          v_week_key,
          '🗓️ AAC — année bientôt terminée',
          format('L’année de conduite accompagnée de %s se termine dans %s jour(s) (éligibilité examen le %s).', v_name, v_days_to_eligible::text, to_char(v_row.exam_eligible_at, 'DD/MM/YYYY')),
          array['secretary', 'student']::text[]
        ) then
          v_sent := v_sent + 1;
        end if;
      end if;
    end if;

    -- Conditions remplies (clé unique, pas hebdo)
    if v_row.status = 'conditions_remplies' then
      if app.send_aac_reminder_once(
        v_row.organization_id,
        v_row.student_id,
        'aac_ready',
        'once',
        '✅ AAC — conditions remplies',
        format('%s remplit toutes les conditions AAC et peut être présenté(e) à l’examen du permis.', v_name),
        array['secretary', 'student', 'teacher']::text[]
      ) then
        v_sent := v_sent + 1;
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'sent', v_sent,
    'week_key', v_week_key,
    'kinds_processed', jsonb_build_array('aac_rvp_due', 'aac_km_near', 'aac_year_near', 'aac_ready')
  );
end;
$$;

create or replace function app.run_automated_reminders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_key text := app.current_paris_week_key(now());
  v_sent integer := 0;
  v_row record;
  v_aac jsonb;
begin
  for v_row in
    select sar.organization_id, sar.student_id
    from public.student_automated_reminders sar
    inner join public.automated_reminder_kinds k on k.code = sar.reminder_kind
    where sar.reminder_kind = 'code_missing'
      and sar.is_active = true
      and k.is_active = true
      and app.student_needs_code_reminder(sar.student_id)
  loop
    if app.send_code_missing_reminder(v_row.organization_id, v_row.student_id, v_week_key) then
      v_sent := v_sent + 1;
    end if;
  end loop;

  v_aac := app.run_aac_reminders();

  return jsonb_build_object(
    'sent', v_sent + coalesce((v_aac->>'sent')::integer, 0),
    'week_key', v_week_key,
    'kinds_processed', jsonb_build_array('code_missing') || coalesce(v_aac->'kinds_processed', '[]'::jsonb),
    'aac', v_aac
  );
end;
$$;

comment on table public.aac_profiles is 'Profil AAC par élève (dates, km, statut, FFI).';
comment on table public.aac_trips is 'Trajets GPS de conduite accompagnée.';
comment on table public.aac_trip_points is 'Points GPS bruts d’un trajet (évolutif : validation auto).';
comment on table public.aac_rvp is 'Rendez-vous pédagogiques obligatoires AAC (1 à 3).';

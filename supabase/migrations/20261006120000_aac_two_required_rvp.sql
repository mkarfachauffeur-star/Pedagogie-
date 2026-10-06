-- AAC : 2 rendez-vous pédagogiques obligatoires (Service-Public F2826).
-- Un rendez-vous supplémentaire peut être ajouté (enseignant, élève ou accompagnateur).

alter table public.aac_rvp
  add column if not exists is_additional boolean not null default false;

do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'aac_rvp'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%sequence%'
  loop
    execute format('alter table public.aac_rvp drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.aac_rvp
  drop constraint if exists aac_rvp_sequence_check;

alter table public.aac_rvp
  add constraint aac_rvp_sequence_check check (sequence between 1 and 20);

-- Les créneaux vides au-delà de 2 étaient générés automatiquement : on les retire.
-- Un rendez-vous déjà renseigné est conservé comme rendez-vous supplémentaire.
update public.aac_rvp
set
  is_additional = true,
  observations = nullif(btrim(replace(coalesce(observations, ''), U&'\200B', '')), '')
where sequence > 2
  and (
    completed
    or held_on is not null
    or teacher_id is not null
    or nullif(btrim(coalesce(companion_name, '')), '') is not null
    or nullif(btrim(replace(coalesce(observations, ''), U&'\200B', '')), '') is not null
    or position(U&'\200B' in coalesce(observations, '')) > 0
  );

delete from public.aac_rvp
where sequence > 2
  and is_additional = false;

comment on table public.aac_rvp is 'Rendez-vous pédagogiques AAC : 2 obligatoires, supplémentaires facultatifs.';

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
    and coalesce(p_rvp_completed, 0) >= 2;
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
    and completed = true
    and sequence <= 2;

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

    for i in 1..2 loop
      insert into public.aac_rvp (organization_id, student_id, sequence, is_additional)
      values (v_org, p_student_id, i, false)
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

  for i in 1..2 loop
    insert into public.aac_rvp (organization_id, student_id, sequence, is_additional)
    values (v_org, p_student_id, i, false)
    on conflict (student_id, sequence) do nothing;
  end loop;

  return app.refresh_aac_profile_stats(p_student_id);
end;
$$;

create or replace function public.add_aac_pedagogical_appointment(p_student_id uuid)
returns public.aac_rvp
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_next integer;
  v_row public.aac_rvp;
begin
  if not app.can_access_student(p_student_id) and auth.role() <> 'service_role' then
    raise exception 'Accès refusé';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_student_id::text, 0::bigint));
  perform app.ensure_aac_profile(p_student_id, null);

  select organization_id into v_org
  from public.students
  where id = p_student_id;

  select coalesce(max(sequence), 2) + 1 into v_next
  from public.aac_rvp
  where student_id = p_student_id;

  if v_next < 3 then
    v_next := 3;
  end if;

  if v_next > 20 then
    raise exception 'Impossible d’ajouter un rendez-vous pédagogique supplémentaire.';
  end if;

  insert into public.aac_rvp (organization_id, student_id, sequence, is_additional)
  values (v_org, p_student_id, v_next, true)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.add_aac_pedagogical_appointment(uuid) from public;
grant execute on function public.add_aac_pedagogical_appointment(uuid) to authenticated, service_role;

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
    where student_id = v_row.student_id
      and completed = true
      and sequence <= 2;

    if v_rvp_done < 2 and (
      (v_rvp_done < 1 and (
        v_row.km_total >= 1000
        or current_date >= (v_row.started_at + 120)
      ))
      or v_row.km_total >= 3000
      or (v_row.exam_eligible_at is not null and v_row.exam_eligible_at - current_date <= 30)
    ) then
      if app.send_aac_reminder_once(
        v_row.organization_id,
        v_row.student_id,
        'aac_rvp_due',
        v_week_key,
        '📅 RVP AAC à planifier',
        format('L’élève %s a effectué %s/2 rendez-vous pédagogiques obligatoires (%s km). Planifiez le prochain rendez-vous.', v_name, v_rvp_done, round(v_row.km_total)::text),
        array['secretary', 'student']::text[]
      ) then
        v_sent := v_sent + 1;
      end if;
    end if;

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

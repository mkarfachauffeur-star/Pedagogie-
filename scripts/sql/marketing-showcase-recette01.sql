-- Données fictives marketing pour recette01 (montage vidéo)
-- Exécution : npx supabase db execute --linked -f scripts/sql/marketing-showcase-recette01.sql

do $$
declare
  v_org_id uuid;
  v_charter_id uuid;
  v_manager_id uuid;
  v_teacher_ids uuid[];
  v_student_ids uuid[];
  v_student record;
  v_i int;
  v_slot timestamptz;
begin
  select p.organization_id, p.id
  into v_org_id, v_manager_id
  from public.profiles p
  where p.email = 'recette01.gerant@recette.pedagogia.local'
  limit 1;

  if v_org_id is null then
    raise exception 'Organisation recette01 introuvable';
  end if;

  update public.organizations set
    name = 'Auto-École Horizon Drive — Paris',
    city = 'Paris',
    postal_code = '75011',
    address = '18 rue de la Roquette'
  where id = v_org_id;

  select array_agg(t.profile_id order by t.created_at)
  into v_teacher_ids
  from public.teachers t
  where t.organization_id = v_org_id
  limit 4;

  select array_agg(s.id order by s.created_at)
  into v_student_ids
  from public.students s
  where s.organization_id = v_org_id
  limit 8;

  -- Noms fictifs marketing
  update public.students set first_name = 'Marie', last_name = 'Dupont', package_name = 'Forfait 20h · Permis B', status = 'En formation', code_status = 'En cours'
  where id = v_student_ids[1];
  update public.students set first_name = 'Lucas', last_name = 'Martin', package_name = 'Forfait 30h · Permis B', status = 'En formation', code_status = 'Obtenu'
  where id = v_student_ids[2];
  update public.students set first_name = 'Emma', last_name = 'Bernard', package_name = 'Forfait AAC · Permis B', status = 'En formation'
  where id = v_student_ids[3];
  update public.students set first_name = 'Hugo', last_name = 'Petit', package_name = 'Forfait 20h · Permis B', status = 'En formation'
  where id = v_student_ids[4];

  update public.profiles p set full_name = s.first_name || ' ' || s.last_name
  from public.students s
  where s.profile_id = p.id and s.organization_id = v_org_id and s.id = any(v_student_ids[1:4]);

  -- Chartes acceptées pour tous les élèves
  select v.id into v_charter_id
  from public.student_engagement_charter_versions v
  where v.organization_id = v_org_id and v.is_active = true
  limit 1;

  if v_charter_id is not null then
    insert into public.student_charter_acceptances (organization_id, student_id, charter_version_id, accepted_at)
    select v_org_id, s.id, v_charter_id, now()
    from public.students s
    where s.organization_id = v_org_id
    on conflict (student_id, charter_version_id) do nothing;
  end if;

  -- Planning semaine en cours
  delete from public.appointments where organization_id = v_org_id;

  for v_i in 0..13 loop
    v_slot := date_trunc('day', now()) + ((v_i / 3) - 2) * interval '1 day' + ((8 + (v_i % 3) * 3) * interval '1 hour');
    insert into public.appointments (
      organization_id, student_id, teacher_id, kind, starts_at, duration_minutes, status, notes
    ) values (
      v_org_id,
      v_student_ids[1 + (v_i % least(array_length(v_student_ids, 1), 6))],
      v_teacher_ids[1 + (v_i % array_length(v_teacher_ids, 1))],
      'Leçon',
      v_slot,
      60,
      case when v_i % 4 = 0 then 'Terminé' when v_i % 3 = 0 then 'Confirmé' else 'Planifié' end,
      case v_i % 5
        when 0 then 'Leçon Marie Dupont — priorités et intersections'
        when 1 then 'Leçon Lucas Martin — voie rapide'
        when 2 then 'Leçon Emma Bernard — ronds-points'
        when 3 then 'Leçon Hugo Petit — stationnement'
        else 'Évaluation intermédiaire REMC'
      end
    );
  end loop;

  -- Observations de leçon partagées avec commentaires moniteur
  for v_i in 1..least(array_length(v_student_ids, 1), 6) loop
    delete from public.student_lesson_observations where student_id = v_student_ids[v_i];

    insert into public.student_lesson_observations (
      organization_id, student_id, teacher_id, lesson_date, lesson_time, duration, status,
      observations, skills, shared_with_student, opened_by, closed_by, closed_at
    ) values
    (
      v_org_id, v_student_ids[v_i], v_teacher_ids[1 + ((v_i - 1) % array_length(v_teacher_ids, 1))],
      (current_date - v_i), '10:00', '1h', 'Terminé',
      'Excellente séance en agglomération. Priorités bien respectées, créneaux en net progrès. Poursuivre les ronds-points la semaine prochaine.',
      array['C1.1', 'C1.2'], true, 'Thomas Garcia', 'Thomas Garcia', now()
    ),
    (
      v_org_id, v_student_ids[v_i], v_teacher_ids[1 + ((v_i - 1) % array_length(v_teacher_ids, 1))],
      (current_date - v_i - 3), '14:30', '1h30', 'Terminé',
      'Travail sur voie rapide : insertions et dépassements maîtrisés. Score QCM signalisation 88 %. Élève motivé et à l''écoute.',
      array['C2.1', 'C2.3'], true, 'Thomas Garcia', 'Thomas Garcia', now()
    );
  end loop;

  -- Compétences REMC validées
  for v_i in 1..4 loop
    insert into public.student_competency_validations (organization_id, student_id, validated_by, competency_code, validated_at)
    values (v_org_id, v_student_ids[1], v_teacher_ids[1], 'C' || v_i, now() - v_i * interval '2 days')
    on conflict (student_id, competency_code) do update set validated_at = excluded.validated_at;
  end loop;

  for v_i in 1..2 loop
    insert into public.student_competency_validations (organization_id, student_id, validated_by, competency_code, validated_at)
    values (v_org_id, v_student_ids[2], v_teacher_ids[1], 'C' || v_i, now())
    on conflict (student_id, competency_code) do nothing;
  end loop;

  raise notice 'Marketing showcase OK pour org %', v_org_id;
end $$;

-- Évaluations de départ — Auto-École Horizon Drive
-- 5 élèves complétées, Nathan Durand (eleve06) laissé « À réaliser »
-- Exécution : npx supabase db query --linked -f scripts/sql/horizon-initial-assessments.sql

do $$
declare
  v_org_id uuid;
  v_teacher_id uuid;
  v_pending_id uuid;
  v_student record;
  v_answers jsonb;
  v_comment text;
begin
  select p.organization_id into v_org_id
  from public.profiles p
  where p.email = 'horizon.gerant@demo.pedagogia.local'
  limit 1;

  if v_org_id is null then
    raise exception 'Auto-École Horizon Drive introuvable — lancez seed-video-demo-org.mjs';
  end if;

  select t.profile_id into v_teacher_id
  from public.teachers t
  join public.profiles p on p.id = t.profile_id
  where p.email = 'horizon.enseignant1@demo.pedagogia.local'
  limit 1;

  select s.id into v_pending_id
  from public.students s
  where s.organization_id = v_org_id
    and s.email = 'horizon.eleve06@demo.pedagogia.local'
  limit 1;

  v_answers := jsonb_build_object(
    'exp_driven_before', 'Quelques fois',
    'exp_context', 'Auto-école',
    'exp_hours', '1 à 5 h',
    'exp_previous_license', 'Aucun',
    'veh_clutch', 'Oui',
    'veh_gearbox', 'Oui',
    'veh_pedals', 'Oui',
    'veh_seat_mirrors', 'Partiellement',
    'veh_rating_global', 'S',
    'att_why_license', 'Vie personnelle',
    'att_motivation', 'Très motivé',
    'att_code_autonomy', 'Oui',
    'att_rating_implication', 'B',
    'skill_installation', 'S',
    'skill_steering', 'B',
    'skill_coordination', 'S',
    'skill_start', 'S',
    'und_retain', 'Moyenne',
    'und_multitask', 'Moyennement',
    'und_rating_learning', 'S',
    'per_gaze', 'S',
    'per_observation', 'B',
    'per_anticipation', 'S',
    'per_orientation', 'S',
    'per_trajectory', 'S',
    'emo_stress_self', 'Un peu',
    'emo_stress_mgmt', 'B',
    'emo_tension', 'S',
    'emo_concentration', 'B'
  );

  for v_student in
    select s.id, s.first_name, s.last_name
    from public.students s
    where s.organization_id = v_org_id
      and s.id is distinct from v_pending_id
    order by s.created_at
  loop
    v_comment := format(
      'Évaluation de départ réalisée le %s. %s %s présente un profil intermédiaire : bonne motivation, bases du véhicule acquises. Volume horaire recommandé : 25 h.',
      to_char(now() - interval '10 days', 'DD/MM/YYYY'),
      v_student.first_name,
      v_student.last_name
    );

    update public.student_initial_assessments
    set
      status = 'completed',
      answers = v_answers || jsonb_build_object('teacher_comment', v_comment),
      positive_score = 48,
      negative_score = 8,
      final_score = 58,
      result_level = 'intermediaire',
      recommended_hours_min = 25,
      recommended_hours_max = 25,
      recommended_hours_response = 'accepted',
      recommended_hours_responded_at = now() - interval '9 days',
      completed_at = now() - interval '10 days',
      completed_by = v_teacher_id,
      updated_at = now()
    where student_id = v_student.id
      and organization_id = v_org_id;
  end loop;

  if v_pending_id is not null then
    update public.student_initial_assessments
    set
      status = 'pending',
      answers = '{}'::jsonb,
      positive_score = 0,
      negative_score = 0,
      final_score = 0,
      result_level = null,
      recommended_hours_min = null,
      recommended_hours_max = null,
      recommended_hours_response = 'pending',
      recommended_hours_responded_at = null,
      completed_at = null,
      completed_by = null,
      updated_at = now()
    where student_id = v_pending_id
      and organization_id = v_org_id;
  end if;

  raise notice 'Évaluations de départ : 5 complétées, 1 à réaliser (Nathan Durand).';
end $$;

-- Profils pédagogiques élargis pour l'évaluation de départ
alter table public.student_initial_assessments
  drop constraint if exists student_initial_assessments_result_level_check;

alter table public.student_initial_assessments
  add constraint student_initial_assessments_result_level_check
  check (
    result_level is null
    or result_level in (
      'debutant', 'intermediaire', 'avance',
      'faible', 'moyen', 'bon', 'excellent'
    )
  );

-- Compter toutes les leçons enregistrées (durée saisie à l'ouverture).
-- Rétroactif : clôturer les leçons ouvertes sans clôture manuelle.
update public.student_lesson_observations
set
  status = 'Terminé',
  closed_by = coalesce(nullif(trim(closed_by), ''), opened_by),
  closed_at = coalesce(closed_at, opened_at, now())
where status in ('Débuté', 'En cours')
  and closed_at is null;

create or replace function public.student_completed_lesson_hours(p_student_id uuid)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_hours numeric := 0;
  v_row record;
  v_norm text;
begin
  if not app.can_access_student(p_student_id) then
    return 0;
  end if;

  for v_row in
    select duration
    from public.student_lesson_observations
    where student_id = p_student_id
      and coalesce(status, '') not in ('Annulé', 'Annule')
  loop
    v_norm := upper(replace(trim(coalesce(v_row.duration, '')), ' ', ''));
    v_hours := v_hours + case
      when v_norm = '45MIN' then 0.75
      when v_norm in ('1H', '1') then 1
      when v_norm in ('2H', '2') then 2
      else 0
    end;
  end loop;

  return v_hours;
end;
$$;

grant execute on function public.student_completed_lesson_hours(uuid) to authenticated;

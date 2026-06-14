-- Réponse élève à la proposition horaire (évaluation de départ)
alter table public.student_initial_assessments
  add column if not exists recommended_hours_response text
    check (recommended_hours_response is null or recommended_hours_response in ('pending', 'accepted', 'declined'))
    default 'pending',
  add column if not exists recommended_hours_responded_at timestamptz;

update public.student_initial_assessments
set recommended_hours_response = 'pending'
where recommended_hours_response is null;

create or replace function app.student_respond_recommended_hours(
  p_assessment_id uuid,
  p_response text
)
returns public.student_initial_assessments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.student_initial_assessments;
begin
  if p_response not in ('accepted', 'declined') then
    raise exception 'Réponse invalide';
  end if;

  select * into v_row
  from public.student_initial_assessments
  where id = p_assessment_id
    and status = 'completed';

  if not found then
    raise exception 'Évaluation introuvable ou non finalisée';
  end if;

  if not exists (
    select 1
    from public.students s
    where s.id = v_row.student_id
      and s.profile_id = auth.uid()
  ) then
    raise exception 'Accès refusé';
  end if;

  update public.student_initial_assessments
  set
    recommended_hours_response = p_response,
    recommended_hours_responded_at = now(),
    updated_at = now()
  where id = p_assessment_id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.student_respond_recommended_hours(
  p_assessment_id uuid,
  p_response text
)
returns public.student_initial_assessments
language sql
security definer
set search_path = public
as $$
  select app.student_respond_recommended_hours(p_assessment_id, p_response);
$$;

grant execute on function public.student_respond_recommended_hours(uuid, text) to authenticated;

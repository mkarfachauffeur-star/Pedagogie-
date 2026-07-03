-- Renforce is_teacher_of_student avec filtre organisation
create or replace function app.is_teacher_of_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.student_assignments sa
    join public.students s on s.id = sa.student_id
    where sa.teacher_id = auth.uid()
      and sa.student_id = p_student_id
      and s.organization_id = app.current_org_id()
  )
$$;

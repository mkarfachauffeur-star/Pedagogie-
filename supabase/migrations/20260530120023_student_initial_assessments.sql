-- Évaluation de départ Permis B (historisée, créée à l'inscription)
create table if not exists public.student_initial_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed')),
  answers jsonb not null default '{}'::jsonb,
  positive_score int not null default 0,
  negative_score int not null default 0,
  final_score int not null default 0,
  result_level text check (result_level is null or result_level in ('faible', 'moyen', 'bon', 'excellent')),
  recommended_hours_min int,
  recommended_hours_max int,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id)
);

create index if not exists idx_initial_assessments_student
  on public.student_initial_assessments (student_id);

create index if not exists idx_initial_assessments_org
  on public.student_initial_assessments (organization_id, status);

alter table public.student_initial_assessments enable row level security;

drop policy if exists initial_assessments_select on public.student_initial_assessments;
create policy initial_assessments_select on public.student_initial_assessments
  for select using (
    organization_id = app.current_org_id()
    and (
      app.is_admin_staff()
      or app.is_teacher_of_student(student_id)
      or student_id in (select id from public.students where profile_id = auth.uid())
    )
  );

drop policy if exists initial_assessments_write on public.student_initial_assessments;
create policy initial_assessments_write on public.student_initial_assessments
  for all using (
    organization_id = app.current_org_id()
    and (app.is_admin_staff() or app.is_teacher_of_student(student_id))
    and app.can_write_org()
  )
  with check (
    organization_id = app.current_org_id()
    and (app.is_admin_staff() or app.is_teacher_of_student(student_id))
    and app.can_write_org()
  );

create or replace function app.is_perm_b_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select lower(coalesce(s.license_category, 'permis b')) like '%permis b%'
      from public.students s
      where s.id = p_student_id
    ),
    false
  );
$$;

create or replace function app.create_initial_assessment_for_student()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.license_category, 'permis b')) like '%permis b%' then
    insert into public.student_initial_assessments (organization_id, student_id)
    values (new.organization_id, new.id)
    on conflict (student_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_students_initial_assessment on public.students;
create trigger trg_students_initial_assessment
  after insert on public.students
  for each row
  execute function app.create_initial_assessment_for_student();

insert into public.student_initial_assessments (organization_id, student_id)
select s.organization_id, s.id
from public.students s
where lower(coalesce(s.license_category, 'permis b')) like '%permis b%'
on conflict (student_id) do nothing;

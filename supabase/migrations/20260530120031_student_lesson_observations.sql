-- Observations de leçon — visibilité staff vs élève (partagé)
create table if not exists public.student_lesson_observations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  lesson_date date,
  lesson_time text,
  duration text not null default '2H',
  status text not null default 'Débuté',
  observations text not null default '',
  skills text[] not null default '{}',
  shared_with_student boolean not null default false,
  opened_by text not null default '',
  closed_by text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_student_lesson_observations_student
  on public.student_lesson_observations (student_id, opened_at desc);

alter table public.student_lesson_observations enable row level security;

drop policy if exists student_lesson_observations_select on public.student_lesson_observations;
create policy student_lesson_observations_select on public.student_lesson_observations
  for select using (
    organization_id = app.current_org_id()
    and (
      app.is_admin_staff()
      or app.is_teacher_of_student(student_id)
      or (
        shared_with_student = true
        and exists (
          select 1 from public.students s
          where s.id = student_id and s.profile_id = auth.uid()
        )
      )
    )
  );

drop policy if exists student_lesson_observations_write on public.student_lesson_observations;
create policy student_lesson_observations_write on public.student_lesson_observations
  for all
  using (
    organization_id = app.current_org_id()
    and app.can_write_org()
    and (app.is_admin_staff() or app.is_teacher_of_student(student_id))
  )
  with check (
    organization_id = app.current_org_id()
    and app.can_write_org()
    and (app.is_admin_staff() or app.is_teacher_of_student(student_id))
  );

-- Examens blancs permis B (grille officielle simplifiée)
create table if not exists public.practice_exams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  exam_date date not null default current_date,
  score_total numeric(4, 1) not null default 0,
  result text not null check (result in ('favorable', 'insuffisant', 'echec')),
  comment text,
  has_eliminatory_error boolean not null default false,
  eliminatory_errors jsonb not null default '[]'::jsonb,
  bonus_courtesy boolean not null default false,
  bonus_eco boolean not null default false,
  pedagogical_report jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.practice_exam_item_scores (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.practice_exams(id) on delete cascade,
  competence_id text not null,
  note text not null,
  unique (exam_id, competence_id)
);

create index if not exists idx_practice_exams_student on public.practice_exams (student_id, exam_date desc);
create index if not exists idx_practice_exams_teacher on public.practice_exams (teacher_id, created_at desc);
create index if not exists idx_practice_exam_item_scores_exam on public.practice_exam_item_scores (exam_id);

alter table public.practice_exams enable row level security;
alter table public.practice_exam_item_scores enable row level security;

drop policy if exists practice_exams_select on public.practice_exams;
create policy practice_exams_select on public.practice_exams
  for select using (
    organization_id = app.current_org_id()
    and (
      app.is_admin_staff()
      or app.is_teacher_of_student(student_id)
      or exists (
        select 1 from public.students s
        where s.id = student_id and s.profile_id = auth.uid()
      )
    )
  );

drop policy if exists practice_exams_write on public.practice_exams;
create policy practice_exams_write on public.practice_exams
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

drop policy if exists practice_exam_item_scores_select on public.practice_exam_item_scores;
create policy practice_exam_item_scores_select on public.practice_exam_item_scores
  for select using (
    exists (
      select 1 from public.practice_exams pe
      where pe.id = exam_id
        and pe.organization_id = app.current_org_id()
        and (
          app.is_admin_staff()
          or app.is_teacher_of_student(pe.student_id)
          or exists (
            select 1 from public.students s
            where s.id = pe.student_id and s.profile_id = auth.uid()
          )
        )
    )
  );

drop policy if exists practice_exam_item_scores_write on public.practice_exam_item_scores;
create policy practice_exam_item_scores_write on public.practice_exam_item_scores
  for all
  using (
    exists (
      select 1 from public.practice_exams pe
      where pe.id = exam_id
        and pe.organization_id = app.current_org_id()
        and app.can_write_org()
        and (app.is_admin_staff() or app.is_teacher_of_student(pe.student_id))
    )
  )
  with check (
    exists (
      select 1 from public.practice_exams pe
      where pe.id = exam_id
        and pe.organization_id = app.current_org_id()
        and app.can_write_org()
        and (app.is_admin_staff() or app.is_teacher_of_student(pe.student_id))
    )
  );

do $$ begin
  alter publication supabase_realtime add table public.practice_exams;
exception when duplicate_object then null;
end $$;

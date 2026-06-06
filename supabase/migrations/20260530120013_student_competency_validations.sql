-- Validations REMC par compétence (C1–C4) — déblocage progressif
create table if not exists public.student_competency_validations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  competency_code text not null check (competency_code in ('C1', 'C2', 'C3', 'C4')),
  validated_at timestamptz not null default now(),
  validated_by uuid references public.profiles(id) on delete set null,
  unique (student_id, competency_code)
);

create index if not exists idx_student_competency_validations_student
  on public.student_competency_validations (student_id);

alter table public.student_competency_validations enable row level security;

drop policy if exists student_competency_validations_select on public.student_competency_validations;
create policy student_competency_validations_select on public.student_competency_validations
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

-- Écriture réservée aux enseignants (affectés) et au staff admin
drop policy if exists student_competency_validations_write on public.student_competency_validations;
create policy student_competency_validations_write on public.student_competency_validations
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

do $$ begin
  alter publication supabase_realtime add table public.student_competency_validations;
exception when duplicate_object then null;
end $$;

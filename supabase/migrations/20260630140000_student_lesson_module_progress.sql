-- Progression cours en ligne (lecture obligatoire + QCU) + notifications enseignants

create table if not exists public.student_lesson_module_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  module_id text not null,
  module_title text,
  course_read_complete boolean not null default false,
  course_read_at timestamptz,
  qcu_score integer,
  qcu_total integer,
  qcu_percentage integer,
  qcu_passed boolean not null default false,
  qcu_validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_lesson_module_progress_unique unique (student_id, module_id),
  constraint student_lesson_module_progress_qcu_score_check
    check (qcu_score is null or qcu_score >= 0),
  constraint student_lesson_module_progress_qcu_total_check
    check (qcu_total is null or qcu_total > 0)
);

create index if not exists idx_student_lesson_module_progress_student
  on public.student_lesson_module_progress (student_id, module_id);

comment on table public.student_lesson_module_progress is
  'Lecture complète des modules pédagogiques et résultats QCU (seuil 80 %).';

alter table public.notifications
  add column if not exists student_id uuid references public.students(id) on delete set null,
  add column if not exists lesson_module_id text;

create or replace function app.notify_teachers_qcu_validated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student record;
  v_when text;
begin
  if not new.qcu_passed or coalesce(old.qcu_passed, false) then
    return new;
  end if;

  select s.id, s.organization_id, s.first_name, s.last_name
  into v_student
  from public.students s
  where s.id = new.student_id;

  if v_student.id is null then
    return new;
  end if;

  v_when := to_char(new.qcu_validated_at at time zone 'Europe/Paris', 'DD/MM/YYYY') || ' à '
    || to_char(new.qcu_validated_at at time zone 'Europe/Paris', 'HH24:MI');

  insert into public.notifications (
    organization_id,
    profile_id,
    notification_type,
    title,
    body,
    student_id,
    lesson_module_id
  )
  select
    v_student.organization_id,
    sa.teacher_id,
    'qcu_validated',
    'QCU validé — ' || coalesce(new.module_id, 'Module'),
    trim(coalesce(v_student.first_name, '') || ' ' || coalesce(v_student.last_name, ''))
      || ' · ' || new.qcu_score || '/' || new.qcu_total
      || ' (' || new.qcu_percentage || '%) · ' || v_when,
    new.student_id,
    new.module_id
  from public.student_assignments sa
  where sa.student_id = new.student_id;

  return new;
end;
$$;

drop trigger if exists trg_notify_teachers_qcu_validated on public.student_lesson_module_progress;
create trigger trg_notify_teachers_qcu_validated
  after insert or update on public.student_lesson_module_progress
  for each row
  execute function app.notify_teachers_qcu_validated();

create or replace function app.save_student_lesson_module_progress(
  p_module_id text,
  p_module_title text default null,
  p_mark_course_read boolean default false,
  p_qcu_score integer default null,
  p_qcu_total integer default null
)
returns public.student_lesson_module_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_org_id uuid;
  v_percentage integer;
  v_passed boolean := false;
  v_row public.student_lesson_module_progress;
begin
  select s.id, s.organization_id
  into v_student_id, v_org_id
  from public.students s
  where s.profile_id = auth.uid()
    and s.organization_id = app.current_org_id();

  if v_student_id is null then
    raise exception 'Élève introuvable ou non autorisé.';
  end if;

  if p_qcu_score is not null and p_qcu_total is not null then
    if p_qcu_total <= 0 or p_qcu_score < 0 or p_qcu_score > p_qcu_total then
      raise exception 'Score QCU invalide.';
    end if;
    v_percentage := round((p_qcu_score::numeric / p_qcu_total::numeric) * 100)::integer;
    v_passed := v_percentage >= 80;
  end if;

  insert into public.student_lesson_module_progress (
    organization_id,
    student_id,
    module_id,
    module_title,
    course_read_complete,
    course_read_at,
    qcu_score,
    qcu_total,
    qcu_percentage,
    qcu_passed,
    qcu_validated_at,
    updated_at
  ) values (
    v_org_id,
    v_student_id,
    p_module_id,
    nullif(btrim(p_module_title), ''),
    coalesce(p_mark_course_read, false),
    case when p_mark_course_read then now() else null end,
    p_qcu_score,
    p_qcu_total,
    v_percentage,
    v_passed,
    case when v_passed then now() else null end,
    now()
  )
  on conflict (student_id, module_id) do update set
    module_title = coalesce(excluded.module_title, student_lesson_module_progress.module_title),
    course_read_complete = student_lesson_module_progress.course_read_complete or excluded.course_read_complete,
    course_read_at = coalesce(student_lesson_module_progress.course_read_at, excluded.course_read_at),
    qcu_score = case
      when excluded.qcu_passed and not student_lesson_module_progress.qcu_passed then excluded.qcu_score
      when student_lesson_module_progress.qcu_passed then student_lesson_module_progress.qcu_score
      else coalesce(excluded.qcu_score, student_lesson_module_progress.qcu_score)
    end,
    qcu_total = case
      when excluded.qcu_passed and not student_lesson_module_progress.qcu_passed then excluded.qcu_total
      when student_lesson_module_progress.qcu_passed then student_lesson_module_progress.qcu_total
      else coalesce(excluded.qcu_total, student_lesson_module_progress.qcu_total)
    end,
    qcu_percentage = case
      when excluded.qcu_passed and not student_lesson_module_progress.qcu_passed then excluded.qcu_percentage
      when student_lesson_module_progress.qcu_passed then student_lesson_module_progress.qcu_percentage
      else coalesce(excluded.qcu_percentage, student_lesson_module_progress.qcu_percentage)
    end,
    qcu_passed = student_lesson_module_progress.qcu_passed or excluded.qcu_passed,
    qcu_validated_at = coalesce(student_lesson_module_progress.qcu_validated_at, excluded.qcu_validated_at),
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function app.save_student_lesson_module_progress(text, text, boolean, integer, integer) from public;
grant execute on function app.save_student_lesson_module_progress(text, text, boolean, integer, integer) to authenticated;

create or replace function public.save_student_lesson_module_progress(
  p_module_id text,
  p_module_title text default null,
  p_mark_course_read boolean default false,
  p_qcu_score integer default null,
  p_qcu_total integer default null
)
returns public.student_lesson_module_progress
language sql
security definer
set search_path = public
as $$
  select app.save_student_lesson_module_progress(
    p_module_id,
    p_module_title,
    p_mark_course_read,
    p_qcu_score,
    p_qcu_total
  );
$$;

grant execute on function public.save_student_lesson_module_progress(text, text, boolean, integer, integer) to authenticated;

alter table public.student_lesson_module_progress enable row level security;

drop policy if exists student_lesson_module_progress_select on public.student_lesson_module_progress;
create policy student_lesson_module_progress_select on public.student_lesson_module_progress
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

drop policy if exists student_lesson_module_progress_insert on public.student_lesson_module_progress;
create policy student_lesson_module_progress_insert on public.student_lesson_module_progress
  for insert with check (
    organization_id = app.current_org_id()
    and exists (
      select 1 from public.students s
      where s.id = student_id and s.profile_id = auth.uid()
    )
  );

drop policy if exists student_lesson_module_progress_update on public.student_lesson_module_progress;
create policy student_lesson_module_progress_update on public.student_lesson_module_progress
  for update using (
    organization_id = app.current_org_id()
    and exists (
      select 1 from public.students s
      where s.id = student_id and s.profile_id = auth.uid()
    )
  ) with check (
    organization_id = app.current_org_id()
    and exists (
      select 1 from public.students s
      where s.id = student_id and s.profile_id = auth.uid()
    )
  );

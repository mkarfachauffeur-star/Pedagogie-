-- Notification automatique à l'élève lors de la planification ou modification d'un examen.

create or replace function app.notify_student_exam_scheduled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_date text;
  v_should_notify boolean := false;
begin
  if tg_op = 'INSERT' then
    v_should_notify := true;
  elsif tg_op = 'UPDATE' then
    v_should_notify := (
      old.exam_date is distinct from new.exam_date
      or old.exam_time is distinct from new.exam_time
      or old.center is distinct from new.center
      or old.status is distinct from new.status
      or old.type is distinct from new.type
    );
  end if;

  if not v_should_notify or new.student_id is null then
    return new;
  end if;

  select s.profile_id into v_profile_id
  from public.students s
  where s.id = new.student_id;

  if v_profile_id is null then
    return new;
  end if;

  v_date := coalesce(to_char(new.exam_date, 'DD/MM/YYYY'), '—');
  if new.exam_time is not null and trim(new.exam_time) <> '' then
    v_date := v_date || ' à ' || trim(new.exam_time);
  end if;

  insert into public.notifications (
    organization_id,
    profile_id,
    notification_type,
    title,
    body,
    student_id,
    resource_id
  ) values (
    new.organization_id,
    v_profile_id,
    'exam_scheduled',
    'Examen planifié — ' || coalesce(new.type, 'Examen'),
    coalesce(new.status, 'À confirmer') || ' · ' || v_date
      || coalesce(' · ' || nullif(trim(new.center), ''), ''),
    new.student_id,
    new.id
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_student_exam on public.exams;
create trigger trg_notify_student_exam
  after insert or update on public.exams
  for each row execute function app.notify_student_exam_scheduled();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'exams'
  ) then
    alter publication supabase_realtime add table public.exams;
  end if;
end $$;

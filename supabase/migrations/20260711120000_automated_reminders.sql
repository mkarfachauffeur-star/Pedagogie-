-- Rappels automatiques extensibles (code de la route, permis, documents, etc.)

create table if not exists public.automated_reminder_kinds (
  code text primary key,
  label text not null,
  description text,
  notify_roles text[] not null default array['secretary']::text[],
  schedule_note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.automated_reminder_kinds (code, label, description, notify_roles, schedule_note)
values (
  'code_missing',
  'Élève sans Code de la route',
  'Rappel hebdomadaire pour les élèves sans code obtenu.',
  array['secretary'],
  'Chaque lundi à 08h00 (Europe/Paris)'
)
on conflict (code) do update set
  label = excluded.label,
  description = excluded.description,
  notify_roles = excluded.notify_roles,
  schedule_note = excluded.schedule_note;

create table if not exists public.student_automated_reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  reminder_kind text not null references public.automated_reminder_kinds(code) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  deactivated_at timestamptz,
  unique (student_id, reminder_kind)
);

create index if not exists idx_student_automated_reminders_active
  on public.student_automated_reminders (reminder_kind, is_active)
  where is_active = true;

create table if not exists public.automated_reminder_sent_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  reminder_kind text not null references public.automated_reminder_kinds(code) on delete cascade,
  week_key text not null,
  sent_at timestamptz not null default now(),
  unique (student_id, reminder_kind, week_key)
);

create index if not exists idx_automated_reminder_sent_log_week
  on public.automated_reminder_sent_log (reminder_kind, week_key desc);

alter table public.notifications
  add column if not exists reminder_kind text;

create index if not exists idx_notifications_reminder_kind
  on public.notifications (profile_id, reminder_kind, is_read);

alter table public.automated_reminder_kinds enable row level security;
alter table public.student_automated_reminders enable row level security;
alter table public.automated_reminder_sent_log enable row level security;

create or replace function app.current_paris_week_key(p_at timestamptz default now())
returns text
language sql
stable
as $$
  select to_char(p_at at time zone 'Europe/Paris', 'IYYY-"W"IW');
$$;

create or replace function app.student_is_active(p_status text)
returns boolean
language sql
immutable
as $$
  select coalesce(nullif(trim(p_status), ''), 'En attente') <> 'Archivé';
$$;

create or replace function app.student_needs_code_reminder(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    where s.id = p_student_id
      and coalesce(s.code_status, 'Non obtenu') <> 'Obtenu'
      and app.student_is_active(s.status)
  );
$$;

create or replace function app.sync_student_automated_reminders()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if app.student_needs_code_reminder(new.id) then
    insert into public.student_automated_reminders (
      organization_id,
      student_id,
      reminder_kind,
      is_active,
      deactivated_at
    ) values (
      new.organization_id,
      new.id,
      'code_missing',
      true,
      null
    )
    on conflict (student_id, reminder_kind) do update set
      organization_id = excluded.organization_id,
      is_active = true,
      deactivated_at = null;
  else
    update public.student_automated_reminders
    set
      is_active = false,
      deactivated_at = coalesce(deactivated_at, now())
    where student_id = new.id
      and reminder_kind = 'code_missing'
      and is_active = true;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_student_automated_reminders on public.students;
create trigger trg_sync_student_automated_reminders
  after insert or update of code_status, status
  on public.students
  for each row
  execute function app.sync_student_automated_reminders();

insert into public.student_automated_reminders (organization_id, student_id, reminder_kind, is_active)
select s.organization_id, s.id, 'code_missing', true
from public.students s
where app.student_needs_code_reminder(s.id)
on conflict (student_id, reminder_kind) do update set
  is_active = true,
  deactivated_at = null;

create or replace function app.send_code_missing_reminder(
  p_org_id uuid,
  p_student_id uuid,
  p_week_key text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student record;
  v_title text := '📋 Élève sans Code de la route';
  v_body text;
begin
  if not app.student_needs_code_reminder(p_student_id) then
    return false;
  end if;

  if exists (
    select 1
    from public.automated_reminder_sent_log l
    where l.student_id = p_student_id
      and l.reminder_kind = 'code_missing'
      and l.week_key = p_week_key
  ) then
    return false;
  end if;

  select s.id, s.first_name, s.last_name
  into v_student
  from public.students s
  where s.id = p_student_id
    and s.organization_id = p_org_id;

  if v_student.id is null then
    return false;
  end if;

  v_body := format(
    'L''élève %s %s n''a toujours pas obtenu son Code de la route. Pensez à faire un suivi.',
    trim(coalesce(v_student.first_name, '')),
    trim(coalesce(v_student.last_name, ''))
  );

  insert into public.notifications (
    organization_id,
    profile_id,
    notification_type,
    title,
    body,
    student_id,
    reminder_kind,
    is_read
  )
  select
    p_org_id,
    p.id,
    'automated_reminder',
    v_title,
    v_body,
    p_student_id,
    'code_missing',
    false
  from public.profiles p
  where p.organization_id = p_org_id
    and p.role = 'secretary'
    and coalesce(p.is_active, true) = true;

  insert into public.automated_reminder_sent_log (
    organization_id,
    student_id,
    reminder_kind,
    week_key
  ) values (
    p_org_id,
    p_student_id,
    'code_missing',
    p_week_key
  );

  return true;
end;
$$;

create or replace function app.run_automated_reminders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_key text := app.current_paris_week_key(now());
  v_sent integer := 0;
  v_row record;
begin
  for v_row in
    select sar.organization_id, sar.student_id
    from public.student_automated_reminders sar
    inner join public.automated_reminder_kinds k on k.code = sar.reminder_kind
    where sar.reminder_kind = 'code_missing'
      and sar.is_active = true
      and k.is_active = true
      and app.student_needs_code_reminder(sar.student_id)
  loop
    if app.send_code_missing_reminder(v_row.organization_id, v_row.student_id, v_week_key) then
      v_sent := v_sent + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'sent', v_sent,
    'week_key', v_week_key,
    'kinds_processed', jsonb_build_array('code_missing')
  );
end;
$$;

create or replace function public.run_automated_reminders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return app.run_automated_reminders();
end;
$$;

revoke all on function app.run_automated_reminders() from public;
revoke all on function public.run_automated_reminders() from public;
grant execute on function public.run_automated_reminders() to authenticated, service_role;

comment on table public.automated_reminder_kinds is
  'Catalogue des types de rappels automatiques (extensible).';
comment on table public.student_automated_reminders is
  'Abonnements actifs par élève et par type de rappel.';
comment on table public.automated_reminder_sent_log is
  'Journal d''envoi pour éviter les doublons (clé semaine ISO Paris).';

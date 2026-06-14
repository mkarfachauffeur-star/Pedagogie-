-- P2 REMC : sous-compétences, critères et historique horodaté
-- Source unique de vérité pour le suivi pédagogique REMC (hors catalogue statique)

-- ─── Progression courante par sous-compétence ───────────────────────────────

create table if not exists public.student_remc_item_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  competency_code text not null check (competency_code in ('C1', 'C2', 'C3', 'C4')),
  item_id text not null,
  status text not null default 'Non commencé'
    check (status in ('Non commencé', 'En cours', 'Validé')),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  unique (student_id, item_id)
);

create index if not exists idx_student_remc_item_progress_student
  on public.student_remc_item_progress (student_id);

create index if not exists idx_student_remc_item_progress_org
  on public.student_remc_item_progress (organization_id);

-- ─── Historique unifié (sous-compétences + validations C1–C4) ─────────────────

create table if not exists public.student_remc_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  record_type text not null check (record_type in ('item', 'competency')),
  competency_code text not null check (competency_code in ('C1', 'C2', 'C3', 'C4')),
  item_id text,
  previous_status text,
  new_status text not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references public.profiles(id) on delete set null,
  change_source text not null default 'manual'
    check (change_source in ('manual', 'migration', 'sync'))
);

create index if not exists idx_student_remc_history_student_changed
  on public.student_remc_history (student_id, changed_at desc);

create index if not exists idx_student_remc_history_org
  on public.student_remc_history (organization_id, changed_at desc);

-- ─── Triggers historique sous-compétences ───────────────────────────────────

create or replace function app.log_remc_item_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.student_remc_history (
      organization_id, student_id, record_type, competency_code, item_id,
      previous_status, new_status, changed_by, change_source
    ) values (
      NEW.organization_id, NEW.student_id, 'item', NEW.competency_code, NEW.item_id,
      null, NEW.status, NEW.updated_by, 'manual'
    );
    return NEW;
  end if;

  if TG_OP = 'UPDATE' and OLD.status is distinct from NEW.status then
    insert into public.student_remc_history (
      organization_id, student_id, record_type, competency_code, item_id,
      previous_status, new_status, changed_by, change_source
    ) values (
      NEW.organization_id, NEW.student_id, 'item', NEW.competency_code, NEW.item_id,
      OLD.status, NEW.status, NEW.updated_by, 'manual'
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_log_remc_item_history on public.student_remc_item_progress;
create trigger trg_log_remc_item_history
  after insert or update on public.student_remc_item_progress
  for each row execute function app.log_remc_item_history();

-- ─── Triggers historique validations C1–C4 ──────────────────────────────────

create or replace function app.log_competency_validation_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.student_remc_history (
      organization_id, student_id, record_type, competency_code, item_id,
      previous_status, new_status, changed_by, change_source
    ) values (
      NEW.organization_id, NEW.student_id, 'competency', NEW.competency_code, null,
      null, 'validated', NEW.validated_by, 'manual'
    );
    return NEW;
  end if;

  if TG_OP = 'DELETE' then
    insert into public.student_remc_history (
      organization_id, student_id, record_type, competency_code, item_id,
      previous_status, new_status, changed_by, change_source
    ) values (
      OLD.organization_id, OLD.student_id, 'competency', OLD.competency_code, null,
      'validated', 'revoked', auth.uid(), 'manual'
    );
    return OLD;
  end if;

  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_log_competency_validation_history on public.student_competency_validations;
create trigger trg_log_competency_validation_history
  after insert or delete on public.student_competency_validations
  for each row execute function app.log_competency_validation_history();

-- ─── RLS ────────────────────────────────────────────────────────────────────

alter table public.student_remc_item_progress enable row level security;
alter table public.student_remc_history enable row level security;

drop policy if exists student_remc_item_progress_select on public.student_remc_item_progress;
create policy student_remc_item_progress_select on public.student_remc_item_progress
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

drop policy if exists student_remc_item_progress_write on public.student_remc_item_progress;
create policy student_remc_item_progress_write on public.student_remc_item_progress
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

drop policy if exists student_remc_history_select on public.student_remc_history;
create policy student_remc_history_select on public.student_remc_history
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

-- Historique en lecture seule côté client (écriture via triggers)
drop policy if exists student_remc_history_insert on public.student_remc_history;
create policy student_remc_history_insert on public.student_remc_history
  for insert
  with check (false);

-- ─── Realtime ───────────────────────────────────────────────────────────────

do $$ begin
  alter publication supabase_realtime add table public.student_remc_item_progress;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.student_remc_history;
exception when duplicate_object then null;
end $$;

-- ─── Statistiques agrégées (organisation / enseignant / élève) ──────────────

create or replace function public.get_remc_student_stats(p_student_id uuid)
returns jsonb
language sql
stable
security invoker
as $$
  with items as (
    select
      competency_code,
      count(*) filter (where status = 'Validé') as validated,
      count(*) as total
    from public.student_remc_item_progress
    where student_id = p_student_id
    group by competency_code
  ),
  competencies as (
    select competency_code
    from public.student_competency_validations
    where student_id = p_student_id
  ),
  history_count as (
    select count(*) as total
    from public.student_remc_history
    where student_id = p_student_id
  )
  select jsonb_build_object(
    'student_id', p_student_id,
    'competencies_validated', (select count(*) from competencies),
    'items_by_competency', coalesce(
      (select jsonb_object_agg(competency_code, jsonb_build_object('validated', validated, 'total', total))
       from items),
      '{}'::jsonb
    ),
    'history_events', (select total from history_count)
  );
$$;

create or replace function public.get_remc_organization_stats(p_organization_id uuid)
returns jsonb
language sql
stable
security invoker
as $$
  with org_students as (
    select id from public.students where organization_id = p_organization_id
  ),
  item_totals as (
    select
      count(*) filter (where p.status = 'Validé') as items_validated,
      count(*) as items_tracked
    from public.student_remc_item_progress p
    where p.organization_id = p_organization_id
  ),
  competency_totals as (
    select count(*) as competencies_validated
    from public.student_competency_validations v
    where v.organization_id = p_organization_id
  )
  select jsonb_build_object(
    'organization_id', p_organization_id,
    'student_count', (select count(*) from org_students),
    'items_validated', (select items_validated from item_totals),
    'items_tracked', (select items_tracked from item_totals),
    'competencies_validated', (select competencies_validated from competency_totals)
  );
$$;

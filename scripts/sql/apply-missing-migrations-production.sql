-- =============================================================================
-- PEDAGOGIA DRIVE — Appliquer les 2 migrations manquantes (production)
-- Projet : watdeahravfccjdoseaf
--
-- SQL Editor Supabase : New query → coller → Run
-- Puis : npm run verify:post-migrations && npm run audit:production
--
-- Fichiers individuels :
--   scripts/sql/20260530120033_assessment_hours_response.sql
--   scripts/sql/20260612120000_commercial_readiness.sql
-- =============================================================================

-- ─── MIGRATION 33 ───
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

-- ─── MIGRATION 20260612 ───
do $$ begin
  create type public.contract_status as enum ('draft', 'sent', 'signed', 'cancelled');
exception when duplicate_object then null; end $$;

alter table public.contracts
  add column if not exists status public.contract_status not null default 'draft';

update public.contracts
set status = 'signed'
where signed_at is not null
  and status = 'draft';

alter table public.payments
  add column if not exists receipt_number text,
  add column if not exists payment_reference text;

create sequence if not exists public.payment_receipt_seq start 1;

create or replace function app.generate_payment_receipt_number()
returns text
language plpgsql
as $$
declare
  v_seq bigint;
begin
  v_seq := nextval('public.payment_receipt_seq');
  return 'REC-' || to_char(timezone('utc', now()), 'YYYYMMDD') || '-' || lpad(v_seq::text, 5, '0');
end;
$$;

create or replace function app.set_payment_receipt_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.receipt_number is null or btrim(new.receipt_number) = '' then
    new.receipt_number := app.generate_payment_receipt_number();
  end if;
  if new.payment_reference is null or btrim(new.payment_reference) = '' then
    new.payment_reference := upper(replace(left(new.id::text, 8), '-', ''));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_payments_receipt_defaults on public.payments;
create trigger trg_payments_receipt_defaults
  before insert on public.payments
  for each row execute function app.set_payment_receipt_defaults();

create index if not exists idx_payments_receipt on public.payments (receipt_number);
create index if not exists idx_contracts_status on public.contracts (organization_id, status);

update public.payments
set
  receipt_number = app.generate_payment_receipt_number(),
  payment_reference = upper(replace(left(id::text, 8), '-', ''))
where receipt_number is null or btrim(receipt_number) = '';

-- ─── VÉRIFICATION FINALE (3 × true attendus) ───
select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'student_initial_assessments'
      and column_name = 'recommended_hours_response'
  ) as migration_33_ok,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'contracts'
      and column_name = 'status'
  ) as migration_20260612_contracts_ok,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payments'
      and column_name = 'receipt_number'
  ) as migration_20260612_payments_ok;

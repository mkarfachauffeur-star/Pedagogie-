-- =============================================================================
-- Migration 20260612 — Conformité commerciale (contrats + paiements)
-- Fichier source : supabase/migrations/20260612120000_commercial_readiness.sql
-- Projet : watdeahravfccjdoseaf
--
-- Débloque :
--   • Exports réglementaires contrats (colonne status)
--   • Exports réglementaires paiements (N° reçu, référence)
--   • Trigger auto receipt_number / payment_reference à l'insertion
-- =============================================================================

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

-- Rétroactivité : numéros pour paiements existants sans reçu
update public.payments
set
  receipt_number = app.generate_payment_receipt_number(),
  payment_reference = upper(replace(left(id::text, 8), '-', ''))
where receipt_number is null or btrim(receipt_number) = '';

-- Vérification
select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contracts' and column_name = 'status'
  ) as contracts_status_ok,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'payments' and column_name = 'receipt_number'
  ) as payments_receipt_ok;

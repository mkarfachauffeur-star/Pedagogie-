-- =============================================================================
-- PEDAGOGIA DRIVE — 0006 — Dépenses (sorties) + élargissement encaissements
-- =============================================================================
-- Prérequis : 0001, 0002. Table `expenses` pour carburant, code, frais, etc.
-- Les encaissements peuvent être saisis par secrétariat/gérant et enseignants
-- (pour leurs élèves). Les dépenses par tout le staff (dont enseignants).
-- =============================================================================

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category text not null,
  amount numeric(10,2) not null,
  currency text not null default 'EUR',
  spent_at date not null default (now()::date),
  vehicle_id uuid references public.vehicles(id) on delete set null,
  comment text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_org_date on public.expenses (organization_id, spent_at desc);
create index if not exists idx_expenses_category on public.expenses (organization_id, category);

alter table public.expenses enable row level security;

drop policy if exists expenses_select on public.expenses;
create policy expenses_select on public.expenses
  for select using (organization_id = app.current_org_id() and app.is_staff());

drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses
  for insert
  with check (organization_id = app.current_org_id() and app.is_staff());

drop policy if exists expenses_update on public.expenses;
create policy expenses_update on public.expenses
  for update
  using (
    organization_id = app.current_org_id()
    and (app.is_admin_staff() or created_by = auth.uid())
  )
  with check (organization_id = app.current_org_id());

drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete on public.expenses
  for delete
  using (
    organization_id = app.current_org_id()
    and (app.is_admin_staff() or created_by = auth.uid())
  );

-- Encaissements : secrétariat/gérant + enseignants (leurs élèves)
drop policy if exists payments_write_admin on public.payments;

drop policy if exists payments_insert_staff on public.payments;
create policy payments_insert_staff on public.payments
  for insert
  with check (
    organization_id = app.current_org_id()
    and (
      app.is_admin_staff()
      or (app.current_role() = 'teacher' and app.can_access_student(student_id))
    )
  );

drop policy if exists payments_update_admin on public.payments;
create policy payments_update_admin on public.payments
  for update
  using (organization_id = app.current_org_id() and app.is_admin_staff())
  with check (organization_id = app.current_org_id() and app.is_admin_staff());

drop policy if exists payments_delete_admin on public.payments;
create policy payments_delete_admin on public.payments
  for delete
  using (organization_id = app.current_org_id() and app.is_admin_staff());

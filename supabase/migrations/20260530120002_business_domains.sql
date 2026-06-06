-- =============================================================================
-- PEDAGOGIA DRIVE — 0002 — Domaines métier (multi-tenant + RLS)
-- =============================================================================
-- Prérequis : 0001. Tables : vehicles, documents, contracts, payments,
-- appointments (planning/RDV), exams. Toutes portent `organization_id`.
--   gérant / secrétariat -> toute l'auto-école
--   enseignant           -> ses élèves affectés
--   élève                -> ses propres données
-- =============================================================================

-- Véhicules (flotte) — créé avant `appointments` qui le référence.
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand text,
  model text,
  plate text,
  energy text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_vehicles_org on public.vehicles (organization_id);

-- Documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  type text not null,
  reference text,
  received_date date default now(),
  status text not null default 'À vérifier',
  folder text,
  file_name text,
  storage_path text,
  comment text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_documents_student on public.documents (student_id);

-- Contrats (montant total par dossier — base du récapitulatif paiement)
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null unique references public.students(id) on delete cascade,
  contract_total numeric(10,2) not null default 0,
  currency text not null default 'EUR',
  updated_at timestamptz not null default now()
);

-- Paiements / encaissements (historique)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric(10,2) not null,
  currency text not null default 'EUR',
  paid_at date not null default now(),
  method text not null,                   -- Carte bancaire / Espèces / Chèque / Virement
  nature text not null,                   -- Inscription / Forfait / Heure supp. / ...
  comment text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_payments_student on public.payments (student_id, paid_at desc);

-- Rendez-vous / planning (leçons, RVP, rendez-vous pédagogiques)
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  kind text not null default 'Leçon',     -- Leçon / RVP / Rendez-vous / Examen blanc
  starts_at timestamptz not null,
  duration_minutes int not null default 60,
  status text not null default 'Planifié',
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_appointments_org_time on public.appointments (organization_id, starts_at);

-- Examens
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  type text not null,
  exam_date date,
  exam_time text,
  center text,
  status text not null default 'À confirmer',
  created_at timestamptz not null default now()
);
create index if not exists idx_exams_org on public.exams (organization_id, exam_date);

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.vehicles enable row level security;
alter table public.documents enable row level security;
alter table public.contracts enable row level security;
alter table public.payments enable row level security;
alter table public.appointments enable row level security;
alter table public.exams enable row level security;

-- vehicles
drop policy if exists vehicles_select on public.vehicles;
create policy vehicles_select on public.vehicles
  for select using (organization_id = app.current_org_id() and app.is_staff());
drop policy if exists vehicles_write_admin on public.vehicles;
create policy vehicles_write_admin on public.vehicles
  for all
  using (organization_id = app.current_org_id() and app.is_admin_staff())
  with check (organization_id = app.current_org_id() and app.is_admin_staff());

-- documents
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents
  for select using (app.can_access_student(student_id));
drop policy if exists documents_write_admin on public.documents;
create policy documents_write_admin on public.documents
  for all
  using (organization_id = app.current_org_id() and app.is_admin_staff())
  with check (organization_id = app.current_org_id() and app.is_admin_staff());

-- contracts
drop policy if exists contracts_select on public.contracts;
create policy contracts_select on public.contracts
  for select using (app.can_access_student(student_id));
drop policy if exists contracts_write_admin on public.contracts;
create policy contracts_write_admin on public.contracts
  for all
  using (organization_id = app.current_org_id() and app.is_admin_staff())
  with check (organization_id = app.current_org_id() and app.is_admin_staff());

-- payments
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select using (app.can_access_student(student_id));
drop policy if exists payments_write_admin on public.payments;
create policy payments_write_admin on public.payments
  for all
  using (organization_id = app.current_org_id() and app.is_admin_staff())
  with check (organization_id = app.current_org_id() and app.is_admin_staff());

-- appointments
drop policy if exists appointments_select on public.appointments;
create policy appointments_select on public.appointments
  for select using (
    organization_id = app.current_org_id() and (
      app.is_admin_staff()
      or teacher_id = auth.uid()
      or (student_id is not null and app.can_access_student(student_id))
    )
  );
drop policy if exists appointments_write on public.appointments;
create policy appointments_write on public.appointments
  for all
  using (organization_id = app.current_org_id() and (app.is_admin_staff() or teacher_id = auth.uid()))
  with check (organization_id = app.current_org_id() and (app.is_admin_staff() or teacher_id = auth.uid()));

-- exams
drop policy if exists exams_select on public.exams;
create policy exams_select on public.exams
  for select using (
    organization_id = app.current_org_id() and (
      app.is_admin_staff()
      or teacher_id = auth.uid()
      or (student_id is not null and app.can_access_student(student_id))
    )
  );
drop policy if exists exams_write_admin on public.exams;
create policy exams_write_admin on public.exams
  for all
  using (organization_id = app.current_org_id() and app.is_admin_staff())
  with check (organization_id = app.current_org_id() and app.is_admin_staff());

-- Statut du contrat (secrétaire, enseignant CDI/CDD, indépendant)
alter table public.staff_employment_contracts
  add column if not exists employment_status text not null default 'Enseignant CDI';

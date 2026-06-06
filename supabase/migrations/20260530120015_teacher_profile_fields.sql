-- Champs complémentaires fiche enseignant (adresse, statut)
alter table public.teachers
  add column if not exists address text,
  add column if not exists employment_status text;

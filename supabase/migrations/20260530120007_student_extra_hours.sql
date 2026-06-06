-- Heures supplémentaires saisies manuellement par gérant / secrétariat
alter table public.students
  add column if not exists extra_hours int not null default 0;

comment on column public.students.extra_hours is 'Nombre d''heures supplémentaires au-delà du forfait de base.';

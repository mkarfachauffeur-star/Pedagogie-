-- Détails saisis par l'élève sur un trajet AAC (RVP du trajet, conditions de conduite).
-- Ajout de colonnes uniquement. Aucune ligne existante n'est modifiée ni supprimée.
-- Les politiques RLS déjà en place sur aac_trips couvrent ces colonnes.

alter table public.aac_trips
  add column if not exists mandatory_rvp smallint[] not null default '{}',
  add column if not exists extra_rvp jsonb not null default '[]'::jsonb,
  add column if not exists driving_conditions text[] not null default '{}';

comment on column public.aac_trips.mandatory_rvp is
  'Séquences des RVP obligatoires cochées pour ce trajet (1 et 2). N’écrit pas aac_rvp.';
comment on column public.aac_trips.extra_rvp is
  'RVP facultatifs ajoutés sur ce trajet : tableau JSON [{ "id", "label" }].';
comment on column public.aac_trips.driving_conditions is
  'Identifiants des conditions de conduite facultatives du trajet.';

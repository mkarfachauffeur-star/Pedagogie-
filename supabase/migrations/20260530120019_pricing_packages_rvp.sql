-- Rendez-vous préalable AAC : RVP, RVP1 (1 000 km), RVP2 (2 000 km), RVP3 (3 000 km)
alter table public.pricing_packages
  add column if not exists rvp_included boolean not null default false,
  add column if not exists rvp_ttc numeric(10,2) not null default 0,
  add column if not exists rvp1_included boolean not null default false,
  add column if not exists rvp1_ttc numeric(10,2) not null default 0,
  add column if not exists rvp2_included boolean not null default false,
  add column if not exists rvp2_ttc numeric(10,2) not null default 0,
  add column if not exists rvp3_included boolean not null default false,
  add column if not exists rvp3_ttc numeric(10,2) not null default 0;

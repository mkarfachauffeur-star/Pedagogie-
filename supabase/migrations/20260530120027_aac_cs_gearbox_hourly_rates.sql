-- Tarifs horaires AAC et CS différenciés par type de boîte (manuelle / automatique)

alter table public.organization_pricing_rates
  add column if not exists hour_aac_manual_gear numeric(10,2) not null default 0,
  add column if not exists hour_aac_automatic_gear numeric(10,2) not null default 0,
  add column if not exists hour_supervised_manual_gear numeric(10,2) not null default 0,
  add column if not exists hour_supervised_automatic_gear numeric(10,2) not null default 0;

update public.organization_pricing_rates
set
  hour_aac_manual_gear = coalesce(hour_aac, 0),
  hour_aac_automatic_gear = coalesce(hour_aac, 0),
  hour_supervised_manual_gear = coalesce(hour_supervised, 0),
  hour_supervised_automatic_gear = coalesce(hour_supervised, 0);

alter table public.organization_pricing_rates
  drop column if exists hour_aac,
  drop column if exists hour_supervised;

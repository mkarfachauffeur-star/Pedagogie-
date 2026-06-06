-- AAC / CS : tarifs gérés via les formules (pricing_packages), pas en tarif horaire unitaire
alter table public.organization_pricing_rates
  drop column if exists hour_aac_manual_gear,
  drop column if exists hour_aac_automatic_gear,
  drop column if exists hour_supervised_manual_gear,
  drop column if exists hour_supervised_automatic_gear;

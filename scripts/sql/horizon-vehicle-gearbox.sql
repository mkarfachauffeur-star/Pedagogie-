-- Renseigne le type de boîte sur la flotte Horizon (prod / recette).
-- Exécution : npx supabase db query --linked -f scripts/sql/horizon-vehicle-gearbox.sql

do $$
declare
  v_org_id uuid;
begin
  select p.organization_id into v_org_id
  from public.profiles p
  where p.email = 'horizon.gerant@demo.pedagogia.local'
  limit 1;

  if v_org_id is null then
    raise exception 'Auto-École Horizon Drive introuvable';
  end if;

  update public.vehicles
  set details = coalesce(details, '{}'::jsonb) || jsonb_build_object('gearbox', 'manuelle')
  where organization_id = v_org_id and plate = 'AB-123-CD';

  update public.vehicles
  set details = coalesce(details, '{}'::jsonb) || jsonb_build_object('gearbox', 'automatique')
  where organization_id = v_org_id and plate = 'EF-456-GH';

  update public.vehicles
  set details = coalesce(details, '{}'::jsonb) || jsonb_build_object('gearbox', 'manuelle')
  where organization_id = v_org_id and plate = 'IJ-789-KL';
end $$;

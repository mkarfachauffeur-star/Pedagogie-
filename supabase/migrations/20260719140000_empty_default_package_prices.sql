-- Nouvelles auto-écoles : formules sans tarifs préremplis (champs à 0 / vides).
-- Le gérant renseigne ses prix dans Formules & tarifs.

create or replace function app.seed_default_packages(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pricing_packages (
    organization_id,
    name,
    category,
    included_hours,
    sort_order,
    price_ttc,
    admin_fee_ttc,
    extra_hour_price_ttc,
    exam_presentation_included,
    exam_presentation_ttc
  )
  select *
  from (
    values
      (p_org_id, 'Forfait 20h Boîte Manuelle', 'b_manuelle'::public.package_category, 20, 1, 0::numeric, 0::numeric, 0::numeric, false, 0::numeric),
      (p_org_id, 'Forfait 13h Boîte Automatique', 'b_automatique'::public.package_category, 13, 2, 0::numeric, 0::numeric, 0::numeric, false, 0::numeric),
      (p_org_id, 'Conduite Accompagnée (AAC)', 'aac'::public.package_category, 20, 3, 0::numeric, 0::numeric, 0::numeric, false, 0::numeric),
      (p_org_id, 'Conduite Supervisée (CS)', 'cs'::public.package_category, 20, 4, 0::numeric, 0::numeric, 0::numeric, false, 0::numeric),
      (p_org_id, 'Permis Moto', 'moto'::public.package_category, 20, 5, 0::numeric, 0::numeric, 0::numeric, false, 0::numeric),
      (p_org_id, 'Code seul', 'code'::public.package_category, 0, 6, 0::numeric, 0::numeric, 0::numeric, false, 0::numeric)
  ) as seed(
    organization_id,
    name,
    category,
    included_hours,
    sort_order,
    price_ttc,
    admin_fee_ttc,
    extra_hour_price_ttc,
    exam_presentation_included,
    exam_presentation_ttc
  )
  where not exists (
    select 1
    from public.pricing_packages existing
    where existing.organization_id = p_org_id
      and existing.category = seed.category
  );
end;
$$;

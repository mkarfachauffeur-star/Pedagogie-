-- Formules par défaut : tarifs indicatifs + seed idempotent
create or replace function app.seed_default_packages(p_org_id uuid)
returns void language plpgsql security definer set search_path = public as $$
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
      (p_org_id, 'Forfait 20h Boîte Manuelle', 'b_manuelle'::public.package_category, 20, 1, 1290::numeric, 150::numeric, 55::numeric, true, 250::numeric),
      (p_org_id, 'Forfait 13h Boîte Automatique', 'b_automatique'::public.package_category, 13, 2, 1190::numeric, 150::numeric, 55::numeric, true, 250::numeric),
      (p_org_id, 'Conduite Accompagnée (AAC)', 'aac'::public.package_category, 20, 3, 1590::numeric, 150::numeric, 55::numeric, true, 250::numeric),
      (p_org_id, 'Conduite Supervisée (CS)', 'cs'::public.package_category, 20, 4, 890::numeric, 150::numeric, 55::numeric, true, 250::numeric),
      (p_org_id, 'Permis Moto', 'moto'::public.package_category, 20, 5, 990::numeric, 150::numeric, 65::numeric, true, 250::numeric),
      (p_org_id, 'Code seul', 'code'::public.package_category, 0, 6, 290::numeric, 0::numeric, 0::numeric, false, 0::numeric)
  ) as seed(organization_id, name, category, included_hours, sort_order, price_ttc, admin_fee_ttc, extra_hour_price_ttc, exam_presentation_included, exam_presentation_ttc)
  where not exists (
    select 1
    from public.pricing_packages existing
    where existing.organization_id = p_org_id
      and existing.category = seed.category
  );
end $$;

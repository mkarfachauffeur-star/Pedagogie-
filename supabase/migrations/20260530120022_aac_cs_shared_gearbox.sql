-- AAC et CS : une formule commune à boîte manuelle et automatique
delete from public.pricing_packages auto
where auto.category::text in ('b_automatique_aac', 'b_automatique_cs')
  and exists (
    select 1
    from public.pricing_packages manual
    where manual.organization_id = auto.organization_id
      and manual.category::text = case
        when auto.category::text = 'b_automatique_aac' then 'b_manuelle_aac'
        else 'b_manuelle_cs'
      end
  );

update public.pricing_packages
set category = 'aac'::public.package_category
where category::text in ('b_manuelle_aac', 'b_automatique_aac');

update public.pricing_packages
set category = 'cs'::public.package_category
where category::text in ('b_manuelle_cs', 'b_automatique_cs');

create or replace function app.seed_default_packages(p_org_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.pricing_packages (organization_id, name, category, included_hours, sort_order)
  values
    (p_org_id, 'Forfait 20h Boîte Manuelle', 'b_manuelle', 20, 1),
    (p_org_id, 'Forfait 13h Boîte Automatique', 'b_automatique', 13, 2),
    (p_org_id, 'Conduite Accompagnée (AAC)', 'aac', 20, 3),
    (p_org_id, 'Conduite Supervisée (CS)', 'cs', 20, 4),
    (p_org_id, 'Permis Moto', 'moto', 20, 5),
    (p_org_id, 'Code seul', 'code', 0, 6)
  on conflict do nothing;
end $$;

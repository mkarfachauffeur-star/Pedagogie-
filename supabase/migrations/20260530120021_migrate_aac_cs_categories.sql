-- Migrer les anciennes catégories AAC / CS autonomes
update public.pricing_packages set category = 'b_manuelle_aac' where category = 'aac';
update public.pricing_packages set category = 'b_manuelle_cs' where category = 'cs';

create or replace function app.seed_default_packages(p_org_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.pricing_packages (organization_id, name, category, included_hours, sort_order)
  values
    (p_org_id, 'Forfait 20h Boîte Manuelle', 'b_manuelle', 20, 1),
    (p_org_id, 'Forfait 13h Boîte Automatique', 'b_automatique', 13, 2),
    (p_org_id, 'Conduite Accompagnée (AAC) — Boîte manuelle', 'b_manuelle_aac', 20, 3),
    (p_org_id, 'Conduite Supervisée (CS) — Boîte manuelle', 'b_manuelle_cs', 20, 4),
    (p_org_id, 'Permis Moto', 'moto', 20, 5),
    (p_org_id, 'Code seul', 'code', 0, 6)
  on conflict do nothing;
end $$;

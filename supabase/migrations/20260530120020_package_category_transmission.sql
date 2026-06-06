-- Permis B : AAC et CS rattachés à boîte manuelle ou automatique
alter type public.package_category add value if not exists 'b_manuelle_aac';
alter type public.package_category add value if not exists 'b_automatique_aac';
alter type public.package_category add value if not exists 'b_manuelle_cs';
alter type public.package_category add value if not exists 'b_automatique_cs';

-- Bootstrap Super Admin (exécuter manuellement après création du compte Auth)
-- 1. Créer un utilisateur via Supabase Auth Dashboard
-- 2. Remplacer USER_UUID ci-dessous
-- 3. Exécuter ce script

-- INSERT INTO public.profiles (id, organization_id, role, full_name, email)
-- VALUES ('USER_UUID', NULL, 'super_admin', 'Admin Pedagogia', 'admin@pedagogia.fr')
-- ON CONFLICT (id) DO UPDATE SET role = 'super_admin', organization_id = NULL;

-- INSERT INTO public.super_admins (profile_id) VALUES ('USER_UUID')
-- ON CONFLICT (profile_id) DO NOTHING;

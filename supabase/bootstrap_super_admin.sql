-- =============================================================================
-- Super Admin Pedagogia Drive
-- Compte plateforme : aucune auto-école (organization_id = NULL)
-- Gère : auto-écoles, abonnements, demandes démo, audits
-- =============================================================================
--
-- MÉTHODE RECOMMANDÉE (script Node) :
--
--   SUPABASE_URL=https://watdeahravfccjdoseaf.supabase.co \
--   SUPABASE_SERVICE_ROLE_KEY=... \
--   SUPER_ADMIN_EMAIL=admin@pedagogia-drive.fr \
--   SUPER_ADMIN_PASSWORD='VotreMotDePasseSecurise!' \
--   SUPER_ADMIN_FULL_NAME='Admin Pedagogia Drive' \
--   node scripts/create-super-admin.mjs
--
-- MÉTHODE MANUELLE (Dashboard Supabase) :
--   1. Authentication → Users → Add user (e-mail + mot de passe, confirmé)
--   2. Copier l’UUID du user
--   3. Exécuter le SQL ci-dessous en remplaçant USER_UUID et l’e-mail
--
-- =============================================================================

-- Remplacer USER_UUID et l’e-mail :
/*
INSERT INTO public.profiles (id, organization_id, role, full_name, email, is_active)
VALUES (
  'USER_UUID',
  NULL,
  'super_admin',
  'Admin Pedagogia Drive',
  'admin@pedagogia-drive.fr',
  true
)
ON CONFLICT (id) DO UPDATE SET
  organization_id = NULL,
  role = 'super_admin',
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  is_active = true;

INSERT INTO public.super_admins (profile_id, is_active)
VALUES ('USER_UUID', true)
ON CONFLICT (profile_id) DO UPDATE SET is_active = true;
*/

-- Vérifier le Super Admin actif :
/*
SELECT p.id, p.email, p.full_name, p.role, p.organization_id, sa.is_active
FROM public.super_admins sa
JOIN public.profiles p ON p.id = sa.profile_id
WHERE sa.is_active = true;
*/

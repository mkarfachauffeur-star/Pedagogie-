-- Voir supabase/promote_super_admin.sql et supabase/migrations/20260630170000_super_admin_platform.sql

SELECT public.promote_to_super_admin(u.id)
FROM auth.users u
WHERE lower(u.email) = lower('VOTRE_EMAIL@example.com');

-- Réinitialisation mot de passe staff : validation côté BDD (sans edge function).
-- Le client envoie ensuite l'e-mail via supabase.auth.resetPasswordForEmail.

create or replace function app.validate_manager_staff_password_reset(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
begin
  if app.current_role() <> 'manager' then
    raise exception 'Action réservée au gérant';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Utilisez « Mot de passe oublié » sur la page de connexion pour votre propre compte.';
  end if;

  select coalesce(p.email, u.email::text)
  into v_email
  from public.profiles p
  inner join auth.users u on u.id = p.id
  where p.id = p_user_id
    and p.organization_id = app.current_org_id()
    and p.role in ('manager', 'teacher', 'secretary');

  if v_email is null then
    raise exception 'Utilisateur introuvable';
  end if;

  return v_email;
end;
$$;

revoke all on function app.validate_manager_staff_password_reset(uuid) from public;
grant execute on function app.validate_manager_staff_password_reset(uuid) to authenticated;

create or replace function public.manager_staff_password_reset_target(p_user_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select app.validate_manager_staff_password_reset(p_user_id);
$$;

grant execute on function public.manager_staff_password_reset_target(uuid) to authenticated;

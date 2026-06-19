-- Secrétaire + gérant : mise à jour des profils de l'organisation (ex. fiche simulateur).

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update
  using (
    id = auth.uid()
    or (
      organization_id = app.current_org_id()
      and app.is_admin_staff()
      and app.can_write_org()
    )
  )
  with check (
    id = auth.uid()
    or (
      organization_id = app.current_org_id()
      and app.is_admin_staff()
      and app.can_write_org()
    )
  );

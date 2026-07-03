-- Suppression définitive d'une demande de démonstration (Super Admin)

create or replace function public.platform_delete_demo_request(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app.is_super_admin() then
    raise exception 'Accès réservé au Super Admin';
  end if;

  delete from public.demo_requests where id = p_id;

  if not found then
    raise exception 'Demande introuvable : %', p_id;
  end if;
end;
$$;

comment on function public.platform_delete_demo_request(uuid) is
  'Supprime une ligne demo_requests. Supprimer l''auto-école associée avant si organization_id est renseigné.';

grant execute on function public.platform_delete_demo_request(uuid) to authenticated;

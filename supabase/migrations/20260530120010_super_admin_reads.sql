-- Super Admin : lecture transversale pour stats plateforme
drop policy if exists students_select_super on public.students;
create policy students_select_super on public.students
  for select using (app.is_super_admin());

drop policy if exists billing_history_insert_super on public.billing_history;
create policy billing_history_insert_super on public.billing_history
  for insert with check (app.is_super_admin());

create or replace function public.seed_default_packages(p_org_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform app.seed_default_packages(p_org_id);
end $$;

grant execute on function public.seed_default_packages(uuid) to service_role;

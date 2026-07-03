-- Audit : ne pas référencer une organization supprimée (évite FK en cascade de suppression)

create or replace function app.audit_row_changes()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_actor uuid := auth.uid();
  v_role public.app_role;
  v_email text;
  v_action public.audit_action;
  v_old jsonb;
  v_new jsonb;
  v_label text;
begin
  if tg_op = 'INSERT' then
    v_action := 'create';
    v_new := to_jsonb(new);
    v_org := (new).organization_id;
    v_label := coalesce(new.id::text, '');
  elsif tg_op = 'UPDATE' then
    v_action := 'update';
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_org := coalesce((new).organization_id, (old).organization_id);
    v_label := coalesce(new.id::text, old.id::text, '');
  else
    v_action := 'delete';
    v_old := to_jsonb(old);
    v_org := (old).organization_id;
    v_label := coalesce(old.id::text, '');
  end if;

  if v_org is null and v_actor is not null then
    select organization_id, role, email into v_org, v_role, v_email
    from public.profiles where id = v_actor;
  end if;

  if v_org is not null and not exists (
    select 1 from public.organizations where id = v_org
  ) then
    v_org := null;
  end if;

  insert into public.audit_logs (
    organization_id, actor_id, actor_role, actor_email,
    action, entity_type, entity_id, entity_label, old_data, new_data
  ) values (
    v_org, v_actor, v_role, v_email,
    v_action, tg_table_name,
    coalesce(
      case when tg_op = 'DELETE' then old.id else new.id end,
      null
    ),
    v_label, v_old, v_new
  );
  return coalesce(new, old);
end $$;

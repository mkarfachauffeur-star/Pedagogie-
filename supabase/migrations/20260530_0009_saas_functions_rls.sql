-- =============================================================================
-- PEDAGOGIA DRIVE — 0009 — SaaS V1 fonctions, audit, RLS, garde-fous écriture
-- =============================================================================

-- Helpers ---------------------------------------------------------------------
create or replace function app.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select sa.is_active from public.super_admins sa
    where sa.profile_id = auth.uid()
  ), false)
$$;

create or replace function app.org_record(p_org_id uuid default null)
returns public.organizations language sql stable security definer set search_path = public as $$
  select o.* from public.organizations o
  where o.id = coalesce(p_org_id, app.current_org_id())
  limit 1
$$;

create or replace function app.active_subscription(p_org_id uuid default null)
returns public.subscriptions language sql stable security definer set search_path = public as $$
  select s.* from public.subscriptions s
  where s.organization_id = coalesce(p_org_id, app.current_org_id())
  limit 1
$$;

create or replace function app.plan_max_students(p_org_id uuid default null)
returns int language sql stable security definer set search_path = public as $$
  select p.max_students
  from public.subscriptions s
  join public.plans p on p.id = s.plan_id
  where s.organization_id = coalesce(p_org_id, app.current_org_id())
  limit 1
$$;

create or replace function app.student_count(p_org_id uuid default null)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.students
  where organization_id = coalesce(p_org_id, app.current_org_id())
$$;

create or replace function app.can_write_org(p_org_id uuid default null)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_org public.organizations;
  v_sub public.subscriptions;
begin
  if app.is_super_admin() then
    return true;
  end if;

  select * into v_org from public.organizations
  where id = coalesce(p_org_id, app.current_org_id());
  if not found then return false; end if;

  if v_org.status in ('suspended', 'cancelled') then
    return false;
  end if;

  select * into v_sub from public.subscriptions where organization_id = v_org.id;
  if found and v_sub.status in ('suspended', 'expired', 'cancelled') then
    return false;
  end if;

  if v_org.status = 'trial' and v_sub.trial_ends_at is not null and v_sub.trial_ends_at < now() then
    return false;
  end if;

  return true;
end $$;

create or replace function app.can_create_student(p_org_id uuid default null)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_org_id uuid := coalesce(p_org_id, app.current_org_id());
  v_max int;
begin
  if not app.can_write_org(v_org_id) then return false; end if;
  v_max := app.plan_max_students(v_org_id);
  if v_max is not null and app.student_count(v_org_id) >= v_max then
    return false;
  end if;
  return true;
end $$;

-- Seed formules par défaut ----------------------------------------------------
create or replace function app.seed_default_packages(p_org_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.pricing_packages (organization_id, name, category, included_hours, sort_order)
  values
    (p_org_id, 'Forfait 20h Boîte Manuelle', 'b_manuelle', 20, 1),
    (p_org_id, 'Forfait 13h Boîte Automatique', 'b_automatique', 13, 2),
    (p_org_id, 'Conduite Accompagnée (AAC)', 'aac', 20, 3),
    (p_org_id, 'Conduite Supervisée (CS)', 'cs', 20, 4),
    (p_org_id, 'Permis Moto', 'moto', 20, 5),
    (p_org_id, 'Code seul', 'code', 0, 6)
  on conflict do nothing;
end $$;

-- Calcul contract_total -------------------------------------------------------
create or replace function app.compute_contract_total(
  p_package_price numeric, p_admin numeric, p_exam numeric,
  p_extra_hours int, p_extra_amount numeric
) returns numeric language sql immutable as $$
  select coalesce(p_package_price,0) + coalesce(p_admin,0) + coalesce(p_exam,0) + coalesce(p_extra_amount,0)
$$;

create or replace function app.sync_contract_total()
returns trigger language plpgsql as $$
begin
  new.contract_total := app.compute_contract_total(
    new.package_price_ttc, new.admin_fee_ttc, new.exam_presentation_ttc,
    new.extra_hours, new.extra_hours_amount_ttc
  );
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists contracts_compute_total on public.contracts;
create trigger contracts_compute_total
  before insert or update on public.contracts
  for each row execute function app.sync_contract_total();

-- Audit -----------------------------------------------------------------------
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

create or replace function app.log_audit_event(
  p_action public.audit_action,
  p_entity_type text default '',
  p_entity_id uuid default null,
  p_entity_label text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_organization_id uuid default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := coalesce(p_organization_id, app.current_org_id());
  v_role public.app_role;
  v_email text;
begin
  select role, email into v_role, v_email from public.profiles where id = auth.uid();
  insert into public.audit_logs (
    organization_id, actor_id, actor_role, actor_email,
    action, entity_type, entity_id, entity_label, metadata
  ) values (
    v_org, auth.uid(), v_role, v_email,
    p_action, p_entity_type, p_entity_id, p_entity_label, p_metadata
  );
end $$;

-- Triggers audit (tables sensibles) -------------------------------------------
do $$ declare t text; begin
  foreach t in array array['students','contracts','payments','expenses','appointments','exams','documents','pricing_packages','profiles']
  loop
    execute format('drop trigger if exists audit_%I on public.%I', t, t);
    execute format(
      'create trigger audit_%I after insert or update or delete on public.%I for each row execute function app.audit_row_changes()',
      t, t
    );
  end loop;
end $$;

-- RLS nouvelles tables --------------------------------------------------------
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.billing_history enable row level security;
alter table public.pricing_packages enable row level security;
alter table public.audit_logs enable row level security;
alter table public.super_admins enable row level security;
alter table public.organization_domains enable row level security;

-- plans : lecture staff + super admin
drop policy if exists plans_select on public.plans;
create policy plans_select on public.plans for select using (app.is_staff() or app.is_super_admin());

-- subscriptions
drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions
  for select using (organization_id = app.current_org_id() or app.is_super_admin());
drop policy if exists subscriptions_update_super on public.subscriptions;
create policy subscriptions_update_super on public.subscriptions
  for update using (app.is_super_admin()) with check (app.is_super_admin());

-- invoices
drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices
  for select using (organization_id = app.current_org_id() or app.is_super_admin());

-- billing_history
drop policy if exists billing_history_select on public.billing_history;
create policy billing_history_select on public.billing_history
  for select using (organization_id = app.current_org_id() or app.is_super_admin());

-- pricing_packages
drop policy if exists pricing_packages_select on public.pricing_packages;
create policy pricing_packages_select on public.pricing_packages
  for select using (organization_id = app.current_org_id() and app.is_staff());
drop policy if exists pricing_packages_write on public.pricing_packages;
create policy pricing_packages_write on public.pricing_packages
  for all using (organization_id = app.current_org_id() and app.is_admin_staff() and app.can_write_org())
  with check (organization_id = app.current_org_id() and app.is_admin_staff() and app.can_write_org());

-- audit_logs
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select using (
    app.is_super_admin()
    or (organization_id = app.current_org_id() and app.is_admin_staff())
  );
drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
  for insert with check (auth.uid() is not null);

-- super_admins
drop policy if exists super_admins_select on public.super_admins;
create policy super_admins_select on public.super_admins
  for select using (app.is_super_admin() or profile_id = auth.uid());

-- organizations : super admin voit tout
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select using (id = app.current_org_id() or app.is_super_admin());
drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update using (
    (id = app.current_org_id() and app.current_role() = 'manager' and app.can_write_org())
    or app.is_super_admin()
  ) with check (
    (id = app.current_org_id() and app.current_role() = 'manager')
    or app.is_super_admin()
  );

-- Garde-fous écriture — students
drop policy if exists students_write_admin on public.students;
create policy students_write_admin on public.students
  for all
  using (organization_id = app.current_org_id() and app.is_admin_staff() and app.can_write_org())
  with check (organization_id = app.current_org_id() and app.is_admin_staff() and app.can_write_org());

-- contracts
drop policy if exists contracts_write_admin on public.contracts;
create policy contracts_write_admin on public.contracts
  for all
  using (organization_id = app.current_org_id() and app.is_admin_staff() and app.can_write_org())
  with check (organization_id = app.current_org_id() and app.is_admin_staff() and app.can_write_org());

-- payments insert
drop policy if exists payments_insert_staff on public.payments;
create policy payments_insert_staff on public.payments
  for insert with check (
    organization_id = app.current_org_id() and app.can_write_org()
    and (app.is_admin_staff() or (app.current_role() = 'teacher' and app.can_access_student(student_id)))
  );
drop policy if exists payments_update_admin on public.payments;
create policy payments_update_admin on public.payments
  for update using (organization_id = app.current_org_id() and app.is_admin_staff() and app.can_write_org())
  with check (organization_id = app.current_org_id() and app.is_admin_staff() and app.can_write_org());
drop policy if exists payments_delete_admin on public.payments;
create policy payments_delete_admin on public.payments
  for delete using (organization_id = app.current_org_id() and app.is_admin_staff() and app.can_write_org());

-- expenses
drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses
  for insert with check (organization_id = app.current_org_id() and app.is_staff() and app.can_write_org());
drop policy if exists expenses_update on public.expenses;
create policy expenses_update on public.expenses
  for update using (
    organization_id = app.current_org_id() and app.can_write_org()
    and (app.is_admin_staff() or created_by = auth.uid())
  ) with check (organization_id = app.current_org_id() and app.can_write_org());
drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete on public.expenses
  for delete using (
    organization_id = app.current_org_id() and app.can_write_org()
    and (app.is_admin_staff() or created_by = auth.uid())
  );

-- appointments write
drop policy if exists appointments_write on public.appointments;
create policy appointments_write on public.appointments
  for all
  using (organization_id = app.current_org_id() and app.can_write_org() and (app.is_admin_staff() or teacher_id = auth.uid()))
  with check (organization_id = app.current_org_id() and app.can_write_org() and (app.is_admin_staff() or teacher_id = auth.uid()));

-- exams
drop policy if exists exams_write_admin on public.exams;
create policy exams_write_admin on public.exams
  for all
  using (organization_id = app.current_org_id() and app.is_admin_staff() and app.can_write_org())
  with check (organization_id = app.current_org_id() and app.is_admin_staff() and app.can_write_org());

-- documents
drop policy if exists documents_write_admin on public.documents;
create policy documents_write_admin on public.documents
  for all
  using (organization_id = app.current_org_id() and app.is_admin_staff() and app.can_write_org())
  with check (organization_id = app.current_org_id() and app.is_admin_staff() and app.can_write_org());

-- vehicles
drop policy if exists vehicles_write_admin on public.vehicles;
create policy vehicles_write_admin on public.vehicles
  for all
  using (organization_id = app.current_org_id() and app.is_admin_staff() and app.can_write_org())
  with check (organization_id = app.current_org_id() and app.is_admin_staff() and app.can_write_org());

-- messages insert
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    organization_id = app.current_org_id()
    and app.can_write_org()
    and sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.profile_id = auth.uid()
    )
  );

-- Storage org logos -----------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('org-assets', 'org-assets', true)
on conflict (id) do nothing;

drop policy if exists org_assets_select on storage.objects;
create policy org_assets_select on storage.objects
  for select using (bucket_id = 'org-assets');
drop policy if exists org_assets_insert on storage.objects;
create policy org_assets_insert on storage.objects
  for insert with check (
    bucket_id = 'org-assets'
    and (storage.foldername(name))[1] = app.current_org_id()::text
    and app.is_admin_staff()
    and app.can_write_org()
  );
drop policy if exists org_assets_update on storage.objects;
create policy org_assets_update on storage.objects
  for update using (
    bucket_id = 'org-assets'
    and (storage.foldername(name))[1] = app.current_org_id()::text
    and app.is_admin_staff()
    and app.can_write_org()
  );

-- Purge audit > 7 ans (à planifier via pg_cron ou job externe)
comment on table public.audit_logs is 'Conservation 7 ans. Purge: DELETE FROM audit_logs WHERE created_at < now() - interval ''7 years''';

-- RPC public pour le client (login, export)
create or replace function public.log_audit_event(
  p_action public.audit_action,
  p_entity_type text default '',
  p_entity_id uuid default null,
  p_entity_label text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_organization_id uuid default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  perform app.log_audit_event(p_action, p_entity_type, p_entity_id, p_entity_label, p_metadata, p_organization_id);
end $$;

grant execute on function public.log_audit_event to authenticated;
grant execute on function app.seed_default_packages to service_role;

-- =============================================================================
-- Super Admin — accès plateforme complet (sans organization_id)
-- Le Super Admin contourne RLS via des policies dédiées ; les autres rôles inchangés.
-- =============================================================================

-- Helper : promouvoir / révoquer ------------------------------------------------
create or replace function public.promote_to_super_admin(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Utilisateur Auth introuvable : %', p_user_id;
  end if;

  insert into public.profiles (id, organization_id, role, full_name, email, is_active)
  select
    u.id,
    null,
    'super_admin'::public.app_role,
    coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'Super Admin'),
    u.email,
    true
  from auth.users u
  where u.id = p_user_id
  on conflict (id) do update set
    organization_id = null,
    role = 'super_admin'::public.app_role,
    email = excluded.email,
    is_active = true;

  insert into public.super_admins (profile_id, is_active)
  values (p_user_id, true)
  on conflict (profile_id) do update set is_active = true;
end;
$$;

comment on function public.promote_to_super_admin(uuid) is
  'Promouvoir un utilisateur Auth existant en Super Admin (organization_id NULL).';

create or replace function public.revoke_super_admin(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.super_admins set is_active = false where profile_id = p_user_id;
end;
$$;

-- Helpers sécurité : le Super Admin voit toutes les données ----------------------
create or replace function app.can_view_profile(p_target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select app.is_super_admin()
    or exists (
      select 1 from public.profiles t
      where t.id = p_target
        and t.organization_id = app.current_org_id()
        and (
          app.is_admin_staff()
          or t.id = auth.uid()
          or (app.current_role() = 'teacher' and (
                t.role in ('manager','secretary','teacher')
                or exists (
                  select 1 from public.students s
                  where s.profile_id = t.id and app.is_teacher_of_student(s.id)
                )
          ))
          or (app.current_role() = 'student' and t.role in ('secretary','teacher'))
        )
    )
$$;

create or replace function app.can_access_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select app.is_super_admin()
    or exists (
      select 1 from public.students s
      where s.id = p_student_id
        and s.organization_id = app.current_org_id()
        and (
          app.is_admin_staff()
          or (app.current_role() = 'teacher' and app.is_teacher_of_student(s.id))
          or (app.current_role() = 'student' and s.profile_id = auth.uid())
        )
    )
$$;

create or replace function app.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select app.is_super_admin()
    or coalesce((
      select role in ('manager','secretary','teacher')
      from public.profiles where id = auth.uid()
    ), false)
$$;

-- Création auto-école (Super Admin) -------------------------------------------
create or replace function public.platform_create_organization(
  p_name text,
  p_email text default null,
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_plan_id uuid;
  v_trial_days int;
  v_trial_ends timestamptz;
begin
  if not app.is_super_admin() then
    raise exception 'Accès réservé au Super Admin';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'Le nom de l''auto-école est obligatoire';
  end if;

  insert into public.organizations (name, email, phone, status)
  values (trim(p_name), nullif(trim(p_email), ''), nullif(trim(p_phone), ''), 'trial')
  returning id into v_org_id;

  select id, trial_days into v_plan_id, v_trial_days
  from public.plans where code = 'trial' limit 1;

  if v_plan_id is not null then
    v_trial_ends := now() + make_interval(days => coalesce(v_trial_days, 30));
    insert into public.subscriptions (
      organization_id, plan_id, status,
      trial_ends_at, current_period_start, current_period_end
    ) values (
      v_org_id, v_plan_id, 'active',
      v_trial_ends, now(), v_trial_ends
    );
  end if;

  perform app.seed_default_packages(v_org_id);

  insert into public.billing_history (organization_id, event_type, new_value, notes)
  values (v_org_id, 'trial_started', jsonb_build_object('source', 'platform_super_admin'), 'Création par Super Admin');

  insert into public.audit_logs (
    organization_id, actor_id, actor_role, actor_email,
    action, entity_type, entity_id, entity_label, new_data
  )
  select
    v_org_id, auth.uid(), p.role, p.email,
    'create', 'organizations', v_org_id, trim(p_name),
    jsonb_build_object('name', trim(p_name), 'status', 'trial')
  from public.profiles p where p.id = auth.uid();

  return v_org_id;
end;
$$;

grant execute on function public.platform_create_organization(text, text, text) to authenticated;
grant execute on function public.promote_to_super_admin(uuid) to service_role;

-- Policies Super Admin sur toutes les tables public RLS -----------------------
do $$
declare
  r record;
begin
  for r in
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relrowsecurity
  loop
    execute format('drop policy if exists super_admin_all on public.%I', r.table_name);
    execute format(
      'create policy super_admin_all on public.%I for all to authenticated using (app.is_super_admin()) with check (app.is_super_admin())',
      r.table_name
    );
  end loop;
end $$;

-- Storage : accès Super Admin -------------------------------------------------
drop policy if exists org_assets_super on storage.objects;
create policy org_assets_super on storage.objects
  for all to authenticated
  using (bucket_id = 'org-assets' and app.is_super_admin())
  with check (bucket_id = 'org-assets' and app.is_super_admin());

drop policy if exists attachments_super on storage.objects;
create policy attachments_super on storage.objects
  for all to authenticated
  using (bucket_id = 'message-attachments' and app.is_super_admin())
  with check (bucket_id = 'message-attachments' and app.is_super_admin());

-- Provisioning Auth : profil Super Admin sans organisation --------------------
create or replace function app.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := nullif(new.raw_user_meta_data->>'organization_id','')::uuid;
  v_role public.app_role := coalesce(nullif(new.raw_user_meta_data->>'role','')::public.app_role, 'student');
  v_name text := coalesce(new.raw_user_meta_data->>'full_name','');
begin
  if v_role = 'super_admin'::public.app_role then
    insert into public.profiles (id, organization_id, role, full_name, email)
    values (new.id, null, 'super_admin', v_name, new.email)
    on conflict (id) do update set
      organization_id = null,
      role = 'super_admin',
      full_name = excluded.full_name,
      email = excluded.email;

    insert into public.super_admins (profile_id, is_active)
    values (new.id, true)
    on conflict (profile_id) do update set is_active = true;

    return new;
  end if;

  if v_org is not null then
    insert into public.profiles (id, organization_id, role, full_name, email)
    values (new.id, v_org, v_role, v_name, new.email)
    on conflict (id) do nothing;

    if v_role = 'teacher' then
      insert into public.teachers (profile_id, organization_id) values (new.id, v_org)
      on conflict (profile_id) do nothing;
    elsif v_role = 'secretary' then
      insert into public.secretaries (profile_id, organization_id) values (new.id, v_org)
      on conflict (profile_id) do nothing;
    end if;
  end if;

  return new;
end $$;

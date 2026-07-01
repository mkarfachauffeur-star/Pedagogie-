-- =============================================================================
-- Architecture comptes : Super Admin indépendant (sans organisation)
-- Gérants rattachés uniquement à leur auto-école via invitation Supabase.
-- =============================================================================

-- Helpers sécurité : le Super Admin n'a jamais d'organisation ni de rôle staff
create or replace function app.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
    when app.is_super_admin() then null::uuid
    else (select p.organization_id from public.profiles p where p.id = auth.uid())
  end
$$;

create or replace function app.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select case
    when app.is_super_admin() then 'super_admin'::public.app_role
    else (select p.role from public.profiles p where p.id = auth.uid())
  end
$$;

create or replace function app.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when app.is_super_admin() then false
    else coalesce((
      select p.role in ('manager', 'secretary', 'teacher')
      from public.profiles p
      where p.id = auth.uid()
    ), false)
  end
$$;

create or replace function app.is_admin_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when app.is_super_admin() then false
    else coalesce((
      select p.role in ('manager', 'secretary')
      from public.profiles p
      where p.id = auth.uid()
    ), false)
  end
$$;

-- Garde-fou : un Super Admin ne peut jamais avoir organization_id
create or replace function app.enforce_super_admin_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'super_admin'::public.app_role then
    new.organization_id := null;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_enforce_super_admin on public.profiles;
create trigger profiles_enforce_super_admin
  before insert or update on public.profiles
  for each row
  execute function app.enforce_super_admin_profile();

-- Promotion Super Admin : détache toute liaison organisation
create or replace function public.promote_to_super_admin(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Utilisateur Auth introuvable : %', p_user_id;
  end if;

  delete from public.teachers where profile_id = p_user_id;
  delete from public.secretaries where profile_id = p_user_id;
  delete from public.students where profile_id = p_user_id;

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

  update auth.users
  set
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'super_admin'),
    raw_user_meta_data = (
      coalesce(raw_user_meta_data, '{}'::jsonb)
      - 'organization_id'
      - 'must_change_password'
    ) || jsonb_build_object('role', 'super_admin')
  where id = p_user_id;
end;
$$;

comment on function public.promote_to_super_admin(uuid) is
  'Promouvoir un utilisateur en Super Admin : organization_id NULL, sans lien auto-école.';

-- Création auto-école : plan Starter + essai 30 jours (statut org trial → « Essai » côté UI)
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
  v_trial_days int := 30;
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

  select id, coalesce(trial_days, 30) into v_plan_id, v_trial_days
  from public.plans
  where code = 'starter' and is_active = true
  limit 1;

  if v_plan_id is null then
    select id, coalesce(trial_days, 30) into v_plan_id, v_trial_days
    from public.plans where code = 'trial' limit 1;
  end if;

  if v_plan_id is not null then
    v_trial_ends := now() + make_interval(days => v_trial_days);
    insert into public.subscriptions (
      organization_id, plan_id, status,
      trial_ends_at, current_period_start, current_period_end,
      metadata
    ) values (
      v_org_id, v_plan_id, 'active',
      v_trial_ends, now(), v_trial_ends,
      jsonb_build_object('trial_phase', true, 'plan_target', 'starter')
    );
  end if;

  perform app.seed_default_packages(v_org_id);

  insert into public.billing_history (organization_id, event_type, new_value, notes)
  values (
    v_org_id,
    'trial_started',
    jsonb_build_object('source', 'platform_super_admin', 'plan', 'starter', 'trial_days', v_trial_days),
    'Essai gratuit 30 jours — plan Starter'
  );

  insert into public.audit_logs (
    organization_id, actor_id, actor_role, action, entity_type, entity_id, entity_label, metadata
  ) values (
    v_org_id,
    auth.uid(),
    'super_admin',
    'create',
    'organizations',
    v_org_id,
    trim(p_name),
    jsonb_build_object('name', trim(p_name), 'status', 'trial', 'plan', 'starter')
  );

  return v_org_id;
end;
$$;

-- Temps réel : nouvelles demandes visibles immédiatement dans le dashboard
do $$
begin
  alter publication supabase_realtime add table public.demo_requests;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

-- Compte plateforme : m.karfa@hotmail.com = Super Admin uniquement
do $$
declare
  v_uid uuid;
begin
  select u.id into v_uid
  from auth.users u
  where lower(u.email) = lower('m.karfa@hotmail.com');

  if v_uid is not null then
    perform public.promote_to_super_admin(v_uid);
  end if;
end;
$$;

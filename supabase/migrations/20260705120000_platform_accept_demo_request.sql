-- =============================================================================
-- Acceptation demande démo : transaction atomique (org + abonnement + profil gérant)
-- Rollback dédié en cas d'échec post-création (ex. e-mail Resend).
-- =============================================================================

update public.demo_requests
set status = 'Acceptée'
where status = 'Essai gratuit';

-- Acceptation complète (appelée après création du compte Auth gérant)
create or replace function public.platform_accept_demo_request(
  p_prospect_id uuid,
  p_manager_user_id uuid,
  p_manager_email text,
  p_manager_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prospect public.demo_requests;
  v_org_id uuid;
  v_plan_id uuid;
  v_trial_days int := 30;
  v_trial_start timestamptz := now();
  v_trial_end timestamptz;
begin
  if not app.is_super_admin() then
    raise exception 'Accès réservé au Super Admin';
  end if;

  if not exists (select 1 from auth.users where id = p_manager_user_id) then
    raise exception 'Compte gérant Auth introuvable : %', p_manager_user_id;
  end if;

  select *
  into v_prospect
  from public.demo_requests
  where id = p_prospect_id
  for update;

  if v_prospect.id is null then
    raise exception 'Demande introuvable : %', p_prospect_id;
  end if;

  if v_prospect.organization_id is not null then
    raise exception 'Une auto-école est déjà associée à cette demande';
  end if;

  if v_prospect.status = 'Refusée' then
    raise exception 'Impossible d''accepter une demande refusée';
  end if;

  if v_prospect.status = 'Acceptée' then
    raise exception 'Cette demande a déjà été acceptée';
  end if;

  insert into public.organizations (name, email, phone, status)
  values (
    trim(v_prospect.school_name),
    nullif(trim(v_prospect.email), ''),
    nullif(trim(v_prospect.phone), ''),
    'trial'
  )
  returning id into v_org_id;

  select id into v_plan_id
  from public.plans
  where code = 'starter' and is_active = true
  limit 1;

  if v_plan_id is null then
    select id into v_plan_id from public.plans where code = 'trial' limit 1;
  end if;

  v_trial_end := v_trial_start + make_interval(days => v_trial_days);

  if v_plan_id is not null then
    insert into public.subscriptions (
      organization_id,
      plan_id,
      status,
      trial_ends_at,
      current_period_start,
      current_period_end,
      metadata
    ) values (
      v_org_id,
      v_plan_id,
      'active',
      v_trial_end,
      v_trial_start,
      v_trial_end,
      jsonb_build_object(
        'trial_phase', true,
        'plan_code', 'starter',
        'trial_days', v_trial_days,
        'trial_started_at', v_trial_start,
        'trial_ends_at', v_trial_end
      )
    );
  end if;

  perform app.seed_default_packages(v_org_id);

  insert into public.profiles (id, organization_id, role, full_name, email, is_active)
  values (
    p_manager_user_id,
    v_org_id,
    'manager',
    coalesce(nullif(trim(p_manager_name), ''), 'Gérant'),
    lower(trim(p_manager_email)),
    true
  )
  on conflict (id) do update set
    organization_id = excluded.organization_id,
    role = 'manager',
    full_name = excluded.full_name,
    email = excluded.email,
    is_active = true;

  update public.demo_requests
  set
    status = 'Acceptée',
    organization_id = v_org_id,
    updated_at = now(),
    internal_notes = coalesce(v_prospect.internal_notes || E'\n', '') || format(
      '[%s] Acceptée — org %s, gérant %s, essai du %s au %s',
      to_char(v_trial_start at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      v_org_id,
      p_manager_user_id,
      to_char(v_trial_start at time zone 'UTC', 'YYYY-MM-DD'),
      to_char(v_trial_end at time zone 'UTC', 'YYYY-MM-DD')
    )
  where id = p_prospect_id;

  insert into public.billing_history (organization_id, event_type, new_value, notes)
  values (
    v_org_id,
    'trial_started',
    jsonb_build_object(
      'source', 'prospect_accept',
      'plan', 'starter',
      'trial_days', v_trial_days,
      'trial_started_at', v_trial_start,
      'trial_ends_at', v_trial_end
    ),
    'Essai Starter 30 jours — acceptation demande démo'
  );

  insert into public.audit_logs (
    organization_id,
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    entity_label,
    metadata
  ) values (
    v_org_id,
    auth.uid(),
    'super_admin',
    'create',
    'organizations',
    v_org_id,
    trim(v_prospect.school_name),
    jsonb_build_object(
      'source', 'prospect_accept',
      'prospect_id', p_prospect_id,
      'manager_user_id', p_manager_user_id,
      'trial_started_at', v_trial_start,
      'trial_ends_at', v_trial_end,
      'plan', 'starter'
    )
  );

  return jsonb_build_object(
    'organization_id', v_org_id,
    'trial_started_at', v_trial_start,
    'trial_ends_at', v_trial_end,
    'manager_user_id', p_manager_user_id
  );
end;
$$;

comment on function public.platform_accept_demo_request(uuid, uuid, text, text) is
  'Accepte une demande démo : org trial, abonnement Starter 30j, profil gérant, statut Acceptée.';

-- Rollback si une étape ultérieure échoue (ex. envoi e-mail)
create or replace function public.platform_rollback_demo_acceptance(
  p_prospect_id uuid,
  p_org_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app.is_super_admin() then
    raise exception 'Accès réservé au Super Admin';
  end if;

  if p_org_id is not null then
    delete from public.profiles where organization_id = p_org_id;
    delete from public.organizations where id = p_org_id;
  end if;

  update public.demo_requests
  set
    status = 'Nouvelle demande',
    organization_id = null,
    updated_at = now(),
    internal_notes = coalesce(internal_notes || E'\n', '') || format(
      '[%s] Rollback acceptation — org %s supprimée',
      to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      coalesce(p_org_id::text, 'n/a')
    )
  where id = p_prospect_id;
end;
$$;

comment on function public.platform_rollback_demo_acceptance(uuid, uuid) is
  'Annule une acceptation partielle : supprime l''org créée et remet la demande en attente.';

grant execute on function public.platform_accept_demo_request(uuid, uuid, text, text) to authenticated;
grant execute on function public.platform_rollback_demo_acceptance(uuid, uuid) to authenticated;

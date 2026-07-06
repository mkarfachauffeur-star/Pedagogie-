-- Bêta privée : maximum 5 auto-écoles pilotes (acceptation Super Admin)

create or replace function public.platform_pilot_org_count()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.demo_requests dr
  where dr.organization_id is not null
    and dr.status = 'Acceptée';
$$;

create or replace function public.get_beta_pilot_status(p_limit int default 5)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'limit', p_limit,
    'used', public.platform_pilot_org_count(),
    'remaining', greatest(0, p_limit - public.platform_pilot_org_count()),
    'accepts_new', public.platform_pilot_org_count() < p_limit
  );
$$;

grant execute on function public.get_beta_pilot_status(int) to anon, authenticated;

-- Ajoute la vérification limite bêta à l'acceptation existante
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
  v_pilot_limit int := 5;
begin
  if not app.is_super_admin() then
    raise exception 'Accès réservé au Super Admin';
  end if;

  if public.platform_pilot_org_count() >= v_pilot_limit then
    raise exception 'Limite bêta privée atteinte (% auto-écoles pilotes).', v_pilot_limit;
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

-- Un élève doit pouvoir accepter la charte même si l'auto-école est
-- en lecture seule (essai expiré, abonnement suspendu, etc.).
create or replace function app.accept_student_charter(p_charter_version_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := app.current_org_id();
  v_student_id uuid;
  v_charter public.student_engagement_charter_versions;
  v_acceptance public.student_charter_acceptances;
begin
  if app.current_role() <> 'student' then
    raise exception 'Permission denied';
  end if;

  select s.id into v_student_id
  from public.students s
  where s.profile_id = auth.uid()
    and s.organization_id = v_org_id;

  if v_student_id is null then
    raise exception 'Élève introuvable.';
  end if;

  select * into v_charter
  from public.student_engagement_charter_versions v
  where v.id = p_charter_version_id
    and v.organization_id = v_org_id
    and v.is_active = true;

  if v_charter.id is null then
    raise exception 'Cette version de la charte n''est plus active.';
  end if;

  insert into public.student_charter_acceptances (
    organization_id,
    student_id,
    charter_version_id,
    accepted_at
  ) values (
    v_org_id,
    v_student_id,
    v_charter.id,
    now()
  )
  on conflict (student_id, charter_version_id) do update
    set accepted_at = excluded.accepted_at
  returning * into v_acceptance;

  return jsonb_build_object(
    'needs_acceptance', false,
    'acceptance', jsonb_build_object(
      'accepted_at', v_acceptance.accepted_at,
      'charter_version_id', v_acceptance.charter_version_id
    )
  );
end;
$$;

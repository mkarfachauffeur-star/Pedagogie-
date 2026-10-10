-- Sécurité : empêcher un compte élève de créer des rendez-vous pédagogiques
-- en appelant directement le RPC.
--
-- public.add_aac_pedagogical_appointment est SECURITY DEFINER : il écrit dans
-- public.aac_rvp en contournant la politique RLS aac_rvp_write_staff. Jusqu'ici
-- son seul contrôle était app.can_access_student(p_student_id), qui est vrai
-- pour l'élève lui-même (s.profile_id = auth.uid()). Un élève pouvait donc
-- insérer des RVP via l'API sans passer par l'interface enseignant.
--
-- La fonction est réécrite à l'identique, avec en plus le même contrôle de
-- rôle que la politique RLS : manager, secretary, teacher (et service_role).
-- Aucune donnée existante n'est modifiée.

create or replace function public.add_aac_pedagogical_appointment(p_student_id uuid)
returns public.aac_rvp
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_next integer;
  v_row public.aac_rvp;
begin
  if auth.role() <> 'service_role'
     and app.current_role() not in ('manager', 'secretary', 'teacher') then
    raise exception 'Seul le personnel peut gérer les rendez-vous pédagogiques.';
  end if;

  if not app.can_access_student(p_student_id) and auth.role() <> 'service_role' then
    raise exception 'Accès refusé';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_student_id::text, 0::bigint));
  perform app.ensure_aac_profile(p_student_id, null);

  select organization_id into v_org
  from public.students
  where id = p_student_id;

  select coalesce(max(sequence), 2) + 1 into v_next
  from public.aac_rvp
  where student_id = p_student_id;

  if v_next < 3 then
    v_next := 3;
  end if;

  if v_next > 20 then
    raise exception 'Impossible d’ajouter un rendez-vous pédagogique supplémentaire.';
  end if;

  insert into public.aac_rvp (organization_id, student_id, sequence, is_additional)
  values (v_org, p_student_id, v_next, true)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.add_aac_pedagogical_appointment(uuid) from public;
grant execute on function public.add_aac_pedagogical_appointment(uuid) to authenticated, service_role;

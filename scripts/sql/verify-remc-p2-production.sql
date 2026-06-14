-- Vérification post-migration P2 REMC (à exécuter dans Supabase SQL Editor)
-- Attendu : toutes les lignes retournent true / des comptages ≥ 0

-- 1. Tables présentes
select
  to_regclass('public.student_remc_item_progress') is not null as remc_item_progress_ok,
  to_regclass('public.student_remc_history') is not null as remc_history_ok;

-- 2. Colonnes clés
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('student_remc_item_progress', 'student_remc_history')
order by table_name, ordinal_position;

-- 3. Triggers historique
select tgname, tgrelid::regclass as table_name
from pg_trigger
where tgname in (
  'trg_log_remc_item_history',
  'trg_log_competency_validation_history'
)
and not tgisinternal;

-- 4. Realtime (publication supabase_realtime)
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename in ('student_remc_item_progress', 'student_remc_history', 'student_competency_validations')
order by tablename;

-- 5. RPC statistiques
select
  to_regprocedure('public.get_remc_student_stats(uuid)') is not null as rpc_student_stats_ok,
  to_regprocedure('public.get_remc_organization_stats(uuid)') is not null as rpc_org_stats_ok;

-- 6. RLS activé
select relname, relrowsecurity
from pg_class
where relname in ('student_remc_item_progress', 'student_remc_history');

-- 7. Données existantes (aperçu)
select
  (select count(*) from public.student_remc_item_progress) as item_progress_rows,
  (select count(*) from public.student_remc_history) as history_rows,
  (select count(*) from public.student_competency_validations) as competency_validation_rows;

-- 8. Test fonctionnel historique (simulation — NE PAS exécuter en prod si vous ne voulez pas de données test)
-- Décommentez uniquement sur un environnement de test :
/*
insert into public.student_remc_item_progress (
  organization_id, student_id, competency_code, item_id, status, updated_by
)
select
  s.organization_id,
  s.id,
  'C1',
  'c1a',
  'En cours',
  null
from public.students s
limit 1
on conflict (student_id, item_id) do update set status = excluded.status;

select record_type, competency_code, item_id, new_status, changed_at
from public.student_remc_history
order by changed_at desc
limit 5;
*/

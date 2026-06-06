-- =============================================================================
-- PEDAGOGIA DRIVE — 0005 — Documents : Storage + métadonnées de dépôt
-- =============================================================================
-- Source unique = Supabase Storage. Deux origines possibles :
--   - 'direct'     : téléversé depuis la page Documents (bucket student-documents)
--   - 'messagerie' : classé depuis une pièce jointe (bucket message-attachments)
-- =============================================================================

-- Métadonnées de dépôt / classement
alter table public.documents add column if not exists storage_bucket text not null default 'student-documents';
alter table public.documents add column if not exists source text not null default 'direct';
alter table public.documents add column if not exists sent_at timestamptz;       -- date d'envoi (origine)
alter table public.documents add column if not exists sender_name text;          -- auteur de l'envoi
alter table public.documents add column if not exists classified_at timestamptz not null default now(); -- date de classement

-- Bucket privé des documents déposés directement.
insert into storage.buckets (id, name, public)
values ('student-documents', 'student-documents', false)
on conflict (id) do nothing;

-- Convention de chemin : {student_id}/{horodatage}-{nom}
-- Accès : selon le droit d'accès au dossier élève (app.can_access_student).
drop policy if exists "student_docs_read" on storage.objects;
create policy "student_docs_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'student-documents' and app.can_access_student(nullif(split_part(name, '/', 1), '')::uuid));

drop policy if exists "student_docs_insert" on storage.objects;
create policy "student_docs_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'student-documents' and app.can_access_student(nullif(split_part(name, '/', 1), '')::uuid));

drop policy if exists "student_docs_delete" on storage.objects;
create policy "student_docs_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'student-documents' and app.can_access_student(nullif(split_part(name, '/', 1), '')::uuid));

-- Temps réel sur les documents.
do $$ begin
  alter publication supabase_realtime add table public.documents;
exception when duplicate_object then null; end $$;

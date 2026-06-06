-- =============================================================================
-- PEDAGOGIA DRIVE — 0004 — Pièces jointes (Supabase Storage)
-- =============================================================================
-- Bucket privé pour les pièces jointes de messagerie. Convention de chemin :
--   {conversation_id}/{message_id}/{horodatage}-{nom_fichier}
-- Les droits d'accès reposent sur la participation à la conversation
-- (1er segment du chemin = conversation_id), via app.is_conversation_participant.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('message-attachments', 'message-attachments', false)
on conflict (id) do nothing;

-- Lecture : uniquement les participants de la conversation.
drop policy if exists "msg_attach_read" on storage.objects;
create policy "msg_attach_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'message-attachments'
    and app.is_conversation_participant(nullif(split_part(name, '/', 1), '')::uuid)
  );

-- Écriture : uniquement les participants de la conversation.
drop policy if exists "msg_attach_insert" on storage.objects;
create policy "msg_attach_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'message-attachments'
    and app.is_conversation_participant(nullif(split_part(name, '/', 1), '')::uuid)
  );

-- Suppression : participants (ménage éventuel).
drop policy if exists "msg_attach_delete" on storage.objects;
create policy "msg_attach_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'message-attachments'
    and app.is_conversation_participant(nullif(split_part(name, '/', 1), '')::uuid)
  );

-- Temps réel sur les nouvelles pièces jointes.
do $$ begin
  alter publication supabase_realtime add table public.message_attachments;
exception when duplicate_object then null; end $$;

-- Permettre aux élèves de déposer un document sur leur propre dossier.
drop policy if exists documents_insert_student on public.documents;
create policy documents_insert_student on public.documents
  for insert
  to authenticated
  with check (
    organization_id = app.current_org_id()
    and app.current_role() = 'student'
    and exists (
      select 1
      from public.students s
      where s.id = student_id
        and s.profile_id = auth.uid()
    )
  );

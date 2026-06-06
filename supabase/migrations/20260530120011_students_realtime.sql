-- Realtime sync for student registrations (gérant + secrétariat)
do $$ begin
  alter publication supabase_realtime add table public.students;
exception
  when duplicate_object then null;
end $$;

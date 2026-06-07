-- Permettre à un utilisateur de lire son propre profil même si current_org_id() est indéterminé.
create or replace function app.can_view_profile(p_target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles t
    where t.id = p_target
      and (
        t.id = auth.uid()
        or (
          t.organization_id = app.current_org_id()
          and (
            app.is_admin_staff()
            or (app.current_role() = 'teacher' and (
                  t.role in ('manager','secretary','teacher')
                  or exists (select 1 from public.students s
                              where s.profile_id = t.id and app.is_teacher_of_student(s.id))
            ))
            or (app.current_role() = 'student' and t.role in ('secretary','teacher'))
          )
        )
      )
  )
$$;

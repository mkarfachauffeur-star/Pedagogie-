-- Collecte d'avis utilisateurs (élèves) + tableau Super Admin

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  student_name text not null,
  school_name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  platform text not null default 'Web',
  app_version text not null default '0.0.0',
  account_created_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint reviews_student_unique unique (student_id)
);

create index if not exists idx_reviews_organization_id on public.reviews (organization_id);
create index if not exists idx_reviews_rating on public.reviews (rating);
create index if not exists idx_reviews_platform on public.reviews (platform);
create index if not exists idx_reviews_created_at on public.reviews (created_at desc);
create index if not exists idx_reviews_student_name on public.reviews using gin (to_tsvector('french', student_name));
create index if not exists idx_reviews_school_name on public.reviews using gin (to_tsvector('french', school_name));

-- Notifications plateforme (Super Admin uniquement)
create table if not exists public.platform_notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  review_id uuid references public.reviews(id) on delete set null,
  is_read boolean not null default false,
  is_priority boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_notifications_unread
  on public.platform_notifications (profile_id, is_read, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function app.student_review_eligible(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and p.role = 'student'
      and coalesce(p.is_active, true) = true
      and p.created_at + interval '15 days' <= now()
  );
$$;

create or replace function app.student_has_review(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reviews r
    where r.profile_id = p_profile_id
  );
$$;

-- Statut avis pour l'élève connecté
create or replace function app.student_review_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_eligible boolean := false;
  v_submitted boolean := false;
begin
  if app.current_role() <> 'student' then
    return jsonb_build_object('needs_review', false, 'eligible', false, 'submitted', false);
  end if;

  v_eligible := app.student_review_eligible(v_profile_id);
  v_submitted := app.student_has_review(v_profile_id);

  return jsonb_build_object(
    'needs_review', v_eligible and not v_submitted,
    'eligible', v_eligible,
    'submitted', v_submitted
  );
end;
$$;

create or replace function public.student_review_status()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select app.student_review_status();
$$;

grant execute on function public.student_review_status() to authenticated;

-- Notifications Super Admin (nouvel avis)
create or replace function app.notify_super_admins_new_review(
  p_review_id uuid,
  p_student_name text,
  p_school_name text,
  p_rating smallint,
  p_comment text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin record;
  v_title text;
  v_body text;
  v_priority boolean := p_rating <= 2;
begin
  if v_priority then
    v_title := '⚠️ Avis négatif reçu';
    v_body := format(
      'L''élève %s a attribué %s étoile(s).',
      p_student_name,
      p_rating
    );
    if p_comment is not null then
      v_body := v_body || E'\n\n' || left(p_comment, 200);
    end if;
    v_body := v_body || E'\n\nMerci de consulter son commentaire.';
  else
    v_title := '⭐ Nouvel avis reçu';
    v_body := format(
      '%s de %s a attribué %s étoile(s).',
      p_student_name,
      p_school_name,
      p_rating
    );
    if p_comment is not null then
      v_body := v_body || E'\n\n' || left(p_comment, 200);
    end if;
  end if;

  for v_admin in
    select distinct profile_id
    from (
      select sa.profile_id
      from public.super_admins sa
      where sa.is_active = true
      union all
      select p.id
      from public.profiles p
      where p.role = 'super_admin'::public.app_role
        and coalesce(p.is_active, true) = true
    ) admins
  loop
    insert into public.platform_notifications (
      profile_id,
      notification_type,
      title,
      body,
      review_id,
      is_priority
    ) values (
      v_admin.profile_id,
      case when v_priority then 'review_negative' else 'review_received' end,
      v_title,
      v_body,
      p_review_id,
      v_priority
    );
  end loop;
end;
$$;

-- Soumission avis (une seule fois, non modifiable)
create or replace function app.submit_student_review(
  p_rating smallint,
  p_comment text,
  p_platform text,
  p_app_version text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student record;
  v_org record;
  v_profile record;
  v_review_id uuid;
  v_name text;
begin
  if app.current_role() <> 'student' then
    raise exception 'Action réservée aux élèves.';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Note invalide (1 à 5 étoiles).';
  end if;

  if not app.student_review_eligible(auth.uid()) then
    raise exception 'L''avis n''est pas encore disponible (15 jours après la création du compte).';
  end if;

  if app.student_has_review(auth.uid()) then
    raise exception 'Vous avez déjà envoyé votre avis.';
  end if;

  select s.*, p.created_at as profile_created_at, p.full_name as profile_full_name
  into v_student
  from public.students s
  join public.profiles p on p.id = s.profile_id
  where s.profile_id = auth.uid()
  limit 1;

  if v_student.id is null then
    raise exception 'Dossier élève introuvable.';
  end if;

  select o.id, o.name into v_org
  from public.organizations o
  where o.id = v_student.organization_id;

  v_name := trim(
    coalesce(v_student.first_name, '') || ' ' || coalesce(v_student.last_name, '')
  );
  if v_name = '' then
    v_name := coalesce(v_student.profile_full_name, 'Élève');
  end if;

  insert into public.reviews (
    student_id,
    profile_id,
    organization_id,
    student_name,
    school_name,
    rating,
    comment,
    platform,
    app_version,
    account_created_at
  ) values (
    v_student.id,
    auth.uid(),
    v_student.organization_id,
    v_name,
    coalesce(v_org.name, 'Auto-école'),
    p_rating,
    nullif(trim(coalesce(p_comment, '')), ''),
    coalesce(nullif(trim(p_platform), ''), 'Web'),
    coalesce(nullif(trim(p_app_version), ''), '0.0.0'),
    v_student.profile_created_at
  )
  returning id into v_review_id;

  perform app.notify_super_admins_new_review(v_review_id, v_name, coalesce(v_org.name, 'Auto-école'), p_rating, nullif(trim(coalesce(p_comment, '')), ''));

  return jsonb_build_object(
    'ok', true,
    'review_id', v_review_id,
    'rating', p_rating
  );
end;
$$;

create or replace function public.submit_student_review(
  p_rating smallint,
  p_comment text default null,
  p_platform text default 'Web',
  p_app_version text default '0.0.0'
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select app.submit_student_review(p_rating, p_comment, p_platform, p_app_version);
$$;

grant execute on function public.submit_student_review(smallint, text, text, text) to authenticated;

-- Statistiques tableau de bord (Super Admin)
create or replace function app.platform_get_review_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not app.is_super_admin() then
    raise exception 'Accès réservé au Super Admin.';
  end if;

  select jsonb_build_object(
    'average_rating', coalesce(round(avg(r.rating)::numeric, 2), 0),
    'total_count', count(*)::int,
    'today_count', count(*) filter (where r.created_at >= date_trunc('day', now()))::int,
    'week_count', count(*) filter (where r.created_at >= date_trunc('week', now()))::int,
    'month_count', count(*) filter (where r.created_at >= date_trunc('month', now()))::int,
    'satisfaction_percent', coalesce(
      round(
        100.0 * count(*) filter (where r.rating >= 4)::numeric
        / nullif(count(*)::numeric, 0),
        1
      ),
      0
    ),
    'distribution', jsonb_build_object(
      '5', count(*) filter (where r.rating = 5)::int,
      '4', count(*) filter (where r.rating = 4)::int,
      '3', count(*) filter (where r.rating = 3)::int,
      '2', count(*) filter (where r.rating = 2)::int,
      '1', count(*) filter (where r.rating = 1)::int
    ),
    'monthly_evolution', coalesce((
      select jsonb_agg(row order by row->>'month')
      from (
        select jsonb_build_object(
          'month', to_char(date_trunc('month', r2.created_at), 'YYYY-MM'),
          'count', count(*)::int,
          'average', coalesce(round(avg(r2.rating)::numeric, 2), 0)
        ) as row
        from public.reviews r2
        where r2.created_at >= date_trunc('month', now()) - interval '11 months'
        group by date_trunc('month', r2.created_at)
      ) sub
    ), '[]'::jsonb),
    'average_by_organization', coalesce((
      select jsonb_agg(row order by (row->>'average')::numeric desc)
      from (
        select jsonb_build_object(
          'organization_id', r3.organization_id,
          'school_name', r3.school_name,
          'average', round(avg(r3.rating)::numeric, 2),
          'count', count(*)::int
        ) as row
        from public.reviews r3
        group by r3.organization_id, r3.school_name
      ) sub
    ), '[]'::jsonb),
    'top_rated_organizations', coalesce((
      select jsonb_agg(row order by (row->>'average')::numeric desc, (row->>'count')::int desc)
      from (
        select jsonb_build_object(
          'organization_id', r4.organization_id,
          'school_name', r4.school_name,
          'average', round(avg(r4.rating)::numeric, 2),
          'count', count(*)::int
        ) as row
        from public.reviews r4
        group by r4.organization_id, r4.school_name
        having count(*) >= 1
        order by avg(r4.rating) desc, count(*) desc
        limit 10
      ) sub
    ), '[]'::jsonb),
    'top_volume_organizations', coalesce((
      select jsonb_agg(row order by (row->>'count')::int desc)
      from (
        select jsonb_build_object(
          'organization_id', r5.organization_id,
          'school_name', r5.school_name,
          'average', round(avg(r5.rating)::numeric, 2),
          'count', count(*)::int
        ) as row
        from public.reviews r5
        group by r5.organization_id, r5.school_name
        order by count(*) desc
        limit 10
      ) sub
    ), '[]'::jsonb)
  )
  into v_result
  from public.reviews r;

  return coalesce(v_result, jsonb_build_object(
    'average_rating', 0,
    'total_count', 0,
    'today_count', 0,
    'week_count', 0,
    'month_count', 0,
    'satisfaction_percent', 0,
    'distribution', jsonb_build_object('5', 0, '4', 0, '3', 0, '2', 0, '1', 0),
    'monthly_evolution', '[]'::jsonb,
    'average_by_organization', '[]'::jsonb,
    'top_rated_organizations', '[]'::jsonb,
    'top_volume_organizations', '[]'::jsonb
  ));
end;
$$;

create or replace function public.platform_get_review_dashboard()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select app.platform_get_review_dashboard();
$$;

grant execute on function public.platform_get_review_dashboard() to authenticated;

-- Liste filtrée des avis
create or replace function app.platform_list_reviews(
  p_search text default null,
  p_organization_id uuid default null,
  p_rating smallint default null,
  p_platform text default null,
  p_date_from date default null,
  p_date_to date default null,
  p_limit int default 500,
  p_offset int default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_rows jsonb;
  v_total int;
begin
  if not app.is_super_admin() then
    raise exception 'Accès réservé au Super Admin.';
  end if;

  select count(*)::int into v_total
  from public.reviews r
  where (p_organization_id is null or r.organization_id = p_organization_id)
    and (p_rating is null or r.rating = p_rating)
    and (p_platform is null or r.platform = p_platform)
    and (p_date_from is null or r.created_at::date >= p_date_from)
    and (p_date_to is null or r.created_at::date <= p_date_to)
    and (
      p_search is null
      or trim(p_search) = ''
      or r.student_name ilike '%' || trim(p_search) || '%'
      or r.school_name ilike '%' || trim(p_search) || '%'
    );

  select coalesce(jsonb_agg(to_jsonb(row) order by row.created_at desc), '[]'::jsonb)
  into v_rows
  from (
    select
      r.id,
      r.student_id,
      r.organization_id as school_id,
      r.student_name,
      r.school_name,
      r.rating,
      r.comment,
      r.platform,
      r.app_version,
      r.account_created_at,
      r.created_at
    from public.reviews r
    where (p_organization_id is null or r.organization_id = p_organization_id)
      and (p_rating is null or r.rating = p_rating)
      and (p_platform is null or r.platform = p_platform)
      and (p_date_from is null or r.created_at::date >= p_date_from)
      and (p_date_to is null or r.created_at::date <= p_date_to)
      and (
        p_search is null
        or trim(p_search) = ''
        or r.student_name ilike '%' || trim(p_search) || '%'
        or r.school_name ilike '%' || trim(p_search) || '%'
      )
    order by r.created_at desc
    limit greatest(1, least(coalesce(p_limit, 500), 2000))
    offset greatest(coalesce(p_offset, 0), 0)
  ) row;

  return jsonb_build_object('reviews', v_rows, 'total', v_total);
end;
$$;

create or replace function public.platform_list_reviews(
  p_search text default null,
  p_organization_id uuid default null,
  p_rating smallint default null,
  p_platform text default null,
  p_date_from date default null,
  p_date_to date default null,
  p_limit int default 500,
  p_offset int default 0
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select app.platform_list_reviews(
    p_search, p_organization_id, p_rating, p_platform, p_date_from, p_date_to, p_limit, p_offset
  );
$$;

grant execute on function public.platform_list_reviews(text, uuid, smallint, text, date, date, int, int) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.reviews enable row level security;
alter table public.platform_notifications enable row level security;

drop policy if exists reviews_student_insert on public.reviews;
create policy reviews_student_insert on public.reviews
  for insert
  with check (
    profile_id = auth.uid()
    and app.current_role() = 'student'
    and not app.student_has_review(auth.uid())
    and app.student_review_eligible(auth.uid())
  );

drop policy if exists reviews_student_select_own on public.reviews;
create policy reviews_student_select_own on public.reviews
  for select
  using (profile_id = auth.uid());

drop policy if exists reviews_super_admin_select on public.reviews;
create policy reviews_super_admin_select on public.reviews
  for select
  using (app.is_super_admin());

drop policy if exists platform_notifications_select on public.platform_notifications;
create policy platform_notifications_select on public.platform_notifications
  for select
  using (profile_id = auth.uid() and app.is_super_admin());

drop policy if exists platform_notifications_update on public.platform_notifications;
create policy platform_notifications_update on public.platform_notifications
  for update
  using (profile_id = auth.uid() and app.is_super_admin())
  with check (profile_id = auth.uid() and app.is_super_admin());

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'platform_notifications'
  ) then
    alter publication supabase_realtime add table public.platform_notifications;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reviews'
  ) then
    alter publication supabase_realtime add table public.reviews;
  end if;
end $$;

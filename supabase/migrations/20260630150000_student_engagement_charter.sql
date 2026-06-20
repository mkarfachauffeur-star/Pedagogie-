-- Charte d'engagement élève : versions par établissement + acceptations horodatées

create table if not exists public.student_engagement_charter_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  title text not null default 'Charte d''engagement de l''élève',
  content text not null,
  is_active boolean not null default false,
  published_at timestamptz not null default now(),
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint student_engagement_charter_versions_unique unique (organization_id, version_number)
);

create index if not exists idx_student_engagement_charter_versions_org_active
  on public.student_engagement_charter_versions (organization_id, is_active);

create table if not exists public.student_charter_acceptances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  charter_version_id uuid not null references public.student_engagement_charter_versions(id) on delete cascade,
  accepted_at timestamptz not null default now(),
  constraint student_charter_acceptances_unique unique (student_id, charter_version_id)
);

create index if not exists idx_student_charter_acceptances_student
  on public.student_charter_acceptances (student_id, accepted_at desc);

comment on table public.student_engagement_charter_versions is
  'Versions publiées de la charte d''engagement élève par auto-école.';
comment on table public.student_charter_acceptances is
  'Acceptations horodatées de la charte par élève et par version.';

-- ─── Helpers ────────────────────────────────────────────────────────────────

create or replace function app.default_student_charter_content()
returns text
language sql
immutable
as $$
  select $charter$# Charte d'engagement de l'élève

Bienvenue sur Pedagogia Drive.

Afin de garantir une formation de qualité et une relation de confiance entre l'élève, l'enseignant et l'auto-école, je m'engage à respecter les règles suivantes :

## 1. Être acteur de ma formation

* Participer activement à mon apprentissage.
* Réaliser les QCU, exercices et activités proposés.
* Consulter régulièrement mon livret numérique et les documents mis à disposition.
* Travailler entre les leçons afin de progresser efficacement.

## 2. Faire preuve de motivation et d'assiduité

* M'investir sérieusement dans ma formation.
* Respecter les rendez-vous et les consignes pédagogiques.
* Arriver à l'heure aux cours théoriques et pratiques.
* Prévenir l'auto-école dans les meilleurs délais en cas de retard, d'absence ou d'empêchement.

## 3. Respecter les enseignants et le personnel de l'auto-école

* Adopter un comportement respectueux et courtois.
* Être à l'écoute des conseils et remarques de mon enseignant.
* Respecter le travail du personnel administratif et pédagogique.
* Favoriser un climat de confiance, de respect et de bienveillance.

## 4. Communiquer en cas de difficulté

* Signaler toute difficulté rencontrée dans ma formation.
* Faire remonter tout problème pédagogique, technique ou organisationnel.
* Informer l'auto-école de toute situation pouvant impacter ma progression.

## 5. Respecter les règles de sécurité

* Appliquer les consignes de sécurité routière.
* Adopter un comportement responsable pendant les leçons.
* Respecter le matériel, les véhicules et les équipements mis à disposition.

## Validation

Je reconnais avoir pris connaissance de cette charte et m'engage à la respecter durant toute ma formation.$charter$;
$$;

create or replace function app.ensure_active_student_charter(p_org_id uuid)
returns public.student_engagement_charter_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.student_engagement_charter_versions;
begin
  select * into v_row
  from public.student_engagement_charter_versions v
  where v.organization_id = p_org_id
    and v.is_active = true
  order by v.version_number desc
  limit 1;

  if v_row.id is not null then
    return v_row;
  end if;

  insert into public.student_engagement_charter_versions (
    organization_id,
    version_number,
    title,
    content,
    is_active,
    published_at
  ) values (
    p_org_id,
    1,
    'Charte d''engagement de l''élève',
    app.default_student_charter_content(),
    true,
    now()
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function app.get_student_charter_status()
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

  v_charter := app.ensure_active_student_charter(v_org_id);

  select a.* into v_acceptance
  from public.student_charter_acceptances a
  where a.student_id = v_student_id
    and a.charter_version_id = v_charter.id;

  return jsonb_build_object(
    'needs_acceptance', v_acceptance.id is null,
    'charter', jsonb_build_object(
      'id', v_charter.id,
      'version_number', v_charter.version_number,
      'title', v_charter.title,
      'content', v_charter.content,
      'published_at', v_charter.published_at
    ),
    'acceptance', case
      when v_acceptance.id is null then null
      else jsonb_build_object(
        'accepted_at', v_acceptance.accepted_at,
        'charter_version_id', v_acceptance.charter_version_id
      )
    end
  );
end;
$$;

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
  if app.current_role() <> 'student' or not app.can_write_org() then
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

create or replace function app.publish_student_charter(
  p_content text,
  p_title text default 'Charte d''engagement de l''élève'
)
returns public.student_engagement_charter_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := app.current_org_id();
  v_next_version integer;
  v_row public.student_engagement_charter_versions;
begin
  if not app.is_admin_staff() or not app.can_write_org() then
    raise exception 'Permission denied';
  end if;

  if nullif(btrim(p_content), '') is null then
    raise exception 'Le contenu de la charte est obligatoire.';
  end if;

  select coalesce(max(v.version_number), 0) + 1 into v_next_version
  from public.student_engagement_charter_versions v
  where v.organization_id = v_org_id;

  update public.student_engagement_charter_versions
  set is_active = false
  where organization_id = v_org_id
    and is_active = true;

  insert into public.student_engagement_charter_versions (
    organization_id,
    version_number,
    title,
    content,
    is_active,
    published_at,
    published_by
  ) values (
    v_org_id,
    v_next_version,
    coalesce(nullif(btrim(p_title), ''), 'Charte d''engagement de l''élève'),
    btrim(p_content),
    true,
    now(),
    auth.uid()
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function app.get_student_charter_acceptance(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_charter public.student_engagement_charter_versions;
  v_acceptance public.student_charter_acceptances;
begin
  if not (
    app.is_admin_staff()
    or app.is_teacher_of_student(p_student_id)
    or exists (
      select 1 from public.students s
      where s.id = p_student_id and s.profile_id = auth.uid()
    )
  ) then
    raise exception 'Permission denied';
  end if;

  select * into v_charter
  from public.student_engagement_charter_versions v
  where v.organization_id = app.current_org_id()
    and v.is_active = true
  order by v.version_number desc
  limit 1;

  if v_charter.id is null then
    return jsonb_build_object('accepted', false, 'needs_acceptance', true);
  end if;

  select a.* into v_acceptance
  from public.student_charter_acceptances a
  where a.student_id = p_student_id
    and a.charter_version_id = v_charter.id;

  return jsonb_build_object(
    'accepted', v_acceptance.id is not null,
    'needs_acceptance', v_acceptance.id is null,
    'charter_version_number', v_charter.version_number,
    'accepted_at', v_acceptance.accepted_at,
    'charter_title', v_charter.title
  );
end;
$$;

revoke all on function app.get_student_charter_status() from public;
revoke all on function app.accept_student_charter(uuid) from public;
revoke all on function app.publish_student_charter(text, text) from public;
revoke all on function app.get_student_charter_acceptance(uuid) from public;

grant execute on function app.get_student_charter_status() to authenticated;
grant execute on function app.accept_student_charter(uuid) to authenticated;
grant execute on function app.publish_student_charter(text, text) to authenticated;
grant execute on function app.get_student_charter_acceptance(uuid) to authenticated;

create or replace function public.get_student_charter_status()
returns jsonb
language sql
security definer
set search_path = public
as $$ select app.get_student_charter_status(); $$;

create or replace function public.accept_student_charter(p_charter_version_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$ select app.accept_student_charter(p_charter_version_id); $$;

create or replace function public.publish_student_charter(p_content text, p_title text default 'Charte d''engagement de l''élève')
returns public.student_engagement_charter_versions
language sql
security definer
set search_path = public
as $$ select app.publish_student_charter(p_content, p_title); $$;

create or replace function public.get_student_charter_acceptance(p_student_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$ select app.get_student_charter_acceptance(p_student_id); $$;

grant execute on function public.get_student_charter_status() to authenticated;
grant execute on function public.accept_student_charter(uuid) to authenticated;
grant execute on function public.publish_student_charter(text, text) to authenticated;
grant execute on function public.get_student_charter_acceptance(uuid) to authenticated;

-- ─── RLS ────────────────────────────────────────────────────────────────────

alter table public.student_engagement_charter_versions enable row level security;
alter table public.student_charter_acceptances enable row level security;

drop policy if exists student_engagement_charter_versions_select on public.student_engagement_charter_versions;
create policy student_engagement_charter_versions_select on public.student_engagement_charter_versions
  for select using (
    organization_id = app.current_org_id()
    and (
      app.is_admin_staff()
      or app.current_role() = 'student'
      or app.current_role() = 'teacher'
    )
  );

drop policy if exists student_engagement_charter_versions_write on public.student_engagement_charter_versions;
create policy student_engagement_charter_versions_write on public.student_engagement_charter_versions
  for all using (
    organization_id = app.current_org_id()
    and app.is_admin_staff()
    and app.can_write_org()
  ) with check (
    organization_id = app.current_org_id()
    and app.is_admin_staff()
    and app.can_write_org()
  );

drop policy if exists student_charter_acceptances_select on public.student_charter_acceptances;
create policy student_charter_acceptances_select on public.student_charter_acceptances
  for select using (
    organization_id = app.current_org_id()
    and (
      app.is_admin_staff()
      or app.is_teacher_of_student(student_id)
      or exists (
        select 1 from public.students s
        where s.id = student_id and s.profile_id = auth.uid()
      )
    )
  );

drop policy if exists student_charter_acceptances_insert on public.student_charter_acceptances;
create policy student_charter_acceptances_insert on public.student_charter_acceptances
  for insert with check (
    organization_id = app.current_org_id()
    and exists (
      select 1 from public.students s
      where s.id = student_id and s.profile_id = auth.uid()
    )
  );

-- Seed v1 for existing organizations
insert into public.student_engagement_charter_versions (
  organization_id,
  version_number,
  title,
  content,
  is_active,
  published_at
)
select
  o.id,
  1,
  'Charte d''engagement de l''élève',
  app.default_student_charter_content(),
  true,
  now()
from public.organizations o
where not exists (
  select 1
  from public.student_engagement_charter_versions v
  where v.organization_id = o.id
);

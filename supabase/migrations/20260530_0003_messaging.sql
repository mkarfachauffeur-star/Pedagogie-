-- =============================================================================
-- PEDAGOGIA DRIVE — 0003 — Messagerie temps réel (multi-tenant + RLS + Realtime)
-- =============================================================================
-- Conversations + participants + messages + accusés de lecture + notifications.
-- Permissions de mise en relation appliquées par `app.can_converse` (matrice
-- des rôles) et un trigger de validation des participants.
-- =============================================================================

create type public.conversation_kind as enum ('internal','student');

-- -----------------------------------------------------------------------------
-- Conversations
-- -----------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind public.conversation_kind not null,
  subject text,
  created_by uuid not null references public.profiles(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_conversations_org on public.conversations (organization_id, last_message_at desc);

-- Participants (+ pointeur de lecture pour compteur de non-lus rapide)
create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);
create index if not exists idx_participants_profile on public.conversation_participants (profile_id);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_conv_time on public.messages (conversation_id, created_at desc);

-- Pièces jointes (Storage) — prévues dès la V1 pour éviter une migration future
create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  storage_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

-- Accusés de lecture par destinataire : Envoyé (message) / Reçu / Lu
create table if not exists public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  primary key (message_id, profile_id)
);

-- Notifications (badge cloche + compteur non-lus)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  message_id uuid references public.messages(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_unread on public.notifications (profile_id, is_read);

-- =============================================================================
-- Fonctions de sécurité messagerie
-- =============================================================================
create or replace function app.is_conversation_participant(p_conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conv and cp.profile_id = auth.uid()
  )
$$;

create or replace function app.is_conversation_creator(p_conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conv and c.created_by = auth.uid()
  )
$$;

-- Matrice : l'utilisateur courant peut-il converser avec p_target ?
create or replace function app.can_converse(p_target uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_my_role public.app_role := app.current_role();
  v_my_org uuid := app.current_org_id();
  v_role public.app_role;
  v_org uuid;
  v_allow_tt boolean;
begin
  if p_target = auth.uid() then return false; end if;
  select role, organization_id into v_role, v_org from public.profiles where id = p_target;
  if v_role is null or v_org <> v_my_org then return false; end if;

  -- Interne : staff <-> staff
  if v_my_role in ('manager','secretary','teacher') and v_role in ('manager','secretary','teacher') then
    if v_my_role = 'teacher' and v_role = 'teacher' then
      select allow_teacher_to_teacher into v_allow_tt from public.organizations where id = v_my_org;
      return coalesce(v_allow_tt, false);
    end if;
    return true; -- gérant<->enseignant, gérant<->secrétariat, enseignant<->secrétariat
  end if;

  -- Secrétariat <-> élève
  if (v_my_role = 'secretary' and v_role = 'student')
     or (v_my_role = 'student' and v_role = 'secretary') then
    return true;
  end if;

  -- Enseignant <-> élève affecté
  if v_my_role = 'teacher' and v_role = 'student' then
    return exists (select 1 from public.students s
                   where s.profile_id = p_target and app.is_teacher_of_student(s.id));
  end if;
  if v_my_role = 'student' and v_role = 'teacher' then
    return exists (select 1 from public.students s
                   join public.student_assignments sa on sa.student_id = s.id
                   where s.profile_id = auth.uid() and sa.teacher_id = p_target);
  end if;

  -- Gérant <-> élève : interdit
  return false;
end $$;

-- =============================================================================
-- Triggers
-- =============================================================================

-- Validation d'un participant ajouté : même organisation + autorisation de
-- mise en relation avec le créateur de la conversation.
create or replace function app.validate_participant()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_creator uuid;
  v_conv_org uuid;
  v_part_org uuid;
begin
  select created_by, organization_id into v_creator, v_conv_org
  from public.conversations where id = new.conversation_id;

  select organization_id into v_part_org from public.profiles where id = new.profile_id;
  if v_part_org is distinct from v_conv_org then
    raise exception 'Participant hors de l''organisation de la conversation';
  end if;

  -- Le créateur peut toujours se joindre ; sinon la matrice s'applique.
  if new.profile_id <> v_creator and not app.can_converse(new.profile_id) then
    raise exception 'Mise en relation non autorisée par les règles de rôle';
  end if;
  return new;
end $$;

drop trigger if exists trg_validate_participant on public.conversation_participants;
create trigger trg_validate_participant
  before insert on public.conversation_participants
  for each row execute function app.validate_participant();

-- À chaque message : MAJ last_message_at, accusés "Reçu", notifications.
create or replace function app.on_message_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
    set last_message_at = new.created_at
    where id = new.conversation_id;

  -- Accusé "Reçu" + notification pour chaque participant sauf l'expéditeur.
  insert into public.message_reads (message_id, profile_id, delivered_at)
  select new.id, cp.profile_id, now()
  from public.conversation_participants cp
  where cp.conversation_id = new.conversation_id
    and cp.profile_id <> new.sender_id;

  insert into public.notifications (organization_id, profile_id, conversation_id, message_id)
  select new.organization_id, cp.profile_id, new.conversation_id, new.id
  from public.conversation_participants cp
  where cp.conversation_id = new.conversation_id
    and cp.profile_id <> new.sender_id;

  return new;
end $$;

drop trigger if exists trg_on_message_insert on public.messages;
create trigger trg_on_message_insert
  after insert on public.messages
  for each row execute function app.on_message_insert();

-- =============================================================================
-- RLS — messagerie
-- =============================================================================
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.message_reads enable row level security;
alter table public.notifications enable row level security;

-- conversations
drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations
  for select using (app.is_conversation_participant(id));

drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations
  for insert with check (organization_id = app.current_org_id() and created_by = auth.uid());

drop policy if exists conversations_update on public.conversations;
create policy conversations_update on public.conversations
  for update using (app.is_conversation_participant(id))
  with check (app.is_conversation_participant(id));

-- participants
drop policy if exists participants_select on public.conversation_participants;
create policy participants_select on public.conversation_participants
  for select using (app.is_conversation_participant(conversation_id));

drop policy if exists participants_insert on public.conversation_participants;
create policy participants_insert on public.conversation_participants
  for insert with check (app.is_conversation_creator(conversation_id) or profile_id = auth.uid());

-- Mise à jour de son propre pointeur de lecture (last_read_at).
drop policy if exists participants_update_self on public.conversation_participants;
create policy participants_update_self on public.conversation_participants
  for update using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- messages
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select using (app.is_conversation_participant(conversation_id));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid()
    and organization_id = app.current_org_id()
    and app.is_conversation_participant(conversation_id)
  );

-- message_attachments : visibles/insérables par les participants du message.
drop policy if exists attachments_select on public.message_attachments;
create policy attachments_select on public.message_attachments
  for select using (
    app.is_conversation_participant((select conversation_id from public.messages m where m.id = message_id))
  );

drop policy if exists attachments_insert on public.message_attachments;
create policy attachments_insert on public.message_attachments
  for insert with check (
    exists (select 1 from public.messages m where m.id = message_id and m.sender_id = auth.uid())
  );

-- message_reads : visibles par les participants (accusés de lecture) ;
-- chacun ne met à jour que SA propre ligne (passage à "Lu").
drop policy if exists reads_select on public.message_reads;
create policy reads_select on public.message_reads
  for select using (
    app.is_conversation_participant((select conversation_id from public.messages m where m.id = message_id))
  );

drop policy if exists reads_update_self on public.message_reads;
create policy reads_update_self on public.message_reads
  for update using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- notifications : strictement personnelles.
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select using (profile_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- =============================================================================
-- Realtime : diffusion des changements (RLS appliquée côté abonnement).
-- =============================================================================
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.message_reads;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null; end $$;

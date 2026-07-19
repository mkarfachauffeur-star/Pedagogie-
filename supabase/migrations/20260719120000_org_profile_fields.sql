-- =============================================================================
-- Profil auto-école : manager_name + website sur pré-inscription
-- Les colonnes identité (name, address, postal_code, city, phone, email, siret,
-- prefecture_approval, website, logo_storage_path, created_at, updated_at)
-- existent déjà sur public.organizations (20260530120008_saas_core).
-- =============================================================================

alter table public.organizations
  add column if not exists manager_name text;

comment on column public.organizations.name is
  'Nom commercial de l''auto-école (company_name).';
comment on column public.organizations.manager_name is
  'Nom du gérant (dénormalisé pour PDF / documents administratifs).';
comment on column public.organizations.address is
  'Adresse (rue / numéro).';
comment on column public.organizations.postal_code is
  'Code postal (5 chiffres).';
comment on column public.organizations.city is
  'Ville.';
comment on column public.organizations.phone is
  'Téléphone de l''établissement.';
comment on column public.organizations.email is
  'E-mail de contact de l''auto-école.';
comment on column public.organizations.siret is
  'SIRET (14 chiffres).';
comment on column public.organizations.prefecture_approval is
  'Numéro d''agrément préfectoral (optionnel).';
comment on column public.organizations.website is
  'Site internet (optionnel).';
comment on column public.organizations.logo_storage_path is
  'Chemin Storage bucket org-assets (logo).';

-- Pré-inscription : site web optionnel
alter table public.organization_signup_requests
  add column if not exists website text;

comment on column public.organization_signup_requests.website is
  'Site internet déclaré à la pré-inscription (optionnel).';

-- Vue stable pour documents (PDF, attestations, factures…)
create or replace view public.org_document_profile
with (security_invoker = true)
as
select
  o.id as organization_id,
  o.name as company_name,
  o.manager_name,
  o.address as street_address,
  o.postal_code,
  o.city,
  o.phone,
  o.email,
  o.siret,
  o.prefecture_approval as approval_number,
  o.website,
  o.logo_storage_path,
  o.created_at,
  o.updated_at
from public.organizations o;

grant select on public.org_document_profile to authenticated;

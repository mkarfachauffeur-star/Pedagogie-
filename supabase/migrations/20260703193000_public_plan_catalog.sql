-- Catalogue tarifaire public (pages légales CGV — lecture anon)

create or replace function public.get_public_plan_catalog()
returns table (
  code text,
  name text,
  description text,
  price_cents int,
  currency text,
  billing_interval text,
  trial_days int,
  max_students int,
  metadata jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.code,
    p.name,
    p.description,
    p.price_cents,
    p.currency,
    p.interval::text as billing_interval,
    p.trial_days,
    p.max_students,
    p.metadata
  from public.plans p
  where p.is_active = true
    and p.code in ('trial', 'starter', 'premium')
  order by p.price_cents asc, p.code asc;
$$;

grant execute on function public.get_public_plan_catalog() to anon, authenticated;

comment on function public.get_public_plan_catalog() is
  'Catalogue tarifaire public pour CGV et pages commerciales (trial, starter, premium).';

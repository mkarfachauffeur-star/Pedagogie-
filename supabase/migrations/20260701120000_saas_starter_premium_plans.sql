-- Plans SaaS Pedagogia Drive — Starter 79 €/mois, Premium 99 €/mois (engagement annuel)
-- Tarifs visibles uniquement côté Super Admin (table plans, RLS staff + super_admin).

update public.plans set is_active = false where code in ('monthly', 'annual');

insert into public.plans (code, name, description, price_cents, interval, trial_days, max_students, metadata)
values
  (
    'starter',
    'Starter',
    'Abonnement Starter — engagement annuel, facturation mensuelle',
    7900,
    'month',
    0,
    50,
    '{"commitment":"annual","billing":"monthly"}'::jsonb
  ),
  (
    'premium',
    'Premium',
    'Abonnement Premium — engagement annuel, facturation mensuelle',
    9900,
    'month',
    0,
    null,
    '{"commitment":"annual","billing":"monthly"}'::jsonb
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  interval = excluded.interval,
  max_students = excluded.max_students,
  metadata = excluded.metadata,
  is_active = true;

update public.plans
set
  name = 'Essai gratuit',
  description = '30 jours, toutes fonctionnalités',
  trial_days = 30,
  price_cents = 0,
  is_active = true
where code = 'trial';

-- Anciens abonnements « monthly » → Starter
update public.subscriptions s
set plan_id = p_starter.id, updated_at = now()
from public.plans p_old, public.plans p_starter
where s.plan_id = p_old.id
  and p_old.code = 'monthly'
  and p_starter.code = 'starter';

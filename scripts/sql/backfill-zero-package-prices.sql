-- Complète les tarifs manquants (CS, moto, code) pour les orgs existantes à 0 €
update public.pricing_packages pkg
set
  price_ttc = case pkg.category
    when 'cs' then 890
    when 'moto' then 990
    when 'code' then 290
    else pkg.price_ttc
  end,
  admin_fee_ttc = case
    when pkg.category in ('cs', 'moto') and pkg.admin_fee_ttc = 0 then 150
    else pkg.admin_fee_ttc
  end,
  extra_hour_price_ttc = case
    when pkg.category = 'cs' and pkg.extra_hour_price_ttc = 0 then 55
    when pkg.category = 'moto' and pkg.extra_hour_price_ttc = 0 then 65
    else pkg.extra_hour_price_ttc
  end,
  exam_presentation_included = case
    when pkg.category in ('cs', 'moto') then true
    when pkg.category = 'code' then false
    else pkg.exam_presentation_included
  end,
  exam_presentation_ttc = case
    when pkg.category in ('cs', 'moto') and pkg.exam_presentation_ttc = 0 then 250
    else pkg.exam_presentation_ttc
  end,
  updated_at = now()
where pkg.price_ttc = 0
  and pkg.category in ('cs', 'moto', 'code');

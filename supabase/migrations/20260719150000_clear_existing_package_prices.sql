-- Remet à vide les tarifs des formules pour toutes les auto-écoles existantes.
-- Les contrats / paiements déjà enregistrés ne sont pas modifiés.

update public.pricing_packages
set
  price_ttc = 0,
  admin_fee_ttc = 0,
  extra_hour_price_ttc = 0,
  exam_presentation_included = false,
  exam_presentation_ttc = 0,
  rvp_included = false,
  rvp_ttc = 0,
  rvp1_included = false,
  rvp1_ttc = 0,
  rvp2_included = false,
  rvp2_ttc = 0,
  rvp3_included = false,
  rvp3_ttc = 0,
  updated_at = now()
where
  price_ttc <> 0
  or admin_fee_ttc <> 0
  or extra_hour_price_ttc <> 0
  or exam_presentation_ttc <> 0
  or exam_presentation_included
  or coalesce(rvp_ttc, 0) <> 0
  or coalesce(rvp1_ttc, 0) <> 0
  or coalesce(rvp2_ttc, 0) <> 0
  or coalesce(rvp3_ttc, 0) <> 0
  or coalesce(rvp_included, false)
  or coalesce(rvp1_included, false)
  or coalesce(rvp2_included, false)
  or coalesce(rvp3_included, false);

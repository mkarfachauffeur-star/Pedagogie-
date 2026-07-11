-- Données métier fictives — Auto-École Horizon Drive
-- Véhicules, tarifs, contrats, paiements, heures effectuées, examens, documents
-- Exécution : npx supabase db query --linked -f scripts/sql/horizon-enrich-business-data.sql

do $$
declare
  v_org_id uuid;
  v_teacher1 uuid;
  v_teacher2 uuid;
  v_secretary uuid;
  v_pkg_20 uuid;
  v_pkg_aac uuid;
  v_vehicle_ids uuid[];
  v_vehicle_id uuid;
  v_student_id uuid;
  v_appt record;
  v_i int;
  v_start timestamptz;
begin
  select p.organization_id into v_org_id
  from public.profiles p
  where p.email = 'horizon.gerant@demo.pedagogia.local'
  limit 1;

  if v_org_id is null then
    raise exception 'Auto-École Horizon Drive introuvable';
  end if;

  select p.id into v_teacher1 from public.profiles p where p.email = 'horizon.enseignant1@demo.pedagogia.local';
  select p.id into v_teacher2 from public.profiles p where p.email = 'horizon.enseignant2@demo.pedagogia.local';
  select p.id into v_secretary from public.profiles p where p.email = 'horizon.secretaire@demo.pedagogia.local';

  -- Tarifs formules
  update public.pricing_packages set
    price_ttc = 1290, admin_fee_ttc = 150, extra_hour_price_ttc = 55,
    exam_presentation_included = true, exam_presentation_ttc = 250
  where organization_id = v_org_id and name = 'Forfait 20h Boîte Manuelle';

  update public.pricing_packages set
    price_ttc = 1190, admin_fee_ttc = 150, extra_hour_price_ttc = 55,
    exam_presentation_included = true, exam_presentation_ttc = 250
  where organization_id = v_org_id and name = 'Forfait 13h Boîte Automatique';

  update public.pricing_packages set
    price_ttc = 1590, admin_fee_ttc = 150, extra_hour_price_ttc = 55,
    exam_presentation_included = true, exam_presentation_ttc = 250
  where organization_id = v_org_id and name ilike 'Conduite Accompagnée%';

  update public.pricing_packages set
    price_ttc = 890, admin_fee_ttc = 150, extra_hour_price_ttc = 55,
    exam_presentation_included = true, exam_presentation_ttc = 250
  where organization_id = v_org_id and category = 'cs';

  update public.pricing_packages set
    price_ttc = 990, admin_fee_ttc = 150, extra_hour_price_ttc = 65,
    exam_presentation_included = true, exam_presentation_ttc = 250
  where organization_id = v_org_id and category = 'moto';

  update public.pricing_packages set
    price_ttc = 290, admin_fee_ttc = 0, extra_hour_price_ttc = 0,
    exam_presentation_included = false, exam_presentation_ttc = 0
  where organization_id = v_org_id and category = 'code';

  select id into v_pkg_20 from public.pricing_packages
  where organization_id = v_org_id and name = 'Forfait 20h Boîte Manuelle';

  select id into v_pkg_aac from public.pricing_packages
  where organization_id = v_org_id and name ilike 'Conduite Accompagnée%';

  -- Autorisations enseignants
  update public.teachers set
    authorization_number = 'A0752400001',
    authorization_expires_at = '2028-06-30',
    authorized_categories = array['B']
  where profile_id = v_teacher1;

  update public.teachers set
    authorization_number = 'A0752400002',
    authorization_expires_at = '2028-09-15',
    authorized_categories = array['B']
  where profile_id = v_teacher2;

  -- Flotte
  delete from public.vehicles where organization_id = v_org_id;

  insert into public.vehicles (organization_id, brand, model, plate, energy, details)
  values
    (v_org_id, 'Renault', 'Clio V', 'AB-123-CD', 'essence', jsonb_build_object(
      'gearbox', 'manuelle',
      'mileage', 45230, 'monthlyKm', 1180, 'availability', 'Disponible', 'cleanliness', 'propre',
      'fuelLevel', 72, 'averageConsumption', 5.8, 'estimatedRange', 420, 'generalState', 'Bon',
      'technicalControl', '2026-12-15', 'insuranceExpiry', '2027-06-30',
      'fuelLogs', jsonb_build_array(jsonb_build_object(
        'id', 'fl-1', 'date', (current_date - 5)::text, 'teacher', 'Thomas Garcia',
        'mileage', 45100, 'liters', 42, 'price', 68.50, 'fuelType', 'SP95', 'station', 'Total Paris 11'
      )),
      'maintenanceLogs', jsonb_build_array(jsonb_build_object(
        'id', 'ml-1', 'type', 'Lavage extérieur', 'date', (current_date - 3)::text,
        'reporter', 'Nicolas Rodriguez', 'observations', 'Véhicule prêt pour la semaine'
      ))
    )),
    (v_org_id, 'Peugeot', '208', 'EF-456-GH', 'diesel', jsonb_build_object(
      'gearbox', 'automatique',
      'mileage', 62100, 'monthlyKm', 1420, 'availability', 'Disponible', 'cleanliness', 'propre',
      'fuelLevel', 55, 'averageConsumption', 4.9, 'estimatedRange', 510, 'generalState', 'Bon',
      'technicalControl', '2027-03-20', 'insuranceExpiry', '2027-08-01',
      'fuelLogs', jsonb_build_array(jsonb_build_object(
        'id', 'fl-2', 'date', (current_date - 2)::text, 'teacher', 'Nicolas Rodriguez',
        'mileage', 62020, 'liters', 38, 'price', 61.20, 'fuelType', 'Gazole', 'station', 'Intermarché'
      ))
    )),
    (v_org_id, 'Citroën', 'C3', 'IJ-789-KL', 'hybride', jsonb_build_object(
      'gearbox', 'manuelle',
      'mileage', 18400, 'monthlyKm', 890, 'availability', 'En leçon', 'cleanliness', 'propre',
      'fuelLevel', 88, 'batteryLevel', 76, 'chargingStatus', 'Chargé', 'averageConsumption', 4.2,
      'estimatedRange', 380, 'generalState', 'Excellent', 'technicalControl', '2027-01-10',
      'insuranceExpiry', '2027-04-15'
    ));

  select array_agg(id order by created_at) into v_vehicle_ids
  from public.vehicles where organization_id = v_org_id;

  -- Contrats & paiements par élève
  delete from public.payments where organization_id = v_org_id;

  -- Marie Dupont — 20h, 8h effectuées
  select s.id into v_student_id from public.students s
  where s.organization_id = v_org_id and s.email = 'horizon.eleve01@demo.pedagogia.local';

  update public.students set package_id = v_pkg_20, extra_hours = 0 where id = v_student_id;
  insert into public.contracts (
    organization_id, student_id, package_id, package_price_ttc, admin_fee_ttc,
    exam_presentation_ttc, extra_hours, signed_at, status
  ) values (
    v_org_id, v_student_id, v_pkg_20, 1290, 150, 250, 0, current_date - 45, 'signed'
  ) on conflict (student_id) do update set
    package_id = excluded.package_id, package_price_ttc = excluded.package_price_ttc,
    admin_fee_ttc = excluded.admin_fee_ttc, exam_presentation_ttc = excluded.exam_presentation_ttc,
    extra_hours = 0, signed_at = excluded.signed_at, status = 'signed';

  insert into public.payments (organization_id, student_id, amount, paid_at, method, nature, comment, created_by) values
    (v_org_id, v_student_id, 400, current_date - 44, 'Carte bancaire', 'Inscription', 'Acompte à l''inscription', v_secretary),
    (v_org_id, v_student_id, 500, current_date - 20, 'Chèque', 'Forfait', '2e versement forfait 20h', v_secretary),
    (v_org_id, v_student_id, 290, current_date - 5, 'Virement', 'Solde', 'Solde dossier Marie Dupont', v_secretary);

  -- Lucas Martin — 30h (20+10), 12h effectuées
  select s.id into v_student_id from public.students s
  where s.organization_id = v_org_id and s.email = 'horizon.eleve02@demo.pedagogia.local';

  update public.students set package_id = v_pkg_20, extra_hours = 10 where id = v_student_id;
  insert into public.contracts (
    organization_id, student_id, package_id, package_price_ttc, admin_fee_ttc,
    exam_presentation_ttc, extra_hours, extra_hours_amount_ttc, signed_at, status
  ) values (
    v_org_id, v_student_id, v_pkg_20, 1290, 150, 250, 10, 550, current_date - 60, 'signed'
  ) on conflict (student_id) do update set
    package_id = excluded.package_id, package_price_ttc = excluded.package_price_ttc,
    admin_fee_ttc = excluded.admin_fee_ttc, exam_presentation_ttc = excluded.exam_presentation_ttc,
    extra_hours = 10, extra_hours_amount_ttc = 550, signed_at = excluded.signed_at, status = 'signed';

  insert into public.payments (organization_id, student_id, amount, paid_at, method, nature, comment, created_by) values
    (v_org_id, v_student_id, 500, current_date - 58, 'Espèces', 'Inscription', 'Acompte Lucas Martin', v_secretary),
    (v_org_id, v_student_id, 800, current_date - 30, 'Carte bancaire', 'Forfait', 'Versement intermédiaire', v_secretary),
    (v_org_id, v_student_id, 400, current_date - 8, 'Chèque', 'Forfait', 'Paiement partiel avant examen', v_secretary);

  -- Emma Bernard — AAC 20h, 6h effectuées
  select s.id into v_student_id from public.students s
  where s.organization_id = v_org_id and s.email = 'horizon.eleve03@demo.pedagogia.local';

  update public.students set package_id = v_pkg_aac, extra_hours = 0 where id = v_student_id;
  insert into public.contracts (
    organization_id, student_id, package_id, package_price_ttc, admin_fee_ttc,
    exam_presentation_ttc, extra_hours, signed_at, status
  ) values (
    v_org_id, v_student_id, v_pkg_aac, 1590, 150, 250, 0, current_date - 90, 'signed'
  ) on conflict (student_id) do update set
    package_id = excluded.package_id, package_price_ttc = excluded.package_price_ttc,
    admin_fee_ttc = excluded.admin_fee_ttc, exam_presentation_ttc = excluded.exam_presentation_ttc,
    extra_hours = 0, signed_at = excluded.signed_at, status = 'signed';

  insert into public.payments (organization_id, student_id, amount, paid_at, method, nature, comment, created_by) values
    (v_org_id, v_student_id, 600, current_date - 88, 'Virement', 'Inscription', 'Acompte AAC', v_secretary),
    (v_org_id, v_student_id, 700, current_date - 40, 'Carte bancaire', 'Forfait', 'Versement forfait AAC', v_secretary);

  -- Hugo Petit — 20h, 4h effectuées
  select s.id into v_student_id from public.students s
  where s.organization_id = v_org_id and s.email = 'horizon.eleve04@demo.pedagogia.local';

  update public.students set package_id = v_pkg_20, extra_hours = 0 where id = v_student_id;
  insert into public.contracts (
    organization_id, student_id, package_id, package_price_ttc, admin_fee_ttc,
    exam_presentation_ttc, extra_hours, signed_at, status
  ) values (
    v_org_id, v_student_id, v_pkg_20, 1290, 150, 250, 0, current_date - 21, 'signed'
  ) on conflict (student_id) do update set
    package_id = excluded.package_id, package_price_ttc = excluded.package_price_ttc,
    admin_fee_ttc = excluded.admin_fee_ttc, exam_presentation_ttc = excluded.exam_presentation_ttc,
    extra_hours = 0, signed_at = excluded.signed_at, status = 'signed';

  insert into public.payments (organization_id, student_id, amount, paid_at, method, nature, comment, created_by) values
    (v_org_id, v_student_id, 350, current_date - 20, 'Carte bancaire', 'Inscription', 'Acompte Hugo Petit', v_secretary),
    (v_org_id, v_student_id, 300, current_date - 7, 'Espèces', 'Forfait', '1er versement forfait', v_secretary);

  -- Léa Moreau — 20h, 10h effectuées
  select s.id into v_student_id from public.students s
  where s.organization_id = v_org_id and s.email = 'horizon.eleve05@demo.pedagogia.local';

  update public.students set package_id = v_pkg_20, extra_hours = 0 where id = v_student_id;
  insert into public.contracts (
    organization_id, student_id, package_id, package_price_ttc, admin_fee_ttc,
    exam_presentation_ttc, extra_hours, signed_at, status
  ) values (
    v_org_id, v_student_id, v_pkg_20, 1290, 150, 250, 0, current_date - 35, 'signed'
  ) on conflict (student_id) do update set
    package_id = excluded.package_id, package_price_ttc = excluded.package_price_ttc,
    admin_fee_ttc = excluded.admin_fee_ttc, exam_presentation_ttc = excluded.exam_presentation_ttc,
    extra_hours = 0, signed_at = excluded.signed_at, status = 'signed';

  insert into public.payments (organization_id, student_id, amount, paid_at, method, nature, comment, created_by) values
    (v_org_id, v_student_id, 400, current_date - 34, 'Chèque', 'Inscription', 'Acompte Léa Moreau', v_secretary),
    (v_org_id, v_student_id, 650, current_date - 12, 'Virement', 'Forfait', 'Versement forfait 20h', v_secretary);

  -- Nathan Durand — 30h, 2h effectuées, peu payé
  select s.id into v_student_id from public.students s
  where s.organization_id = v_org_id and s.email = 'horizon.eleve06@demo.pedagogia.local';

  update public.students set package_id = v_pkg_20, extra_hours = 10 where id = v_student_id;
  insert into public.contracts (
    organization_id, student_id, package_id, package_price_ttc, admin_fee_ttc,
    exam_presentation_ttc, extra_hours, extra_hours_amount_ttc, signed_at, status
  ) values (
    v_org_id, v_student_id, v_pkg_20, 1290, 150, 250, 10, 550, current_date - 10, 'signed'
  ) on conflict (student_id) do update set
    package_id = excluded.package_id, package_price_ttc = excluded.package_price_ttc,
    admin_fee_ttc = excluded.admin_fee_ttc, exam_presentation_ttc = excluded.exam_presentation_ttc,
    extra_hours = 10, extra_hours_amount_ttc = 550, signed_at = excluded.signed_at, status = 'signed';

  insert into public.payments (organization_id, student_id, amount, paid_at, method, nature, comment, created_by) values
    (v_org_id, v_student_id, 200, current_date - 9, 'Espèces', 'Inscription', 'Acompte Nathan Durand', v_secretary);

  delete from public.appointments
  where organization_id = v_org_id
    and notes = 'Leçon fictive démo — compétence REMC travaillée';

  -- Leçons passées (heures effectuées) — sans toucher au planning futur
  for v_appt in
    select
      s.id as student_id,
      cfg.hours,
      case
        when s.email in (
          'horizon.eleve01@demo.pedagogia.local',
          'horizon.eleve02@demo.pedagogia.local',
          'horizon.eleve05@demo.pedagogia.local'
        ) then v_teacher1
        else v_teacher2
      end as teacher_id
    from public.students s
    join (values
      ('horizon.eleve01@demo.pedagogia.local', 6),
      ('horizon.eleve02@demo.pedagogia.local', 10),
      ('horizon.eleve03@demo.pedagogia.local', 5),
      ('horizon.eleve04@demo.pedagogia.local', 3),
      ('horizon.eleve05@demo.pedagogia.local', 8),
      ('horizon.eleve06@demo.pedagogia.local', 1)
    ) as cfg(email, hours) on cfg.email = s.email
    where s.organization_id = v_org_id
  loop
    for v_i in 1..v_appt.hours loop
      v_start := date_trunc('day', now()) - ((v_appt.hours - v_i + 3) || ' days')::interval + (9 + (v_i % 4)) * interval '1 hour';
      insert into public.appointments (
        organization_id, student_id, teacher_id, vehicle_id, kind,
        starts_at, duration_minutes, status, notes
      ) values (
        v_org_id, v_appt.student_id, v_appt.teacher_id, v_vehicle_ids[1 + (v_i % array_length(v_vehicle_ids, 1))],
        'Leçon', v_start, 60, 'Terminé',
        'Leçon fictive démo — compétence REMC travaillée'
      );
    end loop;
  end loop;

  -- Véhicules sur le planning existant
  v_i := 0;
  for v_appt in
    select id from public.appointments
    where organization_id = v_org_id and vehicle_id is null
    order by starts_at
  loop
    v_i := v_i + 1;
    update public.appointments set
      vehicle_id = v_vehicle_ids[1 + ((v_i - 1) % array_length(v_vehicle_ids, 1))]
    where id = v_appt.id;
  end loop;

  -- Examens
  delete from public.exams where organization_id = v_org_id;

  select s.id into v_student_id from public.students s
  where s.organization_id = v_org_id and s.email = 'horizon.eleve02@demo.pedagogia.local';
  insert into public.exams (organization_id, student_id, teacher_id, type, exam_date, exam_time, center, status)
  values (v_org_id, v_student_id, v_teacher1, 'Permis B', current_date + 14, '10:30', 'Centre d''examen Paris 12', 'Confirmé');

  select s.id into v_student_id from public.students s
  where s.organization_id = v_org_id and s.email = 'horizon.eleve03@demo.pedagogia.local';
  insert into public.exams (organization_id, student_id, teacher_id, type, exam_date, exam_time, center, status)
  values (v_org_id, v_student_id, v_teacher2, 'Code', current_date - 30, '14:00', 'Centre d''examen Paris 11', 'Réussi');

  select s.id into v_student_id from public.students s
  where s.organization_id = v_org_id and s.email = 'horizon.eleve05@demo.pedagogia.local';
  insert into public.exams (organization_id, student_id, teacher_id, type, exam_date, exam_time, center, status)
  values (v_org_id, v_student_id, v_teacher1, 'Examen blanc', current_date + 3, '09:00', 'Auto-École Horizon Drive', 'À confirmer');

  -- Documents administratifs
  delete from public.documents where organization_id = v_org_id;

  insert into public.documents (organization_id, student_id, type, reference, received_date, status, folder, created_by)
  select v_org_id, s.id, d.type, d.reference, d.received_date, d.status, d.folder, v_secretary
  from public.students s
  join (values
    ('horizon.eleve01@demo.pedagogia.local', 'Pièce d''identité', 'CNI-MD-2024', current_date - 45, 'Validé', 'Dossier administratif'),
    ('horizon.eleve01@demo.pedagogia.local', 'Photo signature', 'PHOTO-MD', current_date - 44, 'Validé', 'Dossier administratif'),
    ('horizon.eleve02@demo.pedagogia.local', 'Pièce d''identité', 'CNI-LM-2024', current_date - 60, 'Validé', 'Dossier administratif'),
    ('horizon.eleve02@demo.pedagogia.local', 'Contrat signé', 'CTR-LM-2025', current_date - 58, 'Validé', 'Dossier administratif'),
    ('horizon.eleve03@demo.pedagogia.local', 'ASSR/JDC', 'ASSR-EB', current_date - 90, 'Validé', 'Dossier administratif'),
    ('horizon.eleve03@demo.pedagogia.local', 'Dossier ANTS', 'ANTS-EB', current_date - 85, 'À vérifier', 'Dossier administratif'),
    ('horizon.eleve04@demo.pedagogia.local', 'Justificatif de domicile', 'JDD-HP', current_date - 20, 'Validé', 'Dossier administratif'),
    ('horizon.eleve05@demo.pedagogia.local', 'Pièce d''identité', 'CNI-LM2', current_date - 35, 'Validé', 'Dossier administratif'),
    ('horizon.eleve06@demo.pedagogia.local', 'Photo signature', 'PHOTO-ND', current_date - 10, 'À compléter', 'Dossier administratif')
  ) as d(email, type, reference, received_date, status, folder) on d.email = s.email
  where s.organization_id = v_org_id;

  raise notice 'Données métier Horizon enrichies (org %)', v_org_id;
end $$;

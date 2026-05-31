import ExcelJS from 'exceljs'
import { supabase } from '../lib/supabase'
import {
  fetchExportLessons,
  fetchExportStudents,
} from './adminExports'
import {
  buildCsvContent,
  downloadCsv,
  formatDateFr,
  formatDurationMinutes,
  formatGeneratedAt,
  formatTimeFr,
  timestampForFilename,
  addMinutes,
} from '../utils/csvExport'

function referentTeacherName(student) {
  const assignments = student?.student_assignments || []
  const referent = assignments.find((row) => row.is_referent) || assignments[0]
  return referent?.teacher?.full_name || ''
}

function vehicleLabel(vehicle) {
  if (!vehicle) return ''
  return [vehicle.plate, vehicle.brand, vehicle.model].filter(Boolean).join(' · ')
}

async function fetchExams(filters) {
  let query = supabase
    .from('exams')
    .select(`
      id, type, exam_date, exam_time, center, status,
      student:student_id(first_name, last_name, file_number),
      teacher:teacher_id(full_name)
    `)
    .order('exam_date', { ascending: true })
  if (filters.dateFrom) query = query.gte('exam_date', filters.dateFrom)
  if (filters.dateTo) query = query.lte('exam_date', filters.dateTo)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function fetchContracts(filters) {
  let query = supabase
    .from('contracts')
    .select(`
      id, contract_total, package_price_ttc, admin_fee_ttc, exam_presentation_ttc,
      extra_hours, extra_hours_amount_ttc, signed_at, updated_at,
      student:student_id(first_name, last_name, file_number),
      package:package_id(name, category)
    `)
    .order('updated_at', { ascending: false })
  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function fetchVehicles() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, brand, model, plate, energy, created_at')
    .order('created_at')
  if (error) throw error
  return data || []
}

async function fetchPayments(filters) {
  let query = supabase
    .from('payments')
    .select(`
      id, amount, paid_at, method, nature, comment,
      student:student_id(first_name, last_name, file_number)
    `)
    .order('paid_at', { ascending: false })
  if (filters.dateFrom) query = query.gte('paid_at', filters.dateFrom)
  if (filters.dateTo) query = query.lte('paid_at', filters.dateTo)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function fetchTeachersRegulatory(filters) {
  let query = supabase
    .from('teachers')
    .select(`
      profile_id, created_at, authorization_number, authorization_expires_at, authorized_categories,
      profiles:profile_id(full_name, email, phone)
    `)
    .order('created_at')
  if (filters.dateFrom) query = query.gte('created_at', `${filters.dateFrom}T00:00:00`)
  if (filters.dateTo) query = query.lte('created_at', `${filters.dateTo}T23:59:59`)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function fetchOrgMeta() {
  const { data } = await supabase.from('organizations').select('name, siret, prefecture_approval, address, city, postal_code').single()
  return data
}

export async function fetchRegulatoryData(filters = {}) {
  const [org, students, teachers, lessons, exams, contracts, vehicles, payments] = await Promise.all([
    fetchOrgMeta(),
    fetchExportStudents(filters),
    fetchTeachersRegulatory(filters),
    fetchExportLessons({ ...filters, realizedOnly: true }),
    fetchExams(filters),
    fetchContracts(filters),
    fetchVehicles(),
    fetchPayments(filters),
  ])
  return { org, students, teachers, lessons, exams, contracts, vehicles, payments }
}

async function logExport(format, filters) {
  try {
    await supabase.rpc('log_audit_event', {
      p_action: 'export_regulatory',
      p_entity_type: 'export',
      p_entity_label: `Export réglementaire ${format}`,
      p_metadata: { format, filters },
    })
  } catch {
    // non bloquant
  }
}

function rowsStudents(students) {
  return students.map((s) => ({
    Nom: s.last_name || '',
    Prénom: s.first_name || '',
    Email: s.email || '',
    Téléphone: s.phone || '',
    'Date naissance': formatDateFr(s.birth_date),
    Adresse: [s.street_number, s.street].filter(Boolean).join(' '),
    'Code postal': s.postal_code || '',
    Ville: s.city || '',
    NEPH: s.neph || '',
    Formule: s.package_name || '',
    'N° dossier': s.file_number || '',
    Inscription: formatDateFr(s.registration_date),
    Statut: s.status || '',
    'Enseignant référent': referentTeacherName(s),
  }))
}

function rowsTeachers(teachers) {
  return teachers.map((t) => ({
    Nom: t.profiles?.full_name || '',
    Email: t.profiles?.email || '',
    Téléphone: t.profiles?.phone || '',
    'N° autorisation': t.authorization_number || '',
    'Validité autorisation': formatDateFr(t.authorization_expires_at),
    'Catégories autorisées': (t.authorized_categories || []).join(', '),
    'Date affectation': formatDateFr(t.created_at),
  }))
}

function rowsLessons(lessons) {
  return lessons.map((l) => {
    const endAt = addMinutes(l.starts_at, l.duration_minutes)
    const studentName = l.student ? `${l.student.last_name || ''} ${l.student.first_name || ''}`.trim() : ''
    return {
      Élève: studentName,
      Enseignant: l.teacher?.full_name || '',
      Date: formatDateFr(l.starts_at),
      Début: formatTimeFr(l.starts_at),
      Fin: formatTimeFr(endAt),
      Durée: formatDurationMinutes(l.duration_minutes),
      Type: l.kind || '',
      Véhicule: vehicleLabel(l.vehicle),
      Statut: l.status || '',
    }
  })
}

function rowsExams(exams) {
  return exams.map((e) => ({
    Élève: e.student ? `${e.student.last_name || ''} ${e.student.first_name || ''}`.trim() : '',
    Type: e.type || '',
    Date: formatDateFr(e.exam_date),
    Heure: e.exam_time || '',
    Centre: e.center || '',
    Statut: e.status || '',
    Enseignant: e.teacher?.full_name || '',
  }))
}

function rowsContracts(contracts) {
  return contracts.map((c) => ({
    Élève: c.student ? `${c.student.last_name || ''} ${c.student.first_name || ''}`.trim() : '',
    Formule: c.package?.name || '',
    'Prix forfait': c.package_price_ttc ?? '',
    'Frais admin': c.admin_fee_ttc ?? '',
    'Présentation examen': c.exam_presentation_ttc ?? '',
    'Heures supp.': c.extra_hours ?? 0,
    'Montant heures supp.': c.extra_hours_amount_ttc ?? '',
    'Total contrat': c.contract_total ?? '',
    'Date signature': formatDateFr(c.signed_at),
  }))
}

function rowsVehicles(vehicles) {
  return vehicles.map((v) => ({
    Immatriculation: v.plate || '',
    Marque: v.brand || '',
    Modèle: v.model || '',
    Énergie: v.energy || '',
  }))
}

function rowsPayments(payments) {
  return payments.map((p) => ({
    Élève: p.student ? `${p.student.last_name || ''} ${p.student.first_name || ''}`.trim() : '',
    Montant: p.amount ?? '',
    Date: formatDateFr(p.paid_at),
    Mode: p.method || '',
    Nature: p.nature || '',
    Commentaire: p.comment || '',
  }))
}

export async function exportRegulatoryCsv(filters = {}) {
  const generatedAt = formatGeneratedAt()
  const data = await fetchRegulatoryData(filters)
  await logExport('csv', filters)

  const sections = [
    ['Métadonnées', [{ Auto_école: data.org?.name, SIRET: data.org?.siret, Agrément: data.org?.prefecture_approval, Généré: generatedAt }]],
    ['Élèves', rowsStudents(data.students)],
    ['Enseignants', rowsTeachers(data.teachers)],
    ['Leçons réalisées', rowsLessons(data.lessons)],
    ['Examens', rowsExams(data.exams)],
    ['Contrats', rowsContracts(data.contracts)],
    ['Véhicules', rowsVehicles(data.vehicles)],
    ['Paiements', rowsPayments(data.payments)],
  ]

  const lines = [`Export réglementaire PEDAGOGIA DRIVE`, `Généré le;${generatedAt}`, '']
  sections.forEach(([title, rows]) => {
    lines.push(`SECTION;${title}`)
    if (rows.length === 0) {
      lines.push('(aucune donnée)')
    } else {
      const headers = Object.keys(rows[0])
      lines.push(headers.join(';'))
      rows.forEach((row) => {
        lines.push(headers.map((h) => {
          const text = row[h] == null ? '' : String(row[h])
          return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
        }).join(';'))
      })
    }
    lines.push('')
  })

  downloadCsv(`export-reglementaire_${timestampForFilename()}.csv`, `\uFEFF${lines.join('\r\n')}`)
}

export async function exportRegulatoryXlsx(filters = {}) {
  const generatedAt = formatGeneratedAt()
  const data = await fetchRegulatoryData(filters)
  await logExport('xlsx', filters)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'PEDAGOGIA DRIVE'
  workbook.created = new Date()

  const meta = workbook.addWorksheet('Métadonnées')
  meta.addRow(['Auto-école', data.org?.name || ''])
  meta.addRow(['SIRET', data.org?.siret || ''])
  meta.addRow(['Agrément préfectoral', data.org?.prefecture_approval || ''])
  meta.addRow(['Adresse', [data.org?.address, data.org?.postal_code, data.org?.city].filter(Boolean).join(' ')])
  meta.addRow(['Généré le', generatedAt])

  const sheets = [
    ['Élèves', rowsStudents(data.students)],
    ['Enseignants', rowsTeachers(data.teachers)],
    ['Leçons', rowsLessons(data.lessons)],
    ['Examens', rowsExams(data.exams)],
    ['Contrats', rowsContracts(data.contracts)],
    ['Véhicules', rowsVehicles(data.vehicles)],
    ['Paiements', rowsPayments(data.payments)],
  ]

  sheets.forEach(([name, rows]) => {
    const ws = workbook.addWorksheet(name.slice(0, 31))
    if (rows.length === 0) {
      ws.addRow(['Aucune donnée'])
      return
    }
    ws.addRow(Object.keys(rows[0]))
    rows.forEach((row) => ws.addRow(Object.values(row)))
    ws.getRow(1).font = { bold: true }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `export-reglementaire_${timestampForFilename()}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

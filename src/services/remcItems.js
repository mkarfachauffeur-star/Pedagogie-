import { supabase } from '../lib/supabase'
import {
  LEGACY_REMC_ITEM_IDS,
  REMC_DEFAULT_STATUS,
  REMC_ITEM_STATUSES,
  cloneRemcTemplate,
  computeRemcProgress,
  findRemcItemMeta,
  mergeRemcWithProgressRows,
  mergeRemcWithTemplate,
  normalizeRemcItemId,
  normalizeRemcStatus,
} from '../data/remcTemplate'
import { subscribePostgresChanges } from './realtime'

const LEGACY_TRACKING_KEYS = [
  'pedagogia-drive-student-tracking',
  'pedagogia-drive-student-tracking-v2',
]

const MIGRATION_MARKER_PREFIX = 'pedagogia:remc-db-migrated:'

function migrationMarkerKey(studentId) {
  return `${MIGRATION_MARKER_PREFIX}${studentId}`
}

function isMigrationDone(studentId) {
  if (typeof window === 'undefined' || !studentId) return true
  try {
    return window.localStorage.getItem(migrationMarkerKey(studentId)) === '1'
  } catch {
    return true
  }
}

function markMigrationDone(studentId) {
  if (typeof window === 'undefined' || !studentId) return
  try {
    window.localStorage.setItem(migrationMarkerKey(studentId), '1')
  } catch {
    // ignore
  }
}

function purgeLegacyRemcStorage(studentId) {
  if (typeof window === 'undefined') return
  try {
    LEGACY_TRACKING_KEYS.forEach((key) => window.localStorage.removeItem(key))
    Object.keys(window.localStorage)
      .filter(
        (key) =>
          key.startsWith('pedagogia:remc-competency:')
          || (studentId && key === `${MIGRATION_MARKER_PREFIX}${studentId}`),
      )
      .forEach((key) => {
        if (key !== migrationMarkerKey(studentId)) {
          window.localStorage.removeItem(key)
        }
      })
  } catch {
    // ignore
  }
}

function readLegacyRemcForStudent(studentId) {
  if (typeof window === 'undefined' || !studentId) return null

  for (const key of LEGACY_TRACKING_KEYS) {
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      const students = Array.isArray(parsed?.students) ? parsed.students : Array.isArray(parsed) ? parsed : []
      const match = students.find((row) => row.id === studentId)
      if (match?.remc?.length) {
        return mergeRemcWithTemplate(match.remc)
      }
    } catch {
      // ignore corrupt payload
    }
  }

  try {
    const scopedRaw = window.localStorage.getItem(`pedagogia:remc-competency:${studentId}`)
    if (scopedRaw) {
      const parsed = JSON.parse(scopedRaw)
      if (Array.isArray(parsed)) return mergeRemcWithTemplate(parsed)
    }
  } catch {
    // ignore
  }

  return null
}

function remcToUpsertRows(remcCompetencies, { studentId, organizationId, updatedBy, changeSource = 'migration' }) {
  const rows = []
  remcCompetencies.forEach((competency) => {
    ;(competency.items || []).forEach((item) => {
      const status = normalizeRemcStatus(item.status)
      if (status === REMC_DEFAULT_STATUS) return
      rows.push({
        organization_id: organizationId,
        student_id: studentId,
        competency_code: competency.code,
        item_id: normalizeRemcItemId(item.id),
        status,
        updated_by: updatedBy || null,
      })
    })
  })
  return rows
}

/** Importe les données REMC localStorage vers Supabase (une fois par élève). */
export async function migrateLocalStorageRemcIfNeeded({ studentId, organizationId, updatedBy }) {
  if (!studentId || !organizationId || isMigrationDone(studentId)) {
    return { migrated: false, error: null }
  }

  const legacyRemc = readLegacyRemcForStudent(studentId)
  if (!legacyRemc) {
    markMigrationDone(studentId)
    purgeLegacyRemcStorage(studentId)
    return { migrated: false, error: null }
  }

  const rows = remcToUpsertRows(legacyRemc, {
    studentId,
    organizationId,
    updatedBy,
    changeSource: 'migration',
  })

  if (!rows.length) {
    markMigrationDone(studentId)
    purgeLegacyRemcStorage(studentId)
    return { migrated: false, error: null }
  }

  try {
    const { error } = await supabase
      .from('student_remc_item_progress')
      .upsert(rows, { onConflict: 'student_id,item_id', ignoreDuplicates: false })

    if (error) throw error

    markMigrationDone(studentId)
    purgeLegacyRemcStorage(studentId)
    return { migrated: true, count: rows.length, error: null }
  } catch (error) {
    console.warn('[remcItems] migrateLocalStorageRemcIfNeeded', error)
    return { migrated: false, error }
  }
}

export async function fetchRemcItemProgressRows(studentId) {
  if (!studentId) return { rows: [], error: null }

  try {
    const { data, error } = await supabase
      .from('student_remc_item_progress')
      .select('item_id, competency_code, status, updated_at, updated_by')
      .eq('student_id', studentId)
      .order('competency_code', { ascending: true })

    if (error) throw error
    return { rows: data || [], error: null }
  } catch (error) {
    console.warn('[remcItems] fetchRemcItemProgressRows', error)
    return { rows: [], error }
  }
}

export async function fetchRemcProgress(studentId, options = {}) {
  const { organizationId, updatedBy, skipMigration = false } = options

  if (!studentId) {
    return {
      remc: cloneRemcTemplate(),
      progress: computeRemcProgress([]),
      rows: [],
      error: null,
    }
  }

  if (!skipMigration && organizationId) {
    await migrateLocalStorageRemcIfNeeded({ studentId, organizationId, updatedBy })
  }

  const { rows, error } = await fetchRemcItemProgressRows(studentId)
  const remc = mergeRemcWithProgressRows(rows)
  const progress = computeRemcProgress(remc)

  return { remc, progress, rows, error }
}

export async function updateRemcItemStatus({
  studentId,
  organizationId,
  competencyCode,
  itemId,
  status,
  updatedBy,
}) {
  if (!studentId || !organizationId || !itemId || !status) {
    return { remc: null, error: new Error('Paramètres manquants.') }
  }

  const normalizedStatus = normalizeRemcStatus(status)
  if (!REMC_ITEM_STATUSES.includes(normalizedStatus)) {
    return { remc: null, error: new Error('Statut REMC invalide.') }
  }

  const meta = findRemcItemMeta(normalizeRemcItemId(itemId))
  const resolvedCompetencyCode = competencyCode || meta?.competencyCode
  const resolvedItemId = normalizeRemcItemId(itemId)

  if (!resolvedCompetencyCode) {
    return { remc: null, error: new Error('Sous-compétence inconnue.') }
  }

  const row = {
    organization_id: organizationId,
    student_id: studentId,
    competency_code: resolvedCompetencyCode,
    item_id: resolvedItemId,
    status: normalizedStatus,
    updated_by: updatedBy || null,
    updated_at: new Date().toISOString(),
  }

  try {
    const { error } = await supabase
      .from('student_remc_item_progress')
      .upsert(row, { onConflict: 'student_id,item_id' })

    if (error) throw error
  } catch (error) {
    return { remc: null, error }
  }

  return fetchRemcProgress(studentId, { organizationId, updatedBy, skipMigration: true })
}

export async function fetchRemcHistory(studentId, { limit = 100 } = {}) {
  if (!studentId) return { history: [], error: null }

  try {
    const { data, error } = await supabase
      .from('student_remc_history')
      .select(`
        id,
        record_type,
        competency_code,
        item_id,
        previous_status,
        new_status,
        changed_at,
        changed_by,
        change_source,
        changed_by_profile:changed_by(full_name)
      `)
      .eq('student_id', studentId)
      .order('changed_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { history: data || [], error: null }
  } catch (error) {
    console.warn('[remcItems] fetchRemcHistory', error)
    return { history: [], error }
  }
}

export function subscribeRemcProgress(studentId, callback) {
  if (!studentId) return () => {}

  return subscribePostgresChanges({
    topicBase: `remc-items:${studentId}`,
    listeners: [
      {
        config: {
          event: '*',
          schema: 'public',
          table: 'student_remc_item_progress',
          filter: `student_id=eq.${studentId}`,
        },
        callback,
      },
      {
        config: {
          event: '*',
          schema: 'public',
          table: 'student_competency_validations',
          filter: `student_id=eq.${studentId}`,
        },
        callback,
      },
      {
        config: {
          event: 'INSERT',
          schema: 'public',
          table: 'student_remc_history',
          filter: `student_id=eq.${studentId}`,
        },
        callback,
      },
    ],
  })
}

/** Utilitaire export : liste des IDs legacy pour la migration. */
export { LEGACY_REMC_ITEM_IDS }

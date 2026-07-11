import { supabase } from '../lib/supabase'
import { formatGeneratedAt, downloadProfessionalCsv, downloadXlsxSheet, timestampForFilename } from '../utils/csvExport'

export async function fetchReviewDashboard() {
  try {
    const { data, error } = await supabase.rpc('platform_get_review_dashboard')
    if (error) throw error
    return { dashboard: data, error: null }
  } catch (error) {
    return { dashboard: null, error }
  }
}

export async function listPlatformReviews(filters = {}) {
  try {
    const { data, error } = await supabase.rpc('platform_list_reviews', {
      p_search: filters.search || null,
      p_organization_id: filters.organizationId || null,
      p_rating: filters.rating ? Number(filters.rating) : null,
      p_platform: filters.platform || null,
      p_date_from: filters.dateFrom || null,
      p_date_to: filters.dateTo || null,
      p_limit: filters.limit || 500,
      p_offset: filters.offset || 0,
    })
    if (error) throw error
    return {
      reviews: data?.reviews || [],
      total: data?.total || 0,
      error: null,
    }
  } catch (error) {
    return { reviews: [], total: 0, error }
  }
}

function formatReviewRow(review) {
  const created = review.created_at ? new Date(review.created_at) : null
  return {
    Date: created
      ? created.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      : '',
    Élève: review.student_name || '',
    'Auto-école': review.school_name || '',
    Étoiles: review.rating ?? '',
    Commentaire: review.comment || '',
    Plateforme: review.platform || '',
    Version: review.app_version || '',
  }
}

const EXPORT_HEADERS = ['Date', 'Élève', 'Auto-école', 'Étoiles', 'Commentaire', 'Plateforme', 'Version']

export async function exportReviewsCsv(reviews) {
  const rows = (reviews || []).map(formatReviewRow)
  downloadProfessionalCsv(`avis_pedagogia_${timestampForFilename()}.csv`, EXPORT_HEADERS, rows)
}

export async function exportReviewsXlsx(reviews) {
  const rows = (reviews || []).map(formatReviewRow)
  await downloadXlsxSheet({
    filename: `avis_pedagogia_${timestampForFilename()}.xlsx`,
    sheetName: 'Avis',
    headers: EXPORT_HEADERS,
    rows,
  })
}

export async function exportReviewsPdf(reviews, dashboard) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  doc.setFontSize(14)
  doc.text('Avis utilisateurs — Pedagogia Drive', 14, 16)
  doc.setFontSize(9)
  doc.text(`Généré le ${formatGeneratedAt()}`, 14, 22)

  if (dashboard) {
    doc.text(
      `Moyenne : ${dashboard.average_rating} · Total : ${dashboard.total_count} · Satisfaction (4-5★) : ${dashboard.satisfaction_percent}%`,
      14,
      28,
    )
  }

  autoTable(doc, {
    startY: 34,
    head: [EXPORT_HEADERS],
    body: (reviews || []).map((review) => EXPORT_HEADERS.map((header) => formatReviewRow(review)[header] ?? '')),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42] },
  })

  doc.save(`avis_pedagogia_${timestampForFilename()}.pdf`)
}

export async function fetchPlatformReviewOrganizations() {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('organization_id, school_name')
      .order('school_name', { ascending: true })
    if (error) throw error

    const map = new Map()
    for (const row of data || []) {
      if (!row.organization_id) continue
      map.set(row.organization_id, row.school_name)
    }
    return {
      organizations: [...map.entries()].map(([id, name]) => ({ id, name })),
      error: null,
    }
  } catch (error) {
    return { organizations: [], error }
  }
}

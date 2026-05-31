/** CSV UTF-8 BOM + séparateur point-virgule (Excel France). */

function escapeCsvCell(value) {
  const text = value == null ? '' : String(value)
  if (/[;"\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function formatGeneratedAt(date = new Date()) {
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function buildCsvContent({ generatedAt, meta = [], headers, rows }) {
  const lines = []
  lines.push(`Généré le;${escapeCsvCell(generatedAt)}`)
  meta.forEach(([label, value]) => lines.push(`${escapeCsvCell(label)};${escapeCsvCell(value)}`))
  if (meta.length || true) lines.push('')
  lines.push(headers.map(escapeCsvCell).join(';'))
  rows.forEach((row) => {
    lines.push(headers.map((key) => escapeCsvCell(row[key])).join(';'))
  })
  return `\uFEFF${lines.join('\r\n')}`
}

export function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function timestampForFilename(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}`
}

export function splitFullName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export function formatDateFr(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('fr-FR')
  } catch {
    return String(value)
  }
}

export function formatTimeFr(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function formatDurationMinutes(minutes) {
  const mins = Number(minutes)
  if (!Number.isFinite(mins) || mins <= 0) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (!h) return `${m} min`
  if (!m) return `${h} h`
  return `${h} h ${m} min`
}

export function addMinutes(iso, minutes) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  date.setMinutes(date.getMinutes() + Number(minutes || 0))
  return date.toISOString()
}

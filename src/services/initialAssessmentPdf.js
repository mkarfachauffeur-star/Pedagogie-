import {
  ASSESSMENT_MODULES,
  FSB_OPTIONS,
  PROFILE_LABELS,
  computeAssessmentScores,
  recommendHoursFromScore,
} from '../data/initialAssessmentForm'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDateFr(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('fr-FR')
  } catch {
    return '—'
  }
}

function buildModuleSection(mod, answers) {
  if (!mod.available || mod.readOnly) return ''

  let rows = ''
  ;(mod.fields || []).forEach((field) => {
    rows += `<tr><td>${escapeHtml(field.label)}</td><td><strong>${escapeHtml(answers[field.id] || '—')}</strong></td></tr>`
  })
  ;(mod.ratings || []).forEach((rating) => {
    const val = answers[rating.id]
    const label = FSB_OPTIONS.find((o) => o.value === val)?.label || val || '—'
    rows += `<tr><td>${escapeHtml(rating.label)}</td><td><strong>${escapeHtml(label)}</strong></td></tr>`
  })

  if (!rows) return ''

  return `
    <section class="module">
      <h2>Module ${mod.moduleNumber} — ${escapeHtml(mod.title)}</h2>
      <p class="objective">${escapeHtml(mod.objective || '')}</p>
      <table>
        <thead><tr><th>Question / critère</th><th>Réponse</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `
}

/** Ouvre une fenêtre d'impression (PDF via navigateur). */
export function exportInitialAssessmentPdf({
  student = {},
  assessment = {},
  answers = {},
  organizationName = 'Auto-école',
}) {
  const scores = computeAssessmentScores(answers)
  const recommendation = recommendHoursFromScore({ ...scores, moduleScores: scores.moduleScores })
  const profileLabel = PROFILE_LABELS[recommendation.resultLevel] || recommendation.profileLabel

  const studentName = [student.first_name, student.last_name].filter(Boolean).join(' ')
    || student.full_name
    || 'Élève'
  const fileNumber = student.file_number || '—'

  const modulesHtml = ASSESSMENT_MODULES
    .filter((m) => !m.readOnly)
    .map((mod) => buildModuleSection(mod, answers))
    .join('')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Évaluation de départ — ${escapeHtml(studentName)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; font-size: 12px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .header { border-bottom: 3px solid #0e7490; padding-bottom: 16px; margin-bottom: 24px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-top: 16px; }
    .meta dt { font-weight: bold; color: #475569; }
    .meta dd { margin: 0 0 8px; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 24px 0; }
    .summary .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
    .summary .value { font-size: 20px; font-weight: bold; color: #0e7490; }
    .module { page-break-inside: avoid; margin-bottom: 24px; }
    .module h2 { font-size: 14px; color: #0e7490; border-bottom: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
    th { background: #f8fafc; }
    .footer { margin-top: 32px; font-size: 10px; color: #64748b; }
  </style>
</head>
<body>
  <header class="header">
    <p style="margin:0;color:#64748b;font-size:11px;">PEDAGOGIA DRIVE</p>
    <h1>Évaluation de départ — Permis B</h1>
    <p>${escapeHtml(organizationName)}</p>
    <dl class="meta">
      <div><dt>Élève</dt><dd>${escapeHtml(studentName)}</dd></div>
      <div><dt>N° dossier</dt><dd>${escapeHtml(fileNumber)}</dd></div>
      <div><dt>Date</dt><dd>${escapeHtml(formatDateFr(assessment.completed_at || new Date()))}</dd></div>
      <div><dt>Enseignant</dt><dd>${escapeHtml(assessment.teacherName || assessment.teacher?.full_name || '—')}</dd></div>
    </dl>
  </header>
  <section class="summary">
    <div class="card"><p>Score total</p><p class="value">${scores.finalScore} %</p></div>
    <div class="card"><p>Profil</p><p class="value">${escapeHtml(profileLabel)}</p></div>
    <div class="card"><p>Volume horaire estimé</p><p class="value">${escapeHtml(recommendation.label)}</p></div>
  </section>
  ${modulesHtml}
  <footer class="footer">Document généré le ${escapeHtml(formatDateFr(new Date()))} — PEDAGOGIA DRIVE.</footer>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`

  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
  if (!win) return
  win.document.write(html)
  win.document.close()
}

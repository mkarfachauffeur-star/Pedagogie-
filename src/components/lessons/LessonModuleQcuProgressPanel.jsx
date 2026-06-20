import { useEffect, useState } from 'react'
import {
  fetchLessonModuleProgressMap,
  formatQcuValidatedAt,
  QCU_PASS_PERCENTAGE,
} from '../../services/lessonModuleProgress'

export default function LessonModuleQcuProgressPanel({ studentId }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) {
      setRows([])
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)
    fetchLessonModuleProgressMap(studentId).then(({ progressByModuleId }) => {
      if (cancelled) return
      const nextRows = Object.entries(progressByModuleId).map(([moduleId, row]) => ({
        ...row,
        moduleId: row.moduleId || moduleId,
      }))
        .filter((row) => row.qcuPassed || row.courseReadComplete)
        .sort((a, b) => String(b.qcuValidatedAt || b.courseReadAt || '').localeCompare(String(a.qcuValidatedAt || a.courseReadAt || '')))
      setRows(nextRows)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [studentId])

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement des QCU en ligne…</p>
  }

  const validatedRows = rows.filter((row) => row.qcuPassed)

  if (!validatedRows.length) {
    return (
      <p className="text-sm text-slate-500">
        Aucun QCU validé en ligne pour le moment (seuil {QCU_PASS_PERCENTAGE} %, minimum 8/10).
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2">Module</th>
            <th className="px-3 py-2">Score</th>
            <th className="px-3 py-2">Validé le</th>
            <th className="px-3 py-2">Lecture</th>
          </tr>
        </thead>
        <tbody>
          {validatedRows.map((row) => (
            <tr key={`${row.moduleId}-${row.qcuValidatedAt}`} className="border-b border-slate-100 last:border-0">
              <td className="px-3 py-3 font-bold text-slate-900">{row.moduleId || '—'}</td>
              <td className="px-3 py-3 text-slate-700">
                {row.score}/{row.total ?? '—'} ({row.percentage ?? '—'} %)
              </td>
              <td className="px-3 py-3 font-semibold text-emerald-700">
                {formatQcuValidatedAt(row.qcuValidatedAt)}
              </td>
              <td className="px-3 py-3 text-slate-600">
                {row.courseReadComplete ? formatQcuValidatedAt(row.courseReadAt) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

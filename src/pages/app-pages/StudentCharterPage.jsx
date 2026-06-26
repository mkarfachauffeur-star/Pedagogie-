import { useCallback, useEffect, useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import PageShell from '../../components/ui/PageShell'
import CharterContentView from '../../components/students/CharterContentView'
import { useStudentAccount } from '../../hooks/useStudentAccount'
import {
  fetchStudentCharterStatus,
  formatCharterAcceptedAt,
} from '../../services/studentCharter'

export default function StudentCharterPage() {
  const { student, loading: accountLoading } = useStudentAccount()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { status: nextStatus } = await fetchStudentCharterStatus()
    setStatus(nextStatus)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (accountLoading || !student?.id) return
    refresh()
  }, [accountLoading, refresh, student?.id])

  if (accountLoading || loading) {
    return (
      <PageShell>
        <p className="text-sm font-semibold text-slate-500">Chargement de la charte…</p>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Mon profil"
        title={status?.charter?.title || 'Charte d\'engagement de l\'élève'}
        subtitle="Consultez à tout moment les engagements de votre formation."
      />

      {status?.acceptance?.acceptedAt && (
        <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Acceptée le {formatCharterAcceptedAt(status.acceptance.acceptedAt)}
          {status.charter?.versionNumber ? ` · version ${status.charter.versionNumber}` : ''}
        </p>
      )}

      {status?.needsAcceptance && (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Une nouvelle version de la charte nécessite votre acceptation avant d&apos;utiliser la plateforme.
        </p>
      )}

      <section className="rounded-[1.75rem] border-2 border-slate-300 bg-white p-5 shadow-[var(--shadow-soft)] sm:p-8">
        <CharterContentView content={status?.charter?.content} />
      </section>
    </PageShell>
  )
}

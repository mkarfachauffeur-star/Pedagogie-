import { useMemo } from 'react'
import AacPanel from '../../components/aac/AacPanel'
import EmptyState from '../../components/ui/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { useStudentAccount } from '../../hooks/useStudentAccount'
import { formatPersonName } from '../../lib/staffAccounts'
import { isAacFormation } from '../../lib/studentTrack'

function isAccompaniedFormation(formationType = '') {
  return (
    formationType.includes('AAC')
    || formationType.toLowerCase().includes('accompagn')
    || formationType.toLowerCase().includes('supervis')
  )
}

export default function StudentAccompaniedDrivingPage() {
  const { student: studentRecord, loading: accountLoading } = useStudentAccount()
  const { organizationId, user, profile } = useAuth()

  const student = useMemo(() => {
    if (!studentRecord) return null
    return {
      id: studentRecord.id,
      firstName: studentRecord.first_name,
      lastName: studentRecord.last_name,
      formationType: studentRecord.package_name || studentRecord.formation_type || 'Permis B traditionnel',
      birthDate: studentRecord.birth_date,
      organizationId: studentRecord.organization_id || organizationId,
    }
  }, [studentRecord, organizationId])

  const isAac = isAacFormation(studentRecord) || isAccompaniedFormation(student?.formationType || '')

  if (accountLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <p className="text-sm font-semibold text-slate-500">Chargement du suivi AAC…</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <EmptyState
          title="Aucune donnée disponible"
          message="Le suivi s’activera dès l’ajout de votre dossier de conduite accompagnée."
          icon="🚗"
        />
      </div>
    )
  }

  if (!isAac) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border-2 border-slate-300 bg-white shadow-[var(--shadow-card)]">
          <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:p-8">
            <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
              Suivi accompagné
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Conduite accompagnée
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-cyan-50/85">
              Cet espace est réservé aux élèves en conduite accompagnée (AAC). Contactez le secrétariat
              si vous souhaitez basculer sur cette formule.
            </p>
            <p className="mt-6 text-sm font-semibold text-cyan-100">
              Formule actuelle : {student.formationType}
            </p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="rounded-[2rem] border-2 border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Espace élève</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Conduite accompagnée</h1>
        <p className="mt-2 text-sm text-slate-500">
          {formatPersonName(student)} — trajets GPS, RVP, attestation FFI et suivi réglementaire.
        </p>
      </header>

      <AacPanel
        birthDate={student.birthDate}
        mode="student"
        organizationId={student.organizationId}
        senderName={formatPersonName(profile || student)}
        studentId={student.id}
        userId={user?.id}
      />
    </div>
  )
}

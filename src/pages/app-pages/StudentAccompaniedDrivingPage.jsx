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
      <div className="mx-auto w-full max-w-5xl">
        <p className="text-sm text-slate-500">Chargement du suivi…</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <EmptyState
          title="Aucune donnée disponible"
          message="Le suivi s’activera dès l’ajout de votre dossier de conduite accompagnée."
        />
      </div>
    )
  }

  if (!isAac) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <section className="aac-glass p-6 sm:p-8">
          <p className="aac-pill">Espace élève</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Conduite accompagnée</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Cet espace est réservé aux élèves en conduite accompagnée. Contactez le secrétariat
            si vous souhaitez basculer sur cette formule.
          </p>
          <p className="mt-5 text-sm text-slate-500">
            Formule actuelle : <span className="font-medium text-slate-800">{student.formationType}</span>
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <header>
        <p className="aac-pill">Espace élève</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Conduite accompagnée</h1>
        <p className="mt-1 text-sm text-sky-900/70">{formatPersonName(student)}</p>
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

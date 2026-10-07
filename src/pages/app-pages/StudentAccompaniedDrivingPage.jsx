import { useMemo } from 'react'
import { Car } from 'lucide-react'
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
      <div className="mx-auto w-full max-w-3xl">
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
        <section className="lesson-glass p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700/80">Permis B</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Conduite accompagnée</h1>
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header className="flex items-center gap-3 px-1">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/80 bg-white/55 text-sky-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md">
          <Car aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700/80">Permis B</p>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Conduite accompagnée</h1>
          <p className="text-sm text-slate-500">{formatPersonName(student)}</p>
        </div>
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

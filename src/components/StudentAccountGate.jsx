import EmptyState from './ui/EmptyState'
import LoadingSpinner from './ui/LoadingSpinner'
import PageShell from './ui/PageShell'
import { useStudentAccount } from '../hooks/useStudentAccount'

const FRIENDLY_MESSAGES = {
  no_session: 'Votre session a expiré. Reconnectez-vous pour accéder à votre espace.',
  profile_query_failed: 'Impossible de charger votre profil. Vérifiez votre connexion puis réessayez.',
  missing_profile: 'Votre dossier n’est pas encore finalisé. Contactez votre auto-école.',
  wrong_role: 'Ce compte n’est pas un espace élève. Reconnectez-vous avec le bon accès.',
  inactive: 'Votre compte élève est désactivé. Contactez votre auto-école.',
  access_expired: 'Votre accès Pedagogia Drive a expiré. Contactez votre auto-école pour le réactiver.',
  student_query_failed: 'Impossible de charger votre dossier. Vérifiez votre connexion puis réessayez.',
  missing_student: 'Votre inscription n’est pas encore enregistrée. Contactez le secrétariat de votre auto-école.',
}

export default function StudentAccountGate({ children }) {
  const {
    userEmail,
    profileId,
    profile,
    student,
    loading,
    issue,
    profileError,
    studentError,
    refresh,
  } = useStudentAccount()

  if (loading) {
    return <LoadingSpinner label="Chargement de votre espace élève…" />
  }

  if (issue) {
    console.error('[StudentAccountGate] Compte incomplet ou erreur', {
      issue,
      profileId,
      userEmail,
      profile,
      student,
      profileError,
      studentError,
    })

    return (
      <PageShell>
        <EmptyState
          icon="⚠️"
          title="Espace élève indisponible"
          message={FRIENDLY_MESSAGES[issue.code] || issue.message}
          className="border-rose-200 bg-rose-50/80"
          action={(
            <button className="pd-btn-primary mt-2" onClick={refresh} type="button">
              Réessayer
            </button>
          )}
        />
      </PageShell>
    )
  }

  return children
}

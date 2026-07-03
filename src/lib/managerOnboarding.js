import { supabase } from './supabase'

export const MANAGER_ONBOARDING_STEPS = [
  {
    id: 'welcome',
    icon: '🎉',
    title: 'Bienvenue sur Pedagogia Drive',
    description:
      'Votre auto-école est activée. Vous disposez d\'un essai gratuit Starter de 30 jours pour configurer votre espace et inviter votre équipe.',
  },
  {
    id: 'dashboard',
    icon: '📊',
    title: 'Votre tableau de bord',
    description:
      'Retrouvez ici une vue d\'ensemble : activité, planning, élèves et indicateurs clés. C\'est votre point de départ chaque jour.',
  },
  {
    id: 'team',
    icon: '👥',
    title: 'Invitez votre équipe',
    description:
      'Ajoutez vos enseignants et votre secrétariat. Chaque membre reçoit un e-mail d\'invitation pour créer son mot de passe.',
    href: '/manager/users',
    cta: 'Gérer les utilisateurs',
  },
  {
    id: 'teachers',
    icon: '🧑‍🏫',
    title: 'Fiches enseignants',
    description:
      'Complétez les profils de vos moniteurs (catégorie, disponibilités) pour planifier les leçons et suivre la charge de travail.',
    href: '/manager/teachers',
    cta: 'Voir les enseignants',
  },
  {
    id: 'students',
    icon: '🎓',
    title: 'Inscrivez vos premiers élèves',
    description:
      'Créez les dossiers élèves, assignez un enseignant référent et suivez la progression REMC depuis un seul endroit.',
    href: '/manager/students',
    cta: 'Ajouter un élève',
  },
  {
    id: 'packages',
    icon: '💶',
    title: 'Formules et tarifs',
    description:
      'Configurez vos forfaits (Permis B, AAC, conduite supervisée…) pour que le secrétariat facture avec les bons montants.',
    href: '/manager/packages',
    cta: 'Configurer les tarifs',
  },
  {
    id: 'done',
    icon: '✅',
    title: 'Vous êtes prêt !',
    description:
      'Explorez le menu latéral pour accéder au planning, aux paiements, aux exports réglementaires et à la messagerie. Bonne prise en main !',
  },
]

export function shouldShowManagerOnboarding(user, locationState) {
  if (!user) return false
  const role = user.app_metadata?.role || user.user_metadata?.role
  if (role !== 'manager') return false
  if (user.user_metadata?.manager_onboarding_completed) return false
  return Boolean(
    locationState?.managerOnboarding || user.user_metadata?.manager_onboarding_pending,
  )
}

export async function markManagerOnboardingPending() {
  const { error } = await supabase.auth.updateUser({
    data: { manager_onboarding_pending: true },
  })
  if (error) throw error
}

export async function completeManagerOnboarding() {
  const { error } = await supabase.auth.updateUser({
    data: {
      manager_onboarding_pending: false,
      manager_onboarding_completed: true,
    },
  })
  if (error) throw error
}

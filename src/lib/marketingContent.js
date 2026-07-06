import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Target,
  Users,
} from 'lucide-react'

export const LANDING_HERO = {
  title: 'Le logiciel tout-en-un nouvelle génération pour les auto-écoles.',
  subtitle:
    'Gérez vos élèves, enseignants, livrets pédagogiques, documents, messagerie et suivi pédagogique depuis une seule plateforme.',
  primaryCta: 'Demander une démonstration gratuite',
  secondaryCta: 'Découvrir les fonctionnalités',
}

export const LANDING_FEATURES = [
  {
    title: 'Gestion des élèves',
    description: 'Inscriptions, dossiers, progression et historique centralisés pour chaque élève.',
    icon: GraduationCap,
  },
  {
    title: 'Gestion des enseignants',
    description: 'Comptes dédiés, affectations et visibilité sur les élèves suivis.',
    icon: Users,
  },
  {
    title: 'Livret pédagogique numérique',
    description: 'Leçons, QCM et contenus interactifs accessibles entre les séances.',
    icon: BookOpen,
  },
  {
    title: 'Planning',
    description: 'Organisation des leçons et disponibilités en un coup d\'œil.',
    icon: CalendarDays,
  },
  {
    title: 'Messagerie interne',
    description: 'Échanges sécurisés entre élèves, enseignants et secrétariat.',
    icon: MessageSquare,
  },
  {
    title: 'Documents',
    description: 'Pièces administratives et pédagogiques stockées et partagées.',
    icon: FileText,
  },
  {
    title: 'Suivi REMC',
    description: 'Compétences et sous-compétences alignées sur le référentiel officiel.',
    icon: Target,
  },
  {
    title: 'Statistiques',
    description: 'Indicateurs clés pour piloter votre activité et la réussite des élèves.',
    icon: BarChart3,
  },
  {
    title: 'Tableau de bord',
    description: 'Vue d\'ensemble personnalisée selon votre rôle au quotidien.',
    icon: LayoutDashboard,
  },
  {
    title: 'Notifications',
    description: 'Alertes messages, rendez-vous et événements importants.',
    icon: Bell,
  },
]

export const LANDING_HOW_IT_WORKS = [
  { step: 1, title: 'Vous demandez une démonstration.' },
  { step: 2, title: 'Vous recevez vos accès.' },
  { step: 3, title: 'Vous testez gratuitement Pedagogia Drive pendant 30 jours.' },
  { step: 4, title: 'Vous ouvrez votre auto-école en quelques minutes.' },
]

export const LANDING_WHY = [
  {
    title: 'Interface moderne',
    description: 'Une expérience claire et agréable, pensée pour le quotidien des équipes.',
  },
  {
    title: 'Gain de temps',
    description: 'Moins de ressaisies, moins d\'outils éparpillés — plus de temps pour l\'accompagnement.',
  },
  {
    title: 'Conforme REMC',
    description: 'Le suivi pédagogique suit le référentiel officiel de la formation à la conduite.',
  },
  {
    title: 'Accessible ordinateur, tablette et mobile',
    description: '100 % en ligne : accessible depuis n\'importe quel navigateur moderne.',
  },
  {
    title: 'Messagerie intégrée',
    description: 'Communiquez sans quitter la plateforme ni multiplier les applications.',
  },
  {
    title: 'Suivi pédagogique simplifié',
    description: 'Visualisez la progression réelle de chaque élève, compétence par compétence.',
  },
  {
    title: 'Déploiement rapide',
    description: 'Aucune installation complexe : vos équipes sont opérationnelles en quelques minutes.',
  },
]

export const MARKETING_FAQ = [
  {
    question: 'Comment fonctionne l\'essai gratuit ?',
    answer:
      'Après votre demande de démonstration, nous créons votre espace pilote. Vous bénéficiez de 30 jours d\'essai gratuit avec l\'ensemble des fonctionnalités essentielles, accompagné par notre équipe.',
  },
  {
    question: 'Dois-je installer un logiciel ?',
    answer:
      'Non. Pedagogia Drive fonctionne entièrement dans le navigateur web. Aucune installation n\'est nécessaire sur ordinateur, tablette ou smartphone.',
  },
  {
    question: 'Puis-je utiliser Pedagogia Drive sur Mac ?',
    answer:
      'Oui. La plateforme est compatible avec Mac, Windows, Linux, iPad, iPhone et Android via un navigateur moderne (Chrome, Safari, Firefox, Edge).',
  },
  {
    question: 'Mes enseignants auront-ils leur propre compte ?',
    answer:
      'Oui. Chaque enseignant dispose d\'un espace personnel pour suivre ses élèves, consulter les livrets et échanger via la messagerie interne.',
  },
  {
    question: 'Les élèves disposent-ils d\'un espace personnel ?',
    answer:
      'Oui. Chaque élève accède à son livret numérique, ses QCM, sa progression REMC et sa messagerie depuis un espace sécurisé.',
  },
  {
    question: 'Puis-je arrêter à tout moment ?',
    answer:
      'Oui. L\'essai pilote ne vous engage pas. Vous pouvez arrêter à tout moment pendant ou à l\'issue de la période d\'essai.',
  },
  {
    question: 'Comment fonctionne l\'accompagnement ?',
    answer:
      'Pendant la bêta privée, nous accompagnons chaque auto-école pilote : prise en main, paramétrage initial et retours pour faire évoluer la plateforme selon vos besoins réels.',
  },
  {
    question: 'Qu\'est-ce que Pedagogia Drive ?',
    answer:
      'Pedagogia Drive est une plateforme SaaS tout-en-un pour auto-écoles : gestion des élèves et enseignants, livret pédagogique numérique, planning, documents, messagerie et suivi REMC.',
  },
  {
    question: 'Le logiciel est-il conforme au REMC ?',
    answer:
      'Oui. Pedagogia Drive structure le parcours autour du REMC : compétences, sous-compétences et validations sont suivies dans le livret numérique.',
  },
]

/** FAQ réduite sur la page d'accueil. */
export const LANDING_FAQ_HOME = MARKETING_FAQ.slice(0, 5)

export const LANDING_FINAL_CTA = {
  title: 'Prêt à moderniser votre auto-école ?',
  subtitle: 'Essayez Pedagogia Drive gratuitement pendant 30 jours.',
  button: 'Demander une démonstration',
}

export const MARKETING_REASSURANCE = LANDING_WHY

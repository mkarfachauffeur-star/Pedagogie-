// PEDAGOGIA DRIVE — Configuration des pages (gabarits de mise en page).
//
// Préparation production : ce fichier ne contient AUCUNE donnée fictive
// (aucun élève, enseignant, statistique, planning, paiement ou message de
// démonstration). Seule la structure de mise en page est définie ici
// (titres, sous-titres, colonnes, types de sections). Les données réelles
// seront fournies ultérieurement via Supabase. En l'absence de données,
// chaque section affiche un état vide professionnel (voir sanitizeConfig).

const actions = {
  export: { label: 'Exporter', variant: 'secondary' },
  addÉlève: { label: 'Ajouter un élève' },
  addEnseignant: { label: 'Ajouter un enseignant' },
  newLesson: { label: 'Nouvelle leçon' },
  newPayment: { label: 'Nouveau paiement' },
  save: { label: 'Enregistrer' },
}

const rawPageConfigs = {
  adminDashboard: {
    hero: {
      eyebrow: 'Gérant',
      title: 'Tableau de bord Gérant',
      subtitle: "Vue d'ensemble de votre auto-école : activité, planning, élèves et revenus.",
      actions: [actions.export, actions.addÉlève],
    },
    metrics: [],
    sections: [
      { title: 'Priorités du jour', description: 'Les actions importantes restent visibles pour piloter rapidement.', columns: 2, items: [] },
      { type: 'timeline', title: 'Planning du jour', description: 'Vue synthétique des prochains événements.', items: [] },
    ],
  },

  adminStudents: {
    hero: {
      eyebrow: 'Gestion élèves',
      title: 'Élèves inscrits',
      subtitle: 'Suivez les dossiers, la progression pédagogique et les prochaines actions.',
      actions: [actions.export, actions.addÉlève],
    },
    metrics: [],
    sections: [
      { type: 'table', title: 'Liste des élèves', description: 'Statut principal et prochaine action.', columns: ['Élève', 'Formation', 'Progression', 'Action'], rows: [] },
    ],
  },

  adminTeachers: {
    hero: {
      eyebrow: 'Équipe pédagogique',
      title: 'Enseignants et disponibilités',
      subtitle: 'Pilotez les moniteurs, leurs affectations et leur charge de travail.',
      actions: [actions.export, actions.addEnseignant],
    },
    metrics: [],
    sections: [
      { title: 'Moniteurs', description: 'Vue rapide des profils et spécialités.', columns: 3, items: [] },
    ],
  },

  adminPlanning: {
    hero: {
      eyebrow: 'Planning global',
      title: "Planning global de l'auto-école",
      subtitle: 'Organisez les créneaux avec des filtres par enseignant et par véhicule.',
      actions: [actions.export, actions.newLesson],
    },
    metrics: [],
    sections: [{ type: 'timeline', title: 'Journée type', description: 'Créneaux principaux et affectations.', items: [] }],
  },

  adminContracts: {
    hero: {
      eyebrow: 'Contrats',
      title: 'Gestion des contrats',
      subtitle: 'Suivez les contrats actifs, terminés et les signatures à relancer.',
      actions: [actions.export, { label: 'Nouveau contrat' }],
    },
    metrics: [],
    sections: [
      { type: 'table', title: 'Contrats récents', description: 'Suivi administratif simplifié.', columns: ['Élève', 'Formule', 'Montant', 'Statut'], rows: [] },
    ],
  },

  adminPayments: {
    hero: {
      eyebrow: 'Finances',
      title: 'Gestion des paiements',
      subtitle: 'Suivi des encaissements, transactions et relances.',
      actions: [actions.export, actions.newPayment],
    },
    metrics: [],
    sections: [{ type: 'table', title: 'Transactions récentes', description: 'Paiements et statuts.', columns: ['Élève', 'Objet', 'Montant', 'Statut'], rows: [] }],
  },

  adminStatistics: {
    hero: {
      eyebrow: 'Analyse',
      title: 'Statistiques de performance',
      subtitle: 'Mesurez l’activité, la réussite et la rentabilité de l’auto-école.',
      actions: [actions.export],
    },
    metrics: [],
    sections: [
      { title: 'Indicateurs clés', description: 'Lecture rapide des axes de progression.', columns: 3, items: [] },
    ],
  },

  adminSettings: {
    hero: {
      eyebrow: 'Paramètres',
      title: 'Configuration de l’auto-école',
      subtitle: 'Gérez les informations établissement, notifications et préférences.',
      actions: [actions.save],
    },
    metrics: [],
    sections: [
      { title: 'Réglages principaux', description: 'Les éléments importants sont regroupés par thème.', columns: 2, items: [] },
    ],
  },

  studentDashboard: {
    hero: {
      eyebrow: 'Espace élève',
      title: 'Bienvenue',
      subtitle: 'Votre progression, vos prochaines leçons et vos objectifs sont regroupés ici.',
    },
    metrics: [],
    sections: [
      { type: 'timeline', title: 'Prochaines leçons', description: 'Affichage simple : heure, jour, date et année.', items: [] },
    ],
  },

  studentProgress: {
    hero: {
      eyebrow: 'Progression',
      title: 'Ma progression REMC',
      subtitle: 'Visualisez les compétences validées et les modules à terminer.',
    },
    metrics: [],
    sections: [
      { title: 'Compétences REMC', description: 'Détail par axe pédagogique.', columns: 2, items: [] },
    ],
  },

  studentExams: {
    hero: {
      eyebrow: 'Examens',
      title: 'Préparation aux examens',
      subtitle: 'Suivez vos examens blancs, votre code et votre préparation pratique.',
    },
    metrics: [],
    sections: [{ type: 'timeline', title: 'Préparation', description: 'Plan conseillé avant présentation.', items: [] }],
  },

  studentAccompaniedDriving: {
    hero: {
      eyebrow: 'Conduite accompagnée',
      title: 'Suivi conduite accompagnée',
      subtitle: 'Gardez une vision claire des kilomètres, rendez-vous pédagogiques et objectifs famille.',
    },
    metrics: [],
    sections: [
      { title: 'Objectifs famille', description: 'Des repères simples pour progresser hors auto-école.', columns: 2, items: [] },
    ],
  },

  studentMessages: {
    hero: {
      eyebrow: 'Messagerie',
      title: 'Mes conversations',
      subtitle: 'Échangez avec le secrétariat et votre enseignant dans un espace clair.',
      actions: [{ label: 'Nouvelle conversation' }],
    },
    metrics: [],
    sections: [{ type: 'table', title: 'Conversations récentes', description: 'Messages triés par priorité.', columns: ['Contact', 'Sujet', 'Date', 'Statut'], rows: [] }],
  },

  teacherDashboard: {
    hero: {
      eyebrow: 'Espace enseignant',
      title: 'Bienvenue',
      subtitle: 'Votre planning simplifié jour/semaine et accès rapide terrain.',
    },
    metrics: [],
    sections: [],
  },

  teacherPlanning: {
    hero: {
      eyebrow: 'Planning enseignant',
      title: 'Mon planning',
      subtitle: 'Retrouvez vos leçons, disponibilités et rendez-vous pédagogiques.',
      actions: [{ label: 'Ajouter disponibilité' }],
    },
    metrics: [],
    sections: [{ type: 'timeline', title: 'Créneaux à venir', description: 'Vue simplifiée du planning.', items: [] }],
  },

  teacherÉlèves: {
    hero: {
      eyebrow: 'Mes élèves',
      title: 'Suivi des élèves',
      subtitle: 'Progression, prochaines leçons et points pédagogiques à travailler.',
    },
    metrics: [],
    sections: [{ type: 'table', title: 'Élèves suivis', description: 'Synthèse pédagogique.', columns: ['Élève', 'Formation', 'Progression', 'Action'], rows: [] }],
  },

  teacherLessons: {
    hero: {
      eyebrow: 'Leçons',
      title: 'Préparation et comptes-rendus',
      subtitle: 'Organisez vos leçons, objectifs REMC et observations après séance.',
      actions: [actions.newLesson],
    },
    metrics: [],
    sections: [
      { title: 'Objectifs pédagogiques', description: 'Préparation rapide des prochaines séances.', columns: 2, items: [] },
    ],
  },

  teacherProfile: {
    hero: {
      eyebrow: 'Profil',
      title: 'Mon profil enseignant',
      subtitle: 'Informations personnelles, disponibilités et préférences de notification.',
      actions: [actions.save],
    },
    metrics: [],
    sections: [
      { title: 'Informations', description: 'Données principales du profil.', columns: 2, items: [] },
    ],
  },

  secretaryDashboard: {
    hero: {
      eyebrow: 'Secrétariat',
      title: 'Bienvenue',
      subtitle: 'Vue opérationnelle des inscriptions, paiements, documents et rendez-vous.',
    },
    metrics: [],
    sections: [{ type: 'timeline', title: 'Priorités secrétariat', description: 'Actions à réaliser aujourd’hui.', items: [] }],
  },

  secretaryInscriptions: {
    hero: {
      eyebrow: 'Inscriptions',
      title: 'Gestion des inscriptions',
      subtitle: 'Centralisez les nouveaux dossiers, statuts et pièces manquantes.',
      actions: [actions.export, { label: 'Nouvelle inscription' }],
    },
    metrics: [],
    sections: [{ type: 'table', title: 'Dossiers élèves', description: 'Suivi administratif.', columns: ['Élève', 'Formation', 'Progression', 'Action'], rows: [] }],
  },

  secretaryPlanning: {
    hero: {
      eyebrow: 'Planning',
      title: 'Planning global de la semaine',
      subtitle: 'Coordonnez enseignants, véhicules et rendez-vous élèves.',
      actions: [{ label: 'Imprimer', variant: 'secondary' }, { label: 'Nouveau créneau' }],
    },
    metrics: [],
    sections: [{ type: 'timeline', title: 'Aperçu du planning', description: 'Créneaux principaux.', items: [] }],
  },

  secretaryPaiements: {
    hero: {
      eyebrow: 'Paiements',
      title: 'Gestion des paiements',
      subtitle: 'Suivi financier, encaissements et exports comptables.',
      actions: [{ label: 'Export comptable', variant: 'secondary' }, { label: 'Enregistrer un paiement' }],
    },
    metrics: [],
    sections: [{ type: 'table', title: 'Encaissements', description: 'Suivi des règlements.', columns: ['Élève', 'Objet', 'Montant', 'Statut'], rows: [] }],
  },

  secretaryDocuments: {
    hero: {
      eyebrow: 'Documents',
      title: 'Gestion documentaire',
      subtitle: 'Contrôlez les pièces élèves, contrats et documents administratifs.',
      actions: [actions.export, { label: 'Ajouter document' }],
    },
    metrics: [],
    sections: [
      { title: 'Catégories', description: 'Organisation claire des documents.', columns: 2, items: [] },
    ],
  },

  secretaryMessages: {
    hero: {
      eyebrow: 'Messages',
      title: 'Messages du secrétariat',
      subtitle: 'Centralisez les demandes élèves, enseignants et administratives.',
      actions: [{ label: 'Nouveau message' }],
    },
    metrics: [],
    sections: [{ type: 'table', title: 'Demandes récentes', description: 'Messages à suivre.', columns: ['Contact', 'Sujet', 'Date', 'Statut'], rows: [] }],
  },

  teacherMessages: {
    hero: {
      eyebrow: 'Messagerie enseignant',
      title: 'Conversations pédagogiques',
      subtitle: 'Suivez les échanges avec élèves, secrétariat et Gérant.',
      actions: [{ label: 'Nouveau message' }],
    },
    metrics: [],
    sections: [
      { type: 'table', title: 'Discussions récentes', description: 'Chaque ligne est ouvrable pour accéder au suivi.', columns: ['Contact', 'Sujet', 'Date', 'Statut'], rows: [] },
    ],
  },

  secretaryExams: {
    hero: {
      eyebrow: 'Examens',
      title: 'Gestion des examens',
      subtitle: 'Planifiez les présentations, contrôlez les dossiers et suivez les résultats.',
      actions: [{ label: 'Planifier examen' }, actions.export],
    },
    metrics: [],
    sections: [
      { type: 'table', title: 'Présentations examen', description: 'Ouverture rapide du dossier candidat.', columns: ['Élève', 'Type', 'Date', 'Statut'], rows: [] },
    ],
  },

  adminUsers: {
    hero: {
      eyebrow: 'Utilisateurs',
      title: 'Gestion utilisateurs',
      subtitle: 'Supervisez les accès élèves, enseignants, secrétariat et Gérant.',
      actions: [{ label: 'Créer utilisateur' }, actions.export],
    },
    metrics: [],
    sections: [
      { type: 'table', title: 'Comptes utilisateurs', description: 'Ouverture de fiche utilisateur et contrôle des rôles.', columns: ['Utilisateur', 'Rôle', 'Accès', 'Statut'], rows: [] },
    ],
  },
}

// --- États vides professionnels ---------------------------------------------
// Génère un message d'état vide adapté au titre de chaque section.

const EMPTY_STATE_RULES = [
  { test: /élève|eleve|étudiant|inscription|dossier élève/i, title: 'Aucun élève enregistré', message: 'Aucun élève enregistré pour le moment.' },
  { test: /enseignant|moniteur|équipe|equipe/i, title: 'Aucun enseignant enregistré', message: 'Aucun enseignant enregistré pour le moment.' },
  { test: /utilisateur|compte|accès|acces/i, title: 'Aucun utilisateur', message: 'Aucun utilisateur enregistré pour le moment.' },
  { test: /contrat/i, title: 'Aucun contrat', message: 'Aucun contrat disponible pour le moment.' },
  { test: /paiement|encaissement|transaction|finance|règlement|reglement/i, title: 'Aucun paiement enregistré', message: 'Aucun paiement enregistré pour le moment.' },
  { test: /message|conversation|discussion|échange|echange/i, title: 'Aucun message', message: 'Aucun message pour le moment.' },
  { test: /véhicule|vehicule/i, title: 'Aucun véhicule enregistré', message: 'Aucun véhicule enregistré pour le moment.' },
  { test: /examen|présentation|presentation/i, title: 'Aucun résultat disponible', message: 'Aucun résultat disponible pour le moment.' },
  { test: /document|pièce|piece|catégorie|categorie/i, title: 'Aucun document disponible', message: 'Aucun document disponible pour le moment.' },
  { test: /compétence|competence|progression|objectif|indicateur/i, title: 'Aucune progression disponible', message: 'Aucune progression disponible pour le moment.' },
  { test: /planning|créneau|creneau|leçon|lecon|séance|seance|journée|journee|rendez|priorité|priorite/i, title: 'Aucune leçon programmée', message: 'Aucune leçon programmée pour le moment.' },
]

function resolveEmptyState(title = '') {
  const rule = EMPTY_STATE_RULES.find((entry) => entry.test.test(title))
  if (rule) return { emptyTitle: rule.title, emptyMessage: rule.message }
  return {
    emptyTitle: 'Aucune donnée disponible',
    emptyMessage: 'Aucune donnée disponible pour le moment.',
  }
}

function sanitizeSection(section = {}) {
  const next = { ...section, ...resolveEmptyState(section.title) }
  delete next.badge
  if (Array.isArray(section.rows)) {
    next.rows = []
  } else {
    next.items = []
  }
  return next
}

function sanitizeConfig(config = {}) {
  return {
    ...config,
    metrics: [],
    sections: (config.sections || []).map(sanitizeSection),
  }
}

export const pageConfigs = Object.fromEntries(
  Object.entries(rawPageConfigs).map(([key, config]) => [key, sanitizeConfig(config)]),
)

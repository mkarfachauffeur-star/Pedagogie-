const actions = {
  export: { label: 'Exporter', variant: 'secondary' },
  addÉlève: { label: 'Ajouter un élève' },
  addEnseignant: { label: 'Ajouter un enseignant' },
  newLesson: { label: 'Nouvelle leçon' },
  newPayment: { label: 'Nouveau paiement' },
  save: { label: 'Enregistrer' },
}

const studentRows = [
  ['Thomas Martin', 'Permis B', '65%', 'Prochaine leçon demain'],
  ['Camille Leroy', 'Conduite accompagnée', '72%', 'QCM à valider'],
  ['Lucas Bernard', 'Permis B', '48%', 'Relance planning'],
  ['Sarah Petit', 'Permis B', '81%', 'Prête examen blanc'],
]

const planningItems = [
  {
    time: '08:00',
    title: 'Leçon conduite - Thomas Martin',
    description: 'Jean Moniteur · Peugeot 208 · Départ agence',
    status: 'Confirmé',
    tone: 'cyan',
  },
  {
    time: '10:00',
    title: 'Évaluation initiale - Camille Leroy',
    description: 'Marie Dupont · Salle théorie puis véhicule',
    status: 'À préparer',
    tone: 'amber',
  },
  {
    time: '14:00',
    title: 'Cours code collectif',
    description: 'Salle 2 · 12 élèves inscrits',
    status: 'Collectif',
    tone: 'emerald',
  },
  {
    time: '17:30',
    title: 'Leçon manoeuvres - Sarah Petit',
    description: 'Pierre Lambert · Parking pédagogique',
    status: 'Confirmé',
    tone: 'violet',
  },
]

const paymentRows = [
  ['Thomas Martin', 'Forfait 20h', '350 €', 'Payé'],
  ['Camille Leroy', 'Acompte inscription', '280 €', 'Payé'],
  ['Lucas Bernard', 'Leçon supplémentaire', '55 €', 'En attente'],
  ['Sarah Petit', 'Solde dossier', '420 €', 'À relancer'],
]

const messageRows = [
  ['Thomas Martin', 'Question planning', 'Aujourd’hui', 'Nouveau'],
  ['Jean Moniteur', 'Compte-rendu de leçon', 'Hier', 'Lu'],
  ['Secrétariat', 'Document reçu', 'Lundi', 'Traité'],
]

export const pageConfigs = {
  adminDashboard: {
    hero: {
      eyebrow: 'Gérant',
      title: 'Tableau de bord Gérant',
      subtitle: "Vue d'ensemble de votre auto-école : activité, planning, élèves et revenus.",
      actions: [actions.export, actions.addÉlève],
      focus: {
        label: 'Objectif mensuel',
        value: '84%',
        progress: 84,
        caption: 'Très bonne dynamique sur les inscriptions et les heures planifiées.',
      },
    },
    metrics: [
      { label: 'Élèves actifs', value: '42', trend: '+6 ce mois-ci', tone: 'cyan' },
      { label: 'Enseignants', value: '5', trend: '4 disponibles aujourd’hui', tone: 'emerald' },
      { label: 'Leçons semaine', value: '128', trend: '+12% par rapport à la semaine passée', tone: 'violet' },
      { label: 'CA mensuel', value: '18 450 €', trend: '+9% par rapport à l’objectif', tone: 'amber' },
    ],
    sections: [
      {
        title: 'Priorités du jour',
        description: 'Les actions importantes restent visibles pour piloter rapidement.',
        badge: '4 alertes',
        columns: 2,
        items: [
          {
            badge: 'Planning',
            title: '3 créneaux à réaffecter',
            description: 'Un véhicule indisponible impacte les leçons de fin de journée.',
            status: 'Urgent',
            tone: 'amber',
          },
          {
            badge: 'Dossiers',
            title: '5 inscriptions à finaliser',
            description: 'Pièces manquantes et validation de contrats à contrôler.',
            status: 'À traiter',
            tone: 'cyan',
          },
        ],
      },
      {
        type: 'timeline',
        title: 'Planning du jour',
        description: 'Vue synthétique des prochains événements.',
        items: planningItems,
      },
    ],
  },

  adminStudents: {
    hero: {
      eyebrow: 'Gestion élèves',
      title: 'Élèves inscrits',
      subtitle: 'Suivez les dossiers, la progression pédagogique et les prochaines actions.',
      actions: [actions.export, actions.addÉlève],
      focus: { label: 'Progression moyenne', value: '67%', progress: 67, caption: '15 élèves suivis avec un rythme régulier.' },
    },
    metrics: [
      { label: 'Élèves inscrits', value: '15', trend: '12 actifs', tone: 'cyan' },
      { label: 'Prêts examen', value: '4', trend: '2 cette semaine', tone: 'emerald' },
      { label: 'À relancer', value: '3', trend: 'Documents ou paiement', tone: 'amber' },
      { label: 'Conduite accompagnée', value: '5', trend: 'Suivi famille actif', tone: 'violet' },
    ],
    sections: [
      { type: 'table', title: 'Liste des élèves', description: 'Statut principal et prochaine action.', columns: ['Élève', 'Formation', 'Progression', 'Action'], rows: studentRows },
    ],
  },

  adminTeachers: {
    hero: {
      eyebrow: 'Équipe pédagogique',
      title: 'Enseignants et disponibilités',
      subtitle: 'Pilotez les moniteurs, leurs affectations et leur charge de travail.',
      actions: [actions.export, actions.addEnseignant],
      focus: { label: 'Taux occupation', value: '78%', progress: 78, caption: 'Charge équilibrée sur la semaine.' },
    },
    metrics: [
      { label: 'Enseignants actifs', value: '5', trend: 'Tous certifiés', tone: 'cyan' },
      { label: 'Heures planifiées', value: '86h', trend: 'Semaine courante', tone: 'emerald' },
      { label: 'Disponibilités', value: '14', trend: 'Créneaux ouverts', tone: 'amber' },
      { label: 'Satisfaction', value: '4.8/5', trend: 'Avis élèves', tone: 'violet' },
    ],
    sections: [
      {
        title: 'Moniteurs',
        description: 'Vue rapide des profils et spécialités.',
        columns: 3,
        items: [
          { badge: 'JM', title: 'Jean Moniteur', description: 'Permis B · Boîte manuelle · 24 élèves suivis', meta: [{ label: 'Aujourd’hui', value: '6 leçons' }, { label: 'Statut', value: 'Disponible' }], tone: 'cyan' },
          { badge: 'MD', title: 'Marie Dupont', description: 'Code · Évaluations initiales · Conduite accompagnée', meta: [{ label: 'Aujourd’hui', value: '4 leçons' }, { label: 'Statut', value: 'Disponible' }], tone: 'emerald' },
          { badge: 'PL', title: 'Pierre Lambert', description: 'Manoeuvres · Perfectionnement · Examens blancs', meta: [{ label: 'Aujourd’hui', value: '5 leçons' }, { label: 'Statut', value: 'Occupé' }], tone: 'violet' },
        ],
      },
    ],
  },

  adminPlanning: {
    hero: {
      eyebrow: 'Planning global',
      title: "Planning global de l'auto-école",
      subtitle: 'Semaine du 13 au 19 janvier 2026, avec filtres par enseignant et véhicule.',
      actions: [actions.export, actions.newLesson],
      focus: { label: 'Remplissage semaine', value: '82%', progress: 82, caption: 'Encore 18 créneaux disponibles.' },
    },
    metrics: [
      { label: 'Leçons', value: '128', trend: 'Cette semaine', tone: 'cyan' },
      { label: 'Véhicules utilisés', value: '7/8', trend: '1 maintenance', tone: 'amber' },
      { label: 'Examens blancs', value: '9', trend: 'Planifiés', tone: 'emerald' },
      { label: 'Conflits', value: '2', trend: 'À résoudre', tone: 'rose' },
    ],
    sections: [{ type: 'timeline', title: 'Journée type', description: 'Créneaux principaux et affectations.', items: planningItems }],
  },

  adminContracts: {
    hero: {
      eyebrow: 'Contrats',
      title: 'Gestion des contrats',
      subtitle: 'Suivez les contrats actifs, terminés et les signatures à relancer.',
      actions: [actions.export, { label: 'Nouveau contrat' }],
      focus: { label: 'Contrats actifs', value: '5', progress: 58, caption: '12 contrats au total dans le portefeuille.' },
    },
    metrics: [
      { label: 'Actifs', value: '5', trend: 'En cours', tone: 'cyan' },
      { label: 'Terminés', value: '5', trend: 'Archivés', tone: 'emerald' },
      { label: 'À signer', value: '2', trend: 'Relance prévue', tone: 'amber' },
      { label: 'CA engagé', value: '12 800 €', trend: 'Contrats actifs', tone: 'violet' },
    ],
    sections: [
      { type: 'table', title: 'Contrats récents', description: 'Suivi manageristratif simplifié.', columns: ['Élève', 'Formule', 'Montant', 'Statut'], rows: [['Thomas Martin', 'Permis B 20h', '1 250 €', 'Actif'], ['Camille Leroy', 'AAC complète', '1 680 €', 'Actif'], ['Lucas Bernard', 'Passerelle', '420 €', 'À signer'], ['Sarah Petit', 'Permis B 30h', '1 850 €', 'Terminé']] },
    ],
  },

  adminPayments: {
    hero: {
      eyebrow: 'Finances',
      title: 'Gestion des paiements',
      subtitle: 'Suivi des encaissements, transactions et relances.',
      actions: [actions.export, actions.newPayment],
      focus: { label: 'CA du mois', value: '3 500 €', progress: 74, caption: '+12% par rapport au mois dernier.' },
    },
    metrics: [
      { label: 'Encaissements', value: '3 500 €', trend: '+12%', tone: 'emerald' },
      { label: 'En attente', value: '3', trend: 'Relances ouvertes', tone: 'amber' },
      { label: 'Paiements validés', value: '18', trend: 'Ce mois-ci', tone: 'cyan' },
      { label: 'Impayés', value: '1', trend: 'À suivre', tone: 'rose' },
    ],
    sections: [{ type: 'table', title: 'Transactions récentes', description: 'Paiements et statuts.', columns: ['Élève', 'Objet', 'Montant', 'Statut'], rows: paymentRows }],
  },

  adminStatistics: {
    hero: {
      eyebrow: 'Analyse',
      title: 'Statistiques de performance',
      subtitle: 'Mesurez l’activité, la réussite et la rentabilité de l’auto-école.',
      actions: [actions.export],
      focus: { label: 'Réussite examen', value: '82%', progress: 82, caption: 'Taux calculé sur les 3 derniers mois.' },
    },
    metrics: [
      { label: 'Taux réussite', value: '82%', trend: '+4 pts', tone: 'emerald' },
      { label: 'Heures réalisées', value: '412h', trend: 'Trimestre', tone: 'cyan' },
      { label: 'Panier moyen', value: '1 280 €', trend: '+7%', tone: 'violet' },
      { label: 'Absentéisme', value: '3.5%', trend: 'Sous contrôle', tone: 'amber' },
    ],
    sections: [
      {
        title: 'Indicateurs clés',
        description: 'Lecture rapide des axes de progression.',
        columns: 3,
        items: [
          { badge: 'Pédagogie', title: 'Progression moyenne stable', description: 'Les élèves valident leurs compétences avec un bon rythme.', progress: 76, tone: 'cyan' },
          { badge: 'Finance', title: 'Revenus en hausse', description: 'Les formules complètes tirent le chiffre d’affaires.', progress: 84, tone: 'emerald' },
          { badge: 'Qualité', title: 'Satisfaction élevée', description: 'Les avis restent solides sur les leçons pratiques.', progress: 91, tone: 'violet' },
        ],
      },
    ],
  },

  adminSettings: {
    hero: {
      eyebrow: 'Paramètres',
      title: 'Configuration de l’auto-école',
      subtitle: 'Gérez les informations établissement, notifications et préférences.',
      actions: [actions.save],
      focus: { label: 'Configuration', value: '92%', progress: 92, caption: 'Profil établissement presque complet.' },
    },
    metrics: [
      { label: 'Notifications', value: 'Actives', trend: 'Courriel et SMS', tone: 'cyan' },
      { label: 'Véhicules', value: '8', trend: '1 maintenance', tone: 'amber' },
      { label: 'Documents', value: '12', trend: 'Modèles prêts', tone: 'emerald' },
      { label: 'Sécurité', value: 'OK', trend: 'Accès contrôlés', tone: 'violet' },
    ],
    sections: [
      {
        title: 'Réglages principaux',
        description: 'Les éléments importants sont regroupés par thème.',
        columns: 2,
        items: [
          { badge: 'Établissement', title: 'Auto-École Excellence Paris', description: 'Coordonnées, horaires, agrément et mentions légales.', tone: 'cyan' },
          { badge: 'Notifications', title: 'Rappels automatiques', description: 'Rappels de leçon, paiement, document manquant et examen.', tone: 'emerald' },
          { badge: 'Facturation', title: 'Préférences comptables', description: 'Numérotation, exports et modes de paiement acceptés.', tone: 'amber' },
          { badge: 'Accès', title: 'Rôles utilisateurs', description: 'Gérant, secrétariat, enseignants et élèves.', tone: 'violet' },
        ],
      },
    ],
  },

  studentDashboard: {
    hero: {
      eyebrow: 'Espace élève',
      title: 'Bonjour Thomas !',
      subtitle: 'Votre progression, vos prochaines leçons et vos objectifs sont regroupés ici.',
      focus: { label: 'Progression globale', value: '65%', progress: 65, caption: 'Continuez la compétence C1 pour avancer vers l’examen.' },
    },
    metrics: [
      { label: 'Leçons effectuées', value: '8', trend: '12 restantes', tone: 'cyan' },
      { label: 'Compétences validées', value: '12', trend: 'Sur le parcours REMC', tone: 'emerald' },
      { label: 'Prochaine leçon', value: 'Demain', trend: '10:00', tone: 'amber' },
      { label: 'Heures restantes', value: '15h', trend: 'Forfait 20h', tone: 'violet' },
    ],
    sections: [
      { type: 'timeline', title: 'Prochaines étapes', description: 'Ce qui vous attend cette semaine.', items: planningItems.slice(0, 3) },
    ],
  },

  studentProgress: {
    hero: {
      eyebrow: 'Progression',
      title: 'Ma progression REMC',
      subtitle: 'Visualisez les compétences validées et les modules à terminer.',
      focus: { label: 'Parcours validé', value: '65%', progress: 65, caption: 'C1 en cours, C2 à préparer.' },
    },
    metrics: [
      { label: 'C1', value: '65%', trend: 'En cours', tone: 'cyan' },
      { label: 'C2', value: '35%', trend: 'Démarré', tone: 'amber' },
      { label: 'QCM réussis', value: '8/12', trend: 'Bon niveau', tone: 'emerald' },
      { label: 'Objectifs restants', value: '7', trend: 'Avant examen blanc', tone: 'violet' },
    ],
    sections: [
      {
        title: 'Compétences REMC',
        description: 'Détail par axe pédagogique.',
        columns: 2,
        items: [
          { badge: 'C1', title: 'Maîtriser le véhicule', description: 'Installation, commandes, trajectoire, freinage.', progress: 65, tone: 'cyan' },
          { badge: 'C2', title: 'Appréhender la route', description: 'Observation, allure, intersections et priorités.', progress: 35, tone: 'amber' },
          { badge: 'C3', title: 'Partager la route', description: 'Communication et sécurité avec les autres usagers.', progress: 20, tone: 'violet' },
          { badge: 'C4', title: 'Devenir autonome', description: 'Préparation à une conduite responsable.', progress: 10, tone: 'emerald' },
        ],
      },
    ],
  },

  studentExams: {
    hero: {
      eyebrow: 'Examens',
      title: 'Préparation aux examens',
      subtitle: 'Suivez vos examens blancs, votre code et votre préparation pratique.',
      focus: { label: 'Niveau examen', value: '78%', progress: 78, caption: 'Dernier examen blanc encourageant.' },
    },
    metrics: [
      { label: 'Code', value: '34/40', trend: 'Dernier QCM', tone: 'emerald' },
      { label: 'Examens blancs', value: '3', trend: '2 réussis', tone: 'cyan' },
      { label: 'Points à revoir', value: '4', trend: 'Priorités', tone: 'amber' },
      { label: 'Date cible', value: 'Février', trend: 'À confirmer', tone: 'violet' },
    ],
    sections: [{ type: 'timeline', title: 'Préparation', description: 'Plan conseillé avant présentation.', items: [
      { time: 'Étape 1', title: 'Réviser les priorités', description: 'Intersections, contrôles et distances.', status: 'En cours', tone: 'cyan' },
      { time: 'Étape 2', title: 'Examen blanc pratique', description: 'Simulation complète avec grille d’évaluation.', status: 'À planifier', tone: 'amber' },
      { time: 'Étape 3', title: 'Validation moniteur', description: 'Avis final avant inscription.', status: 'À venir', tone: 'emerald' },
    ] }],
  },

  studentAccompaniedDriving: {
    hero: {
      eyebrow: 'Conduite accompagnée',
      title: 'Suivi conduite accompagnée',
      subtitle: 'Gardez une vision claire des kilomètres, rendez-vous pédagogiques et objectifs famille.',
      focus: { label: 'Kilomètres', value: '1 250', progress: 42, caption: 'Objectif 3 000 km avant la fin du parcours.' },
    },
    metrics: [
      { label: 'Km réalisés', value: '1 250', trend: 'Avec accompagnateur', tone: 'cyan' },
      { label: 'RDV pédagogiques', value: '1/3', trend: 'Prochain à planifier', tone: 'amber' },
      { label: 'Mois suivis', value: '5', trend: 'Parcours actif', tone: 'emerald' },
      { label: 'Objectifs', value: '8', trend: '3 validés', tone: 'violet' },
    ],
    sections: [
      {
        title: 'Objectifs famille',
        description: 'Des repères simples pour progresser hors auto-école.',
        columns: 2,
        items: [
          { badge: 'Route', title: 'Trajets variés', description: 'Ville, route, nuit et météo différente.', progress: 45, tone: 'cyan' },
          { badge: 'Sécurité', title: 'Anticipation', description: 'Distances, observation et adaptation de l’allure.', progress: 58, tone: 'emerald' },
        ],
      },
    ],
  },

  studentMessages: {
    hero: {
      eyebrow: 'Messagerie',
      title: 'Mes conversations',
      subtitle: 'Échangez avec le secrétariat et votre enseignant dans un espace clair.',
      actions: [{ label: 'Nouvelle conversation' }],
      focus: { label: 'Messages non lus', value: '2', progress: 40, caption: 'Répondez aux derniers échanges de planning.' },
    },
    metrics: [
      { label: 'Conversations', value: '6', trend: '3 actives', tone: 'cyan' },
      { label: 'Non lus', value: '2', trend: 'Aujourd’hui', tone: 'amber' },
      { label: 'Documents', value: '1', trend: 'À consulter', tone: 'violet' },
      { label: 'Temps moyen', value: '2h', trend: 'Réponse équipe', tone: 'emerald' },
    ],
    sections: [{ type: 'table', title: 'Conversations récentes', description: 'Messages triés par priorité.', columns: ['Contact', 'Sujet', 'Date', 'Statut'], rows: messageRows }],
  },

  teacherDashboard: {
    hero: {
      eyebrow: 'Espace enseignant',
      title: 'Bonjour Jean Moniteur',
      subtitle: 'Votre planning, vos élèves et vos priorités pédagogiques du jour.',
      focus: { label: 'Leçons aujourd’hui', value: '6', progress: 75, caption: 'Journée chargée mais équilibrée.' },
    },
    metrics: [
      { label: 'Élèves suivis', value: '24', trend: '4 prioritaires', tone: 'cyan' },
      { label: 'Leçons semaine', value: '32', trend: 'Planifiées', tone: 'emerald' },
      { label: 'Comptes-rendus', value: '3', trend: 'À compléter', tone: 'amber' },
      { label: 'Réussite', value: '86%', trend: 'Trimestre', tone: 'violet' },
    ],
    sections: [{ type: 'timeline', title: 'Ma journée', description: 'Leçons et actions principales.', items: planningItems }],
  },

  teacherPlanning: {
    hero: {
      eyebrow: 'Planning enseignant',
      title: 'Mon planning',
      subtitle: 'Retrouvez vos leçons, disponibilités et rendez-vous pédagogiques.',
      actions: [{ label: 'Ajouter disponibilité' }],
      focus: { label: 'Semaine remplie', value: '76%', progress: 76, caption: 'Créneaux optimisés sur 4 jours.' },
    },
    metrics: [
      { label: 'Leçons', value: '32', trend: 'Cette semaine', tone: 'cyan' },
      { label: 'Disponibilités', value: '6', trend: 'Ouvertes', tone: 'emerald' },
      { label: 'Annulations', value: '1', trend: 'À remplacer', tone: 'amber' },
      { label: 'Examens blancs', value: '4', trend: 'Planifiés', tone: 'violet' },
    ],
    sections: [{ type: 'timeline', title: 'Créneaux à venir', description: 'Vue simplifiée du planning.', items: planningItems }],
  },

  teacherÉlèves: {
    hero: {
      eyebrow: 'Mes élèves',
      title: 'Suivi des élèves',
      subtitle: 'Progression, prochaines leçons et points pédagogiques à travailler.',
      focus: { label: 'Progression moyenne', value: '68%', progress: 68, caption: 'La majorité avance au rythme prévu.' },
    },
    metrics: [
      { label: 'Élèves actifs', value: '24', trend: 'Suivis par vous', tone: 'cyan' },
      { label: 'Prêts examen', value: '5', trend: 'À confirmer', tone: 'emerald' },
      { label: 'À accompagner', value: '4', trend: 'Difficultés C2', tone: 'amber' },
      { label: 'Comptes-rendus', value: '3', trend: 'À faire', tone: 'rose' },
    ],
    sections: [{ type: 'table', title: 'Élèves suivis', description: 'Synthèse pédagogique.', columns: ['Élève', 'Formation', 'Progression', 'Action'], rows: studentRows }],
  },

  teacherLessons: {
    hero: {
      eyebrow: 'Leçons',
      title: 'Préparation et comptes-rendus',
      subtitle: 'Organisez vos leçons, objectifs REMC et observations après séance.',
      actions: [actions.newLesson],
      focus: { label: 'Comptes-rendus', value: '3', progress: 60, caption: 'À compléter avant fin de journée.' },
    },
    metrics: [
      { label: 'Leçons du jour', value: '6', trend: '4 réalisées', tone: 'cyan' },
      { label: 'Objectifs validés', value: '18', trend: 'Cette semaine', tone: 'emerald' },
      { label: 'À reporter', value: '1', trend: 'Absence élève', tone: 'amber' },
      { label: 'Supports utilisés', value: '9', trend: 'REMC', tone: 'violet' },
    ],
    sections: [
      {
        title: 'Objectifs pédagogiques',
        description: 'Préparation rapide des prochaines séances.',
        columns: 2,
        items: [
          { badge: 'C1', title: 'Maniement du véhicule', description: 'Installation, démarrage, trajectoire.', progress: 70, tone: 'cyan' },
          { badge: 'C2', title: 'Adapter son allure', description: 'Observation, intersections et priorités.', progress: 45, tone: 'amber' },
        ],
      },
    ],
  },

  teacherResources: {
    hero: {
      eyebrow: 'Ressources pédagogiques',
      title: 'Guide REMC et supports d’enseignement',
      subtitle: 'Accédez aux compétences, manoeuvres et conseils pédagogiques dans une interface lisible.',
      focus: { label: 'Supports disponibles', value: '36', progress: 90, caption: 'Bibliothèque structurée par compétence.' },
    },
    metrics: [
      { label: 'Compétences REMC', value: '4', trend: 'Référentiel complet', tone: 'cyan' },
      { label: 'Manoeuvres', value: '9', trend: 'Fiches pratiques', tone: 'emerald' },
      { label: 'Conseils', value: '18', trend: 'Pédagogie', tone: 'violet' },
      { label: 'Mises à jour', value: '3', trend: 'Ce mois-ci', tone: 'amber' },
    ],
    sections: [
      {
        title: 'Compétences REMC',
        description: 'Une lecture claire des axes d’apprentissage.',
        columns: 2,
        items: [
          { badge: 'C1', title: 'Maîtriser le véhicule', description: 'Trafic faible ou nul, commandes et trajectoire.', tone: 'cyan' },
          { badge: 'C2', title: 'Appréhender la route', description: 'Observer, prévoir, choisir son allure.', tone: 'amber' },
          { badge: 'C3', title: 'Partager la route', description: 'Communication, sécurité et cohabitation.', tone: 'violet' },
          { badge: 'C4', title: 'Autonomie', description: 'Conduite responsable, économique et citoyenne.', tone: 'emerald' },
        ],
      },
    ],
  },

  teacherProfile: {
    hero: {
      eyebrow: 'Profil',
      title: 'Mon profil enseignant',
      subtitle: 'Informations personnelles, disponibilités et préférences de notification.',
      actions: [actions.save],
      focus: { label: 'Profil complété', value: '88%', progress: 88, caption: 'Ajoutez vos horaires préférés pour finaliser.' },
    },
    metrics: [
      { label: 'Élèves suivis', value: '24', trend: 'Actifs', tone: 'cyan' },
      { label: 'Spécialités', value: '3', trend: 'Permis B, AAC, code', tone: 'emerald' },
      { label: 'Disponibilités', value: '32h', trend: 'Semaine', tone: 'amber' },
      { label: 'Avis', value: '4.8/5', trend: 'Élèves', tone: 'violet' },
    ],
    sections: [
      {
        title: 'Informations',
        description: 'Données principales du profil.',
        columns: 2,
        items: [
          { badge: 'Identité', title: 'Marie Dupont', description: 'demo@example.com · Enseignant', tone: 'cyan' },
          { badge: 'Préférences', title: 'Notifications activées', description: 'Rappels de leçon et changements planning.', tone: 'emerald' },
        ],
      },
    ],
  },

  secretaryDashboard: {
    hero: {
      eyebrow: 'Secrétariat',
      title: 'Bonjour Isabelle !',
      subtitle: 'Vue opérationnelle des inscriptions, paiements, documents et rendez-vous.',
      focus: { label: 'Dossiers traités', value: '74%', progress: 74, caption: 'Bonne avancée sur les priorités du jour.' },
    },
    metrics: [
      { label: 'Inscriptions mois', value: '12', trend: '3 à finaliser', tone: 'cyan' },
      { label: 'RDV aujourd’hui', value: '5', trend: 'Accueil et évaluations', tone: 'emerald' },
      { label: 'Paiements', value: '4 235 €', trend: 'Mois en cours', tone: 'amber' },
      { label: 'Documents', value: '7', trend: 'À contrôler', tone: 'violet' },
    ],
    sections: [{ type: 'timeline', title: 'Priorités secrétariat', description: 'Actions à réaliser aujourd’hui.', items: planningItems.slice(0, 3) }],
  },

  secretaryInscriptions: {
    hero: {
      eyebrow: 'Inscriptions',
      title: 'Gestion des inscriptions',
      subtitle: 'Centralisez les nouveaux dossiers, statuts et pièces manquantes.',
      actions: [actions.export, { label: 'Nouvelle inscription' }],
      focus: { label: 'Dossiers complets', value: '10/15', progress: 67, caption: '5 dossiers nécessitent une action.' },
    },
    metrics: [
      { label: 'Inscrits', value: '15', trend: 'Ce mois-ci', tone: 'cyan' },
      { label: 'Validés', value: '10', trend: 'Dossiers complets', tone: 'emerald' },
      { label: 'En attente', value: '2', trend: 'Signature ou paiement', tone: 'amber' },
      { label: 'En cours', value: '3', trend: 'Pièces manquantes', tone: 'violet' },
    ],
    sections: [{ type: 'table', title: 'Dossiers élèves', description: 'Suivi manageristratif.', columns: ['Élève', 'Formation', 'Progression', 'Action'], rows: studentRows }],
  },

  secretaryPlanning: {
    hero: {
      eyebrow: 'Planning',
      title: 'Planning global de la semaine',
      subtitle: 'Coordonnez enseignants, véhicules et rendez-vous élèves.',
      actions: [{ label: 'Imprimer', variant: 'secondary' }, { label: 'Nouveau créneau' }],
      focus: { label: 'Occupation', value: '80%', progress: 80, caption: 'Planning équilibré sur la semaine.' },
    },
    metrics: [
      { label: 'Créneaux', value: '96', trend: 'Semaine', tone: 'cyan' },
      { label: 'Enseignants', value: '5', trend: 'Mobilisés', tone: 'emerald' },
      { label: 'Véhicules', value: '7', trend: 'Disponibles', tone: 'amber' },
      { label: 'Conflits', value: '1', trend: 'À corriger', tone: 'rose' },
    ],
    sections: [{ type: 'timeline', title: 'Aperçu du planning', description: 'Créneaux principaux.', items: planningItems }],
  },

  secretaryPaiements: {
    hero: {
      eyebrow: 'Paiements',
      title: 'Gestion des paiements',
      subtitle: 'Suivi financier, encaissements et exports comptables.',
      actions: [{ label: 'Export comptable', variant: 'secondary' }, { label: 'Enregistrer un paiement' }],
      focus: { label: 'CA du mois', value: '4 235 €', progress: 76, caption: 'Encaissements solides, relances limitées.' },
    },
    metrics: [
      { label: 'CA mois', value: '4 235 €', trend: 'À date', tone: 'emerald' },
      { label: 'Paiements encaissés', value: '11', trend: 'Ce mois-ci', tone: 'cyan' },
      { label: 'En attente', value: '4', trend: 'À relancer', tone: 'amber' },
      { label: 'Exports', value: 'OK', trend: 'Comptabilité prête', tone: 'violet' },
    ],
    sections: [{ type: 'table', title: 'Encaissements', description: 'Suivi des règlements.', columns: ['Élève', 'Objet', 'Montant', 'Statut'], rows: paymentRows }],
  },

  secretaryDocuments: {
    hero: {
      eyebrow: 'Documents',
      title: 'Gestion documentaire',
      subtitle: 'Contrôlez les pièces élèves, contrats et documents manageristratifs.',
      actions: [actions.export, { label: 'Ajouter document' }],
      focus: { label: 'Documents validés', value: '86%', progress: 86, caption: 'Quelques pièces restent à relancer.' },
    },
    metrics: [
      { label: 'À vérifier', value: '7', trend: 'Dossiers élèves', tone: 'amber' },
      { label: 'Validés', value: '48', trend: 'Ce mois-ci', tone: 'emerald' },
      { label: 'Contrats', value: '12', trend: 'Classés', tone: 'cyan' },
      { label: 'Relances', value: '3', trend: 'Automatiques', tone: 'violet' },
    ],
    sections: [
      {
        title: 'Catégories',
        description: 'Organisation claire des documents.',
        columns: 2,
        items: [
          { badge: 'Élève', title: 'Pièces identité', description: 'Carte identité, justificatif domicile et ASSR.', tone: 'cyan' },
          { badge: 'Contrat', title: 'Documents signés', description: 'Contrats, avenants et mandats de paiement.', tone: 'emerald' },
          { badge: 'Examen', title: 'Dossiers préfecture', description: 'Documents nécessaires aux présentations examen.', tone: 'amber' },
          { badge: 'Archive', title: 'Historique manageristratif', description: 'Documents clôturés et exports.', tone: 'violet' },
        ],
      },
    ],
  },

  secretaryMessages: {
    hero: {
      eyebrow: 'Messages',
      title: 'Messages du secrétariat',
      subtitle: 'Centralisez les demandes élèves, enseignants et manageristratives.',
      actions: [{ label: 'Nouveau message' }],
      focus: { label: 'Non lus', value: '5', progress: 55, caption: 'Demandes de planning et documents à traiter.' },
    },
    metrics: [
      { label: 'Conversations', value: '18', trend: 'Actives', tone: 'cyan' },
      { label: 'Non lus', value: '5', trend: 'Aujourd’hui', tone: 'amber' },
      { label: 'Urgents', value: '2', trend: 'À répondre', tone: 'rose' },
      { label: 'Traités', value: '31', trend: 'Cette semaine', tone: 'emerald' },
    ],
    sections: [{ type: 'table', title: 'Demandes récentes', description: 'Messages à suivre.', columns: ['Contact', 'Sujet', 'Date', 'Statut'], rows: messageRows }],
  },

  teacherMessages: {
    hero: {
      eyebrow: 'Messagerie enseignant',
      title: 'Conversations pédagogiques',
      subtitle: 'Suivez les échanges avec élèves, secrétariat et Gérant.',
      actions: [{ label: 'Nouveau message' }],
      focus: { label: 'Non lus', value: '4', progress: 48, caption: 'Réponses élèves et demandes planning à traiter.' },
    },
    metrics: [
      { label: 'Élèves', value: '12', trend: 'Conversations actives', tone: 'cyan' },
      { label: 'Secrétariat', value: '3', trend: 'Demandes planning', tone: 'emerald' },
      { label: 'Urgents', value: '2', trend: 'À répondre', tone: 'amber' },
      { label: 'Archivés', value: '28', trend: 'Historique pédagogique', tone: 'violet' },
    ],
    sections: [
      {
        type: 'table',
        title: 'Discussions récentes',
        description: 'Chaque ligne est ouvrable pour accéder au suivi.',
        columns: ['Contact', 'Sujet', 'Date', 'Statut'],
        rows: [
          ['Thomas Martin', 'Objectifs C2', 'Aujourd’hui', 'Nouveau'],
          ['Camille Leroy', 'RVP AAC', 'Hier', 'À répondre'],
          ['Secrétariat', 'Changement véhicule', 'Lundi', 'Traité'],
          ['Gérant', 'Validation bilan', 'Vendredi', 'Lu'],
        ],
      },
    ],
  },

  secretaryExams: {
    hero: {
      eyebrow: 'Examens',
      title: 'Gestion des examens',
      subtitle: 'Planifiez les présentations, contrôlez les dossiers et suivez les résultats.',
      actions: [{ label: 'Planifier examen' }, actions.export],
      focus: { label: 'Dossiers prêts', value: '8/11', progress: 73, caption: 'Trois dossiers nécessitent un contrôle manageristratif.' },
    },
    metrics: [
      { label: 'Examens planifiés', value: '11', trend: 'Ce mois-ci', tone: 'cyan' },
      { label: 'Dossiers prêts', value: '8', trend: 'ANTS complet', tone: 'emerald' },
      { label: 'À contrôler', value: '3', trend: 'Pièces manquantes', tone: 'amber' },
      { label: 'Réussites', value: '82%', trend: '3 derniers mois', tone: 'violet' },
    ],
    sections: [
      {
        type: 'table',
        title: 'Présentations examen',
        description: 'Ouverture rapide du dossier candidat.',
        columns: ['Élève', 'Type', 'Date', 'Statut'],
        rows: [
          ['Sarah Petit', 'Permis B', '22 janvier', 'Prête'],
          ['Thomas Martin', 'Examen blanc', '24 janvier', 'À confirmer'],
          ['Camille Leroy', 'Code', '26 janvier', 'Dossier prêt'],
          ['Lucas Bernard', 'Permis B', '31 janvier', 'Pièce manquante'],
        ],
      },
    ],
  },

  adminUsers: {
    hero: {
      eyebrow: 'Utilisateurs',
      title: 'Gestion utilisateurs',
      subtitle: 'Supervisez les accès élèves, enseignants, secrétariat et Gérant.',
      actions: [{ label: 'Créer utilisateur' }, actions.export],
      focus: { label: 'Comptes actifs', value: '64', progress: 88, caption: 'Accès contrôlés et rôles correctement affectés.' },
    },
    metrics: [
      { label: 'Élèves', value: '42', trend: 'Actifs', tone: 'cyan' },
      { label: 'Enseignants', value: '5', trend: 'Accès pédagogiques', tone: 'emerald' },
      { label: 'Secrétariat', value: '3', trend: 'Gestion dossiers', tone: 'amber' },
      { label: 'Gérants', value: '2', trend: 'Supervision', tone: 'violet' },
    ],
    sections: [
      {
        type: 'table',
        title: 'Comptes utilisateurs',
        description: 'Ouverture de fiche utilisateur et contrôle des rôles.',
        columns: ['Utilisateur', 'Rôle', 'Accès', 'Statut'],
        rows: [
          ['Thomas Martin', 'Élève', 'Espace élève', 'Actif'],
          ['Jean Moniteur', 'Enseignant', 'Pédagogie', 'Actif'],
          ['Isabelle Lemoine', 'Secrétariat', 'Dossiers', 'Actif'],
          ['Gérant', 'Gérant', 'Supervision', 'Actif'],
        ],
      },
    ],
  },
}

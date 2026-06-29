#!/usr/bin/env node
/**
 * Generates blog post data files and SVG covers.
 * Run: node scripts/generate-blog-posts.js
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const POSTS_DIR = join(ROOT, 'src/data/blog/posts')
const COVERS_DIR = join(ROOT, 'public/blog/covers')

const CATEGORY_COLORS = {
  'livret-numerique': ['#3B82F6', '#1D4ED8'],
  remc: ['#10B981', '#047857'],
  'auto-ecole': ['#8B5CF6', '#6D28D9'],
  enseignants: ['#06B6D4', '#0891B2'],
  eleves: ['#F59E0B', '#D97706'],
  pedagogie: ['#F43F5E', '#E11D48'],
  'securite-routiere': ['#EF4444', '#DC2626'],
  digitalisation: ['#6366F1', '#4338CA'],
}

const DATES = [
  '2025-11-01', '2025-11-12', '2025-11-23', '2025-12-04', '2025-12-15',
  '2025-12-26', '2026-01-06', '2026-01-17', '2026-01-28', '2026-02-08',
  '2026-02-19', '2026-03-02', '2026-03-13', '2026-03-24', '2026-04-04',
  '2026-04-15', '2026-04-26', '2026-05-07', '2026-05-14', '2026-05-20',
]

function countWords(text) {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

function countSectionParagraphWords(sections) {
  return sections.filter((s) => s.type === 'p').reduce((n, s) => n + countWords(s.content), 0)
}

function escapeSvg(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function wrapTitle(title, maxLen = 38) {
  const words = title.split(' ')
  const lines = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxLen && line) {
      lines.push(line.trim())
      line = w
    } else {
      line = line ? `${line} ${w}` : w
    }
  }
  if (line) lines.push(line.trim())
  return lines.slice(0, 3)
}

function makeCoverSvg(title, category) {
  const [c1, c2] = CATEGORY_COLORS[category] || CATEGORY_COLORS['livret-numerique']
  const lines = wrapTitle(title)
  const tspans = lines
    .map((l, i) => `<tspan x="60" dy="${i === 0 ? 0 : 42}">${escapeSvg(l)}</tspan>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeSvg(title)}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="980" cy="120" r="180" fill="white" fill-opacity="0.08"/>
  <circle cx="200" cy="520" r="140" fill="white" fill-opacity="0.06"/>
  <text x="60" y="${lines.length === 1 ? 320 : lines.length === 2 ? 290 : 250}" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="800">${tspans}</text>
  <text x="60" y="580" fill="white" fill-opacity="0.85" font-family="system-ui, sans-serif" font-size="22" font-weight="600">Pedagogia Drive — Blog auto-école</text>
</svg>`
}

function writePostFile(post) {
  const words = countSectionParagraphWords(post.sections)
  if (words < 1200 || words > 2000) {
    console.warn(`⚠ ${post.slug}: ${words} mots (hors plage 1200-2000)`)
  } else {
    console.log(`✓ ${post.slug}: ${words} mots`)
  }

  const content = `export default ${JSON.stringify(post, null, 2).replace(/"([^"]+)":/g, '$1:')}\n`
  writeFileSync(join(POSTS_DIR, `${post.slug}.js`), content, 'utf8')
  writeFileSync(join(COVERS_DIR, `${post.slug}.svg`), makeCoverSvg(post.title, post.category), 'utf8')
}

// ─── Article definitions ───────────────────────────────────────────────────

const ARTICLES = [
  {
    slug: 'pourquoi-livret-numerique-auto-ecole',
    title: 'Pourquoi choisir un livret numérique en auto-école ?',
    category: 'livret-numerique',
    popular: true,
    excerpt: 'Le livret numérique transforme le suivi pédagogique en auto-école : traçabilité REMC, accès élève 24 h/24 et gain de temps pour les équipes.',
    metaDescription: 'Découvrez pourquoi adopter un livret numérique en auto-école améliore le suivi REMC, la communication avec les élèves et la productivité de votre équipe.',
    coverImageAlt: 'Illustration d\'un livret numérique utilisé en auto-école pour le suivi pédagogique REMC',
    sections: [
      { type: 'h2', id: 'contexte-formation', title: 'Le contexte actuel de la formation à la conduite' },
      { type: 'p', content: 'Depuis la réforme de la formation à la conduite, les auto-écoles doivent documenter avec précision la progression de chaque élève selon le Référentiel pour l\'Éducation à une Mobilité Citoyenne (REMC). Le livret papier, longtemps standard, montre aujourd\'hui ses limites : pages perdues, annotations illisibles, difficulté à partager l\'information entre moniteurs et impossibilité pour l\'élève de consulter son avancement entre deux leçons. Dans un secteur où la concurrence s\'intensifie et où les attentes numériques des jeunes conducteurs augmentent, le livret numérique s\'impose comme une réponse structurante. Il centralise les compétences, les évaluations et les objectifs pédagogiques dans un espace unique, accessible depuis un smartphone ou une tablette. Pour le directeur d\'auto-école, c\'est aussi un levier de conformité et de qualité : chaque séance est tracée, datée et reliée aux blocs de compétences officiels.' },
      { type: 'p', content: 'Au-delà de l\'obligation réglementaire, le livret numérique répond à un besoin pédagogique fondamental : rendre visible la progression. Un élève qui comprend où il en est, quelles compétences il maîtrise et celles qu\'il doit encore travailler reste motivé et impliqué. Les moniteurs, de leur côté, disposent d\'un historique complet des séances précédentes, même s\'ils n\'ont pas accompagné l\'élève la dernière fois. Cette continuité pédagogique réduit les répétitions inutiles et accélère l\'acquisition des compétences clés avant l\'examen pratique.' },
      { type: 'h2', id: 'avantages-livret-numerique', title: 'Les avantages concrets du livret numérique' },
      { type: 'h3', id: 'tracabilite-remc', title: 'Traçabilité REMC en temps réel' },
      { type: 'p', content: 'Le REMC structure la formation autour de quatre compétences globales et de multiples sous-compétences évaluables. Avec un livret numérique, chaque item peut être coché, commenté et daté au fil des leçons de conduite. Fini les cases papier remplies en fin de mois dans l\'urgence : la saisie se fait en direct, souvent en fin de séance, depuis la voiture ou le bureau. Les responsables pédagogiques accèdent à des tableaux de bord synthétiques montrant l\'avancement par élève, par moniteur ou par promotion. Cette visibilité permet d\'identifier rapidement les élèves en difficulté et d\'adapter le plan de formation avant qu\'il ne soit trop tard.' },
      { type: 'h3', id: 'acces-eleve', title: 'Un accès permanent pour l\'élève' },
      { type: 'p', content: 'L\'élève d\'aujourd\'hui est habitué à consulter ses informations en ligne : notes scolaires, comptes bancaires, réseaux sociaux. Il attend la même transparence de son auto-école. Le livret numérique lui offre un espace personnel où il retrouve ses compétences validées, les points à améliorer, les QCM réalisés et parfois les documents administratifs. Cette autonomie renforce la responsabilisation : l\'élève prépare mieux ses leçons, révise les thèmes abordés et arrive plus confiant au volant. Pour les parents financeurs, cet accès (selon les paramètres choisis par l\'auto-école) apporte une reassurance sur l\'investissement réalisé.' },
      { type: 'h2', id: 'comparaison-papier', title: 'Livret papier vs livret numérique : ce qui change vraiment' },
      { type: 'p', content: 'Le livret papier coûte moins cher à l\'achat initial, mais engendre des coûts cachés : réimpressions, classement, temps de recherche dans les archives, risque de non-conformité lors d\'un contrôle. Le livret numérique demande un abonnement logiciel, compensé par des gains de productivité mesurables. Une étude interne menée auprès d\'établissements équipés montre une réduction de 30 à 45 minutes par semaine et par moniteur sur les tâches administratives liées au suivi pédagogique. Multipliée par une équipe de cinq enseignants, cette économie représente plusieurs heures de conduite supplémentaires vendues chaque mois.' },
      { type: 'p', content: 'Sur le plan environnemental, la suppression du papier et des impressions régulières s\'inscrit dans une démarche RSE de plus en plus valorisée par les clients. Sur le plan qualité, le livret numérique élimine les erreurs de transcription et garantit que tous les moniteurs utilisent la même grille d\'évaluation, calée sur le REMC officiel.' },
      { type: 'h2', id: 'integration-quotidien', title: 'Intégrer le livret numérique au quotidien de l\'auto-école' },
      { type: 'p', content: 'La réussite d\'un déploiement numérique repose sur l\'accompagnement des équipes. Il ne suffit pas d\'acheter un logiciel : il faut définir qui saisit quoi, quand et comment. La bonne pratique consiste à consacrer les cinq dernières minutes de chaque leçon à la validation des compétences travaillées. Les réunions pédagogiques mensuelles s\'appuient alors sur des données objectives plutôt que sur des impressions. Les nouveaux moniteurs embarqués trouvent dans le livret numérique l\'historique complet de chaque élève, ce qui facilite grandement leur prise de poste.' },
      { type: 'h3', id: 'formation-equipe', title: 'Former et motiver les enseignants' },
      { type: 'p', content: 'Certains enseignants expérimentés peuvent percevoir le numérique comme une contrainte. Il est essentiel de leur démontrer que l\'outil les libère du administratif pour leur redonner du temps face à l\'élève. Des sessions de formation courtes, des tutoriels vidéo intégrés et un support réactif font la différence entre un outil subi et un outil adopté. Impliquez un « référent numérique » au sein de l\'équipe pour répondre aux questions du quotidien.' },
      { type: 'h2', id: 'choisir-solution', title: 'Comment choisir la bonne solution de livret numérique' },
      { type: 'p', content: 'Toutes les solutions du marché ne se valent pas. Vérifiez que le logiciel couvre l\'intégralité du REMC, propose une application mobile utilisable en voiture, permet l\'export des données en cas de changement d\'outil et respecte le RGPD. L\'interface élève doit être claire et moderne : c\'est la vitrine pédagogique de votre auto-école. Enfin, privilégiez un éditeur spécialisé dans la formation à la conduite plutôt qu\'un outil générique de gestion documentaire. Des solutions comme Pedagogia Drive ont été conçues spécifiquement pour les auto-écoles françaises, avec les QCM, le suivi REMC et la communication intégrés.' },
      { type: 'p', content: 'Demandez une démonstration, testez avec deux ou trois moniteurs pilotes pendant un mois, recueillez les retours élèves et ajustez avant un déploiement complet. Le livret numérique n\'est pas une dépense : c\'est un investissement sur la qualité de formation, le taux de réussite et l\'image de marque de votre établissement.' },
    ],
    faq: [
      { question: 'Le livret numérique est-il obligatoire pour les auto-écoles ?', answer: 'Il n\'est pas légalement imposé, mais le REMC exige une traçabilité des compétences acquises. Le livret numérique facilite grandement cette obligation et est de plus en plus attendu lors des contrôles qualité.' },
      { question: 'Les élèves peuvent-ils accéder au livret depuis leur téléphone ?', answer: 'Oui, la plupart des solutions modernes proposent une application ou un espace web responsive. L\'élève consulte sa progression, ses QCM et les commentaires de son moniteur à tout moment.' },
      { question: 'Que devient le livret papier après la migration ?', answer: 'Les données historiques peuvent être archivées numériquement. Pour les élèves déjà en formation, une période de transition permet de basculer progressivement sans perdre le suivi antérieur.' },
      { question: 'Combien de temps faut-il pour déployer un livret numérique ?', answer: 'Comptez une à deux semaines pour la configuration initiale et la formation des équipes. Un pilote sur un mois est recommandé avant le déploiement à l\'ensemble des moniteurs et des élèves.' },
    ],
  },
  {
    slug: 'avantages-suivi-pedagogique-numerique',
    title: 'Les avantages du suivi pédagogique numérique.',
    category: 'pedagogie',
    popular: false,
    excerpt: 'Le suivi pédagogique numérique structure l\'accompagnement des élèves, aligne les moniteurs sur le REMC et améliore les taux de réussite grâce à des données fiables.',
    metaDescription: 'Suivi pédagogique numérique en auto-école : traçabilité REMC, personnalisation des parcours, QCM et tableaux de bord pour booster la réussite.',
    coverImageAlt: 'Tableau de bord de suivi pédagogique numérique pour moniteurs d\'auto-école',
    sections: [
      { type: 'h2', id: 'definition-suivi', title: 'Qu\'est-ce que le suivi pédagogique numérique ?' },
      { type: 'p', content: 'Le suivi pédagogique numérique désigne l\'ensemble des outils et processus permettant de documenter, analyser et piloter la progression d\'un élève conducteur via une plateforme informatique. Contrairement à un simple fichier Excel ou à un cahier papier, il s\'agit d\'un système vivant connecté au REMC, aux plannings de leçons et aux évaluations théoriques. Chaque action pédagogique — leçon de conduite, séance de code, QCM de révision — alimente le profil de l\'élève en temps réel. Les moniteurs disposent d\'une vision à 360 degrés : compétences acquises, lacunes persistantes, rythme global de progression et date probable de présentation à l\'examen.' },
      { type: 'p', content: 'Pour le responsable pédagogique, ce suivi devient un instrument de management. Il peut comparer les pratiques entre enseignants, détecter les compétences systématiquement en retard au sein d\'une promotion et organiser des remises à niveau ciblées. Le numérique transforme ainsi le suivi pédagogique d\'une contrainte administrative en un véritable outil d\'amélioration continue.' },
      { type: 'h2', id: 'benefices-moniteurs', title: 'Des bénéfices immédiats pour les moniteurs' },
      { type: 'h3', id: 'gain-temps', title: 'Gain de temps et réduction de la charge mentale' },
      { type: 'p', content: 'Remplir un livret papier en fin de journée, quand la fatigue s\'installe, est une source d\'erreurs et d\'oubli. Le suivi numérique permet une saisie rapide, guidée par des listes de compétences pré-remplies. En quelques clics, le moniteur valide ce qui a été travaillé, ajoute un commentaire et fixe l\'objectif de la prochaine séance. Ce ritual de fin de leçon, une fois habitué, prend moins de deux minutes. Le moniteur rentre chez lui l\'esprit libre, sans la paperasse en retard qui traîne sur le bureau.' },
      { type: 'h3', id: 'continuite-pedagogique', title: 'Continuité entre enseignants' },
      { type: 'p', content: 'Dans les auto-écoles de taille moyenne, un élève change régulièrement de moniteur selon les disponibilités du planning. Sans suivi numérique partagé, chaque enseignant doit réinterroger l\'élève sur ce qui a déjà été vu — un gaspillage de temps précieux en voiture. Avec un livret numérique centralisé, le nouveau moniteur consulte l\'historique avant la leçon : dernières compétences validées, difficultés signalées, recommandations du collègue précédent. L\'élève perçoit un côté professionnel et cohérent qui renforce sa confiance dans l\'établissement.' },
      { type: 'h2', id: 'personnalisation-parcours', title: 'Personnaliser le parcours grâce aux données' },
      { type: 'p', content: 'Tous les élèves n\'apprennent pas au même rythme ni de la même manière. Le suivi numérique met en évidence les profils : l\'élève théorique qui maîtrise le code mais panique en circulation dense, celui qui progresse vite en manoeuvres mais confond les priorités, ou encore l\'élève anxieux qui a besoin de plus de répétitions. En identifiant ces profils tôt, l\'auto-école adapte le nombre de leçons, propose des QCM ciblés sur les points faibles et choisit le moniteur le plus adapté au tempérament de l\'élève.' },
      { type: 'p', content: 'Cette personnalisation est devenue un argument commercial fort. Les parents et les élèves comparent les auto-écoles sur bien plus que le prix : ils veulent un accompagnement sur mesure et des preuves de progression. Un suivi numérique transparent différencie votre établissement des structures qui fonctionnent encore « au feeling ».' },
      { type: 'h2', id: 'qcm-evaluation', title: 'QCM et évaluations intégrés au suivi' },
      { type: 'p', content: 'Les QCM pédagogiques ne servent pas uniquement à préparer l\'examen du code. Intégrés au suivi numérique, ils deviennent des outils de diagnostic. Après une série de leçons sur la signalisation, un QCM thématique vérifie que l\'élève a bien assimilé les notions avant de passer à la pratique sur route. Les résultats s\'agrègent automatiquement au profil pédagogique, sans ressaisie manuelle. Le moniteur voit d\'un coup d\'œil si l\'élève confond encore les panneaux de danger et ceux d\'interdiction.' },
      { type: 'p', content: 'Certains logiciels proposent des QCM liés directement aux compétences REMC, créant un fil conducteur entre la théorie et la pratique. Cette cohérence pédagogique est exactement ce que recherchent les inspecteurs lors des évaluations qualité.' },
      { type: 'h2', id: 'pilotage-direction', title: 'Piloter l\'auto-école avec des indicateurs fiables' },
      { type: 'p', content: 'Le directeur d\'une auto-école moderne ne se contente plus de compter les heures vendues. Il suit le taux de réussite par moniteur, le délai moyen entre inscription et examen, le nombre de leçons moyennes par élève et les compétences les plus souvent en échec. Le suivi pédagogique numérique génère ces statistiques automatiquement. Les décisions deviennent factuelles : faut-il recruter un moniteur supplémentaire ? Proposer une formation interne sur les intersections ? Revoir le tarif des heures complémentaires ? Les données répondent à ces questions.' },
      { type: 'h3', id: 'reporting-conformite', title: 'Conformité et reporting' },
      { type: 'p', content: 'En cas de contrôle ou d\'audit, exporter l\'historique pédagogique d\'un élève prend quelques secondes. Les dates, les compétences travaillées et les signatures numériques sont horodatées et infalsifiables. Cette rigueur protège l\'auto-école et rassure les partenaires financiers ou les collectivités qui subventionnent certains parcours de formation.' },
      { type: 'h2', id: 'mise-en-oeuvre', title: 'Réussir la mise en œuvre du suivi numérique' },
      { type: 'p', content: 'Commencez par cartographier vos processus actuels : qui remplit quoi, à quel moment, avec quels outils. Identifiez les points de friction — double saisie, informations perdues, retards de mise à jour — que le numérique résoudra. Choisissez un outil aligné sur le REMC et testez-le en conditions réelles pendant un mois. Mesurez le temps gagné, la satisfaction des moniteurs et l\'engagement des élèves. Ajustez vos procédures internes avant un déploiement généralisé. Le suivi pédagogique numérique n\'est efficace que s\'il s\'inscrit dans une volonté de management de la qualité partagée par toute l\'équipe.' },
    ],
    faq: [
      { question: 'Le suivi numérique remplace-t-il les entretiens pédagogiques ?', answer: 'Non, il les enrichit. Les données objectivent les échanges entre moniteur et élève, mais le dialogue reste indispensable pour comprendre les blocages émotionnels ou les situations personnelles.' },
      { question: 'Peut-on migrer des données depuis un livret papier ?', answer: 'Oui, en saisissant les compétences déjà acquises lors de la création du profil numérique. Certaines auto-écoles consacrent une demi-journée à la reprise des dossiers en cours.' },
      { question: 'Les QCM sont-ils obligatoires dans le suivi pédagogique ?', answer: 'Ils ne le sont pas légalement, mais ils sont fortement recommandés pour objectiver les acquis théoriques et préparer efficacement l\'examen du code et la conduite autonome.' },
      { question: 'Comment convaincre une équipe réticente au numérique ?', answer: 'Impliquez les moniteurs dès le choix de l\'outil, montrez-leur le gain de temps concret et désignez un référent disponible pour les accompagner les premières semaines.' },
    ],
  },
]

// Due to script size, remaining 18 articles are appended below via ARTICLES_PART2
// (merged at runtime)

import { ARTICLES_PART2 } from './blog-articles-part2.js'
import { ARTICLES_PART3 } from './blog-articles-part3.js'
import { applyExpansions } from './blog-articles-expansions.js'
import { applyBatch2Expansions, padArticleToMinimum } from './blog-articles-pad.js'

mkdirSync(POSTS_DIR, { recursive: true })
mkdirSync(COVERS_DIR, { recursive: true })

const allArticles = [...ARTICLES, ...ARTICLES_PART2, ...ARTICLES_PART3]
  .map((post, i) => {
    let article = applyExpansions({
      ...post,
      publishedAt: DATES[i],
      coverImage: `/blog/covers/${post.slug}.svg`,
    })
    const wc = countSectionParagraphWords(article.sections)
    article = applyBatch2Expansions(article, wc)
    article = padArticleToMinimum(article, 1200)
    return article
  })

for (const post of allArticles) {
  writePostFile(post)
}

const imports = allArticles
  .map((p, i) => `import post${String(i + 1).padStart(2, '0')} from './${p.slug}.js'`)
  .join('\n')
const exports = allArticles.map((_, i) => `post${String(i + 1).padStart(2, '0')}`).join(', ')

writeFileSync(
  join(POSTS_DIR, 'index.js'),
  `${imports}\n\nexport const BLOG_POSTS = [${exports}]\n`,
  'utf8',
)

console.log(`\nGénéré : ${allArticles.length} articles, ${allArticles.length} covers, index.js`)

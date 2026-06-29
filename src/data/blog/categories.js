export const BLOG_CATEGORIES = [
  { id: 'livret-numerique', label: 'Livret numérique', color: 'blue' },
  { id: 'remc', label: 'REMC', color: 'emerald' },
  { id: 'auto-ecole', label: 'Auto-école', color: 'violet' },
  { id: 'enseignants', label: 'Enseignants', color: 'cyan' },
  { id: 'eleves', label: 'Élèves', color: 'amber' },
  { id: 'pedagogie', label: 'Pédagogie', color: 'rose' },
  { id: 'securite-routiere', label: 'Sécurité routière', color: 'red' },
  { id: 'digitalisation', label: 'Digitalisation', color: 'indigo' },
]

export const BLOG_CATEGORY_MAP = Object.fromEntries(BLOG_CATEGORIES.map((c) => [c.id, c]))

export function getCategoryLabel(categoryId) {
  return BLOG_CATEGORY_MAP[categoryId]?.label ?? categoryId
}

export const CATEGORY_BADGE_CLASS = {
  blue: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200',
  emerald: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  violet: 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200',
  cyan: 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200',
  amber: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200',
  rose: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200',
  red: 'border-red-300 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200',
  indigo: 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-200',
}

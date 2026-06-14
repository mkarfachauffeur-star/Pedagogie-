export const roleDestinations = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  secretary: '/secretary/dashboard',
  manager: '/manager/dashboard',
  super_admin: '/platform/dashboard',
}

export const roleLabels = {
  student: 'Élève',
  teacher: 'Enseignant',
  secretary: 'Secrétariat',
  manager: 'Gérant',
  super_admin: 'Super Admin',
}

/** Purge les clés localStorage héritées du mode démo (appelé au démarrage). */
export function purgeLegacyDemoStorage() {
  if (typeof window === 'undefined') return
  const keys = [
    'pedagogia-drive-auth-role',
    'pedagogia-drive-encaissements-v1',
  ]
  keys.forEach((key) => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore
    }
  })
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('pedagogia:practice-exams:'))
      .forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // ignore
  }
  // REMC : pedagogia-drive-student-tracking* et pedagogia:remc-competency:*
  // sont migrés vers Supabase par remcItems.migrateLocalStorageRemcIfNeeded
}

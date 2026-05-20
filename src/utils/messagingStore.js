const STORAGE_KEY = 'pedagogia-drive-messaging'

const defaultStudentSecretaryThread = {
  id: 'student-secretary',
  studentName: 'Thomas',
  secretaryName: 'Secr\u00e9tariat',
  subject: 'Envoi de documents \u00e9l\u00e8ve',
  messages: [
    {
      from: 'Secr\u00e9tariat',
      fromRole: 'secretary',
      time: "Aujourd'hui 09:15",
      text: 'Bonjour, vous pouvez envoyer ici vos documents.',
      documents: [],
    },
  ],
}

function normalizeFrenchText(value = '') {
  return String(value)
    // Repair legacy replacement-character corruption from localStorage.
    .replace(/Secr\uFFFDtariat/gi, 'Secr\u00e9tariat')
    .replace(/g\uFFFDrant/gi, 'g\u00e9rant')
    .replace(/\uFFFDchanges/gi, '\u00e9changes')
    .replace(/r\uFFFDserv\uFFFDe/gi, 'r\u00e9serv\u00e9e')
    .replace(/pr\uFFFDts/gi, 'pr\u00eats')
    .replace(/pr\uFFFDsentations/gi, 'pr\u00e9sentations')
    .replace(/d\uFFFDcision/gi, 'd\u00e9cision')
    .replace(/re\uFFFDu/gi, 're\u00e7u')
    .replace(/priorit\uFFFD/gi, 'priorit\u00e9')
    .replace(/\uFFFDl\uFFFDve/gi, '\u00e9l\u00e8ve')
    .replace(/\uFFFDl\uFFFDves/gi, '\u00e9l\u00e8ves')
    .replace(/envoy\uFFFDs/gi, 'envoy\u00e9s')
    .replace(/envoy\uFFFD/gi, 'envoy\u00e9')
    .replace(/E\uFFFDcrire/gi, '\u00c9crire')
    .replace(/([A-Za-z])\uFFFD([A-Za-z])/g, "$1'$2")
    .replace(/\uFFFD/g, '')
    // Regular normalization
    .replace(/\bsecretariat\b/gi, 'secr\u00e9tariat')
    .replace(/\bSecretariat\b/g, 'Secr\u00e9tariat')
    .replace(/\beleve\b/gi, '\u00e9l\u00e8ve')
    .replace(/\beleves\b/gi, '\u00e9l\u00e8ves')
    .replace(/\benvoyes\b/gi, 'envoy\u00e9s')
    .replace(/\benvoye\b/gi, 'envoy\u00e9')
    .replace(/\brecu\b/gi, 're\u00e7u')
    .replace(/\bpriorite\b/gi, 'priorit\u00e9')
    .replace(/\bechanges\b/gi, '\u00e9changes')
    .replace(/\breservee\b/gi, 'r\u00e9serv\u00e9e')
    .replace(/\bEcrire\b/g, '\u00c9crire')
    .replace(/\bAujourd hui\b/g, "Aujourd'hui")
}

function normalizeThread(thread) {
  return {
    ...thread,
    studentName: normalizeFrenchText(thread.studentName || ''),
    secretaryName: normalizeFrenchText(thread.secretaryName || defaultStudentSecretaryThread.secretaryName),
    subject: normalizeFrenchText(thread.subject || defaultStudentSecretaryThread.subject),
    messages: (thread.messages || []).map((message) => ({
      ...message,
      from: normalizeFrenchText(message.from || ''),
      time: normalizeFrenchText(message.time || ''),
      text: normalizeFrenchText(message.text || ''),
    })),
  }
}

function loadStore() {
  if (typeof window === 'undefined') {
    return { studentSecretaryThread: normalizeThread(defaultStudentSecretaryThread) }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { studentSecretaryThread: normalizeThread(defaultStudentSecretaryThread) }
    const parsed = JSON.parse(raw)
    if (!parsed?.studentSecretaryThread) {
      return { studentSecretaryThread: normalizeThread(defaultStudentSecretaryThread) }
    }
    const normalized = {
      ...parsed,
      studentSecretaryThread: normalizeThread(parsed.studentSecretaryThread),
    }
    saveStore(normalized)
    return normalized
  } catch {
    return { studentSecretaryThread: normalizeThread(defaultStudentSecretaryThread) }
  }
}

function saveStore(store) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getStudentSecretaryThread() {
  return loadStore().studentSecretaryThread
}

export function appendStudentMessageToSecretary({ studentName = 'Thomas', text = '', documents = [] }) {
  const store = loadStore()
  const nextStore = {
    ...store,
    studentSecretaryThread: {
      ...store.studentSecretaryThread,
      studentName: normalizeFrenchText(studentName),
      messages: [
        ...store.studentSecretaryThread.messages,
        {
          from: normalizeFrenchText(studentName),
          fromRole: 'student',
          time: 'Maintenant',
          text: normalizeFrenchText(text || 'Documents envoyes au secretariat.'),
          documents,
        },
      ],
    },
  }
  saveStore(nextStore)
  return nextStore.studentSecretaryThread
}

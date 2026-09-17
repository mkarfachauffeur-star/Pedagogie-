import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'pedagogia:marketing-theme'
const THEME_CHANGED_EVENT = 'pedagogia:marketing-theme-change'
const DEFAULT_THEME = 'light'

function normalizeTheme(theme) {
  return theme === 'dark' ? 'dark' : DEFAULT_THEME
}

function readStoredTheme() {
  if (typeof window === 'undefined') return DEFAULT_THEME
  return normalizeTheme(window.localStorage.getItem(STORAGE_KEY))
}

function writeStoredTheme(theme) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, theme)
  window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT, { detail: { theme } }))
}

export function useMarketingTheme() {
  const [theme, setThemeState] = useState(readStoredTheme)

  useEffect(() => {
    document.documentElement.dataset.marketingTheme = theme
  }, [theme])

  useEffect(() => {
    const syncTheme = (event) => {
      if (event.type === 'storage' && event.key !== STORAGE_KEY) return
      setThemeState(readStoredTheme())
    }

    window.addEventListener('storage', syncTheme)
    window.addEventListener(THEME_CHANGED_EVENT, syncTheme)
    return () => {
      window.removeEventListener('storage', syncTheme)
      window.removeEventListener(THEME_CHANGED_EVENT, syncTheme)
    }
  }, [])

  const setTheme = useCallback((nextTheme) => {
    const currentTheme = readStoredTheme()
    const resolvedTheme = normalizeTheme(
      typeof nextTheme === 'function' ? nextTheme(currentTheme) : nextTheme,
    )
    setThemeState(resolvedTheme)
    writeStoredTheme(resolvedTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [setTheme])

  return { theme, isDark: theme === 'dark', toggleTheme, setTheme }
}

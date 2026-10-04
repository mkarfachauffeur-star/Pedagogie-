import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'pedagogia:marketing-theme'
const MarketingThemeContext = createContext(null)

function readStoredTheme() {
  if (typeof window === 'undefined') return 'dark'
  return window.localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
}

export function MarketingThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((next) => {
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({ theme, isDark: theme === 'dark', toggleTheme, setTheme }),
    [setTheme, theme, toggleTheme],
  )

  return createElement(MarketingThemeContext.Provider, { value }, children)
}

export function useMarketingTheme() {
  const context = useContext(MarketingThemeContext)
  if (!context) {
    throw new Error('useMarketingTheme must be used within MarketingThemeProvider')
  }
  return context
}

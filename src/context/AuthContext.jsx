import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  clearStoredRole,
  getStoredRole,
  roleDestinations,
  setStoredRole,
} from '../utils/authSession'

export const VALID_ROLES = Object.keys(roleDestinations)

const AuthContext = createContext(null)

function resolveRoleFromUser(user) {
  if (!user) return null
  const candidate = user.app_metadata?.role || user.user_metadata?.role || null
  return VALID_ROLES.includes(candidate) ? candidate : null
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [supabaseRole, setSupabaseRole] = useState(null)
  // Accès transitoire par rôle (avant l'activation des comptes Supabase).
  // Sera retiré lors de la bascule finale, une fois les comptes provisionnés.
  const [localRole, setLocalRole] = useState(() => getStoredRole())
  const [loading, setLoading] = useState(true)

  // Récupère le profil métier (role, organisation) lié à la session.
  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, organization_id, role, full_name, avatar_emoji')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      setProfile(data ?? null)
    } catch {
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return
        const nextSession = data.session ?? null
        setSession(nextSession)
        setSupabaseRole(resolveRoleFromUser(nextSession?.user))
        await loadProfile(nextSession?.user?.id)
      })
      .catch(() => {
        if (active) setSession(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession ?? null)
      setSupabaseRole(resolveRoleFromUser(nextSession?.user))
      loadProfile(nextSession?.user?.id)
    })

    return () => {
      active = false
      listener?.subscription?.unsubscribe?.()
    }
  }, [loadProfile])

  useEffect(() => {
    function handleStorage() {
      setLocalRole(getStoredRole())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Connexion réelle (email + mot de passe). Le rôle est déduit du profil.
  const signInWithPassword = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error, role: null }
    let nextRole = null
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user?.id)
        .maybeSingle()
      nextRole = prof?.role ?? null
    } catch {
      // profil non disponible : on continue avec un rôle nul
    }
    await loadProfile(data.user?.id)
    return { error: null, role: nextRole }
  }, [loadProfile])

  // Accès transitoire par rôle (à retirer après provisioning des comptes).
  const signInWithRole = useCallback((role) => {
    if (!VALID_ROLES.includes(role)) return null
    setStoredRole(role)
    setLocalRole(role)
    return roleDestinations[role]
  }, [])

  const signOut = useCallback(async () => {
    clearStoredRole()
    setLocalRole(null)
    try {
      await supabase.auth.signOut()
    } catch {
      // Pas de session Supabase active : on ignore.
    }
    setSession(null)
    setSupabaseRole(null)
    setProfile(null)
  }, [])

  const role = profile?.role || supabaseRole || localRole
  const isAuthenticated = Boolean(session) || Boolean(localRole)

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      profileId: profile?.id ?? session?.user?.id ?? null,
      organizationId: profile?.organization_id ?? null,
      role,
      isAuthenticated,
      loading,
      signInWithPassword,
      signInWithRole,
      signOut,
    }),
    [session, profile, role, isAuthenticated, loading, signInWithPassword, signInWithRole, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>.')
  }
  return context
}

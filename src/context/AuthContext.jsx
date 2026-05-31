import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  clearStoredRole,
  getStoredRole,
  roleDestinations,
  setStoredRole,
} from '../utils/authSession'
import { fetchOrganization, fetchStudentCount, fetchSubscription, logLoginAudit } from '../services/organization'
import { checkIsSuperAdmin } from '../services/platform'

export const VALID_ROLES = [...Object.keys(roleDestinations), 'super_admin']

const AuthContext = createContext(null)

function resolveRoleFromUser(user) {
  if (!user) return null
  const candidate = user.app_metadata?.role || user.user_metadata?.role || null
  return VALID_ROLES.includes(candidate) ? candidate : null
}

function computeCanWrite(organization, subscription) {
  if (!organization) return false
  if (['suspended', 'cancelled'].includes(organization.status)) return false
  if (subscription?.status && ['suspended', 'expired', 'cancelled'].includes(subscription.status)) return false
  if (organization.status === 'trial' && subscription?.trial_ends_at) {
    if (new Date(subscription.trial_ends_at) < new Date()) return false
  }
  return true
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [studentCount, setStudentCount] = useState(0)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [supabaseRole, setSupabaseRole] = useState(null)
  const [localRole, setLocalRole] = useState(() => getStoredRole())
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      setOrganization(null)
      setSubscription(null)
      setStudentCount(0)
      setIsSuperAdmin(false)
      return
    }
    try {
      const superAdmin = await checkIsSuperAdmin(userId)
      setIsSuperAdmin(superAdmin)

      const { data, error } = await supabase
        .from('profiles')
        .select('id, organization_id, role, full_name, avatar_emoji, email, is_active')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      setProfile(data ?? null)

      if (superAdmin) {
        setOrganization(null)
        setSubscription(null)
        setStudentCount(0)
        return
      }

      if (data?.organization_id) {
        const [orgRes, subRes, countRes] = await Promise.all([
          fetchOrganization(),
          fetchSubscription(),
          fetchStudentCount(),
        ])
        setOrganization(orgRes.organization)
        setSubscription(subRes.subscription)
        setStudentCount(countRes.count)
      }
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

  const signInWithPassword = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error, role: null }
    let nextRole = null
    try {
      const superAdmin = await checkIsSuperAdmin(data.user?.id)
      if (superAdmin) nextRole = 'super_admin'
      else {
        const { data: prof } = await supabase.from('profiles').select('role, is_active').eq('id', data.user?.id).maybeSingle()
        if (prof && prof.is_active === false) {
          await supabase.auth.signOut()
          return { error: new Error('Compte désactivé.'), role: null }
        }
        nextRole = prof?.role ?? null
      }
    } catch {
      // ignore
    }
    await loadProfile(data.user?.id)
    if (nextRole !== 'super_admin') await logLoginAudit()
    return { error: null, role: nextRole }
  }, [loadProfile])

  const signInWithRole = useCallback((role) => {
    if (!roleDestinations[role]) return null
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
      // ignore
    }
    setSession(null)
    setSupabaseRole(null)
    setProfile(null)
    setOrganization(null)
    setSubscription(null)
    setIsSuperAdmin(false)
  }, [])

  const role = isSuperAdmin ? 'super_admin' : (profile?.role || supabaseRole || localRole)
  const isTrial = organization?.status === 'trial'
  const canWrite = useMemo(
    () => computeCanWrite(organization, subscription),
    [organization, subscription],
  )

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      profileId: profile?.id ?? session?.user?.id ?? null,
      organizationId: profile?.organization_id ?? null,
      organization,
      subscription,
      studentCount,
      isSuperAdmin,
      canWrite,
      isTrial,
      role,
      isAuthenticated: Boolean(session) || Boolean(localRole),
      loading,
      signInWithPassword,
      signInWithRole,
      signOut,
      refreshOrg: loadProfile,
    }),
    [session, profile, organization, subscription, studentCount, isSuperAdmin, canWrite, isTrial, role, localRole, loading, signInWithPassword, signInWithRole, signOut, loadProfile],
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

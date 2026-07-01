import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchOrganization, fetchStudentCount, fetchSubscription, logLoginAudit } from '../services/organization'
import { checkIsSuperAdmin } from '../services/platform'
import { getUserFacingError } from '../lib/userFacingError'

export const VALID_ROLES = ['student', 'teacher', 'secretary', 'manager', 'super_admin']

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
    } catch (err) {
      console.error('[AuthContext] loadProfile failed', {
        userId,
        message: err?.message,
        code: err?.code,
      })
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

  const signInWithPassword = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: new Error(getUserFacingError(error, 'login')), role: null, mustChangePassword: false }
    const mustChangePassword = Boolean(data.user?.user_metadata?.must_change_password)
    let nextRole = null
    try {
      const superAdmin = await checkIsSuperAdmin(data.user?.id)
      if (superAdmin) nextRole = 'super_admin'
      else {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', data.user?.id)
          .maybeSingle()
        if (prof && prof.is_active === false) {
          await supabase.auth.signOut()
          return { error: new Error('Compte désactivé.'), role: null, mustChangePassword: false }
        }
        nextRole = prof?.role ?? resolveRoleFromUser(data.user) ?? null
      }
    } catch {
      // ignore
    }
    await loadProfile(data.user?.id)
    if (nextRole !== 'super_admin') await logLoginAudit()
    return { error: null, role: nextRole, mustChangePassword }
  }, [loadProfile])

  const completePasswordChange = useCallback(async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
      data: { must_change_password: false },
    })
    if (error) return { error: new Error(getUserFacingError(error, 'save')) }
    await loadProfile(data.user?.id)
    return { error: null }
  }, [loadProfile])

  const signOut = useCallback(async () => {
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

  const role = isSuperAdmin ? 'super_admin' : (session ? (profile?.role || supabaseRole) : null)
  const mustChangePassword = Boolean(session?.user?.user_metadata?.must_change_password)
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
      organizationId: isSuperAdmin ? null : (profile?.organization_id ?? null),
      organization,
      subscription,
      studentCount,
      isSuperAdmin,
      canWrite,
      isTrial,
      role,
      mustChangePassword,
      isAuthenticated: Boolean(session),
      loading,
      signInWithPassword,
      completePasswordChange,
      signOut,
      refreshOrg: loadProfile,
    }),
    [session, profile, organization, subscription, studentCount, isSuperAdmin, canWrite, isTrial, role, mustChangePassword, loading, signInWithPassword, completePasswordChange, signOut, loadProfile],
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

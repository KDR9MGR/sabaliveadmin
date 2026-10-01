import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase.js'
import { can as canCap } from './capabilities.js'
import { ROLE_LABEL } from './admin.js'

/* Which panel a staff_roles.role lands in. super_admin/admin get their own
   panel; global_admin, country_admin, sub_admin and agency_manager are scoped
   (see the manages_agency() RLS helper) and land in the per-role panels of the
   Global > Country > Sub > Agency ladder. The old Agency / Manager panel is
   'agency-manager' — no role routes there any more. */
export const PANEL_FOR_ROLE = {
  super_admin: 'super',
  admin: 'master',
  global_admin: 'global-admin',
  country_admin: 'country-admin',
  sub_admin: 'sub-admin',
  agency_manager: 'panel-agency',
}

export { ROLE_LABEL }

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = not resolved yet
  const [profile, setProfile] = useState(null)
  const [staffRole, setStaffRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadForUser = useCallback(async (user) => {
    if (!user) { setProfile(null); setStaffRole(null); return }
    const [{ data: prof }, { data: role }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('staff_roles').select('*').eq('user_id', user.id).maybeSingle(),
    ])
    setProfile(prof ?? null)
    setStaffRole(role ?? null)
  }, [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      await loadForUser(data.session?.user)
      if (mounted) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess)
      await loadForUser(sess?.user)
      setLoading(false)
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [loadForUser])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error }
    await loadForUser(data.user)
    return { error: null }
  }, [loadForUser])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setStaffRole(null)
  }, [])

  const updateProfile = useCallback(async (updates) => {
    const user = session?.user
    if (!user) return { error: new Error('Not signed in') }
    const payload = {}
    if ('name' in updates) payload.name = updates.name
    if ('phone' in updates) payload.phone = updates.phone
    if ('bio' in updates) payload.bio = updates.bio
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select()
      .maybeSingle()
    if (error) return { error }
    if (data) setProfile(data)
    return { data: data ?? null, error: null }
  }, [session])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const user = session?.user
    if (!user) return { error: new Error('Not signed in') }
    const email = user.email
    if (!email) return { error: new Error('No email on account') }
    const { error: verifyErr } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
    if (verifyErr) return { error: verifyErr }
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
    if (updateErr) return { error: updateErr }
    return { error: null }
  }, [session])

  const panel = staffRole ? PANEL_FOR_ROLE[staffRole.role] : null
  const can = useCallback((key) => canCap(staffRole, key), [staffRole])

  return (
    <Ctx.Provider value={{
      session, user: session?.user ?? null, profile, staffRole, panel, can,
      isStaff: !!staffRole, loading, signIn, signOut, updateProfile, changePassword,
    }}>
      {children}
    </Ctx.Provider>
  )
}

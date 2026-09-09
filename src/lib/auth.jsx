import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase.js'
import { can as canCap } from './capabilities.js'

/* Which panel a staff_roles.role lands in. super_admin/admin get their own
   panel; agency_manager and sub_admin are both agency-scoped (see the
   manages_agency() RLS helper) and share the Agency panel. */
export const PANEL_FOR_ROLE = {
  super_admin: 'super',
  admin: 'master',
  sub_admin: 'agency',
  agency_manager: 'agency',
}

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

  const panel = staffRole ? PANEL_FOR_ROLE[staffRole.role] : null
  const can = useCallback((key) => canCap(staffRole, key), [staffRole])

  return (
    <Ctx.Provider value={{
      session, user: session?.user ?? null, profile, staffRole, panel, can,
      isStaff: !!staffRole, loading, signIn, signOut,
    }}>
      {children}
    </Ctx.Provider>
  )
}

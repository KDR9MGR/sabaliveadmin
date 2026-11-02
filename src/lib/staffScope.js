/* "Limit each admin to their own chain" (sabalive migration 20261102100000). A Global, Country, Sub Admin or Agency account sees only the people assigned under it
   (and the staff above it, and people its chain has sent coins to); Master and Super Admin still see everyone. The database does the limiting, through row
   policies, and it is switched on and off in Release Settings (app_config.feature_flags.limit_staff_to_own_chain, default OFF). This file only decides what the
   panel SAYS about it, so a short Users list is not mistaken for a fault. */
export const SCOPE_FLAG = 'limit_staff_to_own_chain'
export const SCOPED_ROLES = ['global_admin', 'country_admin', 'sub_admin', 'agency_manager']

export const isScopedRole = (role) => SCOPED_ROLES.includes(role)

/* flags is app_config.feature_flags (may be missing or not an object) */
export const scopeIsOn = (flags) => !!flags && typeof flags === 'object' && flags[SCOPE_FLAG] === true

const UNDER = {
  global_admin: 'your Country Admins, and the Sub Admins, agencies and hosts under them',
  country_admin: 'your Sub Admins, and the agencies and hosts under them',
  sub_admin: 'your agencies and their hosts',
  agency_manager: 'your agency\'s hosts',
}

/* The line above a people list; '' when it does not apply (not a scoped role, or the switch is off). */
export function scopeNote(role, flags) {
  if (!isScopedRole(role) || !scopeIsOn(flags)) return ''
  return `You see ${UNDER[role]}, plus people your chain has sent coins to. Everyone else is hidden by design.`
}

/* A number typed into a coin picker that could be an app User ID (digits only, up to 15). null otherwise. */
export function exactUserIdFrom(text) {
  const q = String(text || '').trim()
  return /^\d{1,15}$/.test(q) ? Number(q) : null
}

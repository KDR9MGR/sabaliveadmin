import { NAV } from '../config/nav.js'
import { hasGrant, grantedPathAllowed } from './capabilities.js'

/* The part of the Master / Super menu a lower-role account (Global / Country / Sub Admin, Agency) may use, from the
   switches it was given: only items whose switch is granted AND that are a page the grant opens, with only the
   children that belong to that switch. `panelKey` is 'master' or 'super'. */
export function grantedNavFor(panelKey, staffRole) {
  return (NAV[panelKey] || [])
    .map((g) => ({
      section: g.section,
      items: g.items
        .filter((it) => it.cap && hasGrant(staffRole, it.cap))
        // a plain item must itself be a page this grant opens (Withdrawals / Salary are served from the account's own panel)
        .filter((it) => it.children || grantedPathAllowed(staffRole, it.to))
        .map((it) => (it.children ? { ...it, children: it.children.filter((c) => grantedPathAllowed(staffRole, c.to)) } : it))
        .filter((it) => !it.children || it.children.length),
    }))
    .filter((g) => g.items.length)
}

export const grantedMasterNav = (staffRole) => grantedNavFor('master', staffRole)

/* One link per granted feature, for the "Granted access" section of the account's own menu. */
export function grantedLinks(staffRole) {
  const seen = new Set()
  return ['master', 'super']
    .flatMap((k) => grantedNavFor(k, staffRole))
    .flatMap((g) => g.items.map((it) => ({ label: it.label, icon: it.icon, to: it.to || it.children[0].to })))
    .filter((l) => (seen.has(l.to) ? false : (seen.add(l.to), true)))
}

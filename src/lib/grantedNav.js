import { NAV } from '../config/nav.js'
import { hasGrant, grantedPathAllowed } from './capabilities.js'

/* The part of the Master menu a lower-role account (Global / Country / Sub Admin, Agency) may use, from the
   switches a Super Admin or Master gave it: only items whose switch is granted, and only the children that
   belong to that switch. */
export function grantedMasterNav(staffRole) {
  return NAV.master
    .map((g) => ({
      section: g.section,
      items: g.items
        .filter((it) => it.cap && hasGrant(staffRole, it.cap))
        .map((it) => (it.children ? { ...it, children: it.children.filter((c) => grantedPathAllowed(staffRole, c.to)) } : it))
        .filter((it) => !it.children || it.children.length),
    }))
    .filter((g) => g.items.length)
}

/* One link per granted feature, for the "Granted access" section of the account's own menu. */
export function grantedLinks(staffRole) {
  return grantedMasterNav(staffRole).flatMap((g) => g.items.map((it) => ({
    label: it.label, icon: it.icon, to: it.to || it.children[0].to,
  })))
}

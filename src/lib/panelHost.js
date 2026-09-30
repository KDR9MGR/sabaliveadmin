/* Maps the current hostname's leading label to a panel key, so each panel
   can be served from its own Vercel subdomain (super.…, master.…/admin.…,
   global.…, country.…, sub.…, agency.…) while the SPA still resolves the right
   base route. Returns null for the bare domain / localhost / preview URLs.
   `agency.` used to point at the old Agency / Manager panel (filed as
   'global-admin'); it now serves the real Agency panel. */
const PREFIX_TO_PANEL = {
  super: 'super',
  master: 'master',
  admin: 'master',
  global: 'global-admin',
  country: 'country-admin',
  sub: 'sub-admin',
  agency: 'panel-agency',
}

export function panelFromHostname(hostname = typeof window !== 'undefined' ? window.location.hostname : '') {
  const label = String(hostname).split('.')[0].toLowerCase()
  return PREFIX_TO_PANEL[label] ?? null
}

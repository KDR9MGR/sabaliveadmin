/* Maps the current hostname's leading label to a panel key, so each panel
   can be served from its own Vercel subdomain (super.…, master.…/admin.…,
   agency.…) while the SPA still resolves the right base route. Returns null
   for the bare domain / localhost / preview URLs. */
const PREFIX_TO_PANEL = {
  super: 'super',
  master: 'master',
  admin: 'master',
  agency: 'agency',
}

export function panelFromHostname(hostname = typeof window !== 'undefined' ? window.location.hostname : '') {
  const label = String(hostname).split('.')[0].toLowerCase()
  return PREFIX_TO_PANEL[label] ?? null
}

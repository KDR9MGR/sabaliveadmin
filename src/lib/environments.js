/* Which Supabase project this panel talks to, and whether a Master / Super Admin may switch it.

   The panel is built for ONE "home" project (production in a normal build; staging in `--mode staging`). A normal
   build can also be given the staging project's address (VITE_STAGING_SUPABASE_URL / _ANON_KEY, both public
   values), and then a Master or Super Admin gets a switch in the top bar. A staging-mode build can never reach
   production (the guard in supabase.js stays), so it has no switch.

   Each project keeps its own sign-in (supabase-js stores a session per project address), so switching signs
   nobody out: you sign in to the other project once with that project's account, and the switch is instant after. */

export const PRODUCTION_REF = 'sfehzhtqtpuobnrvzvzp'
export const STORAGE_KEY = 'sabalive.panel.env'

export const ENV_LABEL = { production: 'Production', staging: 'Staging' }

/* Pure: decides the environments from the build's settings and what the browser remembered.
   `env` is import.meta.env, `stored` is the remembered choice ('staging' or nothing). */
export function resolveEnvironments({ mode, env, stored }) {
  const home = {
    key: mode === 'staging' ? 'staging' : 'production',
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_ANON_KEY,
  }
  const sUrl = (env.VITE_STAGING_SUPABASE_URL || '').trim()
  const sKey = (env.VITE_STAGING_SUPABASE_ANON_KEY || '').trim()
  // never offer "staging" if the address is really production, and never from a staging-mode build
  const staging = mode !== 'staging' && sUrl && sKey && !sUrl.includes(PRODUCTION_REF)
    ? { key: 'staging', url: sUrl, anonKey: sKey }
    : null
  const active = staging && stored === 'staging' ? staging : home
  return { home, staging, active, canSwitch: !!staging }
}

function readStored() {
  try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
}

// `import.meta.env` is Vite's; under plain Node (the tests) it is missing, which just means "no settings"
const meta = import.meta.env ?? {}
const resolved = resolveEnvironments({ mode: meta.MODE, env: meta, stored: readStored() })

export const activeEnvironment = resolved.active
export const canSwitchEnvironment = resolved.canSwitch
export const isStagingEnvironment = resolved.active.key === 'staging'

/* Remember the choice and reload into the other project. The page restarts from the panel's start, because the
   account you are signed in as there (if any) may belong to a different panel. */
export function switchEnvironment(key) {
  try {
    if (key === 'staging') localStorage.setItem(STORAGE_KEY, 'staging')
    else localStorage.removeItem(STORAGE_KEY)
  } catch { /* private mode: the switch just won't stick */ }
  window.location.assign(meta.BASE_URL || '/')
}

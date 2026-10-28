/* The game page /sud/play: what the app puts in the address, and the small pure rules around it (tested in sudParams.test.js, run by the panel's `npm test`).
   The address comes from our own Edge Function (`sud` -> launch); nothing in it is a secret: the app KEY is the SDK's public client key, the app SECRET never leaves
   the server. A bad address shows a plain message instead of starting anything. */

/* What the page tells the app, through a link the app's WebView already understands. */
export const EXIT_URL = 'tulasigame://exit'

const DIGITS = /^[0-9]{6,25}$/
const SAFE = /^[A-Za-z0-9_-]{1,64}$/

/* Where the page asks for a fresh login code: only our own Supabase functions, never an address a link could invent. */
export function trustedApi(value) {
  try {
    const u = new URL(String(value))
    if (u.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(u.hostname)) return null
    if (u.pathname.replace(/\/+$/, '') !== '/functions/v1/sud') return null
    return `${u.origin}${u.pathname.replace(/\/+$/, '')}`
  } catch {
    return null
  }
}

/* search: window.location.search. Returns { ok: true, ...params } or { ok: false, error }. */
export function readLaunchParams(search) {
  const q = new URLSearchParams(search || '')
  const get = (k) => (q.get(k) || '').trim()
  const p = {
    appId: get('appId'), appKey: get('appKey'), gameId: get('gameId'), roomId: get('roomId'), userId: get('userId'),
    code: get('code'), t: get('t'), lang: get('lang') || 'en-US', api: trustedApi(get('api')), test: get('test') !== '0',
  }
  if (!DIGITS.test(p.appId) || !p.appKey || p.appKey.length > 200) return { ok: false, error: 'This game link is not complete.' }
  if (!DIGITS.test(p.gameId)) return { ok: false, error: 'This game link is not complete.' }
  if (!SAFE.test(p.roomId) || !p.userId || p.userId.length > 200 || !p.code || p.code.length > 4000) return { ok: false, error: 'This game link is not complete.' }
  if (!/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(p.lang)) p.lang = 'en-US'
  return { ok: true, ...p }
}

/* What the SDK is told this page's "bundle id" is: the site's host name WITHOUT a leading www. The page really runs on www.sabalive.in (the apex redirects there), but the id SUD
   has on record for the web is `sabalive.in` (SUD console > Web bundle_id; SUD's own test environment was set up from it), and a different host name is refused with error 10005
   ("Invalid app platform information"). */
export function bundleIdFor(hostname) {
  const h = String(hostname || '').trim().toLowerCase()
  return h.replace(/^www\./, '') || h
}

/* The answer to the SDK's "how big is the game view": its size in device pixels, with no margin taken from the game. */
export function viewInfo(width, height, ratio) {
  const dpr = Number(ratio) > 0 ? Number(ratio) : 1
  const w = Math.max(1, Math.round(width * dpr))
  const h = Math.max(1, Math.round(height * dpr))
  return { ret_code: 0, ret_msg: 'success', view_size: { width: w, height: h }, view_game_rect: { left: 0, top: 0, right: 0, bottom: 0 } }
}

/* The page's request for a new code. */
export const refreshRequest = (api, t) => ({
  url: `${api}/refresh`,
  init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t }) },
})

/* What a person reads when the SDK cannot start. Only the code is shown, never a message of the SDK's own. */
export const startFailure = (code) => `The game could not start${code ? ` (${String(code).replace(/[^0-9A-Za-z_-]/g, '').slice(0, 12)})` : ''}. Please close it and try again.`

/* How long the game may take to start before the page gives up and says so (a slow line can need about a minute). */
export const LOAD_TIMEOUT_MS = 90000
export const LOAD_TIMEOUT_MESSAGE = 'The game is taking too long to load. Check your connection, then close it and try again.'

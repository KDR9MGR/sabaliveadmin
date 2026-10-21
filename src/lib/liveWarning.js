/* The welcome warnings every new arrival sees in their own chat (Application Configuration -> Live welcome): one for VIDEO lives and video PK, one for
   AUDIO lives and audio PK, each with its own switch and text. Stored in app_config.video_warning_* / audio_warning_* (sabalive migration 20261020110000).
   Pure functions only (the page and the tests use them); the built-in texts are the SAME as the app's (sabalive/lib/state/live_warning_store.dart), which
   translates them into the app's languages. */

export const DEFAULT_WARNINGS = Object.freeze({
  video: 'Welcome to SABALIVE Live! Warning: no nudity, vulgarity, violence or children on camera or mic during a live. Lives are monitored and violations are punished!',
  audio: 'Welcome to the SABALIVE audio room! Please be respectful: no abuse, vulgarity, hate speech or harassment, and no children on the mic. Rooms are monitored and violations are punished!',
})
export const KINDS = ['video', 'audio']
export const LIVE_WARNING_MAX = 600

/* One kind of a saved row: on with the built-in text unless the row says otherwise (the same leniency as the app). */
function readOne(row, kind) {
  const raw = row?.[`${kind}_warning_text`]
  const text = typeof raw === 'string' ? raw.trim() : ''
  const enabled = row?.[`${kind}_warning_enabled`]
  return { enabled: typeof enabled === 'boolean' ? enabled : true, text: text && text.length <= LIVE_WARNING_MAX ? text : '' }
}

/* What the form shows for a saved row: { video: { enabled, text }, audio: { enabled, text } }; an empty text means the built-in one. */
export const readLiveWarnings = (row) => ({ video: readOne(row, 'video'), audio: readOne(row, 'audio') })

/* The form -> the columns to save, or { error }. A blank text saves as null = the built-in, translated text. */
export function checkLiveWarnings(v) {
  const patch = {}
  for (const kind of KINDS) {
    const one = v?.[kind]
    const text = (typeof one?.text === 'string' ? one.text : '').trim()
    if (text.length > LIVE_WARNING_MAX) return { error: `The ${kind} warning can be at most ${LIVE_WARNING_MAX} characters (it is ${text.length}).` }
    patch[`${kind}_warning_enabled`] = !!one?.enabled
    patch[`${kind}_warning_text`] = text || null
  }
  return { patch }
}

/* What a phone shows for one kind: the custom text, or the built-in one. */
export const shownText = (one, kind) => ((one?.text || '').trim() || DEFAULT_WARNINGS[kind])

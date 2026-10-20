/* The welcome warning every new arrival sees in their own chat in a video live and in video PK (Application Configuration -> Live welcome):
   whether it is shown and its text. Stored in app_config.video_warning_enabled / video_warning_text (sabalive migration 20261020110000). Pure
   functions only (the page and the tests use them); the built-in text is the SAME as the app's (sabalive/lib/state/live_warning_store.dart),
   which translates it into the app's languages. */

export const DEFAULT_LIVE_WARNING = 'Welcome to SABALIVE Live! Warning: no nudity, vulgarity, violence or children on camera or mic during a live. Lives are monitored and violations are punished!'
export const LIVE_WARNING_MAX = 600

/* What the form shows for a saved row: on with the built-in text unless the row says otherwise (the same leniency as the app). */
export function readLiveWarning(row) {
  const text = typeof row?.video_warning_text === 'string' ? row.video_warning_text.trim() : ''
  return {
    enabled: typeof row?.video_warning_enabled === 'boolean' ? row.video_warning_enabled : true,
    text: text && text.length <= LIVE_WARNING_MAX ? text : '',
  }
}

/* The form -> the columns to save, or { error }. A blank text saves as null = the built-in, translated text. */
export function checkLiveWarning(v) {
  const text = (typeof v?.text === 'string' ? v.text : '').trim()
  if (text.length > LIVE_WARNING_MAX) return { error: `The warning can be at most ${LIVE_WARNING_MAX} characters (it is ${text.length}).` }
  return { patch: { video_warning_enabled: !!v?.enabled, video_warning_text: text || null } }
}

/* What a phone shows: the custom text, or the built-in one. */
export const shownText = (v) => ((v?.text || '').trim() || DEFAULT_LIVE_WARNING)

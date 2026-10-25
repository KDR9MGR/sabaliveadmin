/* Pure rules of the ban dialog (no database here, so they are unit-tested). The database side is ban_user_v2 (sabalive migration 20261025120000):
   it works the preset lengths out on the SERVER clock and takes a custom end date as a timestamp. */

export const BAN_DURATIONS = [
  { value: '24h', label: '24 hours', hours: 24 },
  { value: '7d', label: '7 days', hours: 24 * 7 },
  { value: '30d', label: '30 days', hours: 24 * 30 },
  { value: 'custom', label: 'Custom date' },
  { value: 'permanent', label: 'Permanent' },
]

/* The server refuses an end date closer than this, or further than MAX_YEARS (use Permanent for longer). */
export const MIN_CUSTOM_MINUTES = 5
export const MAX_YEARS = 10

const pad = (n) => String(n).padStart(2, '0')

/* A Date as the value a <input type="datetime-local"> wants, in the browser's own time zone: 2026-10-27T14:30 */
export const toLocalInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

/* The datetime-local value as an ISO (UTC) timestamp for the database, or null if it is empty or not a date. */
export function customEndIso(local) {
  if (!local) return null
  const d = new Date(local)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/* Why a custom end date can't be used, or '' when it can. */
export function customEndError(local, now = new Date()) {
  if (!local) return 'Pick the date and time the ban ends'
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) return 'That is not a valid date'
  if (d.getTime() <= now.getTime() + MIN_CUSTOM_MINUTES * 60000) return 'The end must be at least 5 minutes from now'
  const max = new Date(now.getTime())
  max.setFullYear(max.getFullYear() + MAX_YEARS)
  if (d.getTime() > max.getTime()) return `The end can be at most ${MAX_YEARS} years away: choose Permanent for longer`
  return ''
}

const fmt = (d) => d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })

/* A ban's end for display: date and time, because a 24 hour ban ends at a time of day. '' for none. */
export const fmtEnd = (iso) => (iso ? fmt(new Date(iso)) : '')

/* The end a duration would give, for the dialog's preview. */
export function endsOn(duration, now = new Date(), customLocal = '') {
  if (duration === 'permanent') return 'Never — until you lift it'
  if (duration === 'custom') {
    const iso = customEndIso(customLocal)
    return iso ? fmtEnd(iso) : 'Pick a date and time'
  }
  const d = BAN_DURATIONS.find((x) => x.value === duration)
  if (!d?.hours) return '—'
  return fmtEnd(new Date(now.getTime() + d.hours * 3600000).toISOString())
}

/* What the dialog sends: { duration, endsAt } (endsAt only for 'custom'), or { error }. */
export function banTerms(duration, customLocal, now = new Date()) {
  if (!BAN_DURATIONS.some((d) => d.value === duration)) return { error: 'Choose how long' }
  if (duration !== 'custom') return { duration, endsAt: null }
  const error = customEndError(customLocal, now)
  return error ? { error } : { duration, endsAt: customEndIso(customLocal) }
}

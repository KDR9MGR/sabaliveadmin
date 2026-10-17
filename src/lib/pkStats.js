/* Pure helpers for the PK Battles page (no network): turning battle rows into the numbers and labels the page shows. */

export const minutesLabel = (seconds) => {
  const s = Number(seconds)
  if (!Number.isFinite(s) || s <= 0) return '—'
  return s % 60 === 0 ? `${s / 60} min` : `${Math.round(s / 6) / 10} min`
}

/* "5, 10, 30, 40" (minutes) -> { seconds: [300, 600, 1800, 2400] } or { error } */
export function parseMinutesList(text) {
  const parts = String(text ?? '').split(/[,\s]+/).filter(Boolean)
  if (parts.length < 1 || parts.length > 8) return { error: 'Give between 1 and 8 lengths, in minutes, separated by commas' }
  const seconds = []
  for (const p of parts) {
    const m = Number(p)
    if (!Number.isInteger(m) || m < 1 || m > 60) return { error: 'Each length is a whole number of minutes from 1 to 60' }
    if (seconds.includes(m * 60)) return { error: 'The same length is listed twice' }
    seconds.push(m * 60)
  }
  return { seconds: seconds.sort((a, b) => a - b) }
}

/* the rules fields, as whole numbers in the units the server stores (seconds), or { error } */
export function checkPkRules(v) {
  const lengths = parseMinutesList(v.invite_minutes)
  if (lengths.error) return lengths
  const whole = (x, label, min, max) => {
    const n = Number(x)
    return Number.isInteger(n) && n >= min && n <= max ? null : `${label} must be a whole number from ${min} to ${max}`
  }
  const random = whole(v.random_minutes, 'The random PK length (minutes)', 1, 60)
  const grace = whole(v.forfeit_grace_seconds, 'The forfeit grace (seconds)', 45, 85)
  const rate = whole(v.invites_per_minute, 'Invites per minute', 1, 60)
  const queue = whole(v.random_queue_seconds, 'The random search expiry (seconds)', 10, 120)
  const error = random || grace || rate || queue
  if (error) return { error }
  return {
    rules: {
      invite_durations: lengths.seconds,
      random_duration: Number(v.random_minutes) * 60,
      forfeit_grace_seconds: Number(v.forfeit_grace_seconds),
      invites_per_minute: Number(v.invites_per_minute),
      random_queue_seconds: Number(v.random_queue_seconds),
    },
  }
}

/* who won, in words: rows have winner 'a' | 'b' | 'draw' | null and the two host names */
export function battleResult(r) {
  if (r.status !== 'finished') return r.status === 'live' ? 'Running' : r.status === 'cancelled' ? 'Cancelled' : r.status === 'invited' ? 'Invited' : r.status === 'accepted' ? 'Starting' : '—'
  if (r.winner === 'draw') return 'Draw'
  if (r.winner === 'a') return `${r.hostA || 'A'} won`
  if (r.winner === 'b') return `${r.hostB || 'B'} won`
  return 'Finished'
}

/* one row per UTC day, newest first: invites, battles that ran, finished, forfeits, cancelled, and the coins gifted in finished ones */
export function daySummary(rows) {
  const byDay = new Map()
  for (const r of rows) {
    const day = String(r.invitedAt || '').slice(0, 10)
    if (!day) continue
    const d = byDay.get(day) || { id: day, day, invited: 0, ran: 0, finished: 0, forfeits: 0, cancelled: 0, coins: 0 }
    d.invited += 1
    if (r.startedAt) d.ran += 1
    if (r.status === 'finished') { d.finished += 1; d.coins += Number(r.scoreA || 0) + Number(r.scoreB || 0) }
    if (r.endReason === 'forfeit') d.forfeits += 1
    if (r.status === 'cancelled') d.cancelled += 1
    byDay.set(day, d)
  }
  return [...byDay.values()].sort((a, b) => (a.day < b.day ? 1 : -1))
}

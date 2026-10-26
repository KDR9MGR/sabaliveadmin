/* Diamond reset, the pure rules (tested in diamondReset.test.js; the database calls are in diamondReset.js). Master / Super Admin -> Economy -> Diamond reset
   (sabalive migration 20261026120000) clears a FINISHED month's gift diamonds, reward (Lucky Box) diamonds, or both from the wallets that still hold them.
   The database decides every amount and refuses everything unsafe; these functions only describe its answer. */
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/* "2026-09" -> "September 2026" */
export function monthLabel(period) {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(period || ''))
  return m ? `${MONTH_NAMES[Number(m[2]) - 1]} ${m[1]}` : String(period || '')
}

/* The finished months, newest first (India time, like the Salary reports and the database). The month in progress is not offered: it cannot be reset yet. */
export function finishedMonths(now = new Date(), count = 12) {
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000) // a UTC date whose fields read as India time
  let y = ist.getUTCFullYear()
  let m = ist.getUTCMonth() // 0-based; this month is not finished
  const out = []
  for (let i = 0; i < count; i += 1) {
    m -= 1
    if (m < 0) { m = 11; y -= 1 }
    const period = `${y}-${String(m + 1).padStart(2, '0')}`
    out.push({ value: period, label: monthLabel(period) })
  }
  return out
}

/* The database answer for one month -> plain numbers. Missing parts are zero / not done, so a half answer can never enable a button by accident. */
export function normalizePreview(raw) {
  const part = (p) => ({
    wallets: Number(p?.wallets || 0),
    diamonds: Number(p?.diamonds || 0),
    done: p?.done === true,
    runId: p?.run_id || null,
    runAt: p?.run_at || null,
    removed: Number(p?.removed || 0),
    removedWallets: Number(p?.removed_wallets || 0),
  })
  return { period: raw?.period || '', ended: raw?.ended === true, gift: part(raw?.gift), reward: part(raw?.reward) }
}

export const BUTTONS = [
  { key: 'gift', label: 'Reset gifting diamonds', short: 'gifting diamonds' },
  { key: 'reward', label: 'Reset reward diamonds', short: 'reward diamonds' },
  { key: 'both', label: 'Reset both', short: 'gifting and reward diamonds' },
]

/* What a button would do and whether it may be pressed: { enabled, reason, wallets, diamonds }. `both` takes the two together and is refused if either was done already
   (the other button is the way to finish a half-done month). */
export function buttonState(preview, key) {
  const p = preview
  if (!p) return { enabled: false, reason: 'Loading…', wallets: 0, diamonds: 0 }
  const parts = key === 'both' ? [p.gift, p.reward] : [p[key]]
  const wallets = key === 'both' ? Math.max(p.gift.wallets, p.reward.wallets) : p[key].wallets
  const diamonds = parts.reduce((n, x) => n + x.diamonds, 0)
  if (!p.ended) return { enabled: false, reason: 'This month has not ended yet (India time)', wallets, diamonds }
  if (key === 'both' && parts.some((x) => x.done)) return { enabled: false, reason: 'One of them is already reset: use its own button', wallets, diamonds }
  if (key !== 'both' && parts[0].done) return { enabled: false, reason: 'Already reset (undo it below to redo it)', wallets, diamonds }
  if (diamonds <= 0) return { enabled: false, reason: 'Nothing to reset', wallets, diamonds }
  return { enabled: true, reason: '', wallets, diamonds }
}

/* The confirmation is the month typed exactly; the database checks it again. */
export const confirmMatches = (typed, period) => !!period && String(typed || '').trim() === period

/* The text when the database does not have the functions yet. */
export const DIAMOND_RESET_NOT_INSTALLED = /diamond reset needs the database update/i
export const NOT_INSTALLED_MESSAGE = 'Diamond reset needs the database update 20261026120000, which has not been applied yet.'

/* ---------------------------------------------------------------- the automatic monthly reset (sabalive migration 20261026130000)
   A switch (off by default), two boxes (gifting / reward) and the day of the month. A daily job at 00:05 India time acts only on that day, and resets the month BEFORE. */
export const AUTO_DEFAULTS = { enabled: false, gift: true, reward: true, day: 1 }
export const AUTO_NOT_INSTALLED = /automatic reset needs the database update/i
export const AUTO_NOT_INSTALLED_MESSAGE = 'Automatic reset needs the database update 20261026130000, which has not been applied yet.'

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function normalizeAutoSettings(row) {
  const day = Number(row?.run_day)
  return {
    enabled: row?.enabled === true,
    gift: row ? row.reset_gift !== false : AUTO_DEFAULTS.gift,
    reward: row ? row.reset_reward !== false : AUTO_DEFAULTS.reward,
    day: Number.isInteger(day) && day >= 1 && day <= 28 ? day : AUTO_DEFAULTS.day,
    lastAt: row?.last_auto_at || null,
    lastNote: row?.last_auto_note || '',
  }
}

/* The form -> { error } or { value } for the database. The database checks the same. */
export function checkAutoSettings(s) {
  const day = Number(s?.day)
  if (!Number.isInteger(day) || day < 1 || day > 28) return { error: 'Pick a day of the month from 1 to 28' }
  if (s?.enabled && !s?.gift && !s?.reward) return { error: 'Tick at least one: gifting diamonds or reward diamonds' }
  return { value: { enabled: !!s?.enabled, gift: !!s?.gift, reward: !!s?.reward, day } }
}

export const sameAutoSettings = (a, b) => !!a && !!b && a.enabled === b.enabled && a.gift === b.gift && a.reward === b.reward && Number(a.day) === Number(b.day)

/* When the job will next act and what it will reset, or null while the switch is off. India time is UTC+5:30; the job runs at 00:05 on the chosen day. */
export function nextAutoRun(s, now = new Date()) {
  if (!s?.enabled) return null
  const day = Number(s.day)
  if (!Number.isInteger(day) || day < 1 || day > 28) return null
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000)
  let y = ist.getUTCFullYear()
  let m = ist.getUTCMonth()
  let runAt = new Date(Date.UTC(y, m, day, 0, 5) - 5.5 * 3600 * 1000)
  if (runAt.getTime() <= now.getTime()) {
    m += 1
    if (m > 11) { m = 0; y += 1 }
    runAt = new Date(Date.UTC(y, m, day, 0, 5) - 5.5 * 3600 * 1000)
  }
  let py = y
  let pm = m - 1
  if (pm < 0) { pm = 11; py -= 1 }
  const period = `${py}-${String(pm + 1).padStart(2, '0')}`
  const kinds = [s.gift ? 'gifting diamonds' : null, s.reward ? 'reward diamonds' : null].filter(Boolean)
  return {
    runAt,
    runAtLabel: `${day} ${MONTH_SHORT[m]} ${y}, 00:05 India time`,
    period,
    periodLabel: monthLabel(period),
    kinds,
  }
}

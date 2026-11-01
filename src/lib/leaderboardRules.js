/* Leaderboards (Master / Super Admin -> Leaderboards). The database does the sums (sabalive migration 20261101120000, admin_leaderboard: the same figures and windows as the
   app's Rankings); this file holds the words and the clock reading, so they are tested without a browser.

   Everything is INDIA time (IST, UTC+5:30, no daylight saving): the boards reset at 00:10 there, whatever time zone the computer in front of the page is set to. */

export const RESET_TIME = '00:10'

/* What each board counts. A host is credited 1 diamond for every coin a gifter spends, so the Hosts and Agencies boards count diamonds and the Gifters board counts coins. */
export const BOARDS = [
  { value: 'hosts', label: 'Hosts', unit: 'Diamonds', counts: 'Diamonds each host received through gifts', who: 'Host', entries: 'Hosts on the board' },
  { value: 'gifters', label: 'Gifters', unit: 'Coins', counts: 'Coins each person spent on gifts', who: 'Gifter', entries: 'Gifters on the board' },
  { value: 'agencies', label: 'Agencies', unit: 'Diamonds', counts: 'Diamonds received by all of an agency’s hosts, added together', who: 'Agency', entries: 'Agencies on the board' },
]

export const PERIODS = [
  { value: 'day', label: 'Daily', resets: `Resets every day at ${RESET_TIME} India time`, previous: 'Yesterday' },
  { value: 'week', label: 'Weekly', resets: `Resets every Monday at ${RESET_TIME} India time`, previous: 'Last week' },
  { value: 'month', label: 'Monthly', resets: `Resets on the 1st of every month at ${RESET_TIME} India time`, previous: 'Last month' },
]

export const boardOf = (value) => BOARDS.find((b) => b.value === value) || BOARDS[0]
export const periodOf = (value) => PERIODS.find((p) => p.value === value) || PERIODS[0]

/* The two choices under the period: the board that is running now, and the one that just ended ("Yesterday", "Last week", "Last month"). */
export const whichChoices = (period) => [
  { value: 'current', label: 'Now' },
  { value: 'previous', label: periodOf(period).previous },
]

const IST = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

/* "1 Nov 2026, 00:10 IST" for an instant, always in India time. */
export function istStamp(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(+d)) return '—'
  const p = Object.fromEntries(IST.formatToParts(d).map((x) => [x.type, x.value]))
  return `${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute} IST`
}

/* The date part only, for file names: 2026-11-01 (the India date of the instant). */
export function istDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(+d)) return ''
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}`
}

/* What a board covers, as a sentence: the running one says since when, a finished one says from when to when. */
export function windowText(startsAt, endsAt, which) {
  return which === 'previous'
    ? `${istStamp(startsAt)} to ${istStamp(endsAt)}`
    : `Since ${istStamp(startsAt)}`
}

/* "in 5 h 12 min" until the board resets; the minute is rounded up so it never says 0 while it is still running. */
export function resetsIn(endsAt, now = Date.now()) {
  const ms = +new Date(endsAt) - now
  if (!Number.isFinite(ms)) return ''
  if (ms <= 0) return 'now'
  const mins = Math.ceil(ms / 60000)
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d > 0) return `in ${d} day${d === 1 ? '' : 's'} ${h} h`
  if (h > 0) return `in ${h} h ${m} min`
  return `in ${m} min`
}

const n = (v) => Number(v) || 0

/* The database's answer, shaped for the page. A person with no name shows their @username, then "Unnamed". */
export function shapeBoard(raw, board) {
  const data = raw || {}
  const rows = (data.rows || []).map((r) => ({
    rank: n(r.rank),
    id: r.id,
    userId: r.user_id == null ? '' : String(r.user_id),
    name: r.name || (r.username ? `@${r.username}` : 'Unnamed'),
    username: r.username ? `@${r.username}` : '',
    avatarUrl: r.avatar_url || '',
    agency: r.agency || '',
    country: r.country || '',
    score: n(r.score),
    gifts: n(r.gifts),
    hosts: n(r.hosts),
  }))
  return {
    board: data.board || board,
    period: data.period,
    which: data.which,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    entries: n(data.entries),
    total: n(data.total),
    rows,
  }
}

/* The columns of a download. Hosts and gifters carry the app User ID (never the database id), agencies their number and country. */
export function exportColumns(board) {
  const b = boardOf(board)
  const cols = [
    { header: 'Rank', value: (r) => r.rank, type: 'int' },
    { header: board === 'agencies' ? 'Agency ID' : 'User ID', value: (r) => r.userId },
    { header: b.who, value: (r) => r.name },
  ]
  if (board === 'hosts') cols.push({ header: 'Agency', value: (r) => r.agency })
  if (board === 'agencies') cols.push({ header: 'Country', value: (r) => r.country }, { header: 'Hosts who received gifts', value: (r) => r.hosts, type: 'int' })
  cols.push({ header: 'Gifts', value: (r) => r.gifts, type: 'int' }, { header: b.unit, value: (r) => r.score, type: 'int' })
  return cols
}

/* "leaderboard-hosts-daily-2026-11-01" (previous boards say so, so a download is never mistaken for the running one). */
export function exportName(board, period, which, startsAt) {
  const label = { day: 'daily', week: 'weekly', month: 'monthly' }[period] || period
  return `leaderboard-${board}-${label}${which === 'previous' ? '-previous' : ''}-${istDate(startsAt)}`
}

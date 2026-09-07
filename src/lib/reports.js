import { supabase } from './supabase.js'
import { shortId } from './admin.js'

const unwrap = ({ data, error }) => { if (error) throw error; return data }
const MONTHS_BACK = 12
const DAY = 864e5

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const monthLabel = (d) => d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
const titleMethod = (m) => (m === 'upi' ? 'UPI' : String(m).split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '))

function monthBuckets(n) {
  const now = new Date()
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({ key: monthKey(d), label: monthLabel(d) })
  }
  return out
}

function weekBuckets(n) {
  const now = new Date()
  const mondayOffset = (now.getDay() + 6) % 7
  const thisMon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset)
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(thisMon.getFullYear(), thisMon.getMonth(), thisMon.getDate() - i * 7)
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)
    out.push({ start: +start, end: +end, label: start.toLocaleString('en-US', { month: 'short', day: 'numeric' }) })
  }
  return out
}

const sinceIso = (months) => {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString()
}

export async function loadReports() {
  const since = sinceIso(MONTHS_BACK)

  const [purchases, gifts, newProfiles, streams] = await Promise.all([
    supabase.from('coin_purchases').select('amount_inr, coins_credited, payment_method, status, created_at').gte('created_at', since).limit(20000),
    supabase.from('gift_transactions').select('coins, sender_id, receiver_id, created_at').gte('created_at', since).limit(50000),
    supabase.from('profiles').select('id, created_at').gte('created_at', since).limit(50000),
    supabase.from('live_streams').select('id, status, started_at, ended_at').gte('started_at', since).limit(50000),
  ])
  for (const r of [purchases, gifts, newProfiles, streams]) if (r.error) throw r.error

  const okPurchases = purchases.data.filter((p) => p.status === 'success')
  const num = (v) => Number(v) || 0
  const inWin = (ts, lo, hi) => { const t = +new Date(ts); return t >= lo && t < hi }
  const sum = (arr, f) => arr.reduce((s, x) => s + num(f(x)), 0)

  /* ---- monthly series ---- */
  const months = monthBuckets(MONTHS_BACK)
  const revByMonth = Object.fromEntries(months.map((m) => [m.key, 0]))
  const coinsByMonth = Object.fromEntries(months.map((m) => [m.key, 0]))
  for (const p of okPurchases) {
    const k = monthKey(new Date(p.created_at))
    if (k in revByMonth) revByMonth[k] += num(p.amount_inr)
  }
  for (const g of gifts.data) {
    const k = monthKey(new Date(g.created_at))
    if (k in coinsByMonth) coinsByMonth[k] += num(g.coins)
  }

  /* ---- KPIs: last 30d vs prior 30d ---- */
  const now = Date.now()
  const d30 = now - 30 * DAY
  const d60 = now - 60 * DAY
  const kpi = (k, v, cur, prev) => {
    const delta = prev === 0 ? (cur === 0 ? 0 : 100) : Math.round(((cur - prev) / prev) * 100)
    return { k, v, dir: delta >= 0 ? 'up' : 'down', d: Math.abs(delta) }
  }
  const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`
  const compact = (n) => Math.round(n).toLocaleString('en-US')

  const rev30 = sum(okPurchases.filter((p) => inWin(p.created_at, d30, now)), (p) => p.amount_inr)
  const revPrev = sum(okPurchases.filter((p) => inWin(p.created_at, d60, d30)), (p) => p.amount_inr)
  const gift30 = sum(gifts.data.filter((g) => inWin(g.created_at, d30, now)), (g) => g.coins)
  const giftPrev = sum(gifts.data.filter((g) => inWin(g.created_at, d60, d30)), (g) => g.coins)
  const users30 = newProfiles.data.filter((p) => inWin(p.created_at, d30, now)).length
  const usersPrev = newProfiles.data.filter((p) => inWin(p.created_at, d60, d30)).length
  const live30 = streams.data.filter((s) => inWin(s.started_at, d30, now)).length
  const livePrev = streams.data.filter((s) => inWin(s.started_at, d60, d30)).length

  const kpis = [
    kpi('Revenue · 30d', inr(rev30), rev30, revPrev),
    kpi('Coins gifted · 30d', compact(gift30), gift30, giftPrev),
    kpi('New users · 30d', String(users30), users30, usersPrev),
    kpi('Live streams · 30d', String(live30), live30, livePrev),
  ]

  /* ---- recharge channel split (₹ by payment_method, success only) ---- */
  const byMethod = {}
  for (const p of okPurchases) {
    const m = p.payment_method || 'other'
    byMethod[m] = (byMethod[m] || 0) + num(p.amount_inr)
  }
  const totalMethod = Object.values(byMethod).reduce((s, x) => s + x, 0)
  const palette = ['#7c3aed', '#ec4899', '#22a06b', '#f59e0b', '#3b82f6', '#ef4444']
  const channelSplit = Object.entries(byMethod)
    .sort((a, b) => b[1] - a[1])
    .map(([label, val], i) => ({ label: titleMethod(label), value: totalMethod ? Math.round((val / totalMethod) * 100) : 0, color: palette[i % palette.length] }))

  /* ---- gifter / host leaderboards ---- */
  const rollup = (key) => {
    const m = {}
    for (const g of gifts.data) { const id = g[key]; if (id) m[id] = (m[id] || 0) + num(g.coins) }
    return m
  }
  const gifters = rollup('sender_id')
  const hosts = rollup('receiver_id')
  const ids = [...new Set([...Object.keys(gifters), ...Object.keys(hosts)])]
  let nameById = {}
  if (ids.length) {
    const profs = unwrap(await supabase.from('profiles').select('id, name, username').in('id', ids))
    nameById = Object.fromEntries(profs.map((p) => [p.id, p.name || (p.username ? `@${p.username}` : shortId(p.id))]))
  }
  const board = (m) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([id, coins], i) => ({ rank: i + 1, id, name: nameById[id] || shortId(id), coins }))

  /* ---- weekly area series (last 8 weeks) ---- */
  const weeks = weekBuckets(8)
  const newUsersWeekly = weeks.map((w) => newProfiles.data.filter((p) => { const t = +new Date(p.created_at); return t >= w.start && t < w.end }).length)
  const liveHoursWeekly = weeks.map((w) => {
    let mins = 0
    for (const s of streams.data) {
      if (!s.started_at) continue
      const st = +new Date(s.started_at)
      if (st < w.start || st >= w.end) continue
      const en = s.ended_at ? +new Date(s.ended_at) : st
      mins += Math.max(0, (en - st) / 60000)
    }
    return Math.round(mins / 60)
  })

  return {
    months: months.map((m) => m.label),
    revenueByMonth: months.map((m) => Math.round(revByMonth[m.key])),
    coinsGiftedByMonth: months.map((m) => coinsByMonth[m.key]),
    kpis,
    channelSplit,
    gifterBoard: board(gifters),
    hostBoard: board(hosts),
    weekLabels: weeks.map((w) => w.label),
    newUsersWeekly,
    liveHoursWeekly,
    totals: {
      revenue12mo: Math.round(sum(okPurchases, (p) => p.amount_inr)),
      coinsGifted12mo: sum(gifts.data, (g) => g.coins),
      newUsers12mo: newProfiles.data.length,
      streams12mo: streams.data.length,
    },
    generatedAt: new Date().toISOString(),
  }
}

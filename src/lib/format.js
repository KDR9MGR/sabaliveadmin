/* Real-data formatting helpers — relative time and day-bucketing for charts. */

export function relativeTime(iso) {
  if (!iso) return '—'
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.round(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

/* Last `days` UTC-day buckets (oldest -> newest), each { key: 'YYYY-MM-DD', label: 'DD Mon' }. */
export function dayBuckets(days = 30) {
  const out = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    out.push({ key, label })
  }
  return out
}

/* Count `rows` into the given buckets by the UTC date of `dateField`. */
export function bucketCounts(rows, dateField, buckets) {
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, 0]))
  for (const r of rows) {
    const v = r[dateField]
    if (!v) continue
    const key = new Date(v).toISOString().slice(0, 10)
    if (key in byKey) byKey[key] += 1
  }
  return buckets.map((b) => byKey[b.key])
}

/* Sum `sumField` of `rows` into the given buckets by the UTC date of `dateField`. */
export function bucketSums(rows, dateField, sumField, buckets) {
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, 0]))
  for (const r of rows) {
    const v = r[dateField]
    if (!v) continue
    const key = new Date(v).toISOString().slice(0, 10)
    if (key in byKey) byKey[key] += Number(r[sumField]) || 0
  }
  return buckets.map((b) => byKey[b.key])
}

export function startOfMonthISO() {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString()
}

export function daysAgoISO(days) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

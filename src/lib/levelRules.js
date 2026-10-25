/* Pure rules of the Levels page (no database here, so they are unit-tested): what saving a level's XP does to the levels above it.
   The database side is admin_save_track_level_v2 (sabalive migration 20261025110000). */

/* rows: [{ level, xp }] ordered by level. Setting level `level` to `xp` reaches the next level when xp >= next level's XP; the database then moves
   every LATER level up by the same amount, so each keeps its gap to the one before it. Anything else shifts nothing.
   Returns { shift, count, delta, from, to, newNext } (count = how many later levels move, from..to = their level numbers). */
export function levelShiftPlan(rows, level, xp) {
  const none = { shift: false, count: 0, delta: 0, from: null, to: null, newNext: null }
  const x = Number(xp)
  if (!Array.isArray(rows) || !rows.length || !Number.isFinite(x) || xp === '' || xp === null) return none
  const cur = rows.find((r) => r.level === level)
  const next = rows.find((r) => r.level === level + 1)
  if (!cur || !next || x < next.xp) return none
  const later = rows.filter((r) => r.level > level)
  const delta = x - cur.xp
  return { shift: true, count: later.length, delta, from: later[0].level, to: later[later.length - 1].level, newNext: next.xp + delta }
}

/* The one-line warning shown in the edit drawer while a shift is planned. */
export function shiftNotice(plan) {
  if (!plan.shift) return ''
  const range = plan.from === plan.to ? `Level ${plan.from}` : `Levels ${plan.from} to ${plan.to}`
  return `${range} will move up by ${plan.delta.toLocaleString()} XP (level ${plan.from} then needs ${plan.newNext.toLocaleString()}), so each keeps its gap. Everyone is re-levelled at once.`
}

/* A line for the toast after saving. */
export function savedLine(moved) {
  return moved > 0 ? `Level saved. ${moved} later level${moved === 1 ? '' : 's'} moved up` : 'Level saved'
}

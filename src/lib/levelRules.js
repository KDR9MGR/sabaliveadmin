/* Pure rules of the Levels page (no database here, so they are unit-tested). The database side is admin_save_track_level_v3 (sabalive migration
   20261025140000): every level gets exactly the XP typed, with no relation to the level before or after it. A person is at the HIGHEST level whose XP they
   have reached, so numbers that are out of order are allowed; the page only says so, it never blocks. */

/* XP is stored as a 32-bit integer. */
export const MAX_XP = 2147483647

const num = (n) => Number(n).toLocaleString('en-US')

/* The XP typed for a level: a whole number from 0 to MAX_XP, and level 1 is always 0 (it is where everybody starts). Nothing is compared with the other
   levels. Returns { xp } or { error }. */
export function checkXp(level, value) {
  const text = String(value ?? '').trim()
  if (text === '') return { error: 'Enter the XP this level needs' }
  if (!/^\d+$/.test(text)) return { error: 'XP must be a whole number, 0 or more' }
  const xp = Number(text)
  if (xp > MAX_XP) return { error: `XP can be at most ${num(MAX_XP)}` }
  if (level === 1 && xp !== 0) return { error: 'Level 1 always needs 0 XP' }
  return { xp }
}

/* A heads-up, never a block, when the number sits outside its neighbours. rows: [{ level, xp }]. '' when it is in order (or cannot be judged). */
export function orderNote(rows, level, value) {
  const text = String(value ?? '').trim()
  if (!Array.isArray(rows) || !/^\d+$/.test(text)) return ''
  const xp = Number(text)
  const prev = rows.find((r) => r.level === level - 1)
  const next = rows.find((r) => r.level === level + 1)
  const parts = []
  if (prev && xp < prev.xp) parts.push(`Lower than level ${prev.level} (${num(prev.xp)} XP): people reach this level before level ${prev.level}.`)
  if (next && xp > next.xp) parts.push(`Higher than level ${next.level} (${num(next.xp)} XP): people reach level ${next.level} before this one.`)
  return parts.join(' ')
}

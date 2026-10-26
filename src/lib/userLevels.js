/* A person's Wealth and Charm levels as the panel shows them on the user page: the level, the XP they have, the XP the NEXT level needs and how far they are to it.
   The same numbers the app's My Level screen shows (lib/data/levels_repository.dart: `next` is level + 1, progress is (xp - this level's XP) / (next XP - this level's XP)),
   so the panel, the app and the database cannot disagree: all three read profiles.{wealth,charm}_{xp,level} and track_levels (Master -> Levels).

   Each level needs exactly the XP typed in Levels, with no relation to its neighbours, and a person is at the HIGHEST level whose XP they have reached
   (recompute_track_levels and the gift trigger both work that way), so the next level (level + 1) always needs more XP than the person has. */

export const TRACKS = [
  { key: 'wealth', label: 'Wealth', hint: 'coins spent' },
  { key: 'charm', label: 'Charm', hint: 'value received' },
]

/* track_levels rows -> { wealth: [{ level, xp }], charm: [...] }, in level order. Rows that are not readable are skipped. */
export function laddersFromRows(rows) {
  const out = { wealth: [], charm: [] }
  for (const r of rows || []) {
    const level = Number(r?.level)
    const xp = Number(r?.xp_required)
    if (!out[r?.track] || !Number.isInteger(level) || !Number.isFinite(xp)) continue
    out[r.track].push({ level, xp })
  }
  for (const k of Object.keys(out)) out[k].sort((a, b) => a.level - b.level)
  return out
}

/* The highest level whose XP the person has reached; level 1 when the ladder is empty (what the database does). */
export function expectedLevel(xp, ladder) {
  let best = 0
  for (const l of ladder || []) if (l.xp <= xp && l.level > best) best = l.level
  return best || 1
}

/* One track: { level, xp, current, next, toNext, progress, maxed, expected, inSync }.
   `current` / `next` are { level, xp } or null; progress is 0..1 (1 when there is no next level); toNext is the XP still missing (0 at the top). */
export function trackProgress({ level, xp }, ladder) {
  const lv = Number(level) || 1
  const have = Math.max(0, Number(xp) || 0)
  const list = ladder || []
  const current = list.find((l) => l.level === lv) || null
  const next = list.find((l) => l.level === lv + 1) || null
  let progress = 1
  if (current && next) {
    const span = next.xp - current.xp
    progress = span <= 0 ? 1 : Math.min(1, Math.max(0, (have - current.xp) / span))
  }
  const expected = expectedLevel(have, list)
  return {
    level: lv,
    xp: have,
    current,
    next,
    toNext: next ? Math.max(0, next.xp - have) : 0,
    progress,
    maxed: !next,
    expected,
    // false only when the stored level is not the one the XP reaches (should never happen: the panel's save re-levels everyone); an empty ladder cannot tell
    inSync: list.length === 0 || expected === lv,
  }
}

/* The two cards of a user page, from the profile row and the ladders. */
export function userLevelCards(profile, ladders) {
  const p = profile || {}
  return TRACKS.map((t) => ({
    ...t,
    ...trackProgress({ level: p[`${t.key}_level`], xp: p[`${t.key}_xp`] }, (ladders || {})[t.key]),
    hasLadder: ((ladders || {})[t.key] || []).length > 0,
  }))
}

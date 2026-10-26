import test from 'node:test'
import assert from 'node:assert/strict'
import { laddersFromRows, expectedLevel, trackProgress, userLevelCards } from './userLevels.js'

// the same fixture as the app's test (sabalive/test/my_level_panel_levels_test.dart, 'WealthCharmLevels.from'): both sides must give the same numbers
const profile = { wealth_xp: 700, wealth_level: 2, charm_xp: 100, charm_level: 1 }
const ladders = {
  wealth: [{ level: 1, xp: 0 }, { level: 2, xp: 500 }, { level: 3, xp: 2500 }],
  charm: [{ level: 1, xp: 0 }, { level: 2, xp: 300 }],
}

test('Wealth and Charm are separate, each with its own next level (the app\'s numbers)', () => {
  const [w, c] = userLevelCards(profile, ladders)
  assert.equal(w.label, 'Wealth')
  assert.equal(c.label, 'Charm')
  assert.deepEqual([w.level, w.xp, w.next.level, w.next.xp, w.toNext], [2, 700, 3, 2500, 1800])
  assert.ok(Math.abs(w.progress - 0.1) < 1e-9, '(700 - 500) / (2500 - 500)')
  assert.deepEqual([c.level, c.xp, c.next.level, c.next.xp, c.toNext], [1, 100, 2, 300, 200])
  assert.ok(Math.abs(c.progress - 1 / 3) < 1e-9, '(100 - 0) / 300')
  assert.equal(w.inSync && c.inSync, true)
})

test('the top level has no next level: full bar, nothing missing', () => {
  const t = trackProgress({ level: 3, xp: 3000 }, ladders.wealth)
  assert.equal(t.maxed, true)
  assert.equal(t.next, null)
  assert.equal(t.progress, 1)
  assert.equal(t.toNext, 0)
})

test('a level needs exactly the XP typed: out-of-order numbers still give the right level and next level', () => {
  // level 2 and 3 need 5000, level 4 only 100 (the panel allows it): a person is at the HIGHEST level whose XP they reached
  const odd = [{ level: 1, xp: 0 }, { level: 2, xp: 5000 }, { level: 3, xp: 5000 }, { level: 4, xp: 100 }]
  assert.equal(expectedLevel(50, odd), 1)
  assert.equal(expectedLevel(100, odd), 4)
  assert.equal(expectedLevel(5000, odd), 4)
  const low = trackProgress({ level: 1, xp: 50 }, odd)
  assert.deepEqual([low.next.level, low.toNext, low.inSync], [2, 4950, true])
  const top = trackProgress({ level: 4, xp: 3000 }, odd)
  assert.deepEqual([top.maxed, top.inSync], [true, true])
})

test('a stored level that is not the one the XP reaches is flagged', () => {
  const t = trackProgress({ level: 3, xp: 700 }, ladders.wealth)
  assert.equal(t.inSync, false)
  assert.equal(t.expected, 2)
})

test('an empty or missing ladder never breaks the page: level and XP only, and it cannot call anything out of sync', () => {
  const t = trackProgress({ level: 7, xp: 1234 }, [])
  assert.deepEqual([t.level, t.xp, t.next, t.maxed, t.inSync], [7, 1234, null, true, true])
  const cards = userLevelCards({ wealth_xp: 5, wealth_level: 1 }, undefined)
  assert.equal(cards[0].hasLadder, false)
  assert.equal(cards[1].level, 1, 'a profile without the Charm columns reads as level 1, XP 0')
  assert.equal(cards[1].xp, 0)
})

test('track_levels rows become ladders in level order, skipping what cannot be read', () => {
  const l = laddersFromRows([
    { track: 'wealth', level: 3, xp_required: 2500 },
    { track: 'wealth', level: 1, xp_required: 0 },
    { track: 'charm', level: 2, xp_required: 300 },
    { track: 'wealth', level: 'x', xp_required: 5 },
    { track: 'other', level: 1, xp_required: 0 },
    null,
  ])
  assert.deepEqual(l.wealth.map((x) => x.level), [1, 3])
  assert.deepEqual(l.charm, [{ level: 2, xp: 300 }])
  assert.deepEqual(laddersFromRows(undefined), { wealth: [], charm: [] })
})

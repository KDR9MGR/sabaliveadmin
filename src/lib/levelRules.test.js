import test from 'node:test'
import assert from 'node:assert/strict'
import { MAX_XP, checkXp, orderNote } from './levelRules.js'

const rows = [
  { level: 1, xp: 0 }, { level: 2, xp: 500 }, { level: 3, xp: 2000 }, { level: 4, xp: 4500 }, { level: 5, xp: 8000 },
]

test('any whole number from 0 to the integer limit is accepted, whatever the other levels are', () => {
  assert.deepEqual(checkXp(3, '5'), { xp: 5 })
  assert.deepEqual(checkXp(3, ' 123456 '), { xp: 123456 })
  assert.deepEqual(checkXp(3, 99999), { xp: 99999 })
  assert.deepEqual(checkXp(100, String(MAX_XP)), { xp: MAX_XP })
  assert.deepEqual(checkXp(2, '0'), { xp: 0 })
})

test('what is refused: nothing typed, not a whole number, negative, past the integer limit', () => {
  assert.ok(checkXp(3, '').error)
  assert.ok(checkXp(3, '   ').error)
  assert.ok(checkXp(3, null).error)
  assert.ok(checkXp(3, 'abc').error)
  assert.ok(checkXp(3, '12.5').error)
  assert.ok(checkXp(3, '-4').error)
  assert.ok(checkXp(3, '1e6').error)
  assert.match(checkXp(3, String(MAX_XP + 1)).error, /at most 2,147,483,647/)
})

test('level 1 is the one fixed number: it always needs 0 XP', () => {
  assert.deepEqual(checkXp(1, '0'), { xp: 0 })
  assert.match(checkXp(1, '5').error, /Level 1 always needs 0 XP/)
})

test('in order: no heads-up', () => {
  assert.equal(orderNote(rows, 3, 3000), '')
  assert.equal(orderNote(rows, 3, 500), '', 'equal to the previous level is not lower')
  assert.equal(orderNote(rows, 3, 4500), '', 'equal to the next level is not higher')
})

test('lower than the previous level: a heads-up that names it', () => {
  assert.equal(orderNote(rows, 4, 100), 'Lower than level 3 (2,000 XP): people reach this level before level 3.')
})

test('higher than the next level: a heads-up that names it', () => {
  assert.equal(orderNote(rows, 2, 3000), 'Higher than level 3 (2,000 XP): people reach level 3 before this one.')
})

test('a number that is outside both neighbours says both', () => {
  const odd = [{ level: 1, xp: 0 }, { level: 2, xp: 1000 }, { level: 3, xp: 50 }, { level: 4, xp: 900 }]
  const note = orderNote(odd, 3, 50)
  assert.match(note, /Lower than level 2/)
  assert.doesNotMatch(note, /Higher/)
  assert.match(orderNote(odd, 2, 2000), /Higher than level 3/)
})

test('the top level and the first level have only one neighbour', () => {
  assert.equal(orderNote(rows, 5, 999999), '')
  assert.match(orderNote(rows, 5, 10), /Lower than level 4/)
  assert.equal(orderNote(rows, 1, 0), '')
})

test('empty or unreadable input gives no heads-up', () => {
  assert.equal(orderNote([], 2, 600), '')
  assert.equal(orderNote(null, 2, 600), '')
  assert.equal(orderNote(rows, 2, ''), '')
  assert.equal(orderNote(rows, 2, 'abc'), '')
})

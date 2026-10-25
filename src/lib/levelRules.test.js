import test from 'node:test'
import assert from 'node:assert/strict'
import { levelShiftPlan, shiftNotice, savedLine } from './levelRules.js'

const rows = [
  { level: 1, xp: 0 }, { level: 2, xp: 500 }, { level: 3, xp: 2000 }, { level: 4, xp: 4500 }, { level: 5, xp: 8000 },
]

test('an XP between the neighbours shifts nothing', () => {
  assert.equal(levelShiftPlan(rows, 3, 3000).shift, false)
  assert.equal(levelShiftPlan(rows, 3, 4499).shift, false)
  assert.equal(levelShiftPlan(rows, 3, 501).shift, false)
})

test('lowering a level never shifts', () => {
  assert.equal(levelShiftPlan(rows, 3, 1000).shift, false)
})

test('reaching the next level moves every later level up by what this one moved', () => {
  const p = levelShiftPlan(rows, 2, 2500)
  assert.equal(p.shift, true)
  assert.equal(p.delta, 2000)
  assert.equal(p.count, 3)
  assert.deepEqual([p.from, p.to], [3, 5])
  assert.equal(p.newNext, 4000)
})

test('equal to the next level also shifts (the database needs it strictly below)', () => {
  const p = levelShiftPlan(rows, 3, 4500)
  assert.equal(p.shift, true)
  assert.equal(p.delta, 2500)
  assert.equal(p.count, 2)
})

test('the top level and a new level have nothing above them', () => {
  assert.equal(levelShiftPlan(rows, 5, 999999).shift, false)
  assert.equal(levelShiftPlan(rows, 6, 9000).shift, false)
})

test('empty or unreadable input shifts nothing', () => {
  assert.equal(levelShiftPlan([], 2, 600).shift, false)
  assert.equal(levelShiftPlan(null, 2, 600).shift, false)
  assert.equal(levelShiftPlan(rows, 2, '').shift, false)
  assert.equal(levelShiftPlan(rows, 2, 'abc').shift, false)
  assert.equal(levelShiftPlan(rows, 2, null).shift, false)
})

test('the notice names the levels, the amount and the new XP of the next level', () => {
  assert.equal(shiftNotice(levelShiftPlan(rows, 2, 3000)), 'Levels 3 to 5 will move up by 2,500 XP (level 3 then needs 4,500), so each keeps its gap. Everyone is re-levelled at once.')
  assert.match(shiftNotice(levelShiftPlan(rows, 4, 8000)), /^Level 5 will move up by 3,500 XP/)
  assert.equal(shiftNotice(levelShiftPlan(rows, 3, 3000)), '')
})

test('the saved line says how many levels moved', () => {
  assert.equal(savedLine(0), 'Level saved')
  assert.equal(savedLine(1), 'Level saved. 1 later level moved up')
  assert.equal(savedLine(4), 'Level saved. 4 later levels moved up')
})

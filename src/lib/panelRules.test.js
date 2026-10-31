import test from 'node:test'
import assert from 'node:assert/strict'
import { parsePrice, priceLabel, isMasterRole, assignable, lockedName, missesColumn } from './panelRules.js'

test('an empty or zero price means free', () => {
  for (const v of ['', null, undefined, 0, '0', ' 0 ']) assert.equal(parsePrice(v), 0)
})

test('a real price is kept as a whole number', () => {
  assert.equal(parsePrice('150'), 150)
  assert.equal(parsePrice(4000), 4000)
})

test('a negative, fractional or non-numeric price is refused', () => {
  for (const v of ['-1', -5, 'abc', 1.5, '2.5', NaN, Infinity]) assert.throws(() => parsePrice(v), /Price must be/)
})

test('the price label says Free for 0', () => {
  assert.equal(priceLabel(0), 'Free')
  assert.equal(priceLabel(null), 'Free')
  assert.equal(priceLabel(4000), '4,000 coins')
})

test('only Master and Super Admin are masters', () => {
  assert.equal(isMasterRole('admin'), true)
  assert.equal(isMasterRole('super_admin'), true)
  for (const r of ['global_admin', 'country_admin', 'sub_admin', 'agency_manager', undefined, null]) assert.equal(isMasterRole(r), false)
})

test('a locked item is hidden from everyone but Master and Super Admin', () => {
  const items = [{ id: 1, name: 'Open' }, { id: 2, name: 'Reserved', locked: true }]
  assert.deepEqual(assignable(items, 'sub_admin').map((i) => i.id), [1])
  assert.deepEqual(assignable(items, 'global_admin').map((i) => i.id), [1])
  assert.deepEqual(assignable(items, 'admin').map((i) => i.id), [1, 2])
  assert.deepEqual(assignable(items, 'super_admin').map((i) => i.id), [1, 2])
  assert.deepEqual(assignable(undefined, 'sub_admin'), [])
})

test('a locked item shows a lock in front of its name', () => {
  assert.equal(lockedName({ name: 'Reserved', locked: true }), '🔒 Reserved')
  assert.equal(lockedName({ name: 'Open' }), 'Open')
})

test('a missing column is recognised for that column only', () => {
  assert.equal(missesColumn({ message: 'column frames.locked does not exist' }, 'locked'), true)
  assert.equal(missesColumn({ message: 'Could not find the \'locked\' column of \'frames\' in the schema cache' }, 'locked'), true)
  assert.equal(missesColumn({ message: 'column frames.name does not exist' }, 'locked'), false)
  assert.equal(missesColumn({ message: 'permission denied for table frames' }, 'locked'), false)
  assert.equal(missesColumn(null, 'locked'), false)
})

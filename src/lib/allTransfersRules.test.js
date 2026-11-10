import test from 'node:test'
import assert from 'node:assert/strict'
import { canSeeAllTransfers, shapeTransfer, shapeGrant, mergeMovements, summarize, roleOptions, exportColumns, KIND_TRANSFER, KIND_GRANT } from './allTransfersRules.js'

const person = (name, display_id, role) => ({ name, username: `u_${name}`, display_id, staff_roles: role ? { role } : null })
const transfer = (id, coins, at, extra = {}) => ({ id, coins, note: null, created_at: at, sender_id: 's1', sender: person('Asha', 100001, 'global_admin'), recipient: person('Ravi', 100002, 'country_admin'), ...extra })
const grant = (id, coins, at) => ({ id, coins, note: 'bonus', created_at: at, granted_by: 'm1', granter: person('Boss', 100000, 'super_admin'), recipient: person('Asha', 100001, 'global_admin') })

test('only a Master or Super Admin may open the page', () => {
  assert.equal(canSeeAllTransfers('admin'), true)
  assert.equal(canSeeAllTransfers('super_admin'), true)
  for (const r of ['global_admin', 'country_admin', 'sub_admin', 'agency_manager', undefined, null]) assert.equal(canSeeAllTransfers(r), false, String(r))
})

test('a transfer row names both sides with their role and app User ID, and says when it was pulled back', () => {
  const t = shapeTransfer(transfer('aaaaaaaa-1111', 500, '2026-11-09T10:00:00Z'))
  assert.equal(t.kind, KIND_TRANSFER)
  assert.deepEqual([t.from, t.fromId, t.fromRole, t.to, t.toId, t.toRole, t.coins, t.status], ['Asha', '100001', 'Global Admin', 'Ravi', '100002', 'Country Admin', 500, 'Done'])
  assert.equal(t.idShort, 'aaaaaaaa')
  assert.equal(t.transferId, 'aaaaaaaa-1111')
  const p = shapeTransfer(transfer('b', 10, '2026-11-09T10:00:00Z', { pulled_back_at: '2026-11-09T11:00:00Z' }))
  assert.equal(p.status, 'Pulled back')
  assert.equal(p.pulledBack, true)
})

test('an ordinary user is labelled User and a missing person a dash', () => {
  const t = shapeTransfer(transfer('c', 5, '2026-11-09T10:00:00Z', { recipient: person('Sam', 200, null), sender: null }))
  assert.equal(t.toRole, 'User')
  assert.equal(t.from, '—')
  assert.equal(t.fromId, '')
})

test('a grant is a Direct grant with no transfer id (it cannot be pulled back as a transfer)', () => {
  const g = shapeGrant(grant('g1', 1000, '2026-11-08T10:00:00Z'))
  assert.equal(g.kind, KIND_GRANT)
  assert.equal(g.fromRole, 'Super Admin')
  assert.equal(g.transferId, undefined)
  assert.equal(g.note, 'bonus')
})

test('both kinds are merged newest first, and the totals leave pulled-back coins out', () => {
  const rows = mergeMovements(
    [transfer('t1', 500, '2026-11-09T10:00:00Z'), transfer('t2', 200, '2026-11-07T10:00:00Z', { pulled_back_at: '2026-11-07T12:00:00Z' })],
    [grant('g1', 1000, '2026-11-08T10:00:00Z')])
  assert.deepEqual(rows.map((r) => r.id), ['transfer-t1', 'grant-g1', 'transfer-t2'])
  assert.deepEqual(summarize(rows), { count: 3, coins: 1500, pulledBack: 1 })
  assert.deepEqual(roleOptions(rows, 'fromRole'), ['Global Admin', 'Super Admin'])
})

test('the export carries the app User ID of both sides and no database id', () => {
  const [r] = mergeMovements([transfer('t1', 500, '2026-11-09T10:00:00Z')], [])
  const cols = exportColumns()
  const out = Object.fromEntries(cols.map((c) => [c.header, c.value(r)]))
  assert.equal(out['From User ID'], '100001')
  assert.equal(out['To User ID'], '100002')
  assert.equal(out.Coins, 500)
  assert.equal(out.Note, '')
  assert.ok(!JSON.stringify(out).includes('s1'))
})

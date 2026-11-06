import test from 'node:test'
import assert from 'node:assert/strict'
import { canPullBackTransfer, reasonOk, pullBackSummary, pullBackError } from './pullBackRules.js'
import { can as canCap } from './capabilities.js'

const row = { transferId: 't1', senderId: 'me', pulledBack: false, coins: 1200, recipient: 'Riya', from: 'Asha' }
const caps = (role, permissions = {}) => (key) => canCap({ role, permissions }, key)

test('a Master has the permission by default and may pull back any transfer', () => {
  assert.equal(canPullBackTransfer({ row: { ...row, senderId: 'someone-else' }, me: 'me', role: 'admin', can: caps('admin') }), true)
})

test('a Master with the permission switched off is not offered the button', () => {
  assert.equal(canPullBackTransfer({ row, me: 'me', role: 'admin', can: caps('admin', { pull_back_coins: false }) }), false)
})

test('a Global / Country / Sub Admin or Agency has nothing until it is granted', () => {
  for (const role of ['global_admin', 'country_admin', 'sub_admin', 'agency_manager']) {
    assert.equal(canPullBackTransfer({ row, me: 'me', role, can: caps(role) }), false, role)
    assert.equal(canPullBackTransfer({ row, me: 'me', role, can: caps(role, { pull_back_coins: true }) }), true, `${role} granted`)
  }
})

test('a granted account may only pull back a transfer it sent', () => {
  const can = caps('global_admin', { pull_back_coins: true })
  assert.equal(canPullBackTransfer({ row: { ...row, senderId: 'another' }, me: 'me', role: 'global_admin', can }), false)
  assert.equal(canPullBackTransfer({ row, me: null, role: 'global_admin', can }), false)
})

test('a transfer already pulled back, a row with no transfer (an old grant) or a missing row is not offered', () => {
  const can = caps('admin')
  assert.equal(canPullBackTransfer({ row: { ...row, pulledBack: true }, me: 'me', role: 'admin', can }), false)
  assert.equal(canPullBackTransfer({ row: { ...row, transferId: undefined }, me: 'me', role: 'admin', can }), false)
  assert.equal(canPullBackTransfer({ row: null, me: 'me', role: 'admin', can }), false)
})

test('the permission is a switchable capability, off for lower roles and on for a Master', () => {
  assert.equal(canCap({ role: 'admin', permissions: {} }, 'pull_back_coins'), true)
  assert.equal(canCap({ role: 'sub_admin', permissions: {} }, 'pull_back_coins'), false)
  assert.equal(canCap({ role: 'super_admin', permissions: {} }, 'pull_back_coins'), true)
})

test('a reason needs 3 visible characters', () => {
  assert.equal(reasonOk('  '), false)
  assert.equal(reasonOk('ab'), false)
  assert.equal(reasonOk(' wrong person '), true)
  assert.equal(reasonOk(undefined), false)
})

test('the summary names both sides and the amount', () => {
  assert.equal(pullBackSummary(row), '1,200 coins go from Riya back to Asha.')
})

test('the balance refusal says nothing was moved', () => {
  assert.match(pullBackError({ message: 'Cannot pull back: the recipient has only 50 of the 300 coins left' }), /Not possible: the recipient has only 50 of the 300 coins left\. Nothing was moved\./)
  assert.equal(pullBackError({ message: 'You can only pull back transfers you sent' }), 'You can only pull back transfers you sent')
  assert.equal(pullBackError(null), 'Could not pull the transfer back')
})

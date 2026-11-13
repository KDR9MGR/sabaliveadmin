import test from 'node:test'
import assert from 'node:assert/strict'
import { can, hasGrant, grantedPathAllowed, LOWER_ROLE_GRANTS, GRANT_PAGES } from './capabilities.js'
import { grantedMasterNav } from './grantedNav.js'
import { NAV } from '../config/nav.js'

const SIX = ['transfers', 'transfer-host', 'transfer-agency', 'transfer-sub-admin', 'transfer-country', 'transfer-global']

test('Transfers is a switchable permission: Super Admin always, a Master by default unless switched off, lower roles only when granted', () => {
  assert.equal(can({ role: 'super_admin', permissions: {} }, 'manage_transfers'), true)
  assert.equal(can({ role: 'admin', permissions: {} }, 'manage_transfers'), true)
  assert.equal(can({ role: 'admin', permissions: { manage_transfers: false } }, 'manage_transfers'), false)
  for (const role of ['global_admin', 'country_admin', 'sub_admin', 'agency_manager']) assert.equal(can({ role, permissions: {} }, 'manage_transfers'), false, role)
  assert.equal(can({ role: 'country_admin', permissions: { manage_transfers: true } }, 'manage_transfers'), true)
})

test('it can be granted to a Global, Country or Sub Admin, and opens exactly the six Transfers pages', () => {
  assert.deepEqual(LOWER_ROLE_GRANTS.manage_transfers.roles, ['global_admin', 'country_admin', 'sub_admin'])
  const granted = { role: 'global_admin', permissions: { manage_transfers: true } }
  assert.equal(hasGrant(granted, 'manage_transfers'), true)
  for (const p of SIX) assert.equal(grantedPathAllowed(granted, `/admin/users/${p}`), true, p)
  // nothing else of User Management comes with it
  for (const p of ['/admin/users', '/admin/users/ids', '/admin/users/bans', '/admin/users/status', '/admin/users/hosts']) assert.equal(grantedPathAllowed(granted, p), false, p)
  assert.deepEqual(GRANT_PAGES.manage_transfers.map((p) => p.replace('/admin/users/', '')), SIX)
  // an Agency account cannot be given it (it has no transfer power at all)
  assert.equal(hasGrant({ role: 'agency_manager', permissions: { manage_transfers: true } }, 'manage_transfers'), false)
  assert.equal(hasGrant({ role: 'global_admin', permissions: {} }, 'manage_transfers'), false)
})

test('a granted account sees a Transfers menu group with the six pages and nothing else from User Management', () => {
  const nav = grantedMasterNav({ role: 'country_admin', permissions: { manage_transfers: true } })
  const items = nav.flatMap((g) => g.items)
  assert.equal(items.length, 1)
  assert.equal(items[0].label, 'Transfers')
  assert.deepEqual(items[0].children.map((c) => c.to), SIX.map((p) => `/admin/users/${p}`))
  assert.deepEqual(grantedMasterNav({ role: 'country_admin', permissions: {} }), [])
})

test('the Master and Super menus both carry the Transfers group, gated by manage_transfers, and User Management no longer lists the transfer pages', () => {
  const flat = (panel) => NAV[panel].flatMap((g) => g.items)
  for (const [panel, base] of [['master', '/admin/users/'], ['super', '/super/users/']]) {
    const t = flat(panel).find((i) => i.label === 'Transfers')
    assert.ok(t, panel)
    assert.equal(t.cap, 'manage_transfers')
    assert.deepEqual(t.children.map((c) => c.to), SIX.map((p) => base + p))
  }
  const um = flat('master').find((i) => i.label === 'User Management')
  assert.equal(um.cap, 'manage_users')
  assert.ok(!um.children.some((c) => /transfer/i.test(c.label)))
})

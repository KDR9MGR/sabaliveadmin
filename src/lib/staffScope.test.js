import test from 'node:test'
import assert from 'node:assert/strict'
import { SCOPE_FLAG, isScopedRole, scopeIsOn, scopeNote, seesEveryone, exactUserIdFrom } from './staffScope.js'
import { can as canCap } from './capabilities.js'

test('only Global, Country, Sub Admin and Agency are scoped roles', () => {
  for (const r of ['global_admin', 'country_admin', 'sub_admin', 'agency_manager']) assert.equal(isScopedRole(r), true, r)
  for (const r of ['super_admin', 'admin', undefined, null, '']) assert.equal(isScopedRole(r), false, String(r))
})

test('the switch is on only when the flag is exactly true', () => {
  assert.equal(scopeIsOn({ [SCOPE_FLAG]: true }), true)
  assert.equal(scopeIsOn({ [SCOPE_FLAG]: false }), false)
  assert.equal(scopeIsOn({ [SCOPE_FLAG]: 'true' }), false)
  assert.equal(scopeIsOn({}), false)
  assert.equal(scopeIsOn(null), false)
  assert.equal(scopeIsOn(undefined), false)
})

test('the note appears only for a scoped role while the switch is on, and names what that role sees', () => {
  const on = { [SCOPE_FLAG]: true }
  assert.match(scopeNote('country_admin', on), /Sub Admins/)
  assert.match(scopeNote('global_admin', on), /Country Admins/)
  assert.match(scopeNote('sub_admin', on), /your agencies/)
  assert.match(scopeNote('agency_manager', on), /your agency/)
  assert.equal(scopeNote('country_admin', {}), '')
  assert.equal(scopeNote('admin', on), '')
  assert.equal(scopeNote('super_admin', on), '')
})

test('digits typed in a coin picker are read as an app User ID, anything else is not', () => {
  assert.equal(exactUserIdFrom('100260'), 100260)
  assert.equal(exactUserIdFrom('  100260 '), 100260)
  assert.equal(exactUserIdFrom('abc'), null)
  assert.equal(exactUserIdFrom('10 02'), null)
  assert.equal(exactUserIdFrom(''), null)
  assert.equal(exactUserIdFrom('1234567890123456'), null) // 16 digits: too long to be a User ID
})

test('an account given view_all_users is not limited, so the "everyone else is hidden" note is not shown to it', () => {
  const on = { [SCOPE_FLAG]: true }
  assert.equal(seesEveryone({ view_all_users: true }), true)
  assert.equal(seesEveryone({ view_all_users: false }), false)
  assert.equal(seesEveryone(null), false)
  assert.equal(scopeNote('global_admin', on, { view_all_users: true }), '')
  assert.match(scopeNote('global_admin', on, { view_all_users: false }), /Country Admins/)
  assert.match(scopeNote('global_admin', on, {}), /Country Admins/)
})

test('view_all_users is a switchable capability: on for a Master by default, off for lower roles until granted', () => {
  assert.equal(canCap({ role: 'admin', permissions: {} }, 'view_all_users'), true)
  assert.equal(canCap({ role: 'super_admin', permissions: {} }, 'view_all_users'), true)
  for (const role of ['global_admin', 'country_admin', 'sub_admin', 'agency_manager']) {
    assert.equal(canCap({ role, permissions: {} }, 'view_all_users'), false, role)
    assert.equal(canCap({ role, permissions: { view_all_users: true } }, 'view_all_users'), true, `${role} granted`)
  }
})

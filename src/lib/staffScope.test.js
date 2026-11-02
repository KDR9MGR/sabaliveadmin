import test from 'node:test'
import assert from 'node:assert/strict'
import { SCOPE_FLAG, isScopedRole, scopeIsOn, scopeNote, exactUserIdFrom } from './staffScope.js'

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

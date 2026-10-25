import test from 'node:test'
import assert from 'node:assert/strict'
import { MISSING_FUNCTION, isMissingFunction } from './dbErrors.js'

test('a database without the new function is recognised', () => {
  assert.ok(MISSING_FUNCTION.test('Could not find the function public.admin_save_track_level_v2 in the schema cache'))
  assert.ok(MISSING_FUNCTION.test('function public.admin_save_track_level_v2(text, integer) does not exist'))
  assert.ok(isMissingFunction({ code: 'PGRST202', message: 'x' }))
  assert.ok(isMissingFunction({ code: '42883', message: 'x' }))
})

test('ordinary refusals and a missing column are not a missing function', () => {
  assert.ok(!MISSING_FUNCTION.test('Level 2 needs less than the 2000 XP of level 3'))
  assert.ok(!MISSING_FUNCTION.test('column "reason_visible" does not exist'))
  assert.ok(!isMissingFunction({ code: 'P0001', message: 'Only admins can ban users' }))
  assert.ok(!isMissingFunction(null))
})

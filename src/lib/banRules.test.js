import test from 'node:test'
import assert from 'node:assert/strict'
import { BAN_DURATIONS, toLocalInput, customEndIso, customEndError, endsOn, banTerms, fmtEnd } from './banRules.js'

const now = new Date(2026, 9, 25, 10, 0, 0) // 25 Oct 2026 10:00 local

test('the choices: 24 hours first, then 7 and 30 days, a custom date and permanent', () => {
  assert.deepEqual(BAN_DURATIONS.map((d) => d.value), ['24h', '7d', '30d', 'custom', 'permanent'])
})

test('a Date becomes the datetime-local text and back to an ISO instant', () => {
  assert.equal(toLocalInput(new Date(2026, 0, 5, 7, 3)), '2026-01-05T07:03')
  assert.equal(customEndIso('2026-10-27T14:30'), new Date(2026, 9, 27, 14, 30).toISOString())
  assert.equal(customEndIso(''), null)
  assert.equal(customEndIso('nonsense'), null)
})

test('a custom end must be a real date between 5 minutes and 10 years from now', () => {
  assert.match(customEndError('', now), /Pick/)
  assert.match(customEndError('nonsense', now), /valid date/)
  assert.match(customEndError(toLocalInput(new Date(now.getTime() - 3600000)), now), /5 minutes/)
  assert.match(customEndError(toLocalInput(new Date(now.getTime() + 2 * 60000)), now), /5 minutes/)
  assert.equal(customEndError(toLocalInput(new Date(now.getTime() + 10 * 60000)), now), '')
  assert.equal(customEndError('2030-01-01T00:00', now), '')
  assert.match(customEndError('2037-01-01T00:00', now), /at most 10 years/)
})

test('the preview shows the date and time a preset or custom ban would end', () => {
  assert.equal(endsOn('24h', now), '26 Oct 2026, 10:00')
  assert.equal(endsOn('7d', now), '01 Nov 2026, 10:00')
  assert.equal(endsOn('permanent', now), 'Never — until you lift it')
  assert.equal(endsOn('custom', now, '2026-10-27T14:30'), '27 Oct 2026, 14:30')
  assert.equal(endsOn('custom', now, ''), 'Pick a date and time')
})

test('what is sent: presets have no end date, custom has an ISO one, a bad custom date is an error', () => {
  assert.deepEqual(banTerms('24h', '', now), { duration: '24h', endsAt: null })
  assert.deepEqual(banTerms('permanent', '', now), { duration: 'permanent', endsAt: null })
  assert.deepEqual(banTerms('custom', '2026-10-27T14:30', now), { duration: 'custom', endsAt: new Date(2026, 9, 27, 14, 30).toISOString() })
  assert.ok(banTerms('custom', '', now).error)
  assert.ok(banTerms('custom', '2026-10-25T10:01', now).error)
  assert.ok(banTerms('1h', '', now).error)
})

test('a ban end is shown with its time, and nothing for a permanent one', () => {
  assert.equal(fmtEnd(new Date(2026, 9, 26, 9, 5).toISOString()), '26 Oct 2026, 09:05')
  assert.equal(fmtEnd(null), '')
})

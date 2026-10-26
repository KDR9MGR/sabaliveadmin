import test from 'node:test'
import assert from 'node:assert/strict'
import {
  monthLabel, finishedMonths, normalizePreview, buttonState, confirmMatches, BUTTONS,
  AUTO_DEFAULTS, normalizeAutoSettings, checkAutoSettings, sameAutoSettings, nextAutoRun,
} from './diamondResetRules.js'

test('a month is named in words', () => {
  assert.equal(monthLabel('2026-09'), 'September 2026')
  assert.equal(monthLabel('2026-12'), 'December 2026')
  assert.equal(monthLabel('nope'), 'nope')
})

test('the finished months start with last month, in India time, and never include the month in progress', () => {
  // 2026-10-26 12:00 UTC is 17:30 on the 26th in India: October is in progress, September is the newest finished month
  const a = finishedMonths(new Date('2026-10-26T12:00:00Z'), 3)
  assert.deepEqual(a.map((m) => m.value), ['2026-09', '2026-08', '2026-07'])
  // 2026-10-31 19:00 UTC is already 00:30 on 1 November in India: October has just finished
  const b = finishedMonths(new Date('2026-10-31T19:00:00Z'), 2)
  assert.deepEqual(b.map((m) => m.value), ['2026-10', '2026-09'])
  // across a year end
  const c = finishedMonths(new Date('2027-01-05T00:00:00Z'), 3)
  assert.deepEqual(c.map((m) => m.value), ['2026-12', '2026-11', '2026-10'])
  assert.equal(c[0].label, 'December 2026')
  assert.equal(finishedMonths(new Date('2026-10-26T12:00:00Z')).length, 12)
})

const raw = (g = {}, r = {}, extra = {}) => ({
  period: '2026-09', ended: true,
  gift: { wallets: 4, diamonds: 2900, done: false, ...g },
  reward: { wallets: 1, diamonds: 500, done: false, ...r },
  ...extra,
})

test('an empty or half answer never enables a button', () => {
  const p = normalizePreview({})
  for (const b of BUTTONS) assert.equal(buttonState(p, b.key).enabled, false, b.key)
  assert.equal(buttonState(null, 'gift').enabled, false)
})

test('both months of figures are read as numbers and the buttons say what they would take', () => {
  const p = normalizePreview(raw())
  assert.equal(p.gift.diamonds, 2900)
  assert.deepEqual(buttonState(p, 'gift'), { enabled: true, reason: '', wallets: 4, diamonds: 2900 })
  assert.deepEqual(buttonState(p, 'reward'), { enabled: true, reason: '', wallets: 1, diamonds: 500 })
  const both = buttonState(p, 'both')
  assert.equal(both.enabled, true)
  assert.equal(both.diamonds, 3400)
})

test('a month that has not ended cannot be reset', () => {
  const p = normalizePreview(raw({}, {}, { ended: false }))
  for (const b of BUTTONS) assert.equal(buttonState(p, b.key).enabled, false, b.key)
  assert.match(buttonState(p, 'gift').reason, /not ended/)
})

test('a source that is done is closed, and "both" is closed if either is done', () => {
  const p = normalizePreview(raw({ done: true, run_id: 'x', diamonds: 0 }))
  assert.equal(buttonState(p, 'gift').enabled, false)
  assert.match(buttonState(p, 'gift').reason, /Already reset/)
  assert.equal(buttonState(p, 'reward').enabled, true)
  assert.equal(buttonState(p, 'both').enabled, false)
  assert.match(buttonState(p, 'both').reason, /own button/)
})

test('nothing to take means no button', () => {
  const p = normalizePreview(raw({ diamonds: 0, wallets: 0 }, { diamonds: 0, wallets: 0 }))
  for (const b of BUTTONS) assert.equal(buttonState(p, b.key).enabled, false, b.key)
  assert.equal(buttonState(p, 'gift').reason, 'Nothing to reset')
  // gift empty but reward not: gift is closed, reward and both are open
  const q = normalizePreview(raw({ diamonds: 0, wallets: 0 }))
  assert.equal(buttonState(q, 'gift').enabled, false)
  assert.equal(buttonState(q, 'reward').enabled, true)
  assert.equal(buttonState(q, 'both').enabled, true)
})

test('the confirmation is the month, typed exactly (spaces around it are fine)', () => {
  assert.equal(confirmMatches('2026-09', '2026-09'), true)
  assert.equal(confirmMatches('  2026-09 ', '2026-09'), true)
  assert.equal(confirmMatches('2026-9', '2026-09'), false)
  assert.equal(confirmMatches('', '2026-09'), false)
  assert.equal(confirmMatches('2026-09', ''), false)
  assert.equal(confirmMatches(undefined, '2026-09'), false)
})

test('the automatic settings start OFF with both boxes ticked on day 1, and a missing row never switches anything on', () => {
  assert.deepEqual(AUTO_DEFAULTS, { enabled: false, gift: true, reward: true, day: 1 })
  const none = normalizeAutoSettings(null)
  assert.equal(none.enabled, false)
  assert.equal(none.day, 1)
  const row = normalizeAutoSettings({ enabled: true, reset_gift: true, reset_reward: false, run_day: 5, last_auto_at: '2026-11-05T18:35:00Z', last_auto_note: '2026-10 - gift: 5 diamonds from 1 wallets' })
  assert.deepEqual([row.enabled, row.gift, row.reward, row.day], [true, true, false, 5])
  assert.equal(row.lastNote, '2026-10 - gift: 5 diamonds from 1 wallets')
  assert.equal(normalizeAutoSettings({ enabled: true, run_day: 99 }).day, 1)
})

test('the automatic settings are checked: a day from 1 to 28, and ON needs a box ticked', () => {
  assert.deepEqual(checkAutoSettings({ enabled: true, gift: true, reward: false, day: 3 }), { value: { enabled: true, gift: true, reward: false, day: 3 } })
  assert.match(checkAutoSettings({ enabled: true, gift: false, reward: false, day: 1 }).error, /Tick at least one/)
  assert.equal(checkAutoSettings({ enabled: false, gift: false, reward: false, day: 1 }).error, undefined) // OFF needs no box
  for (const day of [0, 29, 1.5, 'x', undefined]) assert.match(checkAutoSettings({ enabled: true, gift: true, reward: true, day }).error, /1 to 28/, String(day))
  assert.equal(sameAutoSettings({ enabled: true, gift: true, reward: false, day: 3 }, { enabled: true, gift: true, reward: false, day: '3' }), true)
  assert.equal(sameAutoSettings({ enabled: true, gift: true, reward: false, day: 3 }, { enabled: true, gift: true, reward: true, day: 3 }), false)
})

test('nothing is scheduled while the switch is off', () => {
  assert.equal(nextAutoRun({ enabled: false, gift: true, reward: true, day: 1 }, new Date('2026-10-26T12:00:00Z')), null)
})

test('the next automatic run: 00:05 India time on the chosen day, resetting the month before', () => {
  // 26 Oct in India: the next 1st is 1 Nov 00:05 IST = 31 Oct 18:35 UTC, and it resets October
  const a = nextAutoRun({ enabled: true, gift: true, reward: true, day: 1 }, new Date('2026-10-26T12:00:00Z'))
  assert.equal(a.runAt.toISOString(), '2026-10-31T18:35:00.000Z')
  assert.equal(a.period, '2026-10')
  assert.equal(a.periodLabel, 'October 2026')
  assert.equal(a.runAtLabel, '1 Nov 2026, 00:05 India time')
  assert.deepEqual(a.kinds, ['gifting diamonds', 'reward diamonds'])
  // one minute after that moment the run has happened: the next one is 1 Dec, resetting November
  const b = nextAutoRun({ enabled: true, gift: true, reward: false, day: 1 }, new Date('2026-10-31T18:36:00Z'))
  assert.equal(b.period, '2026-11')
  assert.equal(b.runAtLabel, '1 Dec 2026, 00:05 India time')
  assert.deepEqual(b.kinds, ['gifting diamonds'])
  // a later day of the month
  const c = nextAutoRun({ enabled: true, gift: false, reward: true, day: 15 }, new Date('2026-12-20T00:00:00Z'))
  assert.equal(c.runAt.toISOString(), '2027-01-14T18:35:00.000Z')
  assert.equal(c.period, '2026-12')
  assert.deepEqual(c.kinds, ['reward diamonds'])
  // across a year end, in India time (it is already 1 Jan there)
  const d = nextAutoRun({ enabled: true, gift: true, reward: true, day: 1 }, new Date('2026-12-31T19:00:00Z'))
  assert.equal(d.period, '2027-01')
  assert.equal(d.runAtLabel, '1 Feb 2027, 00:05 India time')
  // this month's day not yet reached
  const e = nextAutoRun({ enabled: true, gift: true, reward: true, day: 5 }, new Date('2026-11-02T00:00:00Z'))
  assert.equal(e.runAt.toISOString(), '2026-11-04T18:35:00.000Z')
  assert.equal(e.period, '2026-10')
})

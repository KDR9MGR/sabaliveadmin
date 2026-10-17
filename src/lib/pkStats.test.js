import test from 'node:test'
import assert from 'node:assert/strict'
import { minutesLabel, parseMinutesList, checkPkRules, battleResult, daySummary } from './pkStats.js'

test('lengths in minutes', () => {
  assert.equal(minutesLabel(300), '5 min')
  assert.equal(minutesLabel(2400), '40 min')
  assert.equal(minutesLabel(90), '1.5 min')
  assert.equal(minutesLabel(null), '—')
})

test('the invite lengths list: sorted, unique, whole minutes 1 to 60, at most 8', () => {
  assert.deepEqual(parseMinutesList('40, 5 10 30').seconds, [300, 600, 1800, 2400])
  assert.ok(parseMinutesList('').error)
  assert.ok(parseMinutesList('5, 5').error)
  assert.ok(parseMinutesList('0, 5').error)
  assert.ok(parseMinutesList('5, 61').error)
  assert.ok(parseMinutesList('2.5').error)
  assert.ok(parseMinutesList('1,2,3,4,5,6,7,8,9').error)
})

test('the rules are checked against what the server accepts and sent in seconds', () => {
  const ok = { invite_minutes: '5, 10, 30, 40', random_minutes: 5, forfeit_grace_seconds: 60, invites_per_minute: 6, random_queue_seconds: 20 }
  assert.deepEqual(checkPkRules(ok).rules, { invite_durations: [300, 600, 1800, 2400], random_duration: 300, forfeit_grace_seconds: 60, invites_per_minute: 6, random_queue_seconds: 20 })
  assert.ok(checkPkRules({ ...ok, forfeit_grace_seconds: 30 }).error, 'a grace under 45 s would forfeit on a single late heartbeat')
  assert.ok(checkPkRules({ ...ok, forfeit_grace_seconds: 120 }).error, 'above 85 s the existing 90 s cleanup comes first')
  assert.ok(checkPkRules({ ...ok, random_minutes: 0 }).error)
  assert.ok(checkPkRules({ ...ok, invites_per_minute: 100 }).error)
  assert.ok(checkPkRules({ ...ok, random_queue_seconds: 5 }).error)
})

test('who won, in words', () => {
  assert.equal(battleResult({ status: 'finished', winner: 'a', hostA: 'Asha', hostB: 'Ravi' }), 'Asha won')
  assert.equal(battleResult({ status: 'finished', winner: 'b', hostA: 'Asha', hostB: 'Ravi' }), 'Ravi won')
  assert.equal(battleResult({ status: 'finished', winner: 'draw' }), 'Draw')
  assert.equal(battleResult({ status: 'live' }), 'Running')
  assert.equal(battleResult({ status: 'cancelled' }), 'Cancelled')
})

test('the day summary counts invites, runs, forfeits and the coins of finished battles', () => {
  const rows = [
    { invitedAt: '2026-10-17T10:00:00Z', startedAt: '2026-10-17T10:01:00Z', status: 'finished', scoreA: 100, scoreB: 50, endReason: 'forfeit' },
    { invitedAt: '2026-10-17T11:00:00Z', startedAt: null, status: 'cancelled', scoreA: 0, scoreB: 0 },
    { invitedAt: '2026-10-16T11:00:00Z', startedAt: '2026-10-16T11:01:00Z', status: 'finished', scoreA: 7, scoreB: 3 },
  ]
  const days = daySummary(rows)
  assert.deepEqual(days.map((d) => d.day), ['2026-10-17', '2026-10-16'])
  assert.deepEqual(days[0], { id: '2026-10-17', day: '2026-10-17', invited: 2, ran: 1, finished: 1, forfeits: 1, cancelled: 1, coins: 150 })
  assert.equal(days[1].coins, 10)
})

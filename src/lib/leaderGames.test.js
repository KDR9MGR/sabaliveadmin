import test from 'node:test'
import assert from 'node:assert/strict'
import { leaderGameRow, leaderSwitches, leaderStatusText, LEADER_NOT_INSTALLED } from './leaderGames.js'

const row = (over = {}) => ({ id: 2000001, provider_game_id: '9', name: 'Dragon Tiger II', title: '龙虎斗2', image_url: null, uses_coins: true, status: 1, hidden: false, sort_order: 1, updated_at: '2026-11-18T10:00:00Z', ...over })

test('a database row becomes a table row: id, the company game id kept as text, name, coin flag, order', () => {
  const r = leaderGameRow(row())
  assert.equal(r.id, 2000001)
  assert.equal(r.gameId, '9')
  assert.equal(r.name, 'Dragon Tiger II')
  assert.equal(r.usesCoins, true)
  assert.equal(r.order, 1)
  assert.equal(r.image, '')
  assert.equal(r.status, 'On')
})

test('a game is Shown only when it is on and not hidden by us; hidden wins over off', () => {
  assert.equal(leaderGameRow(row()).inApp, 'Shown')
  assert.equal(leaderGameRow(row({ hidden: true })).inApp, 'Hidden by us')
  assert.equal(leaderGameRow(row({ status: 0 })).inApp, 'Off in the list')
  assert.equal(leaderGameRow(row({ status: 0, hidden: true })).inApp, 'Hidden by us')
  assert.equal(leaderGameRow(row({ hidden: true })).hidden, true)
  assert.equal(leaderGameRow(row({ hidden: null })).hidden, false)
})

test('a row with no name still shows something, a missing picture is empty text', () => {
  const r = leaderGameRow(row({ name: null, image_url: undefined, title: null }))
  assert.equal(r.name, '—')
  assert.equal(r.image, '')
  assert.equal(r.title, '')
})

test('the switches read only a real true from the flags (anything else is off, as in the app)', () => {
  assert.deepEqual(leaderSwitches({ games_enabled: true, leader_games_enabled: true }), { games: true, leader: true })
  assert.deepEqual(leaderSwitches({ games_enabled: true }), { games: true, leader: false })
  assert.deepEqual(leaderSwitches({ games_enabled: 'true', leader_games_enabled: 1 }), { games: false, leader: false })
  assert.deepEqual(leaderSwitches(null), { games: false, leader: false })
  assert.deepEqual(leaderSwitches(undefined), { games: false, leader: false })
})

test('the status line says which switch is the problem', () => {
  assert.equal(leaderStatusText({ games: true, leader: true }), 'Leader games are ON')
  assert.equal(leaderStatusText({ games: true, leader: false }), 'Leader games are OFF')
  assert.equal(leaderStatusText({ games: false, leader: false }), 'Leader games are OFF')
  assert.match(leaderStatusText({ games: false, leader: true }), /main Games switch is off/)
})

test('"not installed" recognises a missing function, a missing table and a stale schema cache', () => {
  for (const msg of [
    'Could not find the function public.admin_set_leader_games_hidden(p_hidden, p_ids) in the schema cache',
    'relation "public.leader_games" does not exist',
    'Could not find the table \'public.leader_games\' in the schema cache',
  ]) assert.ok(LEADER_NOT_INSTALLED.test(msg), msg)
  assert.ok(!LEADER_NOT_INSTALLED.test('Not allowed'))
})

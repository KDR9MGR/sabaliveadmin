import test from 'node:test'
import assert from 'node:assert/strict'
import { presetOptions, presetById, checkSudGame, sudGameRow, SUD_NOT_INSTALLED, SUD_PICKER_LIMIT } from './sudGames.js'
import { SUD_PRESETS } from '../data/sudGames.js'

test('the preset list is sound: unique long ids kept as text, sensible proportions, a name, nothing the web SDK lacks', () => {
  assert.ok(SUD_PRESETS.length >= 50)
  const ids = SUD_PRESETS.map((p) => p.mgId)
  assert.equal(new Set(ids).size, ids.length, 'a game id appears twice')
  for (const p of SUD_PRESETS) {
    assert.match(p.mgId, /^[0-9]{10,25}$/, p.name)
    assert.equal(typeof p.mgId, 'string', 'a 19-digit id must stay text: a JavaScript number would round it')
    assert.ok(p.name.length > 0 && p.name.length <= 120, p.name)
    assert.ok(p.aspect >= 0.25 && p.aspect <= 4, p.name)
  }
  for (const name of ['Ludo', 'TeenPatti', 'Texas Holdem Poker', 'Dominoes', 'UMO']) assert.ok(SUD_PRESETS.some((p) => p.name === name), name)
  for (const gone of ['Carrom', 'Baseball', '777', 'Crazy Racing']) assert.ok(!SUD_PRESETS.some((p) => p.name === gone), `${gone} is not on SUD's web list yet`)
})

test('only games that look like they stake are suggested as coin games', () => {
  assert.deepEqual(SUD_PRESETS.filter((p) => p.coins).map((p) => p.name).sort(), ['Blackjack', 'Short Track Speed Skating', 'TeenPatti', 'Texas Holdem Poker'])
})

test('the picker finds a game by name, id or player count, and says when it may stake coins', () => {
  const opts = presetOptions()
  const find = (q) => opts.filter((o) => o.search.includes(q.toLowerCase())).map((o) => o.label)
  assert.ok(find('ludo').some((l) => l.startsWith('Ludo · 2-4 players')))
  assert.ok(find('1557194487352053761')[0].includes('TeenPatti'))
  assert.ok(find('teenpatti')[0].includes('may stake coins'))
  assert.ok(!find('dominoes')[0].includes('stake'))
})

test('choosing a game from the list is enough: name, proportions and the coin suggestion come with it', () => {
  const r = checkSudGame({ preset: '1468180338417074177' })
  assert.deepEqual(r.game, { mgId: '1468180338417074177', name: 'Ludo', aspect: 1, image: '', description: '', usesCoins: false, status: 1, sort: null })
  const t = checkSudGame({ preset: '1557194487352053761' })
  assert.equal(t.game.usesCoins, true)
})

test('anything typed beats the preset, including turning the coin flag off or on', () => {
  const r = checkSudGame({ preset: '1557194487352053761', name: ' Teen Patti Live ', aspect: '1.2', uses_coins: false, image: 'https://x.example/a.png', description: 'Cards', status: '0', sort: '5' })
  assert.deepEqual(r.game, { mgId: '1557194487352053761', name: 'Teen Patti Live', aspect: 1.2, image: 'https://x.example/a.png', description: 'Cards', usesCoins: false, status: 0, sort: 5 })
  assert.equal(checkSudGame({ preset: '1468180338417074177', uses_coins: true }).game.usesCoins, true)
})

test('a game SUD added since can be added by its id, with a name', () => {
  const r = checkSudGame({ mg_id: ' 1999999999999999999 ', name: 'New game', aspect: '1.5' })
  assert.deepEqual(r.game, { mgId: '1999999999999999999', name: 'New game', aspect: 1.5, image: '', description: '', usesCoins: false, status: 1, sort: null })
  assert.match(checkSudGame({ mg_id: '1999999999999999999' }).error, /name/)
})

test('bad input is refused with a plain message', () => {
  assert.match(checkSudGame({}).error, /Choose a game/)
  assert.match(checkSudGame({ mg_id: 'abc', name: 'X' }).error, /Choose a game/)
  assert.match(checkSudGame({ mg_id: '123', name: 'X' }).error, /digits only/)
  assert.match(checkSudGame({ preset: '1468180338417074177', aspect: '9' }).error, /between 0.25 and 4/)
  assert.match(checkSudGame({ preset: '1468180338417074177', aspect: 'x' }).error, /between 0.25 and 4/)
  assert.match(checkSudGame({ preset: '1468180338417074177', image: 'http://x.example/a.png' }).error, /https/)
  assert.match(checkSudGame({ preset: '1468180338417074177', sort: '1.5' }).error, /whole number/)
  assert.match(checkSudGame({ mg_id: '1999999999999999999', name: 'x'.repeat(121) }).error, /name/)
})

test('a database row becomes a table row: shown, hidden or off', () => {
  const base = { id: 1000001, provider_game_id: '1468180338417074177', name: 'Ludo', aspect: '1.000', uses_coins: false, status: 1, hidden: false, sort_order: 10 }
  assert.equal(sudGameRow(base).inApp, 'Shown')
  assert.equal(sudGameRow({ ...base, hidden: true }).inApp, 'Hidden by us')
  assert.equal(sudGameRow({ ...base, status: 0 }).inApp, 'Off')
  assert.equal(sudGameRow(base).aspect, 1)
  assert.equal(sudGameRow({ ...base, aspect: null }).aspect, null)
  assert.equal(sudGameRow({ ...base, name: '' }).name, '—')
})

test('the database not having the SUD games yet is recognised', () => {
  assert.ok(SUD_NOT_INSTALLED.test('relation "public.sud_games" does not exist'))
  assert.ok(SUD_NOT_INSTALLED.test('Could not find the function public.admin_save_sud_game in the schema cache'))
  assert.ok(!SUD_NOT_INSTALLED.test('Only admins can do that'))
})

test('the Add game list shows every game, the betting ones first and marked (the picker used to cut it at 50 and hide Blackjack)', () => {
  const opts = presetOptions()
  assert.equal(opts.length, SUD_PRESETS.length)
  assert.ok(SUD_PICKER_LIMIT >= SUD_PRESETS.length, 'the picker must be able to show all of them')
  const betting = SUD_PRESETS.filter((p) => p.coins)
  assert.ok(betting.length >= 4)
  // the first ones are exactly the betting games, then the rest
  assert.deepEqual(opts.slice(0, betting.length).map((o) => o.value).sort(), betting.map((p) => p.mgId).sort())
  assert.ok(opts.slice(0, betting.length).every((o) => o.label.includes('betting game')))
  assert.ok(opts.slice(betting.length).every((o) => !o.label.includes('betting game')))
  for (const name of ['TeenPatti', 'Texas Holdem Poker', 'Blackjack']) assert.ok(opts.slice(0, betting.length).some((o) => o.label.startsWith(name)), name)
  // typing "betting" finds them all
  assert.equal(opts.filter((o) => o.search.includes('betting')).length, betting.length)
  // every game is still there exactly once
  assert.equal(new Set(opts.map((o) => o.value)).size, SUD_PRESETS.length)
})

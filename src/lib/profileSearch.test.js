import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanSearchText, profileSearchFilter, profileOption, fetchAllPages } from './profileSearch.js'

test('digits search the app User ID exactly and also names / usernames that contain them', () => {
  assert.equal(profileSearchFilter('100260'), 'display_id.eq.100260,name.ilike.%100260%,username.ilike.%100260%')
})

test('a name searches the name and the username, never the ID', () => {
  assert.equal(profileSearchFilter('Rupa'), 'name.ilike.%Rupa%,username.ilike.%Rupa%')
  assert.equal(profileSearchFilter('অবহেলা'), 'name.ilike.%অবহেলা%,username.ilike.%অবহেলা%')   // non-Latin names work
})

test('nothing typed means nothing to search; spaces around are ignored', () => {
  assert.equal(profileSearchFilter(''), null)
  assert.equal(profileSearchFilter('   '), null)
  assert.equal(profileSearchFilter(null), null)
  assert.equal(profileSearchFilter('  100260 '), profileSearchFilter('100260'))
})

test('characters that could change the filter are removed, so a typed comma or bracket cannot inject another condition', () => {
  assert.equal(cleanSearchText('a,b)(c*d%e\\f'), 'abcdef')
  assert.equal(profileSearchFilter('x,display_id.eq.1'), 'name.ilike.%xdisplay_id.eq.1%,username.ilike.%xdisplay_id.eq.1%')
  assert.ok(!profileSearchFilter('x),(y').includes(')'))
})

test('a very long run of digits is not treated as an ID', () => {
  assert.ok(!profileSearchFilter('12345678901234567890').startsWith('display_id'))
})

test('a people picker entry has the label people read and lower-case text to search in', () => {
  const o = profileOption({ id: 'u1', name: 'Rupa', username: 'rupa_01', display_id: 100235 })
  assert.deepEqual(o, { value: 'u1', label: 'Rupa (@rupa_01) · ID 100235', search: 'rupa rupa_01 100235' })
})

test('fetchAllPages reads past the 1000-row cap: 1160 rows come back as two pages, every row once', async () => {
  const all = Array.from({ length: 1160 }, (_, i) => ({ n: i + 1 }))
  const calls = []
  const rows = await fetchAllPages(async (from, to) => { calls.push([from, to]); return all.slice(from, to + 1) })
  assert.equal(rows.length, 1160)
  assert.equal(rows[1143].n, 1144)                       // the position user 100260 had
  assert.deepEqual(calls, [[0, 999], [1000, 1999]])
})

test('fetchAllPages stops on an exact multiple (one extra empty page) and on an empty list', async () => {
  const exact = Array.from({ length: 2000 }, (_, i) => i)
  const calls = []
  assert.equal((await fetchAllPages(async (f, t) => { calls.push(f); return exact.slice(f, t + 1) })).length, 2000)
  assert.deepEqual(calls, [0, 1000, 2000])
  assert.deepEqual(await fetchAllPages(async () => []), [])
})

test('fetchAllPages has a safety stop', async () => {
  let n = 0
  const rows = await fetchAllPages(async () => { n++; return Array.from({ length: 1000 }, () => 1) }, { maxRows: 3000 })
  assert.equal(rows.length, 3000)
  assert.equal(n, 3)
})

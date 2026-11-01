import test from 'node:test'
import assert from 'node:assert/strict'
import { BOARDS, PERIODS, RESET_TIME, boardOf, periodOf, whichChoices, istStamp, istDate, windowText, resetsIn, shapeBoard, exportColumns, exportName } from './leaderboardRules.js'

test('the reset time is 00:10 and every period says so', () => {
  assert.equal(RESET_TIME, '00:10')
  for (const p of PERIODS) assert.match(p.resets, /00:10 India time/)
  assert.match(periodOf('week').resets, /Monday/)
  assert.match(periodOf('month').resets, /1st/)
})

test('hosts and agencies count diamonds, gifters count coins', () => {
  assert.equal(boardOf('hosts').unit, 'Diamonds')
  assert.equal(boardOf('agencies').unit, 'Diamonds')
  assert.equal(boardOf('gifters').unit, 'Coins')
  assert.deepEqual(BOARDS.map((b) => b.value), ['hosts', 'gifters', 'agencies'])
  assert.equal(boardOf('nonsense').value, 'hosts', 'an unknown board falls back to the first')
})

test('the choice under the period names the board that just ended', () => {
  assert.deepEqual(whichChoices('day').map((c) => c.label), ['Now', 'Yesterday'])
  assert.deepEqual(whichChoices('week').map((c) => c.label), ['Now', 'Last week'])
  assert.deepEqual(whichChoices('month').map((c) => c.label), ['Now', 'Last month'])
  assert.deepEqual(whichChoices('day').map((c) => c.value), ['current', 'previous'])
})

test('times are India time whatever the computer says', () => {
  // 18:40 UTC on 31 Oct is 00:10 IST on 1 Nov
  assert.equal(istStamp('2026-10-31T18:40:00Z'), '1 Nov 2026, 00:10 IST')
  assert.equal(istStamp('2026-10-31T18:39:59Z'), '1 Nov 2026, 00:09 IST')
  assert.equal(istStamp('2026-10-31T18:29:00Z'), '31 Oct 2026, 23:59 IST')
  assert.equal(istStamp('2026-12-31T18:40:00Z'), '1 Jan 2027, 00:10 IST')
  assert.equal(istStamp(null), '—')
  assert.equal(istStamp('not a date'), '—')
  assert.equal(istDate('2026-10-31T18:40:00Z'), '2026-11-01')
  assert.equal(istDate('2026-10-31T18:29:00Z'), '2026-10-31')
})

test('a running board says since when, a finished one from when to when', () => {
  assert.equal(windowText('2026-10-31T18:40:00Z', '2026-11-01T18:40:00Z', 'current'), 'Since 1 Nov 2026, 00:10 IST')
  assert.equal(windowText('2026-10-30T18:40:00Z', '2026-10-31T18:40:00Z', 'previous'), '31 Oct 2026, 00:10 IST to 1 Nov 2026, 00:10 IST')
})

test('the countdown to the reset', () => {
  const end = Date.parse('2026-11-02T18:40:00Z')
  assert.equal(resetsIn(end, end - 5 * 3600e3 - 12 * 60e3), 'in 5 h 12 min')
  assert.equal(resetsIn(end, end - 40 * 60e3), 'in 40 min')
  assert.equal(resetsIn(end, end - 1000), 'in 1 min', 'rounds up, never 0 while it is running')
  assert.equal(resetsIn(end, end - (2 * 1440 + 3 * 60) * 60e3), 'in 2 days 3 h')
  assert.equal(resetsIn(end, end - 1440 * 60e3), 'in 1 day 0 h')
  assert.equal(resetsIn(end, end), 'now')
  assert.equal(resetsIn(end, end + 5000), 'now')
  assert.equal(resetsIn('garbage', 0), '')
})

const RAW_HOSTS = {
  board: 'hosts', period: 'day', which: 'current', starts_at: '2026-10-31T18:40:00Z', ends_at: '2026-11-01T18:40:00Z', entries: 2, total: 1500,
  rows: [
    { rank: 1, id: 'u1', user_id: 100123, name: 'Asha', username: 'asha', avatar_url: 'http://x/a.png', agency: 'KGF Agency', score: 1000, gifts: 4 },
    { rank: 2, id: 'u2', user_id: null, name: null, username: 'ravi', avatar_url: null, agency: null, score: '500', gifts: 1 },
  ],
}

test('the database answer is shaped for the page', () => {
  const b = shapeBoard(RAW_HOSTS, 'hosts')
  assert.equal(b.entries, 2)
  assert.equal(b.total, 1500)
  assert.equal(b.startsAt, '2026-10-31T18:40:00Z')
  assert.deepEqual(b.rows[0], { rank: 1, id: 'u1', userId: '100123', name: 'Asha', username: '@asha', avatarUrl: 'http://x/a.png', agency: 'KGF Agency', country: '', score: 1000, gifts: 4, hosts: 0 })
  assert.equal(b.rows[1].name, '@ravi', 'no name: the username')
  assert.equal(b.rows[1].userId, '')
  assert.equal(b.rows[1].score, 500, 'a number sent as text is read as a number')
  assert.equal(shapeBoard({ rows: [{ rank: 1, id: 'z' }] }, 'gifters').rows[0].name, 'Unnamed')
  assert.deepEqual(shapeBoard(null, 'hosts').rows, [])
  assert.equal(shapeBoard(null, 'gifters').board, 'gifters')
})

test('the downloads carry the app User ID and the right score column', () => {
  const b = shapeBoard(RAW_HOSTS, 'hosts')
  const hostCols = exportColumns('hosts')
  assert.deepEqual(hostCols.map((c) => c.header), ['Rank', 'User ID', 'Host', 'Agency', 'Gifts', 'Diamonds'])
  assert.deepEqual(hostCols.map((c) => c.value(b.rows[0])), [1, '100123', 'Asha', 'KGF Agency', 4, 1000])
  assert.deepEqual(exportColumns('gifters').map((c) => c.header), ['Rank', 'User ID', 'Gifter', 'Gifts', 'Coins'])
  assert.deepEqual(exportColumns('agencies').map((c) => c.header), ['Rank', 'Agency ID', 'Agency', 'Country', 'Hosts who received gifts', 'Gifts', 'Diamonds'])
})

test('a download is named after the board, the period and the India date it starts', () => {
  assert.equal(exportName('hosts', 'day', 'current', '2026-10-31T18:40:00Z'), 'leaderboard-hosts-daily-2026-11-01')
  assert.equal(exportName('gifters', 'week', 'previous', '2026-10-25T18:40:00Z'), 'leaderboard-gifters-weekly-previous-2026-10-26')
  assert.equal(exportName('agencies', 'month', 'current', '2026-10-31T18:40:00Z'), 'leaderboard-agencies-monthly-2026-11-01')
})

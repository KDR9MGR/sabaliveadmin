import test from 'node:test'
import assert from 'node:assert/strict'
import { HOST_COLUMNS, MONTH_COLUMNS, PAYSLIP_COLUMNS, ADMIN_COLUMNS, SALARY_SEARCH_KEYS, slugOf } from './salaryColumns.js'
import { toCsv } from './csv.js'

const headers = (cols) => cols.map((c) => c.header)

test('no export has a Username column; every one has the app-facing User ID', () => {
  for (const cols of [HOST_COLUMNS, PAYSLIP_COLUMNS]) {
    assert.ok(!headers(cols).some((h) => /user ?name/i.test(h)), `a username header slipped in: ${headers(cols)}`)
    assert.ok(headers(cols).includes('User ID'))
  }
})

test('the admin columns map the agency to its Sub, Country and Global Admin with their app IDs, in both host and payslip exports', () => {
  assert.deepEqual(headers(ADMIN_COLUMNS), ['Sub Admin', 'Sub Admin ID', 'Country Admin', 'Country Admin ID', 'Global Admin', 'Global Admin ID'])
  for (const cols of [HOST_COLUMNS, PAYSLIP_COLUMNS]) {
    for (const h of headers(ADMIN_COLUMNS)) assert.ok(headers(cols).includes(h), `${h} is missing`)
    assert.ok(headers(cols).includes('Agency code'))
  }
})

test('the host export shows gift diamonds, reward diamonds and their total side by side', () => {
  const h = headers(HOST_COLUMNS)
  assert.ok(h.includes('Diamonds from gifts') && h.includes('Diamonds from rewards') && h.includes('Total diamonds'))
  assert.ok(headers(MONTH_COLUMNS).includes('Diamonds from rewards'))
})

const host = {
  period: 'Oct 2026', displayId: 100718, host: 'Khushboo Sharma', username: 'khush_01', agencyCode: 20005, agency: 'Shree Shyam',
  subAdmin: 'Sub X', subAdminId: 100301, countryAdmin: 'Country Y', countryAdminId: 100211, globalAdmin: '', globalAdminId: '',
  earned: 5000, rewards: 3000, totalDiamonds: 8000, hours: 18, days: 12, withdrawn: 0, available: 8000, slab: 'Gold', payment: 25, payslipId: null, blocked: null,
}

test('a host row exports the right values; the username is nowhere in the file; the Global Admin is blank when none is recorded', () => {
  const csv = toCsv(HOST_COLUMNS, [host])
  const [head, row] = csv.split('\r\n')
  const cells = row.split(',')
  const at = (h) => cells[head.split(',').indexOf(h)]
  assert.equal(at('User ID'), '100718')
  assert.equal(at('Agency code'), '20005')
  assert.equal(at('Country Admin'), 'Country Y')
  assert.equal(at('Country Admin ID'), '100211')
  assert.equal(at('Global Admin'), '')
  assert.equal(at('Diamonds from gifts'), '5000')
  assert.equal(at('Diamonds from rewards'), '3000')
  assert.equal(at('Total diamonds'), '8000')
  assert.ok(!csv.includes('khush_01'), 'the username must not appear in the export')
})

test('the search keys cover username, the app User ID, agency code, agency and the admins', () => {
  for (const k of ['username', 'displayId', 'agencyCode', 'agency', 'subAdmin', 'countryAdmin', 'globalAdmin']) assert.ok(SALARY_SEARCH_KEYS.includes(k), k)
  const hit = (q) => SALARY_SEARCH_KEYS.some((k) => String(host[k] ?? '').toLowerCase().includes(q.toLowerCase()))
  assert.ok(hit('khush_01') && hit('100718') && hit('20005') && hit('shree') && hit('country y'))
  assert.ok(!hit('nobody'))
})

test('slugOf makes a safe file-name piece', () => {
  assert.equal(slugOf('200212 | ✯ official bulldozer ✯'), '200212-official-bulldozer')
  assert.equal(slugOf(''), '')
})

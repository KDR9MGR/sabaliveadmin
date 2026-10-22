import test from 'node:test'
import assert from 'node:assert/strict'
import { HOST_COLUMNS, MONTH_COLUMNS, PAYSLIP_COLUMNS, ADMIN_COLUMNS, SALARY_SEARCH_KEYS, slugOf, agencyLabel, agencyOption, mapReportRow } from './salaryColumns.js'
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

/* The same test the type-to-search picker and the table search apply */
const pickerHits = (options, q) => options.filter((o) => o.search.includes(q.trim().toLowerCase())).map((o) => o.name)
const tableHit = (row, q) => SALARY_SEARCH_KEYS.some((k) => String(row[k] ?? '').toLowerCase().includes(q.trim().toLowerCase()))

const agencies = [
  { id: 'a1', name: 'India_Agency', display_id: 20012 },
  { id: 'a2', name: 'Official Bulldozer', display_id: 200212 },
  { id: 'a3', name: 'Shree Shyam', display_id: 20013 },
]

test('the agency filter finds an agency by its public Agency ID, by its name, and by the "ID | name" text', () => {
  const opts = agencies.map(agencyOption)
  assert.deepEqual(opts.map((o) => o.label), ['20012 | India_Agency', '200212 | Official Bulldozer', '20013 | Shree Shyam'])
  assert.deepEqual(pickerHits(opts, '20013'), ['Shree Shyam'])                          // the whole ID
  assert.deepEqual(pickerHits(opts, '200212'), ['Official Bulldozer'])
  assert.deepEqual(pickerHits(opts, '20012'), ['India_Agency'])                         // 200212 does not contain 20012
  assert.deepEqual(pickerHits(opts, '2001'), ['India_Agency', 'Shree Shyam'])           // part of an ID
  assert.deepEqual(pickerHits(opts, 'bulldozer'), ['Official Bulldozer'])               // the name, any case
  assert.deepEqual(pickerHits(opts, '20012 | ind'), ['India_Agency'])                   // the label as shown
  assert.deepEqual(pickerHits(opts, '  20013  '), ['Shree Shyam'])                      // stray spaces
  assert.deepEqual(pickerHits(opts, 'zzz'), [])
})

test('an agency without an ID still has a label and can be found by name', () => {
  assert.equal(agencyLabel(null, 'Plain'), 'Plain')
  const o = agencyOption({ id: 'x', name: 'Plain', display_id: null })
  assert.equal(o.label, 'Plain')
  assert.ok(o.search.includes('plain'))
})

test('from the database record to the table search: a host row is found by the Agency ID, the "ID | name" text and the agency name', () => {
  const row = mapReportRow({
    host_id: 'h1', host_display_id: 100718, host_name: 'Khushboo Sharma', host_username: 'khush_01',
    agency_id: 'a1', agency_name: 'India_Agency', agency_code: 20012, period: 'Oct 2026',
    diamonds_earned: '5000', diamonds_rewards: '3000', live_hours: '18.0', live_days: 12, withdrawn_diamonds: 0, available_diamonds: 8000,
    slab_id: null, slab_name: null, payment_usd: null, payslip_id: null, payslip_status: null, blocked_reason: null,
    sub_admin_name: 'Sub X', sub_admin_display_id: 100301, country_admin_name: 'Country Y', country_admin_display_id: 100211,
    global_admin_name: null, global_admin_display_id: null,
  })
  assert.equal(row.agencyCode, 20012)
  assert.equal(row.agencyLabel, '20012 | India_Agency')
  assert.equal(row.totalDiamonds, 8000)
  for (const q of ['20012', '2001', '20012 | india', 'india_agency', 'khush_01', '100718', 'country y']) assert.ok(tableHit(row, q), `should find "${q}"`)
  assert.ok(!tableHit(row, '99999'))
})

test('a record whose agency has no ID yet gives a clean row (no "null" text)', () => {
  const row = mapReportRow({ host_id: 'h2', host_name: 'X', agency_name: 'Solo', agency_code: null, diamonds_earned: 0, live_hours: 0, live_days: 0, withdrawn_diamonds: 0, available_diamonds: 0 })
  assert.equal(row.agencyCode, null)
  assert.equal(row.agencyLabel, 'Solo')
  assert.ok(!tableHit(row, 'null'))
})

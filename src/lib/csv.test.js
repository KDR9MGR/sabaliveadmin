import test from 'node:test'
import assert from 'node:assert/strict'
import { toCsv } from './csv.js'

const cols = [{ header: 'Name', value: (r) => r.name }, { header: 'Diamonds', value: (r) => r.d }, { header: 'Note', value: (r) => r.note }]

test('plain rows, header first, CRLF between lines', () => {
  assert.equal(toCsv(cols, [{ name: 'Rupa', d: 1500, note: '' }]), 'Name,Diamonds,Note\r\nRupa,1500,')
})

test('commas, quotes and newlines are quoted and escaped', () => {
  const out = toCsv(cols, [{ name: 'Singh, "Raja"', d: 1, note: 'two\nlines' }])
  assert.equal(out, 'Name,Diamonds,Note\r\n"Singh, ""Raja""",1,"two\nlines"')
})

test('a text cell that could run as a spreadsheet formula is defused; numbers and emoji names are untouched', () => {
  const out = toCsv(cols, [{ name: '=HYPERLINK("x")', d: -5, note: '+91 98' }, { name: '🔱 Mukesh ji', d: 0, note: null }])
  const lines = out.split('\r\n')
  assert.equal(lines[1], `"'=HYPERLINK(""x"")",-5,'+91 98`)
  assert.equal(lines[2], '🔱 Mukesh ji,0,')
})

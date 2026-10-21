import test from 'node:test'
import assert from 'node:assert/strict'
import { crc32, zipStore, toXlsx, sheetName } from './xlsx.js'

/* a tiny ZIP reader for the tests: returns { name: text } and checks every CRC and size on the way */
function readZip(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength)
  const eocd = u8.length - 22
  assert.equal(dv.getUint32(eocd, true), 0x06054b50, 'end-of-central-directory signature')
  const count = dv.getUint16(eocd + 10, true)
  let p = dv.getUint32(eocd + 16, true)
  const out = {}
  for (let i = 0; i < count; i++) {
    assert.equal(dv.getUint32(p, true), 0x02014b50, 'central directory signature')
    const crc = dv.getUint32(p + 16, true)
    const size = dv.getUint32(p + 24, true)
    const nameLen = dv.getUint16(p + 28, true)
    const localAt = dv.getUint32(p + 42, true)
    const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nameLen))
    assert.equal(dv.getUint32(localAt, true), 0x04034b50, 'local header signature')
    const lnLen = dv.getUint16(localAt + 26, true)
    const data = u8.subarray(localAt + 30 + lnLen, localAt + 30 + lnLen + size)
    assert.equal(crc32(data), crc, `crc of ${name}`)
    out[name] = new TextDecoder().decode(data)
    p += 46 + nameLen
  }
  return out
}

test('crc32 matches the standard check value', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926)
})

test('zipStore writes a readable ZIP with the right CRCs, in order, with UTF-8 names', () => {
  const files = readZip(zipStore([{ name: 'a.txt', text: 'hello' }, { name: 'dir/ü.txt', text: '🔱 Mukesh ji' }]))
  assert.deepEqual(Object.keys(files), ['a.txt', 'dir/ü.txt'])
  assert.equal(files['dir/ü.txt'], '🔱 Mukesh ji')
})

const cols = [
  { header: 'Name', value: (r) => r.name },
  { header: 'Diamonds', value: (r) => r.d, type: 'int' },
  { header: 'Payment (USD)', value: (r) => r.p, type: 'usd' },
]

test('an xlsx has the parts Excel needs, numbers as numbers and text as text', () => {
  const f = readZip(toXlsx(cols, [{ name: 'Rupa & <Co>', d: 1500, p: 25.5 }, { name: '=SUM(A1)', d: 0, p: null }], 'Salary: Oct/2026'))
  assert.deepEqual(Object.keys(f).sort(), ['[Content_Types].xml', '_rels/.rels', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml'])
  const sheet = f['xl/worksheets/sheet1.xml']
  assert.match(sheet, /<c r="A1" t="inlineStr" s="1"><is><t xml:space="preserve">Name<\/t>/)         // bold header
  assert.match(sheet, /<c r="B2" s="3"><v>1500<\/v><\/c>/)                                          // a whole number, thousands format
  assert.match(sheet, /<c r="C2" s="2"><v>25.5<\/v><\/c>/)                                          // dollars
  assert.match(sheet, /Rupa &amp; &lt;Co&gt;/)                                                       // escaped
  assert.match(sheet, /<c r="A3" t="inlineStr"><is><t xml:space="preserve">=SUM\(A1\)<\/t>/)        // text, never a formula
  assert.ok(!/<f>/.test(sheet), 'no formula cells')
  assert.ok(!/r="C3"/.test(sheet), 'an empty value writes no cell')
  assert.match(f['xl/workbook.xml'], /<sheet name="Salary  Oct 2026"/)                              // the : and / are not allowed in a sheet name
  assert.match(f['xl/styles.xml'], /&quot;\$&quot;#,##0\.00/)                                        // the dollar format
})

test('characters XML cannot hold are dropped, emoji and Hindi survive', () => {
  const sheet = readZip(toXlsx([{ header: 'Name', value: (r) => r }], ['a\u0001b', '🔱 Mukesh ji', 'रानी']))['xl/worksheets/sheet1.xml']
  assert.match(sheet, />ab</)
  assert.match(sheet, /🔱 Mukesh ji/)
  assert.match(sheet, /रानी/)
})

test('a sheet name is cut to 31 characters and loses the forbidden ones', () => {
  assert.equal(sheetName('a'.repeat(40)).length, 31)
  assert.equal(sheetName('[x]:y*z?'), 'x  y z')
  assert.equal(sheetName(''), 'Report')
})

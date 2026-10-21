/* A tiny Excel (.xlsx) writer with no dependencies: one sheet, a bold frozen header row, numbers as numbers, text as text, and optional
   dollar / whole-number formats. An .xlsx is a ZIP of a few XML files; the ZIP here stores them uncompressed (valid, and plenty small for a report).
   columns: [{ header, value: (row) => cell, type?: 'usd' | 'int' }]. Text is always written as a string cell, never a formula, so a name that starts
   with = + - @ is shown as text. Opens in Excel, Numbers and Google Sheets. */
const enc = new TextEncoder()

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
export function crc32(u8) {
  let c = 0xffffffff
  for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/* files: [{ name, text }] -> Uint8Array of a ZIP (method 0 = stored, UTF-8 names) */
export function zipStore(files) {
  const parts = []
  const central = []
  let offset = 0
  const u16 = (v) => [v & 0xff, (v >>> 8) & 0xff]
  const u32 = (v) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]
  for (const f of files) {
    const name = enc.encode(f.name)
    const data = enc.encode(f.text)
    const crc = crc32(data)
    const local = Uint8Array.from([
      ...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x0021),
      ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0),
    ])
    parts.push(local, name, data)
    central.push(Uint8Array.from([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x0021),
      ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(offset),
    ]), name)
    offset += local.length + name.length + data.length
  }
  const cdSize = central.reduce((n, p) => n + p.length, 0)
  const end = Uint8Array.from([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0)])
  const all = [...parts, ...central, end]
  const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0))
  let pos = 0
  for (const p of all) { out.set(p, pos); pos += p.length }
  return out
}

/* XML text: escape the five special characters, drop characters XML 1.0 cannot hold, repair lone surrogates */
const xml = (v) => {
  let s = String(v)
  if (typeof s.toWellFormed === 'function') s = s.toWellFormed()
  return s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
const colName = (i) => {
  let s = ''
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s
  return s
}
const STYLE = { usd: 2, int: 3 } // 0 = normal, 1 = bold header

function sheetXml(columns, rows) {
  const widths = columns.map((c) => Math.max(10, Math.min(40, String(c.header).length + 2)))
  rows.forEach((r) => columns.forEach((c, i) => {
    const v = c.value(r)
    if (v != null && typeof v !== 'number') widths[i] = Math.max(widths[i], Math.min(40, String(v).length + 2))
  }))
  const cellXml = (ref, v, style) => {
    if (v == null || v === '') return ''
    if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"${style ? ` s="${style}"` : ''}><v>${v}</v></c>`
    return `<c r="${ref}" t="inlineStr"${style ? ` s="${style}"` : ''}><is><t xml:space="preserve">${xml(v)}</t></is></c>`
  }
  const head = `<row r="1">${columns.map((c, i) => cellXml(`${colName(i)}1`, String(c.header), 1) || `<c r="${colName(i)}1" t="inlineStr" s="1"><is><t></t></is></c>`).join('')}</row>`
  const body = rows.map((r, ri) => `<row r="${ri + 2}">${columns.map((c, i) => cellXml(`${colName(i)}${ri + 2}`, c.value(r), STYLE[c.type] || 0)).join('')}</row>`).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${head}${body}</sheetData></worksheet>`
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>`

/* Excel limits a sheet name to 31 characters and forbids : \ / ? * [ ] */
export const sheetName = (s) => (String(s || 'Report').replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31) || 'Report')

export function toXlsx(columns, rows, name = 'Report') {
  return zipStore([
    { name: '[Content_Types].xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>` },
    { name: '_rels/.rels', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(sheetName(name))}" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: 'xl/styles.xml', text: STYLES },
    { name: 'xl/worksheets/sheet1.xml', text: sheetXml(columns, rows) },
  ])
}

/* Turns rows into CSV text (lib/export.js downloads it, next to the Excel version). Nothing is sent anywhere.
   columns: [{ header: 'Name', value: (row) => row.name }]. The download adds a UTF-8 BOM so Excel shows ₹ and non-English names correctly, and a text cell
   that starts with = + - @ is prefixed with ' so a spreadsheet can never run it as a formula (numbers are left alone). */
const cell = (v) => {
  if (v == null) return ''
  let s = typeof v === 'number' ? String(v) : String(v)
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(columns, rows) {
  const head = columns.map((c) => cell(c.header)).join(',')
  const body = rows.map((r) => columns.map((c) => cell(c.value(r))).join(','))
  return [head, ...body].join('\r\n')
}

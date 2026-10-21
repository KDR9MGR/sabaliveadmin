/* Turns rows into a CSV file and downloads it in the browser. Nothing is sent anywhere.
   columns: [{ header: 'Name', value: (row) => row.name }]. A UTF-8 BOM is added so Excel shows ₹ and non-English names correctly, and a text cell
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

export function downloadCsv(filename, columns, rows) {
  const blob = new Blob(['﻿' + toCsv(columns, rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

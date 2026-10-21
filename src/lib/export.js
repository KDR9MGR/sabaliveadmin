import { toCsv } from './csv.js'
import { toXlsx } from './xlsx.js'

/* The two download formats every report offers. */
export const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel' },
]

const save = (filename, blob) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* Downloads `rows` as a CSV or an Excel file. baseName has no extension ("salary-report-2026-10"). Nothing leaves the browser.
   columns: [{ header, value: (row) => cell, type?: 'usd' | 'int' }] (type only matters for Excel). */
export function exportRows(format, baseName, columns, rows, sheet = 'Report') {
  if (format === 'xlsx') {
    save(`${baseName}.xlsx`, new Blob([toXlsx(columns, rows, sheet)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  } else {
    save(`${baseName}.csv`, new Blob(['﻿' + toCsv(columns, rows)], { type: 'text/csv;charset=utf-8' }))
  }
}

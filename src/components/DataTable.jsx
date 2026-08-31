import { useMemo, useState } from 'react'
import Icon from './Icon.jsx'
import { Tabs, RowMenu, EmptyState, Button } from './ui.jsx'

export default function DataTable({
  columns,
  rows,
  searchKeys,
  searchPlaceholder = 'Search…',
  pageSize = 8,
  tabs,                 // [{label,value,filter:(row)=>bool, count?}]
  toolbarRight,         // extra JSX on the right of the toolbar
  filters,             // [{label, options:[...], get:(row)=>value}]
  rowActions,           // (row) => [{label,icon,onClick}]
  onRowClick,
  emptyText = 'Try adjusting your search or filters.',
}) {
  const [q, setQ] = useState('')
  const [tab, setTab] = useState(tabs?.[0]?.value)
  const [sort, setSort] = useState(null) // {key, dir}
  const [page, setPage] = useState(1)
  const [filterVals, setFilterVals] = useState({})

  const activeTab = tabs?.find((t) => t.value === tab)

  const filtered = useMemo(() => {
    let out = rows
    if (activeTab?.filter) out = out.filter(activeTab.filter)
    if (q && searchKeys) {
      const s = q.toLowerCase()
      out = out.filter((r) => searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(s)))
    }
    for (const f of filters || []) {
      const v = filterVals[f.label]
      if (v && v !== 'All') out = out.filter((r) => String(f.get(r)) === String(v))
    }
    if (sort) {
      const { key, dir } = sort
      out = [...out].sort((a, b) => {
        const av = a[key], bv = b[key]
        const num = typeof av === 'number' && typeof bv === 'number'
        const cmp = num ? av - bv : String(av).localeCompare(String(bv))
        return dir === 'asc' ? cmp : -cmp
      })
    }
    return out
  }, [rows, q, activeTab, sort, filters, filterVals, searchKeys])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const cur = Math.min(page, pageCount)
  const slice = filtered.slice((cur - 1) * pageSize, cur * pageSize)

  const toggleSort = (key) =>
    setSort((s) => (!s || s.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null))

  const pages = pageRange(cur, pageCount)

  return (
    <div className="card">
      {tabs && (
        <Tabs
          tabs={tabs.map((t) => ({ ...t, count: t.count ?? rows.filter(t.filter || (() => true)).length }))}
          value={tab}
          onChange={(v) => { setTab(v); setPage(1) }}
        />
      )}
      <div className="toolbar">
        {searchKeys && (
          <div className="search-input">
            <Icon name="search" />
            <input value={q} placeholder={searchPlaceholder} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
          </div>
        )}
        {(filters || []).map((f) => (
          <select
            key={f.label}
            className="select"
            style={{ width: 'auto', minWidth: 150, height: 38 }}
            value={filterVals[f.label] || 'All'}
            onChange={(e) => { setFilterVals((v) => ({ ...v, [f.label]: e.target.value })); setPage(1) }}
          >
            <option value="All">{f.label}: All</option>
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <div className="grow" />
        {toolbarRight}
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width, textAlign: c.align }}
                  className={c.sortable ? 'sortable' : ''}
                  onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                >
                  {c.header}
                  {c.sortable && (
                    <span className="sort-ind">
                      {sort?.key === c.key ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  )}
                </th>
              ))}
              {rowActions && <th style={{ width: 56 }} />}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr
                key={row.id ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} style={{ textAlign: c.align }} className={c.className}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
                {rowActions && (
                  <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                    <RowMenu items={rowActions(row)} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState title="No results" text={emptyText} />}
      </div>

      {filtered.length > 0 && (
        <div className="card__foot">
          <div className="pagination">
            <span className="pagination__info">
              Showing {(cur - 1) * pageSize + 1}–{Math.min(cur * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="pager">
              <button disabled={cur === 1} onClick={() => setPage(cur - 1)}><Icon name="chevronLeft" size={14} /></button>
              {pages.map((p, i) =>
                p === '…' ? <button key={i} disabled>…</button> : (
                  <button key={i} className={p === cur ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                )
              )}
              <button disabled={cur === pageCount} onClick={() => setPage(cur + 1)}><Icon name="chevronRight" size={14} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function pageRange(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out = [1]
  const s = Math.max(2, cur - 1)
  const e = Math.min(total - 1, cur + 1)
  if (s > 2) out.push('…')
  for (let i = s; i <= e; i++) out.push(i)
  if (e < total - 1) out.push('…')
  out.push(total)
  return out
}

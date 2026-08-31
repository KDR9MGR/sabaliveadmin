import { Person, StatusBadge, Tag } from './ui.jsx'
import { num } from '../data/util.js'

export const personCol = (nameKey = 'name', metaKey) => ({
  key: nameKey,
  header: 'Name',
  sortable: true,
  render: (r) => <Person name={r[nameKey]} meta={metaKey ? r[metaKey] : undefined} size="sm" />,
})

export const statusCol = (key = 'status', header = 'Status') => ({
  key, header, sortable: true, render: (r) => <StatusBadge value={r[key]} />,
})

export const roleCol = (key = 'role') => ({
  key, header: 'Role', sortable: true, render: (r) => <Tag role>{r[key]}</Tag>,
})

export const numCol = (key, header, opts = {}) => ({
  key, header, sortable: true, align: 'right',
  render: (r) => <span className="mono">{opts.prefix || ''}{num(r[key])}{opts.suffix || ''}</span>,
})

export const textCol = (key, header, opts = {}) => ({ key, header, sortable: opts.sortable ?? true, ...opts })

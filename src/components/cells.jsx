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
  // null = "not visible to you" (e.g. a wallet your role can't read), shown as a dash, never a false 0
  render: (r) => (r[key] == null
    ? <span className="muted" title="Not visible to your role">—</span>
    : <span className="mono">{opts.prefix || ''}{num(r[key])}{opts.suffix || ''}</span>),
})

/* Profile picture, as in the reference lists. */
export const imageCol = (key = 'avatar', header = 'Image') => ({
  key, header, sortable: false,
  render: (r) => (r[key]
    ? <img src={r[key]} alt="" width={40} height={40} style={{ borderRadius: 8, objectFit: 'cover' }} />
    : <span className="muted">—</span>),
})

export const emailCol = (key = 'email', header = 'Email') => ({
  key, header, sortable: true,
  render: (r) => (r[key] ? r[key] : <span className="muted">—</span>),
})

export const textCol = (key, header, opts = {}) => ({ key, header, sortable: opts.sortable ?? true, ...opts })

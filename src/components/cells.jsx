import { Person, StatusBadge, Tag } from './ui.jsx'
import { usd } from '../lib/money.js'
import { num } from '../data/util.js'
import { NOT_ASSIGNED } from '../lib/salaryColumns.js'

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

/* A dollar amount ("$1,250.00"); a missing value is a dash */
export const moneyCol = (key, header) => ({
  key, header, sortable: true, align: 'right',
  render: (r) => (r[key] == null ? <span className="muted">—</span> : <span className="mono">{usd(r[key])}</span>),
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

/* An admin above an agency (Sub / Country / Global Admin): their name and their app User ID, or "Not assigned" when the system has not recorded one. */
export const adminCol = (nameKey, idKey, header) => ({
  key: nameKey, header, sortable: true,
  render: (r) => (r[nameKey]
    ? <span>{r[nameKey]}{r[idKey] !== '' && r[idKey] != null && <span className="mono muted"> · {r[idKey]}</span>}</span>
    : <span className="muted">{NOT_ASSIGNED}</span>),
})

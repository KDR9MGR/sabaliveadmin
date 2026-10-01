import { useEffect, useRef, useState } from 'react'

/* Type-to-search user picker — filters `options` (each { value, label, search })
   by name, username or ID as you type. Click a match to select; click the
   field again to search and change it. */
export default function UserPicker({ options, value, onChange, placeholder = 'Search by name, username or ID…' }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  const q = query.trim().toLowerCase()
  const filtered = q ? options.filter((o) => o.search.includes(q)) : options

  return (
    <div className="pos-rel" ref={ref}>
      <input
        className="input"
        placeholder={placeholder}
        value={open ? query : (selected ? selected.label : '')}
        onFocus={() => { setOpen(true); setQuery('') }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
      />
      {open && (
        <div className="menu-pop" style={{ left: 0, right: 'auto', width: '100%', maxHeight: 260, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-muted)' }}>No matches</div>
          )}
          {filtered.slice(0, 50).map((o) => (
            <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); setQuery('') }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* Multi-select variant — pick any number of specific users by name, username
   or ID, shown as removable chips above the same search field. Used where a
   flow needs a hand-picked set of recipients rather than one, or "everyone". */
export function MultiUserPicker({ options, values, onChange, placeholder = 'Search by name, username or ID…' }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const picked = options.filter((o) => values.includes(o.value))

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  const q = query.trim().toLowerCase()
  const available = options.filter((o) => !values.includes(o.value))
  const filtered = q ? available.filter((o) => o.search.includes(q)) : available

  const add = (v) => { onChange([...values, v]); setQuery(''); setOpen(false) }
  const remove = (v) => onChange(values.filter((x) => x !== v))

  return (
    <div className="pos-rel" ref={ref}>
      {picked.length > 0 && (
        <div className="hstack wrap" style={{ gap: 6, marginBottom: 8 }}>
          {picked.map((o) => (
            <span key={o.value} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {o.label}
              <button type="button" onClick={() => remove(o.value)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
      )}
      <input
        className="input"
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
      />
      {open && (
        <div className="menu-pop" style={{ left: 0, right: 'auto', width: '100%', maxHeight: 260, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-muted)' }}>No matches</div>
          )}
          {filtered.slice(0, 50).map((o) => (
            <button key={o.value} type="button" onClick={() => add(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

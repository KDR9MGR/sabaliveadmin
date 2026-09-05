import { useEffect, useRef, useState, createContext, useContext, useCallback, Fragment } from 'react'
import Icon from './Icon.jsx'
import { initials } from '../data/util.js'

/* -------------------------------------------------- Avatar / Person */
const AV_COLORS = ['#7c3aed', '#3b82f6', '#22a06b', '#f59e0b', '#ec4899', '#ef4444', '#06b6d4', '#8b5cf6']
export function Avatar({ name = '?', src, size }) {
  const cls = size === 'sm' ? 'avatar avatar--sm' : size === 'lg' ? 'avatar avatar--lg' : size === 'xl' ? 'avatar avatar--xl' : 'avatar'
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  const bg = AV_COLORS[hash % AV_COLORS.length]
  return (
    <span className={cls} style={{ background: src ? undefined : `linear-gradient(135deg, ${bg}, ${bg}cc)` }}>
      {src ? <img src={src} alt={name} /> : initials(name)}
    </span>
  )
}
export function Person({ name, meta, src, size }) {
  return (
    <div className="person">
      <Avatar name={name} src={src} size={size} />
      <div>
        <div className="person__name">{name}</div>
        {meta && <div className="person__meta">{meta}</div>}
      </div>
    </div>
  )
}

/* -------------------------------------------------- Badge / status */
const STATUS_MAP = {
  active: 'success', live: 'success', operational: 'success', verified: 'success', paid: 'success',
  success: 'success', completed: 'success', approved: 'success', connected: 'success', published: 'success',
  enabled: 'success', 'on track': 'success', 'renew soon': 'warning',
  inactive: 'muted', draft: 'muted', disabled: 'muted', expired: 'muted', 'not submitted': 'muted',
  disconnected: 'muted', reversed: 'muted',
  pending: 'warning', processing: 'warning', 'under review': 'warning', scheduled: 'info', 'on hold': 'warning',
  degraded: 'warning', warning: 'warning', behind: 'warning', test: 'warning',
  suspended: 'danger', banned: 'danger', rejected: 'danger', failed: 'danger', critical: 'danger',
  exceeded: 'info', info: 'info', sent: 'info', 'renew soon ': 'warning',
}
export function StatusBadge({ value }) {
  const v = STATUS_MAP[String(value).toLowerCase()] || 'muted'
  return <span className={`badge badge--${v}`}>{value}</span>
}
export function Badge({ children, tone = 'muted', plain }) {
  return <span className={`badge badge--${tone}${plain ? ' badge--plain' : ''}`}>{children}</span>
}
export function Tag({ children, role }) {
  return <span className={`tag${role ? ' tag--role' : ''}`}>{children}</span>
}

/* -------------------------------------------------- Button */
export function Button({ variant = 'ghost', size, icon, iconRight, children, ...rest }) {
  return (
    <button className={`btn btn--${variant}${size === 'sm' ? ' btn--sm' : ''}${!children ? ' btn--icon' : ''}`} {...rest}>
      {icon && <Icon name={icon} size={16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={16} />}
    </button>
  )
}

/* -------------------------------------------------- Card */
export function Card({ title, sub, action, children, flush, foot, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="card__head">
          <div>
            {title && <h3>{title}</h3>}
            {sub && <div className="sub">{sub}</div>}
          </div>
          {action}
        </div>
      )}
      <div className={`card__body${flush ? ' flush' : ''}`}>{children}</div>
      {foot && <div className="card__foot">{foot}</div>}
    </section>
  )
}

/* -------------------------------------------------- PageHeader */
export function PageHeader({ title, crumbs = [], actions }) {
  return (
    <div className="page-head spread wrap">
      <div>
        <h1>{title}</h1>
        {crumbs.length > 0 && (
          <div className="breadcrumbs">
            {crumbs.map((c, i) => (
              <span key={i} className="hstack" style={{ gap: 7 }}>
                {i > 0 && <Icon name="chevronRight" size={12} className="sep" />}
                <span className={i === crumbs.length - 1 ? 'crumb-current' : ''}>{c}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      {actions && <div className="hstack wrap">{actions}</div>}
    </div>
  )
}

/* -------------------------------------------------- Tabs */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t.value} className={value === t.value ? 'active' : ''} onClick={() => onChange(t.value)}>
          {t.label}
          {t.count != null && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}
export function PillTabs({ tabs, value, onChange }) {
  return (
    <div className="pill-tabs">
      {tabs.map((t) => (
        <button key={t.value ?? t} className={value === (t.value ?? t) ? 'active' : ''} onClick={() => onChange(t.value ?? t)}>
          {t.label ?? t}
        </button>
      ))}
    </div>
  )
}

/* -------------------------------------------------- EmptyState */
export function EmptyState({ icon = 'search', title = 'Nothing here yet', text }) {
  return (
    <div className="empty">
      <div className="empty__ico"><Icon name={icon} size={26} /></div>
      <h4>{title}</h4>
      {text && <p>{text}</p>}
    </div>
  )
}

/* -------------------------------------------------- Overlay (Drawer / Modal) */
export function Overlay({ onClose, children }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      {children}
    </div>
  )
}
export function Drawer({ title, onClose, children, footer }) {
  return (
    <Overlay onClose={onClose}>
      <div className="drawer" role="dialog" aria-modal="true">
        <div className="drawer__head">
          <h3>{title}</h3>
          <button className="x-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
        </div>
        <div className="drawer__body">{children}</div>
        {footer && <div className="drawer__foot">{footer}</div>}
      </div>
    </Overlay>
  )
}
export function Modal({ title, onClose, children, footer }) {
  return (
    <Overlay onClose={onClose}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal__head">
          <h3>{title}</h3>
          <button className="x-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </Overlay>
  )
}

/* -------------------------------------------------- Confirm dialog */
export function ConfirmDialog({ title = 'Are you sure?', message, confirmLabel = 'Confirm', danger, busy, onConfirm, onClose }) {
  return (
    <Modal
      title={title}
      onClose={busy ? () => {} : onClose}
      footer={<>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} icon={busy ? 'refresh' : (danger ? 'trash' : 'check')} disabled={busy} onClick={onConfirm}>
          {busy ? 'Working…' : confirmLabel}
        </Button>
      </>}
    >
      <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>{message}</p>
    </Modal>
  )
}

/* -------------------------------------------------- Row action menu */
export function RowMenu({ items = [] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [])
  return (
    <span className="pos-rel" ref={ref}>
      <button className="row-menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Row actions">
        <Icon name="more" size={18} />
      </button>
      {open && (
        <div className="menu-pop">
          {items.map((it, i) =>
            it.sep ? <div key={i} className="menu-sep" /> : (
              <button key={i} onClick={() => { setOpen(false); it.onClick?.() }}>
                {it.icon && <Icon name={it.icon} size={15} />}{it.label}
              </button>
            )
          )}
        </div>
      )}
    </span>
  )
}

/* -------------------------------------------------- Toast */
const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((msg) => {
    const id = Math.random().toString(36).slice(2)
    setItems((s) => [...s, { id, msg }])
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 2600)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-wrap">
        {items.map((t) => (
          <div className="toast" key={t.id}><Icon name="checkCircle" size={16} />{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/* -------------------------------------------------- KV list */
export function KV({ rows }) {
  return (
    <dl className="kv">
      {rows.map(([k, v]) => (<Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>))}
    </dl>
  )
}

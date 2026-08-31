import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon.jsx'
import { PANELS } from '../../config/nav.js'

const CURRENT_USER = { name: 'Mehardeep', role: 'Super Admin' }

export default function Topbar({ panel, onToggleSidebar }) {
  const nav = useNavigate()
  return (
    <header className="topbar">
      <button className="icon-btn" onClick={onToggleSidebar} aria-label="Toggle menu">
        <Icon name="menu" size={18} />
      </button>

      <div className="topbar__search hide-sm">
        <Icon name="search" size={16} />
        <input placeholder="Search users, hosts, agencies…" />
      </div>

      <div className="topbar__spacer" />

      <PanelMenu panel={panel} />

      <button className="icon-btn" aria-label="Notifications">
        <Icon name="bell" size={18} />
        <span className="dot">5</span>
      </button>

      <UserMenu panel={panel} onNav={nav} />
    </header>
  )
}

function useOutside(ref, cb) {
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && cb()
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [ref, cb])
}

function PanelMenu({ panel }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const nav = useNavigate()
  useOutside(ref, () => setOpen(false))
  const cur = PANELS[panel]
  return (
    <div className="pos-rel hide-sm" ref={ref}>
      <button className="panel-switch" onClick={() => setOpen((o) => !o)} style={{ borderColor: cur.color, color: cur.color }}>
        <span className="panel-switch__dot" style={{ background: cur.color }} />
        {cur.label}
        <Icon name="chevronDown" size={14} />
      </button>
      {open && (
        <div className="menu-pop" style={{ minWidth: 264 }}>
          <div className="menu-label">Switch panel</div>
          {Object.values(PANELS).map((p) => (
            <button key={p.key} onClick={() => { setOpen(false); nav(p.base) }}>
              <span className="panel-switch__dot" style={{ background: p.color }} />
              <span>
                {p.label}
                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>{p.scope}</span>
              </span>
              {p.key === panel && <Icon name="check" size={15} style={{ marginLeft: 'auto', color: p.color, flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function UserMenu({ panel, onNav }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useOutside(ref, () => setOpen(false))
  return (
    <div className="pos-rel" ref={ref}>
      <button className="userchip" onClick={() => setOpen((o) => !o)}>
        <span className="avatar avatar--sm">M</span>
        <span className="hide-sm">
          <span className="userchip__name" style={{ display: 'block' }}>{CURRENT_USER.name}</span>
          <span className="userchip__role">{CURRENT_USER.role}</span>
        </span>
        <Icon name="chevronDown" size={14} />
      </button>
      {open && (
        <div className="menu-pop">
          <button onClick={() => { setOpen(false); onNav(`/${panel === 'master' ? 'admin' : panel}/profile`) }}>
            <Icon name="user" size={15} /> My Profile
          </button>
          <button onClick={() => { setOpen(false); onNav(`/${panel === 'master' ? 'admin' : panel}/config`) }}>
            <Icon name="settings" size={15} /> Settings
          </button>
          <div className="menu-sep" />
          <button onClick={() => { setOpen(false); onNav('/login') }}>
            <Icon name="logout" size={15} /> Log out
          </button>
        </div>
      )}
    </div>
  )
}

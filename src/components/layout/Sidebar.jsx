import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Icon from '../Icon.jsx'
import { NAV, PANELS } from '../../config/nav.js'
import { useSettings } from '../../config/settings.jsx'
import { useAuth } from '../../lib/auth.jsx'

export default function Sidebar({ panel, onNavigate }) {
  const groups = NAV[panel]
  const { pathname } = useLocation()
  const p = PANELS[panel]
  const { settings } = useSettings()
  const { can } = useAuth()

  const visible = (item) => !item.cap || can(item.cap)

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img src="/favicon.svg" alt="" />
        <b>{settings.appName}</b>
      </div>
      <div className="sidebar__panel-tag" title={p.scope}>
        <Icon name={p.icon} size={13} />
        {p.label}
      </div>
      <nav className="sidebar__scroll">
        {groups.map((g) => {
          const items = g.items.filter(visible)
          if (!items.length) return null
          return (
            <div className="nav-group" key={g.section}>
              <div className="nav-group__label">{g.section}</div>
              {items.map((item) =>
                item.children ? (
                  <NavParent key={item.label} item={item} pathname={pathname} onNavigate={onNavigate} />
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === p.base}
                    className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                    onClick={onNavigate}
                  >
                    <Icon name={item.icon} className="nav-ico" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

function NavParent({ item, pathname, onNavigate }) {
  const hasActive = item.children.some((c) => pathname === c.to || pathname.startsWith(c.to + '/'))
  const [open, setOpen] = useState(hasActive)
  return (
    <>
      <div className={'nav-link' + (hasActive ? ' active' : '')} onClick={() => setOpen((o) => !o)}>
        <Icon name={item.icon} className="nav-ico" />
        <span>{item.label}</span>
        <Icon name="chevronRight" size={14} className={'nav-caret' + (open ? ' open' : '')} />
      </div>
      {open && (
        <div className="nav-sub">
          {item.children.map((c) => (
            <NavLink
              key={c.to}
              to={c.to}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              onClick={onNavigate}
            >
              <span>{c.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </>
  )
}

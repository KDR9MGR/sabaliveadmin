import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Icon from '../Icon.jsx'
import { NAV, PANELS } from '../../config/nav.js'
import { useSettings } from '../../config/settings.jsx'
import { useAuth } from '../../lib/auth.jsx'
import { grantedMasterNav, grantedLinks } from '../../lib/grantedNav.js'

export default function Sidebar({ panel, onNavigate }) {
  const { pathname } = useLocation()
  const p = PANELS[panel]
  const { settings } = useSettings()
  const { can, staffRole, panel: ownPanel } = useAuth()
  const lower = !!staffRole && staffRole.role !== 'admin' && staffRole.role !== 'super_admin'
  let groups = NAV[panel]
  if (lower && panel === 'master') {
    // a lower-role account browsing the Master pages its grants unlock: just those, plus a way back
    groups = [
      { section: 'Your panel', items: [{ label: `Back to ${PANELS[ownPanel]?.label || 'my panel'}`, icon: 'chevronLeft', to: PANELS[ownPanel]?.base || '/' }] },
      ...grantedMasterNav(staffRole),
    ]
  } else if (lower) {
    const links = grantedLinks(staffRole)
    if (links.length) groups = [...groups, { section: 'Granted access', items: links }]
  }

  const visible = (item) => !item.cap || can(item.cap)

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" />
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

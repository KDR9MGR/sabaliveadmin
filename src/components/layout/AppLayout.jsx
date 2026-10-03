import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import { PANELS } from '../../config/nav.js'
import { useAuth } from '../../lib/auth.jsx'
import { useSystemStatus, useTick } from '../../lib/useSystemStatus.js'
import { isLockedForStaff, adminSessionRevoked, formatCountdown } from '../../lib/maintenance.js'
import MaintenanceLock from '../MaintenanceLock.jsx'
import { Link } from 'react-router-dom'

export default function AppLayout({ panel }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const { staffRole, signOut } = useAuth()
  // quick enough that a lock lifts (and lands) within moments; Realtime does it sooner
  const { status, serverNow } = useSystemStatus({ pollMs: 10000 })
  const role = staffRole?.role

  useEffect(() => { setMobileOpen(false) }, [pathname])
  useEffect(() => { document.querySelector('.content')?.scrollTo(0, 0) }, [pathname])

  const toggle = () => {
    if (window.matchMedia('(max-width: 1024px)').matches) setMobileOpen((o) => !o)
    else setCollapsed((c) => !c)
  }

  // "Logout all admins" moved the version: this session is over.
  useEffect(() => {
    if (status && adminSessionRevoked(status)) signOut()
  }, [status, signOut])

  // Locked out by maintenance / lockdown (panel lock on, or a lockdown): nothing but the lock screen.
  if (isLockedForStaff(status, role)) return <MaintenanceLock role={role} onSignOut={signOut} />

  // Master's identity tracks the live brand colour; Agency & Super keep fixed hues
  const identity = panel === 'master' ? 'var(--primary)' : (PANELS[panel]?.color || 'var(--primary)')

  return (
    <div
      className={`app-shell${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}
      data-panel={panel}
      style={{ '--panel': identity }}
    >
      <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      <Sidebar panel={panel} onNavigate={() => setMobileOpen(false)} />
      <div className="main-col">
        <Topbar panel={panel} onToggleSidebar={toggle} />
        {role === 'super_admin' && status && status.status !== 'online' && (
          <SuperBanner status={status} serverNow={serverNow} />
        )}
        <div className="content">
          <div className="content__inner">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

/* What only the Super Admin sees while the system isn't online: it is on, and for how long. */
function SuperBanner({ status, serverNow }) {
  useTick(true)
  const lockdown = status.status === 'lockdown'
  const upcoming = status.status === 'upcoming'
  const end = status.ends_at ? new Date(status.ends_at).getTime() : null
  const start = status.starts_at ? new Date(status.starts_at).getTime() : null
  const now = serverNow()
  const detail = lockdown
    ? 'Emergency lockdown is ON — everyone but you is locked out'
    : upcoming && start != null
      ? `Maintenance starts in ${formatCountdown(start - now)}`
      : `Maintenance is ON${status.lock_app ? ' — the app is locked' : ''}${end != null ? (now >= end ? ' · past the end time' : ` · ${formatCountdown(end - now)} left`) : ''}`
  return (
    <div style={{ background: lockdown ? '#dc2626' : '#d97706', color: '#fff', padding: '7px 16px', fontSize: 13, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
      <span>{detail}</span>
      <Link to="/super/maintenance" style={{ color: '#fff', textDecoration: 'underline', fontWeight: 600 }}>Manage</Link>
    </div>
  )
}

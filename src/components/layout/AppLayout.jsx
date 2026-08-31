import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

export default function AppLayout({ panel }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => { setMobileOpen(false) }, [pathname])
  useEffect(() => { document.querySelector('.content')?.scrollTo(0, 0) }, [pathname])

  const toggle = () => {
    if (window.matchMedia('(max-width: 1024px)').matches) setMobileOpen((o) => !o)
    else setCollapsed((c) => !c)
  }

  return (
    <div className={`app-shell${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      <Sidebar panel={panel} onNavigate={() => setMobileOpen(false)} />
      <div className="main-col">
        <Topbar panel={panel} onToggleSidebar={toggle} />
        <div className="content">
          <div className="content__inner">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

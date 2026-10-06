import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from '../Icon.jsx'
import { PANELS, DEFAULT_LOGIN_PATH } from '../../config/nav.js'
import { useAuth } from '../../lib/auth.jsx'
import { myBalances, COINS_CHANGED } from '../../lib/balance.js'

const ROLE_LABEL = { super_admin: 'Super Admin', admin: 'Admin', global_admin: 'Global Admin', country_admin: 'Country Admin', sub_admin: 'Sub Admin', agency_manager: 'Agency Manager' }

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

      <CoinBalance />

      <PanelMenu panel={panel} />

      <button className="icon-btn" aria-label="Notifications">
        <Icon name="bell" size={18} />
        <span className="dot">5</span>
      </button>

      <UserMenu panel={panel} onNav={nav} />
    </header>
  )
}

/* This account's coin balance, on every panel. Refreshes when you change page,
   come back to the tab, or move coins. */
function CoinBalance() {
  const { user, staffRole } = useAuth()
  const { pathname } = useLocation()
  const [bal, setBal] = useState(null)
  const role = staffRole?.role

  useEffect(() => {
    if (!user?.id) return undefined
    let alive = true
    const load = () => myBalances(user.id, role).then((b) => { if (alive) setBal(b) }).catch(() => {})
    load()
    window.addEventListener(COINS_CHANGED, load)
    window.addEventListener('focus', load)
    return () => {
      alive = false
      window.removeEventListener(COINS_CHANGED, load)
      window.removeEventListener('focus', load)
    }
  }, [user?.id, role, pathname])

  if (!bal) return null
  const fmt = (n) => Number(n).toLocaleString('en-IN')
  return (
    <>
      {bal.showWallet && (
        <span className="coin-chip" title="Your coin balance">
          <Icon name="coins" size={15} />
          <span className="coin-chip__label hide-sm">Coins</span>
          <b>{fmt(bal.wallet)}</b>
        </span>
      )}
      {bal.treasury != null && (
        <span className="coin-chip coin-chip--treasury hide-sm" title={bal.treasuryIsOwn ? 'Coins you may still generate / distribute (you are on the coin-minter list)' : 'Platform coin treasury — what can still be distributed'}>
          <Icon name="bank" size={15} />
          <span className="coin-chip__label">{bal.treasuryIsOwn ? 'To distribute' : 'Treasury'}</span>
          <b>{fmt(bal.treasury)}</b>
        </span>
      )}
    </>
  )
}

function useOutside(ref, cb) {
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && cb()
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [ref, cb])
}

/* The legacy 'agency-manager' panel is deliberately not offered here. */
const PANELS_FOR = {
  super_admin: ['super', 'master', 'global-admin', 'country-admin', 'sub-admin', 'panel-agency'],
  admin: ['master'],
  global_admin: ['global-admin'],
  country_admin: ['country-admin'],
  sub_admin: ['sub-admin'],
  agency_manager: ['panel-agency'],
}

function PanelMenu({ panel }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const nav = useNavigate()
  const { staffRole, panel: ownPanel } = useAuth()
  useOutside(ref, () => setOpen(false))
  const cur = PANELS[panel]
  // a lower-role account looking at a Master page its grant opens: offer the way back, not a "Master" label
  if ((panel === 'master' || panel === 'super') && staffRole && staffRole.role !== 'admin' && staffRole.role !== 'super_admin' && PANELS[ownPanel]) {
    const own = PANELS[ownPanel]
    return (
      <button className="panel-switch" onClick={() => nav(own.base)} style={{ borderColor: own.color, color: own.color }} title="Back to your panel">
        <Icon name="chevronLeft" size={14} />
        <span className="hide-sm">{own.label}</span>
      </button>
    )
  }
  const allowed = PANELS_FOR[staffRole?.role] || [panel]
  const canSwitch = allowed.length > 1

  if (!canSwitch) {
    return (
      <span className="panel-switch" style={{ borderColor: cur.color, color: cur.color, cursor: 'default' }} title={cur.scope}>
        <span className="panel-switch__dot" style={{ background: cur.color }} />
        <span className="hide-sm">{cur.label}</span>
      </span>
    )
  }

  return (
    <div className="pos-rel" ref={ref}>
      <button className="panel-switch" onClick={() => setOpen((o) => !o)} style={{ borderColor: cur.color, color: cur.color }}>
        <span className="panel-switch__dot" style={{ background: cur.color }} />
        <span className="hide-sm">{cur.label}</span>
        <Icon name="chevronDown" size={14} />
      </button>
      {open && (
        <div className="menu-pop" style={{ minWidth: 264 }}>
          <div className="menu-label">Switch panel</div>
          {allowed.map((k) => {
            const p = PANELS[k]
            return (
              <button key={k} onClick={() => { setOpen(false); nav(p.base) }}>
                <span className="panel-switch__dot" style={{ background: p.color }} />
                <span>
                  {p.label}
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>{p.scope}</span>
                </span>
                {k === panel && <Icon name="check" size={15} style={{ marginLeft: 'auto', color: p.color, flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function UserMenu({ panel, onNav }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useOutside(ref, () => setOpen(false))
  const { profile, staffRole, user, signOut, panel: ownPanel } = useAuth()
  // a lower-role account on a granted Master page still has its own profile page in its own panel
  const lowerRole = !!staffRole && staffRole.role !== 'admin' && staffRole.role !== 'super_admin'
  const profilePanel = lowerRole && (panel === 'master' || panel === 'super') && PANELS[ownPanel] ? PANELS[ownPanel].base.replace(/^\//, '') : (panel === 'master' ? 'admin' : panel)
  const name = profile?.name || user?.email || 'Account'
  const roleLabel = staffRole ? ROLE_LABEL[staffRole.role] || staffRole.role : ''

  const logout = async () => {
    setOpen(false)
    await signOut()
    onNav(DEFAULT_LOGIN_PATH)
  }

  return (
    <div className="pos-rel" ref={ref}>
      <button className="userchip" onClick={() => setOpen((o) => !o)}>
        <span className="avatar avatar--sm">{name[0]?.toUpperCase()}</span>
        <span className="hide-sm">
          <span className="userchip__name" style={{ display: 'block' }}>{name}</span>
          <span className="userchip__role">{roleLabel}</span>
        </span>
        <Icon name="chevronDown" size={14} />
      </button>
      {open && (
        <div className="menu-pop">
          <button onClick={() => { setOpen(false); onNav(`/${profilePanel}/profile`) }}>
            <Icon name="user" size={15} /> My Profile
          </button>
          <button onClick={() => { setOpen(false); onNav(`/${panel === 'master' ? 'admin' : panel}/config`) }}>
            <Icon name="settings" size={15} /> Settings
          </button>
          <div className="menu-sep" />
          <button onClick={logout}>
            <Icon name="logout" size={15} /> Log out
          </button>
        </div>
      )}
    </div>
  )
}

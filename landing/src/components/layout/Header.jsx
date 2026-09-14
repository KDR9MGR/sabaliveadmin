import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Container from '../ui/Container.jsx'
import Button from '../ui/Button.jsx'
import { NAV_LINKS, SITE } from '../../lib/site.js'

function MenuIcon({ open }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
    </svg>
  )
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-300 ${
        scrolled || open ? 'bg-bg/90 backdrop-blur-md border-b border-stroke' : 'bg-transparent'
      }`}
    >
      <Container className="flex h-[76px] items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)} aria-label={`${SITE.name} home`}>
          <img src="/logo-600.png" alt={SITE.name} className="h-11 w-auto" width={220} height={149} />
        </Link>

        <nav className="hidden lg:flex items-center gap-8" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              className={({ isActive }) =>
                `text-[14px] font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-ink-secondary hover:text-white'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Button href={SITE.adminUrl} variant="ghost" size="md" className="!px-3">
            Admin login
          </Button>
          <Button to="/#download" variant="primary" size="md">
            Get the app
          </Button>
        </div>

        <button
          className="lg:hidden inline-flex items-center justify-center rounded-full border border-stroke p-2.5 text-ink-primary"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <MenuIcon open={open} />
        </button>
      </Container>

      {open && (
        <div className="lg:hidden border-t border-stroke bg-bg px-5 pb-6 pt-2">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-3 text-[15px] font-medium ${isActive ? 'bg-white/5 text-white' : 'text-ink-secondary'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            <Button href={SITE.adminUrl} variant="secondary" size="md" className="w-full">
              Admin login
            </Button>
            <Button to="/#download" variant="primary" size="md" className="w-full" onClick={() => setOpen(false)}>
              Get the app
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}

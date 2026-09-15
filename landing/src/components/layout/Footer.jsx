import { Link } from 'react-router-dom'
import Container from '../ui/Container.jsx'
import { SITE, FOOTER_PRODUCT_LINKS, FOOTER_COMPANY_LINKS, FOOTER_LEGAL_LINKS, SOCIAL_LINKS } from '../../lib/site.js'

function FooterColumn({ title, links }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">{title}</h3>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-sm text-ink-secondary hover:text-white transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-stroke bg-bg-elevated">
      <Container className="py-14">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link to="/" className="inline-flex items-center" aria-label={`${SITE.name} home`}>
              <img src="/logo-600.png" alt={SITE.name} className="h-10 w-auto" loading="lazy" width={220} height={149} />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-ink-secondary">{SITE.description}</p>
            <a href={`mailto:${SITE.supportEmail}`} className="text-sm font-medium text-brand-bright hover:text-white transition-colors">
              {SITE.supportEmail}
            </a>
          </div>

          <FooterColumn title="Product" links={FOOTER_PRODUCT_LINKS} />
          <FooterColumn title="Company" links={FOOTER_COMPANY_LINKS} />
          <FooterColumn title="Legal" links={FOOTER_LEGAL_LINKS} />
        </div>

        <div className="mt-12 flex flex-col-reverse items-center gap-4 border-t border-stroke pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-ink-muted">© {year} {SITE.name}. All rights reserved.</p>
          {SOCIAL_LINKS.length > 0 && (
            <div className="flex items-center gap-5">
              {SOCIAL_LINKS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-white transition-colors" aria-label={s.label}>
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </Container>
    </footer>
  )
}

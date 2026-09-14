import { useSeo } from '../lib/useSeo.js'
import Container from '../components/ui/Container.jsx'
import SectionHeading from '../components/ui/SectionHeading.jsx'
import Icon from '../components/ui/Icon.jsx'
import Button from '../components/ui/Button.jsx'
import { SITE } from '../lib/site.js'

const REASONS = [
  { icon: 'mail', title: 'General support', subject: 'Support request' },
  { icon: 'shield', title: 'Report a safety concern', subject: 'Safety report' },
  { icon: 'star', title: 'Become a host', subject: 'Host application enquiry' },
  { icon: 'building', title: 'Partner as an agency', subject: 'Agency partnership enquiry' },
]

const mailto = (subject) => `mailto:${SITE.supportEmail}?subject=${encodeURIComponent(subject)}`

export default function Contact() {
  useSeo({
    title: 'Contact',
    description: `Get in touch with the Saba Live team at ${SITE.supportEmail}.`,
    path: '/contact',
  })

  return (
    <section className="bg-hero-glow py-20 sm:py-28">
      <Container className="max-w-3xl text-center">
        <SectionHeading eyebrow="Contact" title="We're one email away" sub={`Reach the Saba Live team directly at ${SITE.supportEmail}, or pick a reason below to start with the right subject line.`} />

        <div className="mt-10">
          <Button href={`mailto:${SITE.supportEmail}`} variant="primary" size="lg">
            <Icon name="mail" size={18} /> Email {SITE.supportEmail}
          </Button>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
          {REASONS.map((r) => (
            <a
              key={r.title}
              href={mailto(r.subject)}
              className="flex items-center gap-4 rounded-2xl border border-stroke bg-surface p-5 transition-colors hover:border-brand-bright/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-brand-bright">
                <Icon name={r.icon} size={18} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">{r.title}</span>
                <span className="block text-xs text-ink-muted">Opens your email app</span>
              </span>
            </a>
          ))}
        </div>
      </Container>
    </section>
  )
}

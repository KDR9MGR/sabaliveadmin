import Container from '../ui/Container.jsx'
import SectionHeading from '../ui/SectionHeading.jsx'
import Icon from '../ui/Icon.jsx'

/* Deliberately no invented statistics, star ratings or testimonials here —
   just what's actually true about how the platform is built. */
const TRUST_POINTS = [
  { icon: 'shield', title: 'Identity-verified hosts', text: 'Every host completes verification before they can go live — not just an email sign-up.' },
  { icon: 'lock', title: 'Access-controlled by design', text: 'Account, wallet and identity data are scoped so only the account owner and authorised staff can ever see them.' },
  { icon: 'idCard', title: 'Moderated & accountable', text: 'Accounts, live rooms and host access can be reviewed and actioned by a moderation team, not left unmanaged.' },
  { icon: 'wallet', title: 'A transparent wallet', text: 'Every Coin, Gift and Diamond movement is recorded — what you see in your wallet is what actually happened.' },
]

export default function TrustSection() {
  return (
    <section className="border-y border-stroke bg-bg-elevated py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Trust & safety"
          title="Built to be trusted, not just used"
          sub="A platform built around live video and real gifting has to earn trust on both sides of the screen."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map((t) => (
            <div key={t.title} className="rounded-2xl border border-stroke bg-surface p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-brand-bright">
                <Icon name={t.icon} size={18} />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-white">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{t.text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

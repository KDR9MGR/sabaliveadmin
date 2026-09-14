import { useSeo } from '../lib/useSeo.js'
import Container from '../components/ui/Container.jsx'
import SectionHeading from '../components/ui/SectionHeading.jsx'
import Icon from '../components/ui/Icon.jsx'
import Button from '../components/ui/Button.jsx'
import PhoneFrame from '../components/mockups/PhoneFrame.jsx'
import LeaderboardMockup from '../components/mockups/LeaderboardMockup.jsx'
import { KEY_FEATURES } from '../data/features.js'

export default function Features() {
  useSeo({
    title: 'Features',
    description: 'Live streaming, voice & video chat, virtual gifting, rankings, agencies, wallet and safety — everything inside Saba Live.',
    path: '/features',
  })

  return (
    <>
      <section className="bg-hero-glow py-20 sm:py-24">
        <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Features"
              title="Everything Saba Live is built around"
              sub="Live streaming and gifting are the core — rankings, agencies and a real wallet are what make it worth staying for."
              className="mx-0 items-start"
            />
            <div className="mt-8">
              <Button to="/#download" variant="primary" size="lg">
                Get the app
              </Button>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <PhoneFrame>
              <LeaderboardMockup />
            </PhoneFrame>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {KEY_FEATURES.map((f) => (
              <article key={f.title} className="rounded-2xl border border-stroke bg-surface p-7">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-gradient text-white">
                  <Icon name={f.icon} size={20} />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-white">{f.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{f.what}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Why it matters</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{f.why}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}

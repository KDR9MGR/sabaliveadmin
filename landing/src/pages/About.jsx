import { useSeo } from '../lib/useSeo.js'
import Container from '../components/ui/Container.jsx'
import SectionHeading from '../components/ui/SectionHeading.jsx'
import Icon from '../components/ui/Icon.jsx'
import Button from '../components/ui/Button.jsx'

const AUDIENCE = [
  { icon: 'users', title: 'Viewers', text: 'People who want live, real-time entertainment and a real way to connect with the creators they follow.' },
  { icon: 'star', title: 'Hosts', text: 'Creators who want to build an audience through live streaming and turn their time on screen into income.' },
  { icon: 'building', title: 'Agencies', text: 'Teams that manage and grow rosters of hosts, with the tools to onboard and support them.' },
]

export default function About() {
  useSeo({
    title: 'About',
    description: 'What Saba Live is, who it is built for, and how the platform approaches safety and trust.',
    path: '/about',
  })

  return (
    <>
      <section className="bg-hero-glow py-20 sm:py-28">
        <Container className="max-w-3xl text-center">
          <SectionHeading
            eyebrow="About Saba Live"
            title="A live-streaming platform built around real connection"
            sub="Saba Live brings live video, voice chat and virtual gifting together in one app — for watching, hosting, and everything in between."
          />
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container className="max-w-3xl">
          <h2 className="text-2xl font-bold text-white">What we're building</h2>
          <p className="mt-4 text-base leading-relaxed text-ink-secondary">
            Most video apps are either a one-way broadcast or a private call — Saba Live is built to be both at once.
            A live room is public and interactive: hosts stream, viewers chat and send gifts in real time, and any
            connection made there can move into a private voice or video call. On top of that sits a real gifting
            economy — Coins, Gifts and Diamonds — that turns audience support into something hosts can actually
            withdraw.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink-secondary">
            Hosting isn't left unmanaged either. New hosts go through identity verification and join through an
            agency, which is responsible for issuing the access that unlocks Go Live and supporting hosts as they
            grow — the same structure used across established live-streaming platforms.
          </p>
        </Container>
      </section>

      <section className="border-y border-stroke bg-bg-elevated py-20 sm:py-24">
        <Container>
          <SectionHeading eyebrow="Who it's for" title="Three roles, one platform" align="left" className="mx-0 items-start" />
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {AUDIENCE.map((a) => (
              <div key={a.title} className="rounded-2xl border border-stroke bg-surface p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-gradient text-white">
                  <Icon name={a.icon} size={18} />
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{a.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container className="max-w-3xl">
          <h2 className="text-2xl font-bold text-white">Safety comes first</h2>
          <p className="mt-4 text-base leading-relaxed text-ink-secondary">
            Live video and real gifting only work if people trust the platform. That's why hosts are identity-verified
            before they can go live, why account and wallet data is access-controlled so only the account owner and
            authorised staff can see it, and why accounts and live rooms can be reviewed and actioned by a moderation
            team.
          </p>
          <div className="mt-8">
            <Button to="/contact" variant="secondary">
              Get in touch
            </Button>
          </div>
        </Container>
      </section>
    </>
  )
}

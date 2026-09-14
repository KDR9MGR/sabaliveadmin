import Container from '../ui/Container.jsx'
import Button from '../ui/Button.jsx'
import Pill from '../ui/Pill.jsx'
import PhoneFrame from '../mockups/PhoneFrame.jsx'
import LiveRoomMockup from '../mockups/LiveRoomMockup.jsx'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero-glow pb-20 pt-14 sm:pb-28 sm:pt-20">
      <Container className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <Pill tone="brand">Social live-streaming</Pill>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[54px]">
            Go live. Connect in real time. <span className="bg-brand-gradient bg-clip-text text-transparent">Get rewarded.</span>
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-ink-secondary">
            Saba Live is where live streaming, voice &amp; video chat and virtual gifting come together — for
            anyone who wants to watch, connect, host, or get discovered.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button to="/#download" variant="primary" size="lg">
              Get the app
            </Button>
            <Button to="/features" variant="secondary" size="lg">
              Explore the platform
            </Button>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-6 border-t border-stroke pt-6 text-left">
            {[
              ['Live rooms', 'Real-time video & chat'],
              ['Coins → Diamonds', 'A real gifting economy'],
              ['Agencies', 'A managed host program'],
            ].map(([term, desc]) => (
              <div key={term}>
                <dt className="text-sm font-semibold text-white">{term}</dt>
                <dd className="mt-0.5 text-xs text-ink-muted">{desc}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mx-auto flex justify-center lg:justify-end">
          <PhoneFrame>
            <LiveRoomMockup />
          </PhoneFrame>
        </div>
      </Container>
    </section>
  )
}

import Container from '../ui/Container.jsx'
import SectionHeading from '../ui/SectionHeading.jsx'
import Icon from '../ui/Icon.jsx'
import PhoneFrame from '../mockups/PhoneFrame.jsx'
import WalletMockup from '../mockups/WalletMockup.jsx'

const FEATURES = [
  { icon: 'wallet', title: 'Wallet & withdrawals', text: 'Every Coin spent and Diamond earned in one place, with a clear path to cash out.' },
  { icon: 'trophy', title: 'Badges & profile frames', text: 'Milestones you actually keep — shown right on your profile.' },
  { icon: 'shield', title: 'KYC-verified hosts', text: 'Every host is identity-verified before they can go live.' },
  { icon: 'gamepad', title: 'In-app games', text: 'Something to do together between streams, not just during them.' },
]

export default function KeyFeatures() {
  return (
    <section className="border-y border-stroke bg-bg-elevated py-20 sm:py-28" id="features">
      <Container className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
        <div className="order-2 flex justify-center lg:order-1 lg:justify-start">
          <PhoneFrame>
            <WalletMockup />
          </PhoneFrame>
        </div>

        <div className="order-1 flex flex-col gap-8 lg:order-2">
          <SectionHeading
            align="left"
            eyebrow="Key features"
            title="Everything that happens after the stream ends"
            sub="Support doesn't stop when a room closes — earnings, recognition and safety carry through the whole app."
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-brand-bright">
                  <Icon name={f.icon} size={17} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

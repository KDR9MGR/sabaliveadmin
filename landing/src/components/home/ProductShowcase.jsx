import Container from '../ui/Container.jsx'
import SectionHeading from '../ui/SectionHeading.jsx'
import PhoneFrame from '../mockups/PhoneFrame.jsx'
import LiveRoomMockup from '../mockups/LiveRoomMockup.jsx'
import WalletMockup from '../mockups/WalletMockup.jsx'
import LeaderboardMockup from '../mockups/LeaderboardMockup.jsx'

const SCREENS = [
  { Screen: LiveRoomMockup, title: 'The live room', text: 'Real-time chat and gifting, right on top of the stream.' },
  { Screen: WalletMockup, title: 'The wallet', text: 'Coins, Diamonds and withdrawal history, always in view.' },
  { Screen: LeaderboardMockup, title: 'The leaderboard', text: 'Weekly rankings that turn support into recognition.' },
]

export default function ProductShowcase() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Inside the app"
          title="Built for the moment, not just the feed"
          sub="A closer look at three screens that show what using Saba Live actually feels like."
        />

        <div className="mt-14 flex gap-8 overflow-x-auto pb-4 lg:justify-center lg:overflow-visible">
          {SCREENS.map(({ Screen, title, text }) => (
            <figure key={title} className="flex flex-col items-center gap-5">
              <PhoneFrame>
                <Screen />
              </PhoneFrame>
              <figcaption className="max-w-[260px] text-center">
                <p className="text-base font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm text-ink-secondary">{text}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  )
}

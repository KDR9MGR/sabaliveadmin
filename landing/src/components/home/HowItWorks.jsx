import Container from '../ui/Container.jsx'
import SectionHeading from '../ui/SectionHeading.jsx'
import Icon from '../ui/Icon.jsx'

const VIEWER_STEPS = [
  { icon: 'compass', title: 'Discover', text: 'Browse live rooms and creators picked for you the moment you open the app.' },
  { icon: 'video', title: 'Watch & connect', text: 'Join a room, chat in real time, or move to a private voice/video call.' },
  { icon: 'gift', title: 'Send gifts', text: 'Show appreciation with Coins — gifts land instantly and light up the room.' },
  { icon: 'trophy', title: 'Rise the leaderboard', text: 'Earn recognition, badges and profile frames as you show up and support hosts.' },
]

const HOST_STEPS = ['Apply to host', 'Verify your identity', 'Redeem an agency code', 'Go live & earn']

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-stroke bg-bg-elevated py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="From opening the app to your first gift"
          sub="Saba Live is designed to feel simple whether you're watching for the first time or building a following."
        />

        <ol className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VIEWER_STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-stroke bg-surface p-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Step {i + 1}</span>
              <span className="mt-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-brand-bright">
                <Icon name={s.icon} size={20} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{s.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-stroke bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Want to host instead of watch?</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              {HOST_STEPS.join(' → ')}
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}

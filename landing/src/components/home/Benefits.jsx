import Container from '../ui/Container.jsx'
import SectionHeading from '../ui/SectionHeading.jsx'
import Icon from '../ui/Icon.jsx'

const GROUPS = [
  {
    icon: 'users',
    who: 'For viewers',
    outcome: 'Never run out of something worth watching, and a real way to back the creators you like.',
    points: ['Live rooms curated to what you watch', 'Chat and calls with people, not just comments', 'Recognition for the support you give'],
  },
  {
    icon: 'star',
    who: 'For hosts',
    outcome: 'Turn time on screen into an audience and an income, with support instead of guesswork.',
    points: ['A verified profile viewers can trust', 'Gifts convert directly into Diamonds you can withdraw', 'Backed by an agency, not going it alone'],
  },
  {
    icon: 'building',
    who: 'For agencies',
    outcome: 'Manage a roster of hosts with the tools to onboard, support and grow them.',
    points: ['Issue the codes that get new hosts live', 'Oversight without micromanaging every stream', 'A structure built for scale, not spreadsheets'],
  },
]

export default function Benefits() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Why it works"
          title="Built around outcomes, not just features"
          sub="What Saba Live actually changes for the three people using it."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {GROUPS.map((g) => (
            <div key={g.who} className="rounded-2xl border border-stroke bg-surface p-7">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-gradient text-white">
                <Icon name={g.icon} size={18} />
              </span>
              <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-brand-bright">{g.who}</h3>
              <p className="mt-2 text-base font-medium leading-snug text-white">{g.outcome}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {g.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-ink-secondary">
                    <Icon name="check" size={15} className="mt-0.5 shrink-0 text-success" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

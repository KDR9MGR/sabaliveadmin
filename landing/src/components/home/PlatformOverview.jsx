import Container from '../ui/Container.jsx'
import SectionHeading from '../ui/SectionHeading.jsx'
import Icon from '../ui/Icon.jsx'
import { PLATFORM_PILLARS } from '../../data/features.js'

export default function PlatformOverview() {
  return (
    <section className="py-20 sm:py-28" id="platform">
      <Container>
        <SectionHeading
          eyebrow="Platform overview"
          title="One app, three ways to be part of it"
          sub="Watch as a viewer, build a following as a host, or manage a roster of hosts as an agency — Saba Live is built around all three."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_PILLARS.map((f) => (
            <article
              key={f.title}
              className="group rounded-2xl border border-stroke bg-surface p-6 transition-colors hover:border-brand-bright/40"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-gradient text-white">
                <Icon name={f.icon} size={20} />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{f.what}</p>
              <p className="mt-3 text-sm font-medium leading-relaxed text-brand-bright">{f.benefit}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}

import Container from '../ui/Container.jsx'

export default function LegalLayout({ title, updated, children }) {
  return (
    <section className="py-20 sm:py-24">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-ink-muted">Last updated {updated}</p>
        <div className="prose-legal mt-10 flex flex-col gap-8 text-[15px] leading-relaxed text-ink-secondary">
          {children}
        </div>
      </Container>
    </section>
  )
}

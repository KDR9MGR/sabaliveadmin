import { useSeo } from '../lib/useSeo.js'
import Container from '../components/ui/Container.jsx'
import Button from '../components/ui/Button.jsx'

export default function NotFound() {
  useSeo({ title: 'Page not found', path: '/404' })

  return (
    <section className="flex min-h-[60vh] items-center bg-hero-glow py-24">
      <Container className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-bright">404</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Page not found</h1>
        <p className="mt-3 text-sm text-ink-secondary">The page you're looking for doesn't exist or has moved.</p>
        <div className="mt-8">
          <Button to="/" variant="primary">Back home</Button>
        </div>
      </Container>
    </section>
  )
}

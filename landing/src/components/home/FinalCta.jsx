import Container from '../ui/Container.jsx'
import Button from '../ui/Button.jsx'
import { STORE_LINKS } from '../../lib/site.js'

export default function FinalCta() {
  return (
    <section id="download" className="relative overflow-hidden bg-brand-gradient py-20 sm:py-24">
      <Container className="flex flex-col items-center gap-6 text-center">
        <h2 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl">
          Your next live room is one tap away.
        </h2>
        <p className="max-w-xl text-base text-white/85 sm:text-lg">
          Download Saba Live to watch, chat, gift and go live — or apply to host and start building your own audience.
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button href={STORE_LINKS.ios || '#'} variant="secondary" size="lg" className="!border-white/30 !bg-white/10 hover:!bg-white/20">
            Download on the App Store
          </Button>
          <Button href={STORE_LINKS.android || '#'} variant="secondary" size="lg" className="!border-white/30 !bg-white/10 hover:!bg-white/20">
            Get it on Google Play
          </Button>
        </div>
      </Container>
    </section>
  )
}

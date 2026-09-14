import { useSeo } from '../lib/useSeo.js'
import Hero from '../components/home/Hero.jsx'
import PlatformOverview from '../components/home/PlatformOverview.jsx'
import HowItWorks from '../components/home/HowItWorks.jsx'
import KeyFeatures from '../components/home/KeyFeatures.jsx'
import ProductShowcase from '../components/home/ProductShowcase.jsx'
import Benefits from '../components/home/Benefits.jsx'
import TrustSection from '../components/home/TrustSection.jsx'
import FaqSection from '../components/home/FaqSection.jsx'
import FinalCta from '../components/home/FinalCta.jsx'

export default function Home() {
  useSeo({
    title: 'Social Live-Streaming, Voice/Video Chat & Virtual Gifting',
    description:
      'Saba Live is a social live-streaming platform for real-time voice & video chat, live rooms and virtual gifting. Watch, connect, host, and earn.',
    path: '/',
  })

  return (
    <>
      <Hero />
      <PlatformOverview />
      <HowItWorks />
      <KeyFeatures />
      <ProductShowcase />
      <Benefits />
      <TrustSection />
      <FaqSection limit={5} showMoreLink />
      <FinalCta />
    </>
  )
}

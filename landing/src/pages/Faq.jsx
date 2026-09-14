import { useSeo } from '../lib/useSeo.js'
import FaqSection from '../components/home/FaqSection.jsx'

export default function Faq() {
  useSeo({
    title: 'FAQ',
    description: 'Answers to the most common questions about Saba Live — gifting, hosting, agencies, safety and support.',
    path: '/faq',
  })

  return <FaqSection id="faq-page" />
}

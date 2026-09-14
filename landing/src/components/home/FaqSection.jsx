import Container from '../ui/Container.jsx'
import SectionHeading from '../ui/SectionHeading.jsx'
import Accordion from '../ui/Accordion.jsx'
import Button from '../ui/Button.jsx'
import { FAQ_ITEMS } from '../../data/faq.js'

export default function FaqSection({ limit, showMoreLink = false, id = 'faq' }) {
  const items = limit ? FAQ_ITEMS.slice(0, limit) : FAQ_ITEMS

  return (
    <section id={id} className="py-20 sm:py-28">
      <Container className="max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions people ask before downloading" />
        <div className="mt-10">
          <Accordion items={items} />
        </div>
        {showMoreLink && limit && FAQ_ITEMS.length > limit && (
          <div className="mt-8 text-center">
            <Button to="/faq" variant="secondary">
              See all questions
            </Button>
          </div>
        )}
      </Container>
    </section>
  )
}

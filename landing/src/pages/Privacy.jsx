import { useSeo } from '../lib/useSeo.js'
import LegalLayout from '../components/legal/LegalLayout.jsx'
import { SITE } from '../lib/site.js'

const SECTIONS = [
  ['who-we-are', 'Who we are'],
  ['data-we-collect', 'Personal data we collect'],
  ['why-we-collect', 'Why we collect it'],
  ['how-we-use', 'How we use it'],
  ['sharing', 'Sharing & disclosure'],
  ['cross-border', 'Cross-border transfers'],
  ['retention', 'Data retention'],
  ['security', 'Data security'],
  ['your-rights', 'Your rights as a Data Principal'],
  ['children', "Children's privacy"],
  ['cookies', 'Cookies & tracking'],
  ['third-party-links', 'Third-party links'],
  ['grievance', 'Grievance Officer & contact'],
  ['changes', 'Changes to this policy'],
  ['law', 'Governing law'],
]

export default function Privacy() {
  useSeo({
    title: 'Privacy Policy',
    description: 'How Saba Live collects, uses and protects your personal data, in line with the Digital Personal Data Protection Act, 2023 and Indian law.',
    path: '/privacy',
  })

  return (
    <LegalLayout title="Privacy Policy" updated="15 September 2026">
      <p>
        This Privacy Policy explains how Saba Live ("Saba Live", "we", "us", "our") collects, uses, shares and
        protects your personal data when you use the Saba Live app and this website, and the rights you have over
        that data. It applies to viewers, hosts and agency staff alike, and is written to comply with the{' '}
        <strong className="text-white">Digital Personal Data Protection Act, 2023 ("DPDPA")</strong> and the{' '}
        <strong className="text-white">Information Technology Act, 2000</strong> and its rules, as applicable in
        India.
      </p>
      <p>
        By creating an account or using Saba Live, you agree to the collection and use of information as described
        here. If you don't agree, please don't use the app or this website.
      </p>

      <nav aria-label="Sections in this policy" className="rounded-2xl border border-stroke bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">On this page</p>
        <ol className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {SECTIONS.map(([id, label], i) => (
            <li key={id}>
              <a href={`#${id}`} className="text-sm text-ink-secondary hover:text-brand-bright transition-colors">
                {i + 1}. {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section id="who-we-are">
        <h2 className="text-lg font-semibold text-white">1. Who we are</h2>
        <p className="mt-3">
          Saba Live is a social live-streaming platform for real-time voice &amp; video chat and virtual gifting.
          For the purposes of Indian data protection law, Saba Live acts as the{' '}
          <strong className="text-white">Data Fiduciary</strong> — the entity that decides why and how your
          personal data is processed — and you, as a user of the app, are the{' '}
          <strong className="text-white">Data Principal</strong>.
        </p>
      </section>

      <section id="data-we-collect">
        <h2 className="text-lg font-semibold text-white">2. Personal data we collect</h2>
        <ul className="mt-3 flex flex-col gap-2 list-disc pl-5">
          <li><strong className="text-white">Account information:</strong> your name, username, profile photo, date of birth and other details you add to your profile.</li>
          <li><strong className="text-white">Identity verification data:</strong> if you apply to become a host, the government ID and other documents you submit for identity (KYC) verification.</li>
          <li><strong className="text-white">Wallet & transaction data:</strong> Coin purchases, Gifts sent or received, Diamond balances and withdrawal requests, including payment references (we do not store your full card or bank details — those are handled by our payment processors).</li>
          <li><strong className="text-white">Content & activity:</strong> live streams you host or watch, and messages you send in chat, calls or direct messages.</li>
          <li><strong className="text-white">Device & usage data:</strong> basic technical information such as device type, operating system and app version, used to keep the app working and secure.</li>
          <li><strong className="text-white">Support communications:</strong> anything you send us when you contact support, including for grievance redressal.</li>
        </ul>
      </section>

      <section id="why-we-collect">
        <h2 className="text-lg font-semibold text-white">3. Why we collect it</h2>
        <p className="mt-3">
          We process your personal data on the basis of the <strong className="text-white">consent</strong> you
          give when you create an account and continue using Saba Live, and for the following{' '}
          <strong className="text-white">legitimate uses</strong>: verifying host identity before granting the
          ability to go live, preventing fraud and abuse of the Coin/Gift/Diamond economy, responding to your
          support requests, and complying with our legal obligations under Indian law.
        </p>
      </section>

      <section id="how-we-use">
        <h2 className="text-lg font-semibold text-white">4. How we use it</h2>
        <ul className="mt-3 flex flex-col gap-2 list-disc pl-5">
          <li>Operate core features — live streaming, chat, calls, gifting and rankings.</li>
          <li>Verify host identity before granting the ability to go live.</li>
          <li>Process Coin purchases, Gift transactions and Diamond withdrawals accurately.</li>
          <li>Investigate reports and enforce our Terms of Service and community standards.</li>
          <li>Respond to support requests and grievances.</li>
          <li>Meet our record-keeping and reporting obligations under Indian law.</li>
        </ul>
      </section>

      <section id="sharing">
        <h2 className="text-lg font-semibold text-white">5. Sharing & disclosure</h2>
        <p className="mt-3">
          Your account, wallet and identity-verification data are access-controlled: only you and Saba Live staff
          who need that access to run the platform (for example, to review a KYC submission, process a
          withdrawal, or investigate a report) can see it. We share personal data only with:
        </p>
        <ul className="mt-3 flex flex-col gap-2 list-disc pl-5">
          <li>Payment and identity-verification service providers, strictly to process a purchase, withdrawal or KYC check.</li>
          <li>Cloud hosting and infrastructure providers, to store and run the app.</li>
          <li>Law enforcement or regulators, where required by Indian law or a valid legal process.</li>
        </ul>
        <p className="mt-3">
          We do not sell your personal data, and we do not share it with third parties for their own marketing
          purposes.
        </p>
      </section>

      <section id="cross-border">
        <h2 className="text-lg font-semibold text-white">6. Cross-border transfers</h2>
        <p className="mt-3">
          Some of our service providers (for example, cloud infrastructure) may store or process data outside
          India. The DPDPA permits transferring personal data outside India except to countries specifically
          restricted by the Government of India; we do not transfer data to any such restricted country.
        </p>
      </section>

      <section id="retention">
        <h2 className="text-lg font-semibold text-white">7. Data retention</h2>
        <p className="mt-3">
          We keep account, transaction and identity-verification records for as long as your account is active,
          and for a reasonable period afterward where we're required to for legal, financial, tax or safety
          reasons — for example, to keep an accurate record of past withdrawals or resolve an open dispute. Once
          none of those reasons apply, we delete or anonymise the data.
        </p>
      </section>

      <section id="security">
        <h2 className="text-lg font-semibold text-white">8. Data security</h2>
        <p className="mt-3">
          We use reasonable security practices and procedures — including access controls that limit who can see
          your data, and encryption in transit — to protect your personal data from unauthorised access, loss or
          misuse. No system is 100% secure, but we work to keep these protections current.
        </p>
      </section>

      <section id="your-rights">
        <h2 className="text-lg font-semibold text-white">9. Your rights as a Data Principal</h2>
        <p className="mt-3">Under the DPDPA, you have the right to:</p>
        <ul className="mt-3 flex flex-col gap-2 list-disc pl-5">
          <li><strong className="text-white">Access</strong> a summary of the personal data we hold about you and how it's being processed.</li>
          <li><strong className="text-white">Correct</strong> inaccurate or incomplete personal data, and <strong className="text-white">update</strong> data that's out of date.</li>
          <li><strong className="text-white">Erase</strong> personal data that's no longer needed for the purpose it was collected for, subject to our legal retention obligations above.</li>
          <li><strong className="text-white">Withdraw consent</strong> at any time — this doesn't affect processing already carried out, and may mean you can no longer use features that need it (for example, hosting without KYC data).</li>
          <li><strong className="text-white">Nominate</strong> another individual to exercise these rights on your behalf in the event of your death or incapacity.</li>
          <li><strong className="text-white">Grievance redressal</strong> — raise a complaint about how your data is handled and get a response (see below).</li>
        </ul>
        <p className="mt-3">
          You can update most profile information directly in the app. To erase your account and its data, use our{' '}
          <a href="/delete-account" className="text-brand-bright hover:text-white">Delete Account</a> page — no app
          install or sign-in required. For anything else, contact us using the details in the Grievance Officer
          section below.
        </p>
      </section>

      <section id="children">
        <h2 className="text-lg font-semibold text-white">10. Children's privacy</h2>
        <p className="mt-3">
          Saba Live is not directed at children, and you must meet the minimum age described in our Terms of
          Service to create an account. We do not knowingly collect personal data from children or use it for
          tracking, behavioural monitoring or targeted advertising directed at children. If we become aware that
          we've collected a child's personal data without the consent required under the DPDPA, we'll delete it.
        </p>
      </section>

      <section id="cookies">
        <h2 className="text-lg font-semibold text-white">11. Cookies & tracking</h2>
        <p className="mt-3">
          This website does not use tracking or advertising cookies, and we don't run third-party analytics on it.
          The Saba Live app may use standard functional local storage (for example, to keep you signed in) — not
          third-party advertising trackers.
        </p>
      </section>

      <section id="third-party-links">
        <h2 className="text-lg font-semibold text-white">12. Third-party links</h2>
        <p className="mt-3">
          The app or this website may link to third-party services (for example, a payment provider at checkout).
          We aren't responsible for the privacy practices of those third parties — please review their own privacy
          policies.
        </p>
      </section>

      <section id="grievance">
        <h2 className="text-lg font-semibold text-white">13. Grievance Officer & contact</h2>
        <p className="mt-3">
          For any question about this Privacy Policy, to exercise a right described above, or to raise a
          grievance about how your personal data has been handled, contact our Grievance Officer at{' '}
          <a href={`mailto:${SITE.supportEmail}`} className="text-brand-bright hover:text-white">{SITE.supportEmail}</a>.
          We aim to acknowledge grievances promptly and resolve them within 30 days.
        </p>
      </section>

      <section id="changes">
        <h2 className="text-lg font-semibold text-white">14. Changes to this policy</h2>
        <p className="mt-3">
          We may update this Privacy Policy from time to time — for example, if we start collecting new kinds of
          data or the law changes. We'll update the "Last updated" date above when we do; continuing to use Saba
          Live after an update means you accept the revised policy.
        </p>
      </section>

      <section id="law">
        <h2 className="text-lg font-semibold text-white">15. Governing law</h2>
        <p className="mt-3">
          This Privacy Policy is governed by the laws of India, including the Digital Personal Data Protection
          Act, 2023 and the Information Technology Act, 2000.
        </p>
      </section>
    </LegalLayout>
  )
}

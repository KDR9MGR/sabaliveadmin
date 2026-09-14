import { useSeo } from '../lib/useSeo.js'
import LegalLayout from '../components/legal/LegalLayout.jsx'
import { SITE } from '../lib/site.js'

export default function Terms() {
  useSeo({ title: 'Terms of Service', description: 'The terms that govern your use of Saba Live.', path: '/terms' })

  return (
    <LegalLayout title="Terms of Service" updated="14 September 2026">
      <p>
        These Terms of Service ("Terms") govern your use of the Saba Live app and this website. By creating an
        account or using Saba Live, you agree to these Terms.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-white">Eligibility</h2>
        <p className="mt-3">
          You must be old enough to lawfully use a social live-streaming and virtual-gifting app in your country to
          use Saba Live, and to provide accurate information when creating an account.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Your account</h2>
        <p className="mt-3">
          You're responsible for keeping your account credentials secure and for activity that happens under your
          account. Accounts that violate these Terms, our community standards, or applicable law may be suspended
          or terminated.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Coins, Gifts and Diamonds</h2>
        <ul className="mt-3 flex flex-col gap-2 list-disc pl-5">
          <li>Coins are a virtual currency purchased inside the app and used to send Gifts. Coins have no cash value and are non-refundable once purchased, except where required by law.</li>
          <li>Gifts sent during a live stream are final and cannot be reversed or refunded.</li>
          <li>Diamonds are earned by hosts from Gifts received and may be withdrawn subject to our review and processing.</li>
          <li>We may adjust Coin pricing, Gift values or Diamond conversion rates; changes apply going forward, not retroactively to balances you already hold.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Hosting on Saba Live</h2>
        <p className="mt-3">
          Going live requires identity (KYC) verification and, for most hosts, an access code issued by an agency.
          We may decline, suspend or revoke host access at our discretion — including where a host violates these
          Terms, our community standards, or platform policies.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Acceptable use</h2>
        <p className="mt-3">You agree not to use Saba Live to:</p>
        <ul className="mt-3 flex flex-col gap-2 list-disc pl-5">
          <li>Harass, threaten or exploit any other user;</li>
          <li>Post or stream content that is illegal, sexually exploitative, or violates the rights of others;</li>
          <li>Manipulate the gifting economy, rankings or referral mechanisms; or</li>
          <li>Attempt to access another user's account or circumvent our security or moderation systems.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Content</h2>
        <p className="mt-3">
          You retain ownership of content you create on Saba Live, but you grant us the rights needed to host,
          transmit and display it as part of operating the platform — for example, showing your live stream to
          other users in real time.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Disclaimers & liability</h2>
        <p className="mt-3">
          Saba Live is provided "as is." We do our best to keep the platform safe and reliable, but we don't
          guarantee uninterrupted availability, and we are not liable for losses arising from content or conduct of
          other users, to the maximum extent permitted by law.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Changes to these Terms</h2>
        <p className="mt-3">
          We may update these Terms from time to time. Continuing to use Saba Live after an update means you accept
          the revised Terms.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Governing law</h2>
        <p className="mt-3">These Terms are governed by the laws of India.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Contact us</h2>
        <p className="mt-3">
          Questions about these Terms can be sent to{' '}
          <a href={`mailto:${SITE.supportEmail}`} className="text-brand-bright hover:text-white">{SITE.supportEmail}</a>.
        </p>
      </section>
    </LegalLayout>
  )
}

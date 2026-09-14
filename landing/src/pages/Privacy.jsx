import { useSeo } from '../lib/useSeo.js'
import LegalLayout from '../components/legal/LegalLayout.jsx'
import { SITE } from '../lib/site.js'

export default function Privacy() {
  useSeo({ title: 'Privacy Policy', description: 'How Saba Live collects, uses and protects your information.', path: '/privacy' })

  return (
    <LegalLayout title="Privacy Policy" updated="14 September 2026">
      <p>
        This Privacy Policy explains how Saba Live ("Saba Live", "we", "us") collects, uses and protects
        information when you use the Saba Live app or this website. It applies to viewers, hosts and agency staff
        alike.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-white">Information we collect</h2>
        <ul className="mt-3 flex flex-col gap-2 list-disc pl-5">
          <li><strong className="text-white">Account information:</strong> your name, username, profile photo and other details you add to your profile.</li>
          <li><strong className="text-white">Identity verification data:</strong> if you apply to become a host, the documents and details you submit for identity (KYC) verification.</li>
          <li><strong className="text-white">Wallet & transaction data:</strong> Coin purchases, Gifts sent or received, Diamond balances and withdrawal requests.</li>
          <li><strong className="text-white">Content & activity:</strong> live streams you host or watch, and messages you send in chat, calls or direct messages.</li>
          <li><strong className="text-white">Device & usage data:</strong> basic technical information such as device type and app version, used to keep the app working and secure.</li>
          <li><strong className="text-white">Support communications:</strong> anything you send us when you contact support.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">How we use this information</h2>
        <p className="mt-3">We use the information above to:</p>
        <ul className="mt-3 flex flex-col gap-2 list-disc pl-5">
          <li>Operate core features — live streaming, chat, calls, gifting and rankings.</li>
          <li>Verify host identity before granting the ability to go live.</li>
          <li>Process Coin purchases, Gift transactions and Diamond withdrawals accurately.</li>
          <li>Investigate reports and enforce our Terms of Service and community standards.</li>
          <li>Respond to support requests.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Who can access your information</h2>
        <p className="mt-3">
          Your account, wallet and identity-verification data are access-controlled: only you and staff who need
          that access to run the platform (for example, to review a KYC submission, process a withdrawal, or
          investigate a report) can see it. We do not sell your personal information.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Data retention</h2>
        <p className="mt-3">
          We keep account, transaction and verification records for as long as your account is active and for a
          reasonable period afterward, where needed for legal, financial or safety reasons — for example, to keep an
          accurate record of past withdrawals.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Your choices</h2>
        <p className="mt-3">
          You can update your profile information from inside the app at any time. To request access to, correction
          of, or deletion of your data, contact us using the details below.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Contact us</h2>
        <p className="mt-3">
          Questions about this Privacy Policy or your data can be sent to{' '}
          <a href={`mailto:${SITE.supportEmail}`} className="text-brand-bright hover:text-white">{SITE.supportEmail}</a>.
        </p>
      </section>
    </LegalLayout>
  )
}

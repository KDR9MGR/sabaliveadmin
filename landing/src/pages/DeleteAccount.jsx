import { useState } from 'react'
import { useSeo } from '../lib/useSeo.js'
import { requestAccountDeletion } from '../lib/api.js'
import LegalLayout from '../components/legal/LegalLayout.jsx'
import Icon from '../components/ui/Icon.jsx'
import Button from '../components/ui/Button.jsx'
import { SITE } from '../lib/site.js'

const DELETED_ITEMS = [
  ['Profile & account', 'Name, username, photo, bio and login credentials.'],
  ['Streams & PK battles', 'Your broadcast history and recordings.'],
  ['Chats & direct messages', 'Everything sent and received.'],
  ['Wallet, Coins & Gift history', 'Balance and transaction records — purchase records may be retained where required for tax or fraud-prevention law.'],
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function DeleteAccount() {
  useSeo({
    title: 'Delete Your Account',
    description: 'Request permanent deletion of your Saba Live account and data — no app install or sign-in required.',
    path: '/delete-account',
  })

  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState('idle') // idle | busy | done | error

  async function onSubmit(e) {
    e.preventDefault()
    if (!EMAIL_RE.test(email.trim())) {
      setStatus('error')
      return
    }
    setStatus('busy')
    try {
      await requestAccountDeletion({ email: email.trim(), reason: reason.trim() })
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <LegalLayout title="Delete Your Account" updated="15 September 2026">
      <p>
        Submit the email your account is registered with and we'll queue your Saba Live account and its data for
        permanent removal. You don't need the app installed or to sign in to make this request — it works the same
        as deleting your account from inside the app's Settings.
      </p>

      <section id="what-gets-deleted" className="rounded-2xl border border-stroke bg-surface p-6">
        <h2 className="text-lg font-semibold text-white">What gets deleted</h2>
        <ul className="mt-4 flex flex-col gap-4">
          {DELETED_ITEMS.map(([title, desc]) => (
            <li key={title} className="flex items-start gap-3">
              <Icon name="trash" size={16} className="mt-0.5 shrink-0 text-danger" strokeWidth={2} />
              <span>
                <strong className="text-white">{title}</strong>
                <span className="text-ink-secondary"> — {desc}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-stroke pt-5">
          <span className="text-xs text-ink-muted">Processing time</span>
          <span className="rounded-lg bg-surface-alt px-2.5 py-1 font-mono text-xs text-white">≤ 7 days</span>
        </div>
      </section>

      <section id="request" className="rounded-2xl border border-stroke bg-surface p-6">
        {status === 'done' ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success/15 text-success">
              <Icon name="checkCircle" size={22} strokeWidth={2.2} />
            </span>
            <h2 className="text-lg font-semibold text-white">Request received</h2>
            <p className="max-w-sm text-ink-secondary">
              If this email matches a Saba Live account, we've queued it for deletion and will complete the
              process within 7 days. You can close this page now.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <h2 className="text-lg font-semibold text-white">Your details</h2>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-ink-secondary">
                Account email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-stroke bg-surface-alt px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-brand-bright focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="reason" className="mb-2 block text-sm font-semibold text-ink-secondary">
                Reason <span className="font-normal text-ink-muted">(optional)</span>
              </label>
              <textarea
                id="reason"
                rows={3}
                placeholder="Tell us why you're leaving — helps us improve"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full resize-y rounded-xl border border-stroke bg-surface-alt px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-brand-bright focus:outline-none"
              />
            </div>
            {status === 'error' && (
              <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
                {EMAIL_RE.test(email.trim())
                  ? <>Couldn't submit your request — check your connection and try again, or email <a href={`mailto:${SITE.supportEmail}`} className="underline">{SITE.supportEmail}</a>.</>
                  : 'Enter a valid email address.'}
              </p>
            )}
            <Button type="submit" variant="primary" size="lg" disabled={status === 'busy'} className="w-full">
              {status === 'busy' ? 'Submitting…' : 'Request account deletion'}
            </Button>
          </form>
        )}
      </section>

      <p className="text-sm">
        Prefer email? Write to{' '}
        <a href={`mailto:${SITE.supportEmail}`} className="text-brand-bright hover:text-white">{SITE.supportEmail}</a>{' '}
        from your registered address with the same request. For details on what we collect, see our{' '}
        <a href="/privacy" className="text-brand-bright hover:text-white">Privacy Policy</a>.
      </p>
    </LegalLayout>
  )
}

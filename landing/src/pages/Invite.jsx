import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSeo } from '../lib/useSeo.js'
import { cleanInviteCode, platformFor, inviteTarget } from '../lib/invite.js'
import Container from '../components/ui/Container.jsx'
import Button from '../components/ui/Button.jsx'

/* https://sabalive.in/invite/<code> — the link a person shares from the app's Invite a Friend screen (and its QR code). Android phones go straight to Google Play, an iPhone
   is told the app is coming soon, a computer sees both. The code is shown (and can be copied) because the friend types it into the app after installing. */
export default function Invite() {
  const params = useParams()
  const code = cleanInviteCode(params.code)
  useSeo({
    title: 'Join me on Saba Live',
    description: 'A friend invited you to Saba Live — get the app and use their invite code.',
    path: `/invite${code ? `/${code}` : ''}`,
  })

  const target = useMemo(() => inviteTarget(platformFor(navigator.userAgent || ''), code), [code])
  const [copied, setCopied] = useState(false)

  // Android: straight to the store. The button below is there if the browser blocks it.
  useEffect(() => {
    if (target.kind !== 'redirect') return undefined
    const t = setTimeout(() => { window.location.replace(target.url) }, 150)
    return () => clearTimeout(t)
  }, [target])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* the code is on screen to copy by hand */ }
  }

  return (
    <section className="flex min-h-[60vh] items-center bg-hero-glow py-24">
      <Container className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-bright">You are invited</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Join me on Saba Live</h1>

        {target.kind === 'redirect' && (
          <p className="mt-3 text-sm text-ink-secondary">Taking you to {target.store}… if nothing happens, tap the button below.</p>
        )}
        {target.kind === 'coming-soon' && (
          <p className="mt-3 text-sm text-ink-secondary">Saba Live for iPhone is coming soon. It is already on Android, so a friend with an Android phone can join today.</p>
        )}
        {target.kind === 'choose' && (
          <p className="mt-3 text-sm text-ink-secondary">Get the app on your phone.</p>
        )}

        {code && (
          <div className="mt-6 rounded-2xl border border-stroke bg-white/5 px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-ink-secondary">Your invite code</p>
            <p className="mt-1 select-all text-2xl font-bold tracking-widest text-white">{code}</p>
            <p className="mt-1 text-xs text-ink-secondary">Enter it in the app under Invite a Friend after you sign up.</p>
            <button type="button" onClick={copy} className="mt-3 text-sm font-semibold text-brand-bright hover:underline">{copied ? 'Copied' : 'Copy code'}</button>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          {target.kind === 'redirect' && <Button href={target.url} variant="primary" size="lg">Open {target.store}</Button>}
          {target.kind === 'choose' && target.android && <Button href={target.android} variant="primary" size="lg">Get it on Google Play</Button>}
          {target.kind === 'choose' && !target.ios && <p className="text-sm text-ink-secondary">iPhone: coming soon</p>}
          {target.kind === 'choose' && target.ios && <Button href={target.ios} variant="secondary">Download on the App Store</Button>}
          {target.kind === 'coming-soon' && <Button to="/" variant="secondary">About Saba Live</Button>}
        </div>
      </Container>
    </section>
  )
}

import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useSeo } from '../lib/useSeo.js'
import { STORE_LINKS } from '../lib/site.js'
import { isLiveId, platformOf, appUrlFor } from '../lib/openApp.js'
import Container from '../components/ui/Container.jsx'
import Button from '../components/ui/Button.jsx'
import NotFound from './NotFound.jsx'

/* https://sabalive.in/live/<id> — the link shared from a live. Takes the visitor
   into that live in the app, and offers the app to anyone who doesn't have it. */
export default function Live() {
  const { id } = useParams()
  useSeo({
    title: 'Join the live',
    description: 'Someone is live on Saba Live — open the app to join them.',
    path: `/live/${id || ''}`,
  })

  const platform = useMemo(() => platformOf(), [])
  const store = platform === 'ios' ? STORE_LINKS.ios : platform === 'android' ? STORE_LINKS.android : null
  const appUrl = appUrlFor(id, platform, store)

  // Try the app straight away; the button is there if the browser blocks it.
  useEffect(() => {
    if (!appUrl) return undefined
    const t = setTimeout(() => { window.location.href = appUrl }, 250)
    return () => clearTimeout(t)
  }, [appUrl])

  if (!isLiveId(id)) return <NotFound />

  return (
    <section className="flex min-h-[60vh] items-center bg-hero-glow py-24">
      <Container className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-bright">Live now</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Join the live on Saba Live</h1>
        <p className="mt-3 text-sm text-ink-secondary">
          {appUrl
            ? 'Opening the app… if nothing happens, tap the button below.'
            : 'Open this link on your phone to join the live in the Saba Live app.'}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          {appUrl && <Button href={appUrl} variant="primary" size="lg">Open in Saba Live</Button>}
          {store
            ? <Button href={store} variant="secondary">Get the app</Button>
            : <Button to="/" variant="secondary">About Saba Live</Button>}
        </div>
      </Container>
    </section>
  )
}

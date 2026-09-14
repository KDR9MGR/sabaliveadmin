import { useEffect } from 'react'
import { SITE } from './site.js'

function setMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/* Sets document title + description + canonical + Open Graph tags per route.
   No dependency needed — index.html already carries good defaults for the
   home page, this just overrides them for the other routes. */
export function useSeo({ title, description, path = '/' }) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${SITE.name}` : SITE.name
    document.title = fullTitle
    const desc = description || SITE.description
    const url = `${SITE.url}${path}`

    setMeta('name', 'description', desc)
    setLink('canonical', url)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', url)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', desc)

    if (!window.location.hash) window.scrollTo(0, 0)
  }, [title, description, path])
}

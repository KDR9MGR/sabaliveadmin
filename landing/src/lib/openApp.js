/* Opening the app from a shared live link.

   A phone that has the app and a verified link (Android App Links) never gets
   here — it opens the app directly. Everyone else lands on the /live/:id page,
   which tries the app itself: on Android with an intent: URL (falling back to
   the Play listing if the app isn't installed), elsewhere with the app's own
   sabalive:// scheme (iOS Safari asks "Open in SABALIVE?"). */

export const ANDROID_PACKAGE = 'com.sabalive.in'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isLiveId = (id) => UUID.test(id || '')

export function platformOf(ua = navigator.userAgent || '') {
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  return 'desktop'
}

/* The URL that opens the live in the app on this platform, or null on a computer. */
export function appUrlFor(id, platform, fallbackUrl) {
  if (!isLiveId(id)) return null
  if (platform === 'android') {
    const fallback = fallbackUrl ? `;S.browser_fallback_url=${encodeURIComponent(fallbackUrl)}` : ''
    return `intent://live/${id}#Intent;scheme=sabalive;package=${ANDROID_PACKAGE}${fallback};end`
  }
  if (platform === 'ios') return `sabalive://live/${id}`
  return null
}

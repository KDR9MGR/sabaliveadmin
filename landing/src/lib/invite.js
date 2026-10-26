/* The invite link a person shares from the app: https://sabalive.in/invite/<code>.

   One link for every friend it is sent to, so the page decides by the phone it is opened on:
     Android -> the app's Google Play page (the invite code rides along as the Play "referrer", which Play keeps with the install)
     iPhone  -> the App Store when STORE_LINKS.ios is set; until then "coming soon"
     others  -> both choices
   Pure functions (tested in invite.test.js); the page is pages/Invite.jsx. */

import { STORE_LINKS } from './site.js'

export const INVITE_CODE_MAX = 32

/* The code as it may be shown and put in a link: letters, digits, "_" and "-" only (the app cleans it the same way). */
export function cleanInviteCode(raw) {
  return String(raw || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, INVITE_CODE_MAX)
}

export function platformFor(ua = '') {
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  return 'desktop'
}

/* The Google Play listing with the invite code as the install referrer (utm_content), or the plain listing when there is no code. */
export function playStoreUrl(code, base = STORE_LINKS.android) {
  const clean = cleanInviteCode(code)
  if (!base) return null
  if (!clean) return base
  const referrer = encodeURIComponent(`utm_source=invite&utm_medium=referral&utm_content=${clean}`)
  return `${base}${base.includes('?') ? '&' : '?'}referrer=${referrer}`
}

/* What the page does for this visitor:
     { kind: 'redirect', url, store }   go there now (and show a button in case the browser blocks it)
     { kind: 'coming-soon' }            an iPhone, with no App Store link yet
     { kind: 'choose', android, ios }   a computer or anything else: show the stores */
export function inviteTarget(platform, code, links = STORE_LINKS) {
  const android = playStoreUrl(code, links.android)
  if (platform === 'android' && android) return { kind: 'redirect', url: android, store: 'Google Play' }
  if (platform === 'ios') return links.ios ? { kind: 'redirect', url: links.ios, store: 'the App Store' } : { kind: 'coming-soon' }
  return { kind: 'choose', android, ios: links.ios || null }
}

/* Site-wide constants. Keep real, verifiable values only — no invented
   business facts (see README for what still needs to be filled in). */

export const SITE = {
  name: 'Saba Live',
  domain: 'sabalive.in',
  url: 'https://sabalive.in',
  adminUrl: 'https://admin.sabalive.in',
  tagline: 'Go live. Connect in real time. Get rewarded.',
  description:
    'Saba Live is a social live-streaming platform for real-time voice & video chat, live rooms and virtual gifting.',
  // Confirmed from the app's own settings screen (lib/features/profile/settings_screen.dart).
  supportEmail: 'sabalive35@gmail.com',
}

// Who owns and who runs Saba Live. Real names only: a value left null is simply not written
// (the line is built by ownershipLine below and shown in the footer, About, Terms and Privacy).
//   owner    = the person or company the product, name and brand belong to (the App Store seller).
//   operator = the LEGAL name of the business that runs it in India; null until the owner gives it.
export const OWNERSHIP = {
  owner: 'Louie Malpeli',
  ownerCountry: 'United Kingdom',
  operator: null,
  operatorCountry: 'India',
}

/** "Saba Live is owned by X, United Kingdom, and operated in India by Y." Empty when no owner is set. */
export function ownershipLine(o = OWNERSHIP, name = SITE.name) {
  if (!o || !o.owner) return ''
  const owned = `${name} is owned by ${o.owner}${o.ownerCountry ? `, ${o.ownerCountry}` : ''}`
  if (!o.operator) return `${owned}.`
  return `${owned}, and operated in ${o.operatorCountry || 'India'} by ${o.operator}.`
}

export const NAV_LINKS = [
  { label: 'Features', to: '/features' },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'About', to: '/about' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Contact', to: '/contact' },
]

export const FOOTER_PRODUCT_LINKS = [
  { label: 'Features', to: '/features' },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'FAQ', to: '/faq' },
]

export const FOOTER_COMPANY_LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

export const FOOTER_LEGAL_LINKS = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Delete Account', to: '/delete-account' },
]

// Add real handles here once available — deliberately empty rather than
// linking to placeholder/fake social profiles.
export const SOCIAL_LINKS = []

// App store links. Android is live on Google Play; iOS is not built yet. The shared-live page (/live/:id) sends a phone without the app to this
// listing, and the home page's Google Play button opens it.
export const STORE_LINKS = {
  ios: null,
  android: 'https://play.google.com/store/apps/details?id=com.sabalive.in',
}

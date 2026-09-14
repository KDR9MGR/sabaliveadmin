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
  supportEmail: 'support@sabalive.app',
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
]

// Add real handles here once available — deliberately empty rather than
// linking to placeholder/fake social profiles.
export const SOCIAL_LINKS = []

// App store links — wire these up once the listings are live.
export const STORE_LINKS = {
  ios: null,
  android: null,
}

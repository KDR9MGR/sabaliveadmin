/* Real platform capabilities — grounded in the actual app's feature
   modules (sabalive/lib/features/*) and economy (coins, gifts, diamonds,
   agencies, KYC) from the shared Supabase schema. No generic placeholder
   SaaS features. */

export const PLATFORM_PILLARS = [
  {
    icon: 'live',
    title: 'Live Streaming & Rooms',
    what: 'Go live instantly and broadcast to a room full of real people, with live chat and reactions in real time.',
    why: 'Streaming is the heart of Saba Live — every other feature (gifting, rankings, agencies) is built around what happens in a live room.',
    benefit: 'Viewers get a real-time, interactive show instead of a one-way video feed.',
  },
  {
    icon: 'video',
    title: 'Voice & Video Chat',
    what: '1:1 and group voice/video calls, on top of live rooms — so a connection made watching a stream can carry on privately.',
    why: 'Not every conversation belongs in a public room. Calls give hosts and viewers a direct line to each other.',
    benefit: 'Deeper connections, not just spectating — you can actually talk to the people you follow.',
  },
  {
    icon: 'gift',
    title: 'Virtual Gifting Economy',
    what: 'Viewers buy Coins and send animated Gifts during a live stream; hosts convert what they earn into Diamonds.',
    why: 'Gifting is how viewers show appreciation in the moment, and how creators are directly rewarded for their time on screen.',
    benefit: 'A simple, visible way to support a favourite creator — and a real income stream for hosts.',
  },
  {
    icon: 'trophy',
    title: 'Rankings & Recognition',
    what: 'Leaderboards for top gifters and top hosts, plus badges and profile frames that show off status and milestones.',
    why: 'Recognition keeps both sides of the room engaged — viewers competing for standing, hosts building a reputation.',
    benefit: 'Your activity on Saba Live is visible and rewarded, not just logged.',
  },
  {
    icon: 'building',
    title: 'Agencies & Host Program',
    what: 'Creators apply to become hosts and get connected to an agency, which issues the code that unlocks Go Live.',
    why: 'Agencies manage, support and grow rosters of hosts — the same structure used by established live-streaming platforms.',
    benefit: 'New hosts get guidance and support instead of starting from zero on their own.',
  },
  {
    icon: 'shield',
    title: 'Safety & Verification',
    what: 'Hosts go through identity (KYC) verification before they can go live, and every account can be reviewed or actioned by moderators.',
    why: 'A platform built around real-time video and real money needs real trust and accountability on both sides.',
    benefit: 'A safer room for viewers, and a verified, credible profile for hosts.',
  },
]

export const KEY_FEATURES = [
  ...PLATFORM_PILLARS,
  {
    icon: 'wallet',
    title: 'Wallet & Withdrawals',
    what: 'A single wallet tracks Coins spent and Diamonds earned, with a clear request-and-approval flow to withdraw real earnings.',
    why: 'Hosts need to see exactly what they have earned and be able to cash it out with confidence.',
    benefit: 'Transparent earnings, on your terms.',
  },
  {
    icon: 'gamepad',
    title: 'In-App Games',
    what: 'Lightweight games built into the app for viewers and hosts to play together between streams.',
    why: 'Not every moment on Saba Live is a broadcast — games give the community something to do together.',
    benefit: 'More reasons to open the app beyond watching a stream.',
  },
]

import {
  rng, pick, int, fullName, email, mobile, dateStr, timeAgo,
  AGENCIES, CITIES, num, compact,
} from './util.js'

/* ------------------------------------------------------------------ users */
export const users = Array.from({ length: 68 }, (_, i) => {
  const r = rng(1000 + i)
  const name = fullName(r)
  const role = pick(r, ['User', 'User', 'User', 'User', 'Host', 'Host', 'Sub Admin', 'Agency'])
  return {
    id: 'USR' + String(10230 + i),
    name,
    email: email(name),
    mobile: mobile(r),
    role,
    status: pick(r, ['Active', 'Active', 'Active', 'Inactive', 'Suspended']),
    kyc: pick(r, ['Verified', 'Verified', 'Pending', 'Rejected', 'Not Submitted']),
    joined: dateStr(r),
    country: pick(r, CITIES),
    coins: int(r, 0, 250000),
    level: int(r, 1, 60),
  }
})

/* ------------------------------------------------------------------ hosts */
export const hosts = Array.from({ length: 54 }, (_, i) => {
  const r = rng(2000 + i)
  const name = fullName(r)
  return {
    id: 'HST' + String(4400 + i),
    name,
    email: email(name),
    agency: pick(r, AGENCIES),
    followers: int(r, 800, 92000),
    coins: int(r, 5000, 480000),
    diamonds: int(r, 1000, 250000),
    liveHours: int(r, 4, 320),
    rating: (3 + r() * 2).toFixed(1),
    status: pick(r, ['Active', 'Active', 'Active', 'Live', 'Inactive', 'Banned']),
    joined: dateStr(r),
    tier: pick(r, ['Bronze', 'Silver', 'Silver', 'Gold', 'Platinum']),
  }
})

/* ------------------------------------------------------------------ agencies */
export const agencies = AGENCIES.map((nm, i) => {
  const r = rng(3000 + i)
  const mgr = fullName(r)
  return {
    id: 'AGN' + String(120 + i),
    name: nm,
    manager: mgr,
    managerEmail: email(mgr),
    hosts: int(r, 8, 140),
    users: int(r, 300, 4200),
    revenue: int(r, 12000, 240000),
    commission: int(r, 5, 25),
    status: pick(r, ['Active', 'Active', 'Active', 'Inactive', 'Pending']),
    joined: dateStr(r, 700),
    country: pick(r, CITIES),
  }
})

/* ------------------------------------------------------------------ admins */
export const admins = Array.from({ length: 6 }, (_, i) => {
  const r = rng(4000 + i)
  const name = fullName(r)
  return {
    id: 'ADM' + String(10 + i),
    name,
    email: email(name),
    role: i === 0 ? 'Super Admin' : pick(r, ['Admin', 'Admin', 'Master']),
    modules: int(r, 6, 14),
    lastLogin: timeAgo(r),
    status: i === 0 ? 'Active' : pick(r, ['Active', 'Active', 'Inactive']),
    created: dateStr(r, 900),
    twoFa: pick(r, ['Enabled', 'Enabled', 'Disabled']),
  }
})

export const subAdmins = Array.from({ length: 14 }, (_, i) => {
  const r = rng(4500 + i)
  const name = fullName(r)
  return {
    id: 'SAD' + String(200 + i),
    name,
    email: email(name),
    assignedAgency: pick(r, AGENCIES),
    permissions: pick(r, ['Hosts only', 'Hosts + Users', 'Reports', 'Full (scoped)']),
    hostsManaged: int(r, 5, 60),
    lastLogin: timeAgo(r),
    status: pick(r, ['Active', 'Active', 'Inactive']),
    created: dateStr(r, 500),
  }
})

/* ------------------------------------------------------------------ transfer requests */
export const transferRequests = Array.from({ length: 22 }, (_, i) => {
  const r = rng(5000 + i)
  const type = pick(r, ['Host', 'Agency', 'Sub Admin'])
  const subj = fullName(r)
  return {
    id: 'TRF' + String(700 + i),
    type,
    subject: subj,
    from: pick(r, AGENCIES),
    to: pick(r, AGENCIES),
    requestedBy: fullName(r),
    date: dateStr(r, 60),
    status: pick(r, ['Pending', 'Pending', 'Approved', 'Rejected']),
    reason: pick(r, ['Performance', 'Relocation', 'Contract end', 'Manager request', 'Restructure']),
  }
})

/* ------------------------------------------------------------------ coin packages */
export const coinPackages = [
  { id: 'PKG01', name: 'Starter', coins: 100, price: 89, bonus: 0, platform: 'All', status: 'Active' },
  { id: 'PKG02', name: 'Popular', coins: 500, price: 399, bonus: 25, platform: 'All', status: 'Active' },
  { id: 'PKG03', name: 'Value', coins: 1200, price: 899, bonus: 120, platform: 'All', status: 'Active' },
  { id: 'PKG04', name: 'Pro', coins: 3000, price: 1999, bonus: 450, platform: 'Android', status: 'Active' },
  { id: 'PKG05', name: 'Elite', coins: 6500, price: 3999, bonus: 1200, platform: 'iOS', status: 'Inactive' },
  { id: 'PKG06', name: 'Whale', coins: 15000, price: 8999, bonus: 3500, platform: 'All', status: 'Active' },
]

/* ------------------------------------------------------------------ gifts */
export const gifts = [
  { id: 'GFT01', name: 'Rose', icon: '🌹', price: 10, type: 'Normal', category: 'Basic', status: 'Active' },
  { id: 'GFT02', name: 'Heart', icon: '❤️', price: 20, type: 'Normal', category: 'Basic', status: 'Active' },
  { id: 'GFT03', name: 'Diamond', icon: '💎', price: 100, type: 'Premium', category: 'Luxury', status: 'Active' },
  { id: 'GFT04', name: 'Crown', icon: '👑', price: 200, type: 'Premium', category: 'Luxury', status: 'Active' },
  { id: 'GFT05', name: 'Super Car', icon: '🏎️', price: 500, type: 'Premium', category: 'Vehicle', status: 'Active' },
  { id: 'GFT06', name: 'Rocket', icon: '🚀', price: 1000, type: 'Premium', category: 'Special', status: 'Active' },
  { id: 'GFT07', name: 'Castle', icon: '🏰', price: 3000, type: 'Luxury', category: 'Special', status: 'Inactive' },
  { id: 'GFT08', name: 'Yacht', icon: '🛥️', price: 5000, type: 'Luxury', category: 'Vehicle', status: 'Active' },
  { id: 'GFT09', name: 'Fireworks', icon: '🎆', price: 800, type: 'Premium', category: 'Special', status: 'Active' },
  { id: 'GFT10', name: 'Teddy', icon: '🧸', price: 50, type: 'Normal', category: 'Basic', status: 'Active' },
]

/* ------------------------------------------------------------------ transactions */
export const transactions = Array.from({ length: 60 }, (_, i) => {
  const r = rng(6000 + i)
  const kind = pick(r, ['Recharge', 'Recharge', 'Gift Sent', 'Gift Received', 'Withdrawal', 'Refund'])
  const name = fullName(r)
  return {
    id: 'TXN' + String(88100 + i),
    user: name,
    type: kind,
    amount: int(r, 10, 15000),
    coins: int(r, 100, 40000),
    method: pick(r, ['UPI', 'Card', 'Wallet', 'NetBanking', 'In-App']),
    date: dateStr(r, 45),
    status: pick(r, ['Success', 'Success', 'Success', 'Pending', 'Failed']),
  }
})

/* ------------------------------------------------------------------ coin transfer history */
const transferHist = (seed, targets) => Array.from({ length: 26 }, (_, i) => {
  const r = rng(seed + i)
  return {
    id: 'CTR' + String(seed % 1000 + i),
    target: pick(r, targets),
    coins: int(r, 500, 200000),
    by: 'Mehardeep (Super Admin)',
    note: pick(r, ['Monthly top-up', 'Bonus', 'Correction', 'Event payout', 'Manual grant']),
    date: dateStr(r, 90),
    status: pick(r, ['Completed', 'Completed', 'Completed', 'Reversed']),
  }
})
export const transferToSubAdmin = transferHist(7100, ['Neha Verma (SAD)', 'Rohit Bose (SAD)', 'Kavya Iyer (SAD)', 'Manish Das (SAD)'])
export const transferToAgency = transferHist(7200, AGENCIES.map((a) => a + ' Agency'))
export const transferToUser = transferHist(7300, Array.from({ length: 8 }, (_, i) => fullName(rng(9000 + i))))

/* ------------------------------------------------------------------ live rooms */
export const liveRooms = Array.from({ length: 15 }, (_, i) => {
  const r = rng(8000 + i)
  const host = fullName(r)
  return {
    id: 'LIV' + String(300 + i),
    host,
    title: pick(r, ['Evening Chat & Music', 'Q&A with fans', 'Dance Party 🎉', 'Late Night Talk', 'Gaming Live', 'Singing Session', 'Just Chatting', 'Makeup Tutorial']),
    viewers: int(r, 12, 8400),
    coins: int(r, 200, 90000),
    agency: pick(r, AGENCIES),
    duration: int(r, 3, 180) + 'm',
    status: pick(r, ['Live', 'Live', 'Live', 'Flagged']),
  }
})

/* ------------------------------------------------------------------ live requests (host applications to go live / feature) */
export const liveRequests = Array.from({ length: 18 }, (_, i) => {
  const r = rng(8500 + i)
  const name = fullName(r)
  return {
    id: 'REQ' + String(500 + i),
    host: name,
    agency: pick(r, AGENCIES),
    type: pick(r, ['Go Live Approval', 'Feature Request', 'Event Slot', 'PK Battle', 'Verification']),
    submitted: timeAgo(r),
    priority: pick(r, ['High', 'Medium', 'Medium', 'Low']),
    status: pick(r, ['Pending', 'Pending', 'Approved', 'Rejected']),
  }
})

/* ------------------------------------------------------------------ badges */
export const badges = [
  { id: 'BDG01', name: 'Newcomer', emoji: '🌱', criteria: 'Join platform', holders: 12420, status: 'Active' },
  { id: 'BDG02', name: 'Rising Star', emoji: '⭐', criteria: '1K followers', holders: 3810, status: 'Active' },
  { id: 'BDG03', name: 'Top Gifter', emoji: '🎁', criteria: '50K coins gifted', holders: 940, status: 'Active' },
  { id: 'BDG04', name: 'Streak Master', emoji: '🔥', criteria: '30-day live streak', holders: 512, status: 'Active' },
  { id: 'BDG05', name: 'Verified', emoji: '✔️', criteria: 'KYC + review', holders: 2210, status: 'Active' },
  { id: 'BDG06', name: 'Legend', emoji: '👑', criteria: 'Top 100 all-time', holders: 100, status: 'Active' },
  { id: 'BDG07', name: 'Event Winner', emoji: '🏆', criteria: 'Win any event', holders: 388, status: 'Inactive' },
  { id: 'BDG08', name: 'Party Host', emoji: '🎉', criteria: 'Host 20 parties', holders: 660, status: 'Active' },
]

/* ------------------------------------------------------------------ profile frames */
export const frames = Array.from({ length: 12 }, (_, i) => {
  const r = rng(9100 + i)
  const names = ['Golden Ring', 'Neon Pulse', 'Sakura', 'Galaxy', 'Flame', 'Ocean Wave', 'Diamond Edge', 'Royal Crown', 'Cyber Grid', 'Aurora', 'Phoenix', 'Frost']
  return {
    id: 'FRM' + String(60 + i),
    name: names[i],
    emoji: pick(r, ['💫', '🌀', '🌸', '🌌', '🔥', '🌊', '💎', '👑', '🟪', '🌈', '🦅', '❄️']),
    unlock: pick(r, ['Free', 'Level 10', 'Level 25', 'VIP', '500 coins', 'Event']),
    price: pick(r, [0, 0, 200, 500, 1000]),
    status: pick(r, ['Active', 'Active', 'Draft']),
  }
})

/* leaderboard frames */
export const leaderboardFrames = Array.from({ length: 8 }, (_, i) => {
  const r = rng(9300 + i)
  const names = ['Weekly Top 1', 'Weekly Top 3', 'Monthly Champion', 'Rookie Board', 'Gifter Elite', 'Agency Cup', 'Regional #1', 'Hall of Fame']
  return {
    id: 'LBF' + String(30 + i),
    name: names[i],
    emoji: pick(r, ['🥇', '🥈', '🏅', '🎖️', '🏆', '👑', '💠', '⚜️']),
    scope: pick(r, ['Global', 'Agency', 'Regional']),
    period: pick(r, ['Weekly', 'Monthly', 'Season']),
    status: pick(r, ['Active', 'Active', 'Scheduled']),
  }
})

/* ------------------------------------------------------------------ salary */
export const salary = Array.from({ length: 30 }, (_, i) => {
  const r = rng(9500 + i)
  const name = fullName(r)
  const base = int(r, 8000, 45000)
  const bonus = int(r, 0, 20000)
  const deductions = int(r, 0, 4000)
  return {
    id: 'SAL' + String(900 + i),
    payee: name,
    role: pick(r, ['Host', 'Host', 'Sub Admin', 'Agency Manager']),
    agency: pick(r, AGENCIES),
    period: 'Aug 2026',
    base,
    bonus,
    deductions,
    net: base + bonus - deductions,
    status: pick(r, ['Paid', 'Paid', 'Processing', 'On Hold']),
  }
})

/* ------------------------------------------------------------------ audit logs */
export const auditLogs = Array.from({ length: 40 }, (_, i) => {
  const r = rng(9700 + i)
  return {
    id: 'LOG' + String(50000 + i),
    actor: pick(r, ['Mehardeep (Super Admin)', 'Rahul Kumar (Admin)', 'Neha Verma (Sub Admin)', 'System']),
    action: pick(r, ['Updated app config', 'Suspended user', 'Approved transfer', 'Created admin', 'Changed commission', 'Deleted gift', 'Reset password', 'Exported report']),
    target: pick(r, ['USR10231', 'AGN121', 'HST4402', 'config.payment', 'ADM12', 'GFT07']),
    ip: `${int(r, 10, 210)}.${int(r, 0, 255)}.${int(r, 0, 255)}.${int(r, 1, 254)}`,
    when: timeAgo(r),
    severity: pick(r, ['Info', 'Info', 'Info', 'Warning', 'Critical']),
  }
})

/* ------------------------------------------------------------------ content */
export const banners = Array.from({ length: 10 }, (_, i) => {
  const r = rng(9800 + i)
  return {
    id: 'BAN' + String(20 + i),
    title: pick(r, ['Independence Day Event', 'Recharge x2 Bonus', 'New Gift Drop', 'Refer & Earn', 'Weekend PK Cup', 'KYC Reminder']),
    placement: pick(r, ['Home Top', 'Live Room', 'Wallet', 'Explore']),
    starts: dateStr(r, 30),
    ends: dateStr(r, 5),
    status: pick(r, ['Active', 'Active', 'Scheduled', 'Expired']),
  }
})
export const legalPages = [
  { id: 'PG1', title: 'Terms of Service', slug: '/legal/terms', updated: '12 Aug 2026', status: 'Published' },
  { id: 'PG2', title: 'Privacy Policy', slug: '/legal/privacy', updated: '12 Aug 2026', status: 'Published' },
  { id: 'PG3', title: 'Community Guidelines', slug: '/legal/community', updated: '05 Jul 2026', status: 'Published' },
  { id: 'PG4', title: 'Refund Policy', slug: '/legal/refund', updated: '28 Jun 2026', status: 'Published' },
  { id: 'PG5', title: 'Host Agreement', slug: '/legal/host-agreement', updated: '19 Aug 2026', status: 'Draft' },
  { id: 'PG6', title: 'Agency Agreement', slug: '/legal/agency-agreement', updated: '19 Aug 2026', status: 'Draft' },
]
export const announcements = Array.from({ length: 8 }, (_, i) => {
  const r = rng(9850 + i)
  return {
    id: 'ANN' + String(40 + i),
    title: pick(r, ['Scheduled maintenance', 'New withdrawal partner', 'Policy update', 'Festival event live', 'App update 3.2.0']),
    audience: pick(r, ['All users', 'Hosts', 'Agencies', 'Sub Admins']),
    channel: pick(r, ['In-app', 'Push', 'Email', 'In-app + Push']),
    sent: dateStr(r, 40),
    status: pick(r, ['Sent', 'Sent', 'Scheduled', 'Draft']),
  }
})

/* host applications */
export const hostApplications = Array.from({ length: 16 }, (_, i) => {
  const r = rng(9900 + i)
  const name = fullName(r)
  return {
    id: 'HAP' + String(80 + i),
    applicant: name,
    email: email(name),
    agency: pick(r, [...AGENCIES, 'Direct (no agency)']),
    experience: pick(r, ['New', '<1 year', '1-3 years', '3+ years']),
    followersOtherApps: int(r, 0, 120000),
    submitted: timeAgo(r),
    status: pick(r, ['Pending', 'Pending', 'Under Review', 'Approved', 'Rejected']),
  }
})

/* assignments (agency panel) */
export const assignments = Array.from({ length: 24 }, (_, i) => {
  const r = rng(9950 + i)
  return {
    id: 'ASN' + String(300 + i),
    host: fullName(r),
    subAdmin: fullName(rng(9955 + i)),
    shift: pick(r, ['Morning', 'Evening', 'Night', 'Flexible']),
    targetHours: int(r, 40, 160),
    doneHours: int(r, 0, 160),
    status: pick(r, ['On Track', 'On Track', 'Behind', 'Exceeded']),
  }
})

/* ------------------------------------------------------------------ dashboard aggregates */
export const dashboard = {
  master: {
    stats: [
      { key: 'Total Users', value: '12,542', delta: 12.5, dir: 'up', icon: 'users', tile: 'tile-purple' },
      { key: 'Total Hosts', value: '1,256', delta: 8.2, dir: 'up', icon: 'video', tile: 'tile-green' },
      { key: 'Total Agencies', value: '86', delta: 4.3, dir: 'up', icon: 'building', tile: 'tile-orange' },
      { key: 'Gifts (This Month)', value: '2,61,000', delta: 15.7, dir: 'up', icon: 'gift', tile: 'tile-blue' },
      { key: 'Active Live Rooms', value: '342', delta: 2.1, dir: 'down', icon: 'radio', tile: 'tile-pink' },
    ],
    userSplit: [
      { label: 'Users', value: 7274, color: '#7c3aed' },
      { label: 'Agencies', value: 2860, color: '#22a06b' },
      { label: 'Hosts', value: 1256, color: '#f59e0b' },
      { label: 'Sub Admins', value: 1152, color: '#3b82f6' },
    ],
    liveSeries: [31, 40, 28, 51, 42, 60, 55, 70, 58, 63, 72, 68, 80, 74, 90, 82, 95, 88, 100, 92, 105, 110, 98, 120, 115, 130, 122, 140, 135, 150],
    revenueSeries: [42, 55, 38, 90, 60, 120, 80, 70, 110, 95, 130, 100, 160, 140, 180, 150, 90, 200, 170, 220, 190, 240, 210, 175, 250, 230, 260, 240, 280, 300],
    topAgencies: agencies.slice(0, 5).map((a) => ({ name: a.name, hosts: a.hosts, users: a.users, revenue: a.revenue })),
    activities: Array.from({ length: 6 }, (_, i) => {
      const r = rng(11000 + i)
      return {
        icon: pick(r, ['userPlus', 'building', 'radio', 'gift', 'award']),
        text: pick(r, ['New host **John Doe** registered', 'Agency **StarConnect** created', 'Host **Priya Sharma** went live', '**1,000 coins** gifted in live room', 'New user **Rahul Kumar** registered']),
        time: timeAgo(r),
      }
    }),
    alerts: [
      { text: 'High server load on live service', time: '2 mins ago', severity: 'Critical' },
      { text: 'Payment gateway latency detected', time: '10 mins ago', severity: 'Warning' },
      { text: 'New app version 3.1.0 deployed', time: '1 hour ago', severity: 'Info' },
      { text: 'Backup completed successfully', time: '2 hours ago', severity: 'Info' },
      { text: 'Domain SSL certificate expires in 12 days', time: '1 day ago', severity: 'Warning' },
    ],
  },
  agency: {
    stats: [
      { key: 'My Hosts', value: '48', delta: 6.1, dir: 'up', icon: 'video', tile: 'tile-green' },
      { key: 'Live Now', value: '11', delta: 3.0, dir: 'up', icon: 'radio', tile: 'tile-pink' },
      { key: 'Coins This Month', value: '4,82,300', delta: 9.4, dir: 'up', icon: 'coins', tile: 'tile-orange' },
      { key: 'Est. Payout', value: '₹1,24,500', delta: 2.2, dir: 'down', icon: 'wallet', tile: 'tile-blue' },
    ],
    hostPerf: hosts.slice(0, 6).map((h) => ({ name: h.name, coins: h.coins, hours: h.liveHours })),
    coinSeries: [12, 18, 15, 22, 20, 28, 25, 33, 30, 38, 35, 44, 40, 50, 48, 58, 55, 63, 60, 70, 66, 75, 72, 82, 78, 88, 84, 95, 90, 100],
    activities: Array.from({ length: 5 }, (_, i) => {
      const r = rng(12000 + i)
      return {
        icon: pick(r, ['userPlus', 'radio', 'gift', 'award', 'userCheck']),
        text: pick(r, ['Host **Neha Singh** hit 10K coins today', 'New application from **Arjun Malik**', 'Host **Riya Mehta** went live', 'Sub-admin assigned 3 hosts', '**5,000 coins** gifted to your hosts']),
        time: timeAgo(r),
      }
    }),
  },
  super: {
    stats: [
      { key: 'Admin Accounts', value: '12', delta: 0, dir: 'up', icon: 'shield', tile: 'tile-purple' },
      { key: 'System Uptime', value: '99.98%', delta: 0.1, dir: 'up', icon: 'activity', tile: 'tile-green' },
      { key: 'API Requests (24h)', value: '4.2M', delta: 11.3, dir: 'up', icon: 'server', tile: 'tile-blue' },
      { key: 'Open Incidents', value: '2', delta: 1, dir: 'down', icon: 'flag', tile: 'tile-red' },
    ],
    services: [
      { name: 'API Gateway', status: 'Operational', latency: '82ms', uptime: '99.99%' },
      { name: 'Live Streaming (RTMP)', status: 'Degraded', latency: '410ms', uptime: '99.82%' },
      { name: 'Payments Service', status: 'Operational', latency: '120ms', uptime: '99.97%' },
      { name: 'Media Storage (S3)', status: 'Operational', latency: '60ms', uptime: '100%' },
      { name: 'Push Notifications', status: 'Operational', latency: '95ms', uptime: '99.95%' },
      { name: 'Database (Primary)', status: 'Operational', latency: '18ms', uptime: '99.99%' },
    ],
    reqSeries: [120, 140, 135, 160, 155, 180, 175, 200, 190, 220, 210, 240, 230, 260, 250, 280, 270, 300, 290, 320, 300, 340, 330, 360],
    activities: Array.from({ length: 5 }, (_, i) => {
      const r = rng(13000 + i)
      return {
        icon: pick(r, ['shield', 'server', 'key', 'refresh', 'globe']),
        text: pick(r, ['Admin **Rahul Kumar** signed in', 'Config **payment.gateway** updated', 'SSL cert renewed for **stonelivepro.com**', 'Nightly backup completed', 'New API key issued to **Analytics**']),
        time: timeAgo(r),
      }
    }),
  },
}

/* infrastructure inventory (super admin) */
export const infrastructure = [
  { id: 'INF1', category: 'Cloud / Server', name: 'AWS ap-south-1 — EKS cluster', provider: 'Amazon Web Services', plan: 'm5.xlarge ×6', renews: '01 Jan 2027', status: 'Active', owner: 'DevOps' },
  { id: 'INF2', category: 'Domain', name: 'stonelivepro.com', provider: 'GoDaddy', plan: 'Annual', renews: '12 Sep 2026', status: 'Renew Soon', owner: 'Client' },
  { id: 'INF3', category: 'Hosting Account', name: 'CDN + Object Storage', provider: 'Cloudflare + AWS S3', plan: 'Business', renews: '01 Feb 2027', status: 'Active', owner: 'DevOps' },
  { id: 'INF4', category: 'Email / Gmail', name: 'admin@stonelivepro.com', provider: 'Google Workspace', plan: '5 seats', renews: '01 Nov 2026', status: 'Active', owner: 'Client' },
  { id: 'INF5', category: 'Third-party Service', name: 'Agora — Live Video SDK', provider: 'Agora.io', plan: 'Pay-as-you-go', renews: 'Monthly', status: 'Active', owner: 'Client' },
  { id: 'INF6', category: 'Third-party Service', name: 'Razorpay — Payments', provider: 'Razorpay', plan: 'Standard', renews: 'Monthly', status: 'Active', owner: 'Client' },
  { id: 'INF7', category: 'API Account', name: 'Firebase — Push / Auth', provider: 'Google Firebase', plan: 'Blaze', renews: 'Monthly', status: 'Active', owner: 'DevOps' },
  { id: 'INF8', category: 'API Account', name: 'Twilio — OTP / SMS', provider: 'Twilio', plan: 'Pay-as-you-go', renews: 'Monthly', status: 'Active', owner: 'Client' },
  { id: 'INF9', category: 'Third-party Service', name: 'Sumsub — KYC Verification', provider: 'Sumsub', plan: 'Growth', renews: '01 Dec 2026', status: 'Active', owner: 'Client' },
]

/* integrations */
export const integrations = [
  { id: 'ITG1', name: 'Razorpay', kind: 'Payments', keyId: 'rzp_live_••••7Q2a', mode: 'Live', status: 'Connected' },
  { id: 'ITG2', name: 'Agora', kind: 'Live Video', keyId: 'ag_••••4f1c', mode: 'Live', status: 'Connected' },
  { id: 'ITG3', name: 'Firebase', kind: 'Push / Auth', keyId: 'AIza••••_kR9', mode: 'Live', status: 'Connected' },
  { id: 'ITG4', name: 'Twilio', kind: 'SMS / OTP', keyId: 'AC••••d21e', mode: 'Live', status: 'Connected' },
  { id: 'ITG5', name: 'Sumsub', kind: 'KYC', keyId: 'sbx_••••9a', mode: 'Live', status: 'Connected' },
  { id: 'ITG6', name: 'Google Analytics', kind: 'Analytics', keyId: 'G-••••XY12', mode: 'Live', status: 'Connected' },
  { id: 'ITG7', name: 'AppsFlyer', kind: 'Attribution', keyId: '—', mode: 'Test', status: 'Disconnected' },
]

export const backups = Array.from({ length: 12 }, (_, i) => {
  const r = rng(14000 + i)
  return {
    id: 'BKP' + String(700 + i),
    scope: pick(r, ['Full DB', 'Full DB', 'Media', 'Config']),
    size: int(r, 2, 48) + ' GB',
    location: pick(r, ['S3 ap-south-1', 'S3 us-east-1 (DR)']),
    started: dateStr(r, 12),
    duration: int(r, 4, 55) + 'm',
    status: pick(r, ['Success', 'Success', 'Success', 'Failed']),
  }
})

/* reports summary */
export const reports = {
  kpis: [
    { k: 'Gross Revenue (MTD)', v: '₹42.8L', d: 12.4, dir: 'up' },
    { k: 'Net Payouts (MTD)', v: '₹18.1L', d: 6.7, dir: 'up' },
    { k: 'New Users (MTD)', v: '18,204', d: 9.1, dir: 'up' },
    { k: 'Avg. Session', v: '24m 12s', d: 3.2, dir: 'down' },
    { k: 'Host Retention (30d)', v: '71.4%', d: 1.8, dir: 'up' },
    { k: 'Refund Rate', v: '0.9%', d: 0.2, dir: 'down' },
  ],
  revenueByMonth: [180, 210, 240, 220, 280, 260, 320, 300, 360, 340, 420, 428],
  months: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
  channelSplit: [
    { label: 'In-App (Android)', value: 48, color: '#7c3aed' },
    { label: 'In-App (iOS)', value: 27, color: '#3b82f6' },
    { label: 'Web / UPI', value: 18, color: '#22a06b' },
    { label: 'Partner', value: 7, color: '#f59e0b' },
  ],
}

export { num, compact }

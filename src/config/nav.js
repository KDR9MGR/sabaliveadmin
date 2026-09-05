/* Sidebar structure for each panel. `to` is an absolute route path. */

export const PANELS = {
  super: {
    key: 'super', label: 'Super Admin', short: 'Super Admin', base: '/super',
    tagline: 'System administration', color: '#4f46e5', icon: 'shield',
    scope: 'Full system control — admin accounts, infrastructure, security, global config.',
  },
  master: {
    // identity colour follows the live brand colour (see AppLayout); this is the fallback / login dot
    key: 'master', label: 'Master / Admin', short: 'Master', base: '/admin',
    tagline: 'Application management', color: '#7c3aed', icon: 'shieldUser',
    scope: 'Runs the app day to day — users, agencies, hosts, coins, content, app settings.',
  },
  agency: {
    key: 'agency', label: 'Agency / Manager', short: 'Agency', base: '/agency',
    tagline: 'Agency operations', color: '#16a34a', icon: 'building',
    scope: 'Manages one agency — its hosts, assignments, sub-admins, earnings and payouts.',
  },
}

export const NAV = {
  master: [
    { section: 'Overview', items: [
      { label: 'Dashboard', icon: 'dashboard', to: '/admin' },
    ]},
    { section: 'Management', items: [
      { label: 'User Management', icon: 'users', children: [
        { label: 'All Users', to: '/admin/users' },
        { label: 'Hosts / Creators', to: '/admin/users/hosts' },
        { label: 'Sub Admins', to: '/admin/users/sub-admins' },
        { label: 'User IDs', to: '/admin/users/ids' },
        { label: 'Account Status', to: '/admin/users/status' },
        { label: 'Transfer Requests', to: '/admin/users/transfers' },
      ]},
      { label: 'Admin Management', icon: 'shieldUser', children: [
        { label: 'Admins', to: '/admin/admins' },
        { label: 'Sub Admins', to: '/admin/admins/sub-admins' },
        { label: 'Agencies', to: '/admin/admins/agencies' },
        { label: 'Roles & Permissions', to: '/admin/admins/roles' },
      ]},
      { label: 'Agency Management', icon: 'building', children: [
        { label: 'Agencies', to: '/admin/agencies' },
        { label: 'Agency Requests', to: '/admin/agencies/requests' },
        { label: 'Commission Plans', to: '/admin/agencies/commission' },
      ]},
      { label: 'Host Management', icon: 'video', children: [
        { label: 'Hosts', to: '/admin/hosts' },
        { label: 'Host Assignment', to: '/admin/hosts/assignment' },
        { label: 'Applications', to: '/admin/hosts/applications' },
      ]},
    ]},
    { section: 'Monetisation', items: [
      { label: 'Coin & Gift', icon: 'coins', children: [
        { label: 'Gift Settings', to: '/admin/coins/gifts' },
        { label: 'Coin Packages', to: '/admin/coins/packages' },
        { label: 'Transactions', to: '/admin/coins/transactions' },
        { label: 'Gift History', to: '/admin/coins/gift-history' },
        { label: 'Transfer Coins', to: '/admin/coins/transfer' },
        { label: 'Transfer History', to: '/admin/coins/transfer-history' },
      ]},
      { label: 'Withdrawals', icon: 'wallet', to: '/admin/withdrawals' },
      { label: 'Salary', icon: 'fileText', to: '/admin/salary' },
      { label: 'Reports & Analytics', icon: 'chart', to: '/admin/reports' },
    ]},
    { section: 'Platform', items: [
      { label: 'Live Requests', icon: 'radio', to: '/admin/live' },
      { label: 'Badge Management', icon: 'award', to: '/admin/badges' },
      { label: 'Leaderboard Frame', icon: 'trophy', to: '/admin/leaderboard' },
      { label: 'Profile Frame', icon: 'frame', to: '/admin/frames' },
      { label: 'Content / Settings', icon: 'fileText', children: [
        { label: 'Banners', to: '/admin/content/banners' },
        { label: 'Legal Pages', to: '/admin/content/pages' },
        { label: 'Announcements', to: '/admin/content/announcements' },
      ]},
      { label: 'Application Config', icon: 'sliders', to: '/admin/config' },
      { label: 'System Management', icon: 'server', to: '/admin/system' },
    ]},
    { section: 'Account', items: [
      { label: 'My Profile', icon: 'user', to: '/admin/profile' },
    ]},
  ],

  agency: [
    { section: 'Overview', items: [
      { label: 'Dashboard', icon: 'dashboard', to: '/agency' },
      { label: 'My Agency', icon: 'building', to: '/agency/profile-agency' },
    ]},
    { section: 'Operations', items: [
      { label: 'Host Management', icon: 'video', children: [
        { label: 'Hosts', to: '/agency/hosts' },
        { label: 'Host Profiles', to: '/agency/hosts/profiles' },
        { label: 'Applications', to: '/agency/hosts/applications' },
      ]},
      { label: 'Assignments', icon: 'userCheck', to: '/agency/assignments' },
      { label: 'Sub Admins', icon: 'shieldUser', to: '/agency/sub-admins' },
    ]},
    { section: 'Performance', items: [
      { label: 'Statistics', icon: 'chart', to: '/agency/stats' },
      { label: 'Earnings', icon: 'wallet', to: '/agency/earnings' },
      { label: 'Salary', icon: 'fileText', to: '/agency/salary' },
    ]},
    { section: 'Account', items: [
      { label: 'Agency Account', icon: 'idCard', to: '/agency/account' },
      { label: 'My Profile', icon: 'user', to: '/agency/profile' },
    ]},
  ],

  super: [
    { section: 'Overview', items: [
      { label: 'Dashboard', icon: 'dashboard', to: '/super' },
    ]},
    { section: 'Administration', items: [
      { label: 'Admin Management', icon: 'shield', children: [
        { label: 'Admin Accounts', to: '/super/admins' },
        { label: 'Agency Staff', to: '/super/masters' },
        { label: 'Access Control', to: '/super/access' },
      ]},
      { label: 'Audit Logs', icon: 'fileText', to: '/super/audit' },
      { label: 'Security', icon: 'lock', to: '/super/security' },
    ]},
    { section: 'Infrastructure', items: [
      { label: 'System Overview', icon: 'activity', to: '/super/system' },
      { label: 'Infrastructure', icon: 'server', to: '/super/infrastructure' },
      { label: 'Integrations & APIs', icon: 'layers', to: '/super/integrations' },
      { label: 'Backups', icon: 'refresh', to: '/super/backups' },
    ]},
    { section: 'Configuration', items: [
      { label: 'Application Config', icon: 'sliders', to: '/super/config' },
    ]},
    { section: 'Account', items: [
      { label: 'My Profile', icon: 'user', to: '/super/profile' },
    ]},
  ],
}

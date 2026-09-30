/* Sidebar structure for each panel. `to` is an absolute route path. */

/* Where anyone who isn't signed in lands by default (/, /login, Master and Super
   Admin, and after signing out). Every login page signs in the same way and then
   sends the person to the panel their ROLE belongs to, so the Global Admin page
   works as the front door for all roles. */
export const DEFAULT_LOGIN_PATH = '/global-admin/login'

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
  'global-admin': {
    key: 'global-admin', label: 'Global Admin', short: 'Global Admin', base: '/global-admin',
    tagline: 'Global operations', color: '#16a34a', icon: 'globe',
    scope: 'Sees the whole tree — every country admin, sub admin, agency and host — and moves coins down through all of it.',
  },
  // The old "Agency / Manager" panel. It used to be filed under the key
  // 'global-admin'; renamed so "Global Admin" only ever means the top of the
  // Global > Country > Sub > Agency ladder. No role logs in here — superseded
  // by the Agency panel — and it is not offered in the panel switcher.
  'agency-manager': {
    key: 'agency-manager', label: 'Agency Manager (legacy)', short: 'Agency Mgr', base: '/agency-manager',
    tagline: 'Legacy agency panel', color: '#64748b', icon: 'briefcase',
    scope: 'Legacy agency-manager panel — superseded by the Agency panel. No role logs in here.',
  },

  // ---- New panels (additive; existing panels above are unchanged) ----
  'country-admin': {
    key: 'country-admin', label: 'Country Admin', short: 'Country Admin', base: '/country-admin',
    tagline: 'Country operations', color: '#0891b2', icon: 'flag',
    scope: 'Manages one country — its sub admins, agencies, hosts and the coin cascade down to them.',
  },
  'sub-admin': {
    key: 'sub-admin', label: 'Sub Admin', short: 'Sub Admin', base: '/sub-admin',
    tagline: 'Sub admin operations', color: '#ca8a04', icon: 'shieldUser',
    scope: 'Manages the agencies under it and the coin cascade one level down.',
  },
  'panel-agency': {
    key: 'panel-agency', label: 'Agency', short: 'Agency', base: '/panel-agency',
    tagline: 'Agency operations', color: '#dc2626', icon: 'building',
    scope: 'Manages hosts, users and live requests for one agency.',
  },
}

export const NAV = {
  master: [
    { section: 'Overview', items: [
      { label: 'Dashboard', icon: 'dashboard', to: '/admin' },
    ]},
    { section: 'Management', items: [
      { label: 'User Management', icon: 'users', cap: 'manage_users', children: [
        { label: 'All Users', to: '/admin/users' },
        { label: 'Hosts / Creators', to: '/admin/users/hosts' },
        { label: 'Sub Admins', to: '/admin/users/sub-admins' },
        { label: 'User IDs', to: '/admin/users/ids' },
        { label: 'Account Status', to: '/admin/users/status' },
        { label: 'Transfer Requests', to: '/admin/users/transfers' },
        { label: 'Transfer Host', to: '/admin/users/transfer-host' },
        { label: 'Transfer Agency', to: '/admin/users/transfer-agency' },
        { label: 'Transfer Sub Admin', to: '/admin/users/transfer-sub-admin' },
        { label: 'Transfer Country', to: '/admin/users/transfer-country' },
      ]},
      { label: 'Admin Management', icon: 'shieldUser', cap: 'manage_admins', children: [
        { label: 'Admins', to: '/admin/admins' },
        { label: 'Global Admin', to: '/admin/admins/global-admin' },
        { label: 'Country Admin', to: '/admin/admins/country-admin' },
        { label: 'Sub Admin', to: '/admin/admins/sub-admin' },
        { label: 'Agency', to: '/admin/admins/agency' },
        { label: 'Roles & Permissions', to: '/admin/admins/roles' },
      ]},
      { label: 'Agency Management', icon: 'building', cap: 'manage_agencies', children: [
        { label: 'Agencies', to: '/admin/agencies' },
        { label: 'Agency Requests', to: '/admin/agencies/requests' },
        { label: 'Commission Plans', to: '/admin/agencies/commission' },
      ]},
      { label: 'Host Management', icon: 'video', cap: 'manage_hosts', children: [
        { label: 'Hosts', to: '/admin/hosts' },
        { label: 'Host Assignment', to: '/admin/hosts/assignment' },
        { label: 'Applications', to: '/admin/hosts/applications' },
        { label: 'KYC Review', to: '/admin/hosts/kyc' },
        { label: 'Host Codes', to: '/admin/hosts/codes' },
      ]},
    ]},
    { section: 'Monetisation', items: [
      { label: 'Coin & Gift', icon: 'coins', cap: 'manage_coins', children: [
        { label: 'Gift Settings', to: '/admin/coins/gifts' },
        { label: 'Coin Packages', to: '/admin/coins/packages' },
        { label: 'Transactions', to: '/admin/coins/transactions' },
        { label: 'Gift History', to: '/admin/coins/gift-history' },
        { label: 'Transfer Coins', to: '/admin/coins/transfer' },
        { label: 'Transfer History', to: '/admin/coins/transfer-history' },
      ]},
      { label: 'Withdrawals', icon: 'wallet', cap: 'run_payroll', to: '/admin/withdrawals' },
      { label: 'Salary', icon: 'fileText', cap: 'run_payroll', to: '/admin/salary' },
      { label: 'Reports & Analytics', icon: 'chart', to: '/admin/reports' },
    ]},
    { section: 'Platform', items: [
      { label: 'Live Requests', icon: 'radio', to: '/admin/live' },
      { label: 'Lucky Box', icon: 'gift', to: '/admin/lucky-box' },
      { label: 'Badge Management', icon: 'award', to: '/admin/badges' },
      { label: 'Leaderboard Frame', icon: 'trophy', to: '/admin/leaderboard' },
      { label: 'Profile Frame', icon: 'frame', to: '/admin/frames' },
      { label: 'Content / Settings', icon: 'fileText', children: [
        { label: 'Banners', to: '/admin/content/banners' },
        { label: 'Legal Pages', to: '/admin/content/pages' },
        { label: 'Announcements', to: '/admin/content/announcements' },
      ]},
      { label: 'Application Config', icon: 'sliders', cap: 'edit_config', to: '/admin/config' },
      { label: 'System Management', icon: 'server', to: '/admin/system' },
    ]},
    { section: 'Account', items: [
      { label: 'My Profile', icon: 'user', to: '/admin/profile' },
    ]},
  ],

  'global-admin': [
    { section: 'Overview', items: [
      { label: 'Dashboard', icon: 'dashboard', to: '/global-admin' },
    ]},
    { section: 'Management', items: [
      { label: 'User Management', icon: 'users', children: [
        { label: 'Users', to: '/global-admin/user-management/users' },
        { label: 'Hosts', to: '/global-admin/user-management/hosts' },
        { label: 'Transfer Host', to: '/global-admin/user-management/transfer-host' },
        { label: 'Transfer Agency', to: '/global-admin/user-management/transfer-agency' },
        { label: 'Transfer Sub Admin', to: '/global-admin/user-management/transfer-sub-admin' },
        { label: 'Transfer Country', to: '/global-admin/user-management/transfer-country' },
      ]},
      { label: 'Admin Management', icon: 'shieldUser', children: [
        { label: 'Country Admin', to: '/global-admin/admin-management/country-admin' },
        { label: 'Sub Admin', to: '/global-admin/admin-management/sub-admin' },
        { label: 'Agency', to: '/global-admin/admin-management/agency' },
      ]},
      { label: 'Coin Management', icon: 'coins', children: [
        { label: 'Transfer Coins', to: '/global-admin/coin-management/transfer-coins' },
        { label: 'History of Coin Transfer to Country Admin', to: '/global-admin/coin-management/history-country-admin' },
        { label: 'History of Coin Transfer to Sub Admin', to: '/global-admin/coin-management/history-sub-admin' },
        { label: 'History of Coin Transfer to Agency', to: '/global-admin/coin-management/history-agency' },
        { label: 'History of Coin Transfer to User', to: '/global-admin/coin-management/history-user' },
      ]},
    ]},
    { section: 'Platform', items: [
      { label: 'Badge Management', icon: 'award', to: '/global-admin/badges' },
      { label: 'Leaderboard Frame', icon: 'trophy', to: '/global-admin/leaderboard' },
      { label: 'Live Request', icon: 'radio', to: '/global-admin/live-request' },
      { label: 'Salary', icon: 'wallet', to: '/global-admin/salary' },
      { label: 'Profile Frame', icon: 'frame', to: '/global-admin/profile-frame' },
    ]},
    { section: 'Account', items: [
      { label: 'My Profile', icon: 'user', to: '/global-admin/profile' },
    ]},
  ],

  'agency-manager': [
    { section: 'Overview', items: [
      { label: 'Dashboard', icon: 'dashboard', to: '/agency-manager' },
      { label: 'My Agency', icon: 'building', to: '/agency-manager/profile-agency' },
    ]},
    { section: 'Operations', items: [
      { label: 'Host Management', icon: 'video', children: [
        { label: 'Hosts', to: '/agency-manager/hosts' },
        { label: 'Host Profiles', to: '/agency-manager/hosts/profiles' },
        { label: 'Applications', to: '/agency-manager/hosts/applications' },
        { label: 'Host Codes', to: '/agency-manager/hosts/codes' },
      ]},
      { label: 'Assignments', icon: 'userCheck', to: '/agency-manager/assignments' },
      { label: 'Sub Admins', icon: 'shieldUser', to: '/agency-manager/sub-admins' },
    ]},
    { section: 'Performance', items: [
      { label: 'Statistics', icon: 'chart', to: '/agency-manager/stats' },
      { label: 'Earnings', icon: 'wallet', to: '/agency-manager/earnings' },
      { label: 'Salary', icon: 'fileText', to: '/agency-manager/salary' },
    ]},
    { section: 'Account', items: [
      { label: 'Agency Account', icon: 'idCard', to: '/agency-manager/account' },
      { label: 'My Profile', icon: 'user', to: '/agency-manager/profile' },
    ]},
  ],

  super: [
    { section: 'Overview', items: [
      { label: 'Dashboard', icon: 'dashboard', to: '/super' },
    ]},
    { section: 'User Management', items: [
      { label: 'Users', icon: 'users', to: '/super/users' },
    ]},
    { section: 'Administration', items: [
      { label: 'Admin Management', icon: 'shield', cap: 'manage_admins', children: [
        { label: 'Admin Accounts', to: '/super/admins' },
        { label: 'Access Control', to: '/super/access' },
      ]},
      { label: 'Audit Logs', icon: 'fileText', cap: 'view_audit', to: '/super/audit' },
      { label: 'Security', icon: 'lock', cap: 'view_audit', to: '/super/security' },
    ]},
    { section: 'Economy', items: [
      { label: 'Coin Treasury', icon: 'coins', cap: 'manage_coins', to: '/super/treasury' },
    ]},
    { section: 'Infrastructure', items: [
      { label: 'System Overview', icon: 'activity', cap: 'manage_infra', to: '/super/system' },
      { label: 'Infrastructure', icon: 'server', cap: 'manage_infra', to: '/super/infrastructure' },
      { label: 'Integrations & APIs', icon: 'layers', cap: 'manage_infra', to: '/super/integrations' },
      { label: 'Backups', icon: 'refresh', cap: 'manage_infra', to: '/super/backups' },
    ]},
    { section: 'Configuration', items: [
      { label: 'Application Config', icon: 'sliders', cap: 'edit_config', to: '/super/config' },
    ]},
    { section: 'Account', items: [
      { label: 'My Profile', icon: 'user', to: '/super/profile' },
    ]},
  ],

  // ---- New panels (additive; existing panels above are unchanged) ----
  'country-admin': [
    { section: 'Overview', items: [
      { label: 'Dashboard', icon: 'dashboard', to: '/country-admin' },
    ]},
    { section: 'Management', items: [
      { label: 'User Management', icon: 'users', children: [
        { label: 'Users', to: '/country-admin/user-management/users' },
        { label: 'Hosts', to: '/country-admin/user-management/hosts' },
        { label: 'Transfer Host', to: '/country-admin/user-management/transfer-host' },
        { label: 'Transfer Agency', to: '/country-admin/user-management/transfer-agency' },
        { label: 'Transfer Sub Admin', to: '/country-admin/user-management/transfer-sub-admin' },
      ]},
      { label: 'Admin Management', icon: 'shieldUser', children: [
        { label: 'Sub Admin', to: '/country-admin/admin-management/sub-admin' },
        { label: 'Agency', to: '/country-admin/admin-management/agency' },
      ]},
      { label: 'Coin Management', icon: 'coins', children: [
        { label: 'Transfer Coins', to: '/country-admin/coin-management/transfer-coins' },
        { label: 'History of Coin Transfer to Sub Admin', to: '/country-admin/coin-management/history-sub-admin' },
        { label: 'History of Coin Transfer to Agency', to: '/country-admin/coin-management/history-agency' },
        { label: 'History of Coin Transfer to User', to: '/country-admin/coin-management/history-user' },
      ]},
    ]},
    { section: 'Platform', items: [
      { label: 'Badge Management', icon: 'award', to: '/country-admin/badges' },
      { label: 'Leaderboard Frame', icon: 'trophy', to: '/country-admin/leaderboard' },
      { label: 'Live Request', icon: 'radio', to: '/country-admin/live-request' },
      { label: 'Salary', icon: 'wallet', to: '/country-admin/salary' },
      { label: 'Profile Frame', icon: 'frame', to: '/country-admin/profile-frame' },
    ]},
    { section: 'Account', items: [
      { label: 'My Profile', icon: 'user', to: '/country-admin/profile' },
    ]},
  ],

  'sub-admin': [
    { section: 'Overview', items: [
      { label: 'Dashboard', icon: 'dashboard', to: '/sub-admin' },
    ]},
    { section: 'Management', items: [
      { label: 'User Management', icon: 'users', children: [
        { label: 'Users', to: '/sub-admin/user-management/users' },
        { label: 'Hosts', to: '/sub-admin/user-management/hosts' },
      ]},
      { label: 'Admin Management', icon: 'shieldUser', children: [
        { label: 'Agency', to: '/sub-admin/admin-management/agency' },
      ]},
      { label: 'Coin Management', icon: 'coins', children: [
        { label: 'Transfer Coins', to: '/sub-admin/coin-management/transfer-coins' },
        { label: 'History of Coin Transfer to Agency', to: '/sub-admin/coin-management/history-agency' },
        { label: 'History of Coin Transfer to User', to: '/sub-admin/coin-management/history-user' },
      ]},
    ]},
    { section: 'Platform', items: [
      { label: 'Live Request', icon: 'radio', to: '/sub-admin/live-request' },
      { label: 'Salary', icon: 'wallet', to: '/sub-admin/salary' },
    ]},
    { section: 'Account', items: [
      { label: 'My Profile', icon: 'user', to: '/sub-admin/profile' },
    ]},
  ],

  'panel-agency': [
    { section: 'Overview', items: [
      { label: 'Dashboard', icon: 'dashboard', to: '/panel-agency' },
    ]},
    { section: 'Management', items: [
      { label: 'User Management', icon: 'users', children: [
        { label: 'Users', to: '/panel-agency/user-management/users' },
        { label: 'Hosts', to: '/panel-agency/user-management/hosts' },
      ]},
      { label: 'Coin Management', icon: 'coins', children: [
        { label: 'Transfer Coins', to: '/panel-agency/coin-management/transfer-coins' },
        { label: 'History of Coin Transfer to User', to: '/panel-agency/coin-management/history-user' },
      ]},
    ]},
    { section: 'Platform', items: [
      { label: 'Live Request', icon: 'radio', to: '/panel-agency/live-request' },
    ]},
    { section: 'Account', items: [
      { label: 'My Profile', icon: 'user', to: '/panel-agency/profile' },
    ]},
  ],
}

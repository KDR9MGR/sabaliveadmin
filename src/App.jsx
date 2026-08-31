import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui.jsx'
import { SettingsProvider } from './config/settings.jsx'
import AppLayout from './components/layout/AppLayout.jsx'

import MasterDashboard from './pages/master/Dashboard.jsx'
import { UsersList, HostsList, SubAdminsList, UserIds, AccountStatus, TransferRequests, UserProfile } from './pages/master/users.jsx'
import { Admins, AdminSubAdmins, AgenciesAdmin, RolesPermissions } from './pages/master/admins.jsx'
import { AgencyList, AgencyRequests, CommissionPlans, AgencyDetail } from './pages/master/agencies.jsx'
import { HostsMgmt, HostAssignment, HostApplications, HostDetail } from './pages/master/hosts.jsx'
import { GiftSettings, CoinPackages, Transactions, GiftHistory, TransferCoins, TransferHistory } from './pages/master/coins.jsx'
import { Banners, LegalPages, Announcements } from './pages/master/content.jsx'
import ApplicationConfig from './pages/master/config.jsx'
import { LiveRequests, BadgeManagement, LeaderboardFrame, ProfileFrame, Salary, Reports, SystemManagement } from './pages/master/platform.jsx'

import {
  AgencyDashboard, MyAgency, AgencyHosts, AgencyHostProfiles, AgencyApplications,
  AgencyAssignments, AgencySubAdmins, AgencyStats, AgencyEarnings, AgencySalary, AgencyAccount,
} from './pages/agency.jsx'

import {
  SuperDashboard, SuperAdmins, MasterAccounts, AccessControl, AuditLogs, SuperSecurity,
  SystemOverview, Infrastructure, Integrations, Backups,
} from './pages/super.jsx'

import { Profile, Login, NotFound } from './pages/shared.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* ---------------- Master / Admin ---------------- */}
          <Route path="/admin" element={<AppLayout panel="master" />}>
            <Route index element={<MasterDashboard />} />
            <Route path="users" element={<UsersList />} />
            <Route path="users/hosts" element={<HostsList />} />
            <Route path="users/sub-admins" element={<SubAdminsList />} />
            <Route path="users/ids" element={<UserIds />} />
            <Route path="users/status" element={<AccountStatus />} />
            <Route path="users/transfers" element={<TransferRequests />} />
            <Route path="users/:id" element={<UserProfile />} />

            <Route path="admins" element={<Admins />} />
            <Route path="admins/sub-admins" element={<AdminSubAdmins />} />
            <Route path="admins/agencies" element={<AgenciesAdmin />} />
            <Route path="admins/roles" element={<RolesPermissions />} />

            <Route path="agencies" element={<AgencyList />} />
            <Route path="agencies/requests" element={<AgencyRequests />} />
            <Route path="agencies/commission" element={<CommissionPlans />} />
            <Route path="agencies/:id" element={<AgencyDetail />} />

            <Route path="hosts" element={<HostsMgmt />} />
            <Route path="hosts/assignment" element={<HostAssignment />} />
            <Route path="hosts/applications" element={<HostApplications />} />
            <Route path="hosts/:id" element={<HostDetail />} />

            <Route path="coins/gifts" element={<GiftSettings />} />
            <Route path="coins/packages" element={<CoinPackages />} />
            <Route path="coins/transactions" element={<Transactions />} />
            <Route path="coins/gift-history" element={<GiftHistory />} />
            <Route path="coins/transfer" element={<TransferCoins />} />
            <Route path="coins/transfer-history" element={<TransferHistory />} />

            <Route path="salary" element={<Salary />} />
            <Route path="reports" element={<Reports />} />
            <Route path="live" element={<LiveRequests />} />
            <Route path="badges" element={<BadgeManagement />} />
            <Route path="leaderboard" element={<LeaderboardFrame />} />
            <Route path="frames" element={<ProfileFrame />} />

            <Route path="content/banners" element={<Banners />} />
            <Route path="content/pages" element={<LegalPages />} />
            <Route path="content/announcements" element={<Announcements />} />

            <Route path="config" element={<ApplicationConfig crumbRoot="Application Configuration" />} />
            <Route path="system" element={<SystemManagement />} />
            <Route path="profile" element={<Profile panel="Master / Admin" />} />
          </Route>

          {/* ---------------- Agency / Manager ---------------- */}
          <Route path="/agency" element={<AppLayout panel="agency" />}>
            <Route index element={<AgencyDashboard />} />
            <Route path="profile-agency" element={<MyAgency />} />
            <Route path="hosts" element={<AgencyHosts />} />
            <Route path="hosts/profiles" element={<AgencyHostProfiles />} />
            <Route path="hosts/applications" element={<AgencyApplications />} />
            <Route path="assignments" element={<AgencyAssignments />} />
            <Route path="sub-admins" element={<AgencySubAdmins />} />
            <Route path="stats" element={<AgencyStats />} />
            <Route path="earnings" element={<AgencyEarnings />} />
            <Route path="salary" element={<AgencySalary />} />
            <Route path="account" element={<AgencyAccount />} />
            <Route path="profile" element={<Profile panel="Agency / Manager" />} />
          </Route>

          {/* ---------------- Super Admin ---------------- */}
          <Route path="/super" element={<AppLayout panel="super" />}>
            <Route index element={<SuperDashboard />} />
            <Route path="admins" element={<SuperAdmins />} />
            <Route path="masters" element={<MasterAccounts />} />
            <Route path="access" element={<AccessControl />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="security" element={<SuperSecurity />} />
            <Route path="system" element={<SystemOverview />} />
            <Route path="infrastructure" element={<Infrastructure />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="backups" element={<Backups />} />
            <Route path="config" element={<ApplicationConfig crumbRoot="Application Configuration" />} />
            <Route path="profile" element={<Profile panel="Super Admin" />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
      </SettingsProvider>
    </BrowserRouter>
  )
}

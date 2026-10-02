import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui.jsx'
import { SettingsProvider } from './config/settings.jsx'
import { AuthProvider } from './lib/auth.jsx'
import { RequireAuth, RequirePanel, RequireCap, RootRedirect } from './components/guards.jsx'
import { DEFAULT_LOGIN_PATH } from './config/nav.js'
import { AgencyScopeProvider } from './lib/agencyScope.jsx'
import AppLayout from './components/layout/AppLayout.jsx'

import MasterDashboard from './pages/master/Dashboard.jsx'
import {
  UsersList, HostsList, SubAdminsList, UserIds, AccountStatus, TransferRequests, UserProfile,
  MasterTransferHost, MasterTransferAgency, MasterTransferSubAdmin, MasterTransferCountry,
} from './pages/master/users.jsx'
import {
  Admins, AddMasterAdmin, AdminSubAdmins, AgenciesAdmin, RolesPermissions,
  GlobalAdminAccounts, AddGlobalAdmin, MasterCountryAdmins, MasterAddCountryAdmin,
  MasterSubAdmins, MasterAddSubAdmin, MasterAgencies, MasterAddAgency,
} from './pages/master/admins.jsx'
import { AgencyList, AgencyRequests, CommissionPlans, AgencyDetail } from './pages/master/agencies.jsx'
import { HostsMgmt, HostAssignment, HostApplications, HostDetail, KycReview } from './pages/master/hosts.jsx'
import { HostCodes } from './pages/master/hostCodes.jsx'
import { GiftSettings, CoinPackages, Transactions, GiftHistory, TransferCoins, TransferHistory } from './pages/master/coins.jsx'
import { Banners, LegalPages, Announcements } from './pages/master/content.jsx'
import { FlaggedMessages } from './pages/master/flagged.jsx'
import { StoreItems, LiveEmojis } from './pages/master/store.jsx'
import { STORE_CATEGORY_KEYS } from './lib/store.js'
import ApplicationConfig from './pages/master/config.jsx'
import { LiveRequests, LuckyBox, BadgeManagement, LeaderboardFrame, ProfileFrame, Salary, Reports, SystemManagement } from './pages/master/platform.jsx'
import { Withdrawals } from './pages/master/withdrawals.jsx'

import {
  AgencyDashboard, MyAgency, AgencyHosts, AgencyHostProfiles, AgencyApplications,
  AgencyAssignments, AgencySubAdmins, AgencyStats, AgencyEarnings, AgencySalary, AgencyAccount,
  AgencyHostCodes,
} from './pages/agency.jsx'

import {
  SuperDashboard, SuperUsers, SuperAdmins, AddAdminAccount,
  AccessControl, AuditLogs, SuperSecurity,
  SystemOverview, Infrastructure, Integrations, Backups, CoinTreasury,
} from './pages/super.jsx'

import { Profile, NotFound } from './pages/shared.jsx'

import {
  CountryAdminDashboard, CountryUsers, CountryHosts, CountryTransferHost, CountryTransferAgency,
  CountryTransferSubAdmin, CountrySubAdmins, CountryAgencies, CountryAddSubAdmin, CountryAddAgency,
  CountryTransferCoins,
  CountryCoinHistorySubAdmin, CountryCoinHistoryAgency, CountryCoinHistoryUser, CountryBadges,
  CountryLeaderboard, CountryLiveRequest, CountrySalary, CountryProfileFrame, CountryProfile,
} from './pages/countryAdmin.jsx'
import {
  SubAdminDashboard, SubAdminUsers, SubAdminHosts, SubAdminAgencies, SubAdminAddAgency, SubAdminTransferCoins,
  SubAdminCoinHistoryAgency, SubAdminCoinHistoryUser, SubAdminSalary, SubAdminLiveRequests, SubAdminProfile,
} from './pages/subAdmin.jsx'
import {
  PanelAgencyDashboard, PanelAgencyUsers, PanelAgencyHosts, PanelAgencyTransferCoins,
  PanelAgencyCoinHistoryUser, PanelAgencyLiveRequest, PanelAgencyProfile,
} from './pages/panelAgency.jsx'
import {
  GlobalAdminDashboard, GlobalUsers, GlobalHosts, GlobalTransferHost, GlobalTransferAgency, GlobalTransferSubAdmin, GlobalTransferCountry,
  GlobalCountryAdmins, GlobalSubAdmins, GlobalAgencies, GlobalTransferCoins,
  GlobalAddCountryAdmin, GlobalAddSubAdmin, GlobalAddAgency,
  GlobalCoinHistoryCountryAdmin, GlobalCoinHistorySubAdmin, GlobalCoinHistoryAgency, GlobalCoinHistoryUser,
  GlobalBadges, GlobalLeaderboard, GlobalLiveRequest, GlobalSalary, GlobalProfileFrame, GlobalProfile,
} from './pages/globalAdmin.jsx'
import { GlobalAdminLogin, CountryAdminLogin, SubAdminLogin, AgencyLogin } from './pages/panelLogin.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
      <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          {/* the old generic /login now forwards to the default login (old links keep working) */}
          <Route path="/login" element={<Navigate to={DEFAULT_LOGIN_PATH} replace />} />
          <Route path="/global-admin/login" element={<GlobalAdminLogin />} />
          <Route path="/country-admin/login" element={<CountryAdminLogin />} />
          <Route path="/sub-admin/login" element={<SubAdminLogin />} />
          <Route path="/panel-agency/login" element={<AgencyLogin />} />

          {/* ---------------- Master / Admin ---------------- */}
          <Route path="/admin" element={
            <RequireAuth><RequirePanel panel="master"><AppLayout panel="master" /></RequirePanel></RequireAuth>
          }>
            <Route index element={<MasterDashboard />} />

            <Route element={<RequireCap cap="manage_users" />}>
              <Route path="users" element={<UsersList />} />
              <Route path="users/hosts" element={<HostsList />} />
              <Route path="users/sub-admins" element={<SubAdminsList />} />
              <Route path="users/ids" element={<UserIds />} />
              <Route path="users/flagged" element={<FlaggedMessages />} />
              <Route path="users/status" element={<AccountStatus />} />
              <Route path="users/transfers" element={<TransferRequests />} />
              <Route path="users/transfer-host" element={<MasterTransferHost />} />
              <Route path="users/transfer-agency" element={<MasterTransferAgency />} />
              <Route path="users/transfer-sub-admin" element={<MasterTransferSubAdmin />} />
              <Route path="users/transfer-country" element={<MasterTransferCountry />} />
              <Route path="users/:id" element={<UserProfile />} />
            </Route>

            <Route element={<RequireCap cap="manage_admins" />}>
              <Route path="admins" element={<Admins />} />
              <Route path="admins/add" element={<AddMasterAdmin />} />
              <Route path="admins/sub-admins" element={<AdminSubAdmins />} />
              <Route path="admins/agencies" element={<AgenciesAdmin />} />
              <Route path="admins/roles" element={<RolesPermissions />} />
              <Route path="admins/global-admin" element={<GlobalAdminAccounts />} />
              <Route path="admins/global-admin/add" element={<AddGlobalAdmin />} />
              <Route path="admins/country-admin" element={<MasterCountryAdmins />} />
              <Route path="admins/country-admin/add" element={<MasterAddCountryAdmin />} />
              <Route path="admins/sub-admin" element={<MasterSubAdmins />} />
              <Route path="admins/sub-admin/add" element={<MasterAddSubAdmin />} />
              <Route path="admins/agency" element={<MasterAgencies />} />
              <Route path="admins/agency/add" element={<MasterAddAgency />} />
            </Route>

            <Route element={<RequireCap cap="manage_agencies" />}>
              <Route path="agencies" element={<AgencyList />} />
              <Route path="agencies/requests" element={<AgencyRequests />} />
              <Route path="agencies/commission" element={<CommissionPlans />} />
              <Route path="agencies/:id" element={<AgencyDetail />} />
            </Route>

            <Route element={<RequireCap cap="manage_hosts" />}>
              <Route path="hosts" element={<HostsMgmt />} />
              <Route path="hosts/assignment" element={<HostAssignment />} />
              <Route path="hosts/applications" element={<HostApplications />} />
              <Route path="hosts/kyc" element={<KycReview />} />
              <Route path="hosts/codes" element={<HostCodes />} />
              <Route path="hosts/:id" element={<HostDetail />} />
            </Route>

            <Route element={<RequireCap cap="manage_coins" />}>
              {STORE_CATEGORY_KEYS.map((c) => <Route key={c} path={`store/${c}`} element={<StoreItems category={c} />} />)}
              <Route path="coins/gifts" element={<GiftSettings />} />
              <Route path="coins/packages" element={<CoinPackages />} />
              <Route path="coins/transactions" element={<Transactions />} />
              <Route path="coins/gift-history" element={<GiftHistory />} />
              <Route path="coins/transfer" element={<TransferCoins />} />
              <Route path="coins/transfer-history" element={<TransferHistory />} />
            </Route>

            <Route element={<RequireCap cap="run_payroll" />}>
              <Route path="salary" element={<Salary />} />
              <Route path="withdrawals" element={<Withdrawals />} />
            </Route>

            <Route path="reports" element={<Reports />} />
            <Route path="live" element={<LiveRequests />} />
            <Route path="lucky-box" element={<LuckyBox />} />
            <Route path="badges" element={<BadgeManagement />} />
            <Route path="leaderboard" element={<LeaderboardFrame />} />
            <Route path="frames" element={<ProfileFrame />} />

            <Route path="content/banners" element={<Banners />} />
            <Route path="content/pages" element={<LegalPages />} />
            <Route path="content/announcements" element={<Announcements />} />
            <Route path="content/emojis" element={<LiveEmojis />} />

            <Route element={<RequireCap cap="edit_config" />}>
              <Route path="config" element={<ApplicationConfig crumbRoot="Application Configuration" />} />
            </Route>
            <Route path="system" element={<SystemManagement />} />
            <Route path="profile" element={<Profile panel="Master / Admin" />} />
          </Route>

          {/* ---------------- Global Admin (top of Global > Country > Sub > Agency) ---------------- */}
          <Route path="/global-admin" element={
            <RequireAuth loginPath="/global-admin/login"><RequirePanel panel="global-admin"><AppLayout panel="global-admin" /></RequirePanel></RequireAuth>
          }>
            <Route index element={<GlobalAdminDashboard />} />
            <Route path="user-management/users" element={<GlobalUsers />} />
            <Route path="user-management/hosts" element={<GlobalHosts />} />
            <Route path="user-management/transfer-host" element={<GlobalTransferHost />} />
            <Route path="user-management/transfer-agency" element={<GlobalTransferAgency />} />
            <Route path="user-management/transfer-sub-admin" element={<GlobalTransferSubAdmin />} />
            <Route path="user-management/transfer-country" element={<GlobalTransferCountry />} />
            <Route path="admin-management/country-admin" element={<GlobalCountryAdmins />} />
            <Route path="admin-management/country-admin/add" element={<GlobalAddCountryAdmin />} />
            <Route path="admin-management/sub-admin" element={<GlobalSubAdmins />} />
            <Route path="admin-management/sub-admin/add" element={<GlobalAddSubAdmin />} />
            <Route path="admin-management/agency" element={<GlobalAgencies />} />
            <Route path="admin-management/agency/add" element={<GlobalAddAgency />} />
            <Route path="coin-management/transfer-coins" element={<GlobalTransferCoins />} />
            <Route path="coin-management/history-country-admin" element={<GlobalCoinHistoryCountryAdmin />} />
            <Route path="coin-management/history-sub-admin" element={<GlobalCoinHistorySubAdmin />} />
            <Route path="coin-management/history-agency" element={<GlobalCoinHistoryAgency />} />
            <Route path="coin-management/history-user" element={<GlobalCoinHistoryUser />} />
            <Route path="badges" element={<GlobalBadges />} />
            <Route path="leaderboard" element={<GlobalLeaderboard />} />
            <Route path="live-request" element={<GlobalLiveRequest />} />
            <Route path="salary" element={<GlobalSalary />} />
            <Route path="profile-frame" element={<GlobalProfileFrame />} />
            <Route path="profile" element={<GlobalProfile />} />
          </Route>

          {/* ---------------- Agency Manager (legacy — no role logs in here; was filed under 'global-admin') ---------------- */}
          <Route path="/agency-manager" element={
            <RequireAuth><RequirePanel panel="agency-manager"><AgencyScopeProvider><AppLayout panel="agency-manager" /></AgencyScopeProvider></RequirePanel></RequireAuth>
          }>
            <Route index element={<AgencyDashboard />} />
            <Route path="profile-agency" element={<MyAgency />} />
            <Route path="hosts" element={<AgencyHosts />} />
            <Route path="hosts/profiles" element={<AgencyHostProfiles />} />
            <Route path="hosts/applications" element={<AgencyApplications />} />
            <Route path="hosts/codes" element={<AgencyHostCodes />} />
            <Route path="assignments" element={<AgencyAssignments />} />
            <Route path="sub-admins" element={<AgencySubAdmins />} />
            <Route path="stats" element={<AgencyStats />} />
            <Route path="earnings" element={<AgencyEarnings />} />
            <Route path="salary" element={<AgencySalary />} />
            <Route path="account" element={<AgencyAccount />} />
            <Route path="profile" element={<Profile panel="Agency Manager" />} />
          </Route>

          {/* ---------------- Super Admin ---------------- */}
          <Route path="/super" element={
            <RequireAuth><RequirePanel panel="super"><AppLayout panel="super" /></RequirePanel></RequireAuth>
          }>
            <Route index element={<SuperDashboard />} />
            <Route path="users" element={<SuperUsers />} />

            <Route element={<RequireCap cap="manage_admins" />}>
              <Route path="admins" element={<SuperAdmins />} />
              <Route path="admins/add" element={<AddAdminAccount />} />
              <Route path="access" element={<AccessControl />} />
            </Route>

            <Route element={<RequireCap cap="manage_coins" />}>
              <Route path="treasury" element={<CoinTreasury />} />
            </Route>

            <Route element={<RequireCap cap="view_audit" />}>
              <Route path="audit" element={<AuditLogs />} />
              <Route path="security" element={<SuperSecurity />} />
            </Route>

            <Route element={<RequireCap cap="manage_infra" />}>
              <Route path="system" element={<SystemOverview />} />
              <Route path="infrastructure" element={<Infrastructure />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="backups" element={<Backups />} />
            </Route>

            <Route element={<RequireCap cap="edit_config" />}>
              <Route path="config" element={<ApplicationConfig crumbRoot="Application Configuration" />} />
            </Route>
            <Route path="profile" element={<Profile panel="Super Admin" />} />
          </Route>

          {/* ---------------- New panels (additive; existing panels above are unchanged) ---------------- */}
          {/* ---------------- Country Admin ---------------- */}
          <Route path="/country-admin" element={
            <RequireAuth loginPath="/country-admin/login"><RequirePanel panel="country-admin"><AppLayout panel="country-admin" /></RequirePanel></RequireAuth>
          }>
            <Route index element={<CountryAdminDashboard />} />
            <Route path="user-management/users" element={<CountryUsers />} />
            <Route path="user-management/hosts" element={<CountryHosts />} />
            <Route path="user-management/transfer-host" element={<CountryTransferHost />} />
            <Route path="user-management/transfer-agency" element={<CountryTransferAgency />} />
            <Route path="user-management/transfer-sub-admin" element={<CountryTransferSubAdmin />} />
            <Route path="admin-management/sub-admin" element={<CountrySubAdmins />} />
            <Route path="admin-management/sub-admin/add" element={<CountryAddSubAdmin />} />
            <Route path="admin-management/agency" element={<CountryAgencies />} />
            <Route path="admin-management/agency/add" element={<CountryAddAgency />} />
            <Route path="coin-management/transfer-coins" element={<CountryTransferCoins />} />
            <Route path="coin-management/history-sub-admin" element={<CountryCoinHistorySubAdmin />} />
            <Route path="coin-management/history-agency" element={<CountryCoinHistoryAgency />} />
            <Route path="coin-management/history-user" element={<CountryCoinHistoryUser />} />
            <Route path="badges" element={<CountryBadges />} />
            <Route path="leaderboard" element={<CountryLeaderboard />} />
            <Route path="live-request" element={<CountryLiveRequest />} />
            <Route path="salary" element={<CountrySalary />} />
            <Route path="profile-frame" element={<CountryProfileFrame />} />
            <Route path="profile" element={<CountryProfile />} />
          </Route>

          {/* ---------------- Sub Admin ---------------- */}
          <Route path="/sub-admin" element={
            <RequireAuth loginPath="/sub-admin/login"><RequirePanel panel="sub-admin"><AgencyScopeProvider><AppLayout panel="sub-admin" /></AgencyScopeProvider></RequirePanel></RequireAuth>
          }>
            <Route index element={<SubAdminDashboard />} />
            <Route path="user-management/users" element={<SubAdminUsers />} />
            <Route path="user-management/hosts" element={<SubAdminHosts />} />
            <Route path="admin-management/agency" element={<SubAdminAgencies />} />
            <Route path="admin-management/agency/add" element={<SubAdminAddAgency />} />
            <Route path="coin-management/transfer-coins" element={<SubAdminTransferCoins />} />
            <Route path="coin-management/history-agency" element={<SubAdminCoinHistoryAgency />} />
            <Route path="coin-management/history-user" element={<SubAdminCoinHistoryUser />} />
            <Route path="live-request" element={<SubAdminLiveRequests />} />
            <Route path="salary" element={<SubAdminSalary />} />
            <Route path="profile" element={<SubAdminProfile />} />
          </Route>

          {/* ---------------- Agency (new) ---------------- */}
          <Route path="/panel-agency" element={
            <RequireAuth loginPath="/panel-agency/login"><RequirePanel panel="panel-agency"><AgencyScopeProvider><AppLayout panel="panel-agency" /></AgencyScopeProvider></RequirePanel></RequireAuth>
          }>
            <Route index element={<PanelAgencyDashboard />} />
            <Route path="user-management/users" element={<PanelAgencyUsers />} />
            <Route path="user-management/hosts" element={<PanelAgencyHosts />} />
            <Route path="coin-management/transfer-coins" element={<PanelAgencyTransferCoins />} />
            <Route path="coin-management/history-user" element={<PanelAgencyCoinHistoryUser />} />
            <Route path="live-request" element={<PanelAgencyLiveRequest />} />
            <Route path="profile" element={<PanelAgencyProfile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
      </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  )
}

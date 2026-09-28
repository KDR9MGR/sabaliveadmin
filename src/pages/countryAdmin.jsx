/* Country Admin panel — new, additive. Sits between Admin and Sub Admin/
   Agency in the hierarchy; since there's no per-country data partition in
   the schema, its scope is platform-wide today — the same real data as
   Master/Admin, reused here under the new nav/URL rather than duplicated. */
import { PanelPlaceholder } from './panelsShared.jsx'
import { Profile } from './shared.jsx'
import MasterDashboard from './master/Dashboard.jsx'
import { UsersList, HostsList, TransferRequests } from './master/users.jsx'
import { TransferCoins, TransferHistory } from './master/coins.jsx'
import { LiveRequests, BadgeManagement, LeaderboardFrame, ProfileFrame, Salary } from './master/platform.jsx'
import { StaffAccountsPage } from './super.jsx'
import { AddStaffForm } from './addStaff.jsx'

const CR = ['Home']
const ADMIN_CR = [...CR, 'Admin Management']

export const CountryAdminDashboard = MasterDashboard

export const CountryUsers = UsersList
export const CountryHosts = HostsList
export const CountryTransferHost = TransferRequests
export const CountryTransferAgency = () => (
  <PanelPlaceholder
    title="Transfer Agency"
    crumbs={[...CR, 'User Management', 'Transfer Agency']}
    icon="arrowLeftRight"
    text="Agencies don't have a movable owner in the current schema — there's no sub admin/country tier above them yet, so there's nothing to reassign. Host and Sub Admin transfers below are real."
  />
)
export const CountryTransferSubAdmin = TransferRequests

export const CountrySubAdmins = () => (
  <StaffAccountsPage
    roles={['sub_admin']}
    grantRoleOpts={[{ value: 'sub_admin', label: 'Sub Admin' }]}
    title="Sub Admin"
    crumbLabel="Sub Admin"
    crumbRoot={ADMIN_CR}
    addPath="/country-admin/admin-management/sub-admin/add"
    intro="Sub Admin accounts need an agency selected — only a Super Admin can invite, grant, change or revoke a role."
  />
)
export const CountryAddSubAdmin = () => (
  <AddStaffForm
    title="Add Sub Admin"
    crumbRoot={[...ADMIN_CR, 'Sub Admin']}
    backTo="/country-admin/admin-management/sub-admin"
    roleOpts={[{ value: 'sub_admin', label: 'Sub Admin' }]}
  />
)

export const CountryAgencies = () => (
  <StaffAccountsPage
    roles={['agency_manager']}
    grantRoleOpts={[{ value: 'agency_manager', label: 'Agency' }]}
    title="Agency"
    crumbLabel="Agency"
    crumbRoot={ADMIN_CR}
    addPath="/country-admin/admin-management/agency/add"
    intro="Agency accounts need an agency selected — only a Super Admin can invite, grant, change or revoke a role."
  />
)
export const CountryAddAgency = () => (
  <AddStaffForm
    title="Add Agency"
    crumbRoot={[...ADMIN_CR, 'Agency']}
    backTo="/country-admin/admin-management/agency"
    roleOpts={[{ value: 'agency_manager', label: 'Agency' }]}
  />
)

export const CountryTransferCoins = TransferCoins
export const CountryCoinHistorySubAdmin = TransferHistory
export const CountryCoinHistoryAgency = TransferHistory
export const CountryCoinHistoryUser = TransferHistory

export const CountryBadges = BadgeManagement
export const CountryLeaderboard = LeaderboardFrame
export const CountryLiveRequest = LiveRequests
export const CountrySalary = Salary
export const CountryProfileFrame = ProfileFrame

export const CountryProfile = () => <Profile panel="Country Admin" />

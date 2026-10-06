/* Sub Admin panel — sits above Agency. A sub admin owns many agencies
   (agencies.sub_admin_id). Users / Hosts / Salary / Live Request reuse the
   Agency panel's agency-scoped pages (AgencyScopeProvider gives a switcher
   across the agencies they own). Admin Management and Coin Management are the
   shared cascade pages: coins move wallet-to-wallet, Sub Admin -> Agency ->
   User, and each direction has its own history. */
import { Profile } from './shared.jsx'
import { AgencyDashboard, AgencyHosts, AgencySalary, AgencyLiveRequests } from './agency.jsx'
import { UsersList, GrantableUsers } from './master/users.jsx'
import { AddAgencyForm } from './addAgency.jsx'
import { TransferCoinsPage, CoinHistoryPage, OwnedAgenciesPage, OWNED_AGENCY_KIND, USER_KIND } from './cascade.jsx'

const CR = ['Home']
const COIN_CR = [...CR, 'Coin Management']

export const SubAdminDashboard = () => <AgencyDashboard panel="sub-admin" />
/* Users is every user on the platform, same as Master / Global Admin / Country
   Admin (read-only — set_profile_status is admin-only in the database). Only
   the Agency panel stays scoped to its own hosts; a Sub Admin can own several
   agencies, so "just my hosts" was never a coherent scope here anyway. */
export const SubAdminUsers = () => <GrantableUsers crumbs={[...CR, 'User Management', 'Users']} />
export const SubAdminHosts = AgencyHosts

export const SubAdminAgencies = () => (
  <OwnedAgenciesPage crumbs={[...CR, 'Admin Management', 'Agency']} addPath="/sub-admin/admin-management/agency/add" />
)
/* A Sub Admin creates agencies they own, each with its own standalone login. */
export const SubAdminAddAgency = () => (
  <AddAgencyForm
    crumbRoot={[...CR, 'Admin Management', 'Agency']}
    backTo="/sub-admin/admin-management/agency"
    owner={{ mode: 'self' }}
  />
)

export const SubAdminTransferCoins = () => (
  <TransferCoinsPage
    crumbs={[...COIN_CR, 'Transfer Coins']}
    kinds={[OWNED_AGENCY_KIND, USER_KIND]}
  />
)
export const SubAdminCoinHistoryAgency = () => (
  <CoinHistoryPage title="History of Coin Transfer to Agency" crumbs={[...COIN_CR, 'History — Agency']} kind="agency" />
)
export const SubAdminCoinHistoryUser = () => (
  <CoinHistoryPage title="History of Coin Transfer to User" crumbs={[...COIN_CR, 'History — User']} kind="user" />
)

export const SubAdminSalary = AgencySalary
export const SubAdminLiveRequests = AgencyLiveRequests

export const SubAdminProfile = () => <Profile panel="Sub Admin" />

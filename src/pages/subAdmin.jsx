/* Sub Admin panel — sits above Agency. A sub admin owns many agencies
   (agencies.sub_admin_id). Users / Hosts / Salary / Live Request reuse the
   Agency panel's agency-scoped pages (AgencyScopeProvider gives a switcher
   across the agencies they own). Admin Management and Coin Management are the
   shared cascade pages: coins move wallet-to-wallet, Sub Admin -> Agency ->
   User, and each direction has its own history. */
import { Profile } from './shared.jsx'
import { AgencyDashboard, AgencyHostProfiles, AgencyHosts, AgencySalary, AgencyLiveRequests } from './agency.jsx'
import { TransferCoinsPage, CoinHistoryPage, OwnedAgenciesPage, OWNED_AGENCY_KIND, USER_KIND } from './cascade.jsx'

const CR = ['Home']
const COIN_CR = [...CR, 'Coin Management']

export const SubAdminDashboard = () => <AgencyDashboard panel="sub-admin" />
export const SubAdminUsers = AgencyHostProfiles
export const SubAdminHosts = AgencyHosts

export const SubAdminAgencies = () => <OwnedAgenciesPage crumbs={[...CR, 'Admin Management', 'Agency']} />

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

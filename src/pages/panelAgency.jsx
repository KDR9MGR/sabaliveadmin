/* Agency panel (new) — reuses the existing Agency panel's real,
   agency-scoped data layer (AgencyScopeProvider + lib/agency.js). Coin
   Management uses the shared cascade pages: an agency spends its own wallet
   balance (funded by its Sub Admin) on users. */
import { Profile } from './shared.jsx'
import { AgencyDashboard, AgencyHostProfiles, AgencyHosts, AgencyLiveRequests } from './agency.jsx'
import { TransferCoinsPage, CoinHistoryPage, USER_KIND } from './cascade.jsx'

const COIN_CR = ['Home', 'Coin Management']

export const PanelAgencyDashboard = () => <AgencyDashboard panel="panel-agency" />
export const PanelAgencyUsers = AgencyHostProfiles
export const PanelAgencyHosts = AgencyHosts

export const PanelAgencyTransferCoins = () => (
  <TransferCoinsPage crumbs={[...COIN_CR, 'Transfer Coins']} kinds={[USER_KIND]} />
)
export const PanelAgencyCoinHistoryUser = () => (
  <CoinHistoryPage title="History of Coin Transfer to User" crumbs={[...COIN_CR, 'History — User']} kind="user" />
)

export const PanelAgencyLiveRequest = AgencyLiveRequests

export const PanelAgencyProfile = () => <Profile panel="Agency" />

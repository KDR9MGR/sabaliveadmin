/* Sub Admin panel — new, additive. Reuses the existing Agency panel's real,
   agency-scoped data layer (AgencyScopeProvider + lib/agency.js) rather than
   duplicating it — a sub_admin account is already scoped the same way
   today. Multi-agency oversight isn't in the schema yet (one sub_admin =
   one agency, same as an agency_manager), so "Coin History to Agency"
   stays an honest placeholder — agencies don't hold a coin balance
   themselves, only user wallets do. */
import { PanelPlaceholder } from './panelsShared.jsx'
import { Profile } from './shared.jsx'
import { AgencyDashboard, AgencyHostProfiles, AgencyHosts, MyAgency, AgencySalary, AgencyTransferCoins, AgencyCoinHistory } from './agency.jsx'

const CR = ['Home']

export const SubAdminDashboard = AgencyDashboard
export const SubAdminUsers = AgencyHostProfiles
export const SubAdminHosts = AgencyHosts

export const SubAdminAgencies = MyAgency

export const SubAdminTransferCoins = AgencyTransferCoins
export const SubAdminCoinHistoryAgency = () => (
  <PanelPlaceholder title="History of Coin Transfer to Agency" crumbs={[...CR, 'Coin Management', 'History — Agency']} icon="fileText"
    text="Agencies don't hold a coin balance themselves — only user wallets do — so there's nothing to show here. Coin transfers to users are real; see History — User." />
)
export const SubAdminCoinHistoryUser = AgencyCoinHistory

export const SubAdminSalary = AgencySalary

export const SubAdminProfile = () => <Profile panel="Sub Admin" />

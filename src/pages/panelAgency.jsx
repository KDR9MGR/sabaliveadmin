/* Agency panel (new) — new, additive. Reuses the existing Agency panel's
   real, agency-scoped data layer (AgencyScopeProvider + lib/agency.js)
   rather than duplicating it. */
import { Profile } from './shared.jsx'
import { AgencyDashboard, AgencyHostProfiles, AgencyHosts, AgencyHostCodes, AgencyTransferCoins, AgencyCoinHistory } from './agency.jsx'

export const PanelAgencyDashboard = () => <AgencyDashboard panel="panel-agency" />
export const PanelAgencyUsers = AgencyHostProfiles
export const PanelAgencyHosts = AgencyHosts

export const PanelAgencyTransferCoins = AgencyTransferCoins
export const PanelAgencyCoinHistoryUser = AgencyCoinHistory

export const PanelAgencyLiveRequest = AgencyHostCodes

export const PanelAgencyProfile = () => <Profile panel="Agency" />

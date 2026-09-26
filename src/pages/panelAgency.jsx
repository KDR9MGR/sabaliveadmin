/* Agency panel (new) — new, additive, layout only (see panelsShared.jsx).
   Distinct from the existing /agency panel; this one sits at the bottom of
   the new Country Admin > Sub Admin > Agency hierarchy. */
import { PageHeader, Card } from '../components/ui.jsx'
import { StatGrid } from './_templates.jsx'
import { PanelPlaceholder } from './panelsShared.jsx'
import { Profile } from './shared.jsx'

const CR = ['Home']

export function PanelAgencyDashboard() {
  const stats = [
    { key: 'Hosts', value: 0, icon: 'video', tile: 'tile-green' },
    { key: 'Total Gifting (this month)', value: 0, icon: 'gift', tile: 'tile-blue' },
  ]
  return (
    <>
      <PageHeader title="Dashboard" crumbs={CR} />
      <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
        Agency overview — layout only, tiles show placeholder counts until wired to real data.
      </div></Card>
      <StatGrid stats={stats} />
    </>
  )
}

export const PanelAgencyUsers = () => <PanelPlaceholder title="Users" crumbs={[...CR, 'User Management', 'Users']} icon="users" />
export const PanelAgencyHosts = () => <PanelPlaceholder title="Hosts" crumbs={[...CR, 'User Management', 'Hosts']} icon="video" />

export const PanelAgencyTransferCoins = () => <PanelPlaceholder title="Transfer Coins" crumbs={[...CR, 'Coin Management', 'Transfer Coins']} icon="coins" text="Send coins to a user." />
export const PanelAgencyCoinHistoryUser = () => <PanelPlaceholder title="History of Coin Transfer to User" crumbs={[...CR, 'Coin Management', 'History — User']} icon="fileText" />

export const PanelAgencyLiveRequest = () => <PanelPlaceholder title="Live Request" crumbs={[...CR, 'Live Request']} icon="radio" text="Approve or reject requests to go live." />

export const PanelAgencyProfile = () => <Profile panel="Agency" />

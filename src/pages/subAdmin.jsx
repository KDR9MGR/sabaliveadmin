/* Sub Admin panel — new, additive, layout only (see panelsShared.jsx).
   Sits between Country Admin and Agency: manages agencies under it, and
   the coin cascade one level down. */
import { PageHeader, Card } from '../components/ui.jsx'
import { StatGrid } from './_templates.jsx'
import { PanelPlaceholder } from './panelsShared.jsx'
import { Profile } from './shared.jsx'

const CR = ['Home']

export function SubAdminDashboard() {
  const stats = [
    { key: 'Hosts', value: 0, icon: 'video', tile: 'tile-green' },
    { key: 'Agency', value: 0, icon: 'building', tile: 'tile-red' },
    { key: 'Total Gifting (this month)', value: 0, icon: 'gift', tile: 'tile-blue' },
  ]
  return (
    <>
      <PageHeader title="Dashboard" crumbs={CR} />
      <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
        Sub Admin overview — layout only, tiles show placeholder counts until wired to real data.
      </div></Card>
      <StatGrid stats={stats} />
    </>
  )
}

export const SubAdminUsers = () => <PanelPlaceholder title="Users" crumbs={[...CR, 'User Management', 'Users']} icon="users" />
export const SubAdminHosts = () => <PanelPlaceholder title="Hosts" crumbs={[...CR, 'User Management', 'Hosts']} icon="video" />

export const SubAdminAgencies = () => <PanelPlaceholder title="Agency" crumbs={[...CR, 'Admin Management', 'Agency']} icon="building" text="Agencies under this sub admin." />

export const SubAdminTransferCoins = () => <PanelPlaceholder title="Transfer Coins" crumbs={[...CR, 'Coin Management', 'Transfer Coins']} icon="coins" text="Send coins down to an agency or user." />
export const SubAdminCoinHistoryAgency = () => <PanelPlaceholder title="History of Coin Transfer to Agency" crumbs={[...CR, 'Coin Management', 'History — Agency']} icon="fileText" />
export const SubAdminCoinHistoryUser = () => <PanelPlaceholder title="History of Coin Transfer to User" crumbs={[...CR, 'Coin Management', 'History — User']} icon="fileText" />

export const SubAdminSalary = () => <PanelPlaceholder title="Salary" crumbs={[...CR, 'Salary']} icon="wallet" />

export const SubAdminProfile = () => <Profile panel="Sub Admin" />

/* Country Admin panel — new, additive, layout only (see panelsShared.jsx).
   Sits between Admin and Sub Admin/Agency: manages Sub Admins and Agencies
   within one country, and the coin cascade down to them. */
import { PageHeader, Card } from '../components/ui.jsx'
import { StatGrid } from './_templates.jsx'
import { PanelPlaceholder } from './panelsShared.jsx'
import { Profile } from './shared.jsx'

const CR = ['Home']

export function CountryAdminDashboard() {
  const stats = [
    { key: 'Hosts', value: 0, icon: 'video', tile: 'tile-green' },
    { key: 'Sub Admin', value: 0, icon: 'shieldUser', tile: 'tile-orange' },
    { key: 'Agency', value: 0, icon: 'building', tile: 'tile-red' },
    { key: 'Total Gifting (this month)', value: 0, icon: 'gift', tile: 'tile-blue' },
  ]
  return (
    <>
      <PageHeader title="Dashboard" crumbs={CR} />
      <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
        Country Admin overview — layout only, tiles show placeholder counts until wired to real data.
      </div></Card>
      <StatGrid stats={stats} />
    </>
  )
}

export const CountryUsers = () => <PanelPlaceholder title="Users" crumbs={[...CR, 'User Management', 'Users']} icon="users" />
export const CountryHosts = () => <PanelPlaceholder title="Hosts" crumbs={[...CR, 'User Management', 'Hosts']} icon="video" />
export const CountryTransferHost = () => <PanelPlaceholder title="Transfer Host" crumbs={[...CR, 'User Management', 'Transfer Host']} icon="arrowLeftRight" text="Move a host from one agency to another." />
export const CountryTransferAgency = () => <PanelPlaceholder title="Transfer Agency" crumbs={[...CR, 'User Management', 'Transfer Agency']} icon="arrowLeftRight" text="Move an agency from one sub admin to another." />
export const CountryTransferSubAdmin = () => <PanelPlaceholder title="Transfer Sub Admin" crumbs={[...CR, 'User Management', 'Transfer Sub Admin']} icon="arrowLeftRight" text="Move a sub admin to a different country admin." />

export const CountrySubAdmins = () => <PanelPlaceholder title="Sub Admin" crumbs={[...CR, 'Admin Management', 'Sub Admin']} icon="shieldUser" text="Sub admins under this country." />
export const CountryAgencies = () => <PanelPlaceholder title="Agency" crumbs={[...CR, 'Admin Management', 'Agency']} icon="building" text="Agencies under this country." />

export const CountryTransferCoins = () => <PanelPlaceholder title="Transfer Coins" crumbs={[...CR, 'Coin Management', 'Transfer Coins']} icon="coins" text="Send coins down to a sub admin, agency or user." />
export const CountryCoinHistorySubAdmin = () => <PanelPlaceholder title="History of Coin Transfer to Sub Admin" crumbs={[...CR, 'Coin Management', 'History — Sub Admin']} icon="fileText" />
export const CountryCoinHistoryAgency = () => <PanelPlaceholder title="History of Coin Transfer to Agency" crumbs={[...CR, 'Coin Management', 'History — Agency']} icon="fileText" />
export const CountryCoinHistoryUser = () => <PanelPlaceholder title="History of Coin Transfer to User" crumbs={[...CR, 'Coin Management', 'History — User']} icon="fileText" />

export const CountryBadges = () => <PanelPlaceholder title="Badge Management" crumbs={[...CR, 'Badge Management']} icon="award" />
export const CountryLeaderboard = () => <PanelPlaceholder title="Leaderboard Frame" crumbs={[...CR, 'Leaderboard Frame']} icon="trophy" />
export const CountryLiveRequest = () => <PanelPlaceholder title="Live Request" crumbs={[...CR, 'Live Request']} icon="radio" text="Approve or reject requests to go live." />
export const CountrySalary = () => <PanelPlaceholder title="Salary" crumbs={[...CR, 'Salary']} icon="wallet" />
export const CountryProfileFrame = () => <PanelPlaceholder title="Profile Frame" crumbs={[...CR, 'Profile Frame']} icon="frame" />

export const CountryProfile = () => <Profile panel="Country Admin" />

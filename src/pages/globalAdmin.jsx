/* Global Admin panel — the top of the Global > Country > Sub > Agency ladder
   (below Master/Admin and Super Admin). It sees every country admin, sub
   admin, agency and host, and moves coins down through all of them. Most pages
   are the Country Admin components: countryScope() (lib/country.js) resolves
   to the whole tree for a Global Admin, and the RPCs re-check that on the
   server (migration 20260930160000).
   This is NOT the old Agency / Manager panel — that lives on as
   'agency-manager' (see config/nav.js). */
import { PageHeader } from '../components/ui.jsx'
import { personCol, statusCol, numCol } from '../components/cells.jsx'
import DataTable from '../components/DataTable.jsx'
import { TableSkeleton, LoadError } from './_templates.jsx'
import { Profile } from './shared.jsx'
import { TransferCoinsPage, CoinHistoryPage, USER_KIND } from './cascade.jsx'
import {
  CountryAdminDashboard, CountryUsers, CountryHosts, CountryTransferHost, CountryTransferAgency,
  CountryTransferSubAdmin, CountrySubAdmins, CountryAgencies,
  CountryBadges, CountryLeaderboard, CountryLiveRequest, CountrySalary, CountryProfileFrame,
} from './countryAdmin.jsx'
import { useAsyncData } from '../lib/useAsync.js'
import {
  countryScope, scopeCountryAdminOptions, scopeSubAdminOptions, scopeAgencyManagerOptions,
} from '../lib/country.js'

const CR = ['Home']
const ADMIN_CR = [...CR, 'Admin Management']
const COIN_CR = [...CR, 'Coin Management']

export const GlobalAdminDashboard = CountryAdminDashboard

/* User Management — same pages, whole tree. */
export const GlobalUsers = CountryUsers
export const GlobalHosts = CountryHosts
export const GlobalTransferHost = CountryTransferHost
export const GlobalTransferAgency = CountryTransferAgency
export const GlobalTransferSubAdmin = CountryTransferSubAdmin

/* Admin Management */
export function GlobalCountryAdmins() {
  const { data, loading, error, reload } = useAsyncData(countryScope, [])
  return (
    <>
      <PageHeader title="Country Admin" crumbs={[...ADMIN_CR, 'Country Admin']} />
      {error ? <LoadError error={error} onRetry={reload} />
        : loading || !data ? <TableSkeleton />
        : (
          <DataTable
            rows={data.countryAdmins}
            searchKeys={['name', 'username', 'displayId']}
            columns={[
              personCol('name', 'username'),
              { key: 'displayId', header: 'User ID', render: (r) => <span className="mono muted">{r.displayId}</span> },
              statusCol('accountStatus', 'Account'),
              numCol('subAdmins', 'Sub Admins'),
              numCol('agencies', 'Agencies'),
              numCol('hosts', 'Hosts'),
              { key: 'granted', header: 'Added', sortable: true },
            ]}
            emptyText="No country admins yet — a Super Admin creates them."
          />
        )}
    </>
  )
}
export const GlobalSubAdmins = CountrySubAdmins
export const GlobalAgencies = CountryAgencies

/* Coin Management */
export const GlobalTransferCoins = () => (
  <TransferCoinsPage
    crumbs={[...COIN_CR, 'Transfer Coins']}
    kinds={[
      { value: 'country_admin', label: 'Country Admin', load: scopeCountryAdminOptions },
      { value: 'sub_admin', label: 'Sub Admin', load: scopeSubAdminOptions },
      { value: 'agency', label: 'Agency', load: scopeAgencyManagerOptions },
      USER_KIND,
    ]}
  />
)
export const GlobalCoinHistoryCountryAdmin = () => (
  <CoinHistoryPage title="History of Coin Transfer to Country Admin" crumbs={[...COIN_CR, 'History — Country Admin']} kind="country_admin" />
)
export const GlobalCoinHistorySubAdmin = () => (
  <CoinHistoryPage title="History of Coin Transfer to Sub Admin" crumbs={[...COIN_CR, 'History — Sub Admin']} kind="sub_admin" />
)
export const GlobalCoinHistoryAgency = () => (
  <CoinHistoryPage title="History of Coin Transfer to Agency" crumbs={[...COIN_CR, 'History — Agency']} kind="agency" />
)
export const GlobalCoinHistoryUser = () => (
  <CoinHistoryPage title="History of Coin Transfer to User" crumbs={[...COIN_CR, 'History — User']} kind="user" />
)

/* Platform (still platform-wide, same as Country Admin) */
export const GlobalBadges = CountryBadges
export const GlobalLeaderboard = CountryLeaderboard
export const GlobalLiveRequest = CountryLiveRequest
export const GlobalSalary = CountrySalary
export const GlobalProfileFrame = CountryProfileFrame

export const GlobalProfile = () => <Profile panel="Global Admin" />

/* Global Admin panel — the top of the Global > Country > Sub > Agency ladder
   (below Master/Admin and Super Admin). It sees every country admin, sub
   admin, agency and host, and moves coins down through all of them. Most pages
   are the Country Admin components: countryScope() (lib/country.js) resolves
   to the whole tree for a Global Admin, and the RPCs re-check that on the
   server (migration 20260930160000).
   This is NOT the old Agency / Manager panel — that lives on as
   'agency-manager' (see config/nav.js). */
import { useNavigate } from 'react-router-dom'
import { PageHeader, Button } from '../components/ui.jsx'
import { personCol, statusCol, numCol, emailCol, roleCol, imageCol } from '../components/cells.jsx'
import DataTable from '../components/DataTable.jsx'
import { TableSkeleton, LoadError } from './_templates.jsx'
import { Profile } from './shared.jsx'
import { AddStaffForm } from './addStaff.jsx'
import { AddAgencyForm } from './addAgency.jsx'
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
const ADD_COUNTRY = '/global-admin/admin-management/country-admin/add'
const ADD_SUB = '/global-admin/admin-management/sub-admin/add'
const ADD_AGENCY = '/global-admin/admin-management/agency/add'

export function GlobalCountryAdmins() {
  const nav = useNavigate()
  const { data, loading, error, reload } = useAsyncData(countryScope, [])
  return (
    <>
      <PageHeader
        title="Country Admin"
        crumbs={[...ADMIN_CR, 'Country Admin']}
        actions={<Button variant="primary" icon="userPlus" onClick={() => nav(ADD_COUNTRY)}>Add Country Admin</Button>}
      />
      {error ? <LoadError error={error} onRetry={reload} />
        : loading || !data ? <TableSkeleton />
        : (
          <DataTable
            rows={data.countryAdmins}
            searchKeys={['name', 'username', 'displayId', 'email']}
            columns={[
              personCol('name', 'username'),
              emailCol(),
              { key: 'displayId', header: 'User ID', render: (r) => <span className="mono muted">{r.displayId}</span> },
              roleCol(),
              statusCol('accountStatus', 'Status'),
              imageCol(),
              numCol('subAdmins', 'Sub Admins'),
              numCol('agencies', 'Agencies'),
              numCol('hosts', 'Hosts'),
              { key: 'granted', header: 'Added', sortable: true },
            ]}
            emptyText="No country admins yet — use “Add Country Admin” to create one."
          />
        )}
    </>
  )
}
export const GlobalSubAdmins = () => <CountrySubAdmins addPath={ADD_SUB} />
export const GlobalAgencies = () => <CountryAgencies addPath={ADD_AGENCY} />

/* Add pages. A Global Admin creates Country Admins, Sub Admins (each placed under a
   Country Admin) and Agencies (each owned by a sub admin, with its own login). */
export const GlobalAddCountryAdmin = () => (
  <AddStaffForm
    title="Add Country Admin"
    crumbRoot={[...ADMIN_CR, 'Country Admin']}
    backTo="/global-admin/admin-management/country-admin"
    roleOpts={[{ value: 'country_admin', label: 'Country Admin' }]}
    showAgency={false}
    countryAdminMode="none"
  />
)
export const GlobalAddSubAdmin = () => (
  <AddStaffForm
    title="Add Sub Admin"
    crumbRoot={[...ADMIN_CR, 'Sub Admin']}
    backTo="/global-admin/admin-management/sub-admin"
    roleOpts={[{ value: 'sub_admin', label: 'Sub Admin' }]}
    showAgency={false}
    countryAdminMode="require"
  />
)
export const GlobalAddAgency = () => (
  <AddAgencyForm
    crumbRoot={[...ADMIN_CR, 'Agency']}
    backTo="/global-admin/admin-management/agency"
    owner={{ mode: 'pick', load: scopeSubAdminOptions }}
  />
)

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

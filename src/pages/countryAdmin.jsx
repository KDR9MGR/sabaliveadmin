/* Country Admin panel — sits above Sub Admin. A country admin owns many sub
   admins, who own many agencies (see lib/country.js for the tree). User,
   Admin and Coin Management here are scoped to that tree; the Platform
   section (badges, leaderboard, live requests, salary, frames) and the
   dashboard still reuse the platform-wide master pages.
   The Global Admin panel (globalAdmin.jsx) reuses these same components: for
   a Global Admin the scope is simply the whole tree.
   Account creation stays Super Admin only: nothing here creates a login. */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Card, Button, Tag } from '../components/ui.jsx'
import { personCol, statusCol, numCol, emailCol, roleCol, imageCol } from '../components/cells.jsx'
import DataTable from '../components/DataTable.jsx'
import EntityForm from '../components/EntityForm.jsx'
import { TableSkeleton, LoadError } from './_templates.jsx'
import { Profile } from './shared.jsx'
import { AddStaffForm } from './addStaff.jsx'
import { AddAgencyForm } from './addAgency.jsx'
import MasterDashboard from './master/Dashboard.jsx'
import { LiveRequests, BadgeManagement, LeaderboardFrame, ProfileFrame, Salary } from './master/platform.jsx'
import { HostsBody } from './agency.jsx'
import { UsersList } from './master/users.jsx'
import { TransferCoinsPage, CoinHistoryPage, USER_KIND } from './cascade.jsx'
import { useAsyncData } from '../lib/useAsync.js'
import { listTransferRequests } from '../lib/workflows.js'
import {
  countryScope, listScopeHosts, scopeSubAdminOptions, scopeAgencyManagerOptions,
  otherCountryAdminOptions, otherGlobalAdminOptions,
  transferAgency, transferAgencyCountry, transferHost, transferSubAdmin, transferCountryAdmin,
} from '../lib/country.js'
import { countryList } from '../lib/countries.js'
import StaffRowManager from '../components/StaffRowManager.jsx'
import HandoverButton from '../components/HandoverButton.jsx'

const CR = ['Home']
const USER_CR = [...CR, 'User Management']
const ADMIN_CR = [...CR, 'Admin Management']
const COIN_CR = [...CR, 'Coin Management']

/* Header + async body: load(), then children(data, reload). */
function Loaded({ title, crumbs, load, actions, children }) {
  const { data, loading, error, reload } = useAsyncData(load, [])
  return (
    <>
      <PageHeader title={title} crumbs={crumbs} actions={data && actions ? actions(data, reload) : null} />
      {error ? <LoadError error={error} onRetry={reload} />
        : loading || data == null ? <TableSkeleton />
        : children(data, reload)}
    </>
  )
}

const agencyTag = (r) => <Tag>{r.agencyName || r.agency || '—'}</Tag>
const hostExtraColumns = [
  { key: 'agencyName', header: 'Agency', render: agencyTag },
  { key: 'subAdmin', header: 'Sub Admin', sortable: true },
]

export const CountryAdminDashboard = MasterDashboard

/* ------------------------------------------------------------------ User Management */
/* Users is every user on the platform, same as Master and Global Admin (and
   for the same reason: set_profile_status is admin-only in the database, so
   this is read-only here too). Hosts, below, stays scoped to this admin's
   own tree — that's the list they can actually act on (ban/unban). */
export const CountryUsers = () => <UsersList readOnly crumbs={[...USER_CR, 'Users']} />

export function CountryHosts() {
  return (
    <Loaded title="Hosts" crumbs={[...USER_CR, 'Hosts']} load={listScopeHosts}>
      {(rows, reload) => <HostsBody rows={rows} reload={reload} extraColumns={hostExtraColumns} />}
    </Loaded>
  )
}

/* Transfer Host — move a host between two agencies inside my tree. */
export function CountryTransferHost() {
  const [open, setOpen] = useState(false)
  return (
    <Loaded
      title="Transfer Host"
      crumbs={[...USER_CR, 'Transfer Host']}
      load={async () => {
        const [hosts, scope, requests] = await Promise.all([listScopeHosts(), countryScope(), listTransferRequests()])
        return { hosts, agencies: scope.agencies, history: requests.filter((r) => r.type === 'Host') }
      }}
      actions={() => <Button variant="primary" icon="arrowLeftRight" onClick={() => setOpen(true)}>Transfer Host</Button>}
    >
      {({ hosts, agencies, history }, reload) => (
        <>
          <DataTable
            rows={history}
            searchKeys={['subject', 'from', 'to', 'requestedBy', 'reason']}
            columns={[
              personCol('subject', 'requestedBy'),
              { key: 'from', header: 'From' },
              { key: 'to', header: 'To' },
              { key: 'reason', header: 'Reason' },
              { key: 'date', header: 'Date', sortable: true },
              statusCol(),
            ]}
            emptyText="No host transfers yet. Use “Transfer Host” to move a host to another of your agencies."
          />
          {open && (
            <EntityForm
              title="Transfer host" onClose={() => setOpen(false)} savedMessage="Host transferred"
              onSubmit={async (v) => { await transferHost({ hostId: v.host, toAgency: v.to_agency, reason: v.reason }); reload() }}
              fields={[
                { name: 'host', label: 'Host', type: 'select', required: true,
                  options: hosts.map((h) => ({ value: h.id, label: `${h.name} — ${h.agencyName}` })) },
                { name: 'to_agency', label: 'Move to agency', type: 'select', required: true,
                  options: agencies.map((a) => ({ value: a.id, label: `${a.name} (${a.subAdmin})` })) },
                { name: 'reason', label: 'Reason', type: 'textarea', full: true },
              ]}
            />
          )}
        </>
      )}
    </Loaded>
  )
}

/* Transfer Agency — hand an agency to another of my sub admins. */
export function CountryTransferAgency({ handover = false }) {
  const [moving, setMoving] = useState(null)
  return (
    <Loaded
      title="Transfer Agency" crumbs={[...USER_CR, 'Transfer Agency']} load={countryScope}
      actions={handover ? (_, reload) => <HandoverButton role="agency_manager" onDone={reload} /> : undefined}
    >
      {({ agencies, subAdmins }, reload) => (
        <>
          <DataTable
            rows={agencies}
            searchKeys={['name', 'subAdmin', 'displayId']}
            columns={[
              { key: 'name', header: 'Agency', sortable: true },
              { key: 'displayId', header: 'Agency ID', render: (r) => <span className="mono muted">{r.displayId}</span> },
              { key: 'subAdmin', header: 'Sub Admin', sortable: true },
              numCol('hosts', 'Hosts'),
              statusCol(),
            ]}
            rowActions={(r) => [{ label: 'Transfer to another sub admin', icon: 'arrowLeftRight', onClick: () => setMoving(r) }]}
            emptyText="No agencies under your sub admins yet."
          />
          {moving && (
            <EntityForm
              title={`Transfer agency — ${moving.name}`} onClose={() => setMoving(null)} savedMessage="Agency transferred"
              onSubmit={async (v) => { await transferAgency({ agencyId: moving.id, toSubAdmin: v.sub_admin }); reload() }}
              fields={[{
                name: 'sub_admin', label: `New sub admin (currently ${moving.subAdmin})`, type: 'select', required: true,
                options: subAdmins.filter((s) => s.id !== moving.subAdminId).map((s) => ({ value: s.id, label: `${s.name} (@${s.username || '—'})` })),
              }]}
            />
          )}
        </>
      )}
    </Loaded>
  )
}

/* Transfer Sub Admin — hand a sub admin (and their agencies) to another country admin. */
export function CountryTransferSubAdmin({ handover = false }) {
  const [moving, setMoving] = useState(null)
  return (
    <Loaded
      title="Transfer Sub Admin"
      crumbs={[...USER_CR, 'Transfer Sub Admin']}
      actions={handover ? (_, reload) => <HandoverButton role="sub_admin" onDone={reload} /> : undefined}
      load={async () => ({ ...(await countryScope()), countryAdmins: await otherCountryAdminOptions() })}
    >
      {({ subAdmins, countryAdmins }, reload) => (
        <>
          <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
            Transferring a sub admin hands them, and every agency they own, to another Country Admin. You lose access to them immediately.
          </div></Card>
          <DataTable
            rows={subAdmins}
            searchKeys={['name', 'username', 'displayId']}
            columns={[
              personCol('name', 'username'),
              { key: 'displayId', header: 'User ID', render: (r) => <span className="mono muted">{r.displayId}</span> },
              numCol('agencies', 'Agencies'),
              numCol('hosts', 'Hosts'),
            ]}
            rowActions={(r) => [{ label: 'Transfer to another country admin', icon: 'arrowLeftRight', onClick: () => setMoving(r) }]}
            emptyText="You don't own any sub admins yet — a Super Admin assigns them to you."
          />
          {moving && (
            <EntityForm
              title={`Transfer sub admin — ${moving.name}`} onClose={() => setMoving(null)} savedMessage="Sub admin transferred"
              onSubmit={async (v) => { await transferSubAdmin({ subAdminId: moving.id, toCountryAdmin: v.country_admin }); reload() }}
              fields={[{ name: 'country_admin', label: 'New country admin', type: 'select', required: true, options: countryAdmins }]}
            />
          )}
        </>
      )}
    </Loaded>
  )
}

/* Transfer Country — reassign which country/region an agency in my tree is counted under. */
export function CountryTransferCountry({ handover = false }) {
  const [moving, setMoving] = useState(null)
  return (
    <Loaded
      title="Transfer Country" crumbs={[...USER_CR, 'Transfer Country']} load={countryScope}
      actions={handover ? (_, reload) => <HandoverButton role="country_admin" onDone={reload} /> : undefined}
    >
      {({ agencies }, reload) => (
        <>
          <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
            Moves an agency to a different country / region. This only relabels which region the agency is counted under — it doesn't change who owns it.
          </div></Card>
          <DataTable
            rows={agencies}
            searchKeys={['name', 'subAdmin', 'country', 'displayId']}
            columns={[
              { key: 'name', header: 'Agency', sortable: true },
              { key: 'displayId', header: 'Agency ID', render: (r) => <span className="mono muted">{r.displayId}</span> },
              { key: 'subAdmin', header: 'Sub Admin', sortable: true },
              { key: 'country', header: 'Region', sortable: true },
              numCol('hosts', 'Hosts'),
            ]}
            rowActions={(r) => [{ label: 'Transfer to another country', icon: 'globe', onClick: () => setMoving(r) }]}
            emptyText="No agencies under your sub admins yet."
          />
          {moving && (
            <EntityForm
              title={`Transfer country — ${moving.name}`} onClose={() => setMoving(null)} savedMessage="Agency moved"
              onSubmit={async (v) => { await transferAgencyCountry({ agencyId: moving.id, country: v.country }); reload() }}
              initial={{ country: moving.country }}
              fields={[{ name: 'country', label: 'New country', type: 'select', required: true, options: countryList() }]}
            />
          )}
        </>
      )}
    </Loaded>
  )
}

/* Transfer Global — hand a Country Admin (and all their Sub Admins / Agencies / Hosts)
   to another Global Admin. Mirrors the Transfer Sub Admin pattern, one level up. */
export function CountryTransferGlobal({ handover = false }) {
  const [moving, setMoving] = useState(null)
  const [targets, setTargets] = useState(null)
  const openWith = async (countryAdmin) => {
    setMoving(countryAdmin)
    try {
      const list = await otherGlobalAdminOptions([countryAdmin.globalAdminId])
      setTargets(list)
    } catch (e) {
      setTargets([])
    }
  }
  return (
    <Loaded
      title="Transfer Global"
      crumbs={[...USER_CR, 'Transfer Global']}
      load={countryScope}
      actions={handover ? (_, reload) => <HandoverButton role="global_admin" onDone={reload} /> : undefined}
    >
      {({ countryAdmins }, reload) => (
        <>
          <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
            Transferring a Country Admin hands them, and every Sub Admin, Agency and Host they own, to another Global Admin. The current owner loses access immediately.
          </div></Card>
          <DataTable
            rows={countryAdmins}
            searchKeys={['name', 'username', 'globalAdmin', 'displayId']}
            columns={[
              personCol('name', 'username'),
              { key: 'displayId', header: 'User ID', render: (r) => <span className="mono muted">{r.displayId}</span> },
              { key: 'globalAdmin', header: 'Owned by Global Admin', sortable: true, render: (r) => r.globalAdminId ? <Tag>{r.globalAdmin}</Tag> : <span className="muted">{r.globalAdmin}</span> },
              numCol('subAdmins', 'Sub Admins'),
              numCol('agencies', 'Agencies'),
              numCol('hosts', 'Hosts'),
            ]}
            rowActions={(r) => [{ label: 'Transfer to another Global Admin', icon: 'arrowLeftRight', onClick: () => openWith(r) }]}
            emptyText="No Country Admins yet — grant the country_admin role from Super Admin → Access Control."
          />
          {moving && (
            <EntityForm
              title={`Transfer Country Admin — ${moving.name}`}
              onClose={() => { setMoving(null); setTargets(null) }}
              savedMessage={`${moving.name} transferred`}
              onSubmit={async (v) => {
                await transferCountryAdmin({ countryAdminId: moving.id, toGlobalAdmin: v.global_admin })
                reload()
              }}
              fields={[
                {
                  name: 'global_admin',
                  label: `New Global Admin (currently: ${moving.globalAdmin})`,
                  type: 'select',
                  required: true,
                  options: targets || [],
                },
              ]}
            />
          )}
        </>
      )}
    </Loaded>
  )
}

/* ------------------------------------------------------------------ Admin Management */
/* `addPath` is where "Add Sub Admin" goes — Country Admin and Global Admin each have their own. */
export function CountrySubAdmins({ addPath = '/country-admin/admin-management/sub-admin/add', manage = false }) {
  const nav = useNavigate()
  return (
    <Loaded
      title="Sub Admin"
      crumbs={[...ADMIN_CR, 'Sub Admin']}
      load={countryScope}
      actions={() => <Button variant="primary" icon="userPlus" onClick={() => nav(addPath)}>Add Sub Admin</Button>}
    >
      {({ subAdmins, seesAll }, reload) => {
        const table = (rowActions) => (
          <DataTable
            rows={subAdmins}
            rowActions={rowActions}
            searchKeys={['name', 'username', 'displayId', 'email']}
            columns={[
              personCol('name', 'username'),
              emailCol(),
              { key: 'displayId', header: 'User ID', render: (r) => <span className="mono muted">{r.displayId}</span> },
              roleCol(),
              ...(seesAll ? [{ key: 'countryAdmin', header: 'Country Admin', sortable: true }] : []),
              statusCol('accountStatus', 'Status'),
              imageCol(),
              numCol('agencies', 'Agencies'),
              numCol('hosts', 'Hosts'),
              { key: 'granted', header: 'Added', sortable: true },
            ]}
            emptyText="No sub admins yet — use “Add Sub Admin” to create one."
          />
        )
        return (
          <>
            <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
              {seesAll
                ? 'Each sub admin belongs to one Country Admin. Adding a sub admin creates their login.'
                : 'Sub admins you add belong to you, and so do the agencies they own. Adding a sub admin creates their login.'}
            </div></Card>
            {manage ? <StaffRowManager kind="staff" reload={reload}>{table}</StaffRowManager> : table()}
          </>
        )
      }}
    </Loaded>
  )
}

/* canAdd=false hides the Add Agency button (Country Admin can't add agencies from the panel). */
export function CountryAgencies({ addPath = '/country-admin/admin-management/agency/add', manage = false, canAdd = true }) {
  const nav = useNavigate()
  return (
    <Loaded
      title="Agency"
      crumbs={[...ADMIN_CR, 'Agency']}
      load={countryScope}
      actions={() => (canAdd ? <Button variant="primary" icon="plus" onClick={() => nav(addPath)}>Add Agency</Button> : null)}
    >
      {({ agencies }, reload) => {
        const table = (rowActions) => (
          <DataTable
            rows={agencies}
            rowActions={rowActions}
            searchKeys={['name', 'subAdmin', 'manager', 'displayId', 'country', 'email']}
            tabs={[
              { label: 'All', value: 'all', filter: () => true },
              { label: 'Active', value: 'a', filter: (r) => r.status === 'Active' },
              { label: 'Pending', value: 'p', filter: (r) => r.status === 'Pending' },
              { label: 'Inactive', value: 'i', filter: (r) => r.status === 'Inactive' },
            ]}
            columns={[
              { key: 'displayId', header: 'Agency ID', render: (r) => <span className="mono muted">{r.displayId}</span> },
              { key: 'name', header: 'Name', sortable: true },
              emailCol(),
              roleCol(),
              { key: 'subAdmin', header: 'Sub Admin', sortable: true },
              { ...personCol('manager', 'managerUsername'), header: 'Manager' },
              numCol('hosts', 'Hosts'),
              { key: 'country', header: 'Region' },
              numCol('commission', 'Commission', { suffix: '%' }),
              statusCol('status', 'Status'),
              imageCol(),
            ]}
            emptyText="No agencies under your sub admins yet."
          />
        )
        return (
          <>
            <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
              Adding an agency also creates its own login. New agencies start as <b>Pending</b> until a platform
              admin approves them and sets the commission.
            </div></Card>
            {manage ? <StaffRowManager kind="agency" reload={reload}>{table}</StaffRowManager> : table()}
          </>
        )
      }}
    </Loaded>
  )
}

/* Add pages. A Country Admin's sub admins are always their own (the server forces
   it), and an agency must be owned by one of their sub admins. */
export const CountryAddSubAdmin = () => (
  <AddStaffForm
    title="Add Sub Admin"
    crumbRoot={[...ADMIN_CR, 'Sub Admin']}
    backTo="/country-admin/admin-management/sub-admin"
    roleOpts={[{ value: 'sub_admin', label: 'Sub Admin' }]}
    showAgency={false}
    countryAdminMode="none"
  />
)
export const CountryAddAgency = () => (
  <AddAgencyForm
    crumbRoot={[...ADMIN_CR, 'Agency']}
    backTo="/country-admin/admin-management/agency"
    owner={{ mode: 'pick', load: scopeSubAdminOptions }}
  />
)

/* ------------------------------------------------------------------ Coin Management */
export const CountryTransferCoins = () => (
  <TransferCoinsPage
    crumbs={[...COIN_CR, 'Transfer Coins']}
    kinds={[
      { value: 'sub_admin', label: 'Sub Admin', load: scopeSubAdminOptions },
      { value: 'agency', label: 'Agency', load: scopeAgencyManagerOptions },
      USER_KIND,
    ]}
  />
)
export const CountryCoinHistorySubAdmin = () => (
  <CoinHistoryPage title="History of Coin Transfer to Sub Admin" crumbs={[...COIN_CR, 'History — Sub Admin']} kind="sub_admin" />
)
export const CountryCoinHistoryAgency = () => (
  <CoinHistoryPage title="History of Coin Transfer to Agency" crumbs={[...COIN_CR, 'History — Agency']} kind="agency" />
)
export const CountryCoinHistoryUser = () => (
  <CoinHistoryPage title="History of Coin Transfer to User" crumbs={[...COIN_CR, 'History — User']} kind="user" />
)

/* ------------------------------------------------------------------ Platform (still platform-wide) */
export const CountryBadges = BadgeManagement
export const CountryLeaderboard = LeaderboardFrame
export const CountryLiveRequest = LiveRequests
export const CountrySalary = Salary
export const CountryProfileFrame = ProfileFrame

export const CountryProfile = () => <Profile panel="Country Admin" />

import { PageHeader, Card, Button, useToast } from '../../components/ui.jsx'
import { personCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import { AsyncView } from '../_templates.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { listStaff } from '../../lib/admin.js'
import { AgencyList } from './agencies.jsx'
import { StaffAccountsPage } from '../super.jsx'
import { AddStaffForm } from '../addStaff.jsx'
import { AddAgencyForm } from '../addAgency.jsx'
import { CountryAdminsList } from '../globalAdmin.jsx'
import { CountrySubAdmins, CountryAgencies } from '../countryAdmin.jsx'
import { scopeSubAdminOptions } from '../../lib/country.js'

const CRUMBS = ['Home', 'Admin Management']

/* Level-wise admin management — same Global > Country > Sub > Agency reach
   Global Admin's own panel has, one level up: Master already sees the whole
   tree for reads (is_global_scope() covers 'admin'), and may now create
   anything in it too (migration 20261001090000). Each level below reuses
   the exact components Global Admin uses over the same tree, just pointed
   at Master's own /admin/... add routes. */
export function GlobalAdminAccounts() {
  return (
    <StaffAccountsPage
      roles={['global_admin']}
      grantRoleOpts={[{ value: 'global_admin', label: 'Global Admin' }]}
      title="Global Admin"
      crumbLabel="Global Admin"
      crumbRoot={CRUMBS}
      addPath="/admin/admins/global-admin/add"
      allowGrant={false}
      intro="The top of the Global > Country > Sub > Agency ladder. A Global Admin sees and moves coins through the whole tree below it."
    />
  )
}
export const AddGlobalAdmin = () => (
  <AddStaffForm
    title="Add Global Admin"
    crumbRoot={[...CRUMBS, 'Global Admin']}
    backTo="/admin/admins/global-admin"
    roleOpts={[{ value: 'global_admin', label: 'Global Admin' }]}
    showAgency={false}
    countryAdminMode="none"
  />
)

export const MasterCountryAdmins = () => <CountryAdminsList addPath="/admin/admins/country-admin/add" />
export const MasterAddCountryAdmin = () => (
  <AddStaffForm
    title="Add Country Admin"
    crumbRoot={[...CRUMBS, 'Country Admin']}
    backTo="/admin/admins/country-admin"
    roleOpts={[{ value: 'country_admin', label: 'Country Admin' }]}
    showAgency={false}
    countryAdminMode="none"
  />
)

export const MasterSubAdmins = () => <CountrySubAdmins addPath="/admin/admins/sub-admin/add" />
export const MasterAddSubAdmin = () => (
  <AddStaffForm
    title="Add Sub Admin"
    crumbRoot={[...CRUMBS, 'Sub Admin']}
    backTo="/admin/admins/sub-admin"
    roleOpts={[{ value: 'sub_admin', label: 'Sub Admin' }]}
    showAgency={false}
    countryAdminMode="require"
  />
)

export const MasterAgencies = () => <CountryAgencies addPath="/admin/admins/agency/add" />
export const MasterAddAgency = () => (
  <AddAgencyForm
    crumbRoot={[...CRUMBS, 'Agency']}
    backTo="/admin/admins/agency"
    owner={{ mode: 'pick', load: scopeSubAdminOptions }}
  />
)

/* --------------------------------------------------- Admins (real: staff_roles) */
/* Unified admin/sub-admin/agency-manager account management — same real
   invite/grant/change/revoke flow as Super Admin → Admin Accounts, just
   scoped to all three roles at once and crumbed under Admin Management. */
export function Admins() {
  return (
    <StaffAccountsPage
      roles={['admin', 'sub_admin', 'agency_manager']}
      grantRoleOpts={[
        { value: 'admin', label: 'Admin' },
        { value: 'sub_admin', label: 'Sub Admin' },
        { value: 'agency_manager', label: 'Agency' },
      ]}
      title="Admin Management"
      crumbLabel="Admins"
      crumbRoot={CRUMBS}
      addPath="/admin/admins/add"
      allowGrant={false}
      intro="Admin, Sub Admin and Agency accounts. Sub Admin and Agency need an agency selected."
    />
  )
}

export function AddMasterAdmin() {
  return (
    <AddStaffForm
      title="Add Admin"
      crumbRoot={[...CRUMBS, 'Admins']}
      backTo="/admin/admins"
      roleOpts={[
        { value: 'admin', label: 'Admin' },
        { value: 'sub_admin', label: 'Sub Admin' },
        { value: 'agency_manager', label: 'Agency' },
      ]}
    />
  )
}

/* --------------------------------------------------- Sub Admins (real) */
export function AdminSubAdmins() {
  const { data: rows, loading, error, reload } = useAsyncData(() => listStaff(['sub_admin']))
  return (
    <>
      <PageHeader title="Sub Admins" crumbs={[...CRUMBS, 'Sub Admins']} />
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          searchKeys={['name', 'username', 'agency', 'displayId']}
          columns={[
            personCol('name', 'username'),
            { key: 'displayId', header: 'User ID', render: (r) => <span className="mono muted">{r.displayId}</span> },
            { key: 'agency', header: 'Assigned Agency', sortable: true },
            { key: 'joined', header: 'Granted', sortable: true },
          ]}
          emptyText="No sub-admins yet."
        />
      </AsyncView>
    </>
  )
}

/* --------------------------------------------------- Agencies (reuses the real agency list) */
export function AgenciesAdmin() {
  return <AgencyList crumbLabel="Agencies" crumbRoot={CRUMBS} />
}

/* --------------------------------------------------- Roles & Permissions (static reference matrix) */
const ROLES = ['Super Admin', 'Admin', 'Agency Manager', 'Sub Admin']
const MODULES = [
  'Dashboards', 'User Management', 'Admin Management', 'Agency Management', 'Host Management',
  'Coin & Gift', 'Salary', 'Reports', 'Live Requests', 'Badges & Frames', 'Content / Settings',
  'Application Config', 'Infrastructure', 'Audit Logs',
]
const GRANT = {
  'Super Admin': () => 'full',
  Admin: (m) => (['Infrastructure'].includes(m) ? 'none' : 'full'),
  'Agency Manager': (m) => (['Host Management', 'Reports', 'Salary', 'Dashboards'].includes(m) ? 'full' : 'none'),
  'Sub Admin': (m) => (['Host Management', 'Dashboards'].includes(m) ? 'write' : 'none'),
}
const DOT = { full: ['#22a06b', 'Full'], write: ['#7c3aed', 'Manage'], read: ['#f59e0b', 'View'], none: ['#d7dbe2', '—'] }

export function RolesPermissions() {
  const toast = useToast()
  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        crumbs={[...CRUMBS, 'Roles & Permissions']}
        actions={<Button icon="helpCircle" onClick={() => toast('This reflects the RLS helpers in Postgres (is_admin_or_above / manages_agency). Editing it here is not wired.')}>How this works</Button>}
      />
      <Card flush title="Capability matrix" sub="Derived from the database RLS policies — read-only reference" action={<span />}>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Module</th>
                {ROLES.map((r) => <th key={r} className="center">{r}</th>)}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr key={m}>
                  <td style={{ fontWeight: 600 }}>{m}</td>
                  {ROLES.map((role) => {
                    const [color, label] = DOT[GRANT[role](m)]
                    return (
                      <td key={role} className="center">
                        <span className="hstack" style={{ justifyContent: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 999, background: color, display: 'inline-block' }} />
                          <span className="muted" style={{ fontSize: 12 }}>{label}</span>
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card__foot hstack" style={{ gap: 18, flexWrap: 'wrap' }}>
          {Object.entries(DOT).map(([k, [c, l]]) => (
            <span className="hstack" key={k} style={{ gap: 6, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: c }} /> {l}
            </span>
          ))}
        </div>
      </Card>
    </>
  )
}

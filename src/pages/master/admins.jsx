import { PageHeader, Card, Button, useToast } from '../../components/ui.jsx'
import { personCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import { AsyncView } from '../_templates.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { listStaff } from '../../lib/admin.js'
import { AgencyList } from './agencies.jsx'

const CRUMBS = ['Home', 'Admin Management']

/* --------------------------------------------------- Admins (real: staff_roles) */
export function Admins() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(() => listStaff(['super_admin', 'admin']))
  return (
    <>
      <PageHeader
        title="Admins"
        crumbs={[...CRUMBS, 'Admins']}
        actions={<Button icon="helpCircle" onClick={() => toast('Admin roles are granted from Super Admin → Access Control')}>About roles</Button>}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          searchKeys={['name', 'username', 'idShort']}
          filters={[{ label: 'Role', options: ['Super Admin', 'Admin'], get: (r) => r.role }]}
          columns={[
            personCol('name', 'username'),
            { key: 'idShort', header: 'User ID', render: (r) => <span className="mono muted">{r.idShort}</span> },
            { key: 'role', header: 'Role', sortable: true },
            { key: 'joined', header: 'Granted', sortable: true },
          ]}
          emptyText="Only the bootstrap Super Admin exists so far."
        />
      </AsyncView>
    </>
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
          searchKeys={['name', 'username', 'agency', 'idShort']}
          columns={[
            personCol('name', 'username'),
            { key: 'idShort', header: 'User ID', render: (r) => <span className="mono muted">{r.idShort}</span> },
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

import { useState } from 'react'
import { ListPage } from '../_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, Badge, useToast } from '../../components/ui.jsx'
import { personCol, statusCol, roleCol, numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import Icon from '../../components/Icon.jsx'
import { admins, subAdmins, agencies } from '../../data/index.js'
import { AGENCIES } from '../../data/util.js'

const CRUMBS = ['Home', 'Admin Management']

export function Admins() {
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  return (
    <>
      <PageHeader
        title="Admins"
        crumbs={[...CRUMBS, 'Admins']}
        actions={<Button variant="primary" icon="userPlus" onClick={() => setAdding(true)}>Add Admin</Button>}
      />
      <DataTable
        rows={admins}
        searchKeys={['name', 'email', 'id']}
        filters={[{ label: 'Role', options: ['Super Admin', 'Admin', 'Master'], get: (r) => r.role }]}
        columns={[
          personCol('name', 'email'),
          roleCol(),
          numCol('modules', 'Modules'),
          { key: 'twoFa', header: '2FA', render: (r) => <Badge tone={r.twoFa === 'Enabled' ? 'success' : 'muted'}>{r.twoFa}</Badge> },
          { key: 'lastLogin', header: 'Last login' },
          statusCol(),
        ]}
        rowActions={(r) => [
          { label: 'Edit', icon: 'edit', onClick: () => toast(`Edit ${r.name}`) },
          { label: 'Manage modules', icon: 'sliders', onClick: () => toast('Module access') },
          { label: 'Reset password', icon: 'key', onClick: () => toast('Reset link sent') },
          { sep: true },
          { label: r.status === 'Active' ? 'Disable' : 'Enable', icon: 'lock', onClick: () => toast(`${r.name} toggled`) },
        ]}
      />
      {adding && (
        <EntityForm title="Add Admin" onClose={() => setAdding(false)} savedMessage="Admin account created"
          fields={[
            { name: 'name', label: 'Full name', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'role', label: 'Role', type: 'select', options: ['Admin', 'Master'], required: true },
            { name: 'temp', label: 'Temporary password', required: true },
            { name: 'twofa', label: 'Require 2FA on first login', type: 'toggle', full: true },
            { name: 'notify', label: 'Email credentials to admin', type: 'toggle', full: true },
          ]}
        />
      )}
    </>
  )
}

export function AdminSubAdmins() {
  const toast = useToast()
  return (
    <ListPage
      title="Sub Admins"
      crumbs={[...CRUMBS, 'Sub Admins']}
      actions={<Button variant="primary" icon="userPlus" onClick={() => toast('Add sub admin')}>Add Sub Admin</Button>}
      rows={subAdmins}
      searchKeys={['name', 'email', 'assignedAgency', 'id']}
      filters={[
        { label: 'Agency', options: AGENCIES, get: (r) => r.assignedAgency },
        { label: 'Status', options: ['Active', 'Inactive'], get: (r) => r.status },
      ]}
      columns={[
        personCol('name', 'email'),
        { key: 'assignedAgency', header: 'Assigned Agency', sortable: true },
        { key: 'permissions', header: 'Permission scope', render: (r) => <Tag>{r.permissions}</Tag> },
        numCol('hostsManaged', 'Hosts managed'),
        { key: 'created', header: 'Created', sortable: true },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Edit scope', icon: 'shieldUser', onClick: () => toast(`Scope for ${r.name}`) },
        { label: 'Re-assign agency', icon: 'arrowLeftRight', onClick: () => toast('Re-assign') },
        { sep: true },
        { label: 'Remove', icon: 'trash', onClick: () => toast(`${r.name} removed`) },
      ]}
    />
  )
}

export function AgenciesAdmin() {
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  return (
    <>
      <PageHeader
        title="Agencies"
        crumbs={[...CRUMBS, 'Agencies']}
        actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add Agency</Button>}
      />
      <DataTable
        rows={agencies}
        searchKeys={['name', 'manager', 'managerEmail', 'id']}
        filters={[{ label: 'Status', options: ['Active', 'Inactive', 'Pending'], get: (r) => r.status }]}
        columns={[
          { key: 'name', header: 'Agency', sortable: true, render: (r) => <Person name={r.name} meta={r.id} size="sm" /> },
          personCol('manager', 'managerEmail'),
          numCol('hosts', 'Hosts'),
          numCol('users', 'Users'),
          numCol('revenue', 'Revenue', { prefix: '₹' }),
          { key: 'commission', header: 'Commission', align: 'right', render: (r) => r.commission + '%' },
          statusCol(),
        ]}
        rowActions={(r) => [
          { label: 'Open agency', icon: 'externalLink', onClick: () => toast(`Open ${r.name}`) },
          { label: 'Edit', icon: 'edit', onClick: () => toast(`Edit ${r.name}`) },
          { label: 'Set commission', icon: 'dollar', onClick: () => toast('Commission') },
          { sep: true },
          { label: r.status === 'Active' ? 'Suspend' : 'Activate', icon: 'lock', onClick: () => toast(`${r.name} toggled`) },
        ]}
      />
      {adding && (
        <EntityForm title="Add Agency" onClose={() => setAdding(false)} savedMessage="Agency created"
          fields={[
            { name: 'name', label: 'Agency name', required: true },
            { name: 'manager', label: 'Manager name', required: true },
            { name: 'managerEmail', label: 'Manager email', type: 'email', required: true },
            { name: 'country', label: 'City / Region' },
            { name: 'commission', label: 'Commission %', type: 'number' },
            { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Pending'] },
          ]}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ Roles & Permissions matrix */
const ROLES = ['Super Admin', 'Admin', 'Agency', 'Sub Admin', 'Host']
const MODULES = [
  'Dashboard', 'User Management', 'Admin Management', 'Agency Management', 'Host Management',
  'Coin & Gift', 'Salary', 'Reports', 'Live Requests', 'Badges & Frames', 'Content / Settings',
  'Application Config', 'System Management',
]
const GRANT = {
  'Super Admin': () => 'full',
  Admin: (m) => (['System Management'].includes(m) ? 'none' : 'full'),
  Agency: (m) => (['Host Management', 'Reports', 'Salary', 'Dashboard'].includes(m) ? 'full' : ['User Management'].includes(m) ? 'read' : 'none'),
  'Sub Admin': (m) => (['Host Management', 'Dashboard'].includes(m) ? 'write' : ['Reports'].includes(m) ? 'read' : 'none'),
  Host: (m) => (['Dashboard'].includes(m) ? 'read' : 'none'),
}
const DOT = { full: ['#22a06b', 'Full'], write: ['#7c3aed', 'Manage'], read: ['#f59e0b', 'View'], none: ['#d7dbe2', '—'] }

export function RolesPermissions() {
  const toast = useToast()
  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        crumbs={[...CRUMBS, 'Roles & Permissions']}
        actions={<>
          <Button icon="plus" onClick={() => toast('New custom role')}>New Role</Button>
          <Button variant="primary" icon="check" onClick={() => toast('Permission matrix saved')}>Save Changes</Button>
        </>}
      />
      <Card flush>
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
                    const g = GRANT[role](m)
                    const [color, label] = DOT[g]
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

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ListPage } from '../_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, KV, useToast } from '../../components/ui.jsx'
import { personCol, statusCol, roleCol, numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import Icon from '../../components/Icon.jsx'
import { users, hosts, subAdmins, transferRequests } from '../../data/index.js'
import { AGENCIES } from '../../data/util.js'

const CRUMBS = ['Home', 'User Management']

/* ------------------------------------------------------------------ All Users */
export function UsersList() {
  const nav = useNavigate()
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  return (
    <>
      <PageHeader
        title="User Management"
        crumbs={[...CRUMBS, 'Users']}
        actions={<>
          <Button icon="download">Export</Button>
          <Button variant="primary" icon="userPlus" onClick={() => setAdding(true)}>Add User</Button>
        </>}
      />
      <DataTable
        rows={users}
        onRowClick={(r) => nav(`/admin/users/${r.id}`)}
        searchKeys={['name', 'email', 'mobile', 'id']}
        searchPlaceholder="Search by name, email or mobile…"
        tabs={[
          { label: 'Users', value: 'all', filter: () => true },
          { label: 'Verified', value: 'v', filter: (r) => r.kyc === 'Verified' },
          { label: 'Pending KYC', value: 'p', filter: (r) => r.kyc === 'Pending' },
          { label: 'Suspended', value: 's', filter: (r) => r.status === 'Suspended' },
        ]}
        filters={[
          { label: 'Role', options: ['User', 'Host', 'Sub Admin', 'Agency'], get: (r) => r.role },
          { label: 'Status', options: ['Active', 'Inactive', 'Suspended'], get: (r) => r.status },
        ]}
        columns={[
          personCol('name', 'email'),
          { key: 'id', header: 'User ID', sortable: true, render: (r) => <span className="mono muted">{r.id}</span> },
          { key: 'mobile', header: 'Mobile' },
          roleCol(),
          statusCol(),
          { key: 'kyc', header: 'KYC', render: (r) => <StatusBadge value={r.kyc} /> },
          { key: 'joined', header: 'Joined On', sortable: true },
        ]}
        rowActions={(r) => [
          { label: 'View profile', icon: 'eye', onClick: () => nav(`/admin/users/${r.id}`) },
          { label: 'Edit', icon: 'edit', onClick: () => toast(`Edit ${r.id}`) },
          { label: r.status === 'Suspended' ? 'Reactivate' : 'Suspend', icon: 'lock', onClick: () => toast(`${r.name} ${r.status === 'Suspended' ? 'reactivated' : 'suspended'}`) },
          { sep: true },
          { label: 'Delete', icon: 'trash', onClick: () => toast(`${r.id} deleted`) },
        ]}
      />
      {adding && (
        <EntityForm
          title="Add User"
          onClose={() => setAdding(false)}
          savedMessage="New user created"
          fields={[
            { name: 'name', label: 'Full name', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'mobile', label: 'Mobile' },
            { name: 'role', label: 'Role', type: 'select', options: ['User', 'Host', 'Sub Admin', 'Agency'], required: true },
            { name: 'country', label: 'City / Region' },
            { name: 'status', label: 'Account status', type: 'select', options: ['Active', 'Inactive'] },
            { name: 'notes', label: 'Notes', type: 'textarea', full: true, placeholder: 'Internal notes (optional)' },
            { name: 'welcome', label: 'Send welcome email', type: 'toggle', full: true },
          ]}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ Hosts / Creators */
export function HostsList() {
  const toast = useToast()
  return (
    <ListPage
      title="Hosts / Creators"
      crumbs={[...CRUMBS, 'Hosts']}
      actions={<Button variant="primary" icon="plus" onClick={() => toast('Add host')}>Add Host</Button>}
      rows={hosts}
      searchKeys={['name', 'email', 'agency', 'id']}
      searchPlaceholder="Search hosts…"
      tabs={[
        { label: 'All', value: 'all', filter: () => true },
        { label: 'Live now', value: 'live', filter: (r) => r.status === 'Live' },
        { label: 'Banned', value: 'ban', filter: (r) => r.status === 'Banned' },
      ]}
      filters={[
        { label: 'Agency', options: AGENCIES, get: (r) => r.agency },
        { label: 'Tier', options: ['Bronze', 'Silver', 'Gold', 'Platinum'], get: (r) => r.tier },
      ]}
      columns={[
        personCol('name', 'id'),
        { key: 'agency', header: 'Agency', sortable: true },
        { key: 'tier', header: 'Tier', render: (r) => <Tag>{r.tier}</Tag> },
        numCol('followers', 'Followers'),
        numCol('coins', 'Coins'),
        { key: 'rating', header: 'Rating', align: 'right', render: (r) => <span className="hstack" style={{ justifyContent: 'flex-end' }}><Icon name="star" size={13} style={{ color: '#f59e0b' }} />{r.rating}</span> },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'View', icon: 'eye', onClick: () => toast(`Open ${r.id}`) },
        { label: 'Edit', icon: 'edit', onClick: () => toast(`Edit ${r.id}`) },
        { label: 'Reassign agency', icon: 'arrowLeftRight', onClick: () => toast('Reassign flow') },
        { sep: true },
        { label: r.status === 'Banned' ? 'Unban' : 'Ban', icon: 'lock', onClick: () => toast(`${r.name} ${r.status === 'Banned' ? 'unbanned' : 'banned'}`) },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ Sub Admins (user mgmt view) */
export function SubAdminsList() {
  const toast = useToast()
  return (
    <ListPage
      title="Sub Admins"
      crumbs={[...CRUMBS, 'Sub Admins']}
      actions={<Button variant="primary" icon="userPlus" onClick={() => toast('Add sub admin')}>Add Sub Admin</Button>}
      rows={subAdmins}
      searchKeys={['name', 'email', 'assignedAgency', 'id']}
      filters={[{ label: 'Status', options: ['Active', 'Inactive'], get: (r) => r.status }]}
      columns={[
        personCol('name', 'email'),
        { key: 'assignedAgency', header: 'Assigned Agency', sortable: true },
        { key: 'permissions', header: 'Scope', render: (r) => <Tag>{r.permissions}</Tag> },
        numCol('hostsManaged', 'Hosts'),
        { key: 'lastLogin', header: 'Last login' },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Edit permissions', icon: 'shieldUser', onClick: () => toast(`Permissions for ${r.name}`) },
        { label: 'Reset password', icon: 'key', onClick: () => toast('Reset link sent') },
        { sep: true },
        { label: 'Deactivate', icon: 'lock', onClick: () => toast(`${r.name} deactivated`) },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ User IDs */
export function UserIds() {
  const toast = useToast()
  const rows = users.map((u) => ({ ...u, custom: u.level > 40 ? 'VIP' + u.id.slice(3) : '—', changes: u.level % 3 }))
  return (
    <ListPage
      title="User ID Management"
      crumbs={[...CRUMBS, 'User IDs']}
      actions={<Button icon="helpCircle" onClick={() => toast('About custom IDs')}>Policy</Button>}
      rows={rows}
      searchKeys={['name', 'id', 'custom']}
      columns={[
        personCol('name', 'email'),
        { key: 'id', header: 'System ID', render: (r) => <span className="mono">{r.id}</span> },
        { key: 'custom', header: 'Custom / Vanity ID', render: (r) => r.custom === '—' ? <span className="muted">—</span> : <Tag role>{r.custom}</Tag> },
        { key: 'changes', header: 'ID changes', align: 'right' },
        { key: 'level', header: 'Level', align: 'right' },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Assign vanity ID', icon: 'idCard', onClick: () => toast(`Assign ID to ${r.name}`) },
        { label: 'Release ID', icon: 'x', onClick: () => toast('ID released') },
        { label: 'Lock ID changes', icon: 'lock', onClick: () => toast('ID locked') },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ Account Status */
export function AccountStatus() {
  const toast = useToast()
  return (
    <>
      <PageHeader title="Account Status" crumbs={[...CRUMBS, 'Account Status']} />
      <div className="stat-grid" style={{ marginBottom: 16 }}>
        {[
          { key: 'Active', value: users.filter((u) => u.status === 'Active').length, tile: 'tile-green', icon: 'userCheck' },
          { key: 'Inactive', value: users.filter((u) => u.status === 'Inactive').length, tile: 'tile-orange', icon: 'clock' },
          { key: 'Suspended', value: users.filter((u) => u.status === 'Suspended').length, tile: 'tile-red', icon: 'lock' },
          { key: 'Pending KYC', value: users.filter((u) => u.kyc === 'Pending').length, tile: 'tile-blue', icon: 'idCard' },
        ].map((s) => (
          <div className="stat" key={s.key}>
            <div className="stat__top">
              <div><div className="stat__label">{s.key}</div><div className="stat__value">{s.value}</div></div>
              <div className={`stat__tile ${s.tile}`}><Icon name={s.icon} size={20} /></div>
            </div>
          </div>
        ))}
      </div>
      <DataTable
        rows={users}
        searchKeys={['name', 'email', 'id']}
        filters={[
          { label: 'Status', options: ['Active', 'Inactive', 'Suspended'], get: (r) => r.status },
          { label: 'KYC', options: ['Verified', 'Pending', 'Rejected', 'Not Submitted'], get: (r) => r.kyc },
        ]}
        columns={[
          personCol('name', 'id'),
          statusCol('status', 'Account status'),
          { key: 'kyc', header: 'KYC', render: (r) => <StatusBadge value={r.kyc} /> },
          { key: 'country', header: 'Region' },
          { key: 'joined', header: 'Joined' },
        ]}
        rowActions={(r) => [
          { label: 'Set Active', icon: 'check', onClick: () => toast(`${r.name} → Active`) },
          { label: 'Set Inactive', icon: 'clock', onClick: () => toast(`${r.name} → Inactive`) },
          { label: 'Suspend', icon: 'lock', onClick: () => toast(`${r.name} → Suspended`) },
          { sep: true },
          { label: 'Force logout', icon: 'logout', onClick: () => toast('Sessions cleared') },
        ]}
      />
    </>
  )
}

/* ------------------------------------------------------------------ Transfer Requests */
export function TransferRequests() {
  const toast = useToast()
  return (
    <ListPage
      title="Transfer Requests"
      crumbs={[...CRUMBS, 'Transfer Requests']}
      rows={transferRequests}
      searchKeys={['subject', 'from', 'to', 'requestedBy', 'id']}
      tabs={[
        { label: 'Pending', value: 'p', filter: (r) => r.status === 'Pending' },
        { label: 'Approved', value: 'a', filter: (r) => r.status === 'Approved' },
        { label: 'Rejected', value: 'r', filter: (r) => r.status === 'Rejected' },
        { label: 'All', value: 'all', filter: () => true },
      ]}
      filters={[{ label: 'Type', options: ['Host', 'Agency', 'Sub Admin'], get: (r) => r.type }]}
      columns={[
        { key: 'id', header: 'Request', render: (r) => <span className="mono muted">{r.id}</span> },
        { key: 'type', header: 'Type', render: (r) => <Tag>{r.type}</Tag> },
        personCol('subject', 'requestedBy'),
        { key: 'from', header: 'From' },
        { key: 'to', header: 'To', render: (r) => <span className="hstack" style={{ gap: 6 }}><Icon name="chevronsRight" size={13} className="muted" />{r.to}</span> },
        { key: 'reason', header: 'Reason' },
        { key: 'date', header: 'Date', sortable: true },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Approve', icon: 'check', onClick: () => toast(`${r.id} approved`) },
        { label: 'Reject', icon: 'x', onClick: () => toast(`${r.id} rejected`) },
        { label: 'View details', icon: 'eye', onClick: () => toast(`Details ${r.id}`) },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ User Profile (detail) */
export function UserProfile() {
  const { id } = useParams()
  const toast = useToast()
  const u = users.find((x) => x.id === id) || users[0]
  return (
    <>
      <PageHeader
        title={u.name}
        crumbs={['Home', 'User Management', 'Users', u.id]}
        actions={<>
          <Button icon="chevronLeft" onClick={() => history.back()}>Back</Button>
          <Button icon="edit" onClick={() => toast('Edit profile')}>Edit</Button>
          <Button variant="danger" icon="lock" onClick={() => toast(`${u.name} suspended`)}>Suspend</Button>
        </>}
      />
      <div className="grid dash">
        <div className="vstack" style={{ gap: 16 }}>
          <Card>
            <div className="hstack" style={{ gap: 16, alignItems: 'flex-start' }}>
              <Person name={u.name} size="xl" meta={u.email} />
              <div className="grow" />
              <div className="hstack wrap" style={{ gap: 8 }}>
                <StatusBadge value={u.status} />
                <StatusBadge value={u.kyc} />
                <Tag role>{u.role}</Tag>
              </div>
            </div>
            <div className="mt-16">
              <KV rows={[
                ['User ID', <span className="mono">{u.id}</span>],
                ['Mobile', u.mobile],
                ['Region', u.country],
                ['Level', `Lv. ${u.level}`],
                ['Coin balance', u.coins.toLocaleString('en-IN')],
                ['Joined', u.joined],
              ]} />
            </div>
          </Card>

          <Card title="Recent Activity">
            <div className="feed">
              {['Recharged 500 coins via UPI', 'Sent Diamond ×3 to host Priya', 'Joined live room "Dance Party"', 'Updated profile photo', 'KYC document submitted'].map((t, i) => (
                <div className="feed__item" key={i}>
                  <span className="feed__dot"><Icon name="activity" size={14} /></span>
                  <div><div className="feed__text">{t}</div><div className="feed__time">{i + 1} day(s) ago</div></div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="vstack" style={{ gap: 16 }}>
          <Card title="ID Management">
            <KV rows={[
              ['System ID', <span className="mono">{u.id}</span>],
              ['Vanity ID', u.level > 40 ? <Tag role>VIP{u.id.slice(3)}</Tag> : <span className="muted">Not assigned</span>],
              ['ID changes used', `${u.level % 3} / 2`],
            ]} />
            <div className="hstack mt-16" style={{ gap: 8 }}>
              <Button size="sm" icon="idCard" onClick={() => toast('Assign vanity ID')}>Assign</Button>
              <Button size="sm" icon="lock" onClick={() => toast('ID locked')}>Lock</Button>
            </div>
          </Card>
          <Card title="Account Controls">
            <div className="toggle-row"><div><div className="t-title">Account enabled</div><div className="t-desc">User can sign in and go live</div></div>
              <label className="toggle"><input type="checkbox" defaultChecked={u.status === 'Active'} /><span className="track" /><span className="thumb" /></label></div>
            <div className="toggle-row"><div><div className="t-title">Allow recharge</div><div className="t-desc">Coin purchases from wallet</div></div>
              <label className="toggle"><input type="checkbox" defaultChecked /><span className="track" /><span className="thumb" /></label></div>
            <div className="toggle-row"><div><div className="t-title">Allow withdrawals</div><div className="t-desc">Requires verified KYC</div></div>
              <label className="toggle"><input type="checkbox" defaultChecked={u.kyc === 'Verified'} /><span className="track" /><span className="thumb" /></label></div>
            <div className="toggle-row"><div><div className="t-title">Shadow ban</div><div className="t-desc">Hide from discovery & leaderboards</div></div>
              <label className="toggle"><input type="checkbox" /><span className="track" /><span className="thumb" /></label></div>
          </Card>
        </div>
      </div>
    </>
  )
}

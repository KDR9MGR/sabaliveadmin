import { useParams, useNavigate } from 'react-router-dom'
import { ListPage, StatGrid, AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, KV, useToast, EmptyState } from '../../components/ui.jsx'
import { personCol, statusCol, roleCol, numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import Icon from '../../components/Icon.jsx'
import { useState } from 'react'
import { useAsyncData } from '../../lib/useAsync.js'
import { listUsers, getUserDetail, setUserStatus, listStaff, fmtDate, ROLE_LABEL } from '../../lib/admin.js'
import {
  listTransferRequests, decideTransfer, createTransferRequest,
  agencyOptions, hostOptions, subAdminOptions,
} from '../../lib/workflows.js'
import EntityForm from '../../components/EntityForm.jsx'
import { relativeTime } from '../../lib/format.js'
import { users as mockUsers } from '../../data/index.js'
import { HostsTable } from './hosts.jsx'

const CRUMBS = ['Home', 'User Management']
const STATUS_OPTS = ['active', 'inactive', 'suspended']

/* ------------------------------------------------------------------ All Users */
export function UsersList() {
  const nav = useNavigate()
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listUsers)

  const changeStatus = async (r, status) => {
    try {
      await setUserStatus(r.id, status)
      toast(`${r.name} → ${status}`)
      reload()
    } catch (e) {
      toast(e.message || 'Could not update status')
    }
  }

  return (
    <>
      <PageHeader
        title="User Management"
        crumbs={[...CRUMBS, 'Users']}
        actions={<Button icon="download" onClick={() => toast('Export coming soon')}>Export</Button>}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          onRowClick={(r) => nav(`/admin/users/${r.id}`)}
          searchKeys={['name', 'username', 'idShort', 'location']}
          searchPlaceholder="Search by name or username…"
          tabs={[
            { label: 'All', value: 'all', filter: () => true },
            { label: 'Hosts', value: 'h', filter: (r) => r.isHost },
            { label: 'Staff', value: 's', filter: (r) => r.isStaff },
            { label: 'Suspended', value: 'x', filter: (r) => r.status === 'Suspended' },
          ]}
          filters={[
            { label: 'Role', options: ['User', 'Host', ...Object.values(ROLE_LABEL)], get: (r) => r.role },
            { label: 'Status', options: ['Active', 'Inactive', 'Suspended'], get: (r) => r.status },
          ]}
          columns={[
            personCol('name', 'username'),
            { key: 'idShort', header: 'User ID', render: (r) => <span className="mono muted">{r.idShort}</span> },
            roleCol(),
            { key: 'level', header: 'Level', align: 'right' },
            numCol('followers', 'Followers'),
            numCol('coins', 'Coins'),
            { key: 'kyc', header: 'KYC', render: (r) => r.kyc === '—' ? <span className="muted">—</span> : <StatusBadge value={r.kyc} /> },
            { key: 'location', header: 'Region' },
            statusCol(),
            { key: 'joined', header: 'Joined', sortable: true },
          ]}
          rowActions={(r) => [
            { label: 'View profile', icon: 'eye', onClick: () => nav(`/admin/users/${r.id}`) },
            r.status === 'Suspended'
              ? { label: 'Reactivate', icon: 'check', onClick: () => changeStatus(r, 'active') }
              : { label: 'Suspend', icon: 'lock', onClick: () => changeStatus(r, 'suspended') },
            { label: 'Set inactive', icon: 'clock', onClick: () => changeStatus(r, 'inactive') },
          ]}
          emptyText="No users yet."
        />
      </AsyncView>
    </>
  )
}

/* ------------------------------------------------------------------ Hosts / Creators (shares the real host table) */
export function HostsList() {
  return <HostsTable title="Hosts / Creators" crumbs={[...CRUMBS, 'Hosts']} />
}

/* ------------------------------------------------------------------ Sub Admins (real) */
export function SubAdminsList() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(() => listStaff(['sub_admin']))
  return (
    <>
      <PageHeader
        title="Sub Admins"
        crumbs={[...CRUMBS, 'Sub Admins']}
        actions={<Button icon="helpCircle" onClick={() => toast('Sub-admin roles are granted from Super Admin → Access Control')}>About</Button>}
      />
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
          emptyText="No sub-admins yet. Grant the sub_admin role from Super Admin → Access Control."
        />
      </AsyncView>
    </>
  )
}

/* ------------------------------------------------------------------ User IDs (no schema backing — still mock) */
export function UserIds() {
  const toast = useToast()
  const rows = mockUsers.map((u) => ({ ...u, custom: u.level > 40 ? 'VIP' + u.id.slice(3) : '—', changes: u.level % 3 }))
  return (
    <ListPage
      title="User ID Management"
      crumbs={[...CRUMBS, 'User IDs']}
      actions={<Button icon="helpCircle" onClick={() => toast('Vanity IDs are not modelled in the backend yet')}>Policy</Button>}
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
      ]}
    />
  )
}

/* ------------------------------------------------------------------ Account Status (real) */
export function AccountStatus() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listUsers)
  const list = rows || []
  const changeStatus = async (r, status) => {
    try { await setUserStatus(r.id, status); toast(`${r.name} → ${status}`); reload() }
    catch (e) { toast(e.message || 'Could not update status') }
  }
  return (
    <>
      <PageHeader title="Account Status" crumbs={[...CRUMBS, 'Account Status']} />
      <AsyncView loading={loading} error={error} reload={reload}>
        <div className="stat-grid" style={{ marginBottom: 16 }}>
          {[
            { key: 'Active', v: list.filter((u) => u.status === 'Active').length, tile: 'tile-green', icon: 'userCheck' },
            { key: 'Inactive', v: list.filter((u) => u.status === 'Inactive').length, tile: 'tile-orange', icon: 'clock' },
            { key: 'Suspended', v: list.filter((u) => u.status === 'Suspended').length, tile: 'tile-red', icon: 'lock' },
            { key: 'Verified', v: list.filter((u) => u.verified).length, tile: 'tile-blue', icon: 'checkCircle' },
          ].map((s) => (
            <div className="stat" key={s.key}>
              <div className="stat__top">
                <div><div className="stat__label">{s.key}</div><div className="stat__value">{s.v}</div></div>
                <div className={`stat__tile ${s.tile}`}><Icon name={s.icon} size={20} /></div>
              </div>
            </div>
          ))}
        </div>
        <DataTable
          rows={list}
          searchKeys={['name', 'username', 'idShort']}
          filters={[{ label: 'Status', options: ['Active', 'Inactive', 'Suspended'], get: (r) => r.status }]}
          columns={[
            personCol('name', 'username'),
            statusCol('status', 'Account status'),
            { key: 'verified', header: 'Verified', render: (r) => r.verified ? <StatusBadge value="Verified" /> : <span className="muted">No</span> },
            { key: 'location', header: 'Region' },
            { key: 'joined', header: 'Joined' },
          ]}
          rowActions={(r) => [
            { label: 'Set Active', icon: 'check', onClick: () => changeStatus(r, 'active') },
            { label: 'Set Inactive', icon: 'clock', onClick: () => changeStatus(r, 'inactive') },
            { label: 'Suspend', icon: 'lock', onClick: () => changeStatus(r, 'suspended') },
          ]}
        />
      </AsyncView>
    </>
  )
}

/* ------------------------------------------------------------------ Transfer Requests (real — decide_transfer_request RPC) */
export function TransferRequests({ subjectType, title = 'Transfer Requests', crumbLabel = 'Transfer Requests', crumbs }) {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listTransferRequests)
  const [creating, setCreating] = useState(false)

  const filtered = (rows || []).filter((r) => !subjectType || r.type.toLowerCase().replace(' ', '_') === subjectType)

  const decide = async (r, approve) => {
    try { await decideTransfer(r.id, approve); toast(`${r.subject} — ${approve ? 'approved' : 'rejected'}`); reload() }
    catch (e) { toast(e.message || 'Could not update request') }
  }

  return (
    <>
      <PageHeader
        title={title}
        crumbs={crumbs || [...CRUMBS, crumbLabel]}
        actions={<Button variant="primary" icon="arrowLeftRight" onClick={() => setCreating(true)}>New Transfer</Button>}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={filtered}
          searchKeys={['subject', 'from', 'to', 'requestedBy', 'idShort']}
          tabs={[
            { label: 'Pending', value: 'p', filter: (r) => r.status === 'Pending' },
            { label: 'Approved', value: 'a', filter: (r) => r.status === 'Approved' },
            { label: 'Rejected', value: 'r', filter: (r) => r.status === 'Rejected' },
            { label: 'All', value: 'all', filter: () => true },
          ]}
          columns={[
            { key: 'idShort', header: 'Request', render: (r) => <span className="mono muted">{r.idShort}</span> },
            { key: 'type', header: 'Type', render: (r) => <Tag>{r.type}</Tag> },
            personCol('subject', 'requestedBy'),
            { key: 'from', header: 'From' },
            { key: 'to', header: 'To', render: (r) => <span className="hstack" style={{ gap: 6 }}><Icon name="chevronsRight" size={13} className="muted" />{r.to}</span> },
            { key: 'reason', header: 'Reason' },
            { key: 'date', header: 'Requested', sortable: true },
            statusCol(),
          ]}
          rowActions={(r) => r.status === 'Pending' ? [
            { label: 'Approve', icon: 'check', onClick: () => decide(r, true) },
            { label: 'Reject', icon: 'x', onClick: () => decide(r, false) },
          ] : [
            { label: 'Already decided', icon: 'clock', onClick: () => {} },
          ]}
          emptyText="No transfer requests. Use “New Transfer” to move a host or sub-admin between agencies."
        />
      </AsyncView>
      {creating && <NewTransferDrawer onClose={() => setCreating(false)} onDone={reload} defaultType={subjectType} />}
    </>
  )
}

function NewTransferDrawer({ onClose, onDone, defaultType }) {
  const toast = useToast()
  const { data: opts } = useAsyncData(async () => ({
    agencies: await agencyOptions(),
    hosts: await hostOptions(),
    subs: await subAdminOptions(),
  }))
  const [subjectType, setSubjectType] = useState(defaultType || 'host')
  const subjects = subjectType === 'host' ? (opts?.hosts || []) : (opts?.subs || [])

  const submit = async (v) => {
    const subj = subjects.find((s) => s.value === v.subject_id)
    await createTransferRequest({
      subject_type: subjectType,
      subject_id: v.subject_id,
      from_agency_id: subj?.agency_id || null,
      to_agency_id: v.to_agency_id,
      reason: v.reason,
    })
    onDone()
  }

  return (
    <EntityForm
      title="New Transfer Request"
      onClose={onClose}
      onSubmit={submit}
      savedMessage="Transfer request created"
      fields={[
        {
          name: '_type', label: 'Move a', type: 'select', required: true,
          options: [{ value: 'host', label: 'Host' }, { value: 'sub_admin', label: 'Sub Admin' }],
        },
        { name: 'subject_id', label: subjectType === 'host' ? 'Host' : 'Sub Admin', type: 'select', required: true, options: subjects },
        { name: 'to_agency_id', label: 'To agency', type: 'select', required: true, options: opts?.agencies || [] },
        { name: 'reason', label: 'Reason', type: 'textarea', full: true },
      ]}
      initial={{ _type: subjectType }}
      onChange={(name, val) => { if (name === '_type') setSubjectType(val) }}
    />
  )
}

/* ------------------------------------------------------------------ User Profile (real) */
export function UserProfile() {
  const { id } = useParams()
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(() => getUserDetail(id), [id])

  const changeStatus = async (status) => {
    try { await setUserStatus(id, status); toast(`Status → ${status}`); reload() }
    catch (e) { toast(e.message || 'Could not update status') }
  }

  const u = data?.profile
  return (
    <>
      <PageHeader
        title={u?.name || 'User'}
        crumbs={['Home', 'User Management', 'Users', id?.slice(0, 8)]}
        actions={<>
          <Button icon="chevronLeft" onClick={() => history.back()}>Back</Button>
          {u && (u.status === 'suspended'
            ? <Button icon="check" onClick={() => changeStatus('active')}>Reactivate</Button>
            : <Button variant="danger" icon="lock" onClick={() => changeStatus('suspended')}>Suspend</Button>)}
        </>}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        {u ? <UserProfileBody data={data} onStatus={changeStatus} /> : (
          <Card><div className="card__body"><EmptyState icon="helpCircle" title="User not found" text="No profile with this ID." /></div></Card>
        )}
      </AsyncView>
    </>
  )
}

function UserProfileBody({ data, onStatus }) {
  const u = data.profile
  const w = u.wallets || {}
  const hp = u.host_profiles
  const sr = u.staff_roles
  const kyc = (u.kyc_verifications || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  const role = sr ? (ROLE_LABEL[sr.role] || sr.role) : hp ? 'Host' : 'User'

  return (
    <div className="grid dash">
      <div className="vstack" style={{ gap: 16 }}>
        <Card>
          <div className="hstack" style={{ gap: 16, alignItems: 'flex-start' }}>
            <Person name={u.name} size="xl" meta={'@' + (u.username || '')} />
            <div className="grow" />
            <div className="hstack wrap" style={{ gap: 8 }}>
              <StatusBadge value={u.status} />
              {u.verified && <StatusBadge value="Verified" />}
              <Tag role>{role}</Tag>
            </div>
          </div>
          <div className="mt-16">
            <KV rows={[
              ['User ID', <span className="mono">{u.id}</span>],
              ['Username', '@' + (u.username || '—')],
              ['Region', u.location],
              ['Level', `Lv. ${u.level}`],
              ['Coin balance', Number(w.coins || 0).toLocaleString()],
              ['Diamonds', Number(w.diamonds || 0).toLocaleString()],
              ['Followers / Following', `${u.followers_count} / ${u.following_count}`],
              ['Joined', fmtDate(u.created_at)],
            ]} />
          </div>
        </Card>

        <Card title="Recent gifts">
          {data.gifts.length ? (
            <div className="feed">
              {data.gifts.map((g, i) => (
                <div className="feed__item" key={i}>
                  <span className="feed__dot"><Icon name="gift" size={14} /></span>
                  <div>
                    <div className="feed__text">{g.coins} coins — {g.sender?.name || '?'} → {g.receiver?.name || '?'}</div>
                    <div className="feed__time">{relativeTime(g.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState icon="gift" title="No gift activity yet" />}
        </Card>
      </div>

      <div className="vstack" style={{ gap: 16 }}>
        <Card title="Roles & KYC">
          <KV rows={[
            ['Platform role', <Tag role>{role}</Tag>],
            ['Staff role', sr ? <Tag>{ROLE_LABEL[sr.role] || sr.role}</Tag> : <span className="muted">None</span>],
            ['Host tier', hp ? <Tag>{hp.tier}</Tag> : <span className="muted">Not a host</span>],
            ['Host agency', hp?.agencies?.name || (hp ? 'Independent' : '—')],
            ['KYC status', kyc ? <StatusBadge value={kyc.status} /> : hp ? <StatusBadge value={hp.kyc_status} /> : <span className="muted">—</span>],
          ]} />
        </Card>
        <Card title="Host streams">
          {data.streams.length ? (
            <div className="feed">
              {data.streams.map((s, i) => (
                <div className="feed__item" key={i}>
                  <span className="feed__dot"><Icon name="radio" size={14} /></span>
                  <div>
                    <div className="feed__text">{s.title} · {s.status}</div>
                    <div className="feed__time">{Number(s.viewer_count || 0).toLocaleString()} viewers · {fmtDate(s.started_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState icon="radio" title="No streams" text={hp ? 'This host has not gone live yet.' : 'This user is not a host.'} />}
        </Card>
        <Card title="Account status">
          <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
            The only admin-writable field on a user profile is status (via the <code>set_profile_status</code> RPC).
            Other fields are edited by the user in-app.
          </p>
          <div className="hstack" style={{ gap: 8, flexWrap: 'wrap' }}>
            {STATUS_OPTS.map((s) => (
              <Button key={s} size="sm" variant={u.status === s ? 'primary' : 'ghost'} onClick={() => onStatus?.(s)}>
                {s}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

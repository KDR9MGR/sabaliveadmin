import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ListPage, StatGrid, AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, Badge, KV, useToast, EmptyState } from '../../components/ui.jsx'
import { personCol, statusCol, numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import Icon from '../../components/Icon.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { listHosts, getHostDetail, updateHost, fmtDate } from '../../lib/admin.js'
import { hosts as mockHosts, hostApplications } from '../../data/index.js'
import { AGENCIES } from '../../data/util.js'

const CRUMBS = ['Home', 'Host Management']
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
const opt = (v) => ({ value: v, label: cap(v.replace('_', ' ')) })
const TIER_OPTS = ['bronze', 'silver', 'gold', 'platinum'].map(opt)
const HOST_STATUS_OPTS = ['active', 'inactive', 'suspended', 'banned'].map(opt)
const KYC_OPTS = ['not_submitted', 'pending', 'verified', 'rejected'].map(opt)

/* Shared real-data host table — used by both /admin/hosts and /admin/users/hosts */
export function HostsTable({ title, crumbs }) {
  const nav = useNavigate()
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listHosts)
  const [editing, setEditing] = useState(null)

  const save = async (values) => {
    await updateHost(editing.id, { tier: values.tier, status: values.status, kyc_status: values.kyc_status })
    reload()
  }

  return (
    <>
      <PageHeader
        title={title}
        crumbs={crumbs}
        actions={<Button icon="download" onClick={() => toast('Export coming soon')}>Export</Button>}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          onRowClick={(r) => nav(`/admin/hosts/${r.id}`)}
          searchKeys={['name', 'username', 'agency', 'idShort']}
          searchPlaceholder="Search hosts by name or agency…"
          tabs={[
            { label: 'All', value: 'all', filter: () => true },
            { label: 'Active', value: 'a', filter: (r) => r.status === 'Active' },
            { label: 'Suspended', value: 's', filter: (r) => r.status === 'Suspended' },
            { label: 'Banned', value: 'b', filter: (r) => r.status === 'Banned' },
          ]}
          filters={[
            { label: 'Tier', options: ['Bronze', 'Silver', 'Gold', 'Platinum'], get: (r) => r.tier },
            { label: 'KYC', options: ['Not Submitted', 'Pending', 'Verified', 'Rejected'], get: (r) => r.kyc },
          ]}
          columns={[
            personCol('name', 'username'),
            { key: 'agency', header: 'Agency', sortable: true },
            { key: 'tier', header: 'Tier', render: (r) => <Tag>{r.tier}</Tag> },
            numCol('followers', 'Followers'),
            numCol('coins', 'Coins'),
            numCol('diamonds', 'Diamonds'),
            numCol('liveHours', 'Live hrs'),
            { key: 'kyc', header: 'KYC', render: (r) => <StatusBadge value={r.kyc} /> },
            statusCol(),
          ]}
          rowActions={(r) => [
            { label: 'View', icon: 'eye', onClick: () => nav(`/admin/hosts/${r.id}`) },
            { label: 'Edit tier / status', icon: 'edit', onClick: () => setEditing(r) },
            { sep: true },
            r.status === 'Banned'
              ? { label: 'Unban', icon: 'lock', onClick: async () => { await updateHost(r.id, { status: 'active' }); toast(`${r.name} unbanned`); reload() } }
              : { label: 'Ban', icon: 'lock', onClick: async () => { await updateHost(r.id, { status: 'banned' }); toast(`${r.name} banned`); reload() } },
          ]}
          emptyText="No hosts yet. Hosts appear here once users are approved as creators."
        />
      </AsyncView>

      {editing && (
        <EntityForm
          title={`Edit host — ${editing.name}`}
          onClose={() => setEditing(null)}
          onSubmit={save}
          savedMessage="Host updated"
          initial={{
            tier: editing.tier.toLowerCase(),
            status: editing.status.toLowerCase(),
            kyc_status: editing.kyc.toLowerCase().replace(' ', '_'),
          }}
          fields={[
            { name: 'tier', label: 'Tier', type: 'select', options: TIER_OPTS, required: true },
            { name: 'status', label: 'Status', type: 'select', options: HOST_STATUS_OPTS, required: true },
            { name: 'kyc_status', label: 'KYC status', type: 'select', options: KYC_OPTS },
          ]}
        />
      )}
    </>
  )
}

export function HostsMgmt() {
  return <HostsTable title="Host Management" crumbs={[...CRUMBS, 'Hosts']} />
}

/* --------------------------------------------------- Host detail (real) */
export function HostDetail() {
  const { id } = useParams()
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(() => getHostDetail(id), [id])

  const setStatus = async (status) => {
    await updateHost(id, { status })
    toast(`Status set to ${status}`)
    reload()
  }

  return (
    <>
      <PageHeader
        title={data?.host?.profiles?.name || 'Host'}
        crumbs={['Home', 'Host Management', 'Hosts', id?.slice(0, 8)]}
        actions={<>
          <Button icon="chevronLeft" onClick={() => history.back()}>Back</Button>
          {data?.host && (data.host.status === 'banned'
            ? <Button icon="lock" onClick={() => setStatus('active')}>Unban</Button>
            : <Button variant="danger" icon="lock" onClick={() => setStatus('banned')}>Ban</Button>)}
        </>}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        {data?.host ? <HostDetailBody data={data} /> : <LoadMissing />}
      </AsyncView>
    </>
  )
}

function LoadMissing() {
  return <Card><div className="card__body"><EmptyState icon="helpCircle" title="Host not found" text="This host profile doesn't exist or was removed." /></div></Card>
}

function HostDetailBody({ data }) {
  const h = data.host
  const p = h.profiles || {}
  const w = p.wallets || {}
  return (
    <>
      <StatGrid stats={[
        { key: 'Followers', value: Number(p.followers_count || 0).toLocaleString(), icon: 'users', tile: 'tile-purple' },
        { key: 'Coins', value: Number(w.coins || 0).toLocaleString(), icon: 'coins', tile: 'tile-orange' },
        { key: 'Diamonds', value: Number(w.diamonds || 0).toLocaleString(), icon: 'star', tile: 'tile-blue' },
        { key: 'Live hours', value: String(Math.round(Number(h.live_hours_total) || 0)), icon: 'radio', tile: 'tile-pink' },
      ]} />
      <div className="grid dash mt-16">
        <Card title="Recent streams" flush>
          {data.streams.length ? (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Title</th><th>Status</th><th className="right">Viewers</th><th className="right">Gift coins</th><th>Started</th></tr></thead>
                <tbody>
                  {data.streams.map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{s.title}</td>
                      <td><StatusBadge value={s.status} /></td>
                      <td className="right mono">{Number(s.viewer_count || 0).toLocaleString()}</td>
                      <td className="right mono">{Number(s.gift_coin_total || 0).toLocaleString()}</td>
                      <td>{fmtDate(s.started_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="card__body"><EmptyState icon="radio" title="No streams yet" /></div>}
        </Card>
        <Card title="Host info">
          <KV rows={[
            ['Host ID', <span className="mono">{h.profile_id?.slice(0, 8)}</span>],
            ['Username', p.username || '—'],
            ['Agency', h.agencies?.name || 'Independent'],
            ['Tier', <Tag>{h.tier}</Tag>],
            ['Rating', <span className="hstack" style={{ gap: 4 }}><Icon name="star" size={13} style={{ color: '#f59e0b' }} />{Number(h.rating).toFixed(1)}</span>],
            ['KYC', <StatusBadge value={h.kyc_status} />],
            ['Joined', fmtDate(p.created_at)],
            ['Status', <StatusBadge value={h.status} />],
          ]} />
        </Card>
      </div>
    </>
  )
}

/* --------------------------------------------------- Still on mock data (later phase) */
export function HostAssignment() {
  const toast = useToast()
  const rows = mockHosts.map((h) => ({
    ...h,
    subAdmin: ['Neha Verma', 'Rohit Bose', 'Kavya Iyer', 'Manish Das', 'Unassigned'][h.followers % 5],
  }))
  return (
    <ListPage
      title="Host Assignment"
      crumbs={[...CRUMBS, 'Assignment']}
      actions={<Button variant="primary" icon="userCheck" onClick={() => toast('Bulk assign')}>Bulk Assign</Button>}
      rows={rows}
      searchKeys={['name', 'agency', 'subAdmin', 'id']}
      tabs={[
        { label: 'All', value: 'all', filter: () => true },
        { label: 'Unassigned', value: 'u', filter: (r) => r.subAdmin === 'Unassigned' },
      ]}
      filters={[{ label: 'Agency', options: AGENCIES, get: (r) => r.agency }]}
      columns={[
        personCol('name', 'id'),
        { key: 'agency', header: 'Agency', sortable: true },
        { key: 'subAdmin', header: 'Sub Admin', render: (r) => r.subAdmin === 'Unassigned' ? <Badge tone="warning">Unassigned</Badge> : <Person name={r.subAdmin} size="sm" /> },
        numCol('liveHours', 'Live hrs'),
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Assign sub admin', icon: 'shieldUser', onClick: () => toast(`Assign for ${r.name}`) },
        { label: 'Change agency', icon: 'arrowLeftRight', onClick: () => toast('Change agency') },
      ]}
    />
  )
}

export function HostApplications() {
  const toast = useToast()
  return (
    <ListPage
      title="Host Applications"
      crumbs={[...CRUMBS, 'Applications']}
      rows={hostApplications}
      searchKeys={['applicant', 'email', 'agency', 'id']}
      tabs={[
        { label: 'Pending', value: 'p', filter: (r) => r.status === 'Pending' },
        { label: 'Under Review', value: 'r', filter: (r) => r.status === 'Under Review' },
        { label: 'Approved', value: 'a', filter: (r) => r.status === 'Approved' },
        { label: 'Rejected', value: 'x', filter: (r) => r.status === 'Rejected' },
        { label: 'All', value: 'all', filter: () => true },
      ]}
      columns={[
        personCol('applicant', 'email'),
        { key: 'agency', header: 'Applying via', sortable: true },
        { key: 'experience', header: 'Experience', render: (r) => <Tag>{r.experience}</Tag> },
        numCol('followersOtherApps', 'Ext. followers'),
        { key: 'submitted', header: 'Submitted' },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Review', icon: 'eye', onClick: () => toast(`Review ${r.id}`) },
        { label: 'Approve', icon: 'check', onClick: () => toast(`${r.applicant} approved`) },
        { label: 'Reject', icon: 'x', onClick: () => toast(`${r.applicant} rejected`) },
      ]}
    />
  )
}

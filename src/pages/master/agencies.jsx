import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ListPage, StatGrid, AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, KV, useToast, EmptyState } from '../../components/ui.jsx'
import { personCol, statusCol, numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import {
  listAgencies, getAgencyDetail, createAgency, updateAgency, deleteAgency, fmtDate,
} from '../../lib/admin.js'
import { transferRequests as mockTransferRequests } from '../../data/index.js'

const CRUMBS = ['Home', 'Agency Management']
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
const STATUS_OPTS = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

/* --------------------------------------------------- Agency list (real + CRUD) */
export function AgencyList({ crumbLabel = 'Agencies', crumbRoot = CRUMBS } = {}) {
  const nav = useNavigate()
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listAgencies)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)

  const create = async (v) => { await createAgency(v); reload() }
  const edit = async (v) => {
    await updateAgency(editing.id, { name: v.name, commission_percent: v.commission_percent, status: v.status, country: v.country })
    reload()
  }
  const remove = async (r) => {
    try { await deleteAgency(r.id); toast(`${r.name} deleted`); reload() }
    catch (e) { toast(e.message?.includes('violates foreign key') ? 'Cannot delete — the agency still has hosts assigned' : (e.message || 'Delete failed')) }
  }
  const toggleStatus = async (r) => {
    const next = r.status === 'Active' ? 'inactive' : 'active'
    await updateAgency(r.id, { status: next }); toast(`${r.name} → ${next}`); reload()
  }

  return (
    <>
      <PageHeader
        title="Agency Management"
        crumbs={[...crumbRoot, crumbLabel]}
        actions={<>
          <Button icon="download" onClick={() => toast('Export coming soon')}>Export</Button>
          <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add Agency</Button>
        </>}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          onRowClick={(r) => nav(`/admin/agencies/${r.id}`)}
          searchKeys={['name', 'manager', 'idShort', 'country']}
          searchPlaceholder="Search agencies…"
          filters={[
            { label: 'Status', options: ['Active', 'Inactive', 'Pending'], get: (r) => r.status },
          ]}
          columns={[
            { key: 'name', header: 'Agency', sortable: true, render: (r) => <Person name={r.name} meta={r.idShort} size="sm" /> },
            { key: 'manager', header: 'Manager', render: (r) => r.manager === 'Unassigned' ? <span className="muted">Unassigned</span> : r.manager },
            numCol('hosts', 'Hosts'),
            { key: 'commission', header: 'Commission', align: 'right', render: (r) => `${r.commission}%` },
            { key: 'country', header: 'Region' },
            statusCol(),
            { key: 'joined', header: 'Onboarded', sortable: true },
          ]}
          rowActions={(r) => [
            { label: 'View details', icon: 'eye', onClick: () => nav(`/admin/agencies/${r.id}`) },
            { label: 'Edit', icon: 'edit', onClick: () => setEditing(r) },
            { label: r.status === 'Active' ? 'Deactivate' : 'Activate', icon: 'lock', onClick: () => toggleStatus(r) },
            { sep: true },
            { label: 'Delete', icon: 'trash', onClick: () => remove(r) },
          ]}
          emptyText="No agencies yet — create one with “Add Agency”."
        />
      </AsyncView>

      {adding && (
        <EntityForm
          title="Add Agency" onClose={() => setAdding(false)} onSubmit={create} savedMessage="Agency created"
          initial={{ status: 'pending', country: 'India', commission_percent: 10 }}
          fields={[
            { name: 'name', label: 'Agency name', required: true },
            { name: 'commission_percent', label: 'Commission %', type: 'number' },
            { name: 'country', label: 'Region' },
            { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
          ]}
        />
      )}
      {editing && (
        <EntityForm
          title={`Edit — ${editing.name}`} onClose={() => setEditing(null)} onSubmit={edit} savedMessage="Agency updated"
          initial={{
            name: editing.name,
            commission_percent: editing.commission,
            country: editing.country,
            status: editing.status.toLowerCase(),
          }}
          fields={[
            { name: 'name', label: 'Agency name', required: true },
            { name: 'commission_percent', label: 'Commission %', type: 'number' },
            { name: 'country', label: 'Region' },
            { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
          ]}
        />
      )}
    </>
  )
}

/* --------------------------------------------------- Agency detail (real) */
export function AgencyDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(() => getAgencyDetail(id), [id])
  const [editing, setEditing] = useState(false)

  const a = data?.agency
  const edit = async (v) => {
    await updateAgency(id, { name: v.name, commission_percent: v.commission_percent, status: v.status, country: v.country })
    reload()
  }

  return (
    <>
      <PageHeader
        title={a?.name || 'Agency'}
        crumbs={['Home', 'Agency Management', 'Agencies', id?.slice(0, 8)]}
        actions={<>
          <Button icon="chevronLeft" onClick={() => history.back()}>Back</Button>
          {a && <Button icon="edit" onClick={() => setEditing(true)}>Edit</Button>}
        </>}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        {a ? <AgencyDetailBody data={data} onOpenHost={(hid) => nav(`/admin/hosts/${hid}`)} /> : (
          <Card><div className="card__body"><EmptyState icon="helpCircle" title="Agency not found" text="No agency with this ID." /></div></Card>
        )}
      </AsyncView>

      {editing && a && (
        <EntityForm
          title={`Edit — ${a.name}`} onClose={() => setEditing(false)} onSubmit={edit} savedMessage="Agency updated"
          initial={{ name: a.name, commission_percent: a.commission_percent, country: a.country, status: a.status }}
          fields={[
            { name: 'name', label: 'Agency name', required: true },
            { name: 'commission_percent', label: 'Commission %', type: 'number' },
            { name: 'country', label: 'Region' },
            { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
          ]}
        />
      )}
    </>
  )
}

function AgencyDetailBody({ data, onOpenHost }) {
  const a = data.agency
  const totalCoins = data.hosts.reduce((s, h) => s + (h.coins || 0), 0)
  return (
    <>
      <StatGrid stats={[
        { key: 'Hosts', value: String(data.hosts.length), icon: 'video', tile: 'tile-green' },
        { key: 'Coins (roster total)', value: totalCoins.toLocaleString(), icon: 'coins', tile: 'tile-orange' },
        { key: 'Commission', value: `${a.commission_percent}%`, icon: 'dollar', tile: 'tile-blue' },
        { key: 'Status', value: cap(a.status), icon: 'building', tile: 'tile-purple' },
      ]} />

      <Card title="Agency info" className="mt-16">
        <KV rows={[
          ['Agency ID', <span className="mono">{a.id}</span>],
          ['Manager', a.manager?.name || 'Unassigned'],
          ['Region', a.country],
          ['Commission', `${a.commission_percent}%`],
          ['Onboarded', fmtDate(a.created_at)],
          ['Status', <StatusBadge value={a.status} />],
        ]} />
      </Card>

      <div className="spread mt-24" style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 15 }}>Host roster</h3>
      </div>
      {data.hosts.length ? (
        <DataTable
          rows={data.hosts}
          pageSize={8}
          searchKeys={['name', 'idShort']}
          onRowClick={(r) => onOpenHost(r.id)}
          columns={[
            personCol('name', 'idShort'),
            { key: 'tier', header: 'Tier', render: (r) => <Tag>{r.tier}</Tag> },
            numCol('followers', 'Followers'),
            numCol('coins', 'Coins'),
            numCol('liveHours', 'Live hrs'),
            statusCol(),
          ]}
        />
      ) : (
        <Card><div className="card__body"><EmptyState icon="video" title="No hosts in this agency yet" text="Assign hosts to this agency from Host Management or approve transfer requests." /></div></Card>
      )}
    </>
  )
}

/* --------------------------------------------------- Still on mock data */
export function AgencyRequests() {
  const toast = useToast()
  const rows = mockTransferRequests.filter((r) => r.type === 'Agency')
  return (
    <ListPage
      title="Agency Requests"
      crumbs={[...CRUMBS, 'Requests']}
      rows={rows}
      searchKeys={['subject', 'requestedBy', 'id']}
      columns={[
        { key: 'id', header: 'Request', render: (r) => <span className="mono muted">{r.id}</span> },
        { key: 'subject', header: 'Agency', sortable: true },
        { key: 'reason', header: 'Detail' },
        { key: 'date', header: 'Submitted', sortable: true },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Approve', icon: 'check', onClick: () => toast(`${r.id} approved`) },
        { label: 'Reject', icon: 'x', onClick: () => toast(`${r.id} rejected`) },
      ]}
    />
  )
}

export function CommissionPlans() {
  const toast = useToast()
  const plans = [
    { id: 'CP1', name: 'Standard', rate: '15%', bonus: 'None', minHosts: 5, status: 'Active' },
    { id: 'CP2', name: 'Growth', rate: '18%', bonus: '+2% over ₹1L', minHosts: 15, status: 'Active' },
    { id: 'CP3', name: 'Premium', rate: '22%', bonus: '+3% over ₹3L', minHosts: 40, status: 'Active' },
  ]
  return (
    <ListPage
      title="Commission Plans"
      crumbs={[...CRUMBS, 'Commission Plans']}
      actions={<Button variant="primary" icon="plus" onClick={() => toast('Commission plans are not modelled in the backend yet')}>New Plan</Button>}
      rows={plans}
      searchKeys={['name', 'id']}
      columns={[
        { key: 'name', header: 'Plan', sortable: true, render: (r) => <b>{r.name}</b> },
        { key: 'rate', header: 'Base rate', align: 'right' },
        { key: 'bonus', header: 'Bonus tier' },
        numCol('minHosts', 'Min hosts'),
        statusCol(),
      ]}
    />
  )
}

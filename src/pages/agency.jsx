import { useState } from 'react'
import { StatGrid, TableSkeleton, LoadError } from './_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, Badge, KV, useToast, EmptyState } from '../components/ui.jsx'
import { personCol, statusCol, numCol } from '../components/cells.jsx'
import DataTable from '../components/DataTable.jsx'
import EntityForm from '../components/EntityForm.jsx'
import { AreaChart, BarChart } from '../components/charts.jsx'
import Icon from '../components/Icon.jsx'
import PanelChip from '../components/PanelChip.jsx'
import { boldMd } from '../data/util.js'
import { useAsyncData } from '../lib/useAsync.js'
import { useAgencyScope, AgencyScopeBar } from '../lib/agencyScope.jsx'
import {
  getAgency, agencyDashboard, listAgencyHosts, listAgencyApplications,
  listAgencyAssignments, listAgencySubAdmins, listAgencySalary, agencyEarnings,
} from '../lib/agency.js'
import { updateHost } from '../lib/admin.js'
import { decideHostApplication, markHostApplicationUnderReview, createAssignment, updateAssignment } from '../lib/workflows.js'
import { createSalaryPayment, setSalaryStatus, updateSalaryPayment, SALARY_ROLES } from '../lib/salary.js'
import { num } from '../data/index.js'

const CR = ['Home', 'Agency']
const opt = (v) => ({ value: v, label: v.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') })
const TIER_OPTS = ['bronze', 'silver', 'gold', 'platinum'].map(opt)
const HOST_STATUS_OPTS = ['active', 'inactive', 'suspended', 'banned'].map(opt)
const KYC_OPTS = ['not_submitted', 'pending', 'verified', 'rejected'].map(opt)
const SHIFT_OPTS = ['morning', 'evening', 'night', 'flexible'].map(opt)
const ASSIGN_STATUS_OPTS = ['on_track', 'behind', 'exceeded'].map(opt)
const SALARY_ROLE_OPTS = SALARY_ROLES.map(opt)

/* Common shell: scope bar + async fork. Renders nothing useful until an agency is in scope. */
function AgencyPage({ title, actions, load, children }) {
  const { agencyId } = useAgencyScope()
  return (
    <>
      <PageHeader title={title} crumbs={[...CR, title]} actions={agencyId ? actions : null} />
      <AgencyScopeBar />
      {agencyId
        ? <ScopedBody agencyId={agencyId} load={load}>{children}</ScopedBody>
        : null}
    </>
  )
}
function ScopedBody({ agencyId, load, children }) {
  const { data, loading, error, reload } = useAsyncData(() => load(agencyId), [agencyId])
  if (error) return <LoadError error={error} onRetry={reload} />
  if (loading || data == null) return <TableSkeleton />
  return children(data, reload)
}

/* --------------------------------------------------- Dashboard */
export function AgencyDashboard() {
  const { agencyName } = useAgencyScope()
  return (
    <AgencyPage title="Dashboard" load={agencyDashboard}>
      {(d) => (
        <>
          <div className="banner" style={{ marginBottom: 16 }}>
            <h3>{agencyName || 'Your agency'} <PanelChip panel="agency" /></h3>
            <p>{d.stats[0].value} hosts · {d.stats[1].value} live now</p>
          </div>
          <StatGrid stats={d.stats} />
          <div className="grid dash mt-16">
            <Card title="Coins gifted to your hosts" sub="Last 30 days">
              {d.coinSeries.some((n) => n > 0)
                ? <AreaChart series={d.coinSeries} categories={d.days} color="#22a06b" height={240} label="Coins" />
                : <EmptyState icon="coins" title="No gift activity in the last 30 days" />}
            </Card>
            <Card title="Recent activity">
              {d.activities.length ? (
                <div className="feed">
                  {d.activities.map((a, i) => (
                    <div className="feed__item" key={i}>
                      <span className="feed__dot"><Icon name={a.icon} size={14} /></span>
                      <div><div className="feed__text" dangerouslySetInnerHTML={{ __html: boldMd(a.text) }} /><div className="feed__time">{a.time}</div></div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState icon="activity" title="No recent activity" />}
            </Card>
          </div>
          <div className="spread mt-24" style={{ marginBottom: 12 }}><h3 style={{ fontSize: 15 }}>Top hosts by coins</h3></div>
          {d.topHosts.length ? (
            <table className="mini-table">
              <thead><tr><th>#</th><th>Host</th><th>Live hrs</th><th className="right">Coins</th></tr></thead>
              <tbody>
                {d.topHosts.map((h, i) => (
                  <tr key={h.name}><td><span className="rank">{i + 1}</span></td><td><Person name={h.name} size="sm" /></td><td>{h.hours}</td><td className="right mono">{num(h.coins)}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <Card><div className="card__body"><EmptyState icon="video" title="No hosts in this agency yet" /></div></Card>}
        </>
      )}
    </AgencyPage>
  )
}

/* --------------------------------------------------- My Agency (read-only — agencies UPDATE is admin-only) */
export function MyAgency() {
  return (
    <AgencyPage title="My Agency" load={getAgency}>
      {(a) => (
        <div className="grid dash">
          <Card title="Agency profile" sub="Edited by platform admins — read-only here">
            <KV rows={[
              ['Name', a.name],
              ['Agency ID', <span className="mono">{a.id}</span>],
              ['Manager', a.manager?.name || 'Unassigned'],
              ['Region', a.country],
              ['Commission', `${a.commission_percent}%`],
              ['Onboarded', new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })],
              ['Status', <StatusBadge value={a.status} />],
            ]} />
          </Card>
          <Card title="Need a change?">
            <p className="muted" style={{ fontSize: 12.5 }}>
              Name, commission and status are managed by the platform team. Ask a Master admin, or raise a transfer request for host moves.
            </p>
          </Card>
        </div>
      )}
    </AgencyPage>
  )
}

/* --------------------------------------------------- Hosts */
function HostsBody({ rows, reload }) {
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const save = async (v) => { await updateHost(editing.id, { tier: v.tier, status: v.status, kyc_status: v.kyc_status }); reload() }
  return (
    <>
      <DataTable
        rows={rows}
        searchKeys={['name', 'username', 'idShort']}
        tabs={[
          { label: 'All', value: 'all', filter: () => true },
          { label: 'Active', value: 'a', filter: (r) => r.status === 'Active' },
          { label: 'Banned', value: 'b', filter: (r) => r.status === 'Banned' },
        ]}
        filters={[{ label: 'Tier', options: ['Bronze', 'Silver', 'Gold', 'Platinum'], get: (r) => r.tier }]}
        columns={[
          personCol('name', 'username'),
          { key: 'tier', header: 'Tier', render: (r) => <Tag>{r.tier}</Tag> },
          numCol('followers', 'Followers'),
          numCol('coins', 'Coins'),
          numCol('diamonds', 'Diamonds'),
          numCol('liveHours', 'Live hrs'),
          { key: 'kyc', header: 'KYC', render: (r) => <StatusBadge value={r.kyc} /> },
          statusCol(),
        ]}
        rowActions={(r) => [
          { label: 'Edit tier / status', icon: 'edit', onClick: () => setEditing(r) },
          { sep: true },
          r.status === 'Banned'
            ? { label: 'Unban', icon: 'lock', onClick: async () => { await updateHost(r.id, { status: 'active' }); toast(`${r.name} unbanned`); reload() } }
            : { label: 'Ban', icon: 'lock', onClick: async () => { await updateHost(r.id, { status: 'banned' }); toast(`${r.name} banned`); reload() } },
        ]}
        emptyText="No hosts assigned to this agency yet."
      />
      {editing && (
        <EntityForm title={`Edit host — ${editing.name}`} onClose={() => setEditing(null)} onSubmit={save} savedMessage="Host updated"
          initial={{ tier: editing.tier.toLowerCase(), status: editing.status.toLowerCase(), kyc_status: editing.kyc.toLowerCase().replace(' ', '_') }}
          fields={[
            { name: 'tier', label: 'Tier', type: 'select', options: TIER_OPTS, required: true },
            { name: 'status', label: 'Status', type: 'select', options: HOST_STATUS_OPTS, required: true },
            { name: 'kyc_status', label: 'KYC status', type: 'select', options: KYC_OPTS },
          ]} />
      )}
    </>
  )
}
export function AgencyHosts() {
  return <AgencyPage title="Host Management" load={listAgencyHosts}>{(rows, reload) => <HostsBody rows={rows} reload={reload} />}</AgencyPage>
}
export function AgencyHostProfiles() {
  return (
    <AgencyPage title="Host Profiles" load={listAgencyHosts}>
      {(rows) => (
        <DataTable
          rows={rows}
          searchKeys={['name', 'username', 'idShort']}
          columns={[
            personCol('name', 'username'),
            { key: 'tier', header: 'Tier', render: (r) => <Tag>{r.tier}</Tag> },
            { key: 'verified', header: 'Verified', render: (r) => r.kyc === 'Verified' ? <StatusBadge value="Verified" /> : <span className="muted">No</span> },
            { key: 'rating', header: 'Rating', align: 'right' },
            statusCol(),
          ]}
          emptyText="No host profiles yet."
        />
      )}
    </AgencyPage>
  )
}

/* --------------------------------------------------- Applications */
export function AgencyApplications() {
  const toast = useToast()
  return (
    <AgencyPage title="Host Applications" load={listAgencyApplications}>
      {(rows, reload) => {
        const decide = async (r, approve) => {
          try { await decideHostApplication(r.id, approve); toast(`${r.applicant} → ${approve ? 'approved' : 'rejected'}`); reload() }
          catch (e) { toast(e.message || 'Could not update') }
        }
        const review = async (r) => {
          try { await markHostApplicationUnderReview(r.id); toast(`${r.applicant} → under review`); reload() }
          catch (e) { toast(e.message || 'Could not update') }
        }
        return (
          <DataTable
            rows={rows}
            searchKeys={['applicant', 'username', 'idShort']}
            tabs={[
              { label: 'Pending', value: 'p', filter: (r) => r.status === 'Pending' },
              { label: 'Under Review', value: 'r', filter: (r) => r.status === 'Under Review' },
              { label: 'Approved', value: 'a', filter: (r) => r.status === 'Approved' },
              { label: 'All', value: 'all', filter: () => true },
            ]}
            columns={[
              personCol('applicant', 'username'),
              { key: 'experience', header: 'Experience', render: (r) => <Tag>{r.experience}</Tag> },
              numCol('extFollowers', 'Ext. followers'),
              { key: 'submitted', header: 'Submitted', sortable: true },
              statusCol(),
            ]}
            rowActions={(r) => {
              const open = r.status === 'Pending' || r.status === 'Under Review'
              return [
                ...(r.status === 'Pending' ? [{ label: 'Mark under review', icon: 'eye', onClick: () => review(r) }] : []),
                ...(open ? [
                  { label: 'Approve', icon: 'check', onClick: () => decide(r, true) },
                  { label: 'Reject', icon: 'x', onClick: () => decide(r, false) },
                ] : [{ label: 'Decided', icon: 'eye', onClick: () => {} }]),
              ]
            }}
            emptyText="No applications routed to this agency."
          />
        )
      }}
    </AgencyPage>
  )
}

/* --------------------------------------------------- Assignments */
export function AgencyAssignments() {
  const { agencyId } = useAgencyScope()
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const { data: pickers } = useAsyncData(async () => {
    if (!agencyId) return { hosts: [], subs: [] }
    const [h, s] = await Promise.all([listAgencyHosts(agencyId), listAgencySubAdmins(agencyId)])
    return { hosts: h.map((x) => ({ value: x.id, label: x.name })), subs: s.map((x) => ({ value: x.id, label: x.name })) }
  }, [agencyId])

  return (
    <AgencyPage
      title="Assignments"
      load={listAgencyAssignments}
      actions={<Button variant="primary" icon="userCheck" onClick={() => setAdding(true)}>New Assignment</Button>}
    >
      {(rows, reload) => {
        const create = async (v) => { await createAssignment(v); reload() }
        const edit = async (v) => { await updateAssignment(editing.id, { shift: v.shift, status: v.status, target_hours: v.target_hours, done_hours: v.done_hours }); reload() }
        return (
          <>
            <DataTable
              rows={rows}
              searchKeys={['host', 'subAdmin', 'idShort']}
              columns={[
                personCol('host', 'idShort'),
                { key: 'subAdmin', header: 'Sub Admin', render: (r) => <Person name={r.subAdmin} size="sm" /> },
                { key: 'shift', header: 'Shift', render: (r) => <Tag>{r.shift}</Tag> },
                { key: 'hours', header: 'Hours', render: (r) => (
                  <div style={{ minWidth: 130 }}>
                    <div className="hstack spread" style={{ fontSize: 11, marginBottom: 4 }}><span>{r.done}h</span><span className="muted">/ {r.target}h</span></div>
                    <div className="progress"><span style={{ width: Math.min(100, r.target ? (r.done / r.target) * 100 : 0) + '%' }} /></div>
                  </div>
                ) },
                statusCol(),
              ]}
              rowActions={(r) => [{ label: 'Edit', icon: 'edit', onClick: () => setEditing(r) }]}
              emptyText="No assignments yet."
            />
            {adding && (
              <EntityForm title="New Assignment" onClose={() => setAdding(false)} onSubmit={create} savedMessage="Assignment created"
                initial={{ shift: 'flexible' }}
                fields={[
                  { name: 'host_id', label: 'Host', type: 'select', required: true, options: pickers?.hosts || [] },
                  { name: 'sub_admin_id', label: 'Sub Admin', type: 'select', required: true, options: pickers?.subs || [], hint: (pickers && !pickers.subs.length) ? 'No sub-admins in this agency yet' : undefined },
                  { name: 'shift', label: 'Shift', type: 'select', options: SHIFT_OPTS },
                  { name: 'target_hours', label: 'Target hours', type: 'number' },
                ]} />
            )}
            {editing && (
              <EntityForm title={`Edit — ${editing.host}`} onClose={() => setEditing(null)} onSubmit={edit} savedMessage="Assignment updated"
                initial={{ shift: editing.shift.toLowerCase(), status: editing.status.toLowerCase().replace(' ', '_'), target_hours: editing.target, done_hours: editing.done }}
                fields={[
                  { name: 'shift', label: 'Shift', type: 'select', options: SHIFT_OPTS },
                  { name: 'status', label: 'Status', type: 'select', options: ASSIGN_STATUS_OPTS },
                  { name: 'target_hours', label: 'Target hours', type: 'number' },
                  { name: 'done_hours', label: 'Done hours', type: 'number' },
                ]} />
            )}
          </>
        )
      }}
    </AgencyPage>
  )
}

/* --------------------------------------------------- Sub Admins (read-only) */
export function AgencySubAdmins() {
  return (
    <AgencyPage title="Sub Admins" load={listAgencySubAdmins}>
      {(rows) => (
        <>
          <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
            Sub-admin roles are granted by a Super Admin. This is a read-only list of the sub-admins scoped to your agency.
          </div></Card>
          <DataTable
            rows={rows}
            searchKeys={['name', 'username', 'idShort']}
            columns={[
              personCol('name', 'username'),
              { key: 'idShort', header: 'User ID', render: (r) => <span className="mono muted">{r.idShort}</span> },
              { key: 'accountStatus', header: 'Account', render: (r) => <StatusBadge value={r.accountStatus} /> },
              { key: 'granted', header: 'Granted', sortable: true },
            ]}
            emptyText="No sub-admins assigned to this agency."
          />
        </>
      )}
    </AgencyPage>
  )
}

/* --------------------------------------------------- Statistics */
export function AgencyStats() {
  return (
    <AgencyPage title="Statistics" load={agencyDashboard}>
      {(d) => (
        <>
          <StatGrid stats={d.stats} />
          <div className="grid cols-2 mt-16">
            <Card title="Coins by top host">
              {d.topHosts.length
                ? <BarChart series={d.topHosts.map((h) => Math.round(h.coins / 1000))} categories={d.topHosts.map((h) => h.name.split(' ')[0])} color="#7c3aed" height={240} label="Coins (K)" horizontal />
                : <EmptyState icon="chart" title="No host data yet" />}
            </Card>
            <Card title="Coins gifted trend" sub="Last 30 days">
              {d.coinSeries.some((n) => n > 0)
                ? <AreaChart series={d.coinSeries} categories={d.days} color="#22a06b" height={240} label="Coins" />
                : <EmptyState icon="coins" title="No gift activity" />}
            </Card>
          </div>
        </>
      )}
    </AgencyPage>
  )
}

/* --------------------------------------------------- Earnings */
export function AgencyEarnings() {
  return (
    <AgencyPage title="Earnings" load={agencyEarnings}>
      {(rows) => (
        <>
          <StatGrid stats={[
            { key: 'Hosts', value: String(rows.length), icon: 'video', tile: 'tile-green' },
            { key: 'Gross (est.)', value: '₹' + num(rows.reduce((s, r) => s + r.gross, 0)), icon: 'dollar', tile: 'tile-blue' },
            { key: 'Diamonds (roster)', value: num(rows.reduce((s, r) => s + r.diamonds, 0)), icon: 'star', tile: 'tile-orange' },
            { key: 'On hold', value: String(rows.filter((r) => r.status === 'On Hold').length), icon: 'lock', tile: 'tile-red' },
          ]} />
          <div className="mt-16">
            <DataTable
              rows={rows}
              searchKeys={['host', 'username', 'idShort']}
              columns={[
                personCol('host', 'username'),
                numCol('coins', 'Coins'),
                numCol('diamonds', 'Diamonds'),
                numCol('gross', 'Gross (est.)', { prefix: '₹' }),
                statusCol(),
              ]}
              emptyText="No hosts to compute earnings for."
            />
          </div>
        </>
      )}
    </AgencyPage>
  )
}

/* --------------------------------------------------- Salary (scoped CRUD) */
export function AgencySalary() {
  const { agencyId } = useAgencyScope()
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const { data: payees } = useAsyncData(async () => {
    if (!agencyId) return []
    const [h, s] = await Promise.all([listAgencyHosts(agencyId), listAgencySubAdmins(agencyId)])
    return [...h.map((x) => ({ value: x.id, label: `${x.name} (host)` })), ...s.map((x) => ({ value: x.id, label: `${x.name} (sub admin)` }))]
  }, [agencyId])

  const fields = [
    { name: 'payee_id', label: 'Payee', type: 'select', required: true, options: payees || [] },
    { name: 'role', label: 'Role', type: 'select', required: true, options: SALARY_ROLE_OPTS },
    { name: 'period', label: 'Period', required: true, placeholder: 'e.g. Sep 2026' },
    { name: 'base_amount', label: 'Base (₹)', type: 'number', required: true },
    { name: 'bonus_amount', label: 'Bonus (₹)', type: 'number' },
    { name: 'deductions', label: 'Deductions (₹)', type: 'number' },
  ]

  return (
    <AgencyPage
      title="Salary"
      load={listAgencySalary}
      actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>New Payslip</Button>}
    >
      {(rows, reload) => {
        const setStatus = async (r, status) => {
          try { await setSalaryStatus(r.id, status); toast(`${r.payee} → ${status.replace('_', ' ')}`); reload() }
          catch (e) { toast(e.message || 'Could not update') }
        }
        return (
          <>
            <StatGrid stats={[
              { key: 'Payslips', value: String(rows.length), icon: 'users', tile: 'tile-purple' },
              { key: 'Gross', value: '₹' + num(rows.reduce((s, r) => s + r.base + r.bonus, 0)), icon: 'dollar', tile: 'tile-green' },
              { key: 'Net payable', value: '₹' + num(rows.reduce((s, r) => s + r.net, 0)), icon: 'wallet', tile: 'tile-blue' },
              { key: 'On hold', value: String(rows.filter((r) => r.status === 'On Hold').length), icon: 'lock', tile: 'tile-red' },
            ]} />
            <div className="mt-16">
              <DataTable
                rows={rows}
                searchKeys={['payee', 'username', 'period', 'idShort']}
                tabs={[
                  { label: 'All', value: 'all', filter: () => true },
                  { label: 'Processing', value: 'pr', filter: (r) => r.status === 'Processing' },
                  { label: 'Paid', value: 'p', filter: (r) => r.status === 'Paid' },
                  { label: 'On Hold', value: 'h', filter: (r) => r.status === 'On Hold' },
                ]}
                columns={[
                  personCol('payee', 'username'),
                  { key: 'role', header: 'Role', render: (r) => <Tag>{r.role}</Tag> },
                  { key: 'period', header: 'Period', sortable: true },
                  numCol('base', 'Base', { prefix: '₹' }),
                  numCol('bonus', 'Bonus', { prefix: '₹' }),
                  numCol('deductions', 'Deductions', { prefix: '₹' }),
                  numCol('net', 'Net', { prefix: '₹' }),
                  { key: 'paidAt', header: 'Paid on' },
                  statusCol(),
                ]}
                rowActions={(r) => [
                  { label: 'Edit amounts', icon: 'edit', onClick: () => setEditing(r) },
                  { sep: true },
                  ...(r.status !== 'Paid' ? [{ label: 'Mark paid', icon: 'check', onClick: () => setStatus(r, 'paid') }] : []),
                  ...(r.status !== 'On Hold' ? [{ label: 'Put on hold', icon: 'lock', onClick: () => setStatus(r, 'on_hold') }] : []),
                  ...(r.status !== 'Processing' ? [{ label: 'Back to processing', icon: 'refresh', onClick: () => setStatus(r, 'processing') }] : []),
                ]}
                emptyText="No payslips for this agency yet."
              />
            </div>
            {adding && (
              <EntityForm title="New Payslip" onClose={() => setAdding(false)} savedMessage="Payslip created"
                onSubmit={async (v) => { await createSalaryPayment({ ...v, agency_id: agencyId }); reload() }}
                fields={fields} />
            )}
            {editing && (
              <EntityForm title={`Edit — ${editing.payee}`} onClose={() => setEditing(null)} savedMessage="Payslip updated"
                onSubmit={async (v) => { await updateSalaryPayment(editing.id, v); reload() }}
                initial={{ period: editing.period, role: editing.role.toLowerCase().replace(' ', '_'), base_amount: editing.base, bonus_amount: editing.bonus, deductions: editing.deductions }}
                fields={fields.filter((f) => f.name !== 'payee_id')} />
            )}
          </>
        )
      }}
    </AgencyPage>
  )
}

/* --------------------------------------------------- Agency Account (not modelled) */
export function AgencyAccount() {
  return (
    <>
      <PageHeader title="Agency Account" crumbs={[...CR, 'Account']} />
      <AgencyScopeBar />
      <Card><div className="card__body">
        <EmptyState icon="idCard" title="Payout account isn't modelled yet"
          text="Bank / payout details for agencies aren't in the backend schema. Payslip status lives under Salary; host transfers under the Master panel." />
      </div></Card>
    </>
  )
}

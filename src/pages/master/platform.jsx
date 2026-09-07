import { useState } from 'react'
import { ListPage, StatGrid, AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, Badge, PillTabs, useToast } from '../../components/ui.jsx'
import { personCol, statusCol, numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import { AreaChart, BarChart, DonutChart } from '../../components/charts.jsx'
import Icon from '../../components/Icon.jsx'
import {
  badges, frames, leaderboardFrames, reports,
} from '../../data/index.js'
import { AGENCIES, num } from '../../data/util.js'
import { useAsyncData } from '../../lib/useAsync.js'
import {
  listSalary, createSalaryPayment, updateSalaryPayment, setSalaryStatus,
  payeeOptions, agencyOptions, SALARY_ROLES, SALARY_STATUSES,
} from '../../lib/salary.js'
import { listLiveRequests, decideLiveRequest, listActiveStreams } from '../../lib/workflows.js'

/* ------------------------------------------------------------------ Live Requests */
export function LiveRequests() {
  const [view, setView] = useState('Requests')
  return (
    <>
      <PageHeader
        title="Live Requests"
        crumbs={['Home', 'Platform', 'Live Requests']}
        actions={<PillTabs tabs={['Requests', 'Active Rooms']} value={view} onChange={setView} />}
      />
      {view === 'Requests' ? <RequestsTable /> : <ActiveRooms />}
    </>
  )
}

function RequestsTable() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listLiveRequests)
  const [busy, setBusy] = useState(null)

  const decide = async (r, approve) => {
    setBusy(r.id)
    try {
      await decideLiveRequest(r.id, approve)
      toast(`${r.idShort} ${approve ? 'approved' : 'rejected'}`)
      reload()
    } catch (e) {
      toast(e.message || 'Could not update request')
    } finally {
      setBusy(null)
    }
  }

  return (
    <AsyncView loading={loading} error={error} reload={reload}>
      <DataTable
        rows={rows || []}
        searchKeys={['host', 'username', 'type', 'idShort']}
        tabs={[
          { label: 'Pending', value: 'p', filter: (r) => r.status === 'Pending' },
          { label: 'Approved', value: 'a', filter: (r) => r.status === 'Approved' },
          { label: 'Rejected', value: 'r', filter: (r) => r.status === 'Rejected' },
          { label: 'All', value: 'all', filter: () => true },
        ]}
        filters={[
          { label: 'Type', options: [...new Set((rows || []).map((r) => r.type))], get: (r) => r.type },
          { label: 'Priority', options: ['High', 'Medium', 'Low'], get: (r) => r.priority },
        ]}
        columns={[
          { key: 'idShort', header: 'Request', render: (r) => <span className="mono muted">{r.idShort}</span> },
          { key: 'host', header: 'Host', render: (r) => <Person name={r.host} size="sm" meta={r.username ? `@${r.username}` : undefined} /> },
          { key: 'type', header: 'Type', render: (r) => <Tag>{r.type}</Tag> },
          { key: 'priority', header: 'Priority', render: (r) => <Badge tone={r.priority === 'High' ? 'danger' : r.priority === 'Medium' ? 'warning' : 'muted'}>{r.priority}</Badge> },
          { key: 'notes', header: 'Notes', render: (r) => <span className="muted" style={{ fontSize: 12 }}>{r.notes}</span> },
          { key: 'submitted', header: 'Submitted', sortable: true },
          statusCol(),
        ]}
        rowActions={(r) => (r.status === 'Pending' ? [
          { label: busy === r.id ? 'Working…' : 'Approve', icon: 'check', onClick: () => decide(r, true) },
          { label: 'Reject', icon: 'x', onClick: () => decide(r, false) },
        ] : [
          { label: `Reviewed by ${r.reviewedBy}`, icon: 'eye', onClick: () => toast(`${r.idShort} — ${r.status} on ${r.reviewed}`) },
        ])}
        emptyText="No live requests."
      />
    </AsyncView>
  )
}

function ActiveRooms() {
  const toast = useToast()
  const { data: rooms, loading, error, reload } = useAsyncData(listActiveStreams)
  return (
    <AsyncView loading={loading} error={error} reload={reload}>
      {(rooms || []).length === 0 ? (
        <Card><div className="card__body"><Icon name="radio" size={20} /> <span className="muted">No streams are live right now.</span></div></Card>
      ) : (
        <div className="live-grid">
          {rooms.map((room) => (
            <div className="live-card" key={room.id}>
              <div className="live-card__thumb">
                <Icon name="radio" size={28} />
                <span className="live-card__live">● LIVE</span>
                <span className="live-card__views">{num(room.viewers)} watching</span>
              </div>
              <div className="live-card__body">
                <div className="hstack spread">
                  <Person name={room.host} size="sm" meta={room.username ? `@${room.username}` : room.category} />
                  {room.isPk && <Badge tone="warning">PK</Badge>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>{room.title}</div>
                <div className="hstack spread muted" style={{ fontSize: 12 }}>
                  <span>{room.duration} · 🪙 {num(room.coins)} · ♥ {num(room.likes)}</span>
                  <button className="btn btn--sm btn--ghost" onClick={() => toast(`${room.idShort} — ${room.host}`)}>Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AsyncView>
  )
}

/* ------------------------------------------------------------------ Badge Management */
export function BadgeManagement() {
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  return (
    <>
      <PageHeader
        title="Badge Management"
        crumbs={['Home', 'Platform', 'Badges']}
        actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add Badge</Button>}
      />
      <div className="gallery" style={{ marginBottom: 20 }}>
        {badges.map((b) => (
          <div className="gallery__item" key={b.id}>
            <div className="gallery__preview">{b.emoji}</div>
            <div className="gallery__meta">
              <div>
                <div className="n">{b.name}</div>
                <div className="muted" style={{ fontSize: 11 }}>{num(b.holders)} holders</div>
              </div>
              <StatusBadge value={b.status} />
            </div>
          </div>
        ))}
      </div>
      <DataTable
        rows={badges}
        searchKeys={['name', 'criteria', 'id']}
        columns={[
          { key: 'name', header: 'Badge', sortable: true, render: (r) => <span className="hstack" style={{ gap: 10 }}><span style={{ fontSize: 20 }}>{r.emoji}</span><b>{r.name}</b></span> },
          { key: 'criteria', header: 'Unlock criteria' },
          numCol('holders', 'Holders'),
          statusCol(),
        ]}
        rowActions={(r) => [
          { label: 'Edit', icon: 'edit', onClick: () => toast(`Edit ${r.name}`) },
          { label: 'Grant manually', icon: 'userPlus', onClick: () => toast('Grant flow') },
          { label: r.status === 'Active' ? 'Retire' : 'Activate', icon: 'lock', onClick: () => toast('Toggled') },
        ]}
      />
      {adding && (
        <EntityForm title="Add Badge" onClose={() => setAdding(false)} savedMessage="Badge created"
          fields={[
            { name: 'name', label: 'Badge name', required: true },
            { name: 'emoji', label: 'Icon / emoji', placeholder: '🏅' },
            { name: 'criteria', label: 'Unlock criteria', full: true, required: true },
            { name: 'auto', label: 'Auto-grant when criteria met', type: 'toggle', full: true },
          ]}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ Leaderboard Frame */
export function LeaderboardFrame() {
  const toast = useToast()
  return (
    <>
      <PageHeader
        title="Leaderboard Frame"
        crumbs={['Home', 'Platform', 'Leaderboard Frame']}
        actions={<Button variant="primary" icon="plus" onClick={() => toast('New leaderboard frame')}>Add Frame</Button>}
      />
      <div className="gallery" style={{ marginBottom: 20 }}>
        {leaderboardFrames.map((f) => (
          <div className="gallery__item" key={f.id}>
            <div className="gallery__preview">{f.emoji}</div>
            <div className="gallery__meta">
              <div><div className="n">{f.name}</div><div className="muted" style={{ fontSize: 11 }}>{f.scope} · {f.period}</div></div>
              <StatusBadge value={f.status} />
            </div>
          </div>
        ))}
      </div>
      <DataTable
        rows={leaderboardFrames}
        searchKeys={['name', 'scope', 'id']}
        filters={[
          { label: 'Scope', options: ['Global', 'Agency', 'Regional'], get: (r) => r.scope },
          { label: 'Period', options: ['Weekly', 'Monthly', 'Season'], get: (r) => r.period },
        ]}
        columns={[
          { key: 'name', header: 'Frame', sortable: true, render: (r) => <span className="hstack" style={{ gap: 10 }}><span style={{ fontSize: 18 }}>{r.emoji}</span><b>{r.name}</b></span> },
          { key: 'scope', header: 'Scope', render: (r) => <Tag>{r.scope}</Tag> },
          { key: 'period', header: 'Period' },
          statusCol(),
        ]}
        rowActions={(r) => [
          { label: 'Edit', icon: 'edit', onClick: () => toast(`Edit ${r.name}`) },
          { label: 'Assign to leaderboard', icon: 'trophy', onClick: () => toast('Assigned') },
        ]}
      />
    </>
  )
}

/* ------------------------------------------------------------------ Profile Frame */
export function ProfileFrame() {
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  return (
    <>
      <PageHeader
        title="Profile Frame"
        crumbs={['Home', 'Platform', 'Profile Frame']}
        actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add Frame</Button>}
      />
      <div className="gallery" style={{ marginBottom: 20 }}>
        {frames.map((f) => (
          <div className="gallery__item" key={f.id}>
            <div className="gallery__preview">{f.emoji}</div>
            <div className="gallery__meta">
              <div><div className="n">{f.name}</div><div className="muted" style={{ fontSize: 11 }}>{f.unlock}</div></div>
              <StatusBadge value={f.status} />
            </div>
          </div>
        ))}
      </div>
      <DataTable
        rows={frames}
        searchKeys={['name', 'unlock', 'id']}
        filters={[{ label: 'Unlock', options: [...new Set(frames.map((f) => f.unlock))], get: (r) => r.unlock }]}
        columns={[
          { key: 'name', header: 'Frame', sortable: true, render: (r) => <span className="hstack" style={{ gap: 10 }}><span style={{ fontSize: 18 }}>{r.emoji}</span><b>{r.name}</b></span> },
          { key: 'unlock', header: 'Unlock', render: (r) => <Tag>{r.unlock}</Tag> },
          numCol('price', 'Price (coins)'),
          statusCol(),
        ]}
        rowActions={(r) => [
          { label: 'Edit', icon: 'edit', onClick: () => toast(`Edit ${r.name}`) },
          { label: 'Replace asset', icon: 'upload', onClick: () => toast('Upload') },
          { label: r.status === 'Active' ? 'Move to draft' : 'Publish', icon: 'externalLink', onClick: () => toast('Toggled') },
        ]}
      />
      {adding && (
        <EntityForm title="Add Profile Frame" onClose={() => setAdding(false)} savedMessage="Frame saved"
          fields={[
            { name: 'name', label: 'Frame name', required: true },
            { name: 'emoji', label: 'Preview emoji', placeholder: '💫' },
            { name: 'unlock', label: 'Unlock condition', type: 'select', options: ['Free', 'Level 10', 'Level 25', 'VIP', '500 coins', 'Event'] },
            { name: 'price', label: 'Price (coins)', type: 'number' },
            { name: 'animated', label: 'Animated frame', type: 'toggle', full: true },
          ]}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ Salary (real: salary_payments) */
const SALARY_ROLE_OPTS = SALARY_ROLES.map((r) => ({ value: r, label: r.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') }))

export function Salary() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listSalary)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const list = rows || []

  const setStatus = async (r, status) => {
    try { await setSalaryStatus(r.id, status); toast(`${r.payee} → ${status.replace('_', ' ')}`); reload() }
    catch (e) { toast(e.message || 'Could not update') }
  }

  const salaryFields = (opts) => [
    { name: 'payee_id', label: 'Payee', type: 'select', required: true, options: opts?.payees || [] },
    { name: 'role', label: 'Role', type: 'select', required: true, options: SALARY_ROLE_OPTS },
    { name: 'agency_id', label: 'Agency', type: 'select', options: opts?.agencies || [] },
    { name: 'period', label: 'Period', required: true, placeholder: 'e.g. Sep 2026' },
    { name: 'base_amount', label: 'Base (₹)', type: 'number', required: true },
    { name: 'bonus_amount', label: 'Bonus (₹)', type: 'number' },
    { name: 'deductions', label: 'Deductions (₹)', type: 'number' },
  ]

  return (
    <>
      <PageHeader
        title="Salary"
        crumbs={['Home', 'Monetisation', 'Salary']}
        actions={<>
          <Button icon="download" onClick={() => toast('Export coming soon')}>Export</Button>
          <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>New Payslip</Button>
        </>}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        <StatGrid stats={[
          { key: 'Payslips', value: String(list.length), icon: 'users', tile: 'tile-purple' },
          { key: 'Gross', value: '₹' + num(list.reduce((s, r) => s + r.base + r.bonus, 0)), icon: 'dollar', tile: 'tile-green' },
          { key: 'Net payable', value: '₹' + num(list.reduce((s, r) => s + r.net, 0)), icon: 'wallet', tile: 'tile-blue' },
          { key: 'On hold', value: String(list.filter((r) => r.status === 'On Hold').length), icon: 'lock', tile: 'tile-red' },
        ]} />
        <div className="mt-16">
          <DataTable
            rows={list}
            searchKeys={['payee', 'username', 'agency', 'period', 'idShort']}
            tabs={[
              { label: 'All', value: 'all', filter: () => true },
              { label: 'Processing', value: 'pr', filter: (r) => r.status === 'Processing' },
              { label: 'Paid', value: 'p', filter: (r) => r.status === 'Paid' },
              { label: 'On Hold', value: 'h', filter: (r) => r.status === 'On Hold' },
            ]}
            filters={[
              { label: 'Role', options: ['Host', 'Sub Admin', 'Agency Manager'], get: (r) => r.role },
              { label: 'Period', options: [...new Set(list.map((r) => r.period))], get: (r) => r.period },
            ]}
            columns={[
              personCol('payee', 'username'),
              { key: 'role', header: 'Role', render: (r) => <Tag>{r.role}</Tag> },
              { key: 'agency', header: 'Agency', sortable: true },
              { key: 'period', header: 'Period', sortable: true },
              numCol('base', 'Base', { prefix: '₹' }),
              numCol('bonus', 'Bonus', { prefix: '₹' }),
              numCol('deductions', 'Deductions', { prefix: '₹' }),
              numCol('net', 'Net pay', { prefix: '₹' }),
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
            emptyText="No payslips yet. Create one with “New Payslip”."
          />
        </div>
      </AsyncView>

      {adding && <SalaryDrawer title="New Payslip" fieldsFor={salaryFields} onClose={() => setAdding(false)}
        onSubmit={async (v) => { await createSalaryPayment(v); reload() }} savedMessage="Payslip created" />}
      {editing && <SalaryDrawer title={`Edit — ${editing.payee}`} fieldsFor={salaryFields} onClose={() => setEditing(null)}
        onSubmit={async (v) => { await updateSalaryPayment(editing.id, v); reload() }} savedMessage="Payslip updated"
        initial={{
          period: editing.period, role: editing.role.toLowerCase().replace(' ', '_'),
          base_amount: editing.base, bonus_amount: editing.bonus, deductions: editing.deductions,
        }} lockPickers />}
    </>
  )
}

function SalaryDrawer({ title, fieldsFor, onClose, onSubmit, savedMessage, initial, lockPickers }) {
  const { data: opts } = useAsyncData(async () => ({ payees: await payeeOptions(), agencies: await agencyOptions() }))
  let fields = fieldsFor(opts)
  if (lockPickers) fields = fields.filter((f) => f.name !== 'payee_id' && f.name !== 'agency_id')
  return <EntityForm title={title} onClose={onClose} onSubmit={onSubmit} savedMessage={savedMessage} initial={initial} fields={fields} />
}

/* ------------------------------------------------------------------ Reports & Analytics */
export function Reports() {
  const [range, setRange] = useState('Last 12 months')
  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        crumbs={['Home', 'Monetisation', 'Reports']}
        actions={<>
          <select className="select" style={{ width: 'auto', height: 38 }} value={range} onChange={(e) => setRange(e.target.value)}>
            <option>Last 7 days</option><option>Last 30 days</option><option>Last 12 months</option><option>Year to date</option>
          </select>
          <Button icon="download">Export report</Button>
        </>}
      />
      <div className="grid cols-3">
        {reports.kpis.map((k) => (
          <div className="stat" key={k.k}>
            <div className="stat__label">{k.k}</div>
            <div className="stat__value">{k.v}</div>
            <div className={`stat__delta ${k.dir}`}><Icon name={k.dir === 'up' ? 'arrowUp' : 'arrowDown'} size={13} />{k.d}% <span className="since">vs prev</span></div>
          </div>
        ))}
      </div>
      <div className="grid dash mt-16">
        <Card title="Revenue by month" sub="Gift points converted to ₹ (lakhs)">
          <BarChart series={reports.revenueByMonth} categories={reports.months} color="#7c3aed" height={280} label="₹ lakh" />
        </Card>
        <Card title="Recharge channel split">
          <DonutChart data={reports.channelSplit} centerLabel="Share %" height={200} />
          <div className="legend mt-16">
            {reports.channelSplit.map((s) => (
              <div className="legend__row" key={s.label}>
                <span className="sw" style={{ background: s.color }} />
                <span className="lbl">{s.label}</span><span className="val">{s.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="grid cols-2 mt-16">
        <Card title="New users vs. churn" sub="Weekly, last 30 days">
          <AreaChart series={[420, 480, 510, 560, 540, 620, 660, 700]} color="#22a06b" height={220} label="Net new" />
        </Card>
        <Card title="Live hours" sub="Platform total, weekly">
          <AreaChart series={[12400, 12900, 13600, 14200, 15100, 15800, 16400, 17250]} color="#ec4899" height={220} label="Hours" />
        </Card>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ System Management (master-level, lighter) */
export function SystemManagement() {
  const toast = useToast()
  return (
    <>
      <PageHeader
        title="System Management"
        crumbs={['Home', 'Platform', 'System Management']}
        actions={<Button icon="refresh" onClick={() => toast('Cache cleared')}>Clear cache</Button>}
      />
      <StatGrid stats={[
        { key: 'App version', value: '3.1.0', icon: 'cpu', tile: 'tile-purple' },
        { key: 'API status', value: 'Healthy', icon: 'activity', tile: 'tile-green' },
        { key: 'Queued jobs', value: '38', icon: 'layers', tile: 'tile-orange' },
        { key: 'Error rate (24h)', value: '0.12%', icon: 'flag', tile: 'tile-red' },
      ]} />
      <div className="grid cols-2 mt-16">
        <Card title="Feature flags">
          {['New wallet UI', 'AI moderation v2', 'Guest checkout', 'Story replies', 'Regional leaderboards'].map((f, i) => (
            <div className="toggle-row" key={f}>
              <div><div className="t-title">{f}</div><div className="t-desc">Rollout: {[100, 25, 0, 60, 10][i]}% of users</div></div>
              <label className="toggle"><input type="checkbox" defaultChecked={[100, 25, 0, 60, 10][i] > 0} /><span className="track" /><span className="thumb" /></label>
            </div>
          ))}
        </Card>
        <Card title="Maintenance actions">
          <div className="vstack" style={{ gap: 10 }}>
            {[
              ['Rebuild search index', 'search'],
              ['Recompute leaderboards', 'trophy'],
              ['Flush CDN cache', 'globe'],
              ['Re-sync payment ledger', 'wallet'],
              ['Export full audit log', 'download'],
            ].map(([label, icon]) => (
              <button key={label} className="btn btn--ghost" style={{ justifyContent: 'flex-start' }} onClick={() => toast(`${label} queued`)}>
                <Icon name={icon} size={16} /> {label}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

import { useState } from 'react'
import { ListPage, StatGrid } from '../_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, Badge, PillTabs, useToast } from '../../components/ui.jsx'
import { personCol, statusCol, numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import { AreaChart, BarChart, DonutChart } from '../../components/charts.jsx'
import Icon from '../../components/Icon.jsx'
import {
  liveRequests, liveRooms, badges, frames, leaderboardFrames, salary, reports, num,
} from '../../data/index.js'
import { AGENCIES } from '../../data/util.js'

/* ------------------------------------------------------------------ Live Requests */
export function LiveRequests() {
  const toast = useToast()
  const [view, setView] = useState('Requests')
  return (
    <>
      <PageHeader
        title="Live Requests"
        crumbs={['Home', 'Platform', 'Live Requests']}
        actions={<PillTabs tabs={['Requests', 'Active Rooms']} value={view} onChange={setView} />}
      />
      {view === 'Requests' ? (
        <DataTable
          rows={liveRequests}
          searchKeys={['host', 'agency', 'type', 'id']}
          tabs={[
            { label: 'Pending', value: 'p', filter: (r) => r.status === 'Pending' },
            { label: 'Approved', value: 'a', filter: (r) => r.status === 'Approved' },
            { label: 'Rejected', value: 'r', filter: (r) => r.status === 'Rejected' },
            { label: 'All', value: 'all', filter: () => true },
          ]}
          filters={[
            { label: 'Type', options: [...new Set(liveRequests.map((r) => r.type))], get: (r) => r.type },
            { label: 'Priority', options: ['High', 'Medium', 'Low'], get: (r) => r.priority },
          ]}
          columns={[
            { key: 'id', header: 'Request', render: (r) => <span className="mono muted">{r.id}</span> },
            personCol('host', 'agency'),
            { key: 'type', header: 'Type', render: (r) => <Tag>{r.type}</Tag> },
            { key: 'priority', header: 'Priority', render: (r) => <Badge tone={r.priority === 'High' ? 'danger' : r.priority === 'Medium' ? 'warning' : 'muted'}>{r.priority}</Badge> },
            { key: 'submitted', header: 'Submitted' },
            statusCol(),
          ]}
          rowActions={(r) => [
            { label: 'Approve', icon: 'check', onClick: () => toast(`${r.id} approved`) },
            { label: 'Reject', icon: 'x', onClick: () => toast(`${r.id} rejected`) },
            { label: 'View host', icon: 'eye', onClick: () => toast('Open host') },
          ]}
        />
      ) : (
        <div className="live-grid">
          {liveRooms.map((room) => (
            <div className="live-card" key={room.id}>
              <div className="live-card__thumb">
                <Icon name="radio" size={28} />
                <span className="live-card__live">● LIVE</span>
                <span className="live-card__views">{num(room.viewers)} watching</span>
              </div>
              <div className="live-card__body">
                <div className="hstack spread">
                  <Person name={room.host} size="sm" meta={room.agency} />
                  {room.status === 'Flagged' && <Badge tone="danger">Flagged</Badge>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>{room.title}</div>
                <div className="hstack spread muted" style={{ fontSize: 12 }}>
                  <span>{room.duration} · 🪙 {num(room.coins)}</span>
                  <button className="btn btn--sm btn--ghost" onClick={() => toast(`Joined ${room.id} as observer`)}>Watch</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
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

/* ------------------------------------------------------------------ Salary */
export function Salary() {
  const toast = useToast()
  const totalNet = salary.reduce((s, r) => s + r.net, 0)
  return (
    <>
      <PageHeader
        title="Salary"
        crumbs={['Home', 'Monetisation', 'Salary']}
        actions={<>
          <Button icon="download">Export</Button>
          <Button variant="primary" icon="wallet" onClick={() => toast('Payroll run started for Aug 2026')}>Run Payroll</Button>
        </>}
      />
      <StatGrid stats={[
        { key: 'Payees (Aug)', value: String(salary.length), icon: 'users', tile: 'tile-purple' },
        { key: 'Gross payout', value: '₹' + num(salary.reduce((s, r) => s + r.base + r.bonus, 0)), icon: 'dollar', tile: 'tile-green' },
        { key: 'Net payout', value: '₹' + num(totalNet), icon: 'wallet', tile: 'tile-blue' },
        { key: 'On hold', value: String(salary.filter((r) => r.status === 'On Hold').length), icon: 'lock', tile: 'tile-red' },
      ]} />
      <div className="mt-16">
        <DataTable
          rows={salary}
          searchKeys={['payee', 'agency', 'id']}
          tabs={[
            { label: 'All', value: 'all', filter: () => true },
            { label: 'Paid', value: 'p', filter: (r) => r.status === 'Paid' },
            { label: 'Processing', value: 'pr', filter: (r) => r.status === 'Processing' },
            { label: 'On Hold', value: 'h', filter: (r) => r.status === 'On Hold' },
          ]}
          filters={[
            { label: 'Role', options: ['Host', 'Sub Admin', 'Agency Manager'], get: (r) => r.role },
            { label: 'Agency', options: AGENCIES, get: (r) => r.agency },
          ]}
          columns={[
            personCol('payee', 'role'),
            { key: 'agency', header: 'Agency', sortable: true },
            { key: 'period', header: 'Period' },
            numCol('base', 'Base', { prefix: '₹' }),
            numCol('bonus', 'Bonus', { prefix: '₹' }),
            numCol('deductions', 'Deductions', { prefix: '₹' }),
            numCol('net', 'Net pay', { prefix: '₹' }),
            statusCol(),
          ]}
          rowActions={(r) => [
            { label: 'View payslip', icon: 'fileText', onClick: () => toast(`Payslip ${r.id}`) },
            { label: 'Mark paid', icon: 'check', onClick: () => toast(`${r.payee} marked paid`) },
            { label: 'Put on hold', icon: 'lock', onClick: () => toast('On hold') },
          ]}
        />
      </div>
    </>
  )
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

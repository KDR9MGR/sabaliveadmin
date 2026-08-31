import { useState } from 'react'
import { ListPage, StatGrid } from './_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, Badge, KV, useToast } from '../components/ui.jsx'
import { personCol, statusCol, roleCol, numCol } from '../components/cells.jsx'
import DataTable from '../components/DataTable.jsx'
import EntityForm from '../components/EntityForm.jsx'
import { AreaChart } from '../components/charts.jsx'
import Icon from '../components/Icon.jsx'
import { dashboard, admins, auditLogs, infrastructure, integrations, backups, num } from '../data/index.js'
import { boldMd } from '../data/util.js'

const CR = ['Home', 'Super Admin']

/* ------------------------------------------------------------------ Dashboard */
export function SuperDashboard() {
  const d = dashboard.super
  return (
    <>
      <PageHeader title="Dashboard" crumbs={[...CR, 'Dashboard']} actions={<Button icon="download">System report</Button>} />
      <StatGrid stats={d.stats} />
      <div className="grid dash mt-16">
        <Card title="API requests" sub="Last 24 hours (thousands / 5-min)">
          <AreaChart series={d.reqSeries} color="#3b82f6" height={240} label="req (K)" />
        </Card>
        <Card title="Admin activity">
          <div className="feed">
            {d.activities.map((a, i) => (
              <div className="feed__item" key={i}>
                <span className="feed__dot"><Icon name={a.icon} size={14} /></span>
                <div><div className="feed__text" dangerouslySetInnerHTML={{ __html: boldMd(a.text) }} /><div className="feed__time">{a.time}</div></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="Service health" className="mt-16" flush>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Service</th><th>Status</th><th>Latency (p95)</th><th>Uptime (30d)</th></tr></thead>
            <tbody>
              {d.services.map((s) => (
                <tr key={s.name}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td><StatusBadge value={s.status} /></td>
                  <td className="mono">{s.latency}</td>
                  <td className="mono">{s.uptime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

/* ------------------------------------------------------------------ Admins */
export function SuperAdmins() {
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  return (
    <>
      <PageHeader title="Admin Management" crumbs={[...CR, 'Admins']}
        actions={<Button variant="primary" icon="userPlus" onClick={() => setAdding(true)}>Create Admin</Button>} />
      <DataTable
        rows={admins}
        searchKeys={['name', 'email', 'id']}
        filters={[{ label: 'Role', options: ['Super Admin', 'Admin', 'Master'], get: (r) => r.role }]}
        columns={[
          personCol('name', 'email'),
          roleCol(),
          numCol('modules', 'Modules'),
          { key: 'twoFa', header: '2FA', render: (r) => <Badge tone={r.twoFa === 'Enabled' ? 'success' : 'danger'}>{r.twoFa}</Badge> },
          { key: 'lastLogin', header: 'Last login' },
          statusCol(),
        ]}
        rowActions={(r) => [
          { label: 'Edit', icon: 'edit', onClick: () => toast(`Edit ${r.name}`) },
          { label: 'Impersonate', icon: 'eye', onClick: () => toast('Impersonation session started') },
          { label: 'Reset 2FA', icon: 'key', onClick: () => toast('2FA reset') },
          { sep: true },
          { label: r.role === 'Super Admin' ? 'Locked' : (r.status === 'Active' ? 'Disable' : 'Enable'), icon: 'lock', onClick: () => toast(`${r.name} toggled`) },
        ]}
      />
      {adding && (
        <EntityForm title="Create Admin" onClose={() => setAdding(false)} savedMessage="Admin created"
          fields={[
            { name: 'name', label: 'Full name', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'role', label: 'Role', type: 'select', options: ['Admin', 'Master'], required: true },
            { name: 'temp', label: 'Temp password', required: true },
            { name: 'twofa', label: 'Require 2FA immediately', type: 'toggle', full: true },
          ]}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ Master Accounts */
export function MasterAccounts() {
  const toast = useToast()
  const rows = [
    { id: 'MST01', name: 'Mehardeep', scope: 'Global', modules: 'All 14', mfa: 'Enabled', created: '01 Jan 2025', status: 'Active' },
    { id: 'MST02', name: 'Ops Master — Rahul K.', scope: 'India region', modules: '12 of 14', mfa: 'Enabled', created: '14 Feb 2025', status: 'Active' },
    { id: 'MST03', name: 'Finance Master — Anjali S.', scope: 'Coins, Salary, Reports', modules: '5 of 14', mfa: 'Enabled', created: '20 Mar 2025', status: 'Active' },
    { id: 'MST04', name: 'Content Master — Vikram J.', scope: 'Content, Badges, Frames', modules: '4 of 14', mfa: 'Disabled', created: '02 Jun 2025', status: 'Inactive' },
  ]
  return (
    <ListPage
      title="Master Accounts"
      crumbs={[...CR, 'Master Accounts']}
      actions={<Button variant="primary" icon="plus" onClick={() => toast('New master account')}>New Master</Button>}
      rows={rows}
      searchKeys={['name', 'scope', 'id']}
      columns={[
        personCol('name', 'id'),
        { key: 'scope', header: 'Scope' },
        { key: 'modules', header: 'Modules', render: (r) => <Tag>{r.modules}</Tag> },
        { key: 'mfa', header: 'MFA', render: (r) => <Badge tone={r.mfa === 'Enabled' ? 'success' : 'danger'}>{r.mfa}</Badge> },
        { key: 'created', header: 'Created', sortable: true },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Edit scope', icon: 'sliders', onClick: () => toast(`Scope for ${r.name}`) },
        { label: 'Rotate credentials', icon: 'key', onClick: () => toast('Credentials rotated') },
        { sep: true },
        { label: 'Revoke', icon: 'lock', onClick: () => toast('Revoked') },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ Access Control (matrix) */
const ROLES = ['Super Admin', 'Master', 'Admin', 'Agency', 'Sub Admin']
const CAPS = [
  'View dashboards', 'Manage users', 'Manage admins', 'Manage agencies', 'Manage hosts',
  'Configure coins & gifts', 'Run payroll', 'Edit app config', 'Manage infrastructure',
  'Access audit logs', 'Impersonate accounts', 'Export data',
]
const allow = (role, cap) => {
  if (role === 'Super Admin') return true
  if (role === 'Master') return !['Manage infrastructure', 'Impersonate accounts'].includes(cap)
  if (role === 'Admin') return ['View dashboards', 'Manage users', 'Manage agencies', 'Manage hosts', 'Configure coins & gifts', 'Export data'].includes(cap)
  if (role === 'Agency') return ['View dashboards', 'Manage hosts', 'Export data'].includes(cap)
  if (role === 'Sub Admin') return ['View dashboards', 'Manage hosts'].includes(cap)
  return false
}

export function AccessControl() {
  const toast = useToast()
  const [grid, setGrid] = useState(() => {
    const g = {}
    ROLES.forEach((r) => { g[r] = {}; CAPS.forEach((c) => { g[r][c] = allow(r, c) }) })
    return g
  })
  const toggle = (r, c) => setGrid((g) => ({ ...g, [r]: { ...g[r], [c]: !g[r][c] } }))
  return (
    <>
      <PageHeader
        title="Access Control"
        crumbs={[...CR, 'Access Control']}
        actions={<Button variant="primary" icon="check" onClick={() => toast('Access policy saved')}>Save Policy</Button>}
      />
      <Card flush title="Capability matrix" sub="Toggle a capability for a role. Super Admin is fixed." action={<span />}>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th style={{ minWidth: 200 }}>Capability</th>{ROLES.map((r) => <th key={r} className="center">{r}</th>)}</tr>
            </thead>
            <tbody>
              {CAPS.map((c) => (
                <tr key={c}>
                  <td style={{ fontWeight: 600 }}>{c}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="center">
                      <label className="toggle" style={{ margin: '0 auto', opacity: r === 'Super Admin' ? 0.5 : 1 }}>
                        <input type="checkbox" checked={grid[r][c]} disabled={r === 'Super Admin'} onChange={() => toggle(r, c)} />
                        <span className="track" /><span className="thumb" />
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

/* ------------------------------------------------------------------ Audit Logs */
export function AuditLogs() {
  return (
    <ListPage
      title="Audit Logs"
      crumbs={[...CR, 'Audit Logs']}
      actions={<Button icon="download">Export</Button>}
      rows={auditLogs}
      pageSize={12}
      searchKeys={['actor', 'action', 'target', 'ip', 'id']}
      tabs={[
        { label: 'All', value: 'all', filter: () => true },
        { label: 'Warnings', value: 'w', filter: (r) => r.severity === 'Warning' },
        { label: 'Critical', value: 'c', filter: (r) => r.severity === 'Critical' },
      ]}
      filters={[{ label: 'Actor', options: [...new Set(auditLogs.map((l) => l.actor))], get: (r) => r.actor }]}
      columns={[
        { key: 'id', header: 'Log ID', render: (r) => <span className="mono muted">{r.id}</span> },
        { key: 'actor', header: 'Actor', sortable: true },
        { key: 'action', header: 'Action' },
        { key: 'target', header: 'Target', render: (r) => <span className="mono">{r.target}</span> },
        { key: 'ip', header: 'IP', render: (r) => <span className="mono muted">{r.ip}</span> },
        { key: 'when', header: 'When' },
        { key: 'severity', header: 'Severity', render: (r) => <Badge tone={r.severity === 'Critical' ? 'danger' : r.severity === 'Warning' ? 'warning' : 'info'}>{r.severity}</Badge> },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ Security */
export function SuperSecurity() {
  const toast = useToast()
  return (
    <>
      <PageHeader title="Security" crumbs={[...CR, 'Security']}
        actions={<Button variant="primary" icon="check" onClick={() => toast('Security settings saved')}>Save</Button>} />
      <div className="grid cols-2">
        <Card title="Authentication">
          <div className="toggle-row"><div><div className="t-title">Enforce 2FA for all admins</div><div className="t-desc">Authenticator or hardware key</div></div>
            <label className="toggle"><input type="checkbox" defaultChecked /><span className="track" /><span className="thumb" /></label></div>
          <div className="toggle-row"><div><div className="t-title">SSO (Google Workspace)</div><div className="t-desc">Restrict to stonelivepro.com</div></div>
            <label className="toggle"><input type="checkbox" defaultChecked /><span className="track" /><span className="thumb" /></label></div>
          <div className="toggle-row"><div><div className="t-title">IP allowlist for admin panel</div><div className="t-desc">Office + VPN ranges only</div></div>
            <label className="toggle"><input type="checkbox" /><span className="track" /><span className="thumb" /></label></div>
          <div className="toggle-row"><div><div className="t-title">Auto-revoke idle admins</div><div className="t-desc">Disable after 60 days inactivity</div></div>
            <label className="toggle"><input type="checkbox" defaultChecked /><span className="track" /><span className="thumb" /></label></div>
        </Card>
        <Card title="Active admin sessions">
          <div className="feed">
            {[
              ['Mehardeep', 'Chrome · macOS · Mumbai', 'now'],
              ['Rahul Kumar', 'Edge · Windows · Delhi', '12 min ago'],
              ['Anjali Singh', 'Safari · iPad · Pune', '1 h ago'],
              ['Vikram Joshi', 'Chrome · Windows · Bengaluru', '3 h ago'],
            ].map(([n, d, t]) => (
              <div className="feed__item" key={n}>
                <span className="feed__dot"><Icon name="user" size={14} /></span>
                <div className="grow"><div className="feed__text"><b>{n}</b> — {d}</div><div className="feed__time">{t}</div></div>
                <button className="btn btn--sm btn--ghost" onClick={() => toast(`${n} signed out`)}>Revoke</button>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="API keys" className="mt-16" flush>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Name</th><th>Key</th><th>Scope</th><th>Created</th><th>Last used</th><th /></tr></thead>
            <tbody>
              {[
                ['Analytics pipeline', 'sk_live_••••2f9c', 'read:reports', '10 Jan 2026', '2 min ago'],
                ['Mobile app (prod)', 'sk_live_••••8a1d', 'full', '02 Nov 2025', 'now'],
                ['Partner webhook', 'sk_live_••••61be', 'write:events', '19 Mar 2026', '5 h ago'],
              ].map(([n, k, s, c, u]) => (
                <tr key={n}>
                  <td style={{ fontWeight: 600 }}>{n}</td>
                  <td className="mono">{k}</td>
                  <td><Tag>{s}</Tag></td>
                  <td>{c}</td><td>{u}</td>
                  <td className="col-actions"><button className="btn btn--sm btn--ghost" onClick={() => toast(`${n} key rotated`)}>Rotate</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

/* ------------------------------------------------------------------ System Overview */
export function SystemOverview() {
  const d = dashboard.super
  const toast = useToast()
  return (
    <>
      <PageHeader title="System Overview" crumbs={[...CR, 'System Overview']}
        actions={<Button icon="refresh" onClick={() => toast('Health re-checked')}>Re-check</Button>} />
      <StatGrid stats={[
        { key: 'Uptime (30d)', value: '99.98%', icon: 'activity', tile: 'tile-green' },
        { key: 'Avg latency (p95)', value: '128 ms', icon: 'cpu', tile: 'tile-blue' },
        { key: 'Error rate (24h)', value: '0.09%', icon: 'flag', tile: 'tile-orange' },
        { key: 'Open incidents', value: '2', icon: 'xCircle', tile: 'tile-red' },
      ]} />
      <div className="grid cols-2 mt-16">
        {d.services.map((s) => (
          <Card key={s.name}>
            <div className="hstack spread">
              <div>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>p95 {s.latency} · uptime {s.uptime}</div>
              </div>
              <StatusBadge value={s.status} />
            </div>
            <div className="progress mt-16"><span style={{ width: s.uptime, background: s.status === 'Operational' ? 'linear-gradient(90deg,#34d399,#22a06b)' : 'linear-gradient(90deg,#fbbf24,#f59e0b)' }} /></div>
          </Card>
        ))}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Infrastructure */
export function Infrastructure() {
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const cats = [...new Set(infrastructure.map((r) => r.category))]
  return (
    <>
      <PageHeader title="Infrastructure" crumbs={[...CR, 'Infrastructure']}
        actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add Resource</Button>} />
      <div className="stat-grid" style={{ marginBottom: 16 }}>
        {[
          ['Resources', infrastructure.length, 'server', 'tile-purple'],
          ['Renew < 30 days', infrastructure.filter((r) => r.status === 'Renew Soon').length, 'clock', 'tile-orange'],
          ['Client-owned', infrastructure.filter((r) => r.owner === 'Client').length, 'idCard', 'tile-blue'],
          ['DevOps-owned', infrastructure.filter((r) => r.owner === 'DevOps').length, 'cpu', 'tile-green'],
        ].map(([k, v, i, t]) => (
          <div className="stat" key={k}><div className="stat__top"><div><div className="stat__label">{k}</div><div className="stat__value">{v}</div></div><div className={`stat__tile ${t}`}><Icon name={i} size={20} /></div></div></div>
        ))}
      </div>
      <DataTable
        rows={infrastructure}
        pageSize={10}
        searchKeys={['name', 'provider', 'category', 'id']}
        filters={[
          { label: 'Category', options: cats, get: (r) => r.category },
          { label: 'Owner', options: ['Client', 'DevOps'], get: (r) => r.owner },
        ]}
        columns={[
          { key: 'category', header: 'Category', sortable: true, render: (r) => <Tag>{r.category}</Tag> },
          { key: 'name', header: 'Resource', render: (r) => <b>{r.name}</b> },
          { key: 'provider', header: 'Provider' },
          { key: 'plan', header: 'Plan' },
          { key: 'renews', header: 'Renews', sortable: true },
          { key: 'owner', header: 'Owner' },
          statusCol(),
        ]}
        rowActions={(r) => [
          { label: 'Edit', icon: 'edit', onClick: () => toast(`Edit ${r.name}`) },
          { label: 'Open provider console', icon: 'externalLink', onClick: () => toast('Opens provider') },
          { label: 'Set renewal reminder', icon: 'calendar', onClick: () => toast('Reminder set') },
        ]}
      />
      {adding && (
        <EntityForm title="Add Resource" onClose={() => setAdding(false)} savedMessage="Resource added"
          fields={[
            { name: 'category', label: 'Category', type: 'select', options: cats, required: true },
            { name: 'name', label: 'Resource name', required: true },
            { name: 'provider', label: 'Provider', required: true },
            { name: 'plan', label: 'Plan' },
            { name: 'renews', label: 'Renews on' },
            { name: 'owner', label: 'Owner', type: 'select', options: ['Client', 'DevOps'] },
          ]}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ Integrations & APIs */
export function Integrations() {
  const toast = useToast()
  return (
    <>
      <PageHeader title="Integrations & APIs" crumbs={[...CR, 'Integrations']}
        actions={<Button variant="primary" icon="plus" onClick={() => toast('Add integration')}>Add Integration</Button>} />
      <div className="grid cols-3">
        {integrations.map((it) => (
          <Card key={it.id}>
            <div className="hstack spread">
              <div className="hstack" style={{ gap: 10 }}>
                <span className="stat__tile tile-purple" style={{ width: 36, height: 36 }}><Icon name="layers" size={16} /></span>
                <div><div style={{ fontWeight: 600 }}>{it.name}</div><div className="muted" style={{ fontSize: 11 }}>{it.kind}</div></div>
              </div>
              <StatusBadge value={it.status} />
            </div>
            <div className="kv mt-16" style={{ gridTemplateColumns: '90px 1fr', fontSize: 12 }}>
              <dt>Key</dt><dd className="mono">{it.keyId}</dd>
              <dt>Mode</dt><dd><Badge tone={it.mode === 'Live' ? 'success' : 'warning'}>{it.mode}</Badge></dd>
            </div>
            <div className="hstack mt-16" style={{ gap: 8 }}>
              <Button size="sm" icon="sliders" onClick={() => toast(`Configure ${it.name}`)}>Configure</Button>
              <Button size="sm" icon="refresh" onClick={() => toast('Key rotated')}>Rotate key</Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Backups */
export function Backups() {
  const toast = useToast()
  return (
    <>
      <PageHeader title="Backups" crumbs={[...CR, 'Backups']}
        actions={<Button variant="primary" icon="refresh" onClick={() => toast('Manual backup started')}>Run Backup Now</Button>} />
      <StatGrid stats={[
        { key: 'Last successful', value: '4 h ago', icon: 'checkCircle', tile: 'tile-green' },
        { key: 'Schedule', value: 'Every 6 h', icon: 'clock', tile: 'tile-blue' },
        { key: 'Retention', value: '30 days', icon: 'layers', tile: 'tile-purple' },
        { key: 'Failed (7d)', value: String(backups.filter((b) => b.status === 'Failed').length), icon: 'xCircle', tile: 'tile-red' },
      ]} />
      <div className="mt-16">
        <DataTable
          rows={backups}
          searchKeys={['scope', 'location', 'id']}
          filters={[
            { label: 'Scope', options: ['Full DB', 'Media', 'Config'], get: (r) => r.scope },
            { label: 'Status', options: ['Success', 'Failed'], get: (r) => r.status },
          ]}
          columns={[
            { key: 'id', header: 'Backup', render: (r) => <span className="mono muted">{r.id}</span> },
            { key: 'scope', header: 'Scope', render: (r) => <Tag>{r.scope}</Tag> },
            { key: 'size', header: 'Size', align: 'right' },
            { key: 'location', header: 'Location' },
            { key: 'started', header: 'Started', sortable: true },
            { key: 'duration', header: 'Duration', align: 'right' },
            statusCol(),
          ]}
          rowActions={(r) => [
            { label: 'Download', icon: 'download', onClick: () => toast(`Downloading ${r.id}`) },
            { label: 'Restore from this', icon: 'refresh', onClick: () => toast('Restore wizard') },
            { label: 'Verify integrity', icon: 'checkCircle', onClick: () => toast('Verifying…') },
          ]}
        />
      </div>
    </>
  )
}

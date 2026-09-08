import { useState } from 'react'
import { StatGrid, AsyncView } from './_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, Badge, KV, EmptyState, useToast, ConfirmDialog } from '../components/ui.jsx'
import { personCol, statusCol } from '../components/cells.jsx'
import DataTable from '../components/DataTable.jsx'
import EntityForm from '../components/EntityForm.jsx'
import Icon from '../components/Icon.jsx'
import PanelChip from '../components/PanelChip.jsx'
import { useNavigate } from 'react-router-dom'
import { useAsyncData } from '../lib/useAsync.js'
import { useAuth } from '../lib/auth.jsx'
import {
  listStaffAccounts, grantableProfiles, agencyOptions, grantRole, changeRole, revokeRole, superAdminCount,
  inviteStaff, PLATFORM_ROLES, AGENCY_ROLES,
} from '../lib/accounts.js'
import { superDashboard, listAuditLogs, securityOverview, systemPulse } from '../lib/superAdmin.js'
import { infrastructure, integrations, backups, num } from '../data/index.js'

const CR = ['Home', 'Super Admin']

/* ------------------------------------------------------------------ Dashboard (real) */
function auditTone(sev) {
  const s = String(sev).toLowerCase()
  if (s === 'critical') return 'danger'
  if (s === 'warning') return 'warning'
  return 'info'
}

export function SuperDashboard() {
  const nav = useNavigate()
  const { data: d, loading, error, reload } = useAsyncData(superDashboard)
  return (
    <>
      <PageHeader title={<>Dashboard <PanelChip panel="super" /></>} crumbs={[...CR, 'Dashboard']} />
      <AsyncView loading={loading} error={error} reload={reload}>
        {d && (
          <>
            <StatGrid stats={d.stats} />
            <div className="grid cols-3 mt-16">
              <Card title="Coins in circulation">
                <div className="stat__value" style={{ fontSize: 26 }}>{num(d.circulation.coins)}</div>
                <div className="muted" style={{ fontSize: 12 }}>across all wallets</div>
              </Card>
              <Card title="Diamonds in circulation">
                <div className="stat__value" style={{ fontSize: 26 }}>{num(d.circulation.diamonds)}</div>
                <div className="muted" style={{ fontSize: 12 }}>host earnings not yet withdrawn</div>
              </Card>
              <Card title="Review queues">
                <div className="vstack" style={{ gap: 8 }}>
                  {d.queues.map((q) => (
                    <button key={q.label} className="kpi hstack spread" style={{ cursor: 'pointer', border: '1px solid var(--border)' }} onClick={() => nav(q.to)}>
                      <span className="hstack" style={{ gap: 8 }}><Icon name={q.icon} size={14} className="muted" />{q.label}</span>
                      <Badge tone={q.value ? 'warning' : 'muted'}>{q.value}</Badge>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
            <div className="grid dash mt-16">
              <Card title="Recent admin activity" sub="From the audit log">
                {d.audit.length ? (
                  <div className="feed">
                    {d.audit.map((a, i) => (
                      <div className="feed__item" key={i}>
                        <span className="feed__dot"><Icon name="fileText" size={14} /></span>
                        <div>
                          <div className="feed__text">{a.text}</div>
                          <div className="feed__time hstack" style={{ gap: 8 }}><span>{a.time}</span><Badge tone={auditTone(a.severity)}>{a.severity}</Badge></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState icon="fileText" title="No audit entries yet" text="Admin write actions aren't logged server-side yet — this fills in once that's added." />}
              </Card>
              <Card title="Newest signups">
                {d.signups.length ? (
                  <div className="feed">
                    {d.signups.map((s, i) => (
                      <div className="feed__item" key={i}>
                        <span className="feed__dot"><Icon name="userPlus" size={14} /></span>
                        <div><div className="feed__text"><b>{s.name}</b> <span className="muted">@{s.username}</span></div><div className="feed__time">{s.when}</div></div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState icon="users" title="No users yet" />}
              </Card>
            </div>
          </>
        )}
      </AsyncView>
    </>
  )
}

/* ------------------------------------------------------------------ Admins */
/* Shared staff-account management — grant / change / revoke staff_roles rows. */
function StaffAccountsPage({ roles, grantRoleOpts, title, crumbLabel, intro }) {
  const toast = useToast()
  const { user } = useAuth()
  const { data: rows, loading, error, reload } = useAsyncData(() => listStaffAccounts(roles), [roles.join()])
  const { data: pickerData } = useAsyncData(async () => ({
    profiles: await grantableProfiles(),
    agencies: await agencyOptions(),
  }))
  const [granting, setGranting] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [invited, setInvited] = useState(null)
  const [changing, setChanging] = useState(null)
  const [revoking, setRevoking] = useState(null)
  const [busy, setBusy] = useState(false)

  const roleField = { name: 'role', label: 'Role', type: 'select', required: true, options: grantRoleOpts }
  const agencyField = {
    name: 'agency_id', label: 'Agency', type: 'select',
    options: pickerData?.agencies || [],
    hint: 'Required for Agency Manager and Sub Admin',
  }

  const doGrant = async (v) => { await grantRole(v); reload() }
  const doInvite = async (v) => {
    const res = await inviteStaff(v)
    setInvited(res)
    reload()
  }
  const doChange = async (v) => { await changeRole(changing.id, v); reload() }
  const doRevoke = async () => {
    setBusy(true)
    try {
      if (revoking.roleRaw === 'super_admin' && (await superAdminCount()) <= 1) {
        throw new Error('Cannot revoke the last Super Admin')
      }
      await revokeRole(revoking.id)
      toast(`${revoking.name}'s role revoked`)
      setRevoking(null)
      reload()
    } catch (e) {
      toast(e.message || 'Could not revoke')
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader
        title={title}
        crumbs={[...CR, crumbLabel]}
        actions={<>
          <Button icon="mail" onClick={() => setInviting(true)}>Invite by email</Button>
          <Button variant="primary" icon="userPlus" onClick={() => setGranting(true)}>Grant Role</Button>
        </>}
      />
      {intro && <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>{intro}</div></Card>}
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          searchKeys={['name', 'username', 'agency', 'idShort']}
          filters={[{ label: 'Role', options: [...new Set((rows || []).map((r) => r.role))], get: (r) => r.role }]}
          columns={[
            personCol('name', 'username'),
            { key: 'idShort', header: 'User ID', render: (r) => <span className="mono muted">{r.idShort}</span> },
            { key: 'role', header: 'Role', render: (r) => <Tag role>{r.role}</Tag> },
            { key: 'agency', header: 'Agency', sortable: true, render: (r) => r.agency === '—' ? <span className="muted">—</span> : r.agency },
            { key: 'accountStatus', header: 'Account', render: (r) => <StatusBadge value={r.accountStatus} /> },
            { key: 'granted', header: 'Granted', sortable: true },
          ]}
          rowActions={(r) => [
            { label: 'Change role', icon: 'shieldUser', onClick: () => setChanging(r) },
            { sep: true },
            r.id === user?.id
              ? { label: "Can't revoke yourself", icon: 'lock', onClick: () => {} }
              : { label: 'Revoke role', icon: 'trash', onClick: () => setRevoking(r) },
          ]}
          emptyText="No accounts with these roles yet. Use “Grant Role” to add one."
        />
      </AsyncView>

      {granting && (
        <EntityForm
          title="Grant Staff Role"
          onClose={() => setGranting(false)}
          onSubmit={doGrant}
          savedMessage="Role granted"
          fields={[
            { name: 'user_id', label: 'User', type: 'select', required: true, options: pickerData?.profiles || [],
              hint: (pickerData && !pickerData.profiles.length) ? 'Everyone already has a role — a user must sign up first' : 'Only users without an existing staff role are listed' },
            roleField,
            agencyField,
          ]}
        />
      )}
      {inviting && (
        <EntityForm
          title="Invite staff by email"
          onClose={() => setInviting(false)}
          onSubmit={doInvite}
          savedMessage="Invite sent"
          fields={[
            { name: 'email', label: 'Email', required: true, hint: 'A new login is created — the person does not need to sign up first' },
            { name: 'full_name', label: 'Full name' },
            roleField,
            agencyField,
          ]}
        />
      )}
      {invited && (
        <ConfirmDialog
          title="Staff account created"
          confirmLabel="Done"
          message={
            <span>
              <b>{invited.email}</b> can now sign in as {invited.role}.
              {invited.temp_password ? (
                <><br /><br />Temporary password: <code>{invited.temp_password}</code><br />
                  Share it over a secure channel — they should change it on first sign-in.</>
              ) : <><br /><br />They sign in with the password you set.</>}
            </span>
          }
          onConfirm={() => setInvited(null)}
          onClose={() => setInvited(null)}
        />
      )}
      {changing && (
        <EntityForm
          title={`Change role — ${changing.name}`}
          onClose={() => setChanging(null)}
          onSubmit={doChange}
          savedMessage="Role updated"
          initial={{ role: changing.roleRaw, agency_id: changing.agencyId || '' }}
          fields={[roleField, agencyField]}
        />
      )}
      {revoking && (
        <ConfirmDialog
          title="Revoke staff role?"
          danger
          busy={busy}
          confirmLabel="Revoke"
          message={`${revoking.name} (@${revoking.username}) will lose the "${revoking.role}" role and all admin access. Their Saba Live account is not deleted.`}
          onConfirm={doRevoke}
          onClose={() => setRevoking(null)}
        />
      )}
    </>
  )
}

export function SuperAdmins() {
  return (
    <StaffAccountsPage
      roles={PLATFORM_ROLES}
      grantRoleOpts={[{ value: 'admin', label: 'Admin' }, { value: 'super_admin', label: 'Super Admin' }]}
      title="Admin Accounts"
      crumbLabel="Admins"
      intro="Platform-wide roles. Admin and Super Admin see everything (is_admin_or_above); only a Super Admin can grant, change or revoke roles. New accounts must sign up through the app first — this screen grants a role to an existing user."
    />
  )
}

export function MasterAccounts() {
  return (
    <StaffAccountsPage
      roles={AGENCY_ROLES}
      grantRoleOpts={[{ value: 'agency_manager', label: 'Agency Manager' }, { value: 'sub_admin', label: 'Sub Admin' }]}
      title="Agency Staff"
      crumbLabel="Agency Staff"
      intro="Agency-scoped roles. An Agency Manager or Sub Admin can only act within the agency they're assigned to (manages_agency)."
    />
  )
}

/* ------------------------------------------------------------------ Access Control (matrix) */
const ROLES = ['Super Admin', 'Master', 'Admin', 'Sub Admin', 'Agency']
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
      />
      <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
        This matrix mirrors the Postgres RLS policies (<code>is_admin_or_above</code>, <code>manages_agency</code>, <code>is_super_admin</code>) and is <b>reference only</b> — it isn't editable here.
        To actually grant, change or revoke a role, use <b>Admin Accounts</b> or <b>Agency Staff</b>.
      </div></Card>
      <Card flush title="Capability matrix" sub="Derived from RLS — reference only" action={<span />}>
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

/* ------------------------------------------------------------------ Audit Logs (real) */
export function AuditLogs() {
  const { data: rows, loading, error, reload } = useAsyncData(listAuditLogs)
  return (
    <>
      <PageHeader title="Audit Logs" crumbs={[...CR, 'Audit Logs']} actions={<Button icon="download">Export</Button>} />
      <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
        Reads the real <code>audit_logs</code> table. It's currently empty because admin write actions aren't logged server-side yet —
        the <code>decide_*</code> RPCs stamp <code>decided_by</code>/<code>reviewed_by</code> on their own rows, but there's no audit trigger.
      </div></Card>
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          pageSize={15}
          searchKeys={['actor', 'action', 'target', 'ip', 'idShort']}
          tabs={[
            { label: 'All', value: 'all', filter: () => true },
            { label: 'Warnings', value: 'w', filter: (r) => r.severity === 'Warning' },
            { label: 'Critical', value: 'c', filter: (r) => r.severity === 'Critical' },
          ]}
          columns={[
            { key: 'actor', header: 'Actor', sortable: true, render: (r) => <Person name={r.actor} meta={r.username ? '@' + r.username : undefined} size="sm" /> },
            { key: 'action', header: 'Action' },
            { key: 'target', header: 'Target', render: (r) => <span className="mono muted">{r.target}</span> },
            { key: 'ip', header: 'IP', render: (r) => <span className="mono muted">{r.ip}</span> },
            { key: 'ago', header: 'When', sortable: true },
            { key: 'severity', header: 'Severity', render: (r) => <Badge tone={auditTone(r.severity)}>{r.severity}</Badge> },
          ]}
          emptyText="No audit entries recorded yet."
        />
      </AsyncView>
    </>
  )
}

/* ------------------------------------------------------------------ Security (real staff + audit; infra bits labelled) */
export function SuperSecurity() {
  const { data: d, loading, error, reload } = useAsyncData(securityOverview)
  return (
    <>
      <PageHeader title="Security" crumbs={[...CR, 'Security']} />
      <AsyncView loading={loading} error={error} reload={reload}>
        {d && (
          <>
            <div className="grid cols-2">
              <Card title={`Who has admin access (${d.staff.length})`} sub="Every staff_roles row — manage from Admin Accounts / Agency Staff">
                <div className="feed">
                  {d.staff.map((s) => (
                    <div className="feed__item" key={s.id}>
                      <span className="feed__dot"><Icon name="shieldUser" size={14} /></span>
                      <div className="grow">
                        <div className="feed__text"><b>{s.name}</b> <span className="muted">@{s.username}</span> · <Tag role>{s.role}</Tag>{s.agency !== '—' ? ` · ${s.agency}` : ''}</div>
                        <div className="feed__time">granted {s.granted} · account {s.accountStatus}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card title="Flagged audit events" sub={`${d.weekAuditCount} audit entries in the last 7 days`}>
                {d.flagged.length ? (
                  <div className="feed">
                    {d.flagged.map((a, i) => (
                      <div className="feed__item" key={i}>
                        <span className="feed__dot" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}><Icon name="flag" size={14} /></span>
                        <div><div className="feed__text">{a.text}</div><div className="feed__time hstack" style={{ gap: 8 }}><span>{a.time}</span><Badge tone={auditTone(a.severity)}>{a.severity}</Badge></div></div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState icon="checkCircle" title="Nothing flagged" text="No warning or critical audit events." />}
              </Card>
            </div>
            <Card className="mt-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
              <b>Managed in Supabase, not here:</b> auth providers &amp; email settings, session lifetime, 2FA/MFA enforcement, JWT keys, API keys, and rate limits all live in the Supabase project's Auth &amp; API settings. RLS policies are the source of truth for what each role can do (see <b>Access Control</b>).
            </div></Card>
          </>
        )}
      </AsyncView>
    </>
  )
}

/* ------------------------------------------------------------------ System Overview (real 24h pulse) */
export function SystemOverview() {
  const { data: d, loading, error, reload } = useAsyncData(systemPulse)
  return (
    <>
      <PageHeader title="System Overview" crumbs={[...CR, 'System Overview']}
        actions={<Button icon="refresh" onClick={reload}>Refresh</Button>} />
      <AsyncView loading={loading} error={error} reload={reload}>
        {d && (
          <>
            <StatGrid stats={d.metrics} />
            <Card className="mt-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
              These are live counts from the last 24 hours. Infrastructure health (uptime, latency, error rate, incidents) isn't in the
              product database — see your hosting/monitoring dashboards, and the <b>Infrastructure</b> screen for the resource inventory.
            </div></Card>
          </>
        )}
      </AsyncView>
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

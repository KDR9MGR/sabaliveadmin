import { useState } from 'react'
import { StatGrid, AsyncView } from './_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, Badge, KV, EmptyState, useToast, ConfirmDialog, Drawer } from '../components/ui.jsx'
import { personCol, statusCol, numCol } from '../components/cells.jsx'
import DataTable from '../components/DataTable.jsx'
import EntityForm from '../components/EntityForm.jsx'
import Icon from '../components/Icon.jsx'
import PanelChip from '../components/PanelChip.jsx'
import { useNavigate } from 'react-router-dom'
import { useAsyncData } from '../lib/useAsync.js'
import { useAuth } from '../lib/auth.jsx'
import {
  listStaffAccounts, grantableProfiles, agencyOptions, grantRole, changeRole, revokeRole, superAdminCount,
  inviteStaff, setStaffPermissions, PLATFORM_ROLES, AGENCY_ROLES,
} from '../lib/accounts.js'
import { CAPABILITIES, roleBaseline, effectivePermissions } from '../lib/capabilities.js'
import { superDashboard, listAuditLogs, securityOverview, systemPulse } from '../lib/superAdmin.js'
import {
  getTreasury, listTreasuryEvents, mintCoins, distributeCoins,
  listCoinMinters, addCoinMinter, removeCoinMinter, minterCandidates, profilePickList,
  DISTRIBUTION_ROLES,
} from '../lib/treasury.js'
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
  const [perms, setPerms] = useState(null)
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
            r.roleRaw === 'super_admin'
              ? { label: 'Full access (Super Admin)', icon: 'shield', onClick: () => {} }
              : { label: 'Permissions', icon: 'sliders', onClick: () => setPerms(r) },
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
      {perms && (
        <PermissionsDrawer
          account={perms}
          onClose={() => setPerms(null)}
          onSaved={() => { setPerms(null); reload() }}
        />
      )}
    </>
  )
}

/* Per-account capability overrides. Toggles start at the account's effective
   value; the role baseline is shown as helper text. Only keys that differ
   from the baseline are persisted. Enforcement: the UI hides gated nav/actions
   and the privileged RPCs re-check via has_capability() (deny-only). */
function PermissionsDrawer({ account, onClose, onSaved }) {
  const toast = useToast()
  const base = roleBaseline(account.roleRaw)
  const [vals, setVals] = useState(() => effectivePermissions({ role: account.roleRaw, permissions: account.permissions }))
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }))

  const save = async () => {
    setBusy(true)
    try {
      const delta = {}
      for (const c of CAPABILITIES) {
        if (!!vals[c.key] !== !!base[c.key]) delta[c.key] = !!vals[c.key]
      }
      await setStaffPermissions(account.id, delta)
      toast(`Permissions updated for ${account.name}`)
      onSaved()
    } catch (e) {
      toast(e?.message || 'Could not save permissions')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => setVals(Object.fromEntries(CAPABILITIES.map((c) => [c.key, !!base[c.key]])))
  const groups = [...new Set(CAPABILITIES.map((c) => c.group))]
  const changed = CAPABILITIES.some((c) => !!vals[c.key] !== !!base[c.key])

  return (
    <Drawer
      title={`Permissions — ${account.name}`}
      onClose={busy ? () => {} : onClose}
      footer={<>
        <Button onClick={reset} disabled={busy || !changed}>Reset to role default</Button>
        <Button variant="primary" icon={busy ? 'refresh' : 'check'} disabled={busy} onClick={save}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
      </>}
    >
      <p className="muted" style={{ fontSize: 12.5, marginBottom: 4 }}>
        Baseline comes from the <b>{account.role}</b> role. Turning a capability <b>off</b> is enforced everywhere
        (nav, screens and the privileged RPCs). Turning one <b>on</b> beyond the role only affects what they see —
        the server still gates by role.
      </p>
      {groups.map((g) => (
        <div key={g} style={{ marginTop: 14 }}>
          <div className="nav-group__label" style={{ padding: '0 0 6px' }}>{g}</div>
          {CAPABILITIES.filter((c) => c.group === g).map((c) => (
            <div className="toggle-row" key={c.key}>
              <div>
                <div className="t-title">{c.label}</div>
                <div className="t-desc">Role default: {base[c.key] ? 'allowed' : 'denied'}
                  {(!!vals[c.key] !== !!base[c.key]) && <span style={{ color: 'var(--warning)' }}> · overridden</span>}
                </div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={!!vals[c.key]} onChange={(e) => set(c.key, e.target.checked)} />
                <span className="track" /><span className="thumb" />
              </label>
            </div>
          ))}
        </div>
      ))}
    </Drawer>
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

/* ------------------------------------------------------------------ Access Control */
const BASELINE_ROLES = [
  { key: 'super_admin', label: 'Super Admin' },
  { key: 'admin', label: 'Admin' },
  { key: 'agency_manager', label: 'Agency Manager' },
  { key: 'sub_admin', label: 'Sub Admin' },
]
const Mark = ({ on }) => (
  <Icon name={on ? 'check' : 'x'} size={14} style={{ color: on ? 'var(--success)' : 'var(--text-muted)' }} />
)

export function AccessControl() {
  const { data: accounts, loading, error, reload } = useAsyncData(
    () => listStaffAccounts([...PLATFORM_ROLES, ...AGENCY_ROLES]), [])
  const [perms, setPerms] = useState(null)

  return (
    <>
      <PageHeader title="Access Control" crumbs={[...CR, 'Access Control']} />
      <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
        Each staff account starts from its <b>role baseline</b> below. A Super Admin can then override individual
        capabilities per account from <b>Admin Accounts</b> / <b>Agency Staff</b> (or the Edit action here).
        Turning a capability off is enforced in the UI <i>and</i> the privileged RPCs; turning one on beyond the
        role only changes what the account sees.
      </div></Card>

      <Card flush title="Role baseline" sub="The starting point for every account with that role" className="mb-16" action={<span />}>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th style={{ minWidth: 200 }}>Capability</th>{BASELINE_ROLES.map((r) => <th key={r.key} className="center">{r.label}</th>)}</tr>
            </thead>
            <tbody>
              {CAPABILITIES.map((c) => (
                <tr key={c.key}>
                  <td style={{ fontWeight: 600 }}>{c.label}</td>
                  {BASELINE_ROLES.map((r) => (
                    <td key={r.key} className="center"><Mark on={!!roleBaseline(r.key)[c.key]} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card flush title="Per-account permissions" sub="Effective capabilities after any overrides" action={<span />}>
        <AsyncView loading={loading} error={error} reload={reload}>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th style={{ minWidth: 180 }}>Account</th>
                  {CAPABILITIES.map((c) => <th key={c.key} className="center" title={c.label} style={{ fontSize: 11 }}>{c.label}</th>)}
                  <th />
                </tr>
              </thead>
              <tbody>
                {(accounts || []).map((a) => {
                  const eff = effectivePermissions({ role: a.roleRaw, permissions: a.permissions })
                  const base = roleBaseline(a.roleRaw)
                  return (
                    <tr key={a.id}>
                      <td><Person name={a.name} meta={a.role} size="sm" /></td>
                      {CAPABILITIES.map((c) => {
                        const overridden = a.roleRaw !== 'super_admin' && !!eff[c.key] !== !!base[c.key]
                        return (
                          <td key={c.key} className="center" style={overridden ? { background: 'var(--warning-bg)' } : undefined}>
                            <Mark on={!!eff[c.key]} />
                          </td>
                        )
                      })}
                      <td className="center">
                        {a.roleRaw === 'super_admin'
                          ? <span className="muted" style={{ fontSize: 11 }}>full</span>
                          : <Button size="sm" icon="sliders" onClick={() => setPerms(a)}>Edit</Button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </AsyncView>
      </Card>

      {perms && (
        <PermissionsDrawer account={perms} onClose={() => setPerms(null)} onSaved={() => { setPerms(null); reload() }} />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ Coin Treasury (Super Admin) */
const ROLE_LABEL_D = { host: 'Hosts', agency: 'Agency managers', sub_admin: 'Sub admins', staff: 'All staff' }

export function CoinTreasury() {
  const toast = useToast()
  const { staffRole } = useAuth()
  const isSuper = staffRole?.role === 'super_admin'
  const { data: t, loading, error, reload } = useAsyncData(getTreasury)
  const { data: events, reload: reloadEvents } = useAsyncData(listTreasuryEvents)
  const { data: people } = useAsyncData(profilePickList)

  const [mint, setMint] = useState({ coins: '', note: '' })
  const [mintBusy, setMintBusy] = useState(false)
  const [dist, setDist] = useState({ perRecipient: '', audience: 'all', role: 'host', recipientIds: [], note: '' })
  const [distBusy, setDistBusy] = useState(false)

  const refreshAll = () => { reload(); reloadEvents() }

  const doMint = async () => {
    if (!Number(mint.coins)) { toast('Enter an amount'); return }
    setMintBusy(true)
    try {
      const row = await mintCoins(mint)
      toast(`Minted ${num(Number(mint.coins))} coins — balance ${num(Number(row.balance))}`)
      setMint({ coins: '', note: '' })
      refreshAll()
    } catch (e) { toast(e.message || 'Could not generate coins') }
    finally { setMintBusy(false) }
  }

  const targetCount = dist.audience === 'users' ? dist.recipientIds.length : null
  const doDistribute = async () => {
    if (!Number(dist.perRecipient)) { toast('Enter an amount per recipient'); return }
    if (dist.audience === 'users' && !dist.recipientIds.length) { toast('Pick at least one recipient'); return }
    setDistBusy(true)
    try {
      const res = await distributeCoins(dist)
      toast(`Sent ${num(Number(res.total))} coins to ${res.recipients} — balance ${num(Number(res.balance))}`)
      setDist({ perRecipient: '', audience: 'all', role: 'host', recipientIds: [], note: '' })
      refreshAll()
    } catch (e) { toast(e.message || 'Could not distribute coins') }
    finally { setDistBusy(false) }
  }

  return (
    <>
      <PageHeader title={<>Coin Treasury <PanelChip panel="super" /></>} crumbs={[...CR, 'Coin Treasury']} />
      <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
        Generating coins mints them into the platform treasury (the app's own supply — not a purchase). Distributing draws the
        balance down and credits recipient wallets through the same <code>coin_grants</code> path the Master panel uses.
      </div></Card>
      <AsyncView loading={loading} error={error} reload={reload}>
        {t && (
          <>
            <div className="grid cols-4">
              {[
                { k: 'Treasury balance', v: t.balance, tile: 'tile-purple', icon: 'wallet' },
                { k: 'Minted (all time)', v: t.minted, tile: 'tile-blue', icon: 'plus' },
                { k: 'Distributed', v: t.distributed, tile: 'tile-green', icon: 'arrowUpRight' },
                { k: 'In circulation', v: t.circulation, tile: 'tile-orange', icon: 'coins' },
              ].map((s) => (
                <div className="stat" key={s.k}>
                  <div className="stat__top">
                    <div><div className="stat__label">{s.k}</div><div className="stat__value">{num(s.v)}</div></div>
                    <div className={`stat__tile ${s.tile}`}><Icon name={s.icon} size={20} /></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid cols-2 mt-16">
              <Card title="Generate coins" sub="Mints into the treasury balance">
                <div className="form-grid">
                  <div className="field">
                    <label>Amount <span className="req">*</span></label>
                    <input className="input" type="number" min="1" placeholder="e.g. 1000000"
                      value={mint.coins} onChange={(e) => setMint((m) => ({ ...m, coins: e.target.value }))} />
                  </div>
                  <div className="field full">
                    <label>Note</label>
                    <input className="input" placeholder="Reason / batch reference"
                      value={mint.note} onChange={(e) => setMint((m) => ({ ...m, note: e.target.value }))} />
                  </div>
                </div>
                <div className="hstack mt-16" style={{ justifyContent: 'flex-end' }}>
                  <Button variant="primary" icon={mintBusy ? 'refresh' : 'plus'} disabled={mintBusy} onClick={doMint}>
                    {mintBusy ? 'Generating…' : 'Generate'}
                  </Button>
                </div>
              </Card>

              <Card title="Distribute" sub="Credits wallets from the treasury balance">
                <div className="form-grid">
                  <div className="field">
                    <label>Coins per recipient <span className="req">*</span></label>
                    <input className="input" type="number" min="1" placeholder="e.g. 500"
                      value={dist.perRecipient} onChange={(e) => setDist((d) => ({ ...d, perRecipient: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label>Audience</label>
                    <select className="select" value={dist.audience} onChange={(e) => setDist((d) => ({ ...d, audience: e.target.value }))}>
                      <option value="all">All users</option>
                      <option value="role">By role</option>
                      <option value="users">Specific users</option>
                    </select>
                  </div>
                  {dist.audience === 'role' && (
                    <div className="field">
                      <label>Role</label>
                      <select className="select" value={dist.role} onChange={(e) => setDist((d) => ({ ...d, role: e.target.value }))}>
                        {DISTRIBUTION_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL_D[r]}</option>)}
                      </select>
                    </div>
                  )}
                  {dist.audience === 'users' && (
                    <div className="field full">
                      <label>Recipients ({dist.recipientIds.length} selected)</label>
                      <select className="select" multiple size={5} value={dist.recipientIds}
                        onChange={(e) => setDist((d) => ({ ...d, recipientIds: [...e.target.selectedOptions].map((o) => o.value) }))}>
                        {(people || []).map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="field full">
                    <label>Note</label>
                    <input className="input" placeholder="Shown in each recipient's wallet ledger"
                      value={dist.note} onChange={(e) => setDist((d) => ({ ...d, note: e.target.value }))} />
                  </div>
                </div>
                <div className="hstack spread mt-16">
                  <span className="muted" style={{ fontSize: 12 }}>
                    {Number(dist.perRecipient) > 0 && targetCount != null
                      ? `${num(targetCount)} × ${num(Number(dist.perRecipient))} = ${num(targetCount * Number(dist.perRecipient))} coins`
                      : Number(dist.perRecipient) > 0
                        ? `${num(Number(dist.perRecipient))} coins each`
                        : ''}
                  </span>
                  <Button variant="primary" icon={distBusy ? 'refresh' : 'arrowUpRight'} disabled={distBusy} onClick={doDistribute}>
                    {distBusy ? 'Sending…' : 'Distribute'}
                  </Button>
                </div>
              </Card>
            </div>

            <Card flush title="Recent treasury activity" className="mt-16">
              <DataTable
                rows={events || []}
                searchKeys={['type', 'audience', 'note', 'by', 'idShort']}
                columns={[
                  { key: 'type', header: 'Event', render: (r) => <Tag>{r.type}</Tag> },
                  numCol('coins', 'Coins'),
                  { key: 'perRecipient', header: 'Per recipient', align: 'right', render: (r) => r.perRecipient ? num(r.perRecipient) : '—' },
                  { key: 'audience', header: 'Audience' },
                  numCol('recipients', 'Recipients'),
                  { key: 'note', header: 'Note', render: (r) => <span className="muted" style={{ fontSize: 12 }}>{r.note}</span> },
                  { key: 'by', header: 'By' },
                  { key: 'at', header: 'When', sortable: true },
                ]}
                emptyText="No treasury activity yet."
              />
            </Card>

            {isSuper && <MinterAllowList />}
          </>
        )}
      </AsyncView>
    </>
  )
}

function MinterAllowList() {
  const toast = useToast()
  const { data: rows, reload } = useAsyncData(listCoinMinters)
  const { data: candidates } = useAsyncData(minterCandidates)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState(null)
  const [busy, setBusy] = useState(false)

  const doRemove = async () => {
    setBusy(true)
    try { await removeCoinMinter(removing.id); toast(`${removing.name} removed`); setRemoving(null); reload() }
    catch (e) { toast(e.message || 'Could not remove') }
    finally { setBusy(false) }
  }

  return (
    <Card flush title="Who can generate & distribute" sub="Super Admins always can — add other staff accounts here" className="mt-16"
      action={<Button size="sm" icon="userPlus" onClick={() => setAdding(true)}>Add</Button>}>
      <DataTable
        rows={rows || []}
        searchKeys={['name', 'username', 'idShort']}
        columns={[
          personCol('name', 'username'),
          { key: 'idShort', header: 'User ID', render: (r) => <span className="mono muted">{r.idShort}</span> },
          { key: 'addedBy', header: 'Added by' },
          { key: 'addedAt', header: 'Added', sortable: true },
        ]}
        rowActions={(r) => [{ label: 'Remove', icon: 'trash', onClick: () => setRemoving(r) }]}
        emptyText="Only Super Admins can mint right now."
      />
      {adding && (
        <EntityForm
          title="Allow an account to mint coins"
          onClose={() => setAdding(false)}
          onSubmit={async (v) => { await addCoinMinter(v.profile_id); toast('Added to the allow-list'); reload() }}
          savedMessage="Added"
          fields={[{
            name: 'profile_id', label: 'Staff account', type: 'select', required: true,
            options: candidates || [],
            hint: (candidates && !candidates.length) ? 'Every non-super staff account already has access' : 'Only staff accounts are listed',
          }]}
        />
      )}
      {removing && (
        <ConfirmDialog
          title="Remove minting access?"
          danger busy={busy} confirmLabel="Remove"
          message={`${removing.name} (@${removing.username}) will no longer be able to generate or distribute coins.`}
          onConfirm={doRemove}
          onClose={() => setRemoving(null)}
        />
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ Audit Logs (real) */
export function AuditLogs() {
  const { can } = useAuth()
  const { data: rows, loading, error, reload } = useAsyncData(listAuditLogs)
  return (
    <>
      <PageHeader title="Audit Logs" crumbs={[...CR, 'Audit Logs']}
        actions={can('export_data') ? <Button icon="download">Export</Button> : null} />
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

import { useParams, useNavigate } from 'react-router-dom'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, KV, useToast, EmptyState } from '../../components/ui.jsx'
import { personCol, statusCol, numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import Icon from '../../components/Icon.jsx'
import { useState } from 'react'
import { useAsyncData } from '../../lib/useAsync.js'
import { useAuth } from '../../lib/auth.jsx'
import { listUsers, getUserDetail, setUserStatus, listStaff, fmtDate, ROLE_LABEL } from '../../lib/admin.js'
import {
  listTransferRequests, decideTransfer, createTransferRequest,
  agencyOptions, hostOptions, subAdminOptions,
} from '../../lib/workflows.js'
import EntityForm from '../../components/EntityForm.jsx'
import MediaPreview from '../../components/MediaPreview.jsx'
import BanDialog from '../../components/BanDialog.jsx'
import { liftUserBans, liftBan, listUserBans } from '../../lib/bans.js'
import { relativeTime } from '../../lib/format.js'
import { HostsTable } from './hosts.jsx'
import { listBadges, listFrames, grantBadge, grantUserFrame } from '../../lib/gamification.js'
import { listStoreItems } from '../../lib/store.js'
import { assignStoreItem, removeUserItem, updateUserProfile } from '../../lib/userTools.js'
import { userLuckyId, availableLuckyOptions, assignLuckyId, revokeLuckyId } from '../../lib/luckyIds.js'
import { uploadMedia } from '../../lib/storage.js'
import {
  CountryTransferHost, CountryTransferAgency, CountryTransferSubAdmin, CountryTransferCountry,
  CountryTransferGlobal,
} from '../countryAdmin.jsx'

const CRUMBS = ['Home', 'User Management']
const STATUS_OPTS = ['active', 'inactive', 'suspended']

/* The active bans on a user: "Live · 12 Oct 2026", "ID · Permanent". */
function RestrictionTags({ list }) {
  if (!list?.length) return <span className="muted">—</span>
  return (
    <span className="hstack" style={{ gap: 4, flexWrap: 'wrap' }}>
      {list.map((x) => <Tag key={x.kind}>{x.label} · {x.until}</Tag>)}
    </span>
  )
}

/* Master already sees (and, since migration 20261001090000, may act on) the
   whole Global > Country > Sub > Agency tree — same components Global Admin
   uses over that same tree, just crumbed under Master's own User Management. */
export const MasterTransferHost = CountryTransferHost
/* Master also hands a panel account's seat to another user (Agency / Sub Admin / Country / Global). */
export const MasterTransferAgency = () => <CountryTransferAgency handover />
export const MasterTransferSubAdmin = () => <CountryTransferSubAdmin handover />
export const MasterTransferCountry = () => <CountryTransferCountry handover />
export const MasterTransferGlobal = () => <CountryTransferGlobal handover />

/* ------------------------------------------------------------------ All Users */
/* readOnly: browse-only (a Global Admin sees every user but can't change their
   status — set_profile_status is admin-only in the database — and has no
   profile page of its own), so no row click, no Live Action, no row actions. */
export function UsersList({ readOnly = false, profileLink = true, crumbs = [...CRUMBS, 'Users'] }) {
  const nav = useNavigate()
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listUsers)
  const [ban, setBan] = useState(null) // { user, kinds } — the Restrict dialog

  const changeStatus = async (r, status) => {
    try {
      await setUserStatus(r.id, status)
      toast(`${r.name} → ${status}`)
      reload()
    } catch (e) {
      toast(e.message || 'Could not update status')
    }
  }
  const liftAll = async (r) => {
    try {
      await liftUserBans(r.id, 'Lifted from the admin panel')
      toast(`${r.name}: restrictions lifted`)
      reload()
    } catch (e) {
      toast(e.message || 'Could not lift the restrictions')
    }
  }

  return (
    <>
      <PageHeader
        title="User Management"
        crumbs={crumbs}
        actions={readOnly || !profileLink ? null : <Button icon="download" onClick={() => toast('Export coming soon')}>Export</Button>}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          onRowClick={readOnly || !profileLink ? undefined : (r) => nav(`/admin/users/${r.id}`)}
          searchKeys={['name', 'username', 'displayId', 'location']}
          searchPlaceholder="Search by name, username or user ID…"
          tabs={[
            { label: 'All', value: 'all', filter: () => true },
            { label: 'Hosts', value: 'h', filter: (r) => r.isHost },
            { label: 'Suspended', value: 'x', filter: (r) => r.status === 'Suspended' },
            { label: 'Restricted', value: 'r', filter: (r) => r.restricted },
          ]}
          filters={[
            { label: 'Role', options: ['User', 'Host'], get: (r) => r.role },
            { label: 'Status', options: ['Active', 'Inactive', 'Suspended'], get: (r) => r.status },
          ]}
          columns={[
            personCol('name', 'username'),
            { key: 'displayId', header: 'User ID', render: (r) => <span className="mono muted">{r.displayId}</span> },
            numCol('coins', 'Coins'),
            numCol('diamonds', 'Diamonds'),
            { key: 'agency', header: 'Agency', render: (r) => r.agency === '—' ? <span className="muted">—</span> : <Tag>{r.agency}</Tag> },
            { key: 'status', header: 'User Status', render: (r) => <StatusBadge value={r.status} /> },
            { key: 'restrictions', header: 'Restrictions', render: (r) => <RestrictionTags list={r.restrictions} /> },
            { key: 'isLive', header: 'Live Status', render: (r) => r.isLive ? <StatusBadge value="Live" /> : <span className="muted">Offline</span> },
            ...(readOnly ? [] : [{
              key: 'liveAction', header: 'Live Action', render: (r) => (
                // the row itself opens the profile — these buttons must not
                <div className="hstack" style={{ gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="primary" disabled={!r.restricted} onClick={() => liftAll(r)}>Yes</Button>
                  <Button size="sm" variant="danger" disabled={r.liveBlocked} onClick={() => setBan({ user: r, kinds: ['live'] })}>No</Button>
                </div>
              ),
            }]),
            { key: 'avatar', header: 'Image', render: (r) => r.avatar
              ? <img src={r.avatar} alt="" width={40} height={40} style={{ borderRadius: 8, objectFit: 'cover' }} />
              : <span className="muted">—</span> },
          ]}
          rowActions={readOnly ? undefined : (r) => [
            ...(profileLink ? [{ label: 'View profile', icon: 'eye', onClick: () => nav(`/admin/users/${r.id}`) }] : []),
            { label: 'Restrict (ban)…', icon: 'lock', onClick: () => setBan({ user: r, kinds: ['account'] }) },
            ...(r.restricted ? [{ label: 'Lift restrictions', icon: 'check', onClick: () => liftAll(r) }] : []),
            { label: 'Set inactive', icon: 'clock', onClick: () => changeStatus(r, 'inactive') },
          ]}
          emptyText="No users yet."
        />
      </AsyncView>
      {ban && <BanDialog user={ban.user} defaultKinds={ban.kinds} onClose={() => setBan(null)} onDone={reload} />}
    </>
  )
}

/* The Users page of the Global / Country / Sub Admin panels. Browse-only by default;
   if a Super Admin has granted this account "Manage users" (Access Control) it also
   gets Restrict / Lift / Set inactive — the database re-checks that grant
   (staff_can('manage_users')). These panels have no user profile page, so no row click. */
export function GrantableUsers({ crumbs }) {
  const { can } = useAuth()
  return <UsersList readOnly={!can('manage_users')} profileLink={false} crumbs={crumbs} />
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
          searchKeys={['name', 'username', 'agency', 'displayId']}
          columns={[
            personCol('name', 'username'),
            { key: 'displayId', header: 'User ID', render: (r) => <span className="mono muted">{r.displayId}</span> },
            { key: 'agency', header: 'Assigned Agency', sortable: true },
            { key: 'joined', header: 'Granted', sortable: true },
          ]}
          emptyText="No sub-admins yet. Grant the sub_admin role from Super Admin → Access Control."
        />
      </AsyncView>
    </>
  )
}

/* ------------------------------------------------------------------ User IDs (real profiles; vanity IDs not modelled) */
export function UserIds() {
  const toast = useToast()
  const nav = useNavigate()
  const { data: rows, loading, error, reload } = useAsyncData(listUsers)
  return (
    <>
      <PageHeader
        title="User ID Management"
        crumbs={[...CRUMBS, 'User IDs']}
        actions={<Button icon="helpCircle" onClick={() => toast('Custom / vanity IDs are not modelled in the backend yet')}>Policy</Button>}
      />
      <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
        <code>User ID</code> is <code>profiles.display_id</code> — the permanent, public-facing ID users see and quote in support requests.
        <code>System ID</code> is the internal <code>profiles.id</code> UUID, kept here for lookups/joins only; admins shouldn't need to read it out. Custom / vanity IDs aren't in the schema yet.
      </div></Card>
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          searchKeys={['name', 'username', 'displayId']}
          filters={[{ label: 'Status', options: ['Active', 'Inactive', 'Suspended'], get: (r) => r.status }]}
          columns={[
            personCol('name', 'username'),
            { key: 'displayId', header: 'User ID', render: (r) => <span className="mono">{r.displayId}</span> },
            { key: 'id', header: 'System ID', render: (r) => <span className="mono muted">{r.id}</span> },
            { key: 'level', header: 'Level', align: 'right' },
            numCol('followers', 'Followers'),
            statusCol(),
          ]}
          rowActions={(r) => [
            { label: 'Open profile', icon: 'user', onClick: () => nav(`/admin/users/${r.id}`) },
            { label: 'Copy User ID', icon: 'copy', onClick: () => { navigator.clipboard?.writeText(String(r.displayId)); toast('User ID copied') } },
            { label: 'Copy System ID', icon: 'copy', onClick: () => { navigator.clipboard?.writeText(r.id); toast('System ID copied') } },
          ]}
          emptyText="No users yet."
        />
      </AsyncView>
    </>
  )
}

/* ------------------------------------------------------------------ Account Status (real) */
export function AccountStatus() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listUsers)
  const [ban, setBan] = useState(null)
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
            { key: 'Restricted', v: list.filter((u) => u.restricted).length, tile: 'tile-red', icon: 'shield' },
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
          searchKeys={['name', 'username', 'displayId']}
          filters={[{ label: 'Status', options: ['Active', 'Inactive', 'Suspended'], get: (r) => r.status }]}
          columns={[
            personCol('name', 'username'),
            statusCol('status', 'Account status'),
            { key: 'restrictions', header: 'Restrictions', render: (r) => <RestrictionTags list={r.restrictions} /> },
            { key: 'verified', header: 'Verified', render: (r) => r.verified ? <StatusBadge value="Verified" /> : <span className="muted">No</span> },
            { key: 'location', header: 'Region' },
            { key: 'joined', header: 'Joined' },
          ]}
          rowActions={(r) => [
            { label: 'Set Active', icon: 'check', onClick: () => changeStatus(r, 'active') },
            { label: 'Set Inactive', icon: 'clock', onClick: () => changeStatus(r, 'inactive') },
            { label: 'Restrict (ban)…', icon: 'lock', onClick: () => setBan({ user: r, kinds: ['account'] }) },
          ]}
        />
      </AsyncView>
      {ban && <BanDialog user={ban.user} defaultKinds={ban.kinds} onClose={() => setBan(null)} onDone={reload} />}
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

/* ------------------------------------------------------------------ Sign-in & devices */
const METHOD_LABEL = {
  email: 'Email & password', phone: 'Phone & password', phone_otp: 'Phone OTP', signup: 'New sign-up',
  google: 'Google', apple: 'Apple', facebook: 'Facebook',
}
const methodLabel = (m) => METHOD_LABEL[m] || m || 'Unknown'
const platformLabel = (p) => ({ android: 'Android', ios: 'iPhone / iPad' }[p] || p || 'Unknown')

function LoginInfoCard({ login }) {
  if (!login) {
    return (
      <Card title="Sign-in & devices">
        <EmptyState icon="shield" title="Not available" text="Login details need the latest database update." />
      </Card>
    )
  }
  const providers = (login.providers || []).map((p) => methodLabel(p.provider === 'phone' ? 'phone_otp' : p.provider))
  const last = (login.logins || [])[0]
  return (
    <Card title="Sign-in & devices" sub="How this user signs in, and the devices they use">
      <KV rows={[
        ['Email', login.email || <span className="muted">—</span>],
        ['Phone', login.phone || <span className="muted">—</span>],
        ['Sign-in methods', providers.length ? <span className="hstack" style={{ gap: 4, flexWrap: 'wrap' }}>{[...new Set(providers)].map((p) => <Tag key={p}>{p}</Tag>)}</span> : <span className="muted">—</span>],
        ['Last sign-in', login.last_sign_in_at ? `${fmtDate(login.last_sign_in_at)} · ${relativeTime(login.last_sign_in_at)}` : '—'],
        ['Last used', last ? `${methodLabel(last.method)} · ${platformLabel(last.platform)}${last.model ? ` (${last.model})` : ''}` : '—'],
        ['Signed in on', login.active_session ? `${platformLabel(login.active_session.platform)}${login.active_session.model ? ` · ${login.active_session.model}` : ''}` : <span className="muted">No active device recorded</span>],
        ['Account created', fmtDate(login.created_at)],
      ]} />
      <div className="mt-16">
        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Devices ({(login.devices || []).length})</div>
        {(login.devices || []).length ? (
          <div className="feed">
            {login.devices.map((d) => (
              <div className="feed__item" key={d.device_id}>
                <span className="feed__dot"><Icon name="cpu" size={14} /></span>
                <div>
                  <div className="feed__text">{platformLabel(d.platform)}{d.model ? ` · ${d.model}` : ''}</div>
                  <div className="feed__time">First seen {fmtDate(d.first_seen_at)} · last {relativeTime(d.last_seen_at)}</div>
                  <div className="feed__time mono" style={{ fontSize: 11 }}>{d.device_id}</div>
                </div>
              </div>
            ))}
          </div>
        ) : <span className="muted" style={{ fontSize: 12.5 }}>No devices recorded yet — they appear after the user opens the updated app.</span>}
      </div>
      <div className="mt-16">
        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Recent sign-ins</div>
        {(login.logins || []).length ? (
          <div className="feed">
            {login.logins.slice(0, 8).map((l, i) => (
              <div className="feed__item" key={i}>
                <span className="feed__dot"><Icon name="key" size={14} /></span>
                <div>
                  <div className="feed__text">{methodLabel(l.method)} · {platformLabel(l.platform)}{l.model ? ` (${l.model})` : ''}</div>
                  <div className="feed__time">{fmtDate(l.created_at)} · {relativeTime(l.created_at)}{l.ip ? ` · IP ${l.ip}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        ) : <span className="muted" style={{ fontSize: 12.5 }}>No sign-ins recorded yet.</span>}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ User Profile (real) */
export function UserProfile() {
  const { id } = useParams()
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(() => getUserDetail(id), [id])
  const { data: bans, reload: reloadBans } = useAsyncData(() => listUserBans(id), [id])
  const [banning, setBanning] = useState(null) // default kinds for the Restrict dialog
  const [editing, setEditing] = useState(false)
  const refresh = () => { reload(); reloadBans() }

  const changeStatus = async (status) => {
    // Suspending is now an ID ban — go through the dialog so the type and length are chosen
    if (status === 'suspended') { setBanning(['account']); return }
    try { await setUserStatus(id, status); toast(`Status → ${status}`); refresh() }
    catch (e) { toast(e.message || 'Could not update status') }
  }
  const liftOne = async (banId) => {
    try { await liftBan(banId, 'Lifted from the admin panel'); toast('Ban lifted'); refresh() }
    catch (e) { toast(e.message || 'Could not lift the ban') }
  }
  const liftEverything = async () => {
    try { await liftUserBans(id, 'Lifted from the admin panel'); toast('Restrictions lifted'); refresh() }
    catch (e) { toast(e.message || 'Could not lift the restrictions') }
  }
  const restricted = (bans || []).some((b) => b.state === 'Active') || data?.profile?.status === 'suspended'

  const u = data?.profile
  return (
    <>
      <PageHeader
        title={u?.name || 'User'}
        crumbs={['Home', 'User Management', 'Users', u?.display_id != null ? String(u.display_id) : '…']}
        actions={<>
          <Button icon="chevronLeft" onClick={() => history.back()}>Back</Button>
          {u && restricted && <Button icon="check" onClick={liftEverything}>Lift restrictions</Button>}
          {u && <Button icon="edit" onClick={() => setEditing(true)}>Edit profile</Button>}
          {u && <Button variant="danger" icon="lock" onClick={() => setBanning(['account'])}>Restrict (ban)…</Button>}
        </>}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        {u ? <UserProfileBody data={data} bans={bans || []} onLift={liftOne} onStatus={changeStatus} onGranted={reload} /> : (
          <Card><div className="card__body"><EmptyState icon="helpCircle" title="User not found" text="No profile with this ID." /></div></Card>
        )}
      </AsyncView>
      {banning && u && <BanDialog user={{ id, name: u.name }} defaultKinds={banning} onClose={() => setBanning(null)} onDone={refresh} />}
      {editing && u && <EditUserProfile user={u} onClose={() => setEditing(false)} onDone={refresh} />}
    </>
  )
}

function UserProfileBody({ data, bans, onLift, onStatus, onGranted }) {
  const u = data.profile
  const w = u.wallets || {}
  const hp = u.host_profiles
  const sr = u.staff_roles
  const kyc = (u.kyc_verifications || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  const role = sr ? (ROLE_LABEL[sr.role] || sr.role) : hp ? 'Host' : 'User'
  const [granting, setGranting] = useState(null) // 'badge' | 'frame'
  const [assigningItem, setAssigningItem] = useState(false)
  const [assigningLucky, setAssigningLucky] = useState(false)
  const { data: lucky, reload: reloadLucky } = useAsyncData(() => userLuckyId(u.id), [u.id])
  const toast = useToast()
  const { data: catalog } = useAsyncData(async () => ({
    badges: await listBadges(),
    frames: await listFrames(),
  }))

  const removeItem = async (e) => {
    try { await removeUserItem(e.id); toast(`${e.name} removed`); onGranted?.() }
    catch (err) { toast(err.message || 'Could not remove') }
  }
  const revokeLucky = async () => {
    try { await revokeLuckyId(lucky.id); toast('Lucky ID revoked'); reloadLucky(); onGranted?.() }
    catch (err) { toast(err.message || 'Could not revoke') }
  }

  const grant = async (kind, id) => {
    try {
      if (kind === 'badge') await grantBadge(u.id, id)
      else await grantUserFrame(u.id, id)
      toast('Granted')
      setGranting(null)
      onGranted?.()
    } catch (e) {
      toast(e.message || 'Could not grant')
    }
  }

  return (
    <div className="grid dash">
      <div className="vstack" style={{ gap: 16 }}>
        <Card>
          <div className="hstack" style={{ gap: 16, alignItems: 'flex-start' }}>
            <Person name={u.name} size="xl" src={u.avatar_url} meta={'@' + (u.username || '')} />
            <div className="grow" />
            <div className="hstack wrap" style={{ gap: 8 }}>
              <StatusBadge value={u.status} />
              {u.verified && <StatusBadge value="Verified" />}
              {u.is_live && <StatusBadge value="Live" />}
              <Tag role>{role}</Tag>
            </div>
          </div>
          <div className="mt-16">
            <KV rows={[
              ['User ID', <span className="mono">{u.display_id}</span>],
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

        <Card
          title="Bag"
          sub="Entry effects, vehicles, frames and room skins this user owns — the equipped entry effect / vehicle plays when they walk into a live"
          action={<Button size="sm" icon="userPlus" onClick={() => setAssigningItem(true)}>Assign item</Button>}
        >
          {data.entries.length ? (
            <div className="feed">
              {data.entries.map((e) => (
                <div className="feed__item" key={e.id}>
                  <span className="feed__dot" style={{ background: 'none' }}><MediaPreview url={e.assetUrl} emoji={e.emoji} size={12} /></span>
                  <div className="grow">
                    <div className="feed__text">{e.name} · <Tag>{e.kind}</Tag></div>
                    <div className="feed__time">
                      {e.active ? `Expires ${fmtDate(e.expiresAt)}` : `Expired ${fmtDate(e.expiresAt)}`} · added {relativeTime(e.purchasedAt)}
                    </div>
                  </div>
                  {e.equipped && e.active ? <StatusBadge value="Equipped" /> : !e.active ? <StatusBadge value="Expired" /> : <span className="muted">Owned</span>}
                  <Button size="sm" onClick={() => removeItem(e)}>Remove</Button>
                </div>
              ))}
            </div>
          ) : <EmptyState icon="userPlus" title="Nothing in the Bag" text="Nothing bought or assigned yet — use Assign item to add something." />}
        </Card>

        <Card
          title="Lucky ID"
          sub="A special app ID that replaces this user's own while they hold it"
          action={lucky
            ? <Button size="sm" onClick={revokeLucky}>Revoke</Button>
            : <Button size="sm" icon="userPlus" onClick={() => setAssigningLucky(true)}>Assign Lucky ID</Button>}
        >
          {lucky
            ? <div className="hstack" style={{ gap: 10 }}><b className="mono" style={{ fontSize: 18 }}>{lucky.number}</b><span className="muted">expires {lucky.expires}</span></div>
            : <EmptyState icon="star" title="No Lucky ID" text="They use their own app ID." />}
        </Card>

        <Card title="Badges" action={<Button size="sm" icon="userPlus" onClick={() => setGranting('badge')}>Assign badge</Button>}>
          {data.badges.length ? (
            <div className="hstack wrap" style={{ gap: 10 }}>
              {data.badges.map((b, i) => (
                <span key={i} className="hstack" style={{ gap: 6, background: 'var(--surface-2)', padding: '6px 10px', borderRadius: 8 }}>
                  <span style={{ fontSize: 16 }}>{b.badges?.emoji}</span>
                  <b style={{ fontSize: 12.5 }}>{b.badges?.name}</b>
                </span>
              ))}
            </div>
          ) : <EmptyState icon="award" title="No badges yet" />}
        </Card>

        <Card title="Profile Frame" action={<Button size="sm" icon="userPlus" onClick={() => setGranting('frame')}>Assign frame</Button>}>
          {data.frames.length ? (
            <div className="hstack wrap" style={{ gap: 10 }}>
              {data.frames.map((f, i) => (
                <span key={i} className="hstack" style={{ gap: 6, background: 'var(--surface-2)', padding: '6px 10px', borderRadius: 8 }}>
                  <span style={{ fontSize: 16 }}>{f.frames?.emoji}</span>
                  <b style={{ fontSize: 12.5 }}>{f.frames?.name}</b>
                  {f.equipped && <StatusBadge value="Active" />}
                </span>
              ))}
            </div>
          ) : <EmptyState icon="frame" title="No profile frames yet" />}
        </Card>

        <Card title="Friends" sub={`${data.followers.length} followers · ${data.following.length} following (most recent 50 each)`}>
          {(data.followers.length || data.following.length) ? (
            <DataTable
              rows={[
                ...data.followers.map((p) => ({ ...p, dir: 'Follower' })),
                ...data.following.map((p) => ({ ...p, dir: 'Following' })),
              ]}
              searchKeys={['name', 'username']}
              columns={[
                personCol('name', 'username'),
                { key: 'dir', header: 'Relation', render: (r) => <Tag>{r.dir}</Tag> },
              ]}
              emptyText="No connections yet."
            />
          ) : <EmptyState icon="users" title="No followers or following yet" />}
        </Card>
      </div>

      <div className="vstack" style={{ gap: 16 }}>
        <LoginInfoCard login={data.login} />
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
        <Card title="Restrictions" sub="Live, ID and device bans — enforced by the app and the database">
          {bans.length ? (
            <div className="feed">
              {bans.map((b) => (
                <div className="feed__item" key={b.id}>
                  <span className="feed__dot"><Icon name="lock" size={14} /></span>
                  <div className="grow">
                    <div className="feed__text">
                      {b.kindLabel} · {b.permanent ? 'Permanent' : `until ${b.until}`} · <StatusBadge value={b.state} />
                    </div>
                    <div className="feed__time">
                      {b.reason ? `${b.reason} · ` : ''}by {b.by} · {b.when}
                      {b.devices ? ` · ${b.devices} device${b.devices === 1 ? '' : 's'}` : ''}
                      {b.state === 'Lifted' && b.liftedBy ? ` · lifted by ${b.liftedBy}` : ''}
                    </div>
                  </div>
                  {b.state === 'Active' && <Button size="sm" onClick={() => onLift(b.id)}>Lift</Button>}
                </div>
              ))}
            </div>
          ) : <EmptyState icon="shield" title="No bans" text="This user has never been restricted." />}
        </Card>
        <Card title="Account status">
          <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
            Active lifts every ban. Suspended opens the Restrict dialog (an ID ban — choose how long).
            Inactive just ends an ID ban. Other profile fields are edited by the user in-app.
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

      {assigningItem && <AssignItemForm user={u} onClose={() => setAssigningItem(false)} onDone={() => { setAssigningItem(false); onGranted?.() }} />}
      {assigningLucky && <AssignLuckyForm user={u} onClose={() => setAssigningLucky(false)} onDone={() => { setAssigningLucky(false); reloadLucky(); onGranted?.() }} />}
      {granting && (
        <EntityForm
          title={granting === 'badge' ? `Assign a badge to ${u.name}` : `Assign a frame to ${u.name}`}
          onClose={() => setGranting(null)}
          onSubmit={(v) => grant(granting, v.item_id)}
          savedMessage="Assigned"
          fields={[{
            name: 'item_id',
            label: granting === 'badge' ? 'Badge' : 'Frame',
            type: 'select',
            required: true,
            options: (granting === 'badge' ? catalog?.badges : catalog?.frames)?.map((x) => ({ value: x.id, label: `${x.emoji} ${x.name}` })) || [],
          }]}
        />
      )}
    </div>
  )
}

/* Assign a Store item straight into the user's Bag (no coins charged). */
const ITEM_KINDS = [
  { value: 'entry_effect', label: 'Entry effect' },
  { value: 'vehicle', label: 'Vehicle (Garage)' },
  { value: 'frame', label: 'Frame (Store)' },
  { value: 'room_skin', label: 'Room skin' },
]
function AssignItemForm({ user, onClose, onDone }) {
  const [kind, setKind] = useState('entry_effect')
  const { data: items } = useAsyncData(() => listStoreItems(kind), [kind])
  return (
    <EntityForm
      title={`Assign an item to ${user.name}`}
      submitLabel="Assign"
      savedMessage="Added to their Bag"
      initial={{ kind: 'entry_effect', equip: true }}
      onChange={(name, val) => { if (name === 'kind') setKind(val) }}
      onClose={onClose}
      fields={[
        { name: 'kind', label: 'Type', type: 'select', required: true, options: ITEM_KINDS, full: true },
        { name: 'item_id', label: 'Item', type: 'select', required: true, full: true,
          options: (items || []).map((i) => ({ value: i.id, label: `${i.emoji} ${i.name} · ${i.days} days` })) },
        { name: 'days', label: 'Days (optional)', type: 'number', hint: 'Leave empty for the item\'s own duration. Adds to an unexpired copy.' },
        { name: 'equip', label: 'Equip it now', type: 'toggle' },
      ]}
      onSubmit={async (v) => {
        if (!(items || []).some((i) => i.id === v.item_id)) throw new Error('Pick an item of this type')
        await assignStoreItem(user.id, v.item_id, v.days, v.equip)
        onDone()
      }}
    />
  )
}

function AssignLuckyForm({ user, onClose, onDone }) {
  const { data: options } = useAsyncData(availableLuckyOptions)
  return (
    <EntityForm
      title={`Assign a Lucky ID to ${user.name}`}
      submitLabel="Assign"
      savedMessage="Lucky ID assigned"
      onClose={onClose}
      fields={[
        { name: 'lucky_id', label: 'Lucky ID', type: 'select', required: true, full: true, options: options || [], hint: 'Their own app ID comes back when it expires or you revoke it.' },
        { name: 'days', label: 'Days (optional)', type: 'number' },
      ]}
      onSubmit={async (v) => { await assignLuckyId(v.lucky_id, user.id, v.days); onDone() }}
    />
  )
}

/* Edit an ordinary user's profile from the panel. */
function EditUserProfile({ user, onClose, onDone }) {
  return (
    <EntityForm
      title={`Edit ${user.name}`}
      savedMessage="Profile updated"
      initial={{
        name: user.name || '', username: user.username || '', bio: user.bio || '', location: user.location || '',
        gender: user.gender || '', date_of_birth: user.date_of_birth || '', phone: user.phone || '', avatar_url: user.avatar_url || '',
      }}
      onClose={onClose}
      fields={[
        { name: 'avatar_url', label: 'Profile photo', type: 'image', full: true, accept: '.png,.jpg,.jpeg,image/png,image/jpeg',
          onUpload: (file) => uploadMedia('avatars', user.id, file), hint: 'PNG or JPG' },
        { name: 'name', label: 'Name', required: true },
        { name: 'username', label: 'Username', required: true, hint: '3–30 letters, numbers or underscore' },
        { name: 'gender', label: 'Gender', type: 'select', options: [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }, { value: 'other', label: 'Other' }] },
        { name: 'date_of_birth', label: 'Date of birth', type: 'date' },
        { name: 'location', label: 'Location' },
        { name: 'phone', label: 'Phone' },
        { name: 'bio', label: 'Bio', type: 'textarea', full: true },
      ]}
      onSubmit={async (v) => { await updateUserProfile(user.id, v); onDone() }}
    />
  )
}

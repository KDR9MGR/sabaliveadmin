import { useParams, useNavigate } from 'react-router-dom'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, Person, StatusBadge, Tag, KV, useToast, EmptyState } from '../../components/ui.jsx'
import { personCol, statusCol, numCol } from '../../components/cells.jsx'
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
import BanDialog from '../../components/BanDialog.jsx'
import { liftUserBans, liftBan, listUserBans } from '../../lib/bans.js'
import { relativeTime } from '../../lib/format.js'
import { HostsTable } from './hosts.jsx'
import { listBadges, listFrames, grantBadge, grantUserFrame } from '../../lib/gamification.js'
import {
  CountryTransferHost, CountryTransferAgency, CountryTransferSubAdmin, CountryTransferCountry,
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
export const MasterTransferAgency = CountryTransferAgency
export const MasterTransferSubAdmin = CountryTransferSubAdmin
export const MasterTransferCountry = CountryTransferCountry

/* ------------------------------------------------------------------ All Users */
/* readOnly: browse-only (a Global Admin sees every user but can't change their
   status — set_profile_status is admin-only in the database — and has no
   profile page of its own), so no row click, no Live Action, no row actions. */
export function UsersList({ readOnly = false, crumbs = [...CRUMBS, 'Users'] }) {
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
        actions={readOnly ? null : <Button icon="download" onClick={() => toast('Export coming soon')}>Export</Button>}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          onRowClick={readOnly ? undefined : (r) => nav(`/admin/users/${r.id}`)}
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
            { label: 'View profile', icon: 'eye', onClick: () => nav(`/admin/users/${r.id}`) },
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
          searchKeys={['name', 'username', 'idShort']}
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

/* ------------------------------------------------------------------ User Profile (real) */
export function UserProfile() {
  const { id } = useParams()
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(() => getUserDetail(id), [id])
  const { data: bans, reload: reloadBans } = useAsyncData(() => listUserBans(id), [id])
  const [banning, setBanning] = useState(null) // default kinds for the Restrict dialog
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
        crumbs={['Home', 'User Management', 'Users', id?.slice(0, 8)]}
        actions={<>
          <Button icon="chevronLeft" onClick={() => history.back()}>Back</Button>
          {u && restricted && <Button icon="check" onClick={liftEverything}>Lift restrictions</Button>}
          {u && <Button variant="danger" icon="lock" onClick={() => setBanning(['account'])}>Restrict (ban)…</Button>}
        </>}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        {u ? <UserProfileBody data={data} bans={bans || []} onLift={liftOne} onStatus={changeStatus} onGranted={reload} /> : (
          <Card><div className="card__body"><EmptyState icon="helpCircle" title="User not found" text="No profile with this ID." /></div></Card>
        )}
      </AsyncView>
      {banning && u && <BanDialog user={{ id, name: u.name }} defaultKinds={banning} onClose={() => setBanning(null)} onDone={refresh} />}
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
  const toast = useToast()
  const { data: catalog } = useAsyncData(async () => ({
    badges: await listBadges(),
    frames: await listFrames(),
  }))

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
            <Person name={u.name} size="xl" meta={'@' + (u.username || '')} />
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

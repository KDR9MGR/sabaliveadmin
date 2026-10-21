import { useState } from 'react'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, StatusBadge, Tag, Badge, Modal, ConfirmDialog, useToast } from '../../components/ui.jsx'
import { statusCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import SvgaPlayer from '../../components/SvgaPlayer.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { UPLOAD_ACCEPT, mediaKind } from '../../lib/storage.js'
import {
  listBanners, createBanner, updateBanner, setBannerStatus, uploadBannerImage,
  getBannerSettings, updateBannerSettings, BANNER_INTERVAL_MIN, BANNER_INTERVAL_MAX,
  listLegalPages, createLegalPage, updateLegalPage, setLegalStatus,
  listAnnouncements, createAnnouncement, updateAnnouncement, markAnnouncementSent, sendAnnouncementNow, scheduleAnnouncement, cancelAnnouncement,
  BANNER_PLACEMENTS, BANNER_STATUSES, LEGAL_STATUSES, ANNOUNCE_AUDIENCES, ANNOUNCE_CHANNELS,
} from '../../lib/content.js'

const CRUMBS = ['Home', 'Content / Settings']
const opt = (v) => ({ value: v, label: v.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') })
const PLACEMENT_OPTS = BANNER_PLACEMENTS.map(opt)
const BANNER_STATUS_OPTS = BANNER_STATUSES.map(opt)
const LEGAL_STATUS_OPTS = LEGAL_STATUSES.map(opt)
const AUDIENCE_OPTS = ANNOUNCE_AUDIENCES.map(opt)
// Email is not delivered by the platform, so it is not offered; an old announcement that has it is delivered like a push.
const CHANNEL_OPTS = [
  { value: 'push', label: 'Push + notifications list' },
  { value: 'in_app', label: 'Notifications list only (no push)' },
]

/* ------------------------------------------------------------------ Banners */
/* How long each banner stays on the app's home screen before sliding to the next. */
function BannerSlideSettings() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(getBannerSettings)
  const [value, setValue] = useState(null)
  const [busy, setBusy] = useState(false)
  const current = data?.slide_interval_seconds
  const shown = value ?? (current != null ? String(current) : '')
  const dirty = value != null && Number(value) !== current

  const save = async () => {
    setBusy(true)
    try {
      await updateBannerSettings({ slide_interval_seconds: value })
      toast('Slide interval saved — the app picks it up within a few minutes')
      setValue(null)
      reload()
    } catch (e) {
      toast(e.message || 'Could not save')
    } finally { setBusy(false) }
  }

  return (
    <Card title="Auto-slide" sub="How long each banner shows on the app's home screen before sliding to the next">
      <div className="card__body">
        {error ? <div className="muted">Couldn't load the setting — {error}</div> : (
          <div className="hstack wrap" style={{ gap: 12, alignItems: 'flex-end' }}>
            <div className="field" style={{ margin: 0, width: 200 }}>
              <label>Slide every (seconds)</label>
              <input className="input" type="number" min={BANNER_INTERVAL_MIN} max={BANNER_INTERVAL_MAX} step="1"
                disabled={loading} value={shown} onChange={(e) => setValue(e.target.value)} />
            </div>
            <Button variant="primary" icon={busy ? 'refresh' : 'check'} disabled={busy || loading || !dirty} onClick={save}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
            <span className="muted" style={{ fontSize: 12 }}>
              {BANNER_INTERVAL_MIN}–{BANNER_INTERVAL_MAX} seconds. Default 20. Only applies when there is more than one active banner.
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}

export function Banners() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listBanners)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)

  const fields = [
    { name: 'title', label: 'Title', required: true },
    { name: 'image_url', label: 'Image', type: 'image', accept: UPLOAD_ACCEPT, onUpload: uploadBannerImage, hint: 'SVGA, MP4, GIF, WebP or PNG', full: true },
    { name: 'placement', label: 'Placement', type: 'select', options: PLACEMENT_OPTS, required: true },
    { name: 'starts_at', label: 'Starts (YYYY-MM-DD)', placeholder: '2026-09-10' },
    { name: 'ends_at', label: 'Ends (YYYY-MM-DD)', placeholder: '2026-09-20', hint: 'Leave blank to run with no expiry' },
    { name: 'status', label: 'Status', type: 'select', options: BANNER_STATUS_OPTS },
  ]

  return (
    <>
      <PageHeader title="Banners" crumbs={[...CRUMBS, 'Banners']}
        actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add Banner</Button>} />
      <div className="mb-16"><BannerSlideSettings /></div>
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          searchKeys={['title', 'placement', 'idShort']}
          filters={[
            { label: 'Placement', options: BANNER_PLACEMENTS.map((p) => opt(p).label), get: (r) => r.placement },
            { label: 'Status', options: ['Active', 'Scheduled', 'Expired'], get: (r) => r.status },
          ]}
          columns={[
            { key: 'title', header: 'Banner', sortable: true, render: (r) => {
              const box = { width: 44, height: 28, borderRadius: 6, objectFit: 'cover' }
              const kind = mediaKind(r.imageUrl)
              return (
                <span className="hstack" style={{ gap: 10 }}>
                  {kind === 'video' ? <video src={r.imageUrl} autoPlay loop muted playsInline style={box} />
                    : kind === 'image' ? <img src={r.imageUrl} alt="" style={box} />
                    : kind === 'svga' ? <SvgaPlayer url={r.imageUrl} size={44} style={{ borderRadius: 6, overflow: 'hidden' }} />
                    : <span style={{ ...box, display: 'block', background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }} />}
                  <b>{r.title}</b>
                </span>
              )
            } },
            { key: 'placement', header: 'Placement', render: (r) => <Tag>{r.placement}</Tag> },
            { key: 'starts', header: 'Starts', sortable: true },
            { key: 'ends', header: 'Ends' },
            statusCol(),
          ]}
          rowActions={(r) => [
            { label: 'Edit', icon: 'edit', onClick: () => setEditing(r) },
            r.status === 'Active'
              ? { label: 'Expire', icon: 'lock', onClick: async () => { await setBannerStatus(r.id, 'expired'); toast('Banner expired'); reload() } }
              : { label: 'Activate', icon: 'check', onClick: async () => { await setBannerStatus(r.id, 'active'); toast('Banner active'); reload() } },
          ]}
          emptyText="No banners yet."
        />
      </AsyncView>
      {adding && (
        <EntityForm title="Add Banner" onClose={() => setAdding(false)} savedMessage="Banner created"
          onSubmit={async (v) => { await createBanner(v); reload() }}
          initial={{ placement: 'home_top', status: 'scheduled' }} fields={fields} />
      )}
      {editing && (
        <EntityForm title={`Edit — ${editing.title}`} onClose={() => setEditing(null)} savedMessage="Banner updated"
          onSubmit={async (v) => { await updateBanner(editing.id, v); reload() }}
          initial={{
            title: editing.title, image_url: editing.imageUrl || '',
            placement: editing.placement.toLowerCase().replace(' ', '_'),
            starts_at: editing.starts === '—' ? '' : editing.starts,
            ends_at: editing.ends === '—' ? '' : editing.ends,
            status: editing.status.toLowerCase(),
          }}
          fields={fields} />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ Legal Pages */
export function LegalPages() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listLegalPages)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)

  const fields = [
    { name: 'title', label: 'Title', required: true },
    { name: 'slug', label: 'Slug', required: true, hint: 'The app fetches the page by this slug — keep it stable', placeholder: 'terms-of-service' },
    { name: 'status', label: 'Status', type: 'select', options: LEGAL_STATUS_OPTS },
    { name: 'body', label: 'Body (Markdown / plain text)', type: 'textarea', full: true, required: true },
  ]

  return (
    <>
      <PageHeader title="Legal Pages" crumbs={[...CRUMBS, 'Legal Pages']}
        actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>New Page</Button>} />
      <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
        The consumer app reads these by <code>slug</code>. Publishing a page here makes it visible in-app immediately.
      </div></Card>
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          searchKeys={['title', 'slug']}
          filters={[{ label: 'Status', options: ['Draft', 'Published'], get: (r) => r.status }]}
          columns={[
            { key: 'title', header: 'Page', sortable: true, render: (r) => <b>{r.title}</b> },
            { key: 'slug', header: 'Slug', render: (r) => <span className="mono muted">{r.slug}</span> },
            { key: 'chars', header: 'Length', align: 'right', render: (r) => `${r.chars.toLocaleString()} ch` },
            { key: 'updated', header: 'Last updated', sortable: true },
            statusCol(),
          ]}
          rowActions={(r) => [
            { label: 'Edit content', icon: 'edit', onClick: () => setEditing(r) },
            r.status === 'Published'
              ? { label: 'Unpublish', icon: 'lock', onClick: async () => { await setLegalStatus(r.id, 'draft'); toast(`${r.title} unpublished`); reload() } }
              : { label: 'Publish', icon: 'externalLink', onClick: async () => { await setLegalStatus(r.id, 'published'); toast(`${r.title} published — live in-app`); reload() } },
          ]}
          emptyText="No legal pages yet."
        />
      </AsyncView>
      {adding && (
        <EntityForm title="New Legal Page" onClose={() => setAdding(false)} savedMessage="Page created"
          onSubmit={async (v) => { await createLegalPage(v); reload() }}
          initial={{ status: 'draft' }} fields={fields} />
      )}
      {editing && (
        <EntityForm title={`Edit — ${editing.title}`} onClose={() => setEditing(null)} savedMessage="Page saved"
          onSubmit={async (v) => { await updateLegalPage(editing.id, v); reload() }}
          initial={{ title: editing.title, slug: editing.slug, status: editing.status.toLowerCase(), body: editing.body }}
          fields={fields} />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ Announcements
   Send now, or at a chosen time. The users get it in their Notifications list in the app and, on the "Push" channel, as a push notification (the
   title and the message together). Delivery runs on the server in batches, so a big audience takes a few minutes to complete. */
const localInput = (d) => { const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}` }

function ScheduleDialog({ row, onClose, onDone }) {
  const toast = useToast()
  const soon = new Date(Date.now() + 10 * 60000)
  const [at, setAt] = useState(row.sendAt ? localInput(new Date(row.sendAt)) : localInput(soon))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const save = async () => {
    setBusy(true); setError('')
    try { await scheduleAnnouncement(row.id, at); toast(`“${row.title}” scheduled`); onDone(); onClose() }
    catch (e) { setError(e?.message || 'Could not schedule') }
    finally { setBusy(false) }
  }
  return (
    <Modal title={`Schedule “${row.title}”`} onClose={busy ? () => {} : onClose}
      footer={<><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="primary" icon={busy ? 'refresh' : 'calendar'} disabled={busy || !at} onClick={save}>{busy ? 'Saving…' : 'Schedule'}</Button></>}>
      {error && <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 14 }}>{error}</div>}
      <div className="field">
        <label>Send at</label>
        <input className="input" type="datetime-local" value={at} min={localInput(new Date())} onChange={(e) => setAt(e.target.value)} />
        <span className="hint">In your computer's time zone. It goes out within a minute of this time.</span>
      </div>
    </Modal>
  )
}

export function Announcements() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listAnnouncements)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [sending, setSending] = useState(null)   // the announcement being confirmed for Send now
  const [scheduling, setScheduling] = useState(null)
  const [busy, setBusy] = useState(false)

  const fields = [
    { name: 'title', label: 'Title', required: true },
    { name: 'audience', label: 'Audience', type: 'select', options: AUDIENCE_OPTS, required: true },
    { name: 'channel', label: 'Channel', type: 'select', options: CHANNEL_OPTS },
    { name: 'body', label: 'Message', type: 'textarea', full: true, required: true },
  ]
  const createFields = [...fields, { name: 'send_at', label: 'Send at (optional)', type: 'datetime-local', hint: "Leave empty to keep it as a draft and press Send now when you are ready. In your computer's time zone." }]

  const sendNow = async () => {
    setBusy(true)
    try {
      const r = await sendAnnouncementNow(sending.id)
      toast(r?.status === 'sent' ? `“${sending.title}” delivered` : `“${sending.title}” is going out — ${r?.delivered_now ?? 0} users reached, the rest within a few minutes`)
      setSending(null)
      reload()
    } catch (e) {
      toast(e.message || 'Could not send')
      setSending(null)
    } finally {
      setBusy(false)
    }
  }
  const act = async (fn, okMsg) => { try { await fn(); toast(okMsg); reload() } catch (e) { toast(e.message || 'Could not update') } }

  return (
    <>
      <PageHeader title="Announcements" crumbs={[...CRUMBS, 'Announcements']}
        actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>New Announcement</Button>} />
      <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
        <b>Send now</b> puts the announcement in the Notifications list of everyone in the audience and, on the Push channel, sends it as a push notification (title and message together). The first 150 users get it at once and the rest within a few minutes. <b>Schedule</b> sends it by itself at the time you pick. Accounts you watch invisibly (ghost IDs) never receive it.
      </div></Card>
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          searchKeys={['title', 'audience', 'idShort']}
          tabs={[
            { label: 'All', value: 'all', filter: () => true },
            { label: 'Draft', value: 'd', filter: (r) => r.status === 'Draft' },
            { label: 'Scheduled', value: 'sc', filter: (r) => r.status === 'Scheduled' || r.status === 'Sending' },
            { label: 'Sent', value: 's', filter: (r) => r.status === 'Sent' },
          ]}
          columns={[
            { key: 'title', header: 'Announcement', sortable: true, render: (r) => <div><b>{r.title}</b>{r.lastError && <div style={{ color: 'var(--danger)', fontSize: 12 }}>Last error: {r.lastError}</div>}</div> },
            { key: 'audience', header: 'Audience', render: (r) => <Tag>{r.audience}</Tag> },
            { key: 'channel', header: 'Channel', render: (r) => (r.channel === 'In App' ? 'List only' : 'Push + list') },
            { key: 'when', header: 'When', sortable: true, render: (r) => (r.status === 'Sent' ? r.sent : r.sendAt ? <span>{r.sendAtLabel}</span> : <span className="muted">—</span>) },
            { key: 'recipients', header: 'Reached', align: 'right', render: (r) => (r.recipients != null ? <span className="mono">{r.recipients}</span> : <span className="muted">—</span>) },
            { key: 'status', header: 'Status', render: (r) => (r.status === 'Sending' ? <Badge tone="info">Sending…</Badge> : <StatusBadge value={r.status} />) },
          ]}
          rowActions={(r) => [
            r.status === 'Draft' || r.status === 'Scheduled' ? { label: 'Edit', icon: 'edit', onClick: () => setEditing(r) } : { label: 'View', icon: 'eye', onClick: () => setEditing(r) },
            ...(r.status === 'Draft' || r.status === 'Scheduled' ? [{ label: 'Send now', icon: 'bell', onClick: () => setSending(r) }] : []),
            ...(r.status === 'Draft' || r.status === 'Scheduled' ? [{ label: r.status === 'Scheduled' ? 'Change time…' : 'Schedule…', icon: 'calendar', onClick: () => setScheduling(r) }] : []),
            ...(r.status === 'Scheduled' ? [{ label: 'Cancel schedule', icon: 'x', onClick: () => act(() => cancelAnnouncement(r.id), `“${r.title}” is a draft again`) }] : []),
            ...(r.status === 'Draft' ? [{ label: "Mark as sent (don't deliver)", icon: 'check', onClick: () => act(() => markAnnouncementSent(r.id), `${r.title} marked sent`) }] : []),
          ]}
          emptyText="No announcements yet."
        />
      </AsyncView>
      {adding && (
        <EntityForm title="New Announcement" onClose={() => setAdding(false)} savedMessage="Announcement saved"
          onSubmit={async (v) => {
            const row = await createAnnouncement(v)
            if (v.send_at) await scheduleAnnouncement(row.id, v.send_at)
            reload()
          }}
          initial={{ audience: 'all', channel: 'push' }} fields={createFields} />
      )}
      {editing && (
        <EntityForm title={`${editing.status === 'Sent' || editing.status === 'Sending' ? 'View' : 'Edit'} — ${editing.title}`} onClose={() => setEditing(null)} savedMessage="Announcement saved"
          onSubmit={async (v) => { if (editing.status === 'Sent' || editing.status === 'Sending') throw new Error('This announcement has already gone out and cannot be changed'); await updateAnnouncement(editing.id, v); reload() }}
          initial={{ title: editing.title, audience: editing.audience.toLowerCase().replace(/ /g, '_'), channel: editing.channel.toLowerCase().replace(/ /g, '_') === 'in_app' ? 'in_app' : 'push', body: editing.body }}
          fields={fields} />
      )}
      {sending && (
        <ConfirmDialog
          title={`Send “${sending.title}” now?`}
          busy={busy}
          confirmLabel="Send now"
          message={`This goes to everyone in the audience (${sending.audience}) ${sending.channel === 'In App' ? 'in their Notifications list, without a push' : 'as a push notification and in their Notifications list'}. The first 150 users get it at once, the rest within a few minutes. It cannot be taken back once it is sent.`}
          onConfirm={sendNow}
          onClose={() => setSending(null)}
        />
      )}
      {scheduling && <ScheduleDialog row={scheduling} onClose={() => setScheduling(null)} onDone={reload} />}
    </>
  )
}

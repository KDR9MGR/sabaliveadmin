import { useState } from 'react'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, StatusBadge, Tag, useToast } from '../../components/ui.jsx'
import { statusCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import {
  listBanners, createBanner, updateBanner, setBannerStatus,
  listLegalPages, createLegalPage, updateLegalPage, setLegalStatus,
  listAnnouncements, createAnnouncement, updateAnnouncement, markAnnouncementSent, broadcastAnnouncement,
  BANNER_PLACEMENTS, BANNER_STATUSES, LEGAL_STATUSES, ANNOUNCE_AUDIENCES, ANNOUNCE_CHANNELS,
} from '../../lib/content.js'

const CRUMBS = ['Home', 'Content / Settings']
const opt = (v) => ({ value: v, label: v.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') })
const PLACEMENT_OPTS = BANNER_PLACEMENTS.map(opt)
const BANNER_STATUS_OPTS = BANNER_STATUSES.map(opt)
const LEGAL_STATUS_OPTS = LEGAL_STATUSES.map(opt)
const AUDIENCE_OPTS = ANNOUNCE_AUDIENCES.map(opt)
const CHANNEL_OPTS = ANNOUNCE_CHANNELS.map(opt)

/* ------------------------------------------------------------------ Banners */
export function Banners() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listBanners)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)

  const fields = [
    { name: 'title', label: 'Title', required: true },
    { name: 'image_url', label: 'Image URL' },
    { name: 'placement', label: 'Placement', type: 'select', options: PLACEMENT_OPTS, required: true },
    { name: 'starts_at', label: 'Starts (YYYY-MM-DD)', placeholder: '2026-09-10' },
    { name: 'ends_at', label: 'Ends (YYYY-MM-DD)', placeholder: '2026-09-20' },
    { name: 'status', label: 'Status', type: 'select', options: BANNER_STATUS_OPTS },
  ]

  return (
    <>
      <PageHeader title="Banners" crumbs={[...CRUMBS, 'Banners']}
        actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add Banner</Button>} />
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          searchKeys={['title', 'placement', 'idShort']}
          filters={[
            { label: 'Placement', options: BANNER_PLACEMENTS.map((p) => opt(p).label), get: (r) => r.placement },
            { label: 'Status', options: ['Active', 'Scheduled', 'Expired'], get: (r) => r.status },
          ]}
          columns={[
            { key: 'title', header: 'Banner', sortable: true, render: (r) => (
              <span className="hstack" style={{ gap: 10 }}>
                <span style={{ width: 44, height: 28, borderRadius: 6, background: r.imageUrl ? `center/cover url(${r.imageUrl})` : 'linear-gradient(135deg,#7c3aed,#ec4899)' }} />
                <b>{r.title}</b>
              </span>
            ) },
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

/* ------------------------------------------------------------------ Announcements */
export function Announcements() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listAnnouncements)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)

  const fields = [
    { name: 'title', label: 'Title', required: true },
    { name: 'audience', label: 'Audience', type: 'select', options: AUDIENCE_OPTS, required: true },
    { name: 'channel', label: 'Channel', type: 'select', options: CHANNEL_OPTS },
    { name: 'body', label: 'Message', type: 'textarea', full: true, required: true },
  ]

  return (
    <>
      <PageHeader title="Announcements" crumbs={[...CRUMBS, 'Announcements']}
        actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>New Announcement</Button>} />
      <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
        “Broadcast to users” fans the message out to an in-app notification for every profile in the chosen audience, then marks it sent.
      </div></Card>
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          searchKeys={['title', 'audience', 'idShort']}
          tabs={[
            { label: 'All', value: 'all', filter: () => true },
            { label: 'Draft', value: 'd', filter: (r) => r.status === 'Draft' },
            { label: 'Scheduled', value: 'sc', filter: (r) => r.status === 'Scheduled' },
            { label: 'Sent', value: 's', filter: (r) => r.status === 'Sent' },
          ]}
          columns={[
            { key: 'title', header: 'Announcement', sortable: true, render: (r) => <b>{r.title}</b> },
            { key: 'audience', header: 'Audience', render: (r) => <Tag>{r.audience}</Tag> },
            { key: 'channel', header: 'Channel' },
            { key: 'sent', header: 'Sent', sortable: true },
            statusCol(),
          ]}
          rowActions={(r) => [
            r.status !== 'Sent' ? { label: 'Edit', icon: 'edit', onClick: () => setEditing(r) } : { label: 'View', icon: 'eye', onClick: () => setEditing(r) },
            ...(r.status !== 'Sent' ? [{
              label: 'Broadcast to users', icon: 'bell', onClick: async () => {
                try {
                  const n = await broadcastAnnouncement(r)
                  toast(`Sent to ${n} ${n === 1 ? 'user' : 'users'}`)
                  reload()
                } catch (e) { toast(e.message || 'Broadcast failed') }
              },
            }] : []),
            ...(r.status === 'Draft' ? [{ label: 'Schedule', icon: 'calendar', onClick: async () => { await updateAnnouncement(r.id, { status: 'scheduled' }); toast('Scheduled'); reload() } }] : []),
            ...(r.status !== 'Sent' ? [{ label: 'Mark as sent (no push)', icon: 'check', onClick: async () => { await markAnnouncementSent(r.id); toast(`${r.title} marked sent`); reload() } }] : []),
          ]}
          emptyText="No announcements yet."
        />
      </AsyncView>
      {adding && (
        <EntityForm title="New Announcement" onClose={() => setAdding(false)} savedMessage="Announcement saved"
          onSubmit={async (v) => { await createAnnouncement(v); reload() }}
          initial={{ audience: 'all', channel: 'in_app' }} fields={fields} />
      )}
      {editing && (
        <EntityForm title={`Edit — ${editing.title}`} onClose={() => setEditing(null)} savedMessage="Announcement saved"
          onSubmit={async (v) => { await updateAnnouncement(editing.id, v); reload() }}
          initial={{ title: editing.title, audience: editing.audience.toLowerCase().replace(/ /g, '_'), channel: editing.channel.toLowerCase().replace(/ /g, '_'), body: editing.body }}
          fields={fields} />
      )}
    </>
  )
}

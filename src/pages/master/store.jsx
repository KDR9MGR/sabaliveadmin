import { useState } from 'react'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, StatusBadge, ConfirmDialog, useToast } from '../../components/ui.jsx'
import { statusCol, numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import MediaPreview from '../../components/MediaPreview.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { uploadMedia, UPLOAD_ACCEPT, UPLOAD_HINT, AUDIO_ACCEPT, AUDIO_HINT } from '../../lib/storage.js'
import { SPEED_FIELD, soundField, speedLabel } from '../../lib/effectFields.js'
import {
  STORE_CATEGORIES, STORE_STATUSES,
  listStoreItems, createStoreItem, updateStoreItem, deleteStoreItem, countOwners,
} from '../../lib/store.js'
import {
  EMOJI_KINDS, listLiveEmojis, createLiveEmoji, updateLiveEmoji, setLiveEmojiStatus, deleteLiveEmoji,
} from '../../lib/liveEmojis.js'

const STATUS_OPTS = STORE_STATUSES.map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))

/* ------------------------------------------------------------------ Store items (one page per category) */
export function StoreItems({ category }) {
  const meta = STORE_CATEGORIES[category]
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(() => listStoreItems(category), [category])
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null) // { row, owners }
  const [busy, setBusy] = useState(false)
  const list = rows || []

  // entry effects and vehicles are played on screen for the whole room: they get a speed and a sound
  const playsOnScreen = category === 'entry_effect' || category === 'vehicle'
  const fields = [
    { name: 'name', label: `${meta.singular} name`, required: true },
    { name: 'asset_url', label: 'Artwork / animation file', type: 'image', accept: UPLOAD_ACCEPT, full: true,
      onUpload: (file) => uploadMedia('gift-assets', `store/${category}`, file), hint: UPLOAD_HINT },
    ...(playsOnScreen ? [
      SPEED_FIELD,
      soundField((file) => uploadMedia('gift-assets', `store-sounds/${category}`, file), AUDIO_ACCEPT, AUDIO_HINT),
    ] : []),
    { name: 'emoji', label: 'Emoji (shown until the file loads, or if there is none)', placeholder: '🎁' },
    { name: 'price_coins', label: 'Price (coins)', type: 'number', required: true, hint: 'Must be greater than 0' },
    { name: 'duration_days', label: 'Lasts (days)', type: 'number', required: true, hint: 'How long a purchase lasts; buying again extends it' },
    { name: 'sort_order', label: 'Order in the Store', type: 'number', hint: 'Lower numbers show first' },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
  ]

  const askDelete = async (r) => {
    let owners = 0
    try { owners = await countOwners(r.id) } catch { /* count is only advice */ }
    setDeleting({ row: r, owners })
  }
  const doDelete = async () => {
    setBusy(true)
    try { await deleteStoreItem(deleting.row.id); toast(`${deleting.row.name} deleted`); setDeleting(null); reload() }
    catch (e) { toast(e.message || 'Delete failed') }
    finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title={`Store — ${meta.label}`} crumbs={['Home', 'Store', meta.label]}
        actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add {meta.singular}</Button>} />
      <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>{meta.blurb}</div></Card>
      <AsyncView loading={loading} error={error} reload={reload}>
        {list.length > 0 && (
          <div className="gallery" style={{ marginBottom: 20 }}>
            {list.map((g) => (
              <div className="gallery__item" key={g.id}>
                <div className="gallery__preview"><MediaPreview url={g.assetUrl} emoji={g.emoji} size={22} /></div>
                <div className="gallery__meta">
                  <div>
                    <div className="n">{g.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{g.price} coins · {g.days}d</div>
                  </div>
                  <StatusBadge value={g.status} />
                </div>
              </div>
            ))}
          </div>
        )}
        <DataTable
          rows={list}
          searchKeys={['name', 'idShort']}
          filters={[{ label: 'Status', options: ['Active', 'Inactive'], get: (r) => r.status }]}
          columns={[
            { key: 'name', header: meta.singular, sortable: true, render: (r) => <span className="hstack" style={{ gap: 10 }}><MediaPreview url={r.assetUrl} emoji={r.emoji} size={18} /><b>{r.name}</b></span> },
            numCol('price', 'Price (coins)'),
            numCol('days', 'Lasts (days)'),
            ...(playsOnScreen ? [{ key: 'playSpeed', header: 'Speed / sound', render: (r) => <span className="muted">{speedLabel(r.playSpeed)}{r.soundUrl ? ' · 🔊' : ''}</span> }] : []),
            numCol('sort', 'Order'),
            statusCol(),
          ]}
          rowActions={(r) => [
            { label: 'Edit', icon: 'edit', onClick: () => setEditing(r) },
            { label: r.status === 'Active' ? 'Disable' : 'Enable', icon: 'lock', onClick: async () => {
              try { await updateStoreItem(r.id, { status: r.status === 'Active' ? 'inactive' : 'active' }); toast('Updated'); reload() }
              catch (e) { toast(e.message || 'Update failed') }
            } },
            { sep: true },
            { label: 'Delete', icon: 'trash', onClick: () => askDelete(r) },
          ]}
          emptyText={`No ${meta.label.toLowerCase()} yet — add the first one.`}
        />
      </AsyncView>

      {adding && (
        <EntityForm title={`Add ${meta.singular}`} onClose={() => setAdding(false)} savedMessage={`${meta.singular} created`}
          onSubmit={async (v) => { await createStoreItem(category, v); reload() }}
          initial={{ status: 'active', duration_days: 30, sort_order: 0 }} fields={fields} />
      )}
      {editing && (
        <EntityForm title={`Edit — ${editing.name}`} onClose={() => setEditing(null)} savedMessage={`${meta.singular} updated`}
          onSubmit={async (v) => { await updateStoreItem(editing.id, v); reload() }}
          initial={{
            name: editing.name, emoji: editing.emoji, asset_url: editing.assetUrl || '', price_coins: editing.price,
            duration_days: editing.days, sort_order: editing.sort, status: editing.status.toLowerCase(),
            play_speed: editing.playSpeed ?? '', sound_url: editing.soundUrl || '',
          }}
          fields={fields} />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.row.name}?`}
          danger
          busy={busy}
          confirmLabel="Delete"
          message={deleting.owners > 0
            ? `${deleting.owners} user${deleting.owners === 1 ? ' still owns' : 's still own'} an active copy and would lose it. To just stop selling it, use Disable instead.`
            : 'No one currently owns it. This cannot be undone — to just stop selling it, use Disable instead.'}
          onConfirm={doDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ Live-chat emoji / GIF catalog */
export function LiveEmojis() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listLiveEmojis)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const list = rows || []

  const fields = [
    { name: 'kind', label: 'Type', type: 'select', required: true,
      options: Object.entries(EMOJI_KINDS).map(([value, label]) => ({ value, label })),
      hint: 'Emoji is typed into chat as text; GIF / animated is sent as its own picture.' },
    { name: 'label', label: 'Label', required: true, hint: 'Shown as the picture\'s caption if it can\'t load' },
    { name: 'emoji', label: 'Emoji character', placeholder: '😀', hint: 'Required for an emoji; optional stand-in for a GIF' },
    { name: 'asset_url', label: 'GIF / animation file', type: 'image', accept: UPLOAD_ACCEPT, full: true,
      onUpload: (file) => uploadMedia('gift-assets', 'emojis', file), hint: `${UPLOAD_HINT} — for a GIF / animated entry` },
    { name: 'sort_order', label: 'Order in the picker', type: 'number', hint: 'Lower numbers show first' },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
  ]

  const doDelete = async () => {
    setBusy(true)
    try { await deleteLiveEmoji(deleting.id); toast(`${deleting.label} deleted`); setDeleting(null); reload() }
    catch (e) { toast(e.message || 'Delete failed') }
    finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="Emoji & GIFs" crumbs={['Home', 'Content / Settings', 'Emoji & GIFs']}
        actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add Emoji / GIF</Button>} />
      <Card className="mb-16"><div className="card__body" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
        What users can pick from in the chat box of audio and video lives. Changes show up in the app the next time the picker is opened.
      </div></Card>
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={list}
          searchKeys={['label', 'emoji', 'idShort']}
          filters={[
            { label: 'Type', options: Object.values(EMOJI_KINDS), get: (r) => r.kindLabel },
            { label: 'Status', options: ['Active', 'Inactive'], get: (r) => r.status },
          ]}
          columns={[
            { key: 'label', header: 'Emoji / GIF', sortable: true, render: (r) => <span className="hstack" style={{ gap: 10 }}><MediaPreview url={r.assetUrl} emoji={r.emoji} size={18} /><b>{r.label}</b></span> },
            { key: 'kindLabel', header: 'Type' },
            numCol('sort', 'Order'),
            statusCol(),
          ]}
          rowActions={(r) => [
            { label: 'Edit', icon: 'edit', onClick: () => setEditing(r) },
            { label: r.status === 'Active' ? 'Disable' : 'Enable', icon: 'lock', onClick: async () => {
              try { await setLiveEmojiStatus(r.id, r.status === 'Active' ? 'inactive' : 'active'); toast('Updated'); reload() }
              catch (e) { toast(e.message || 'Update failed') }
            } },
            { sep: true },
            { label: 'Delete', icon: 'trash', onClick: () => setDeleting(r) },
          ]}
          emptyText="Nothing here — the app's emoji picker will be empty until you add some."
        />
      </AsyncView>

      {adding && (
        <EntityForm title="Add Emoji / GIF" onClose={() => setAdding(false)} savedMessage="Added"
          onSubmit={async (v) => { await createLiveEmoji(v); reload() }}
          initial={{ kind: 'emoji', status: 'active', sort_order: 0 }} fields={fields} />
      )}
      {editing && (
        <EntityForm title={`Edit — ${editing.label}`} onClose={() => setEditing(null)} savedMessage="Updated"
          onSubmit={async (v) => { await updateLiveEmoji(editing.id, v); reload() }}
          initial={{
            kind: editing.kind, label: editing.label, emoji: editing.emoji || '', asset_url: editing.assetUrl || '',
            sort_order: editing.sort, status: editing.status.toLowerCase(),
          }}
          fields={fields} />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.label}?`}
          danger
          busy={busy}
          confirmLabel="Delete"
          message="It disappears from the picker. Messages already sent keep showing. To hide it for now, use Disable instead."
          onConfirm={doDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

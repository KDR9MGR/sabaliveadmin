import { useEffect, useState } from 'react'
import { uploadMedia } from '../../lib/storage.js'
import SvgaPlayer from '../../components/SvgaPlayer.jsx'
import SvgPreview from '../../components/SvgPreview.jsx'
import { isSvg } from '../../lib/mediaTypes.js'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, Drawer, ConfirmDialog, EmptyState, useToast } from '../../components/ui.jsx'
import DataTable from '../../components/DataTable.jsx'
import { numCol, statusCol } from '../../components/cells.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { listTags, saveTag, deleteTag, getUserTagIds, setUserTags, searchUsers, setHostAutoTag, giveHostTagToCurrentHosts } from '../../lib/profileTagsApi.js'
import { checkTag, tagTextColor, toggleTag, sameTags, isSvga, nameIsWritten, TAG_DEFAULT_COLOR, TAG_STATUSES, TAG_LOOKS, TAG_IMAGE_ACCEPT, TAG_NAME_MAX, MAX_TAGS_PER_USER } from '../../lib/profileTags.js'
import { normalizeHex } from '../../lib/pkTheme.js'

/* Master -> Tags: the staff tags that show on a user's profile in the app. Two parts: the list of tags (create, edit, hide, delete) and
   "Give tags to a user" (find a user, tick the tags they should have). Master and Super Admin have it by default; any other staff account
   needs the Tags switch in Access Control. The database (sabalive migration 20261021190000) enforces all of it. */

/* The artwork of a tag at the tag height and its own proportions: an SVGA animation, an SVG drawing or a picture. `fallback` stands in while it loads and if it fails. */
function TagArtwork({ url, fallback, onFail }) {
  if (isSvga(url)) return <SvgaPlayer url={url} size={28} autoWidth fallback={fallback} />
  if (isSvg(url)) return <SvgPreview url={url} style={{ height: 28, maxWidth: 220, objectFit: 'contain' }} fallback={fallback} />
  return <img src={url} alt="" onError={onFail} style={{ height: 28, maxWidth: 220, objectFit: 'contain' }} />
}

/* One tag as the app draws it: a coloured pill, a picture shown as it is, or a background picture with the name on it. A picture that cannot be
   loaded falls back to the pill, as in the app. A plate is as big as its artwork (the whole picture, never cropped) with the name centred on it,
   and a name with no letter or digit (".") is not written at all: the artwork carries its own text. */
export function TagPill({ tag, dim }) {
  const [failed, setFailed] = useState(false)
  const color = normalizeHex(tag.color) || TAG_DEFAULT_COLOR
  const label = tag.emoji ? `${tag.emoji} ${tag.name}` : tag.name
  const opacity = dim ? 0.45 : 1
  const url = tag.image_url
  const written = nameIsWritten(tag.name)
  const look = tag.look === 'plate' && !written ? 'picture' : tag.look
  const pill = <TagPill tag={{ ...tag, look: 'pill' }} />
  if (look === 'picture' && url && (isSvga(url) || isSvg(url))) {
    return <span title={tag.name} style={{ display: 'inline-flex', opacity, verticalAlign: 'middle' }}><TagArtwork url={url} fallback={pill} /></span>
  }
  if (look === 'picture' && url && !failed) {
    return <img src={url} alt={tag.name} title={tag.name} onError={() => setFailed(true)} style={{ height: 28, maxWidth: 220, objectFit: 'contain', opacity, verticalAlign: 'middle' }} />
  }
  if (look === 'plate' && url && !failed) {
    // artwork and name share one grid cell: the plate is as big as the artwork, or as the name if that is wider
    return (
      <span title={tag.name} style={{ display: 'inline-grid', verticalAlign: 'middle', opacity }}>
        <span style={{ gridArea: '1 / 1', display: 'inline-flex' }}><TagArtwork url={url} fallback={pill} onFail={() => setFailed(true)} /></span>
        <span style={{ gridArea: '1 / 1', alignSelf: 'center', justifySelf: 'center', padding: '0 10px', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap',
          color: tagTextColor(tag), textShadow: '0 1px 2px rgba(0,0,0,.55)' }}>{label}</span>
      </span>
    )
  }
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
        background: color, color: tagTextColor({ ...tag, look: 'pill' }), opacity, whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

/* Upload a tag picture; the file goes to the same public storage as the badge and gift pictures. */
function PictureField({ value, onChange }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true); setError('')
    try { onChange(await uploadMedia('gift-assets', 'tags', file)) } catch (err) { setError(err?.message || 'Upload failed') } finally { setBusy(false) }
  }
  return (
    <div className="field full">
      <label>Picture <span className="req">*</span></label>
      {value && (
        <div style={{ padding: '8px 0' }}>
          {isSvga(value)
            ? <SvgaPlayer url={value} size={72} />
            : isSvg(value)
              ? <SvgPreview url={value} style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain', background: 'rgba(127,127,127,.15)', borderRadius: 8, padding: 6 }} />
              : <img src={value} alt="" style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain', background: 'rgba(127,127,127,.15)', borderRadius: 8, padding: 6 }} />}
        </div>
      )}
      <label className="btn" style={{ cursor: busy ? 'default' : 'pointer', textAlign: 'center' }}>
        {busy ? 'Uploading…' : value ? 'Replace picture' : 'Upload picture'}
        <input type="file" accept={TAG_IMAGE_ACCEPT} onChange={pick} disabled={busy} style={{ display: 'none' }} />
      </label>
      <span className="hint">PNG, WebP, GIF, SVG drawing or SVGA animation, wide and short (about 4 to 1, at least 300 px wide), on a transparent background. It is shown about 28 px tall; an SVGA keeps its own proportions and loops.</span>
      {error && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</span>}
    </div>
  )
}

function ColorField({ value, onChange }) {
  const ok = !!normalizeHex(value)
  return (
    <div className="field">
      <label>Colour <span className="req">*</span></label>
      <div className="hstack" style={{ gap: 10 }}>
        <input type="color" className="color-input" value={normalizeHex(value) || TAG_DEFAULT_COLOR} onChange={(e) => onChange(e.target.value)} />
        <input className="input" style={{ width: 130 }} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#7c3aed" />
      </div>
      <span className="hint" style={ok ? undefined : { color: 'var(--danger, #e5484d)' }}>
        {ok ? 'The text on the tag turns white or dark by itself so it stays readable.' : 'Not a colour yet: use six hex digits like #7c3aed.'}
      </span>
    </div>
  )
}

export function TagForm({ tag, onClose, onSaved }) {
  const [v, setV] = useState(() => ({
    name: tag?.name || '', emoji: tag?.emoji || '', color: tag?.color || TAG_DEFAULT_COLOR,
    status: tag?.status || 'active', sort_order: tag?.sort_order ?? 0,
    look: tag?.look || 'pill', image_url: tag?.image_url || '', text_color: tag?.text_color || '',
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  const set = (k, val) => setV((s) => ({ ...s, [k]: val }))
  const checked = checkTag(v)

  const submit = async () => {
    setError('')
    if (checked.error) { setError(checked.error); return }
    setBusy(true)
    try {
      await saveTag(tag?.id, v)
      toast(tag ? 'Tag updated' : 'Tag created')
      onSaved()
      onClose()
    } catch (e) {
      setError(e?.message || 'Could not save the tag')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      title={tag ? `Edit — ${tag.name}` : 'Add Tag'}
      onClose={onClose}
      footer={<>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="primary" icon={busy ? 'refresh' : 'check'} onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
      </>}
    >
      {error && <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 14 }}>{error}</div>}
      <div className="field">
        <label>How it looks on a profile</label>
        <div style={{ padding: '10px 0' }}>
          <TagPill key={`${v.look}-${v.image_url}`} tag={{ name: v.name.trim() || 'Tag name', emoji: v.emoji.trim(), color: v.color, look: v.look, image_url: v.image_url, text_color: v.text_color }} />
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label>Name <span className="req">*</span></label>
          <input className="input" value={v.name} maxLength={TAG_NAME_MAX * 2} onChange={(e) => set('name', e.target.value)} placeholder="Official" />
          <span className="hint">Up to {TAG_NAME_MAX} characters.</span>
        </div>
        <div className="field">
          <label>Emoji (optional)</label>
          <input className="input" value={v.emoji} onChange={(e) => set('emoji', e.target.value)} placeholder="✔️" />
        </div>
        <div className="field full">
          <label>Look</label>
          <select className="select" value={v.look} onChange={(e) => set('look', e.target.value)}>
            {TAG_LOOKS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <span className="hint">
            {v.look === 'picture' ? 'Design the whole banner (crest, colours and the words) and upload it. The app shows it as it is.'
              : v.look === 'plate' ? 'Upload a plain background. The app writes the tag name on it, so one plate can serve many tags.'
                : 'The name on a solid colour: nothing to upload.'}
          </span>
        </div>
        {v.look !== 'pill' && <PictureField value={v.image_url} onChange={(u) => set('image_url', u)} />}
        {v.look !== 'picture' && <ColorField value={v.color} onChange={(c) => set('color', c)} />}
        {v.look !== 'picture' && (
          <div className="field">
            <label>Text colour (optional)</label>
            <input className="input" style={{ width: 130 }} value={v.text_color} onChange={(e) => set('text_color', e.target.value)} placeholder="#ffffff" />
            <span className="hint">Empty = white on a plate, or readable on the colour for a pill.</span>
          </div>
        )}
        <div className="field">
          <label>Order</label>
          <input className="input" type="number" step="1" value={v.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
          <span className="hint">Smaller numbers show first on a profile.</span>
        </div>
        <div className="field full">
          <label>Status</label>
          <select className="select" value={v.status} onChange={(e) => set('status', e.target.value)}>
            {TAG_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <span className="hint">An inactive tag is hidden from profiles and cannot be given to anyone new.</span>
        </div>
      </div>
    </Drawer>
  )
}

/* Find a user, tick the tags they should have, save. */
export function GiveTags({ tags, onChanged }) {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [found, setFound] = useState([])
  const [searching, setSearching] = useState(false)
  const [user, setUser] = useState(null)
  const [had, setHad] = useState([])
  const [ticked, setTicked] = useState([])
  const [loadingUser, setLoadingUser] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (q.trim().length < 2) { setFound([]); return undefined }
    let live = true
    setSearching(true)
    const t = setTimeout(() => {
      searchUsers(q).then((r) => { if (live) setFound(r) }).catch(() => { if (live) setFound([]) }).finally(() => { if (live) setSearching(false) })
    }, 300)
    return () => { live = false; clearTimeout(t) }
  }, [q])

  const pick = async (u) => {
    setUser(u); setFound([]); setQ(''); setError(''); setLoadingUser(true)
    try {
      const ids = await getUserTagIds(u.id)
      setHad(ids); setTicked(ids)
    } catch (e) {
      setError(e?.message || 'Could not read this user\'s tags'); setHad([]); setTicked([])
    } finally {
      setLoadingUser(false)
    }
  }

  const tick = (id) => {
    const next = toggleTag(ticked, id)
    if (next === null) { setError(`A user can have at most ${MAX_TAGS_PER_USER} tags.`); return }
    setError(''); setTicked(next)
  }

  const save = async () => {
    setBusy(true); setError('')
    try {
      await setUserTags(user.id, ticked)
      setHad(ticked)
      toast(`Tags saved for ${user.name}`)
      onChanged()
    } catch (e) {
      setError(e?.message || 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  // an inactive tag the user already has stays visible so it can be taken off; inactive tags they do not have cannot be given
  const choices = tags.filter((t) => t.status === 'active' || had.includes(t.id))
  const changed = user && !sameTags(had, ticked)

  return (
    <Card title="Give tags to a user" sub="Find the person, tick the tags they should have, save. Unticking a tag takes it off them.">
      <div className="pos-rel" style={{ maxWidth: 460 }}>
        <input className="input" placeholder="Search by name, @username or app ID…" value={q} onChange={(e) => setQ(e.target.value)} />
        {(found.length > 0 || (searching && q.trim().length >= 2)) && (
          <div className="menu-pop" style={{ left: 0, right: 'auto', width: '100%', maxHeight: 280, overflowY: 'auto' }}>
            {searching && found.length === 0 && <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-muted)' }}>Searching…</div>}
            {found.map((u) => (
              <button key={u.id} type="button" onClick={() => pick(u)}>{u.name} (@{u.username}) · ID {u.displayId}</button>
            ))}
          </div>
        )}
      </div>

      {user && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{user.name} <span className="muted" style={{ fontWeight: 400 }}>@{user.username} · ID {user.displayId}</span></div>
          {loadingUser ? <div className="muted">Loading…</div> : choices.length === 0 ? (
            <div className="muted">There are no tags to give yet. Add one above first.</div>
          ) : (
            <div className="vstack" style={{ gap: 8 }}>
              {choices.map((t) => (
                <label key={t.id} className="hstack" style={{ gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={ticked.includes(t.id)} onChange={() => tick(t.id)} />
                  <TagPill tag={t} dim={t.status !== 'active'} />
                  {t.status !== 'active' && <span className="muted" style={{ fontSize: 12 }}>inactive: can only be taken off</span>}
                </label>
              ))}
            </div>
          )}
          {error && <div className="badge badge--danger" style={{ marginTop: 12 }}>{error}</div>}
          <div className="hstack" style={{ gap: 10, marginTop: 14 }}>
            <Button variant="primary" icon={busy ? 'refresh' : 'check'} onClick={save} disabled={busy || loadingUser || !changed}>{busy ? 'Saving…' : 'Save tags'}</Button>
            <span className="muted" style={{ fontSize: 12.5 }}>{ticked.length} of {MAX_TAGS_PER_USER} tags</span>
          </div>
        </div>
      )}
    </Card>
  )
}

export function Tags() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(listTags)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const rows = (data?.tags || []).map((t) => ({ ...t, label: t.name, statusLabel: t.status === 'active' ? 'Active' : 'Inactive' }))

  const remove = async () => {
    setBusy(true)
    try {
      const n = await deleteTag(deleting.id)
      toast(n > 0 ? `"${deleting.name}" deleted and taken off ${n} user${n === 1 ? '' : 's'}` : `"${deleting.name}" deleted`)
      setDeleting(null)
      reload()
    } catch (e) {
      toast(e?.message || 'Could not delete the tag')
    } finally {
      setBusy(false)
    }
  }

  const toggleHostTag = async (r) => {
    try {
      await setHostAutoTag(r.id, !r.autoForHosts)
      toast(r.autoForHosts ? `"${r.name}" will no longer be given to new hosts` : `"${r.name}" is now given to every new host automatically`)
      reload()
    } catch (e) { toast(e?.message || 'Could not change it') }
  }
  const giveCurrentHosts = async (r) => {
    try {
      const n = await giveHostTagToCurrentHosts()
      toast(n > 0 ? `"${r.name}" added to ${n} host${n === 1 ? '' : 's'}` : 'Every current host already has it')
      reload()
    } catch (e) { toast(e?.message || 'Could not add it') }
  }

  return (
    <>
      <PageHeader
        title="Tags"
        crumbs={['Home', 'Platform', 'Tags']}
        actions={data?.available !== false && <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add Tag</Button>}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        {data?.available === false ? (
          <Card><EmptyState icon="tag" title="Tags are not installed on this project yet" text="They need the database update 20261021190000. Once it is applied this page works." /></Card>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <DataTable
                rows={rows}
                searchKeys={['name']}
                filters={[{ label: 'Status', options: ['Active', 'Inactive'], get: (r) => r.statusLabel }]}
                columns={[
                  { key: 'label', header: 'Tag', sortable: true, render: (r) => (
                    <span className="hstack" style={{ gap: 8 }}>
                      <TagPill tag={r} dim={r.status !== 'active'} />
                      {r.autoForHosts && <span className="muted" style={{ fontSize: 11 }} title="Given automatically to every host the moment an agency accepts them">Auto · new hosts</span>}
                    </span>
                  ) },
                  numCol('users', 'Users'),
                  numCol('sort_order', 'Order'),
                  statusCol('statusLabel'),
                ]}
                rowActions={(r) => [
                  { label: 'Edit', icon: 'edit', onClick: () => setEditing(r) },
                  { label: r.autoForHosts ? 'Stop giving to new hosts' : 'Give to every new host automatically', icon: 'userPlus', onClick: () => toggleHostTag(r) },
                  ...(r.autoForHosts ? [{ label: 'Add to hosts that already exist', icon: 'users', onClick: () => giveCurrentHosts(r) }] : []),
                  { label: 'Delete', icon: 'trash', onClick: () => setDeleting(r) },
                ]}
                emptyText="No tags yet. Add the first one."
              />
            </div>
            <GiveTags tags={data?.tags || []} onChanged={reload} />
          </>
        )}
      </AsyncView>
      {adding && <TagForm onClose={() => setAdding(false)} onSaved={reload} />}
      {editing && <TagForm tag={editing} onClose={() => setEditing(null)} onSaved={reload} />}
      {deleting && (
        <ConfirmDialog
          title={`Delete "${deleting.name}"?`}
          message={deleting.users > 0
            ? `It will be taken off ${deleting.users} user${deleting.users === 1 ? '' : 's'} and disappear from their profiles. This cannot be undone. To hide it without losing who has it, set it to Inactive instead.`
            : 'Nobody has this tag. This cannot be undone.'}
          confirmLabel="Delete tag"
          danger
          busy={busy}
          onConfirm={remove}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

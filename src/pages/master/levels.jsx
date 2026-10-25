import { useState } from 'react'
import { PageHeader, Card, Button, PillTabs, ConfirmDialog, useToast } from '../../components/ui.jsx'
import DataTable from '../../components/DataTable.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import MediaPreview from '../../components/MediaPreview.jsx'
import Icon from '../../components/Icon.jsx'
import { AsyncView } from '../_templates.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { listTrackLevels, saveTrackLevel, deleteTrackLevel } from '../../lib/levels.js'
import { checkXp, orderNote, MAX_XP } from '../../lib/levelRules.js'
import { uploadMedia, UPLOAD_ACCEPT, UPLOAD_HINT } from '../../lib/storage.js'

const TABS = ['Wealth', 'Charm']
const num = (n) => Number(n || 0).toLocaleString()

/* Master → Platform → Levels. Wealth (coins spent) and Charm (value received) are
   separate tracks: for each level, how much XP it needs and the image shown in the
   live room when someone who has reached it joins. */
export function Levels() {
  const toast = useToast()
  const [tab, setTab] = useState('Wealth')
  const track = tab.toLowerCase()
  const { data: rows, loading, error, reload } = useAsyncData(() => listTrackLevels(track), [track])
  const [editing, setEditing] = useState(null) // a row, or { add: true }
  const [draftXp, setDraftXp] = useState('') // what is typed in the XP box now, for the heads-up about the neighbours
  const [removing, setRemoving] = useState(null)
  const [busy, setBusy] = useState(false)

  const last = rows?.[rows.length - 1]
  const open = (row) => { setDraftXp(row.xp); setEditing(row) }
  const startAdd = () => open({ add: true, level: (last?.level || 0) + 1, xp: Math.min(MAX_XP, (last?.xp || 0) + (last?.step > 0 ? last.step : 500)), image: '' })
  // a heads-up (never a block) when the typed number is outside the levels around it
  const note = editing ? orderNote(rows, editing.level, draftXp) : ''

  const remove = async () => {
    setBusy(true)
    try { await deleteTrackLevel(track, removing.level); toast(`Level ${removing.level} removed`); setRemoving(null); reload() }
    catch (e) { toast(e.message || 'Could not remove the level') }
    finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader
        title="Levels"
        crumbs={['Home', 'Platform', 'Levels']}
        actions={<>
          <PillTabs tabs={TABS} value={tab} onChange={setTab} />
          <Button variant="primary" icon="plus" onClick={startAdd}>Add level</Button>
        </>}
      />
      <Card>
        <div className="card__body hstack" style={{ gap: 10, fontSize: 13 }}>
          <Icon name="award" size={18} />
          <span className="muted">
            {tab === 'Wealth'
              ? 'Wealth levels go up as a user spends coins on gifts.'
              : 'Charm levels go up as a user receives gifts.'}{' '}
            Set the XP each level needs. Every level takes exactly the number you type, whatever the levels before and after it need: a person is at the
            highest level whose XP they have reached. Add a level image and it plays full-screen in a live room when someone
            who has reached that level (the highest level with an image) joins. A still picture, GIF or WebP also replaces the level star
            for people at exactly that level, on profiles, in live chat and in the join notice (so it should carry the level number itself); an
            animated file (SVGA, MP4) keeps the star there. A level with no image keeps the star. XP changes re-level every user straight away.
          </span>
        </div>
      </Card>
      <div style={{ height: 16 }} />
      <AsyncView loading={loading && !rows} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          pageSize={12}
          searchKeys={['level']}
          columns={[
            { key: 'level', header: 'Level', sortable: true, render: (r) => <b>Lv. {r.level}</b> },
            { key: 'xp', header: 'Total XP needed', sortable: true, render: (r) => num(r.xp) },
            { key: 'step', header: 'XP from previous level', render: (r) => (r.level === 1 ? <span className="muted">—</span> : r.step >= 0 ? `+${num(r.step)}` : <span className="muted" title="Lower than the level before it">−{num(-r.step)}</span>) },
            { key: 'image', header: 'Join image', render: (r) => (r.image ? <MediaPreview url={r.image} size={18} /> : <span className="muted">None</span>) },
          ]}
          rowActions={(r) => [
            { label: 'Edit XP / image', icon: 'edit', onClick: () => open(r) },
            ...(r.level === last?.level && r.level > 1 ? [{ label: 'Remove level', icon: 'trash', onClick: () => setRemoving(r) }] : []),
          ]}
          emptyText="No levels yet."
        />
      </AsyncView>
      {editing && (
        <EntityForm
          title={editing.add ? `Add ${tab} level ${editing.level}` : `${tab} level ${editing.level}`}
          initial={{ xp: editing.xp, image: editing.image }}
          savedMessage="Level saved"
          fields={[
            { name: 'xp', label: 'Total XP needed to reach this level', type: 'number', required: true, full: true, min: 0, max: MAX_XP, step: 1,
              hint: editing.level === 1
                ? 'Level 1 always starts at 0.'
                : `Any whole number up to ${num(MAX_XP)}. It does not have to be above the previous level or below the next one.` },
            ...(note ? [{ name: 'orderNote', type: 'section', label: 'Heads-up', hint: note }] : []),
            { name: 'image', label: 'Level image (optional)', type: 'image', accept: UPLOAD_ACCEPT, full: true,
              onUpload: (file) => uploadMedia('gift-assets', 'levels', file),
              hint: `${UPLOAD_HINT}. Plays full-screen when someone at this level joins a live. A PNG, GIF or WebP (not SVGA / MP4) is also shown small in place of the level star, so the picture should include the level number.` },
          ]}
          onChange={(name, val) => { if (name === 'xp') setDraftXp(val) }}
          onClose={() => setEditing(null)}
          onSubmit={async (v) => {
            const checked = checkXp(editing.level, v.xp)
            if (checked.error) throw new Error(checked.error)
            await saveTrackLevel(track, { level: editing.level, xp: checked.xp, image: v.image })
            reload()
          }}
        />
      )}
      {removing && (
        <ConfirmDialog
          danger busy={busy}
          title={`Remove level ${removing.level}?`}
          message={`Anyone at ${tab} level ${removing.level} drops to level ${removing.level - 1}.`}
          confirmLabel="Remove"
          onConfirm={remove}
          onClose={() => setRemoving(null)}
        />
      )}
    </>
  )
}

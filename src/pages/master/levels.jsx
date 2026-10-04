import { useState } from 'react'
import { PageHeader, Card, Button, PillTabs, ConfirmDialog, useToast } from '../../components/ui.jsx'
import DataTable from '../../components/DataTable.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import MediaPreview from '../../components/MediaPreview.jsx'
import Icon from '../../components/Icon.jsx'
import { AsyncView } from '../_templates.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { listTrackLevels, saveTrackLevel, deleteTrackLevel } from '../../lib/levels.js'
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
  const [removing, setRemoving] = useState(null)
  const [busy, setBusy] = useState(false)

  const last = rows?.[rows.length - 1]
  const startAdd = () => setEditing({ add: true, level: (last?.level || 0) + 1, xp: (last?.xp || 0) + (last?.step || 500), image: '' })

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
            Set the XP each level needs. Add a level image and it plays full-screen in a live room when someone
            who has reached that level (the highest level with an image) joins. XP changes re-level every user straight away.
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
            { key: 'step', header: 'XP from previous level', render: (r) => (r.level === 1 ? <span className="muted">—</span> : `+${num(r.step)}`) },
            { key: 'image', header: 'Join image', render: (r) => (r.image ? <MediaPreview url={r.image} size={18} /> : <span className="muted">None</span>) },
          ]}
          rowActions={(r) => [
            { label: 'Edit XP / image', icon: 'edit', onClick: () => setEditing(r) },
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
            { name: 'xp', label: 'Total XP needed to reach this level', type: 'number', required: true, full: true,
              hint: editing.level === 1 ? 'Level 1 always starts at 0.' : 'Must be more than the previous level and less than the next.' },
            { name: 'image', label: 'Join image / animation (optional)', type: 'image', accept: UPLOAD_ACCEPT, full: true,
              onUpload: (file) => uploadMedia('gift-assets', 'levels', file), hint: UPLOAD_HINT },
          ]}
          onClose={() => setEditing(null)}
          onSubmit={async (v) => { await saveTrackLevel(track, { level: editing.level, xp: v.xp, image: v.image }); reload() }}
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

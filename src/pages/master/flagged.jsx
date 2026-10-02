import { useNavigate } from 'react-router-dom'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Tag, Badge, useToast } from '../../components/ui.jsx'
import { personCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { listPersonalInfoFlags, setFlagStatus, FLAG_SOURCES } from '../../lib/moderation.js'

const TONE = { new: 'danger', reviewed: 'muted', actioned: 'success' }

/* Messages where someone shared a phone number, e-mail or similar. The app
   shows other users a masked version; the original, the sender and the host
   (or the person they were messaging) come here. */
export function FlaggedMessages() {
  const toast = useToast()
  const nav = useNavigate()
  const { data: rows, loading, error, reload } = useAsyncData(listPersonalInfoFlags)

  const mark = async (r, status) => {
    try {
      await setFlagStatus(r.id, status)
      toast(status === 'new' ? 'Marked as new' : `Marked ${status}`)
      reload()
    } catch (e) { toast(e.message || 'Could not update') }
  }

  return (
    <>
      <PageHeader title="Flagged Messages" crumbs={['Home', 'User Management', 'Flagged Messages']} />
      <AsyncView loading={loading} error={error} reload={reload}>
        <DataTable
          rows={rows || []}
          pageSize={10}
          searchKeys={['sender', 'senderUsername', 'host', 'recipient', 'original', 'idShort']}
          emptyText="Nothing flagged — no one has shared personal details in chat."
          tabs={[
            { label: 'New', value: 'new', filter: (r) => r.status === 'new' },
            { label: 'All', value: 'all', filter: () => true },
            { label: 'Reviewed', value: 'rev', filter: (r) => r.status !== 'new' },
          ]}
          filters={[
            { label: 'Source', options: Object.values(FLAG_SOURCES), get: (r) => r.source },
          ]}
          columns={[
            { key: 'idShort', header: 'Ref', render: (r) => <span className="mono muted">{r.idShort}</span> },
            { ...personCol('sender', 'senderUsername'), header: 'Sent by' },
            { key: 'source', header: 'Where', render: (r) => (
              <div>
                <Tag>{r.source}</Tag>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {r.sourceKey === 'live_chat' ? 'Host: ' : 'To: '}{r.where}
                </div>
              </div>
            ) },
            { key: 'kindLabels', header: 'Detected', render: (r) => (
              <span className="hstack" style={{ gap: 4, flexWrap: 'wrap' }}>{r.kindLabels.map((k) => <Tag key={k}>{k}</Tag>)}</span>
            ) },
            { key: 'original', header: 'Original message', render: (r) => (
              <div style={{ maxWidth: 320 }}>
                <div style={{ wordBreak: 'break-word' }}>{r.original}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2, wordBreak: 'break-word' }}>Shown as: {r.masked}</div>
              </div>
            ) },
            { key: 'at', header: 'When', sortable: true, render: (r) => <span title={r.date}>{r.when}</span> },
            { key: 'statusLabel', header: 'Status', render: (r) => <Badge tone={TONE[r.status] || 'muted'}>{r.statusLabel}</Badge> },
          ]}
          rowActions={(r) => [
            { label: 'View sender', icon: 'user', onClick: () => nav(`/admin/users/${r.senderId}`) },
            ...(r.hostId ? [{ label: 'View host', icon: 'video', onClick: () => nav(`/admin/users/${r.hostId}`) }] : []),
            ...(r.status === 'new'
              ? [{ label: 'Mark reviewed', icon: 'check', onClick: () => mark(r, 'reviewed') },
                 { label: 'Mark actioned', icon: 'checkCircle', onClick: () => mark(r, 'actioned') }]
              : [{ label: 'Reopen', icon: 'refresh', onClick: () => mark(r, 'new') }]),
          ]}
        />
      </AsyncView>
    </>
  )
}

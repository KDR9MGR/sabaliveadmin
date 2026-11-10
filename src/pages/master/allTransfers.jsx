import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Button, Person, Tag } from '../../components/ui.jsx'
import { numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import ExportButtons from '../../components/ExportButtons.jsx'
import PullBackTransferDialog from '../../components/PullBackTransferDialog.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { useAuth } from '../../lib/auth.jsx'
import { exportRows } from '../../lib/export.js'
import { canPullBackTransfer } from '../../lib/pullBackRules.js'
import { listAllCoinMovements } from '../../lib/allTransfers.js'
import { canSeeAllTransfers, summarize, roleOptions, exportColumns, KINDS } from '../../lib/allTransfersRules.js'

const fmt = (v) => Number(v || 0).toLocaleString('en-US')

const side = (name, id, role) => (r) => (
  <div>
    <Person name={r[name]} meta={r[id] ? `ID ${r[id]}` : undefined} size="sm" />
    <div style={{ marginTop: 2 }}><Tag>{r[role]}</Tag></div>
  </div>
)

/* Master / Super Admin -> All Coin Transfers: every wallet transfer and direct grant between ALL panels (Super Admin / Master -> Global -> Country -> Sub Admin -> Agency -> users),
   newest first, with search, filters, Excel / CSV export and (for a wallet transfer) Pull back. Master and Super Admin only; a lower role is sent back to its own panel. */
export function AllCoinTransfers({ root = 'Monetisation' }) {
  const { staffRole, user, can } = useAuth()
  const res = useAsyncData(listAllCoinMovements)
  const [pulling, setPulling] = useState(null)
  const role = staffRole?.role
  if (!canSeeAllTransfers(role)) return <Navigate to="/" replace />

  const rows = res.data || []
  const sum = summarize(rows)
  const mayPull = (r) => canPullBackTransfer({ row: r, me: user?.id, role, can })

  return (
    <>
      <PageHeader
        title="All Coin Transfers"
        crumbs={['Home', root, 'All Coin Transfers']}
        actions={<Button icon="refresh" disabled={res.loading} onClick={res.reload}>Refresh</Button>}
      />
      {pulling && <PullBackTransferDialog row={pulling} onClose={() => setPulling(null)} onDone={res.reload} />}
      <div className="muted mb-16" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
        Every coin movement between panels in one list: wallet transfers (Global → Country → Sub Admin → Agency → users) and direct grants. Only a Master or Super Admin sees this page.
        Coins of a transfer that was pulled back are not counted as moved.
      </div>
      <AsyncView loading={res.loading} error={res.error} reload={res.reload}>
        <div className="grid cols-3 mb-16">
          <div className="stat"><div className="stat__label">Movements</div><div className="stat__value">{fmt(sum.count)}</div></div>
          <div className="stat"><div className="stat__label">Coins moved</div><div className="stat__value">{fmt(sum.coins)}</div></div>
          <div className="stat"><div className="stat__label">Pulled back</div><div className="stat__value">{fmt(sum.pulledBack)}</div></div>
        </div>
        <DataTable
          rows={rows}
          pageSize={25}
          searchKeys={['from', 'fromId', 'to', 'toId', 'toUsername', 'note', 'idShort']}
          searchPlaceholder="Search a name, User ID or note…"
          filters={[
            { label: 'Type', options: KINDS, get: (r) => r.kind },
            { label: 'From role', options: roleOptions(rows, 'fromRole'), get: (r) => r.fromRole },
            { label: 'To role', options: roleOptions(rows, 'toRole'), get: (r) => r.toRole },
            { label: 'Status', options: ['Done', 'Pulled back'], get: (r) => r.status },
          ]}
          toolbarRight={(
            <ExportButtons
              show={can('export_data')}
              disabled={!rows.length}
              onExport={(f) => exportRows(f, `all-coin-transfers-${new Date().toISOString().slice(0, 10)}`, exportColumns(), rows, 'Coin transfers')}
            />
          )}
          columns={[
            { key: 'ts', header: 'Date', sortable: true, render: (r) => <span className="muted" style={{ whiteSpace: 'nowrap' }}>{r.date}</span> },
            { key: 'kind', header: 'Type', sortable: true, render: (r) => <Tag>{r.kind}</Tag> },
            { key: 'from', header: 'From', sortable: true, render: side('from', 'fromId', 'fromRole') },
            { key: 'to', header: 'To', sortable: true, render: side('to', 'toId', 'toRole') },
            numCol('coins', 'Coins'),
            { key: 'status', header: 'Status', sortable: true, render: (r) => (r.pulledBack ? <Tag>Pulled back</Tag> : <span className="muted">Done</span>) },
            { key: 'note', header: 'Note' },
            { key: 'idShort', header: 'Ref', render: (r) => <span className="mono muted">{r.idShort}</span> },
          ]}
          rowActions={(r) => (r.transferId && mayPull(r)
            ? [{ label: 'Pull back transfer', icon: 'lock', onClick: () => setPulling(r) }]
            : [])}
          emptyText="No coin movements yet."
        />
      </AsyncView>
    </>
  )
}

import { PageHeader, Button, Tag, useToast } from '../../components/ui.jsx'
import { personCol, statusCol, numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import { StatGrid, AsyncView } from '../_templates.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { listWithdrawals, decideWithdrawal } from '../../lib/workflows.js'

export function Withdrawals() {
  const toast = useToast()
  const { data: rows, loading, error, reload } = useAsyncData(listWithdrawals)
  const list = rows || []

  const decide = async (r, approve) => {
    try {
      await decideWithdrawal(r.id, approve)
      toast(`${r.payee} — ${approve ? 'paid' : 'rejected & refunded'}`)
      reload()
    } catch (e) {
      toast(e.message || 'Could not process withdrawal')
    }
  }

  const sum = (pred) => list.filter(pred).reduce((s, r) => s + (r.diamonds || 0), 0)

  return (
    <>
      <PageHeader title="Withdrawals" crumbs={['Home', 'Monetisation', 'Withdrawals']} />
      <AsyncView loading={loading} error={error} reload={reload}>
        <StatGrid stats={[
          { key: 'Pending requests', value: String(list.filter((r) => r.status === 'Pending').length), icon: 'clock', tile: 'tile-orange' },
          { key: 'Diamonds pending', value: sum((r) => r.status === 'Pending').toLocaleString(), icon: 'star', tile: 'tile-blue' },
          { key: 'Paid (all time)', value: String(list.filter((r) => r.status === 'Paid').length), icon: 'checkCircle', tile: 'tile-green' },
          { key: 'Rejected', value: String(list.filter((r) => r.status === 'Rejected').length), icon: 'xCircle', tile: 'tile-red' },
        ]} />
        <div className="mt-16">
          <DataTable
            rows={list}
            searchKeys={['payee', 'username', 'idShort']}
            tabs={[
              { label: 'Pending', value: 'p', filter: (r) => r.status === 'Pending' },
              { label: 'Paid', value: 'd', filter: (r) => r.status === 'Paid' },
              { label: 'Rejected', value: 'r', filter: (r) => r.status === 'Rejected' },
              { label: 'All', value: 'all', filter: () => true },
            ]}
            columns={[
              { key: 'idShort', header: 'Ref', render: (r) => <span className="mono muted">{r.idShort}</span> },
              personCol('payee', 'username'),
              numCol('diamonds', 'Diamonds'),
              { key: 'amountInr', header: 'Amount', align: 'right', render: (r) => r.amountInr != null ? `₹${Number(r.amountInr).toLocaleString()}` : <span className="muted">—</span> },
              { key: 'requested', header: 'Requested', sortable: true },
              { key: 'processed', header: 'Processed' },
              statusCol(),
            ]}
            rowActions={(r) => r.status === 'Pending' ? [
              { label: 'Approve & mark paid', icon: 'check', onClick: () => decide(r, true) },
              { label: 'Reject & refund', icon: 'x', onClick: () => decide(r, false) },
            ] : [
              { label: 'Already processed', icon: 'clock', onClick: () => {} },
            ]}
            emptyText="No withdrawal requests. Hosts request payouts from the app; approvals land here."
          />
        </div>
      </AsyncView>
    </>
  )
}

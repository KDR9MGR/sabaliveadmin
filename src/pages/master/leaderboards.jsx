import { useEffect, useState } from 'react'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, Tabs, PillTabs, Person } from '../../components/ui.jsx'
import Icon from '../../components/Icon.jsx'
import DataTable from '../../components/DataTable.jsx'
import ExportButtons from '../../components/ExportButtons.jsx'
import { numCol } from '../../components/cells.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { useAuth } from '../../lib/auth.jsx'
import { exportRows } from '../../lib/export.js'
import { getLeaderboard } from '../../lib/leaderboard.js'
import { BOARDS, PERIODS, boardOf, periodOf, whichChoices, windowText, resetsIn, exportColumns, exportName } from '../../lib/leaderboardRules.js'

const fmt = (v) => Number(v || 0).toLocaleString('en-US')
const MEDAL = { 1: '#d4a017', 2: '#9aa3ad', 3: '#b9703a' }

const RankCell = ({ rank }) => (
  <span className="hstack" style={{ gap: 6, alignItems: 'center' }}>
    {MEDAL[rank] ? <span style={{ color: MEDAL[rank], display: 'inline-flex' }}><Icon name="trophy" size={15} /></span> : <span style={{ width: 15 }} />}
    <span className="mono" style={{ fontWeight: 700 }}>{rank}</span>
  </span>
)

function columnsFor(board) {
  const b = boardOf(board)
  const who = {
    key: 'name', header: b.who, sortable: true,
    render: (r) => (board === 'agencies'
      ? <Person name={r.name} meta={r.country || undefined} size="sm" />
      : <Person name={r.name} meta={r.username || undefined} src={r.avatarUrl || undefined} size="sm" />),
  }
  const id = { key: 'userId', header: board === 'agencies' ? 'Agency ID' : 'User ID', sortable: true, render: (r) => (r.userId ? <span className="mono">{r.userId}</span> : <span className="muted">—</span>) }
  const cols = [{ key: 'rank', header: 'Rank', sortable: true, render: (r) => <RankCell rank={r.rank} /> }, who, id]
  if (board === 'hosts') cols.push({ key: 'agency', header: 'Agency', sortable: true, render: (r) => (r.agency ? r.agency : <span className="muted">No agency</span>) })
  if (board === 'agencies') cols.push(numCol('hosts', 'Hosts who received gifts'))
  cols.push(numCol('gifts', 'Gifts'), numCol('score', b.unit))
  return cols
}

/* Master / Super Admin -> Leaderboards. The same three boards the app shows (Hosts: diamonds received, Gifters: coins spent, Agencies: the diamonds of all their hosts
   added together), daily / weekly / monthly, resetting at 00:10 India time, with the board that just ended one tap away. The database (admin_leaderboard) does the
   sums and gives the window; nothing is computed here. */
export function Leaderboards() {
  const { can } = useAuth()
  const [board, setBoard] = useState('hosts')
  const [period, setPeriod] = useState('day')
  const [which, setWhich] = useState('current')
  const [tick, setTick] = useState(0)
  const res = useAsyncData(() => getLeaderboard({ board, period, which }), [board, period, which])
  const data = res.data

  // the countdown moves; and a board left open across the reset fetches itself again once the window it shows has ended
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (which === 'current' && data?.endsAt && Date.now() >= +new Date(data.endsAt)) res.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  const b = boardOf(board)
  const p = periodOf(period)
  const rows = data?.rows || []
  const shown = data && data.board === board && data.period === period && data.which === which

  return (
    <div>
      <PageHeader
        title="Leaderboards"
        crumbs={['Home', 'Platform', 'Leaderboards']}
        actions={<Button icon="refresh" disabled={res.loading} onClick={res.reload}>Refresh</Button>}
      />

      <Tabs tabs={BOARDS.map((x) => ({ value: x.value, label: x.label }))} value={board} onChange={setBoard} />
      <div className="hstack wrap mt-16 mb-16" style={{ gap: 14, alignItems: 'center' }}>
        <PillTabs tabs={PERIODS.map((x) => ({ value: x.value, label: x.label }))} value={period} onChange={(v) => { setPeriod(v); setWhich('current') }} />
        <PillTabs tabs={whichChoices(period)} value={which} onChange={setWhich} />
      </div>

      <Card className="mb-16" title={`${b.label}, ${p.label.toLowerCase()}${which === 'previous' ? `: ${p.previous.toLowerCase()}` : ''}`} sub={b.counts}>
        <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {shown ? (
            <>
              <div><strong>{windowText(data.startsAt, data.endsAt, which)}</strong></div>
              <div>
                {which === 'current'
                  ? <>{p.resets}. Next reset {resetsIn(data.endsAt)}.</>
                  : <>This board has ended. {p.resets.replace('Resets', 'It resets')}.</>}
              </div>
            </>
          ) : <div>{p.resets}.</div>}
          {which === 'current'
            ? <div>The same figures and the same windows as the Rankings in the app. A gift sent between 00:00 and 00:10 India time still counts for the period that is ending.</div>
            : <div>Kept here for reference: the app’s Rankings start again from zero after every reset and cannot show this board any more.</div>}
        </div>
      </Card>

      <AsyncView loading={res.loading} error={res.error} reload={res.reload}>
        {shown && (
          <>
            <div className="grid cols-3 mb-16">
              <div className="stat"><div className="stat__label">{b.entries}</div><div className="stat__value">{fmt(data.entries)}</div></div>
              <div className="stat"><div className="stat__label">{b.unit} in total</div><div className="stat__value">{fmt(data.total)}</div></div>
              <div className="stat">
                <div className="stat__label">Top of the board</div>
                <div className="stat__value">{rows[0] ? fmt(rows[0].score) : '—'}</div>
                {rows[0] && <div className="muted" style={{ fontSize: 12.5 }}>{rows[0].name}</div>}
              </div>
            </div>
            <DataTable
              rows={rows}
              searchKeys={['name', 'username', 'userId', 'agency', 'country']}
              searchPlaceholder={board === 'agencies' ? 'Search an agency…' : 'Search a name or User ID…'}
              pageSize={25}
              toolbarRight={(
                <ExportButtons
                  show={can('export_data')}
                  disabled={!rows.length}
                  onExport={(f) => exportRows(f, exportName(board, period, which, data.startsAt), exportColumns(board), rows, b.label)}
                />
              )}
              columns={columnsFor(board)}
              emptyText={which === 'current' ? 'Nobody has a score on this board yet.' : 'Nobody had a score on this board.'}
            />
            {data.entries > rows.length && <div className="muted mt-8" style={{ fontSize: 12.5 }}>Showing the first {fmt(rows.length)} of {fmt(data.entries)}.</div>}
          </>
        )}
      </AsyncView>
    </div>
  )
}

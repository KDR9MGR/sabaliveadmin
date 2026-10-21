import { useState } from 'react'
import { StatGrid, AsyncView } from '../pages/_templates.jsx'
import { Card, Button, Badge, Tag, EmptyState, useToast, ConfirmDialog } from './ui.jsx'
import { personCol, numCol } from './cells.jsx'
import DataTable from './DataTable.jsx'
import EntityForm from './EntityForm.jsx'
import { useAsyncData } from '../lib/useAsync.js'
import { useAuth } from '../lib/auth.jsx'
import { downloadCsv } from '../lib/csv.js'
import { agencyOptions } from '../lib/salary.js'
import {
  istMonth, getSalaryReport, getSalaryMonths, assignSalaryRewards,
  listSalarySlabs, saveSalarySlab, setSalarySlabActive, deleteSalarySlab,
} from '../lib/salaryReport.js'
import { num } from '../data/util.js'

/* The three tabs every Salary page shows. */
export const SALARY_TABS = [
  { label: 'Payslips', value: 'payslips' },
  { label: 'Monthly report', value: 'report' },
  { label: 'Salary slabs', value: 'slabs' },
]

const monthLabel = (m) => {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

/* ------------------------------------------------------------------ Monthly report + Assign Salary Reward
   What each host really earned in an India-time month (gift diamonds only), the slab it reaches and the reward. "Assign Salary Reward" turns
   the qualifying rows into ONE processing payslip each (no wallet money moves; staff mark them paid in Payslips). Only a finished month can
   be assigned, a host never gets two payslips for one month, and blocked (banned / not active) hosts are skipped by the database. */
export function SalaryReport({ agencyId: fixedAgency, onAssigned }) {
  const toast = useToast()
  const [month, setMonth] = useState(istMonth(-1))
  const [agency, setAgency] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const { data: agencies } = useAsyncData(async () => (fixedAgency ? [] : agencyOptions()), [fixedAgency])
  const agencyId = fixedAgency || agency || null
  const { data, loading, error, reload } = useAsyncData(() => getSalaryReport(month, agencyId), [month, agencyId])
  const { data: months, loading: monthsLoading, error: monthsError, reload: reloadMonths } = useAsyncData(() => getSalaryMonths(12, agencyId), [agencyId])
  const { can } = useAuth()
  const canExport = can('export_data')

  const rows = data || []
  const eligible = rows.filter((r) => r.slabId && !r.payslipId && !r.blocked)
  const assignedAlready = rows.filter((r) => r.payslipId)
  const blocked = rows.filter((r) => r.slabId && !r.payslipId && r.blocked)
  const eligibleTotal = eligible.reduce((t, r) => t + (r.reward || 0), 0)
  const notEnded = month >= istMonth(0)
  const needsUpdate = /salary_report|schema cache|does not exist/i.test(String(error?.message || error || ''))

  const assign = async () => {
    setBusy(true)
    try {
      const r = await assignSalaryRewards(month, agencyId)
      toast(`${num(r?.assigned || 0)} payslips created (₹${num(r?.total_inr || 0)}) for ${r?.period || monthLabel(month)}`)
      setConfirming(false)
      reload()
      reloadMonths()
      onAssigned?.()
    } catch (e) {
      toast(e.message || 'Could not assign')
      setConfirming(false)
    } finally {
      setBusy(false)
    }
  }

  const scopeName = fixedAgency ? 'agency' : (agencyId ? ((agencies || []).find((a) => a.value === agencyId)?.label || 'agency') : 'all-agencies')
  const slug = String(scopeName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'report'
  const downloadHosts = () => downloadCsv(`salary-report-${month}-${slug}.csv`, [
    { header: 'Month', value: (r) => r.period },
    { header: 'User ID', value: (r) => r.displayId },
    { header: 'Name', value: (r) => r.host },
    { header: 'Username', value: (r) => r.username },
    { header: 'Agency', value: (r) => r.agency },
    { header: 'Diamonds earned', value: (r) => r.earned },
    { header: 'Live hours', value: (r) => r.hours },
    { header: 'Live days', value: (r) => r.days },
    { header: 'Withdrawn diamonds', value: (r) => r.withdrawn },
    { header: 'Available diamonds', value: (r) => r.available },
    { header: 'Slab', value: (r) => r.slab || '' },
    { header: 'Reward (INR)', value: (r) => (r.reward != null ? r.reward : '') },
    { header: 'Payslip', value: (r) => (r.payslipId ? String(r.payslipStatus || '').replace('_', ' ') : '') },
    { header: 'Blocked', value: (r) => r.blocked || '' },
  ], rows)
  const downloadMonths = () => downloadCsv(`salary-months-${slug}.csv`, [
    { header: 'Month', value: (r) => r.period },
    { header: 'Month over', value: (r) => (r.ended ? 'yes' : 'no (live preview)') },
    { header: 'Hosts earning', value: (r) => r.hostsEarning },
    { header: 'Diamonds earned', value: (r) => r.earned },
    { header: 'Hosts reaching a slab', value: (r) => r.hostsWithSlab },
    { header: 'Reward total (INR)', value: (r) => r.reward },
    { header: 'Payslips', value: (r) => r.payslips },
    { header: 'Payslips net (INR)', value: (r) => r.payslipsInr },
    { header: 'Paid (INR)', value: (r) => r.paidInr },
  ], months || [])

  return (
    <Card
      title="Monthly salary report"
      sub="What each host earned in the month (gift diamonds received, India time), the slab it reaches and the reward. Lucky Box, games and grants are not earnings."
      action={<Button size="sm" icon="refresh" onClick={reload}>Refresh</Button>}
    >
      {needsUpdate ? (
        <div className="card__body muted" style={{ fontSize: 13 }}>This needs the database update <code>20261021120000_salary_slabs_monthly_report</code>, which has not been applied yet.</div>
      ) : (
        <>
          <div className="card__body">
            <div className="hstack wrap" style={{ gap: 12, alignItems: 'flex-end', marginBottom: 12 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Month</label>
                <input className="input" type="month" value={month} max={istMonth(0)} onChange={(e) => e.target.value && setMonth(e.target.value)} />
              </div>
              {!fixedAgency && (
                <div className="field" style={{ marginBottom: 0, minWidth: 220 }}>
                  <label>Agency</label>
                  <select className="input" value={agency} onChange={(e) => setAgency(e.target.value)}>
                    <option value="">All agencies in my scope</option>
                    {(agencies || []).map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
              )}
              <div className="grow" />
              {canExport && <Button icon="download" disabled={!rows.length || loading} onClick={downloadHosts}>Download this month (CSV)</Button>}
              <Button variant="primary" icon="coins" disabled={!eligible.length || notEnded || loading} onClick={() => setConfirming(true)}>
                {`Assign Salary Reward${eligible.length ? ` (${num(eligible.length)})` : ''}…`}
              </Button>
            </div>
            {notEnded && <div className="hint" style={{ marginBottom: 10 }}>{monthLabel(month)} is not over yet, so this is a live preview. Rewards can be assigned once the month has ended.</div>}
          </div>
          <div className="card__body" style={{ paddingTop: 0 }}>
            <div className="hstack" style={{ marginBottom: 8, alignItems: 'center' }}>
              <b style={{ fontSize: 13.5 }}>By month</b>
              <span className="muted" style={{ fontSize: 12.5, marginLeft: 8 }}>Click a month to open its hosts below.</span>
              <div className="grow" />
              {canExport && <Button size="sm" icon="download" disabled={!(months || []).length} onClick={downloadMonths}>Download all months (CSV)</Button>}
            </div>
            {/needs the database update|salary_month_summary|schema cache|does not exist/i.test(String(monthsError?.message || monthsError || '')) ? (
              <div className="muted" style={{ fontSize: 13 }}>The month-by-month table needs the database update <code>20261021140000_salary_month_summary</code>, which has not been applied yet.</div>
            ) : (
              <AsyncView loading={monthsLoading} error={monthsError} reload={reloadMonths}>
                <DataTable
                  rows={months || []}
                  pageSize={12}
                  onRowClick={(r) => setMonth(r.month)}
                  columns={[
                    { key: 'period', header: 'Month', render: (r) => <span style={{ fontWeight: r.month === month ? 700 : 500 }}>{r.period}{r.month === month ? ' ◂' : ''}</span> },
                    { key: 'ended', header: 'Status', render: (r) => (r.ended ? <Badge tone="muted">Over</Badge> : <Badge tone="info">In progress</Badge>) },
                    numCol('hostsEarning', 'Hosts earning'),
                    numCol('earned', 'Diamonds earned'),
                    numCol('hostsWithSlab', 'Reached a slab'),
                    numCol('reward', 'Reward total', { prefix: '₹' }),
                    { key: 'payslips', header: 'Payslips', sortable: true, align: 'right', render: (r) => <span className="mono">{num(r.payslips)}{r.payslips ? ` · ₹${num(r.payslipsInr)}` : ''}</span> },
                    numCol('paidInr', 'Paid', { prefix: '₹' }),
                  ]}
                  emptyText="No months yet."
                />
              </AsyncView>
            )}
          </div>
          <AsyncView loading={loading} error={error} reload={reload}>
            <div className="card__body">
              <b style={{ fontSize: 13.5 }}>Hosts — {monthLabel(month)}</b>
              <div style={{ height: 8 }} />
              <StatGrid stats={[
                { key: 'Hosts with earnings', value: num(rows.filter((r) => r.earned > 0).length), icon: 'users', tile: 'tile-purple' },
                { key: 'Diamonds earned', value: num(rows.reduce((t, r) => t + r.earned, 0)), icon: 'coins', tile: 'tile-blue' },
                { key: 'Will get a payslip', value: num(eligible.length), icon: 'award', tile: 'tile-green' },
                { key: 'Reward to assign', value: '₹' + num(eligibleTotal), icon: 'dollar', tile: 'tile-green' },
              ]} />
            </div>
            <DataTable
              rows={rows}
              pageSize={10}
              searchKeys={['host', 'username', 'displayId', 'agency']}
              searchPlaceholder="Search by host, ID or agency…"
              tabs={[
                { label: 'All', value: 'all', filter: () => true },
                { label: 'Will get a payslip', value: 'e', filter: (r) => r.slabId && !r.payslipId && !r.blocked },
                { label: 'Already assigned', value: 'a', filter: (r) => !!r.payslipId },
                { label: 'No slab reached', value: 'n', filter: (r) => !r.slabId && !r.payslipId },
                { label: 'Blocked', value: 'b', filter: (r) => !!r.blocked },
              ]}
              columns={[
                personCol('host', 'username'),
                { key: 'displayId', header: 'User ID', render: (r) => <span className="mono muted">{r.displayId}</span> },
                ...(fixedAgency ? [] : [{ key: 'agency', header: 'Agency', sortable: true }]),
                numCol('earned', 'Diamonds earned'),
                { key: 'hours', header: 'Live', sortable: true, align: 'right', render: (r) => <span className="mono">{r.hours} h · {r.days} d</span> },
                numCol('withdrawn', 'Withdrawn'),
                numCol('available', 'Available now'),
                { key: 'slab', header: 'Slab', render: (r) => (r.slab ? <Badge tone="success">{r.slab}</Badge> : <span className="muted">—</span>) },
                { key: 'reward', header: 'Reward', sortable: true, align: 'right', render: (r) => (r.reward != null ? <span className="mono">₹{num(r.reward)}</span> : <span className="muted">—</span>) },
                { key: 'payslipStatus', header: 'Payslip', render: (r) => (
                  r.payslipId ? <Tag>{String(r.payslipStatus || '').replace('_', ' ')}</Tag>
                    : r.blocked ? <Badge tone="danger">{r.blocked}</Badge>
                      : r.slabId ? <span className="muted">Not yet</span> : <span className="muted">—</span>
                ) },
              ]}
              emptyText="No host earned or went live in this month."
            />
          </AsyncView>
        </>
      )}
      {confirming && (
        <ConfirmDialog
          title={`Assign ${num(eligible.length)} salary rewards (₹${num(eligibleTotal)})?`}
          busy={busy}
          confirmLabel="Assign now"
          message={`Creates one payslip per qualifying host for ${monthLabel(month)}, at the slab reward, with the status "processing" — no wallet money moves, and you mark each one paid in Payslips. ${assignedAlready.length ? `${num(assignedAlready.length)} hosts already have a payslip for this month and are left alone. ` : ''}${blocked.length ? `${num(blocked.length)} blocked hosts (banned or not active) are skipped. ` : ''}A host can never be given two payslips for the same month.`}
          onConfirm={assign}
          onClose={() => setConfirming(false)}
        />
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ Salary slabs (the rules)
   Everyone on staff can read them (so the report can show the slab); a Master / Super Admin edits them. */
export function SalarySlabs({ canEdit = false }) {
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(listSalarySlabs)
  const [form, setForm] = useState(null) // null | {} (new) | slab (edit)
  const [deleting, setDeleting] = useState(null)
  const rows = data || []
  const needsUpdate = /salary_slabs|schema cache|does not exist/i.test(String(error?.message || error || ''))

  const flip = async (r) => {
    try { await setSalarySlabActive(r.id, !r.active); toast(`${r.name} ${r.active ? 'turned off' : 'turned on'}`); reload() }
    catch (e) { toast(e.message || 'Could not update the slab') }
  }
  const remove = async () => {
    try { await deleteSalarySlab(deleting.id); toast(`${deleting.name} deleted`); setDeleting(null); reload() }
    catch (e) { toast(e.message || 'Could not delete the slab'); setDeleting(null) }
  }

  return (
    <Card
      title="Salary slabs"
      sub="A host who earned at least this many gift diamonds in a month (and, when set, went live this many hours on this many days) gets the reward. A host gets the best slab they qualify for."
      action={canEdit ? <Button size="sm" variant="primary" icon="plus" onClick={() => setForm({})}>Add slab</Button> : undefined}
    >
      {needsUpdate ? (
        <div className="card__body muted" style={{ fontSize: 13 }}>This needs the database update <code>20261021120000_salary_slabs_monthly_report</code>, which has not been applied yet.</div>
      ) : (
        <AsyncView loading={loading} error={error} reload={reload}>
          {rows.length ? (
            <DataTable
              rows={rows}
              searchKeys={['name']}
              columns={[
                { key: 'name', header: 'Slab', sortable: true },
                numCol('minDiamonds', 'Diamonds earned (at least)'),
                { key: 'minLiveHours', header: 'Live hours (at least)', sortable: true, align: 'right', render: (r) => <span className="mono">{r.minLiveHours || '—'}</span> },
                { key: 'minLiveDays', header: 'Live days (at least)', sortable: true, align: 'right', render: (r) => <span className="mono">{r.minLiveDays || '—'}</span> },
                numCol('reward', 'Reward', { prefix: '₹' }),
                { key: 'active', header: 'Status', render: (r) => (r.active ? <Badge tone="success">On</Badge> : <Badge tone="muted">Off</Badge>) },
              ]}
              rowActions={canEdit ? (r) => [
                { label: 'Edit', icon: 'edit', onClick: () => setForm(r) },
                { label: r.active ? 'Turn off' : 'Turn on', icon: 'refresh', onClick: () => flip(r) },
                { sep: true },
                { label: 'Delete', icon: 'trash', onClick: () => setDeleting(r) },
              ] : undefined}
              emptyText="No slabs."
            />
          ) : (
            <div className="card__body">
              <EmptyState
                icon="award"
                title="No slabs yet"
                text={canEdit
                  ? 'Add the first one, e.g. "Bronze: 100,000 diamonds earned in a month, reward ₹2,000". Until a slab exists, Assign Salary Reward has nothing to assign.'
                  : 'A Master or Super Admin adds the slabs. Until then, Assign Salary Reward has nothing to assign.'}
              />
            </div>
          )}
        </AsyncView>
      )}
      {form && (
        <EntityForm
          title={form.id ? `Edit ${form.name}` : 'Add a salary slab'}
          savedMessage="Slab saved"
          initial={form.id ? { name: form.name, min_diamonds: form.minDiamonds, min_live_hours: form.minLiveHours, min_live_days: form.minLiveDays, reward_inr: form.reward } : { min_live_hours: 0, min_live_days: 0 }}
          onClose={() => setForm(null)}
          onSubmit={async (v) => { await saveSalarySlab(v, form.id); reload() }}
          fields={[
            { name: 'name', label: 'Slab name', required: true, placeholder: 'e.g. Silver', full: true },
            { name: 'min_diamonds', label: 'Diamonds earned (at least)', type: 'number', required: true, min: 1, hint: 'Gift diamonds received in the month' },
            { name: 'reward_inr', label: 'Reward (₹)', type: 'number', required: true, min: 0 },
            { name: 'min_live_hours', label: 'Live hours (at least)', type: 'number', min: 0, step: 0.5, hint: '0 = no live-time condition' },
            { name: 'min_live_days', label: 'Live days (at least)', type: 'number', min: 0, max: 31, hint: 'A day counts at 60+ minutes live. 0 = no condition' },
          ]}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete the ${deleting.name} slab?`}
          danger
          confirmLabel="Delete"
          message="Payslips already assigned are not changed. Turning a slab off is the gentler option."
          onConfirm={remove}
          onClose={() => setDeleting(null)}
        />
      )}
    </Card>
  )
}

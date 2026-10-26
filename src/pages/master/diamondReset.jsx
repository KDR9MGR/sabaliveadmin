import { useEffect, useMemo, useState } from 'react'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, Badge, Modal, ConfirmDialog, KV, useToast } from '../../components/ui.jsx'
import DataTable from '../../components/DataTable.jsx'
import { numCol } from '../../components/cells.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { getAutoSettings, listDiamondResets, previewDiamondReset, resetDiamonds, saveAutoSettings, undoDiamondReset } from '../../lib/diamondReset.js'
import {
  AUTO_DEFAULTS, AUTO_NOT_INSTALLED, BUTTONS, DIAMOND_RESET_NOT_INSTALLED, buttonState, checkAutoSettings, confirmMatches, finishedMonths, monthLabel, nextAutoRun, sameAutoSettings,
} from '../../lib/diamondResetRules.js'

const num = (n) => Number(n || 0).toLocaleString()
const when = (iso) => (iso ? new Date(iso).toLocaleString() : '—')

/* Master / Super Admin -> Economy -> Diamond reset. A finished month's gift diamonds, reward (Lucky Box) diamonds, or both are taken off the wallets that still hold them.
   The database works out every amount (the preview and the button use the same rule), checks the role, the month and the typed confirmation, and writes one ledger row per
   wallet; this page only shows the numbers first and asks for the month to be typed. */
export function DiamondReset() {
  const toast = useToast()
  const months = useMemo(() => finishedMonths(), [])
  const [period, setPeriod] = useState(months[0].value)
  const preview = useAsyncData(() => previewDiamondReset(period), [period])
  const runs = useAsyncData(listDiamondResets)
  const [confirming, setConfirming] = useState(null) // a button key
  const [undoing, setUndoing] = useState(null) // a run row

  const notInstalled = DIAMOND_RESET_NOT_INSTALLED.test(String(preview.error || runs.error || ''))
  const p = preview.data
  const refresh = () => { preview.reload(); runs.reload() }

  return (
    <>
      <PageHeader title="Diamond reset" crumbs={['Home', 'Economy', 'Diamond reset']} />
      <AutoResetCard onChanged={runs.reload} />

      <Card
        title="Reset a finished month"
        sub="Takes the diamonds a host received in a month off their wallet, so the new month starts clean. Choose gifting diamonds, reward (Lucky Box) diamonds, or both. Each month can be reset once per kind, and a run can be undone below."
        className="mb-16"
        action={<Button icon="refresh" onClick={refresh}>Refresh</Button>}
      >
        {notInstalled ? (
          <div className="card__body muted" style={{ fontSize: 13 }}>Diamond reset needs the database update <code>20261026120000_diamond_reset</code>, which has not been applied yet.</div>
        ) : (
          <div className="card__body">
            <div className="field" style={{ maxWidth: 260, marginBottom: 14 }}>
              <label>Month (India time)</label>
              <select className="select" value={period} onChange={(e) => setPeriod(e.target.value)}>
                {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <AsyncView loading={preview.loading} error={preview.error} reload={preview.reload}>
              {p && (
                <>
                  <div className="table-wrap" style={{ marginBottom: 14 }}>
                    <table className="data">
                      <thead>
                        <tr><th>Diamonds</th><th style={{ textAlign: 'right' }}>Wallets</th><th style={{ textAlign: 'right' }}>Would be taken</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {[['Gifting diamonds', p.gift], ['Reward diamonds', p.reward]].map(([label, x]) => (
                          <tr key={label}>
                            <td>{label}</td>
                            <td style={{ textAlign: 'right' }} className="mono">{num(x.wallets)}</td>
                            <td style={{ textAlign: 'right' }} className="mono">{num(x.diamonds)}</td>
                            <td>{x.done
                              ? <Badge tone="success">Reset {when(x.runAt)}: {num(x.removed)} from {num(x.removedWallets)} wallets</Badge>
                              : <Badge tone="muted">Not reset</Badge>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="hstack gap-8 wrap">
                    {BUTTONS.map((b) => {
                      const st = buttonState(p, b.key)
                      return (
                        <Button key={b.key} variant={b.key === 'both' ? 'danger' : 'primary'} icon="refresh" disabled={!st.enabled} title={st.reason || undefined} onClick={() => setConfirming(b.key)}>
                          {b.label}
                        </Button>
                      )
                    })}
                  </div>
                  {BUTTONS.map((b) => {
                    const st = buttonState(p, b.key)
                    return st.enabled ? null : <div key={b.key} className="hint" style={{ marginTop: 6 }}>{b.label}: {st.reason}</div>
                  })}
                </>
              )}
            </AsyncView>
            <div className="hint" style={{ marginTop: 16 }}>
              What is taken, per wallet: the diamonds it received that month as gifts, or won that month in Lucky Box (a win that was pulled back does not count), never more than the wallet
              holds and never diamonds that arrived after the month ended (withdrawals are taken to have used the oldest diamonds first). Other months and other credits stay. Ghost accounts are skipped.
              Each host gets the usual notification that diamonds were reclaimed by an admin. The Salary reports are not changed: they still show that month's gift and reward diamonds.
            </div>
          </div>
        )}
      </Card>

      <Card title="Reset history" sub="Every run: who pressed the button, how many wallets and diamonds. Undo gives the exact diamonds back and frees that month for another run." className="mb-16">
        <AsyncView loading={runs.loading} error={runs.error} reload={runs.reload}>
          <DataTable
            rows={runs.data || []}
            searchKeys={['month', 'what', 'by']}
            filters={[{ label: 'Status', options: ['Done', 'Undone'], get: (r) => r.status }]}
            rowActions={(r) => (r.undone ? [] : [{ label: 'Undo this reset', icon: 'x', onClick: () => setUndoing(r) }])}
            columns={[
              { key: 'at', header: 'When', sortable: true, render: (r) => when(r.at) },
              { key: 'month', header: 'Month', sortable: true },
              { key: 'what', header: 'Diamonds', sortable: true },
              numCol('wallets', 'Wallets'),
              numCol('diamonds', 'Diamonds taken'),
              { key: 'by', header: 'Pressed by', sortable: true },
              { key: 'status', header: 'Status', sortable: true, render: (r) => (r.undone
                ? <Badge tone="muted">Undone {when(r.undoneAt)}{r.undoneBy ? ` by ${r.undoneBy}` : ''}</Badge>
                : <Badge tone="success">Done</Badge>) },
            ]}
            emptyText="No diamond reset has been run yet."
          />
        </AsyncView>
      </Card>

      {confirming && p && (
        <ResetDialog
          period={period}
          button={BUTTONS.find((b) => b.key === confirming)}
          state={buttonState(p, confirming)}
          onClose={() => setConfirming(null)}
          onDone={(summary) => { setConfirming(null); toast(summary); refresh() }}
        />
      )}
      {undoing && (
        <UndoDialog
          run={undoing}
          onClose={() => setUndoing(null)}
          onDone={(summary) => { setUndoing(null); toast(summary); refresh() }}
        />
      )}
    </>
  )
}

/* The automatic monthly reset: a switch (off by default), the two boxes and the day. Saved only when "Save" is pressed; turning it ON asks once more. */
function AutoResetCard({ onChanged }) {
  const toast = useToast()
  const settings = useAsyncData(getAutoSettings)
  const [draft, setDraft] = useState(AUTO_DEFAULTS)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmOn, setConfirmOn] = useState(false)

  useEffect(() => { if (settings.data) setDraft(settings.data) }, [settings.data])

  const saved = settings.data
  const notInstalled = AUTO_NOT_INSTALLED.test(String(settings.error || ''))
  const check = checkAutoSettings(draft)
  const changed = !!saved && !sameAutoSettings(saved, draft)
  const next = nextAutoRun(check.value ? draft : { ...draft, enabled: false })
  const set = (k, v) => { setError(''); setDraft((d) => ({ ...d, [k]: v })) }

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      const r = await saveAutoSettings(check.value)
      settings.reload()
      onChanged?.()
      toast(r.enabled ? 'Automatic reset is ON' : 'Automatic reset is OFF')
      setConfirmOn(false)
    } catch (e) {
      setError(e?.message || 'Could not save')
      setConfirmOn(false)
    } finally {
      setBusy(false)
    }
  }
  const press = () => { if (draft.enabled && !saved?.enabled) setConfirmOn(true); else save() }

  return (
    <>
      <Card
        title="Automatic monthly reset"
        sub="Once a month, at 00:05 India time on the day you choose, the finished month before is reset by itself for the kinds you tick. The same rule and the same Undo as the buttons below; a kind already reset by hand is left alone."
        className="mb-16"
        action={saved ? <Badge tone={saved.enabled ? 'success' : 'muted'}>{saved.enabled ? 'ON' : 'OFF'}</Badge> : null}
      >
        {notInstalled ? (
          <div className="card__body muted" style={{ fontSize: 13 }}>Automatic reset needs the database update <code>20261026130000_diamond_reset_auto</code>, which has not been applied yet.</div>
        ) : (
          <AsyncView loading={settings.loading} error={settings.error} reload={settings.reload}>
            <div className="card__body">
              {error && <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 14 }}>{error}</div>}
              <div className="toggle-row" style={{ padding: 0, border: 0, marginBottom: 14 }}>
                <div>
                  <div className="t-title">Reset diamonds automatically every month</div>
                  <div className="t-desc">Off by default. Nothing runs by itself until you switch this on and save.</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={draft.enabled} onChange={(e) => set('enabled', e.target.checked)} disabled={busy} aria-label="Reset diamonds automatically every month" />
                  <span className="track" /><span className="thumb" />
                </label>
              </div>
              <div className="field" style={{ marginBottom: 14 }}>
                <label>What to reset</label>
                <div className="hstack gap-8 wrap" style={{ gap: 20 }}>
                  <label className="hstack" style={{ gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={draft.gift} onChange={(e) => set('gift', e.target.checked)} disabled={busy} />
                    <span>Gifting diamonds</span>
                  </label>
                  <label className="hstack" style={{ gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={draft.reward} onChange={(e) => set('reward', e.target.checked)} disabled={busy} />
                    <span>Reward diamonds</span>
                  </label>
                </div>
              </div>
              <div className="field" style={{ maxWidth: 260, marginBottom: 14 }}>
                <label>Run on day</label>
                <select className="select" value={draft.day} onChange={(e) => set('day', Number(e.target.value))} disabled={busy}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d === 1 ? '1 (the 1st)' : d}</option>)}
                </select>
                <span className="hint">Of every month, 00:05 India time. Choose a later day to give hosts time to withdraw first.</span>
              </div>
              {check.error && draft.enabled && <div className="hint" style={{ color: 'var(--danger, #dc2626)', marginBottom: 10 }}>{check.error}</div>}
              <div className="hint" style={{ marginBottom: 12 }}>
                {next
                  ? <>Next automatic run: <b>{next.runAtLabel}</b>. It will reset <b>{next.periodLabel}</b>: {next.kinds.join(' and ')}.</>
                  : 'No automatic run is scheduled.'}
                {saved?.lastAt && <><br />Last automatic run: {when(saved.lastAt)}. {saved.lastNote}</>}
              </div>
              <Button variant="primary" icon={busy ? 'refresh' : 'check'} disabled={busy || !changed || !!check.error} onClick={press}>
                {busy ? 'Saving…' : 'Save automatic settings'}
              </Button>
            </div>
          </AsyncView>
        )}
      </Card>
      {confirmOn && next && (
        <ConfirmDialog
          danger busy={busy}
          title="Switch on the automatic reset?"
          message={`On ${next.runAtLabel} the ${next.periodLabel} ${next.kinds.join(' and ')} will be taken off every wallet that still holds them, with no one pressing a button. Hosts get the usual notification. You can undo each run from the history, and switch this off at any time.`}
          confirmLabel="Switch on"
          onClose={() => setConfirmOn(false)}
          onConfirm={save}
        />
      )}
    </>
  )
}

/* The month must be typed: this moves real balances. */
function ResetDialog({ period, button, state, onClose, onDone }) {
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ready = confirmMatches(typed, period)

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const runs = await resetDiamonds(period, button.key, typed.trim())
      const list = Array.isArray(runs) ? runs : []
      const total = list.reduce((n, r) => n + Number(r.diamonds || 0), 0)
      const wallets = Math.max(0, ...list.map((r) => Number(r.wallets || 0)))
      onDone(`${num(total)} diamonds taken off ${button.short} for ${monthLabel(period)} (${num(wallets)} wallets)`)
    } catch (e) {
      setError(e?.message || 'Could not reset the diamonds')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={`${button.label}: ${monthLabel(period)}`}
      onClose={busy ? () => {} : onClose}
      footer={<>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="danger" icon={busy ? 'refresh' : 'check'} disabled={busy || !ready} onClick={submit}>{busy ? 'Resetting…' : button.label}</Button>
      </>}
    >
      {error && <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 14 }}>{error}</div>}
      <KV rows={[
        ['Month', <b>{monthLabel(period)}</b>],
        ['What', button.short],
        ['Wallets affected', <b>{num(state.wallets)}</b>],
        ['Diamonds taken', <b>{num(state.diamonds)}</b>],
      ]} />
      <div className="hint" style={{ margin: '12px 0 16px' }}>
        The figures are worked out again by the database the moment you press the button, so they can differ slightly if a host withdrew in between. Every wallet gets one ledger row and a
        notification, and the run is written to the audit log with your name. You can undo this run from the history table.
      </div>
      <div className="field">
        <label>Type the month <span className="mono">{period}</span> to confirm</label>
        <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} disabled={busy} placeholder={period} />
      </div>
    </Modal>
  )
}

function UndoDialog({ run, onClose, onDone }) {
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ready = confirmMatches(typed, run.period)

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const r = await undoDiamondReset(run.id, typed.trim())
      onDone(`${num(r?.diamonds)} diamonds given back to ${num(r?.wallets)} wallets (${run.what.toLowerCase()}, ${run.month})`)
    } catch (e) {
      setError(e?.message || 'Could not undo the reset')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={`Undo the ${run.what.toLowerCase()} reset of ${run.month}`}
      onClose={busy ? () => {} : onClose}
      footer={<>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="danger" icon={busy ? 'refresh' : 'check'} disabled={busy || !ready} onClick={submit}>{busy ? 'Undoing…' : 'Undo this reset'}</Button>
      </>}
    >
      {error && <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 14 }}>{error}</div>}
      <KV rows={[
        ['Reset on', when(run.at)],
        ['Pressed by', run.by || '—'],
        ['Wallets', num(run.wallets)],
        ['Diamonds to give back', <b>{num(run.diamonds)}</b>],
      ]} />
      <div className="hint" style={{ margin: '12px 0 16px' }}>
        Each wallet gets back exactly what this run took, even if it has withdrawn since. The month can then be reset again.
      </div>
      <div className="field">
        <label>Type the month <span className="mono">{run.period}</span> to confirm</label>
        <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} disabled={busy} placeholder={run.period} />
      </div>
    </Modal>
  )
}

export default DiamondReset

import { useState } from 'react'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, Badge, useToast } from '../../components/ui.jsx'
import { numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { getPkSwitches, getPkRules, savePkRules, listBattles } from '../../lib/pk.js'
import { battleResult, daySummary } from '../../lib/pkStats.js'

const FIELDS = [
  { key: 'invite_minutes', label: 'Invited PK lengths (minutes)', hint: 'The lengths a host can pick when inviting, separated by commas: 5, 10, 30, 40.', type: 'text' },
  { key: 'random_minutes', label: 'Random PK length (minutes)', hint: 'Always this long, no picker.', type: 'number' },
  { key: 'forfeit_grace_seconds', label: 'Forfeit grace (seconds)', hint: 'A host whose live has been silent this long during a battle loses. 45 to 85: the app reports every 30 s, so less would punish one late report.', type: 'number' },
  { key: 'invites_per_minute', label: 'Invites per host per minute', hint: 'More are refused ("too many PK invites").', type: 'number' },
  { key: 'random_queue_seconds', label: 'Random search expiry (seconds)', hint: 'A host who stops asking for a match drops out of the pool after this long.', type: 'number' },
]

const SwitchRow = ({ title, on, note }) => (
  <div className="toggle-row">
    <div><div className="t-title">{title}</div><div className="t-desc">{note}</div></div>
    <Badge tone={on ? 'success' : 'muted'}>{on ? 'On' : 'Off'}</Badge>
  </div>
)

/* PK battles: the switches (read-only here, changed in Application Config -> Release controls), the rules the server enforces, the last
   14 days and every recent battle. Needs the PK database work for the columns marked "(new)" and for saving the rules. */
export function PkBattles() {
  const toast = useToast()
  const sw = useAsyncData(getPkSwitches)
  const rules = useAsyncData(getPkRules)
  const battles = useAsyncData(() => listBattles(14))
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const v = form || rules.data || {}
  const set = (k, val) => setForm({ ...(form || rules.data), [k]: val })

  const save = async () => {
    setBusy(true)
    try {
      await savePkRules(v)
      toast('PK rules saved')
      setForm(null)
      rules.reload()
    } catch (e) {
      toast(e.message || 'Could not save the rules')
    } finally {
      setBusy(false)
    }
  }

  const rows = battles.data || []
  const days = daySummary(rows)

  return (
    <div>
      <PageHeader title="PK Battles" subtitle="PK inside audio and video lives: switches, rules, daily totals and every recent battle" />

      <Card title="Switches" sub="Changed in Application Configuration → Release controls (Super Admin). Shown here so you can see what players get." className="mb-16">
        <AsyncView loading={sw.loading} error={sw.error} reload={sw.reload}>
          <SwitchRow title="PK Battles" on={sw.data?.battles} note="Audio PK for players on an app build that has it. Off: PK says “coming soon”." />
          <SwitchRow title="PK battle layer" on={sw.data?.layer} note="On (default): PK runs inside normal lives. Off: Go Live → PK opens the old standalone PK screen." />
          <SwitchRow title="Video PK" on={sw.data?.video} note="Two cameras side by side. Needs PK Battles and the layer on. Keep it off until its Agora cost has been measured." />
        </AsyncView>
      </Card>

      <Card title="Rules the server enforces" sub="Applied to every invite, random match and battle. Changes take effect on the next one." className="mb-16">
        <AsyncView loading={rules.loading} error={rules.error} reload={rules.reload}>
          {rules.data === null ? (
            <div className="muted">The PK database work is not on this project yet, so there are no rules to show.</div>
          ) : (
            <>
              <div className="form-grid">
                {FIELDS.map((f) => (
                  <div className="field" key={f.key}>
                    <label>{f.label}</label>
                    <input className="input" type={f.type} min="0" step="1" value={v[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />
                    <span className="hint">{f.hint}</span>
                  </div>
                ))}
              </div>
              <div className="hstack" style={{ marginTop: 14 }}>
                <Button variant="primary" icon={busy ? 'refresh' : 'check'} disabled={busy || !form} onClick={save}>{busy ? 'Saving…' : 'Save'}</Button>
                {form && <Button onClick={() => setForm(null)}>Discard</Button>}
              </div>
            </>
          )}
        </AsyncView>
      </Card>

      <Card title="Last 14 days" sub="Per day (UTC). “Ran” = reached the countdown and started. Coins = gifts counted in finished battles (both sides)." className="mb-16">
        <AsyncView loading={battles.loading} error={battles.error} reload={battles.reload}>
          <DataTable
            rows={days}
            pageSize={14}
            columns={[
              { key: 'day', header: 'Day (UTC)', sortable: true },
              numCol('invited', 'Invited'), numCol('ran', 'Ran'), numCol('finished', 'Finished'), numCol('forfeits', 'Forfeits'), numCol('cancelled', 'Cancelled'), numCol('coins', 'Coins'),
            ]}
            emptyText="No PK battles in the last 14 days."
          />
        </AsyncView>
      </Card>

      <Card title="Recent battles" sub="Newest first. Old PK screen battles have no kind or how (they were made before the layer).">
        <AsyncView loading={battles.loading} error={battles.error} reload={battles.reload}>
          <DataTable
            rows={rows}
            searchKeys={['hostA', 'hostB', 'idA', 'idB']}
            pageSize={20}
            columns={[
              { key: 'when', header: 'When', sortable: true },
              { key: 'kind', header: 'Kind (new)', sortable: true },
              { key: 'source', header: 'How (new)', sortable: true },
              { key: 'hostA', header: 'Host A', sortable: true, render: (r) => <span>{r.hostA} <span className="mono muted">{r.idA}</span></span> },
              { key: 'hostB', header: 'Host B', sortable: true, render: (r) => <span>{r.hostB} <span className="mono muted">{r.idB}</span></span> },
              { key: 'scoreA', header: 'Score', render: (r) => <span className="mono">{r.scoreA} : {r.scoreB}</span> },
              { key: 'length', header: 'Length (new)' },
              { key: 'result', header: 'Result', sortable: true, render: (r) => <span>{battleResult(r)}{r.endReason === 'forfeit' ? <Badge tone="warning" style={{ marginLeft: 6 }}>forfeit</Badge> : null}</span> },
            ]}
            emptyText="No PK battles yet."
          />
        </AsyncView>
      </Card>
    </div>
  )
}

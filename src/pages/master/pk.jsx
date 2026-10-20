import { useState } from 'react'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, Badge, useToast } from '../../components/ui.jsx'
import { numCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { getPkSwitches, getPkRules, savePkRules, listBattles, getPkTheme, savePkTheme } from '../../lib/pk.js'
import { battleResult, daySummary } from '../../lib/pkStats.js'
import { PK_THEME_DEFAULT, LOSE_STYLES, normalizeHex, hueShift, halfColors, barColors, accentGradient } from '../../lib/pkTheme.js'

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

const ColorField = ({ label, hint, value, onChange }) => {
  const ok = !!normalizeHex(value)
  return (
    <div className="field">
      <label>{label}</label>
      <div className="hstack" style={{ gap: 10 }}>
        <input type="color" className="color-input" value={normalizeHex(value) || '#000000'} onChange={(e) => onChange(e.target.value)} />
        <input className="input" style={{ width: 130 }} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#ff2d55" />
      </div>
      <span className="hint" style={ok ? undefined : { color: 'var(--danger, #e5484d)' }}>{ok ? hint : 'Not a colour yet: use six hex digits like #ff2d55.'}</span>
    </div>
  )
}

const Toggle = ({ title, desc, checked, onChange }) => (
  <div className="toggle-row">
    <div><div className="t-title">{title}</div><div className="t-desc">{desc}</div></div>
    <label className="toggle">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" /><span className="thumb" />
    </label>
  </div>
)

/* What the colours look like in a battle (the same colour maths as the phones; the animations themselves can't be shown here). */
function PkLookPreview({ theme }) {
  const mine = normalizeHex(theme.mine) || PK_THEME_DEFAULT.mine
  const theirs = normalizeHex(theme.theirs) || PK_THEME_DEFAULT.theirs
  const accent = normalizeHex(theme.accent) || PK_THEME_DEFAULT.accent
  const [m1, m2] = halfColors(mine, 'mine')
  const [t1, t2] = halfColors(theirs, 'theirs')
  const mb = barColors(mine, 'mine')
  const tb = barColors(theirs, 'theirs')
  const gold = accentGradient(accent)
  const half = (a, b, name) => (
    <div style={{ flex: 1, padding: '14px 6px', textAlign: 'center', background: `linear-gradient(180deg, ${a}, ${b})`, color: '#fff', fontSize: 12, fontWeight: 600 }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', margin: '0 auto 6px', background: 'rgba(255,255,255,.18)' }} />
      {name}
    </div>
  )
  const pill = (c, v) => <div style={{ flex: 1, padding: '6px 8px', borderRadius: 10, background: 'rgba(255,255,255,.05)', border: `1px solid ${c}73`, color: '#fff', fontSize: 12, textAlign: 'right' }}>{v}</div>
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: '#140f24', border: '1px solid var(--border, #0002)', maxWidth: 340 }}>
      <div style={{ display: 'flex' }}>{half(m1, m2, 'You')}{half(t1, t2, 'Opponent')}</div>
      <div style={{ padding: '10px 10px 4px' }}>
        <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: '62%', background: `linear-gradient(90deg, ${mb[0]}, ${mb[1]})` }} />
          <div style={{ flex: 1, background: `linear-gradient(90deg, ${tb[0]}, ${tb[1]})` }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 10px 12px' }}>
        {pill(mine, '1.2K')}
        <div style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800, color: '#3a1a5e', background: `linear-gradient(135deg, ${gold[0]}, ${gold[1]}, ${gold[2]})` }}>PK 04:12</div>
        {pill(theirs, '860')}
      </div>
    </div>
  )
}

/* PK battles: the switches (read-only here, changed in Application Config -> Release controls), the rules the server enforces, the last
   14 days and every recent battle. Needs the PK database work for the columns marked "(new)" and for saving the rules. */
export function PkBattles() {
  const toast = useToast()
  const sw = useAsyncData(getPkSwitches)
  const rules = useAsyncData(getPkRules)
  const battles = useAsyncData(() => listBattles(14))
  const look = useAsyncData(getPkTheme)
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [lookForm, setLookForm] = useState(null)
  const [lookBusy, setLookBusy] = useState(false)
  const v = form || rules.data || {}
  const set = (k, val) => setForm({ ...(form || rules.data), [k]: val })
  const lv = lookForm || look.data?.theme || PK_THEME_DEFAULT
  const setLook = (k, val) => setLookForm({ ...lv, [k]: val })

  const saveLook = async () => {
    setLookBusy(true)
    try {
      await savePkTheme(lv)
      toast('PK look saved. Running apps pick it up within a minute.')
      setLookForm(null)
      look.reload()
    } catch (e) {
      toast(e.message || 'Could not save the look')
    } finally {
      setLookBusy(false)
    }
  }

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

      <Card title="Look and colours" sub="How PK looks on every phone, audio and video alike. Running apps pick a change up within a minute, or when they are next opened. Needs a Master or Super Admin." className="mb-16">
        <AsyncView loading={look.loading} error={look.error} reload={look.reload}>
          {look.data?.available === false ? (
            <div className="muted">The PK look is not installed on this project yet: it needs the small database update 20261020100000. Until then phones use the built-in look.</div>
          ) : (
            <>
              <div className="form-grid">
                <ColorField label="My side (the host of the live being watched)" hint="The red side by default: its half of the audio arena, its score bar and sword, its video frame." value={lv.mine} onChange={(x) => setLook('mine', x)} />
                <ColorField label="Opponent side" hint="The blue side by default." value={lv.theirs} onChange={(x) => setLook('theirs', x)} />
                <ColorField label="Accent" hint="The clock pill, the VS and Starting labels, the WIN label. Gold by default." value={lv.accent} onChange={(x) => setLook('accent', x)} />
                <div className="field">
                  <label>Lose badge</label>
                  <select className="input" value={lv.lose_style} onChange={(e) => setLook('lose_style', e.target.value)}>
                    {LOSE_STYLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <span className="hint">What a host (or a spectator) sees when a side loses. WIN and DRAW always use their shield badges.</span>
                </div>
                <div className="full" style={{ marginTop: 4 }}>
                  <Toggle title="PK animations" desc="The animated bars, swords, 3-2-1, VS burst and result badges. Off: plain bars and text everywhere, for weak phones or if players report lag." checked={lv.animations} onChange={(x) => setLook('animations', x)} />
                  <Toggle title="Big intro before the countdown" desc="A full-screen red-versus-blue splash (about 4 seconds) plays behind the 3-2-1 and replaces the VS burst. Heavier on cheap phones: keep it off unless you want it." checked={lv.hero_intro} onChange={(x) => setLook('hero_intro', x)} />
                </div>
                <div className="field full">
                  <label>Preview</label>
                  <PkLookPreview theme={lv} />
                  <span className="hint">
                    The animated art is red and blue as shipped. A colour you choose turns its hue to yours
                    (the red art by {Math.round(hueShift(normalizeHex(lv.mine) || PK_THEME_DEFAULT.mine, 'mine'))}°, the blue art by {Math.round(hueShift(normalizeHex(lv.theirs) || PK_THEME_DEFAULT.theirs, 'theirs'))}°), so vivid colours work best:
                    pale, grey or very dark colours cannot be shown by turning a hue.
                  </span>
                </div>
              </div>
              <div className="hstack" style={{ marginTop: 14 }}>
                <Button variant="primary" icon={lookBusy ? 'refresh' : 'check'} disabled={lookBusy || !lookForm} onClick={saveLook}>{lookBusy ? 'Saving…' : 'Save the look'}</Button>
                {lookForm && <Button onClick={() => setLookForm(null)}>Discard</Button>}
                <Button onClick={() => setLookForm({ ...PK_THEME_DEFAULT })}>Use the built-in look</Button>
              </div>
            </>
          )}
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

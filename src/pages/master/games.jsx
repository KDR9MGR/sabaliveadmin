import { useState } from 'react'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, Badge, ConfirmDialog, useToast } from '../../components/ui.jsx'
import { numCol, imageCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import {
  getGamesSwitch, getGameConfig, updateGameConfig, listGameDays, listRecentGameTransactions, listWinnerGifting, listHostInflow, listMerchantGames, setGamesHidden,
  getSudSwitches, listSudGames, saveSudGame, deleteSudGame, setSudGamesHidden,
} from '../../lib/games.js'
import { presetOptions, checkSudGame, SUD_NOT_INSTALLED } from '../../lib/sudGames.js'
import { uploadMedia, UPLOAD_ACCEPT, UPLOAD_HINT } from '../../lib/storage.js'

const FIELDS = [
  { key: 'max_bet', label: 'Largest single bet (coins)', hint: '0 = no cap. A bigger bet is refused.' },
  { key: 'daily_loss_limit', label: 'Daily loss limit (coins)', hint: 'Net coins a person may lose in 24 hours; then new bets are refused. 0 = no limit.' },
  { key: 'daily_win_limit', label: 'Daily win limit (coins)', hint: 'Net coins a person may win in 24 hours; then new bets are refused. 0 = no limit.' },
  { key: 'max_payout_multiple', label: 'Largest payout, times the bets', hint: 'A win above this many times what the person bet on that game in the last 15 minutes is refused and kept for review.' },
  { key: 'session_hours', label: 'Launch lifetime (hours)', hint: 'How long the token a game launch carries stays valid.' },
  { key: 'min_age', label: 'Minimum age', hint: 'Checked on the date of birth in the profile; no date of birth = no play.' },
]

/* Tulasi games: the limits our server enforces, the day totals, every balance call, and the two reports for the
   "win in a game -> gift a host -> withdraw" route. The ON/OFF switch is in Application Config -> Release controls. */
export function Games() {
  const toast = useToast()
  const sw = useAsyncData(getGamesSwitch)
  const cfg = useAsyncData(getGameConfig)
  const catalog = useAsyncData(listMerchantGames)
  const days = useAsyncData(() => listGameDays(14))
  const txs = useAsyncData(() => listRecentGameTransactions(200))
  const winners = useAsyncData(() => listWinnerGifting(100))
  const inflow = useAsyncData(() => listHostInflow(100))
  const sudSwitches = useAsyncData(getSudSwitches)
  const sud = useAsyncData(listSudGames)
  const [sudForm, setSudForm] = useState(null) // null | { add: true } | a row being edited
  const [sudDelete, setSudDelete] = useState(null)
  const [form, setForm] = useState(null)
  const [bulk, setBulk] = useState(null) // 'hide' | 'show' while its confirmation is open
  const [busy, setBusy] = useState(false)
  const v = form || cfg.data || {}
  const set = (k, val) => setForm({ ...(form || cfg.data), [k]: val })

  // Hide / show games in the app from here. Tulasi's own on/off is separate, and a Sync never changes this.
  const toggleHidden = async (ids, hidden, doneText) => {
    setBusy(true)
    try {
      const n = await setGamesHidden(ids, hidden)
      toast(n ? doneText(n) : 'Nothing to change')
      catalog.reload()
    } catch (e) {
      toast(e.message || 'Could not change the games')
    } finally {
      setBusy(false)
      setBulk(null)
    }
  }
  const allIds = (catalog.data || []).map((g) => g.id)

  // SUD games: hide / show, switch on or off in the app, delete. A save sends every field again, so a status change reuses the row.
  const sudNotInstalled = SUD_NOT_INSTALLED.test(String(sud.error || ''))
  const sudAction = async (work, done) => {
    setBusy(true)
    try { await work(); toast(done); sud.reload() }
    catch (e) { toast(e.message || 'Could not change the game') }
    finally { setBusy(false) }
  }
  const sudSwitchStatus = (r) => sudAction(
    () => saveSudGame({ mgId: r.mgId, name: r.name, aspect: r.aspect, usesCoins: r.usesCoins, image: r.image, description: r.description, status: r.status === 'On' ? 0 : 1, sort: r.order }),
    r.status === 'On' ? `${r.name} is off` : `${r.name} is on`,
  )

  const save = async () => {
    setBusy(true)
    try {
      await updateGameConfig(v)
      toast('Game limits saved')
      setForm(null)
      cfg.reload()
    } catch (e) {
      toast(e.message || 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Games" crumbs={['Home', 'Platform', 'Games']} />
      <Card title="Switch" sub="Games are shown and playable only while this is on. Super Admin changes it in Application Config → Release controls (“Games”), which the app also reads." className="mb-16">
        <AsyncView loading={sw.loading} error={sw.error} reload={sw.reload}>
          <Badge tone={sw.data ? 'success' : 'muted'}>{sw.data ? 'Games are ON' : 'Games are OFF'}</Badge>
        </AsyncView>
      </Card>

      <Card
        title="SUD games"
        sub="Party games from SUD (Ludo, Domino, UNO-style cards, ...), shown next to the Tulasi games and played together in a live room. Add the games here AND in the SUD console (Application Management > your app > Add Games): a game must be in both. Switches: Application Config > Release controls (“SUD games”, “SUD coin games”)."
        className="mb-16"
        action={(
          <div className="hstack gap-8 wrap">
            <Button variant="primary" icon="plus" onClick={() => setSudForm({ add: true })} disabled={busy || sudNotInstalled}>Add game</Button>
            <Button icon="refresh" onClick={() => { sud.reload(); sudSwitches.reload() }}>Refresh</Button>
          </div>
        )}
      >
        <div className="card__body hstack gap-8 wrap" style={{ paddingBottom: 0 }}>
          <Badge tone={sudSwitches.data?.sud ? 'success' : 'muted'}>{sudSwitches.data?.sud ? 'SUD games are ON' : 'SUD games are OFF'}</Badge>
          <Badge tone={sudSwitches.data?.coins ? 'warning' : 'muted'}>{sudSwitches.data?.coins ? 'SUD coin games are ON' : 'SUD coin games are OFF'}</Badge>
          {sudSwitches.data && !sudSwitches.data.games && <Badge tone="danger">The main Games switch is off, so nothing shows</Badge>}
        </div>
        {sudNotInstalled ? (
          <div className="card__body muted" style={{ fontSize: 13 }}>SUD games need the database update <code>20261026110000_sud_games</code>, which has not been applied yet.</div>
        ) : (
          <AsyncView loading={sud.loading} error={sud.error} reload={sud.reload}>
            <DataTable
              rows={sud.data || []}
              searchKeys={['name', 'mgId']}
              filters={[{ label: 'In the app', options: ['Shown', 'Hidden by us', 'Off'], get: (r) => r.inApp }]}
              rowActions={(r) => [
                { label: 'Edit', icon: 'edit', onClick: () => setSudForm(r) },
                r.hidden
                  ? { label: 'Show in the app', icon: 'check', onClick: () => sudAction(() => setSudGamesHidden([r.id], false), `${r.name} is shown again`) }
                  : { label: 'Hide from the app', icon: 'x', onClick: () => sudAction(() => setSudGamesHidden([r.id], true), `${r.name} is hidden`) },
                { label: r.status === 'On' ? 'Turn off' : 'Turn on', icon: 'refresh', onClick: () => sudSwitchStatus(r) },
                { sep: true },
                { label: 'Delete', icon: 'trash', onClick: () => setSudDelete(r) },
              ]}
              columns={[
                imageCol('image', 'Picture'),
                { key: 'name', header: 'Name', sortable: true },
                { key: 'mgId', header: 'SUD game id', render: (r) => <span className="mono" style={{ fontSize: 12 }}>{r.mgId}</span> },
                { key: 'aspect', header: 'Height / width', sortable: true, render: (r) => (r.aspect == null ? <span className="muted">—</span> : <span className="mono">{r.aspect}</span>) },
                { key: 'usesCoins', header: 'Stakes coins', sortable: true, render: (r) => (r.usesCoins ? <Badge tone="warning">Coin game</Badge> : <span className="muted">No</span>) },
                { key: 'inApp', header: 'In the app', sortable: true, render: (r) => <Badge tone={r.inApp === 'Shown' ? 'success' : 'muted'}>{r.inApp}</Badge> },
                numCol('order', 'Order'),
              ]}
              emptyText="No SUD games yet. Press Add game and choose one from SUD's list."
            />
          </AsyncView>
        )}
      </Card>
      {sudForm && (
        <EntityForm
          title={sudForm.add ? 'Add a SUD game' : `Edit ${sudForm.name}`}
          savedMessage={sudForm.add ? 'Game added' : 'Game saved'}
          onClose={() => setSudForm(null)}
          initial={sudForm.add ? {} : {
            name: sudForm.name, aspect: sudForm.aspect ?? '', image: sudForm.image, description: sudForm.description,
            uses_coins: String(sudForm.usesCoins), status: sudForm.status === 'On' ? '1' : '0', sort: sudForm.order,
          }}
          fields={[
            ...(sudForm.add ? [
              { name: 'preset', label: "Game from SUD's list", type: 'picker', options: presetOptions(), full: true, placeholder: 'Search by name…',
                hint: 'Fills the name, the game id and the proportions. A game SUD added since is not in this list: type its id below instead.' },
              { name: 'mg_id', label: 'Or the SUD game id', placeholder: 'e.g. 1468180338417074177', full: true, hint: 'The long number from SUD\'s game list. Leave empty when you chose a game above.' },
            ] : []),
            { name: 'name', label: 'Name shown to players', full: true, hint: sudForm.add ? 'Leave empty to use SUD\'s name.' : undefined },
            { name: 'aspect', label: 'Height / width', type: 'number', step: 0.001, min: 0.25, max: 4, hint: '1 = square. SUD\'s minimum-size table gives it; the game panel is drawn at this height.' },
            { name: 'uses_coins', label: 'Stakes wallet coins', type: 'select', options: [{ value: 'false', label: 'No: a party game' }, { value: 'true', label: 'Yes: a coin game (18+, closed until the coin switch is on)' }],
              hint: sudForm.add ? 'Leave empty to use the suggestion for the chosen game.' : undefined },
            { name: 'image', label: 'Picture (optional)', type: 'image', accept: UPLOAD_ACCEPT, full: true, clearable: true,
              onUpload: (file) => uploadMedia('gift-assets', 'games', file), hint: `${UPLOAD_HINT}. Shown on the game's card; without one the app shows a placeholder.` },
            { name: 'description', label: 'Short description (optional)', type: 'textarea', full: true },
            { name: 'status', label: 'In the app', type: 'select', options: [{ value: '1', label: 'On' }, { value: '0', label: 'Off' }] },
            { name: 'sort', label: 'Order', type: 'number', min: 0, hint: 'Smaller comes first, after the Tulasi games. Default 1000.' },
          ]}
          onSubmit={async (v) => {
            const r = checkSudGame({ ...v, ...(sudForm.add ? {} : { mg_id: sudForm.mgId }) })
            if (r.error) throw new Error(r.error)
            await saveSudGame(r.game)
            sud.reload()
          }}
        />
      )}
      {sudDelete && (
        <ConfirmDialog
          danger busy={busy}
          title={`Delete ${sudDelete.name}?`}
          message="It disappears from the app. Coins already moved by this game stay in the ledger. You can add it again later."
          confirmLabel="Delete"
          onClose={() => setSudDelete(null)}
          onConfirm={async () => { await sudAction(() => deleteSudGame(sudDelete.id), `${sudDelete.name} deleted`); setSudDelete(null) }}
        />
      )}

      <Card
        title="Games received from Tulasi"
        sub="Every game the platform lists for us. What players see = on in Tulasi AND not hidden here. To add, rename or re-picture games, or switch one on or off at the platform, use the Tulasi dashboard and press “Sync Game List”: the app updates within a moment. Hiding a game here works at once and a Sync never undoes it."
        className="mb-16"
        action={(
          <div className="hstack gap-8 wrap">
            <Button onClick={() => setBulk('show')} disabled={busy || !allIds.length}>Show all</Button>
            <Button onClick={() => setBulk('hide')} disabled={busy || !allIds.length}>Hide all</Button>
            <Button icon="refresh" onClick={catalog.reload}>Refresh</Button>
          </div>
        )}
      >
        <AsyncView loading={catalog.loading} error={catalog.error} reload={catalog.reload}>
          <DataTable
            rows={catalog.data || []}
            searchKeys={['name', 'identification']}
            filters={[{ label: 'In the app', options: ['Shown', 'Hidden by us', 'Off in Tulasi'], get: (r) => r.inApp }]}
            rowActions={(r) => [r.hidden
              ? { label: 'Show in the app', icon: 'check', onClick: () => toggleHidden([r.id], false, () => `${r.name} is shown again`) }
              : { label: 'Hide from the app', icon: 'x', onClick: () => toggleHidden([r.id], true, () => `${r.name} is hidden`) }]}
            columns={[
              imageCol('image', 'Picture'),
              { key: 'name', header: 'Name', sortable: true },
              { key: 'identification', header: 'Game path', render: (r) => <span className="mono">{r.identification || '—'}</span> },
              { key: 'inApp', header: 'In the app', sortable: true, render: (r) => <Badge tone={r.inApp === 'Shown' ? 'success' : 'muted'}>{r.inApp}</Badge> },
              { key: 'status', header: 'In Tulasi', sortable: true },
              numCol('order', 'Order'),
              { key: 'updated', header: 'Last sync', sortable: true },
            ]}
            emptyText="Nothing received yet. In the Tulasi dashboard press “Sync Game List”."
          />
        </AsyncView>
      </Card>
      {bulk && (
        <ConfirmDialog
          title={bulk === 'hide' ? 'Hide all games?' : 'Show all games?'}
          message={bulk === 'hide'
            ? `All ${allIds.length} games disappear from the app and cannot be launched. Then show the ones you want one by one (menu on each row).`
            : `All ${allIds.length} games that are on in Tulasi become visible in the app.`}
          confirmLabel={bulk === 'hide' ? 'Hide all' : 'Show all'}
          danger={bulk === 'hide'}
          busy={busy}
          onClose={() => setBulk(null)}
          onConfirm={() => toggleHidden(allIds, bulk === 'hide', (n) => (bulk === 'hide' ? `${n} games hidden` : `${n} games shown`))}
        />
      )}

      <Card title="Limits the server enforces" sub="Applied to every balance call from the game platform. The platform itself decides the game rules (chips, win multiples, outcomes) in its own dashboard." className="mb-16">
        <AsyncView loading={cfg.loading} error={cfg.error} reload={cfg.reload}>
          <div className="form-grid">
            {FIELDS.map((f) => (
              <div className="field" key={f.key}>
                <label>{f.label}</label>
                <input className="input" type="number" min="0" step="1" value={v[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />
                <span className="hint">{f.hint}</span>
              </div>
            ))}
          </div>
          <div className="hstack" style={{ marginTop: 14 }}>
            <Button variant="primary" icon={busy ? 'refresh' : 'check'} disabled={busy || !form} onClick={save}>{busy ? 'Saving…' : 'Save'}</Button>
            {form && <Button onClick={() => setForm(null)}>Discard</Button>}
          </div>
        </AsyncView>
      </Card>

      <Card title="Last 14 days" sub="Coins bet and won by everyone. “House result” is bets minus wins: negative means players won more than they bet." className="mb-16">
        <AsyncView loading={days.loading} error={days.error} reload={days.reload}>
          <DataTable
            rows={days.data || []}
            pageSize={14}
            columns={[
              { key: 'day', header: 'Day (UTC)', sortable: true },
              numCol('players', 'Players'), numCol('bet', 'Bet'), numCol('won', 'Won'), numCol('house', 'House result'), numCol('rejected', 'Refused calls'),
            ]}
            emptyText="No game activity yet."
          />
        </AsyncView>
      </Card>

      <Card title="Watch: players who won and then gifted" sub="Game coins are normal coins, so winnings can be gifted to a host. People who were net winners in games on a day and gifted coins that day or the next." className="mb-16">
        <AsyncView loading={winners.loading} error={winners.error} reload={winners.reload}>
          <DataTable
            rows={winners.data || []}
            searchKeys={['player', 'displayId']}
            columns={[
              { key: 'day', header: 'Day (UTC)', sortable: true },
              { key: 'player', header: 'Player', sortable: true, render: (r) => <span>{r.player} <span className="mono muted">{r.displayId}</span></span> },
              numCol('gameNet', 'Won in games (net)'), numCol('gifted', 'Gifted'), numCol('receivers', 'To how many'),
            ]}
            emptyText="Nobody yet."
          />
        </AsyncView>
      </Card>

      <Card title="Watch: hosts receiving from game winners" sub="Per host and day: the part of the gifts received that came from people who were net winners in games that day. A high share is a reason to look before a withdrawal is approved." className="mb-16">
        <AsyncView loading={inflow.loading} error={inflow.error} reload={inflow.reload}>
          <DataTable
            rows={inflow.data || []}
            searchKeys={['host', 'displayId']}
            columns={[
              { key: 'day', header: 'Day (UTC)', sortable: true },
              { key: 'host', header: 'Host', sortable: true, render: (r) => <span>{r.host} <span className="mono muted">{r.displayId}</span></span> },
              numCol('received', 'Received'), numCol('fromWinners', 'From game winners'), numCol('share', 'Share', { suffix: '%' }), numCol('winnerSenders', 'Winners who gifted'),
            ]}
            emptyText="No gifts from game winners yet."
          />
        </AsyncView>
      </Card>

      <Card title="Every balance call (latest 200)" sub="What the platform asked us to do, and what we did. Refused calls show why.">
        <AsyncView loading={txs.loading} error={txs.error} reload={txs.reload}>
          <DataTable
            rows={txs.data || []}
            searchKeys={['player', 'displayId', 'game', 'transactionId']}
            filters={[{ label: 'Status', options: ['Ok', 'Rejected', 'Pending'], get: (r) => r.status }, { label: 'Kind', options: ['Bet', 'Win'], get: (r) => r.kind }]}
            columns={[
              { key: 'when', header: 'When' },
              { key: 'player', header: 'Player', sortable: true, render: (r) => <span>{r.player} <span className="mono muted">{r.displayId}</span></span> },
              { key: 'kind', header: 'Kind', sortable: true },
              { key: 'game', header: 'Game', sortable: true },
              numCol('coin', 'Coins'), numCol('balanceAfter', 'Balance after'),
              { key: 'status', header: 'Status', sortable: true },
              { key: 'reason', header: 'Why' },
            ]}
            emptyText="No balance calls yet."
          />
        </AsyncView>
      </Card>
    </>
  )
}

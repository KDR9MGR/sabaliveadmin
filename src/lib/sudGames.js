/* The panel's SUD games list: pure rules (tested in sudGames.test.js). The database side is sabalive migration 20261026110000 (sud_games, admin_save_sud_game, ...).
   A game is added by choosing it from SUD's own list (src/data/sudGames.js) or, for one SUD added since, by its game id. */
import { SUD_PRESETS } from '../data/sudGames.js'

export const presetOptions = () => SUD_PRESETS.map((p) => ({
  value: p.mgId,
  label: `${p.name} · ${p.players}${p.coins ? ' · may stake coins' : ''}`,
  search: `${p.name} ${p.mgId} ${p.players}`.toLowerCase(),
}))

export const presetById = (id) => SUD_PRESETS.find((p) => p.mgId === String(id || '').trim()) || null

const blank = (v) => v === undefined || v === null || String(v).trim() === ''

/* The add / edit form -> what is saved, or { error }. `form`: preset (a SUD game id from the list), mg_id (typed), name, aspect, image, description, uses_coins (true/false/''),
   status ('1' / '0'), sort. Anything left blank comes from the chosen preset, and a game with neither a preset nor an id is refused. */
export function checkSudGame(form) {
  const preset = presetById(form.preset)
  const mgId = String(blank(form.mg_id) ? (preset?.mgId || '') : form.mg_id).trim()
  if (!/^[0-9]{6,25}$/.test(mgId)) return { error: 'Choose a game from the list, or type its SUD game id (digits only)' }
  const known = presetById(mgId)
  const name = String(blank(form.name) ? (known?.name || '') : form.name).trim()
  if (name.length < 1 || name.length > 120) return { error: 'Give the game a name (up to 120 characters)' }
  let aspect = known?.aspect ?? null
  if (!blank(form.aspect)) {
    aspect = Number(form.aspect)
    if (!Number.isFinite(aspect) || aspect < 0.25 || aspect > 4) return { error: 'Height / width must be a number between 0.25 and 4 (1 = square)' }
  }
  const image = blank(form.image) ? '' : String(form.image).trim()
  if (image && !image.startsWith('https://')) return { error: 'The picture must be an https link (upload one)' }
  const description = blank(form.description) ? '' : String(form.description).trim().slice(0, 500)
  const usesCoins = form.uses_coins === true || form.uses_coins === 'true' ? true : form.uses_coins === false || form.uses_coins === 'false' ? false : !!known?.coins
  const status = String(form.status ?? '1') === '0' ? 0 : 1
  let sort = null
  if (!blank(form.sort)) {
    sort = Number(form.sort)
    if (!Number.isInteger(sort) || sort < 0 || sort > 100000) return { error: 'The order must be a whole number from 0 to 100000' }
  }
  return { game: { mgId, name, aspect, image, description, usesCoins, status, sort } }
}

/* What the table shows for a database row. */
export const sudGameRow = (g) => ({
  id: g.id,
  mgId: g.provider_game_id,
  name: g.name || '—',
  image: g.image_url || '',
  description: g.description || '',
  aspect: g.aspect == null ? null : Number(g.aspect),
  usesCoins: g.uses_coins === true,
  status: g.status === 1 ? 'On' : 'Off',
  hidden: g.hidden === true,
  inApp: g.status === 1 && g.hidden !== true ? 'Shown' : (g.hidden === true ? 'Hidden by us' : 'Off'),
  order: g.sort_order,
  updatedAt: g.updated_at,
})

/* The text when the database does not have the SUD games yet. */
export const SUD_NOT_INSTALLED = /sud_games|admin_save_sud_game|sud_launch_check|schema cache|does not exist/i

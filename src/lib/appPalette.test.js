import test from 'node:test'
import assert from 'node:assert/strict'
import { appPalette, parseTone, TONES, DEFAULT_TONE } from './appPalette.js'

/* Reference colours printed by the app's own AppPalette.fromBrand (sabalive/lib/theme/app_palette.dart) for several brands and every tone.
   The app works in floating point and the panel in 8-bit hex, so a channel may differ by 1 or 2. */
const REF = [
  ['#45d93a', '#5db65f', 'deep', { bg: '#081607', surface: '#143012', card: '#183816', stroke: '#294f27', primary: '#45d93a', primaryDeep: '#2fbc24', primaryBright: '#65e05c' }],
  ['#45d93a', '#5db65f', 'rich', { bg: '#11340f', bgElevated: '#143b11', surface: '#1a4417', surfaceAlt: '#1c4d18', card: '#1b4818', stroke: '#285925' }],
  ['#45d93a', '#5db65f', 'soft', { bg: '#1b4f17', bgElevated: '#1e5819', surface: '#245f20', surfaceAlt: '#266921', card: '#256120', stroke: '#357730' }],
  ['#7c3aed', '#f5279b', 'deep', { bg: '#0b0716', bgElevated: '#130c24', surface: '#1a1230', surfaceAlt: '#221743', card: '#1e1638', stroke: '#2e2352', primary: '#9b3df5', primaryDeep: '#6d28d9', primaryBright: '#b25cff' }],
  ['#7c3aed', '#f5279b', 'rich', { bg: '#371d63', bgElevated: '#3f2173', surface: '#47297a', surfaceAlt: '#512d8e', card: '#4c2c83', stroke: '#5d3d94', primary: '#9b3df5', primaryDeep: '#6d28d9', primaryBright: '#b25cff' }],
  ['#7c3aed', '#f5279b', 'soft', { bg: '#552c99', bgElevated: '#5c31a7', surface: '#6339aa', surfaceAlt: '#6e3dc1', card: '#673bb1', stroke: '#7a55b9' }],
  ['#2563eb', '#ffaa00', 'rich', { bg: '#192c55', bgElevated: '#1c3261', surface: '#233968', surfaceAlt: '#26417a', card: '#253c70', stroke: '#354e83', primary: '#2563eb', primaryDeep: '#134cca', primaryBright: '#4a7eee' }],
  ['#facc15', '#f5279b', 'soft', { bg: '#504517', surface: '#5e511f', card: '#625521', stroke: '#776830' }],
]

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

test('the panel preview gives the same colours as the app, for every tone', () => {
  for (const [brand, accent, tone, want] of REF) {
    const got = appPalette(brand, accent, tone)
    for (const [name, hex] of Object.entries(want)) {
      const a = channels(got[name]), b = channels(hex)
      a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) <= 2, `${brand} ${tone} ${name}: panel ${got[name]} vs app ${hex}`))
    }
  }
})

test('the default brand with the Deep tone is exactly the original palette', () => {
  const p = appPalette('#7c3aed', '#f5279b', 'deep')
  assert.equal(p.bg, '#0b0716')
  assert.equal(p.primary, '#9b3df5')
})

test('the default tone is Rich, and an unknown or empty tone means Rich', () => {
  assert.equal(DEFAULT_TONE, 'rich')
  for (const v of [undefined, null, '', 'sideways']) assert.equal(parseTone(v), 'rich')
  assert.equal(parseTone(' SOFT '), 'soft')
  assert.deepEqual(appPalette('#45d93a', '#5db65f'), appPalette('#45d93a', '#5db65f', 'rich'))
})

test('every tone is brighter than the one before it, and no tone but Deep is near black', () => {
  const y = (hex) => channels(hex).reduce((s, c, i) => s + [0.2126, 0.7152, 0.0722][i] * (c / 255), 0)
  const bgs = TONES.map((t) => y(appPalette('#45d93a', '#5db65f', t).bg))
  assert.ok(bgs[0] < bgs[1] && bgs[1] < bgs[2], bgs.join(' < '))
  assert.ok(channels(appPalette('#45d93a', '#5db65f', 'rich').bg)[1] > 45, 'the Rich green background is a real green')
})

test('a grey or white brand keeps neutral backgrounds in every tone', () => {
  for (const tone of TONES) {
    const [r, g, b] = channels(appPalette('#ffffff', '#f5279b', tone).bg)
    assert.ok(Math.max(r, g, b) - Math.min(r, g, b) <= 3, `${tone}: ${r},${g},${b}`)
  }
})

test('while a colour is being typed there is no preview', () => {
  assert.equal(appPalette('#45d9', '#5db65f'), null)
})

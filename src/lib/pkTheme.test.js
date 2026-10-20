import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PK_THEME_DEFAULT, normalizeHex, readPkTheme, isDefaultTheme, checkPkTheme, hueOf, hueShift, halfColors, barColors, accentGradient,
} from './pkTheme.js'

test('colours are accepted in any common spelling and kept as #rrggbb in lower case', () => {
  assert.equal(normalizeHex('#FF2D55'), '#ff2d55')
  assert.equal(normalizeHex('ff2d55'), '#ff2d55')
  assert.equal(normalizeHex(' #abc '), '#aabbcc')
  for (const bad of ['red', '#12', '#12345', '#gg0000', '', null, undefined, 5, '#1234567']) assert.equal(normalizeHex(bad), null, String(bad))
})

test('a saved value is read leniently: anything missing or unreadable keeps the default', () => {
  assert.deepEqual(readPkTheme(null), PK_THEME_DEFAULT)
  assert.deepEqual(readPkTheme([1]), PK_THEME_DEFAULT)
  assert.deepEqual(readPkTheme('x'), PK_THEME_DEFAULT)
  assert.deepEqual(readPkTheme({ mine: 'red', theirs: 5, animations: 'yes', hero_intro: 1, lose_style: 'sad' }), PK_THEME_DEFAULT)
  const t = readPkTheme({ mine: '#00FF00', animations: false, hero_intro: true, lose_style: 'emoji' })
  assert.equal(t.mine, '#00ff00')
  assert.equal(t.theirs, PK_THEME_DEFAULT.theirs)
  assert.equal(t.animations, false)
  assert.equal(t.hero_intro, true)
  assert.equal(t.lose_style, 'emoji')
})

test('the built-in look is the default and saves as nothing (it clears the column)', () => {
  assert.equal(isDefaultTheme(PK_THEME_DEFAULT), true)
  assert.deepEqual(checkPkTheme(PK_THEME_DEFAULT), { theme: null })
  assert.equal(isDefaultTheme({ ...PK_THEME_DEFAULT, hero_intro: true }), false)
})

test('a changed look is checked and returned whole, normalised', () => {
  const r = checkPkTheme({ mine: '#00C853', theirs: '#2D6BFF', accent: 'ffc93c', animations: false, hero_intro: true, lose_style: 'emoji' })
  assert.deepEqual(r, { theme: { mine: '#00c853', theirs: '#2d6bff', accent: '#ffc93c', animations: false, hero_intro: true, lose_style: 'emoji' } })
})

test('a bad colour or style is refused with a sentence that names it', () => {
  assert.match(checkPkTheme({ ...PK_THEME_DEFAULT, mine: 'red' }).error, /My side colour/)
  assert.match(checkPkTheme({ ...PK_THEME_DEFAULT, theirs: '#12' }).error, /Opponent side colour/)
  assert.match(checkPkTheme({ ...PK_THEME_DEFAULT, accent: '' }).error, /Accent colour/)
  assert.match(checkPkTheme({ ...PK_THEME_DEFAULT, lose_style: 'sad' }).error, /lose badge/i)
})

test('hue and the turn of the animation art match the app', () => {
  assert.equal(Math.round(hueOf('#00c853')), 145)
  assert.equal(Math.round(hueOf('#9c27b0')), 291)
  assert.equal(hueShift('#ff2d55', 'mine'), 0, 'the built-in colours show the art as it is')
  assert.equal(hueShift('#2d6bff', 'theirs'), 0)
  assert.equal(Math.round(hueShift('#00c853', 'mine')), 142)
  assert.equal(Math.round(hueShift('#9c27b0', 'mine')), -72)
  assert.equal(Math.round(hueShift('#ff9800', 'theirs')), -167)
  for (const hex of ['#00c853', '#ff9800', '#9c27b0', '#2d6bff']) {
    for (const team of ['mine', 'theirs']) assert.ok(Math.abs(hueShift(hex, team)) <= 180, `${hex} ${team}`)
  }
})

test('the built-in halves, bars and gradient are exactly what the app had', () => {
  assert.deepEqual(halfColors('#ff2d55', 'mine'), ['#b1122b', '#3a0a16'])
  assert.deepEqual(halfColors('#2d6bff', 'theirs'), ['#11489b', '#0a1b3a'])
  assert.deepEqual(barColors('#ff2d55', 'mine'), ['#ff2d55', '#ff7a9c'])
  assert.deepEqual(barColors('#2d6bff', 'theirs'), ['#9cc6ff', '#2d6bff'])
  assert.deepEqual(accentGradient('#ffc93c'), ['#ffe08a', '#ffc93c', '#f5a623'])
})

test('a chosen colour gets a lighter top and a darker bottom of its own hue; the bar and gradient follow it', () => {
  const [top, bottom] = halfColors('#00c853', 'mine')
  assert.notEqual(top, '#b1122b')
  assert.ok(Math.abs(hueOf(top) - 145) < 8)
  assert.ok(Math.abs(hueOf(bottom) - 145) < 8)
  const lum = (hex) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16)
  assert.ok(lum(top) > lum(bottom), 'light above, dark below')
  assert.equal(barColors('#00c853', 'mine')[0], '#00c853')
  assert.equal(barColors('#ff9800', 'theirs')[1], '#ff9800')
  const g = accentGradient('#aa00ff')
  assert.equal(g.length, 3)
  assert.equal(g[1], '#aa00ff')
})

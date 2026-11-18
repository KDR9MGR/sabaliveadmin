import test from 'node:test'
import assert from 'node:assert/strict'
import {
  checkProduct, formFromProduct, toggleKind, orderBenefits, vipError, kindGives, kindDoes, vipKind,
  OWN_PICTURE, wantsOwnPicture, acceptFor, VIP_EFFECT_ACCEPT, withPicture,
  VIP_KINDS, VIP_KIND_KEYS, VIP_CUSTOM, VIP_REMOVED_KINDS, VIP_TIERS, tierLabel, VIP_NAME_MAX, VIP_TAGLINE_MAX, VIP_MAX_BENEFITS, VIP_MAX_DAYS,
} from './vipProducts.js'

const PIC = 'https://abc123.supabase.co/storage/v1/object/public/gift-assets/vip/crest.png'
const ok = { name: 'VIP1', tagline: 'Start here', badge_url: PIC, price_coins: 2000000, duration_days: 30, status: 'active', sort_order: 1, benefits: [] }

test('a good product is trimmed and normalised', () => {
  const r = checkProduct({ ...ok, name: '  VIP1 ', tagline: '  ', badge_url: '', price_coins: '2000000', duration_days: '30', sort_order: '' })
  assert.deepEqual(r, { product: { name: 'VIP1', tagline: null, badge_url: null, price_coins: 2000000, duration_days: 30, status: 'active', sort_order: 0, tier: 'vip', benefits: [] } })
})

test('the name is needed and limited; characters count, not bytes', () => {
  assert.match(checkProduct({ ...ok, name: '   ' }).error, /name/i)
  assert.match(checkProduct({ ...ok, name: 'a'.repeat(VIP_NAME_MAX + 1) }).error, /at most 40/)
  assert.equal(checkProduct({ ...ok, name: '👑'.repeat(VIP_NAME_MAX) }).error, undefined)
  assert.match(checkProduct({ ...ok, tagline: 'a'.repeat(VIP_TAGLINE_MAX + 1) }).error, /at most 120/)
})

test('the price is a whole number of coins, at least 1', () => {
  for (const bad of ['', '0', '-5', '1.5', 'abc', null, undefined]) assert.match(checkProduct({ ...ok, price_coins: bad }).error, /price/i, String(bad))
  assert.equal(checkProduct({ ...ok, price_coins: 1 }).error, undefined)
})

test('the days are a whole number from 1 to 3650', () => {
  for (const bad of ['', '0', '-1', '2.5', String(VIP_MAX_DAYS + 1), 'x']) assert.match(checkProduct({ ...ok, duration_days: bad }).error, /days/i, String(bad))
  assert.equal(checkProduct({ ...ok, duration_days: VIP_MAX_DAYS }).error, undefined)
  assert.equal(checkProduct({ ...ok, duration_days: 1 }).error, undefined)
})

test('the order must be whole; an unknown status becomes active', () => {
  assert.match(checkProduct({ ...ok, sort_order: 1.5 }).error, /whole number/)
  assert.equal(checkProduct({ ...ok, status: 'banana' }).product.status, 'active')
  assert.equal(checkProduct({ ...ok, status: 'inactive' }).product.status, 'inactive')
})

test('the badge must be an uploaded file when there is one', () => {
  assert.match(checkProduct({ ...ok, badge_url: 'crest.png' }).error, /uploaded/)
  assert.equal(checkProduct({ ...ok, badge_url: PIC }).product.badge_url, PIC)
})

test('benefits: kinds are lower-cased, blanks become null, the order is kept', () => {
  const r = checkProduct({
    ...ok,
    benefits: [
      { kind: ' Anti_Kick ', title: ' ', image_url: '', link_item_id: '' },
      { kind: 'identity', title: 'Crest', image_url: PIC, link_item_id: '' },
      { kind: VIP_CUSTOM, title: ' Golden mic ', image_url: '', link_item_id: '' },
    ],
  })
  assert.deepEqual(r.product.benefits, [
    { kind: 'anti_kick', title: null, image_url: null, link_item_id: null },
    { kind: 'identity', title: 'Crest', image_url: PIC, link_item_id: null },
    { kind: 'custom', title: 'Golden mic', image_url: null, link_item_id: null },
  ])
})

test('benefit mistakes are refused with a sentence', () => {
  assert.match(checkProduct({ ...ok, benefits: [{ kind: '' }] }).error, /kind/i)
  assert.match(checkProduct({ ...ok, benefits: [{ kind: 'Bad Kind!' }] }).error, /kind/i)
  assert.match(checkProduct({ ...ok, benefits: [{ kind: VIP_CUSTOM, title: '  ' }] }).error, /custom benefit/i)
  assert.match(checkProduct({ ...ok, benefits: [{ kind: 'anti_ban', title: 'a'.repeat(41) }] }).error, /at most 40/)
  assert.match(checkProduct({ ...ok, benefits: [{ kind: 'anti_ban' }, { kind: 'anti_ban' }] }).error, /twice/)
  assert.match(checkProduct({ ...ok, benefits: [{ kind: 'theme', image_url: 'x.png' }] }).error, /uploaded/)
})

test('several custom benefits are fine (only fixed kinds must be unique)', () => {
  const r = checkProduct({ ...ok, benefits: [{ kind: VIP_CUSTOM, title: 'A' }, { kind: VIP_CUSTOM, title: 'B' }] })
  assert.equal(r.error, undefined)
  assert.equal(r.product.benefits.length, 2)
})

test('at most 40 benefits', () => {
  const many = Array.from({ length: VIP_MAX_BENEFITS + 1 }, (_, i) => ({ kind: VIP_CUSTOM, title: `B${i}` }))
  assert.match(checkProduct({ ...ok, benefits: many }).error, /at most 40/)
  assert.equal(checkProduct({ ...ok, benefits: many.slice(0, VIP_MAX_BENEFITS) }).error, undefined)
})

test('only the kinds that give a Store item can be linked to one', () => {
  const item = '51000000-0000-0000-0000-000000000001'
  assert.equal(checkProduct({ ...ok, benefits: [{ kind: 'avatar_frame', link_item_id: item }] }).product.benefits[0].link_item_id, item)
  assert.equal(checkProduct({ ...ok, benefits: [{ kind: 'entry_effect', link_item_id: item }] }).product.benefits[0].link_item_id, item)
  assert.equal(checkProduct({ ...ok, benefits: [{ kind: 'theme', link_item_id: item }] }).product.benefits[0].link_item_id, item)
  assert.match(checkProduct({ ...ok, benefits: [{ kind: 'anti_kick', link_item_id: item }] }).error, /can give a Store item/)
  assert.match(checkProduct({ ...ok, benefits: [{ kind: 'comment_box', link_item_id: item }] }).error, /can give a Store item/, 'a kind that works by itself has nothing to link')
  assert.match(checkProduct({ ...ok, benefits: [{ kind: VIP_CUSTOM, title: 'X', link_item_id: item }] }).error, /can give a Store item/)
})

test('the fixed list is the one the app has: 18 kinds, unique keys, valid shape, custom is not one of them', () => {
  assert.deepEqual(VIP_KIND_KEYS, [
    'identity', 'entry_effect', 'vehicle', 'avatar_frame', 'comment_box', 'special_gift', 'theme', 'hide_country', 'short_profile_decoration',
    'special_global_gift_effect', 'colourful_user_name', 'video_call_frame', 'high_speed_upgrade', 'higher_rank', 'daily_check_in', 'guardian', 'anti_kick', 'anti_ban',
  ])
  assert.equal(new Set(VIP_KIND_KEYS).size, VIP_KIND_KEYS.length)
  for (const k of VIP_KINDS) {
    assert.match(k.key, /^[a-z][a-z0-9_]{1,39}$/)
    assert.ok(k.label.length > 0)
  }
  assert.ok(!VIP_KIND_KEYS.includes(VIP_CUSTOM))
})

test('four kinds give an item (a picture, or a Store item of their category); identity gives the badge; five work by themselves; the rest are listed only', () => {
  assert.deepEqual(VIP_KINDS.filter((k) => k.link).map((k) => [k.key, k.link]), [
    ['entry_effect', 'entry_effect'], ['vehicle', 'vehicle'], ['avatar_frame', 'frame'], ['theme', 'room_skin'],
  ])
  assert.deepEqual(VIP_KINDS.filter((k) => kindGives(k.key)).map((k) => k.key), ['identity', 'entry_effect', 'vehicle', 'avatar_frame', 'theme'])
  assert.deepEqual(VIP_KINDS.filter((k) => kindDoes(k.key)).map((k) => k.key), ['comment_box', 'hide_country', 'short_profile_decoration', 'colourful_user_name', 'high_speed_upgrade'],
    'the same five the app draws or the server applies (sabalive vip_kinds.dart, `does`)')
  for (const k of VIP_KINDS) assert.ok(!(kindGives(k.key) && kindDoes(k.key)), `${k.key} is either a Store item or works by itself`)
  assert.equal(kindGives('anti_kick'), false)
  assert.equal(kindDoes('anti_kick'), false)
  assert.equal(kindGives('nope'), false)
  assert.equal(vipKind('nope'), null)
})

test('Join Entry Effect is gone (owner, 2026-11-16): not in the list, dropped from a saved product, never refused', () => {
  assert.deepEqual(VIP_REMOVED_KINDS, ['join_entry_effect'])
  assert.ok(!VIP_KIND_KEYS.includes('join_entry_effect'))
  const r = checkProduct({ ...ok, benefits: [{ kind: 'entry_effect', image_url: PIC }, { kind: 'join_entry_effect', image_url: PIC }, { kind: 'JOIN_ENTRY_EFFECT', link_item_id: '51000000-0000-0000-0000-00000000000a' }] })
  assert.equal(r.error, undefined)
  assert.deepEqual(r.product.benefits.map((b) => b.kind), ['entry_effect'], 'an old product that still has one saves cleanly, without it')
  // the form never shows it, and a product row that has one loads without it
  const f = formFromProduct({ name: 'VIP1', price_coins: 1, benefits: [{ kind: 'join_entry_effect', sort_order: 0 }, { kind: 'entry_effect', sort_order: 1, image_url: PIC }] })
  assert.deepEqual(f.benefits.map((b) => b.kind), ['entry_effect'])
  assert.deepEqual(orderBenefits([{ kind: 'join_entry_effect' }, { kind: 'identity' }]).map((b) => b.kind), ['identity'])
})

test('the tier is VIP or SVIP, VIP by default, and any other word is a VIP', () => {
  assert.deepEqual(VIP_TIERS.map((t) => t.value), ['vip', 'svip'])
  assert.equal(tierLabel('svip'), 'SVIP')
  assert.equal(tierLabel('vip'), 'VIP')
  assert.equal(tierLabel(undefined), 'VIP')
  assert.equal(checkProduct({ ...ok }).product.tier, 'vip')
  assert.equal(checkProduct({ ...ok, tier: 'svip' }).product.tier, 'svip')
  assert.equal(checkProduct({ ...ok, tier: 'gold' }).product.tier, 'vip')
  assert.equal(formFromProduct({ name: 'S', tier: 'svip' }).tier, 'svip')
  assert.equal(formFromProduct({ name: 'V' }).tier, 'vip')
  assert.equal(formFromProduct(null).tier, 'vip')
})

test('editing: a product row becomes form values, benefits in their saved order', () => {
  const f = formFromProduct({
    name: 'VIP2', tagline: null, badge_url: null, price_coins: 5, duration_days: 7, status: 'inactive', sort_order: 3,
    benefits: [{ kind: 'theme', sort_order: 2, title: null, image_url: null, link_item_id: null }, { kind: 'identity', sort_order: 1, title: 'Crest', image_url: PIC, link_item_id: null }],
  })
  assert.equal(f.tagline, '')
  assert.equal(f.status, 'inactive')
  assert.deepEqual(f.benefits.map((b) => b.kind), ['identity', 'theme'])
  assert.equal(f.benefits[0].title, 'Crest')
  assert.equal(formFromProduct(null).duration_days, 30)
})

test('ticking a kind adds it once and unticking removes it; custom entries are left alone', () => {
  let list = [{ kind: VIP_CUSTOM, title: 'Mic', image_url: '', link_item_id: '' }]
  list = toggleKind(list, 'anti_kick')
  assert.deepEqual(list.map((b) => b.kind), ['custom', 'anti_kick'])
  list = toggleKind(list, 'anti_kick')
  assert.deepEqual(list.map((b) => b.kind), ['custom'])
})

test('the benefits are ordered as the app shows them: fixed kinds in list order, then unknown ones, then custom ones in the order added', () => {
  const b = (kind, title = '') => ({ kind, title, image_url: '', link_item_id: '' })
  const ordered = orderBenefits([b('custom', 'Z'), b('anti_ban'), b('future_kind'), b('identity'), b('custom', 'A'), b('theme')])
  assert.deepEqual(ordered.map((x) => x.kind + (x.title || '')), ['identity', 'theme', 'anti_ban', 'future_kind', 'customZ', 'customA'])
})

test('server messages become sentences', () => {
  assert.match(vipError(new Error('Only a Master or Super Admin can manage VIP products')), /Master or Super Admin/)
  assert.match(vipError(new Error('permission denied for table vip_products')), /do not have access/)
  assert.match(vipError(new Error('Could not find the function public.admin_save_vip_product in the schema cache')), /20261106120000/)
  assert.equal(vipError(new Error('The price must be at least 1 coin')), 'The price must be at least 1 coin')
})

/* "Use the picture above" (owner, 2026-11-14): a benefit's own picture becomes a vip_only Store item that the purchase gives and puts on (sabalive migration 20261114120000). */
const PIC2 = 'https://abc123.supabase.co/storage/v1/object/public/gift-assets/vip/frame.svga'
const own = (kind, extra = {}) => ({ kind, title: '', image_url: PIC2, link_item_id: OWN_PICTURE, ...extra })
const prod = (benefits) => ({ ...ok, name: 'Royal', benefits })

test('the placeholder is recognised', () => {
  assert.equal(OWN_PICTURE, '__picture__')
  assert.equal(wantsOwnPicture({ link_item_id: OWN_PICTURE }), true)
  assert.equal(wantsOwnPicture({ link_item_id: '51000000-0000-0000-0000-000000000001' }), false)
  assert.equal(wantsOwnPicture({ link_item_id: '' }), false)
  assert.equal(wantsOwnPicture(null), false)
})

test('a benefit that uses its own picture goes to the database as use_picture, never as a link; a normal link has no such flag', () => {
  const r = checkProduct(prod([own('avatar_frame'), { kind: 'vehicle', title: '', image_url: '', link_item_id: '51000000-0000-0000-0000-000000000001' }]))
  assert.equal(r.error, undefined)
  assert.deepEqual(r.product.benefits[0], { kind: 'avatar_frame', title: null, image_url: PIC2, link_item_id: null, use_picture: true })
  assert.deepEqual(r.product.benefits[1], { kind: 'vehicle', title: null, image_url: null, link_item_id: '51000000-0000-0000-0000-000000000001' })
  assert.ok(!('use_picture' in r.product.benefits[1]))
  assert.ok(!JSON.stringify(r.product).includes(OWN_PICTURE), 'the placeholder never leaves the form')
})

test('the benefit\'s own item (made by an earlier save) is sent along, so the database changes it in place', () => {
  const item = '51000000-0000-0000-0000-0000000000aa'
  assert.equal(checkProduct(prod([own('theme', { own_item_id: item })])).product.benefits[0].link_item_id, item)
  assert.equal(checkProduct(prod([own('theme', { own_item_id: item })])).product.benefits[0].use_picture, true)
})

test('"Use the picture above" needs the picture, in a sentence that names the benefit; and only the kinds that can have an item', () => {
  assert.match(checkProduct(prod([own('avatar_frame', { image_url: '' })])).error, /"Avatar Frame": add its picture first/)
  assert.match(checkProduct(prod([own('vehicle', { image_url: 'http://example.com/x.png' })])).error, /must be an uploaded file/)
  assert.match(checkProduct(prod([own('anti_kick')])).error, /can give a Store item/)
  assert.match(checkProduct(prod([own('comment_box')])).error, /can give a Store item/)
})

test('the picture IS the item (owner, 2026-11-16): an item kind with a picture and no Store item makes its own item, with nothing else to choose', () => {
  const r = checkProduct(prod([
    { kind: 'entry_effect', title: '', image_url: PIC2, link_item_id: '' },
    { kind: 'vehicle', title: '', image_url: PIC2 },
    { kind: 'theme', title: '', image_url: PIC2, link_item_id: OWN_PICTURE },
  ]))
  assert.equal(r.error, undefined)
  for (const b of r.product.benefits) {
    assert.equal(b.use_picture, true, b.kind)
    assert.equal(b.link_item_id, null, b.kind)
    assert.equal(b.image_url, PIC2, b.kind)
  }
})

test('a Store item picked on purpose is used as it is, and a picture with it is only the benefit\'s picture on the VIP page', () => {
  const store = '51000000-0000-0000-0000-000000000001'
  const r = checkProduct(prod([{ kind: 'entry_effect', title: '', image_url: PIC2, link_item_id: store }]))
  assert.deepEqual(r.product.benefits[0], { kind: 'entry_effect', title: null, image_url: PIC2, link_item_id: store })
})

test('an item kind with no picture and no Store item is only listed, and gives nothing', () => {
  const r = checkProduct(prod([{ kind: 'entry_effect', title: '', image_url: '', link_item_id: '' }, { kind: 'avatar_frame' }]))
  assert.deepEqual(r.product.benefits.map((b) => [b.kind, b.use_picture ?? false, b.link_item_id]), [['entry_effect', false, null], ['avatar_frame', false, null]])
})

test('only the kinds that give an item take a picture as the item: a kind that works by itself keeps its picture as decoration, never as an item', () => {
  const r = checkProduct(prod([{ kind: 'comment_box', title: '', image_url: PIC2, link_item_id: '' }, { kind: 'identity', image_url: PIC2 }]))
  assert.equal(r.error, undefined)
  for (const b of r.product.benefits) assert.ok(!('use_picture' in b), b.kind)
})

test('loading a product: a benefit whose item was made from its picture shows as "Use the picture above" and remembers the item; a Store link stays a Store link; saving it again round-trips', () => {
  const item = '51000000-0000-0000-0000-0000000000aa'
  const store = '51000000-0000-0000-0000-000000000001'
  const form = formFromProduct({
    name: 'Royal', price_coins: 1000, duration_days: 30,
    benefits: [
      { kind: 'avatar_frame', image_url: PIC2, link_item_id: item, link_vip_only: true, sort_order: 0 },
      { kind: 'vehicle', image_url: '', link_item_id: store, link_vip_only: false, sort_order: 1 },
      { kind: 'comment_box', image_url: '', link_item_id: '', sort_order: 2 },
    ],
  })
  assert.deepEqual(form.benefits[0], { kind: 'avatar_frame', title: '', image_url: PIC2, link_item_id: OWN_PICTURE, own_item_id: item })
  assert.equal(form.benefits[1].link_item_id, store)
  assert.ok(!('own_item_id' in form.benefits[1]))
  const again = checkProduct({ ...form, price_coins: 1000, status: 'active', sort_order: 0 })
  assert.equal(again.error, undefined)
  assert.deepEqual(again.product.benefits[0], { kind: 'avatar_frame', title: null, image_url: PIC2, link_item_id: item, use_picture: true })
  assert.equal(again.product.benefits[1].link_item_id, store)
})

test('the picture box of the effect kinds also takes an MP4; the others do not', () => {
  for (const k of ['entry_effect', 'vehicle']) assert.equal(acceptFor(k), VIP_EFFECT_ACCEPT, k)
  for (const k of ['avatar_frame', 'theme', 'comment_box']) assert.ok(!/mp4/.test(acceptFor(k)), k)
  assert.match(VIP_EFFECT_ACCEPT, /\.mp4/)
  assert.match(VIP_EFFECT_ACCEPT, /\.svga/)
})

test('a new picture replaces the Store item an older product still gives; removing it leaves the item; its own picture just changes (the Store picker is gone, 2026-11-18)', () => {
  const store = '51000000-0000-0000-0000-000000000001'
  assert.deepEqual(withPicture({ link_item_id: store }, PIC2), { image_url: PIC2, link_item_id: '' })
  assert.deepEqual(withPicture({ link_item_id: store }, ''), { image_url: '' })
  assert.deepEqual(withPicture({ link_item_id: OWN_PICTURE, own_item_id: store }, PIC2), { image_url: PIC2 })
  assert.deepEqual(withPicture({ link_item_id: '' }, PIC2), { image_url: PIC2 })
  // saved after the swap, the picture is the item and the older Store item is no longer sent
  const r = checkProduct(prod([{ kind: 'entry_effect', title: '', image_url: PIC2, link_item_id: store, ...withPicture({ link_item_id: store }, PIC2) }]))
  assert.deepEqual(r.product.benefits[0], { kind: 'entry_effect', title: null, image_url: PIC2, link_item_id: null, use_picture: true })
})

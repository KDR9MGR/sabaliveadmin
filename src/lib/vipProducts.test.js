import test from 'node:test'
import assert from 'node:assert/strict'
import {
  checkProduct, formFromProduct, toggleKind, orderBenefits, vipError, kindGives, vipKind,
  VIP_KINDS, VIP_KIND_KEYS, VIP_CUSTOM, VIP_NAME_MAX, VIP_TAGLINE_MAX, VIP_MAX_BENEFITS, VIP_MAX_DAYS,
} from './vipProducts.js'

const PIC = 'https://abc123.supabase.co/storage/v1/object/public/gift-assets/vip/crest.png'
const ok = { name: 'VIP1', tagline: 'Start here', badge_url: PIC, price_coins: 2000000, duration_days: 30, status: 'active', sort_order: 1, benefits: [] }

test('a good product is trimmed and normalised', () => {
  const r = checkProduct({ ...ok, name: '  VIP1 ', tagline: '  ', badge_url: '', price_coins: '2000000', duration_days: '30', sort_order: '' })
  assert.deepEqual(r, { product: { name: 'VIP1', tagline: null, badge_url: null, price_coins: 2000000, duration_days: 30, status: 'active', sort_order: 0, benefits: [] } })
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
  assert.match(checkProduct({ ...ok, benefits: [{ kind: 'anti_kick', link_item_id: item }] }).error, /can give a Store item/)
  assert.match(checkProduct({ ...ok, benefits: [{ kind: VIP_CUSTOM, title: 'X', link_item_id: item }] }).error, /can give a Store item/)
})

test('the fixed list is the one the app has: 19 kinds, unique keys, valid shape, custom is not one of them', () => {
  assert.deepEqual(VIP_KIND_KEYS, [
    'identity', 'entry_effect', 'vehicle', 'avatar_frame', 'join_entry_effect', 'comment_box', 'special_gift', 'theme', 'hide_country', 'short_profile_decoration',
    'special_global_gift_effect', 'colourful_user_name', 'video_call_frame', 'high_speed_upgrade', 'higher_rank', 'daily_check_in', 'guardian', 'anti_kick', 'anti_ban',
  ])
  assert.equal(new Set(VIP_KIND_KEYS).size, VIP_KIND_KEYS.length)
  for (const k of VIP_KINDS) {
    assert.match(k.key, /^[a-z][a-z0-9_]{1,39}$/)
    assert.ok(k.label.length > 0)
  }
  assert.ok(!VIP_KIND_KEYS.includes(VIP_CUSTOM))
})

test('four kinds link to a Store category and give it; identity gives the badge; the rest are listed only', () => {
  assert.deepEqual(VIP_KINDS.filter((k) => k.link).map((k) => [k.key, k.link]), [
    ['entry_effect', 'entry_effect'], ['vehicle', 'vehicle'], ['avatar_frame', 'frame'], ['theme', 'room_skin'],
  ])
  assert.deepEqual(VIP_KINDS.filter((k) => kindGives(k.key)).map((k) => k.key), ['identity', 'entry_effect', 'vehicle', 'avatar_frame', 'theme'])
  assert.equal(kindGives('anti_kick'), false)
  assert.equal(kindGives('nope'), false)
  assert.equal(vipKind('nope'), null)
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

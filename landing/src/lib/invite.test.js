import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanInviteCode, platformFor, playStoreUrl, inviteTarget, INVITE_CODE_MAX } from './invite.js'

const PLAY = 'https://play.google.com/store/apps/details?id=com.sabalive.in'
const links = { android: PLAY, ios: null }

test('the code keeps letters, digits, _ and - and nothing that could break a link', () => {
  assert.equal(cleanInviteCode('ABC123'), 'ABC123')
  assert.equal(cleanInviteCode('ab_c-9'), 'ab_c-9')
  assert.equal(cleanInviteCode('A B&c=1/../x?y#z'), 'ABc1xyz')
  assert.equal(cleanInviteCode(undefined), '')
  assert.equal(cleanInviteCode('x'.repeat(100)).length, INVITE_CODE_MAX)
})

test('phones are told apart by what they say about themselves', () => {
  assert.equal(platformFor('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/126'), 'android')
  assert.equal(platformFor('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Safari/604.1'), 'ios')
  assert.equal(platformFor('Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X)'), 'ios')
  assert.equal(platformFor('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/126'), 'desktop')
  assert.equal(platformFor(''), 'desktop')
})

test('the Play link carries the code as the install referrer', () => {
  const url = new URL(playStoreUrl('ABC123', PLAY))
  assert.equal(url.host, 'play.google.com')
  assert.equal(url.searchParams.get('id'), 'com.sabalive.in')
  const inner = new URLSearchParams(url.searchParams.get('referrer'))
  assert.equal(inner.get('utm_source'), 'invite')
  assert.equal(inner.get('utm_content'), 'ABC123')
})

test('a link that already has a query gets the referrer added with & (the owner\'s share link has pcampaignid)', () => {
  const url = new URL(playStoreUrl('ABC123', `${PLAY}&pcampaignid=web_share`))
  assert.equal(url.searchParams.get('pcampaignid'), 'web_share')
  assert.ok(url.searchParams.get('referrer'))
})

test('no code gives the plain listing; a bad code cannot add anything to it', () => {
  assert.equal(playStoreUrl('', PLAY), PLAY)
  assert.equal(playStoreUrl('///', PLAY), PLAY)
  const inner = new URLSearchParams(new URL(playStoreUrl('A&B=1', PLAY)).searchParams.get('referrer'))
  assert.equal(inner.get('utm_content'), 'AB1')
  assert.deepEqual([...inner.keys()].sort(), ['utm_content', 'utm_medium', 'utm_source'])
  assert.equal(playStoreUrl('ABC', null), null)
})

test('Android goes straight to Google Play with the code', () => {
  const t = inviteTarget('android', 'ABC123', links)
  assert.equal(t.kind, 'redirect')
  assert.equal(t.store, 'Google Play')
  assert.ok(t.url.startsWith(PLAY))
  assert.ok(t.url.includes('referrer='))
})

test('an iPhone is told it is coming soon until there is an App Store link, and goes there after', () => {
  assert.deepEqual(inviteTarget('ios', 'ABC123', links), { kind: 'coming-soon' })
  const t = inviteTarget('ios', 'ABC123', { android: PLAY, ios: 'https://apps.apple.com/app/id123' })
  assert.deepEqual(t, { kind: 'redirect', url: 'https://apps.apple.com/app/id123', store: 'the App Store' })
})

test('a computer is offered both, and the Play button carries the code', () => {
  const t = inviteTarget('desktop', 'ABC123', links)
  assert.equal(t.kind, 'choose')
  assert.ok(t.android.includes('referrer='))
  assert.equal(t.ios, null)
})

test('without a Play link at all an Android phone is not sent anywhere broken', () => {
  assert.equal(inviteTarget('android', 'ABC123', { android: null, ios: null }).kind, 'choose')
})

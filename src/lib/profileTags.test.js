import test from 'node:test'
import assert from 'node:assert/strict'
import { checkTag, textColorFor, tagTextColor, toggleTag, sameTags, tagError, isSvga, TAG_IMAGE_ACCEPT, MAX_TAGS_PER_USER, TAG_NAME_MAX, TAG_LOOKS } from './profileTags.js'

const ok = { name: 'Official', color: '#7C3AED', emoji: '✔️', status: 'active', sort_order: 3 }

test('a good tag is trimmed and its colour lower-cased', () => {
  const r = checkTag({ ...ok, name: '  Official ', color: '#7C3AED' })
  assert.deepEqual(r, { tag: { name: 'Official', color: '#7c3aed', emoji: '✔️', status: 'active', sort_order: 3, look: 'pill', image_url: null, text_color: null } })
})

test('a short colour is expanded, a blank emoji is nothing, a blank order is 0', () => {
  const r = checkTag({ name: 'Fan', color: '#0f8', emoji: '  ', status: 'active', sort_order: '' })
  assert.deepEqual(r.tag, { name: 'Fan', color: '#00ff88', emoji: null, status: 'active', sort_order: 0, look: 'pill', image_url: null, text_color: null })
})

test('an empty name, a long name and a bad colour are refused with a sentence', () => {
  assert.match(checkTag({ ...ok, name: '   ' }).error, /name/i)
  assert.match(checkTag({ ...ok, name: 'a'.repeat(TAG_NAME_MAX + 1) }).error, /at most 24/)
  assert.equal(checkTag({ ...ok, name: 'a'.repeat(TAG_NAME_MAX) }).error, undefined)
  assert.match(checkTag({ ...ok, color: 'red' }).error, /colour/i)
  assert.match(checkTag({ ...ok, color: '' }).error, /colour/i)
})

test('the name length counts characters, not bytes (an emoji is one)', () => {
  assert.equal(checkTag({ ...ok, name: '🔥'.repeat(TAG_NAME_MAX) }).error, undefined)
  assert.match(checkTag({ ...ok, name: '🔥'.repeat(TAG_NAME_MAX + 1) }).error, /at most 24/)
})

test('an over-long emoji and a fractional order are refused; an unknown status becomes active', () => {
  assert.match(checkTag({ ...ok, emoji: 'abcdefghijklm' }).error, /emoji/i)
  assert.match(checkTag({ ...ok, sort_order: 1.5 }).error, /whole number/)
  assert.equal(checkTag({ ...ok, status: 'banana' }).tag.status, 'active')
  assert.equal(checkTag({ ...ok, status: 'inactive' }).tag.status, 'inactive')
})

const PIC = 'https://abc123.supabase.co/storage/v1/object/public/gift-assets/tags/viscount.png'

test('there are exactly three looks: pill, picture and plate', () => {
  assert.deepEqual(TAG_LOOKS.map((l) => l.value), ['pill', 'picture', 'plate'])
})

test('a picture or plate tag needs an uploaded picture; a pill drops any picture it had', () => {
  assert.match(checkTag({ ...ok, look: 'picture' }).error, /Upload a picture/)
  assert.match(checkTag({ ...ok, look: 'plate', image_url: '   ' }).error, /Upload a picture/)
  assert.match(checkTag({ ...ok, look: 'picture', image_url: 'http://x.example/a.png' }).error, /uploaded file/)
  assert.equal(checkTag({ ...ok, look: 'picture', image_url: PIC }).tag.image_url, PIC)
  assert.equal(checkTag({ ...ok, look: 'plate', image_url: PIC }).tag.look, 'plate')
  assert.equal(checkTag({ ...ok, look: 'pill', image_url: PIC }).tag.image_url, null)
  assert.equal(checkTag({ ...ok, look: 'nonsense' }).tag.look, 'pill', 'an unknown look is a pill')
})

test('SVGA files are accepted for a tag picture, next to pictures and GIF / WebP', () => {
  assert.match(TAG_IMAGE_ACCEPT, /\.svga/)
  assert.match(TAG_IMAGE_ACCEPT, /\.png/)
  assert.equal(isSvga('https://abc123.supabase.co/storage/v1/object/public/gift-assets/tags/king.svga'), true)
  assert.equal(isSvga('https://abc123.supabase.co/storage/v1/object/public/gift-assets/tags/king.svga?v=2'), true)
  assert.equal(isSvga('https://abc123.supabase.co/storage/v1/object/public/gift-assets/tags/king.png'), false)
  assert.equal(isSvga(null), false)
  assert.equal(checkTag({ ...ok, look: 'picture', image_url: 'https://abc123.supabase.co/storage/v1/object/public/gift-assets/tags/king.svga' }).tag.image_url.endsWith('.svga'), true)
})

test('the text colour is optional but must be a colour when given', () => {
  assert.equal(checkTag({ ...ok, text_color: '#FFFFFF' }).tag.text_color, '#ffffff')
  assert.equal(checkTag({ ...ok, text_color: '' }).tag.text_color, null)
  assert.match(checkTag({ ...ok, text_color: 'white' }).error, /text colour/)
})

test('the text colour a tag is drawn with: its own, else white on a plate, else readable on the colour', () => {
  assert.equal(tagTextColor({ look: 'pill', color: '#ffee88', text_color: '#112233' }), '#112233')
  assert.equal(tagTextColor({ look: 'plate', color: '#ffee88', text_color: '' }), '#ffffff')
  assert.equal(tagTextColor({ look: 'pill', color: '#ffee88' }), '#1b1030')
  assert.equal(tagTextColor({ look: 'pill', color: '#111133' }), '#ffffff')
})

test('text colour: white on dark colours, dark on light ones, white for nonsense', () => {
  assert.equal(textColorFor('#111133'), '#ffffff')
  assert.equal(textColorFor('#7c3aed'), '#ffffff')
  assert.equal(textColorFor('#ffee88'), '#1b1030')
  assert.equal(textColorFor('#00ff88'), '#1b1030')
  assert.equal(textColorFor('nope'), '#ffffff')
})

test('ticking adds, unticking removes, and the limit holds', () => {
  assert.deepEqual(toggleTag(['a'], 'b'), ['a', 'b'])
  assert.deepEqual(toggleTag(['a', 'b'], 'a'), ['b'])
  const full = Array.from({ length: MAX_TAGS_PER_USER }, (_, i) => `t${i}`)
  assert.equal(toggleTag(full, 'extra'), null)
  assert.deepEqual(toggleTag(full, 't0'), full.slice(1), 'removing is always allowed')
})

test('same tags regardless of order', () => {
  assert.equal(sameTags(['a', 'b'], ['b', 'a']), true)
  assert.equal(sameTags(['a'], ['a', 'b']), false)
  assert.equal(sameTags([], []), true)
})

test('server errors become sentences', () => {
  assert.match(tagError({ message: 'relation "public.profile_tags" does not exist' }), /not installed on this project/)
  assert.match(tagError({ message: 'Could not find the function public.admin_set_user_tags in the schema cache' }), /not installed/)
  assert.match(tagError({ message: 'permission denied for table profile_tags' }), /Tags access/)
  assert.equal(tagError({ message: 'A user can have at most 10 tags' }), 'A user can have at most 10 tags')
  assert.equal(tagError(null), 'Something went wrong.')
})

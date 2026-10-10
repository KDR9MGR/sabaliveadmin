// Run with: npm test   (Node's built-in test runner; no extra packages)
import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveEnvironments, PRODUCTION_REF } from './environments.js'

const PROD = `https://${PRODUCTION_REF}.supabase.co`
const STG = 'https://gsloixbaktefwgxzjtps.supabase.co'
const base = { VITE_SUPABASE_URL: PROD, VITE_SUPABASE_ANON_KEY: 'prod-key' }
const both = { ...base, VITE_STAGING_SUPABASE_URL: STG, VITE_STAGING_SUPABASE_ANON_KEY: 'stg-key' }

test('a normal build with no staging address has no switch and uses production', () => {
  const r = resolveEnvironments({ mode: 'production', env: base, stored: 'staging' })
  assert.equal(r.canSwitch, false)
  assert.equal(r.active.key, 'production')
  assert.equal(r.active.url, PROD)
})

test('with the staging address a build can switch, and starts on production', () => {
  const r = resolveEnvironments({ mode: 'production', env: both, stored: null })
  assert.equal(r.canSwitch, true)
  assert.equal(r.active.key, 'production')
  assert.equal(r.active.url, PROD)
})

test('a remembered staging choice makes staging the active project', () => {
  const r = resolveEnvironments({ mode: 'production', env: both, stored: 'staging' })
  assert.equal(r.active.key, 'staging')
  assert.equal(r.active.url, STG)
  assert.equal(r.active.anonKey, 'stg-key')
})

test('anything else remembered falls back to production', () => {
  const r = resolveEnvironments({ mode: 'production', env: both, stored: 'whatever' })
  assert.equal(r.active.key, 'production')
})

test('a staging-mode build never offers a switch and never leaves staging', () => {
  const env = { VITE_SUPABASE_URL: STG, VITE_SUPABASE_ANON_KEY: 'stg-key', VITE_STAGING_SUPABASE_URL: PROD, VITE_STAGING_SUPABASE_ANON_KEY: 'x' }
  const r = resolveEnvironments({ mode: 'staging', env, stored: 'staging' })
  assert.equal(r.canSwitch, false)
  assert.equal(r.active.key, 'staging')
  assert.equal(r.active.url, STG)
})

test('a "staging" address that is really production is refused, not offered', () => {
  const env = { ...base, VITE_STAGING_SUPABASE_URL: PROD, VITE_STAGING_SUPABASE_ANON_KEY: 'k' }
  const r = resolveEnvironments({ mode: 'production', env, stored: 'staging' })
  assert.equal(r.canSwitch, false)
  assert.equal(r.active.key, 'production')
  assert.equal(r.active.url, PROD)
})

test('a half-set staging config (address without key) is ignored', () => {
  const env = { ...base, VITE_STAGING_SUPABASE_URL: STG }
  const r = resolveEnvironments({ mode: 'production', env, stored: 'staging' })
  assert.equal(r.canSwitch, false)
  assert.equal(r.active.key, 'production')
})

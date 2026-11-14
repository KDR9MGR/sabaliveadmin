import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OWNERSHIP, ownershipLine } from './site.js'

test('the line names the owner alone while the operator is not set', () => {
  assert.equal(
    ownershipLine({ owner: 'A Person', ownerCountry: 'United Kingdom', operator: null }, 'Saba Live'),
    'Saba Live is owned by A Person, United Kingdom.',
  )
})

test('the line names owner and operator when both are set', () => {
  assert.equal(
    ownershipLine({ owner: 'A Person', ownerCountry: 'United Kingdom', operator: 'An Indian Company', operatorCountry: 'India' }, 'Saba Live'),
    'Saba Live is owned by A Person, United Kingdom, and operated in India by An Indian Company.',
  )
})

test('no owner means nothing is written', () => {
  assert.equal(ownershipLine({ owner: null }), '')
  assert.equal(ownershipLine(null), '')
})

test('the site has an owner set', () => {
  assert.ok(OWNERSHIP.owner)
  assert.ok(ownershipLine().startsWith('Saba Live is owned by '))
})

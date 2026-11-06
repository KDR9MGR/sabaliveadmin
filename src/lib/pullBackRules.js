/* Pulling back a coin TRANSFER (sabalive migration 20261106140000: pull_back_coin_transfer). The database decides and checks again; these pure rules only
   decide whether the panel OFFERS the button, and mirror it: the permission `pull_back_coins` (Super Admin always, a Master unless blocked, anyone else only when
   a Super Admin / Master granted it in Access Control), a real transfer that is not already pulled back, and a Master / Super Admin on any transfer while every
   other account only on a transfer it sent. */
import { isMasterRole } from './panelRules.js'

export const MIN_REASON = 3
export const reasonOk = (text) => String(text || '').trim().length >= MIN_REASON

export function canPullBackTransfer({ row, me, role, can }) {
  if (!row || !row.transferId || row.pulledBack) return false
  if (typeof can !== 'function' || !can('pull_back_coins')) return false
  if (isMasterRole(role)) return true
  return !!me && row.senderId === me
}

/* the words for the dialog's "what happens" line */
export function pullBackSummary(row) {
  const coins = Number(row?.coins || 0).toLocaleString()
  return `${coins} coins go from ${row?.recipient || 'the recipient'} back to ${row?.from || row?.by || 'the sender'}.`
}

/* a database refusal in plain words (the SQL messages are already readable; this only shortens the long balance one) */
export function pullBackError(error) {
  const m = String(error?.message || '')
  if (/Cannot pull back: the recipient has only/i.test(m)) return `${m.replace(/^Cannot pull back: /i, 'Not possible: ')}. Nothing was moved.`
  return m || 'Could not pull the transfer back'
}

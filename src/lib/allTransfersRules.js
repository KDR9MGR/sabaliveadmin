/* Master / Super Admin -> "All Coin Transfers": every coin movement between panels in one list (owner, 2026-11-10: "transfer coin history between all panel, only master and super admin").
   Two sources: wallet-to-wallet transfers (coin_transfers: Global -> Country -> Sub Admin -> Agency -> user ...) and direct grants (coin_grants: Super Admin / Master giving coins).
   Pure shaping and words here; the database reads are in allTransfers.js. */
import { isMasterRole } from './panelRules.js'

/* the same three helpers as admin.js, kept here so this file stays pure (admin.js pulls in the Supabase client) */
const shortId = (uuid) => (uuid ? String(uuid).slice(0, 8) : '')
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '—')
const ROLE_LABEL = { super_admin: 'Super Admin', admin: 'Admin', global_admin: 'Global Admin', country_admin: 'Country Admin', sub_admin: 'Sub Admin', agency_manager: 'Agency Manager' }

export const KIND_TRANSFER = 'Wallet transfer'
export const KIND_GRANT = 'Direct grant'
export const KINDS = [KIND_TRANSFER, KIND_GRANT]
export const STATUS_DONE = 'Done'
export const STATUS_PULLED_BACK = 'Pulled back'

/* only a Master or Super Admin may open the page (the database already lets only them read every row; this keeps the route closed to anyone else) */
export const canSeeAllTransfers = (role) => isMasterRole(role)

const roleOf = (p) => {
  const r = Array.isArray(p?.staff_roles) ? p.staff_roles[0]?.role : p?.staff_roles?.role
  return r ? (ROLE_LABEL[r] || r) : 'User'
}
const who = (p) => ({ name: p?.name || '—', username: p?.username || '', displayId: p?.display_id == null ? '' : String(p.display_id), role: roleOf(p) })

export function shapeTransfer(r) {
  const from = who(r.sender)
  const to = who(r.recipient)
  return {
    id: `transfer-${r.id}`, idShort: shortId(r.id), kind: KIND_TRANSFER,
    from: from.name, fromId: from.displayId, fromRole: from.role,
    to: to.name, toId: to.displayId, toRole: to.role, toUsername: to.username,
    coins: Number(r.coins) || 0, note: r.note || '—',
    status: r.pulled_back_at ? STATUS_PULLED_BACK : STATUS_DONE,
    transferId: r.id, senderId: r.sender_id, pulledBack: !!r.pulled_back_at,
    at: r.created_at, ts: +new Date(r.created_at), date: fmtDate(r.created_at),
  }
}

export function shapeGrant(r) {
  const from = who(r.granter)
  const to = who(r.recipient)
  return {
    id: `grant-${r.id}`, idShort: shortId(r.id), kind: KIND_GRANT,
    from: from.name, fromId: from.displayId, fromRole: from.role,
    to: to.name, toId: to.displayId, toRole: to.role, toUsername: to.username,
    coins: Number(r.coins) || 0, note: r.note || '—',
    status: STATUS_DONE, transferId: undefined, senderId: r.granted_by, pulledBack: false,
    at: r.created_at, ts: +new Date(r.created_at), date: fmtDate(r.created_at),
  }
}

/* newest first; the coins of a pulled-back transfer are not counted as moved */
export function mergeMovements(transfers, grants) {
  return [...(transfers || []).map(shapeTransfer), ...(grants || []).map(shapeGrant)].sort((a, b) => new Date(b.at) - new Date(a.at))
}

export function summarize(rows) {
  const done = rows.filter((r) => !r.pulledBack)
  return { count: rows.length, coins: done.reduce((s, r) => s + r.coins, 0), pulledBack: rows.length - done.length }
}

/* the filter dropdown options: the roles that actually appear */
export const roleOptions = (rows, key) => [...new Set(rows.map((r) => r[key]))].filter(Boolean).sort()

/* the app User ID goes in every export, never the database id */
export const exportColumns = () => [
  { header: 'Date', value: (r) => r.date },
  { header: 'Type', value: (r) => r.kind },
  { header: 'From', value: (r) => r.from },
  { header: 'From User ID', value: (r) => r.fromId },
  { header: 'From role', value: (r) => r.fromRole },
  { header: 'To', value: (r) => r.to },
  { header: 'To User ID', value: (r) => r.toId },
  { header: 'To role', value: (r) => r.toRole },
  { header: 'Coins', value: (r) => r.coins, type: 'int' },
  { header: 'Status', value: (r) => r.status },
  { header: 'Note', value: (r) => (r.note === '—' ? '' : r.note) },
  { header: 'Ref', value: (r) => r.idShort },
]

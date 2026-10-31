/* Small rules shared by the Store, Profile Frame, Tags and user pages (sabalive migration 20261031100000). Pure, so they are tested without a database. */

/* A price typed in a Store form: empty or 0 means FREE (as with a Lucky ID); anything else must be a whole number above 0. */
export function parsePrice(v) {
  if (v === '' || v == null) return 0
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) throw new Error('Price must be 0 (free) or more')
  if (!Number.isInteger(n)) throw new Error('Price must be a whole number of coins')
  return n
}

export const priceLabel = (n) => (Number(n) > 0 ? `${Number(n).toLocaleString('en-US')} coins` : 'Free')

/* Master (`admin`) and Super Admin. Only they can lock or unlock a frame, and only they can assign a locked one (enforced in SQL; this only keeps the screens honest). */
export const isMasterRole = (role) => role === 'admin' || role === 'super_admin'

/* The items a person may pick when assigning: a locked one is left out for everyone but Master / Super Admin. */
export const assignable = (items, role) => (isMasterRole(role) ? items : (items || []).filter((i) => !i.locked))

/* The name as shown in a pick list: a lock in front of a locked item (only Master / Super Admin ever see one there). */
export const lockedName = (item) => (item?.locked ? `🔒 ${item.name}` : item?.name)

/* "column X does not exist" answers for one column: a panel that runs ahead of the database retries without it instead of breaking the page. */
export const missesColumn = (error, column) => {
  const m = error?.message || ''
  return m.toLowerCase().includes(String(column).toLowerCase()) && /does not exist|schema cache|could not find/i.test(m)
}

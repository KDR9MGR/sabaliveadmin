/* Finding a person without loading everyone. The people lists used to be "the first 1000 profiles by name", so once the platform passed 1000 profiles
   (it has 1160) everyone later in the alphabet could not be picked at all (user 100260 was number 1144). Two pieces, both plain functions so they can
   be tested:
     profileSearchFilter(text)  the PostgREST filter for "find this person": the app User ID when digits are typed, and the name or username always.
     fetchAllPages(makeQuery)   reads a list in pages of 1000 until the end, for the lists that still need every row (a server returns at most 1000
                                rows per request, even when the code asks for more). */

/* Characters that would change the meaning of a PostgREST "or=(...)" filter are dropped from what the person typed. */
export const cleanSearchText = (text) => String(text || '').trim().replace(/[,()*%\\]/g, '').replace(/\s+/g, ' ')

/* null when there is nothing to search for. Digits: the exact app User ID, plus anyone whose name or username contains the digits. */
export function profileSearchFilter(text) {
  const q = cleanSearchText(text)
  if (!q) return null
  const parts = []
  if (/^\d+$/.test(q) && q.length <= 15) parts.push(`display_id.eq.${q}`)
  parts.push(`name.ilike.%${q}%`, `username.ilike.%${q}%`)
  return parts.join(',')
}

/* One entry of a people picker, the same shape the old lists had. */
export const profileOption = (p) => ({
  value: p.id,
  label: `${p.name} (@${p.username}) · ID ${p.display_id}`,
  search: `${p.name} ${p.username} ${p.display_id}`.toLowerCase(),
})

/* makeQuery(from, to) -> a promise of an array (e.g. supabase.from('profiles').select(...).order('name').range(from, to)). Pages are 1000 rows;
   stops at the first short page, or at maxRows (a safety stop, default 20,000). */
export async function fetchAllPages(makeQuery, { pageSize = 1000, maxRows = 20000 } = {}) {
  const out = []
  for (let from = 0; from < maxRows; from += pageSize) {
    const page = await makeQuery(from, from + pageSize - 1)
    out.push(...page)
    if (page.length < pageSize) break
  }
  return out
}

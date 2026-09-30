/* Country names for the Add forms' dropdown, built from the browser's own
   region data (no list to maintain). Falls back to a short list if Intl
   DisplayNames isn't available. */
let cached
export function countryList() {
  if (cached) return cached
  const names = new Set()
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'region' })
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (const a of A) for (const b of A) {
      const code = a + b
      let n
      try { n = dn.of(code) } catch { continue }
      // unassigned codes come back as the code itself or "Unknown Region"
      if (n && n !== code && !/unknown region/i.test(n)) names.add(n)
    }
  } catch { /* fall through */ }
  if (names.size < 50) ['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Saudi Arabia', 'Bangladesh', 'Pakistan', 'Nepal', 'Sri Lanka'].forEach((n) => names.add(n))
  cached = [...names].sort((x, y) => x.localeCompare(y))
  return cached
}

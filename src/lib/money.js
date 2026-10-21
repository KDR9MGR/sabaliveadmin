/* Salary amounts are US dollars: "$25,000.00". null / undefined show as a dash. */
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export const usd = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? '—' : fmt.format(Number(v)))

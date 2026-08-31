/* deterministic pseudo-random so mock data is stable across reloads */
export function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}
export const pick = (r, arr) => arr[Math.floor(r() * arr.length)]
export const int = (r, min, max) => Math.floor(r() * (max - min + 1)) + min

export const FIRST = ['Rahul', 'Priya', 'Amit', 'Neha', 'Vikram', 'Pooja', 'Karan', 'Simran', 'Arjun', 'Anjali', 'Rohit', 'Sneha', 'Mohit', 'Divya', 'Suresh', 'Kavya', 'Nikhil', 'Ritu', 'Aditya', 'Meera', 'Sameer', 'Isha', 'Vivek', 'Tanya', 'Deepak', 'Aarti', 'Manish', 'Nisha', 'Gaurav', 'Payal']
export const LAST = ['Kumar', 'Sharma', 'Verma', 'Singh', 'Joshi', 'Patel', 'Mehta', 'Kaur', 'Malik', 'Nair', 'Reddy', 'Gupta', 'Rawat', 'Kapoor', 'Bose', 'Iyer', 'Chopra', 'Das', 'Bhat', 'Sinha']
export const AGENCIES = ['StarConnect', 'LiveWave', 'BrightLive', 'FunCreators', 'StreamMax', 'GlowMedia', 'PulseHosts', 'NovaTalent', 'PrimeCast', 'EchoLive']
export const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai', 'Jaipur', 'Kolkata', 'Ahmedabad', 'Lucknow']

export const fullName = (r) => `${pick(r, FIRST)} ${pick(r, LAST)}`
export const initials = (name) => name.split(' ').map((p) => p[0]).slice(0, 2).join('')
export const email = (name) => name.toLowerCase().replace(/[^a-z]+/g, '.') + '@gmail.com'
export const mobile = (r) => '+91 ' + int(r, 70000, 99999) + ' ' + int(r, 10000, 99999)

export function dateStr(r, daysBackMax = 400) {
  const d = new Date(2026, 7, 31)
  d.setDate(d.getDate() - int(r, 1, daysBackMax))
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
export function timeAgo(r) {
  const opts = ['2 mins ago', '15 mins ago', '35 mins ago', '1 hour ago', '2 hours ago', '5 hours ago', '1 day ago', '2 days ago']
  return pick(r, opts)
}
export const boldMd = (s) => String(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
export const money = (n) => n.toLocaleString('en-IN')
export const num = (n) => n.toLocaleString('en-US')
export const compact = (n) => {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

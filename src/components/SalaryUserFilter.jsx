import { useMemo, useState } from 'react'
import UserPicker from './UserPicker.jsx'
import { ALL_USERS, userOptions, filterByUser } from '../lib/salaryColumns.js'

/* The "User" filter of the Salary tabs: type a User ID (or part of it), a name or a username, pick the person, and the table shows only their rows.
   The people are the ones in the rows already loaded (a host in the monthly report, a payee in the payslips), so nothing more is read from the database.
   If the chosen person is not in the rows any more (another month or agency was picked) the filter quietly goes back to everyone. */
export function useSalaryUser(rows) {
  const [chosen, setChosen] = useState('')
  const options = useMemo(() => [ALL_USERS, ...userOptions(rows)], [rows])
  const user = options.some((o) => o.value === chosen) ? chosen : ''
  const shown = useMemo(() => filterByUser(rows || [], user), [rows, user])
  const label = options.find((o) => o.value === user)?.label || ''
  return { options, user, setUser: setChosen, shown, label }
}

/* The dropdown. `filter` is what useSalaryUser returned. */
export function SalaryUserPicker({ filter, style }) {
  return (
    <div className="field" style={{ marginBottom: 0, minWidth: 280, ...style }}>
      <label>User</label>
      <UserPicker
        options={filter.options}
        value={filter.user}
        onChange={filter.setUser}
        limit={300}
        placeholder="Search by User ID or name…"
      />
    </div>
  )
}

/* A line under the filters while one person is chosen, with the way back. */
export function SalaryUserNote({ filter }) {
  if (!filter.user) return null
  return (
    <div className="hint" style={{ marginBottom: 10 }}>
      Showing only {filter.label}.{' '}
      <button type="button" className="link" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'inherit', textDecoration: 'underline' }} onClick={() => filter.setUser('')}>
        Show everyone
      </button>
    </div>
  )
}

/* For a page that gets its rows from a render function (it cannot call a hook itself): children(shownRows, picker, filter). */
export function WithSalaryUser({ rows, children }) {
  const filter = useSalaryUser(rows)
  return children(filter.shown, <SalaryUserPicker filter={filter} />, filter)
}

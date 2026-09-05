import { useCallback, useEffect, useState } from 'react'

/* Run an async fetch on mount (and on `deps` change); expose reload().
   Fine for the current data volumes — every list page fetches its whole
   dataset and the existing DataTable does search/sort/filter/paging client-side.
   Revisit with server-side paging once tables actually get large. */
export function useAsyncData(fn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const run = useCallback(() => {
    setLoading(true)
    setError('')
    return Promise.resolve()
      .then(fn)
      .then((d) => setData(d))
      .catch((e) => setError(e?.message || 'Something went wrong loading this data'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { let alive = true; run().then(() => { if (!alive) return }); return () => { alive = false } }, [run])

  return { data, loading, error, reload: run }
}

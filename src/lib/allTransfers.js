import { supabase } from './supabase.js'
import { fetchAllPages } from './profileSearch.js'
import { missesColumn } from './panelRules.js'
import { mergeMovements } from './allTransfersRules.js'

const PERSON = 'name, username, display_id, staff_roles!user_id(role)'
const unwrap = ({ data, error }) => { if (error) throw error; return data }
const MAX_EACH = 5000 // the latest 5,000 of each kind: more than any screen can use, and a safety stop

/* Every wallet transfer and every direct grant on the platform, newest first. RLS lets a Master / Super Admin read all rows (nobody else can). `pulled_back_at` (sabalive
   migration 20261106140000) is read when the column exists. */
export async function listAllCoinMovements() {
  const readTransfers = (cols) => fetchAllPages(
    (from, to) => supabase.from('coin_transfers').select(cols).order('created_at', { ascending: false }).range(from, to).then(unwrap),
    { maxRows: MAX_EACH })
  const cols = `id, coins, note, created_at, sender_id, recipient_id, sender:sender_id(${PERSON}), recipient:recipient_id(${PERSON})`
  const [transfers, grants] = await Promise.all([
    readTransfers(`${cols}, pulled_back_at`).catch((e) => { if (missesColumn(e, 'pulled_back_at')) return readTransfers(cols); throw e }),
    fetchAllPages(
      (from, to) => supabase.from('coin_grants')
        .select(`id, coins, note, created_at, granted_by, granted_to, granter:granted_by(${PERSON}), recipient:granted_to(${PERSON})`)
        .order('created_at', { ascending: false }).range(from, to).then(unwrap),
      { maxRows: MAX_EACH }),
  ])
  return mergeMovements(transfers, grants)
}

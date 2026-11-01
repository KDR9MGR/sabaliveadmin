import { supabase } from './supabase.js'
import { isMissingFunction } from './dbErrors.js'
import { shapeBoard } from './leaderboardRules.js'

/* The Leaderboards page's one database call: admin_leaderboard (sabalive migration 20261101120000), Master and Super Admin only. It returns the same people and
   scores as the app's Rankings for the same window, plus the window itself and, with which = 'previous', the board that just ended. */
export const LEADERBOARD_NOT_INSTALLED = 'The leaderboard reader is not on this database yet: it comes with the database update 20261101120000.'

export async function getLeaderboard({ board, period, which = 'current', limit = 500 }) {
  const { data, error } = await supabase.rpc('admin_leaderboard', { p_board: board, p_period: period, p_which: which, p_limit: limit })
  if (error) {
    if (isMissingFunction(error)) throw new Error(LEADERBOARD_NOT_INSTALLED)
    throw error
  }
  return shapeBoard(data, board)
}

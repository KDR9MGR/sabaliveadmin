/* The panel's Leader games list: pure rules (tested in leaderGames.test.js). The third game provider ("Leader", docs/LEADER_GAMES.md in the app repo). The games are one row each in
   leader_games, filled from the company's list by a script (there is no "Add game" here, like Tulasi's Sync); the panel only hides / shows them. The database side is sabalive
   migrations 20261117110000 (the table) and 20261120100000 (admin_set_leader_games_hidden). The ON / OFF switch is app_config.feature_flags.leader_games_enabled (Release controls). */

/* The text when the database does not have the hide / show function (or the table) yet. */
export const LEADER_NOT_INSTALLED = /leader_games|admin_set_leader_games_hidden|schema cache|does not exist/i

/* What the table shows for a database row. A game is in the app when it is on (status 1) and not hidden by us. */
export const leaderGameRow = (g) => ({
  id: g.id,
  gameId: g.provider_game_id,
  name: g.name || '—',
  title: g.title || '',
  image: g.image_url || '',
  usesCoins: g.uses_coins === true,
  status: g.status === 1 ? 'On' : 'Off',
  hidden: g.hidden === true,
  inApp: g.hidden === true ? 'Hidden by us' : (g.status === 1 ? 'Shown' : 'Off in the list'),
  order: g.sort_order,
  updatedAt: g.updated_at,
})

/* The three switches that decide whether a Leader game opens: the main Games switch, the Leader switch, and (builds from the Play store only) the build itself. */
export const leaderSwitches = (flags) => {
  const f = flags && typeof flags === 'object' ? flags : {}
  return { games: f.games_enabled === true, leader: f.leader_games_enabled === true }
}

/* One line for the Games page: what a phone with an APK build sees. A Play-store build shows "coming soon" whatever the switches say (the build decides, not the panel). */
export const leaderStatusText = ({ games, leader }) => {
  if (!leader) return 'Leader games are OFF'
  if (!games) return 'Leader games are ON, but the main Games switch is off'
  return 'Leader games are ON'
}

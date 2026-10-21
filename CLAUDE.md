# sabaliveadmin (React + Vite admin panel)

Panel for Super/Master/Global/Country/Sub/Agency staff, plus `landing/` (separate Vite
project for the public site). Talks to Supabase with the anon key only; all authority
is Postgres RLS/RPCs and Edge Functions in the `sabalive` repo. No migrations here.

## Commands
```bash
cp .env.example .env.local   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev                  # http://localhost:5173
npm run build                # no test/lint setup; a clean build is the check
```
Deploys via one Vercel project (`npm run build:site`, panel under /admin/).

## Layout
- `src/App.jsx` routes per panel; `src/config/nav.js` sidebar per panel
  (items can carry `cap`); `src/lib/capabilities.js` per-account capability keys
  (mirror `role_baseline()` in SQL); `src/lib/*.js` data access (one file per area,
  Supabase calls + shaping); `src/pages/*` screens; `src/components/*` shared UI
  (`DataTable`, `EntityForm` drawer, `Modal`, `ConfirmDialog`, `AsyncView`).
- Privileged writes: RPCs or `supabase.functions.invoke(...)` (invite-staff,
  admin-update-staff-auth, ghost-admin). Never put service_role in the browser.

## Ghost / Live Monitor
- `pages/ghosts.jsx` (Super only) manages ghost IDs; `pages/liveMonitor.jsx` +
  `components/ActiveRoomsGrid.jsx` + `GhostWatchModal.jsx` watch lives invisibly via
  `agora-rtc-sdk-ng` (lazy-loaded) with a subscriber token from `agora-token`
  (`ghost: true`). Capability `monitor_lives` (on by default for Master).
- Queries that count/list users filter `.eq('is_ghost', false)`; this needs the
  ghost migration applied.
- `.trae/` is an untracked leftover from another tool; ignore it.

## Master/Super pages added with the app sync
`pages/master/{levels,coinSellers,support,luckyIds}.jsx`, `components/HandoverButton.jsx` (Transfer pages),
user detail Bag assign / Lucky ID / Edit profile in `pages/master/users.jsx`, helpers in `lib/{levels,
coinSellers,support,luckyIds,handover,userTools}.js`. Global and Country menus intentionally have no
Badge / Profile Frame / Leaderboard entries; Country has no Add Agency.

## Tags
`pages/master/tags.jsx` (Master `/admin/tags`, Super `/super/tags`) makes tags (name, emoji, order, active, and one of three looks: coloured pill, picture with the name inside it, or a
background picture the app writes the name on; pictures are uploaded to the `gift-assets` bucket) and gives them to users (search a user, tick tags, max 10).
Capability `manage_tags` is on by default for a Master and grantable to Global / Country / Sub Admin and Agency in Access Control; the SQL side is `staff_can_manage_tags()`
(sabalive migration `20261021190000`). Pure rules in `lib/profileTags.js` (tested), database calls in `lib/profileTagsApi.js`. While the tables are missing the page says so.

## Environment switch (production <-> staging)
`src/lib/environments.js` picks the Supabase project; `components/EnvironmentSwitch.jsx` is the top-bar pill (Master and
Super Admin only), the orange STAGING strip and the sign-in notice. A normal build is "home = production" and gets the switch
only when `VITE_STAGING_SUPABASE_URL` / `_ANON_KEY` are set (public values; in Vercel too). A `--mode staging` build is staging
only and can never reach production (guard in `supabase.js`). Each project keeps its own session, so switching signs nobody
out; the page reloads and you sign in once with that project's own account. `npm test` runs the pure selection logic.

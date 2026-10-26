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
The preview (`TagPill`) draws a plate as big as its artwork with the name centred on it (as the app does), and a plate whose name has no letter or digit (`nameIsWritten`, e.g. ".") as the picture alone; `SvgaPlayer` takes `autoWidth` to follow an animation's own proportions.
Tag pictures accept **SVGA** (2026-10-25; `TAG_IMAGE_ACCEPT` starts with `.svga`, `isSvga(url)`; the page previews one with `SvgaPlayer`, for the picture look and the plate look). Badge
Management (`pages/master/platform.jsx`, `UPLOAD_ACCEPT`) already took SVGA / MP4 / GIF / WebP / PNG; the app now draws an uploaded SVGA badge or tag instead of the emoji / pill (MP4 still falls back to the emoji / pill on a profile).

## Levels and bans (2026-10-25)
Levels (`pages/master/levels.jsx`, `lib/levels.js`, pure rules in `lib/levelRules.js`): every level takes exactly the XP typed (0 to 2,147,483,647), whatever the levels around it need; level 1 is 0; `saveTrackLevel` calls
`admin_save_track_level_v3` (sabalive migration `20261025140000`) and falls back to v2, then v1, while it is missing. The drawer only shows a heads-up (never a block) when the number is outside its neighbours. Bans (`components/BanDialog.jsx`, `lib/bans.js`, pure rules in `lib/banRules.js`): 24 hours, 7 days,
30 days, a custom date and time (browser time zone, sent as an ISO instant) or permanent, through `ban_user_v2` (`20261025120000`); the reason box is "Reason (shown to the user)": the user sees it, with the end
time, when they try to sign in. Both fall back to the old functions (`lib/dbErrors.js` `isMissingFunction`) while the migrations are not on the project; 24 hour / custom bans need them. Ban ends
are shown with their time.

## Salary: finding a person (2026-10-26)
Every Salary table has a **User** dropdown (`components/SalaryUserFilter.jsx`: `useSalaryUser`, `SalaryUserPicker`, `SalaryUserNote`, `WithSalaryUser`; pure helpers `userOptions` / `filterByUser` in `lib/salaryColumns.js`, tested):
type a User ID (whole or part), a name or a username, pick the person and the table, its tiles and its export show only their rows ("Showing only ... Show everyone"). Used by the Monthly report (the By-month table,
the month totals and Assign Salary Payment still cover every host in scope), the Master Payslips tab and the Agency Payslips tab. The people are the rows already loaded, so nothing extra is read. The tables' own search
box also matches the User ID. In the Master "New Payslip" form the Payee is a `picker` field (`EntityForm` type `picker`): a live database search by User ID, name or username (`searchProfileOptions`), so nobody is preloaded.

Salary exports (Excel / CSV): every export carries the app User ID, and Sub Admin, Country Admin and Global Admin each as name + app User ID (`ADMIN_COLUMNS` in `lib/salaryColumns.js`); an admin the system does not know says
"Not assigned" (`NOT_ASSIGNED`), never an empty cell. The same three columns show on screen (`adminCol` in `components/cells.jsx`). The Global Admin comes from `staff_roles.global_admin_id` (sabalive migration
`20261026100000`), set on the Transfer Global page (`transfer_country_admin`): "Assign a Global Admin" for a Country Admin that has none.

## SUD games (2026-10-26, built, not shipped)
The Games page has a second card, "SUD games" (`pages/master/games.jsx`): add a game from SUD's list (`data/sudGames.js`, 59 presets; or type a SUD game id; ids are TEXT, they exceed JavaScript's safe integers),
edit name / proportions (height / width) / picture / coin-game flag / order, Hide / Show, On / Off, Delete (`lib/games.js` `listSudGames`, `saveSudGame`, `setSudGamesHidden`, `deleteSudGame`; rules in `lib/sudGames.js`,
tested). Two Release controls in Config: `sud_games_enabled` and `sud_coin_games_enabled`, both default off. The card says "needs the database update" until sabalive migration `20261026110000` is applied
(`SUD_NOT_INSTALLED`). The page the app opens to play a SUD game is part of the public landing site: `landing/src/pages/SudPlay.jsx` at `/sud/play` (outside the site layout; the SUD web SDK is pinned in
`landing/package.json`; the hostname `sabalive.in` is what SUD's console must list as the Web bundle_id). Full story: `sabalive/docs/SUD_GAMES.md`.

## Diamond reset (2026-10-26, built, not shipped)
`pages/master/diamondReset.jsx` at `/admin/diamond-reset` (menu: Economy -> Diamond Reset, capability `run_payroll`, but the SQL needs the Master / Super Admin role as well; a lower role cannot open the path). Pick a finished month, see
what each button would take, press **Reset gifting diamonds**, **Reset reward diamonds** or **Reset both**, type the month to confirm; the history table has Undo. Pure rules (months, button states, confirmation) in
`lib/diamondResetRules.js` (tested), database calls in `lib/diamondReset.js`. The first card is the **automatic monthly reset** (a toggle, a Gifting and a Reward checkbox, the day of the month; `AutoResetCard`; pure rules `checkAutoSettings` / `nextAutoRun` in `diamondResetRules.js`, calls `getAutoSettings` / `saveAutoSettings`):
saved with a button, turning it ON asks once more, and it names the next run and what it will reset. The page says so while sabalive migration `20261026120000` (buttons) or `20261026130000` (automatic) is missing. Full story: `sabalive/docs/DIAMOND_RESET.md`.

## SVG uploads, the iOS coin seller switch and the reset permission (2026-10-26)
- Every asset upload accepts **.svg** as well as SVGA / MP4 / GIF / WebP / PNG (`UPLOAD_ACCEPT`, `TAG_IMAGE_ACCEPT`). `lib/mediaTypes.js` holds the pure rules (`mediaKind`, `looksLikeSvg`, `svgProblem`, tested): an SVG is checked
  to be a real drawing and refused if it carries a script, an event handler, embedded HTML or a javascript: link, then sent as `application/octet-stream` (like SVGA: the buckets only accept a fixed list of types, and a generic binary is
  never run by a browser). The panel draws it with `components/SvgPreview.jsx` (reads the file and shows it as an image; used by `MediaPreview`, the upload field, the banners table and the Tags page). The banners bucket was widened
  (migration `20261026140000`) so a banner can be a GIF / SVG / SVGA too.
- Config -> Release controls has **"Coin sellers on iOS"** (`coin_seller_ios`, default OFF since 2026-10-27: Apple requires In-App Purchase for coins): on shows "Buy from Offline Seller" on iPhones too (Android always shows it). Find it as Super Admin: Application Config -> "Release Settings" (left list) -> the switch list -> **Save release controls**.
- **Diamond reset is its own permission**, `reset_diamonds` (`lib/capabilities.js`: Operations group, on by default for a Master, an explicit false blocks it; a lower role can never use it). The menu item and the route use it instead of `run_payroll`.

## Invite page (2026-10-26)
`landing/src/pages/Invite.jsx` at `/invite` and `/invite/:code` (inside the site layout) is where the app's invite link and QR code land (`sabalive/lib/core/utils/share_links.dart` `inviteShareUrl`). Pure rules in `landing/src/lib/invite.js`
(`cleanInviteCode`, `platformFor`, `playStoreUrl`, `inviteTarget`; tested in `landing/src/lib/invite.test.js`, part of `npm test`): Android is sent to `STORE_LINKS.android` with the code as the Play referrer, an iPhone sees "coming soon"
until `STORE_LINKS.ios` (`landing/src/lib/site.js`) is set and is then redirected there, a computer sees both buttons. The code is shown with a Copy button. Vercel's rewrite to `/index.html` already covers the path.

## Environment switch (production <-> staging)
`src/lib/environments.js` picks the Supabase project; `components/EnvironmentSwitch.jsx` is the top-bar pill (Master and
Super Admin only), the orange STAGING strip and the sign-in notice. A normal build is "home = production" and gets the switch
only when `VITE_STAGING_SUPABASE_URL` / `_ANON_KEY` are set (public values; in Vercel too). A `--mode staging` build is staging
only and can never reach production (guard in `supabase.js`). Each project keeps its own session, so switching signs nobody
out; the page reloads and you sign in once with that project's own account. `npm test` runs the pure selection logic.

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

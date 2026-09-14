# Saba Live — Admin

React + Vite admin panel for the Saba Live platform. It talks to the same
Supabase project as the consumer app and is protected entirely by Postgres
RLS — it only ever holds the **anon / publishable** key.

Three panels, chosen by the signed-in user's `staff_roles.role`:

| Role | Panel | Scope |
| --- | --- | --- |
| `super_admin` | Super Admin (`/super`) | everything + staff accounts + system |
| `admin` | Master / Admin (`/admin`) | day-to-day app management |
| `agency_manager`, `sub_admin` | Agency (`/agency`) | one agency only (`manages_agency`) |

`super_admin` can open all three; the others are locked to their one panel.

The public marketing site (`sabalive.in`) lives alongside this app in
[`landing/`](landing/README.md) — a separate Vite project, deployed together
with this one from a single Vercel project (see
[below](#public-site--admin-panel-one-vercel-project)).

## Local development

```bash
cp .env.example .env.local   # then fill in real values
npm install
npm run dev                  # http://localhost:5173
```

### Environment variables

Set in `.env.local` (git-ignored) for local dev, and in the Vercel project
settings for deploys:

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the project's anon / publishable key (`sb_publishable_…`) |

**Never** put the `service_role` key in this app or in any `VITE_` variable —
it would ship to the browser. Privileged operations run in Postgres
(`SECURITY DEFINER` RPCs) or in the `invite-staff` Edge Function.

## Database

The schema and its migrations live in the **consumer app repo**
(`sabalive/supabase/migrations/`). This repo contains no migrations. To
inspect or change the schema, work there and `supabase db push`.

## Bootstrapping the first Super Admin

`staff_roles` can only be written by an existing `super_admin`, so the very
first one has to be inserted by hand.

1. Have the person **sign up through the consumer app** (or the Supabase
   dashboard → Authentication → Add user) so an `auth.users` + `profiles`
   row exists.
2. In the Supabase dashboard → **SQL Editor**, run:

   ```sql
   insert into public.staff_roles (user_id, role, agency_id)
   select id, 'super_admin', null
   from auth.users
   where email = 'you@example.com'
   on conflict (user_id) do update set role = 'super_admin', agency_id = null;
   ```

3. Sign in to this panel with that account. From then on, add staff from
   **Super Admin → Admin Accounts / Agency Staff**:
   - **Grant Role** — attach a role to someone who already has an account.
   - **Invite by email** — create a brand-new login *and* grant the role in
     one step (see below).

## `invite-staff` Edge Function

Lives in the consumer app repo at `supabase/functions/invite-staff/`.
It runs with the `service_role` key (which never leaves the server), and:

- resolves the caller from their JWT and **rejects anyone who is not a
  `super_admin`**;
- calls `auth.admin.createUser` (email pre-confirmed) — a `profiles` row is
  created by the existing `on_auth_user_created` trigger;
- inserts the `staff_roles` row (rolling the auth user back if that fails);
- writes an `audit_logs` entry;
- returns `{ user_id, email, role, temp_password }` — `temp_password` is set
  only when the server generated one (i.e. the caller didn't supply a
  password). Share it over a secure channel; the invitee should change it
  on first sign-in.

### Deploy

```bash
cd ../sabalive
supabase functions deploy invite-staff --project-ref <project-ref>
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are
injected by the Edge runtime — no secrets to configure.

## Public site + Admin panel: one Vercel project

`sabalive.in` (the public marketing site, in `landing/`) and
`admin.sabalive.in` (this admin panel) are two independent frontends —
different `package.json`, different source, no shared components — but
they deploy from **one repo and one Vercel project**, split by hostname.

**How the combined build works** (`npm run build:site`, what Vercel runs):

1. `build:admin:zone` — builds *this* app with `vite build --base /admin/
   --outDir dist-combined/admin`. Only the asset base path changes; the
   app's own routes (`/login`, `/super`, `/agency/...`) and all source are
   untouched — React Router still sees the real browser URL, the `base`
   flag only changes where the JS/CSS bundle physically lives.
2. `build:landing:zone` — builds `landing/` normally into the same
   `dist-combined/` root (`--outDir ../dist-combined --emptyOutDir false`,
   so it doesn't wipe the admin build sitting next to it).
3. Result:
   ```
   dist-combined/
     index.html, assets/…            ← landing (served at sabalive.in)
     admin/index.html, admin/assets/… ← this app (served at admin.sabalive.in)
   ```

**Domain routing** (`vercel.json`, `rewrites` with a `host` condition):
a request to `admin.sabalive.in` is rewritten to `/admin/index.html`
(or `/admin/robots.txt`); every other host falls through to `/index.html`
(the landing page). Vercel serves real static files (hashed JS/CSS) directly
before rewrites ever apply, so this doesn't interfere with either app's
assets.

**In the Vercel dashboard**: one project, pointed at this repo.
Project → Settings → Domains → add `sabalive.in`, `www.sabalive.in`, and
`admin.sabalive.in` — all three to the *same* project. Build command and
output directory are already set in `vercel.json`
(`npm run build:site` → `dist-combined`); nothing to change there.

Local dev is unaffected either way — `npm run dev` here still serves just
the admin panel at `/`, and `npm --prefix landing run dev` serves the
landing page on its own port. The `--base`/`--outDir` overrides only apply
during `build:site`.

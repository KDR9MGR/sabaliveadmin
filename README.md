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

## Deploy (panel)

Vercel: build `vite build`, output `dist`, with the SPA rewrite in
`vercel.json` so deep links resolve. Set the two `VITE_` variables in the
Vercel project.

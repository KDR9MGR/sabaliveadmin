# Saba Live Admin — Profile & Password Bug Fixes (Conversation Log)

**Date:** 2026-10-01
**Project:** `sabaliveadmin` (Saba Live Admin Panel)
**Repo:** https://github.com/KDR9MGR/sabaliveadmin.git
**Commit:** `95ea517` on `main`

---

## Issue Reported by User

> discovered a new issue when a user went into profile it showed account details different from the detail entered via form non editable is okay checkout attached screenshot
>
> also users are not able to update password found this password issue on global, check and validate for all below as well for password

**Screenshot context:** Profile page showed always:
- Full name: "Mehardeep"
- Email: "mehardeep@sabalive.app"
- Phone: "+91 90000 12345"
- Role: "Super Admin"
- Bio: "Platform administrator."
- Avatar letter: "M"

…regardless of which user was actually logged in. "Update password" button also just showed a toast with no real effect.

---

## Root Cause Analysis

### Problem 1 — Profile always shows hardcoded placeholder data

All 7 admin panel routes share a single `Profile` component in `src/pages/shared.jsx`.
Every account-detail input used a static `defaultValue` prop with "Mehardeep" data:

```jsx
<input defaultValue="Mehardeep" />
<input defaultValue="mehardeep@sabalive.app" />
<input defaultValue="+91 90000 12345" />
<input defaultValue="Super Admin" disabled />
<textarea defaultValue="Platform administrator." />
```

Also:
- Avatar always showed `M` and name `"Mehardeep"` in the profile card
- Username, Country/Location fields from the add-staff form weren't shown at all
- `Last login` and `Session` were hardcoded strings

### Problem 2 — Password change & Profile save are UI-only stubs

Both buttons only fired a toast notification:

```jsx
<Button onClick={() => toast('Profile updated')}>Save</Button>
<Button onClick={() => toast('Password changed')}>Update password</Button>
```

No form state, no validation, no Supabase API calls.

Also: the `useAuth()` context in `src/lib/auth.jsx` only exposed `signIn` / `signOut`
and read-only profile data — no methods for `updateProfile()` or `changePassword()`.

### Breadth check — which panels are affected?

Every profile route uses the same shared `Profile` component — so the bugs were global.

| Route | Panel | Wrapper component |
|---|---|---|
| `/admin/profile` | Master / Admin | `<Profile panel="Master / Admin" />` |
| `/super/profile` | Super Admin | `<Profile panel="Super Admin" />` |
| `/global-admin/profile` | Global Admin | `GlobalProfile → <Profile panel="Global Admin" />` |
| `/country-admin/profile` | Country Admin | `CountryProfile → <Profile panel="Country Admin" />` |
| `/sub-admin/profile` | Sub Admin | `SubAdminProfile → <Profile panel="Sub Admin" />` |
| `/agency-manager/profile` | Agency Manager (legacy) | `<Profile panel="Agency Manager" />` |
| `/panel-agency/profile` | Agency Panel (new) | `PanelAgencyProfile → <Profile panel="Agency" />` |

---

## User Clarification on Requirements

After the first fix the user clarified the intended behavior:

> so now user will see profile info which where added via add form and password will be updateable now?
>
> note profile info should show entered via add form **not updateable**

→ **Account details = display-only** (whatever was entered in Add Staff / Add Agency forms).
→ **Password change = functional + actually persists** (users self-service their own password).
→ Email + Role were already intended as non-editable — confirmed by user.

Fields that come from Add Staff form ([addStaff.jsx](src/pages/addStaff.jsx)):
- `full_name`, `username`, `email`, `phone`, `role`, `location` (Country), `password`, `payment_pin`
Plus agency forms set: `full_name`, `username`, `email`, `phone`, `country`, `password`.

So the display fields should be: **Full name, Username, Email, Phone, Role, Location/Country, Bio** — all disabled.

---

## Fix Implementation

### File 1: `src/lib/auth.jsx` — added mutations to AuthContext

**Before:** context only had `signIn`, `signOut`, read-only `profile`/`staffRole`.

**After:** added:

- `updateProfile({ name, phone, bio })` — does `supabase.from('profiles').update(...).eq('id', user.id)` and refreshes local state (kept on context because we may want staff self-edit later; currently unused in UI)
- `changePassword(currentPassword, newPassword)` — re-verifies current password via `signInWithPassword`, then calls `supabase.auth.updateUser({ password })`
- Re-exports `ROLE_LABEL` (imported from `./admin.js`) so the Profile component can display pretty role names

### File 2: `src/pages/shared.jsx` — rewrote `Profile` component

**Changes vs. old stub:**

1. **Data source** — reads from `useAuth()`:
   - `displayName` = `profile.name ?? user.email localpart ?? 'User'`
   - `avatarLetter` = first letter of real `displayName`
   - `email` = `user.email` (from auth, not from profile row)
   - `username`, `phone`, `bio`, `location` = from `profile` row
   - `roleLabel` = `ROLE_LABEL[staffRole.role]`

2. **All account-details fields disabled** — `<input disabled>` / `<textarea disabled>`.
   Tooltip `title="Set when account was created"`. Added two fields that were missing:
   - **Username** row (newly added)
   - **Location / Country** row (newly added)

3. **Removed Save button** — profile editing on this page is gone per requirements.
   Added helper note: *"Account details are set when your account is created and
   cannot be edited here. Contact a Super Admin if you need changes."*

4. **Password change is now real** — controlled form state (`currentPassword`,
   `newPassword`, `confirmPassword`) with client checks:
   - Current password required
   - New password ≥ 6 chars
   - New === Confirm match
   - New ≠ Current different
   
   Then calls `changePassword()` which re-verifies current password on the server
   and updates via `auth.updateUser`. Error shown inline + danger toast. On success
   form is cleared + success toast. Loading state on button.

5. **Security card** — `Last login` now shows actual `user.last_sign_in_at` instead
   of the hardcoded "Today, 09:14 · Mumbai".

---

## Verification

- `npm run build` → exit 0 ✓
- VS Code diagnostics (GetDiagnostics) → [] ✓
- Both modified files are in the commit:
  ```
  2 files changed, 172 insertions(+), 17 deletions(-)
   src/lib/auth.jsx
   src/pages/shared.jsx
  ```

---

## Git / Push

- **Commit:** `95ea517`
- **Message:** `fix(profile): show real account data (non-editable), fix password change`
- **Branch:** `main`
- **Push:** `772ce06 → 95ea517  main → main` to `origin  https://github.com/KDR9MGR/sabaliveadmin.git`

---

## Follow-up / Future Items (Not Done Per Requirements)

- "Change photo" button is still toast-only (`toast('Choose photo')`). Implementing it needs a Supabase storage bucket + avatar URL column + upload UI.
- `updateProfile()` was added to auth context but is not used by the Profile UI
  (disabled per user requirement). It's available if Super Admins want a staff
  self-edit flow later.
- Two-factor auth and login-alert toggles in the Security card are still purely
  UI placeholders (no state change, no persistence).
- "Change payment PIN" was requested by the user in the past but isn't on this
  profile page yet (requires `payment_pin` RLS + change-with-verification flow).

# Master Panel: Add "Transfer Global" Implementation Plan

## Repository Research

### Current state (Master panel → User Management navigation)
`NAV.master` in [nav.js](src/config/nav.js#L59-L73) already contains 4 "Transfer X" items under User Management:
1. Transfer Host → `/admin/users/transfer-host` (uses `MasterTransferHost = CountryTransferHost`)
2. Transfer Agency → `/admin/users/transfer-agency` (uses `MasterTransferAgency = CountryTransferAgency`)
3. Transfer Sub Admin → `/admin/users/transfer-sub-admin` (uses `MasterTransferSubAdmin = CountryTransferSubAdmin`)
4. Transfer Country → `/admin/users/transfer-country` (uses `MasterTransferCountry = CountryTransferCountry`)

These are aliased in [master/users.jsx](src/pages/master/users.jsx#L38-L44) — they simply re-export the Country Admin components because "the whole Global > Country > Sub > Agency tree" is already accessible to Master (see migration 20261001090000 comment in the file).

Routes are registered in [App.jsx](src/App.jsx#L102-L105).

### The hierarchy
`Global Admin` → owns `Country Admin`s (via `staff_roles.country_admin_id`)
`Country Admin` → owns `Sub Admin`s (via `staff_roles.country_admin_id`)
`Sub Admin` → owns `Agency`s (via `agencies.sub_admin_id`)
`Agency` → holds `Host`s

The existing transfer components match this pattern:
- **CountryTransferSubAdmin** → moves a Sub Admin + its tree to a different Country Admin
- Missing: a page for the level **above** that — move a **Country Admin + its tree** to a different **Global Admin**. That's what "Transfer Global" logically is (transfering ownership of a Country Admin between two Global Admins).

### Existing data layer — country.js
[country.js](src/lib/country.js) already has:
- `countryScope()` → returns `{ countryAdmins, subAdmins, agencies }`. Each `countryAdmin` row includes `subAdmins`, `agencies`, `hosts` counts for display.
- `globalAdminOptions()` → picker list of all Global Admin accounts (for Transfer Coins recipients; reusable as the "target" list)
- `transferSubAdmin({ subAdminId, toCountryAdmin })` → RPC `transfer_sub_admin`. Analog we need: `transferCountryAdmin({ countryAdminId, toGlobalAdmin })` calling a new `transfer_country_admin` RPC (or re-using an existing one if already modelled).

**Important check on server-side RPC:** The existing transfer actions all go through `rpc()` calls. Adding "Transfer Global" needs:
1. **Client-side code**: new Transfer page component + nav entry + route.
2. **Server-side** (Supabase DB): an equivalent `transfer_country_admin` RPC and RLS check must exist. If the migration hasn't been run yet, we'll need to gracefully handle a missing RPC error and surface it in the UI. Plan only adds client-side plumbing — the RPC name will follow the existing convention and error will be surfaced.

### UI / component patterns to mirror
[CountryTransferSubAdmin](src/pages/countryAdmin.jsx#L156-L193):
- Uses `<Loaded>` wrapper, loads countryScope + target picker options (other country admins, excluding self)
- `<Card>` with description about what transferring means
- `<DataTable>` of owned sub admins: name, ID, counts of agencies/hosts
- Row action "Transfer to another country admin" opens `<EntityForm>`
- `<EntityForm>` drop-down selects the new owner, `onSubmit` calls the RPC then `reload()`

"Transfer Global" will be the same pattern, but:
- Source list = **Country Admins from countryScope().countryAdmins + current owner labelled** (need to know current Global Admin owner → will add display from `staff_roles.global_admin_id` if the column exists, or fall back to "Unassigned" + filter note)
- Target picker = **`globalAdminOptions()` filtered to exclude current owner**
- RPC call: `transferCountryAdmin({ countryAdminId, toGlobalAdmin })` → `rpc('transfer_country_admin', { p_country_admin_id, p_to_global_admin })`

## Files and Modules

| File | Expected change |
|---|---|
| [src/lib/country.js](src/lib/country.js) | Add `transferCountryAdmin()` RPC wrapper. Extend `countryScope().countryAdmins` to include `globalAdminId` / `globalAdmin` label if column exists (safe left-join, graceful null handling). Add `otherGlobalAdminOptions()` picker that excludes current owner. |
| [src/pages/countryAdmin.jsx](src/pages/countryAdmin.jsx) | Add new component `CountryTransferGlobal` — follows the exact CountryTransferSubAdmin pattern: list country admins, row action opens EntityForm to pick new Global Admin target, submits RPC, reloads. Pairs with it so Global Admin panel can also use it. |
| [src/pages/globalAdmin.jsx](src/pages/globalAdmin.jsx) | Re-export `CountryTransferGlobal` as `GlobalTransferGlobal` alongside the existing 4 GlobalTransferX aliases. |
| [src/pages/master/users.jsx](src/pages/master/users.jsx) | Import + alias `CountryTransferGlobal` as `MasterTransferGlobal` alongside the existing 4 MasterTransferX aliases. |
| [src/config/nav.js](src/config/nav.js) | Add new entry `{ label: 'Transfer Global', to: '/admin/users/transfer-global' }` under `NAV.master → User Management children`, right after the 4 existing Transfer X items. |
| [src/App.jsx](src/App.jsx) | (1) Add `MasterTransferGlobal` / `GlobalTransferGlobal` to the import list from `./pages/master/users.jsx` / `./pages/globalAdmin.jsx`. (2) Under `/admin/users/` routes (App.jsx L102-L105) add: `<Route path="users/transfer-global" element={<MasterTransferGlobal />} />`. (3) Under `/global-admin/user-management/` routes (L198-L201) add equivalent so Global Admin can also do it. |

## Implementation Steps (dependency order)

1. **`src/lib/country.js`**:
   - Add `otherGlobalAdminOptions(currentOwnerId)` — loads all Global Admins minus the `currentOwnerId` (and minus self if me === a Global Admin, for consistency with `otherCountryAdminOptions`). Uses `staff_roles.role === 'global_admin'` joined to profiles.
   - Attempt to extend `countryScope()` `countryAdmins` projection to include `global_admin_id` (if column exists on staff_roles) and resolve the owning Global Admin name. If the DB column doesn't exist yet, fall back to "Unassigned" without erroring so the rest of the page renders.
   - Add `transferCountryAdmin({ countryAdminId, toGlobalAdmin })` → calls `rpc('transfer_country_admin', { p_country_admin_id: countryAdminId, p_to_global_admin: toGlobalAdmin })`.

2. **`src/pages/countryAdmin.jsx`**:
   - Add `CountryTransferGlobal` component following the exact shape of `CountryTransferSubAdmin`.
   - Load via `<Loaded>` title="Transfer Global", USER_CRUMBS "Transfer Global".
   - Load function = `countryScope()` + wait, then for each country admin resolve its current global admin and build `otherGlobalAdminOptions(currentOwner)`.
   - Info card above table: *"Transferring a Country Admin hands them, and every Sub Admin, Agency and Host they own, to another Global Admin. You lose access to them immediately."*
   - Table columns: personCol(name, username), displayId User ID, counts subAdmins/agencies/hosts.
   - Row action: "Transfer to another Global Admin" → opens `<EntityForm>` with the new-owner selector.
   - Submit → await `transferCountryAdmin({ countryAdminId: moving.id, toGlobalAdmin: v.global_admin })` → `reload()`.

3. **Wire aliases**:
   - `master/users.jsx`: `export const MasterTransferGlobal = CountryTransferGlobal`
   - `globalAdmin.jsx`: import + `export const GlobalTransferGlobal = CountryTransferGlobal`

4. **Navigation entry**:
   - `nav.js` → in `NAV.master → Management → User Management children[]`, insert the Transfer Global line after the existing 4 Transfer Host/Agency/Sub Admin/Country lines.

5. **Routes** (`App.jsx`):
   - Import `MasterTransferGlobal`, `GlobalTransferGlobal`
   - Add `/admin/users/transfer-global` route
   - Add `/global-admin/user-management/transfer-global` route
   - Also add the nav item for Global Admin panel in NAV['global-admin'] under User Management if not present (symmetry).

## Dependencies and Considerations

- **Server RPC `transfer_country_admin`**: The code will call this by name (matching `country_transfer_agency`, `transfer_sub_admin` naming). If this RPC is not yet deployed in Supabase, the submit call throws and `toast(error.message)` will surface it. No silent fails. A follow-up migration can be added separately; the UI is not blocked and clearly reports the missing/misconfigured RPC.
- **Column `staff_roles.global_admin_id`**: Analogous to the existing `country_admin_id` for Sub Admins, the staff_roles table is expected to have a `global_admin_id` column tying a country_admin row to its owning global_admin. If missing, the UI shows "Unassigned" and the transfer still works (the RPC will overwrite whatever the current value is). No hard dependency on reading it.
- **RLS / capabilities**: The transfer pages are gated behind `<RequireCap cap="manage_users">` (Master, L93) and the Global Admin area (also requires manage_users implicitly). Only Master/Admin, Super Admin, and Global Admin roles hold this capability per [capabilities.js](src/lib/capabilities.js#L34-L38).
- **No new dependency libs**: Only uses existing components (`Loaded`, `DataTable`, `EntityForm`, `personCol`, `numCol`, `Card`) and existing `rpc()` / `unwrap()` helpers from country.js.

## Validation

1. **Build** → `npm run build` passes with no errors (exit 0).
2. **Type/lint** → `GetDiagnostics` returns `[]`.
3. **Sanity checks (manual or code read)**:
   - `/admin` sidebar shows "Transfer Global" entry under User Management after the other 4 transfer items.
   - Clicking route `/admin/users/transfer-global` renders a table of Country Admins with counts, each row has the transfer action.
   - Row action opens drawer that lists other Global Admins as targets.
   - Global Admin panel (`/global-admin/user-management/transfer-global`) also works (symmetry with existing 4 transfers).
4. **Error path**: If RPC `transfer_country_admin` is missing, submitting shows a toast with the error string — no crash, state still reloadable.

## Risks

| Risk | Handling |
|---|---|
| DB missing `transfer_country_admin` RPC | UI surfaces Supabase error via toast on submit. No silent failure. Deploy the matching migration separately (out of scope for this UI change). |
| DB missing `global_admin_id` column on `country_admin` rows | Fall back to "Unassigned" label; target list still filters "other Global Admins" (no current owner excluded unless we can read one). Still works correctly — just can't pre-exclude the existing owner from the target picker. |
| Accidentally exposing self-transfer | `otherGlobalAdminOptions()` explicitly filters out current owner; also server RPC should reject self-assign; double-guarded. |
| Master vs Global Admin route collision | Routes live under distinct parents (`/admin/users/*` vs `/global-admin/user-management/*`). No collision. |

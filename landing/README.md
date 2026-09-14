# Saba Live — Landing Page

The public marketing site for `sabalive.in`. This is an independent Vite +
React + Tailwind project (its own `package.json`, no shared code with the
admin app), but it's built and deployed **as part of the `sabaliveadmin`
repo/Vercel project** — see the root [`README.md`](../README.md#public-site--admin-panel-one-vercel-project)
for how the combined build and domain routing work.

## Brand source of truth

Logo, colors and typography come from the real app, not an invented style:

- **Logo / app icon**: `sabalive/assets/images/sabalive_logo.png` and
  `app_icon.png` (resized copies live in `public/`).
- **Colors**: `sabalive/lib/theme/app_colors.dart` → mirrored in
  `tailwind.config.js`.
- **Typography**: Poppins — the app's own `.ttf` files, self-hosted in
  `public/fonts/`.
- **Product facts**: the app's real feature modules
  (`sabalive/lib/features/*`) and shared Supabase schema — not invented copy.

## Structure

`/`, `/features`, `/about`, `/faq`, `/contact`, `/privacy`, `/terms`. See
`src/components/home` (homepage sections), `src/components/mockups`
(hand-built on-brand recreations of real app screens), `src/pages`,
`src/data` (feature/FAQ copy), `src/lib` (site constants + SEO hook).

## Before going to production, fill in

Deliberately left as follow-ups rather than invented:

1. **App Store / Google Play links** — `src/lib/site.js` → `STORE_LINKS`.
2. **Social links**, if any — `src/lib/site.js` → `SOCIAL_LINKS`.
3. **Legal specifics** in `Privacy.jsx` / `Terms.jsx` — currently "Saba
   Live" as operator, India as governing law (inferred from the `.in`
   domain + ₹ economy). Have counsel review before launch.

## Local development

```bash
npm install
npm run dev      # http://localhost:5174
```

To build just this app on its own (e.g. to sanity-check it in isolation):

```bash
npm run build && npm run preview
```

The real production build runs from the **repo root** (`npm run
build:site`), which builds this app into the shared `dist-combined/`
output alongside the admin panel.

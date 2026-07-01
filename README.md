# GIAP — Geospatial Integrated Analysis Portal

Geospatial analysis platform for UNFPA's mandate in West and Central Africa
(modeled after the Population Data Portal and SWP 2024 report), restyled in the
**Quantum** corporate portal design language.

Originally an AI Studio app; replicated and re-themed to run locally with Claude
Code. React 19 + Vite + Tailwind v4, with Gemini AI briefings and Firebase auth.

## Run locally

```bash
npm install --legacy-peer-deps
npm run dev          # http://localhost:3000  (preview tooling uses 3002)
```

The app boots straight to the Quantum **Home portal**. With no keys configured it
runs in a **local mock session** — click "Sign in with Google" to enter as the
demo admin (Moussa BAGAYOKO). All modules are fully navigable.

## Adding real keys

1. **Gemini** (AI briefings & analysis): put your key in `.env.local`
   ```
   GEMINI_API_KEY="your-key"
   ```
2. **Firebase** (Google auth + Firestore user store): replace the placeholder
   values in `firebase-applet-config.json` with your real project config. As soon
   as `apiKey` is no longer the placeholder, real Google sign-in and the
   connectivity probe activate automatically (the mock session turns off).

## Design

The Quantum reskin is driven from two places:

- `src/index.css` — the `@theme` tokens (`--color-unfpa-blue`, `--color-sidebar-bg`,
  `--color-main-bg`, …) are remapped to the Quantum corporate-blue palette, which
  propagates across every module.
- `src/components/quantum/` — the Quantum portal shell:
  - `QuantumHome.tsx` — the tiled home portal (greeting hero, tab nav, Quick
    Actions, Apps grid) that launches each GIAP module.
  - `QuantumTopBar.tsx` — the white utility bar (brand + icon cluster + avatar).
  - `QuantumBrand.tsx` — the GIAP brand mark.

`Home` is the default view; every module is reachable from the Apps grid or the
in-app header nav.

## Database (Supabase)

The portal can persist **all of its data** to a Supabase (Postgres) project: users &
audit trail, module access, the PDP indicator catalog + revisioned observations,
the IRRF ledger, and uploaded quarterly monitoring reports (rows + original file in
Storage). With no configuration it runs fully offline (localStorage + the bundled
data snapshot) — nothing breaks without keys.

### One-time setup
1. Create a project at https://supabase.com (free tier is fine).
2. Apply the schema: paste `supabase/migrations/0001_init.sql` into the SQL editor
   (or `supabase db push` with the CLI). This creates 14 tables, RLS policies, and
   the `monitoring-reports` Storage bucket.
3. Script credentials: `cp scripts/.env.example scripts/.env` and fill in
   `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API). This file
   is gitignored — the service-role key bypasses RLS and must never be committed.
4. Seed reference data: `npm run db:seed`
   (countries, indicator catalog, IRRF ledger, module switches, demo users).
5. Load indicator data: `npm run db:ingest`
   (runs the live PDP/DHS/WHO ingestion and inserts a new revision).
6. App credentials: add to `.env.local`
   `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (the publishable anon key).

### How the app uses it
- `src/services/userService.ts` — provider order: Supabase → Firestore → localStorage mock.
- `src/lib/moduleAccess.ts` — localStorage stays the sync cache; DB is pulled on boot
  and every toggle is pushed back (fire-and-forget).
- `src/lib/indicatorData.ts` — the bundled JSON renders first; the freshest DB
  revision is overlaid in the background (`useLiveIndicators()` re-renders charts).
- Quantum Tracker — parsed reports (+ the original PDF) are saved after render,
  never blocking the extraction overlay; recent uploads show in the hero.

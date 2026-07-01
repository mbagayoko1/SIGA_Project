# TASK: Create the SIGA database (Supabase/Postgres) and persist ALL portal data

Work in the SIGA portal at `/Users/moussabagayoko/Desktop/BioFarm/giap`
(React 19 + Vite 6 + Tailwind v4, browser-only SPA — no backend server; deployed static to
GitHub Pages at https://mbagayoko1.github.io/SIGA_Project/). Target: **Supabase** (hosted
Postgres + PostgREST + supabase-js), talking directly from the browser with Row-Level
Security — do NOT introduce an Express/server tier.

## Goal
Design and create a normalized Postgres schema on Supabase, migrate **every data store the
portal currently uses** into it, and wire the app to read/write Supabase as its primary
backend — while preserving the project's "works with zero keys" philosophy (seed/localStorage
fallback when `VITE_SUPABASE_URL` is absent).

## Complete data inventory to migrate (verified — do not skip any)

| # | Data | Where it lives today | Persistence today |
|---|------|---------------------|-------------------|
| 1 | 24 WCA country offices (`WCA_COUNTRIES`, `CountryData`) | `src/data.ts` | committed TS seed |
| 2 | PDP indicator catalog (4 domains → sub-domains → 31 indicators, codes, units, `inverse`) | `src/data/indicatorCatalog.ts` | committed TS |
| 3 | Indicator observations with provenance (`IndicatorValue`: value, source, sourceUrl, referenceYear, fetchedAt, isStale, fallbackUsed) + revision header | `src/data/indicators.generated.json` (written by `scripts/ingest-indicators.mjs`) | committed JSON snapshot |
| 4 | Users (`UserProfile`: uid, email, displayName, role, active, allowedModules[], title, department, location, bio, photoURL, timestamps) | `src/services/userService.ts` | localStorage `siga_users` (Firestore branch exists but unused) |
| 5 | Activity/audit logs (`ActivityLog`) | `src/services/userService.ts` | localStorage `siga_logs` (capped 500) |
| 6 | Module access config (global per-module enable/disable) | `src/lib/moduleAccess.ts` | localStorage `siga_module_access` |
| 7 | IRRF results-framework ledger (id, label, baseline, target2029, currentRegional, unit, outcomeId) | `IRRF_LEDGER` hardcoded in `src/components/IRRFTracking.tsx` | hardcoded |
| 8 | Quarterly monitoring reports (`MonitoringData`: office, period, summary counts, outputs → milestones w/ status + responsible) parsed from uploaded PDFs by `src/lib/parseMonitoringReport.ts` | Quantum Tracker | **NOT persisted — lost on reload** |
| 9 | Strategic-Plan outcome metadata (`SP_OUTCOMES`) | `src/types.ts` | committed TS |
| 10 | Mock content arrays (Strategy Alignment scores, Political intel items, Dynamics panels) in `StrategyAlignment.tsx`, `PoliticalAnalysis.tsx`, `PopulationDynamicsDashboard.tsx` | components | hardcoded |

## 1) Schema (SQL migration in `supabase/migrations/0001_init.sql`)
Normalized, with FKs and sensible indexes:

- `countries` (iso3 PK, name, m49_code, region, population_m, unfpa_active, crisis_level, idp_k, refugee_k)
- `domains` (id PK, name, outcome_id, outcome_label, color, icon)
- `subdomains` (id PK, domain_id FK, name)
- `indicators` (code PK, subdomain_id FK, name, short, unit, inverse bool)
- `indicator_values` (id PK, indicator_code FK, iso3 FK, value numeric NULL, source text, source_url, reference_year int, fetched_at timestamptz, is_stale bool, fallback_used bool, revision_id FK; UNIQUE(indicator_code, iso3, revision_id))
- `revisions` (id PK, generated_at, current_year, primary_source, stale_threshold_years, sources_used text[])
- `profiles` (uid PK, email UNIQUE, display_name, role text CHECK in ('admin','editor','viewer'), active bool, allowed_modules text[], title, department, location, bio, photo_url, created_at, updated_at, last_active)
- `activity_logs` (id PK, user_id, user_name, action, metadata jsonb, ts timestamptz; index on ts DESC)
- `module_access` (module_key PK, enabled bool)
- `irrf_ledger` (id PK e.g. '1.1', label, baseline numeric, target_2029 numeric, current_regional numeric, unit, outcome_id)
- `monitoring_reports` (id PK, office, period, uploaded_by, uploaded_at, total_milestones int, progress_reported int, yet_to_report int, achieved int, not_achieved int, overachieved int, raw_file_path text NULL — use Supabase Storage bucket `monitoring-reports` for the original PDF)
- `monitoring_outputs` (id PK, report_id FK, code, title)
- `monitoring_milestones` (id PK, output_id FK, label, status text CHECK in ('Achieved','Overachieved','Not Achieved','Yet to be Reported'), responsible)
- `content_blocks` (id PK, module text, key text, payload jsonb) — generic home for the
  Strategy-Alignment/Political/Dynamics mock arrays so they become editable data, not code.

## 2) Row-Level Security (decision point — implement this default, note alternatives)
Enable RLS on every table.
- Reference data (`countries`, `domains`, `subdomains`, `indicators`, `indicator_values`,
  `revisions`, `irrf_ledger`, `content_blocks`): `SELECT` for `anon` + `authenticated`;
  writes only via `service_role` (used by scripts/CI).
- `profiles`, `activity_logs`, `module_access`, `monitoring_*`: `SELECT`/`INSERT`/`UPDATE`
  for `authenticated`; role checks (admin-only user management + module toggles) enforced in
  policies via a `profiles.role` lookup, not just client code.
- NOTE: the app today uses mock Google auth. Wire Supabase Auth (Google provider) so
  `auth.uid()` matches `profiles.uid`; keep the mock path when env keys are absent.

## 3) Seed & sync scripts (Node, in `scripts/`)
- `scripts/db-seed.mjs` — idempotent (upsert): pushes `WCA_COUNTRIES`, the indicator catalog,
  `SP_OUTCOMES`, the IRRF ledger (lifted out of `IRRFTracking.tsx` into `src/data/irrf.ts`),
  the mock content arrays into `content_blocks`, and the 5 demo users into `profiles`.
- Extend `scripts/ingest-indicators.mjs` with a `--db` flag: after writing
  `indicators.generated.json`, insert a new `revisions` row + bulk-upsert `indicator_values`
  (keep writing the JSON — it stays the offline fallback for the static build).
- Uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from `scripts/.env` (gitignored; never
  shipped to the client, never committed).

## 4) App wiring (provider pattern — mirror the existing `IS_MOCK` seam)
- `src/lib/supabase.ts`: create client from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
  (define in `.env.local`; add to `.env.example` with placeholders). Export
  `hasSupabase` (both vars present).
- `src/services/userService.ts`: add a **third provider branch** — `supabase` when
  `hasSupabase`, else the existing mock/localStorage path (leave the Firestore branch
  intact). Preserve every method signature (`getUserProfile`, `createUserProfile`,
  `updateUserProfile`, `deleteUserProfile`, `getAllUsers`, `logActivity`, `getActivityLogs`,
  `setActor`) so `UserManagement.tsx`/`UserProfile.tsx`/App.tsx need no changes.
- `src/lib/moduleAccess.ts`: read/write `module_access` when `hasSupabase` (keep the
  localStorage fallback and the `siga-module-access` broadcast event).
- `src/lib/indicatorData.ts`: on boot, if `hasSupabase`, fetch the latest revision's
  `indicator_values` and overlay them on the bundled snapshot (bundled JSON remains the
  synchronous default so first paint never blocks; refresh in the background and re-render).
- Quantum Tracker (`QuantumTracker.tsx`): after a successful client-side parse, upload the
  original file to the `monitoring-reports` Storage bucket and insert the report + outputs +
  milestones rows. **Render-first, fire-and-forget with `.catch`** — do NOT block the
  "EXTRACTING…" overlay on network I/O (this exact ordering bug froze the UI once already).
  Add a report-history list in the tracker fed from `monitoring_reports`.
- `IRRFTracking.tsx`: read the ledger from `irrf_ledger` (fallback: the new `src/data/irrf.ts`).

## 5) Constraints
- App MUST still build and run fully offline with zero env vars (seed + localStorage), and
  `npm run build` must stay deployable to GitHub Pages unchanged.
- No secrets in the repo: only the publishable anon key goes in `.env.local` (gitignored);
  service-role key lives only in `scripts/.env`. Update README ("Database" section: how to
  create the Supabase project, run the migration via `supabase db push` or the SQL editor,
  seed, and configure env).
- `npm run lint` (tsc --noEmit) passes; zero new runtime console errors.

## Acceptance criteria
- [ ] `0001_init.sql` creates all 14 tables with FKs, checks, indexes, and RLS policies.
- [ ] `node scripts/db-seed.mjs` is idempotent and populates reference data + demo users.
- [ ] `npm run ingest:live -- --db` writes a new revision + 744 indicator_values rows.
- [ ] With env set: users/audit/module-access CRUD hits Supabase and survives reload across
      browsers; uploading a monitoring PDF persists report + file and appears in history.
- [ ] With NO env: app behaves exactly as today (mock auth, localStorage, bundled JSON).
- [ ] Analytics/Stage/Ledger render from the freshest revision when online.
- [ ] No service-role key or real secrets committed.

## Deliverables
Migration SQL, seed script, `--db` ingestion flag, `src/lib/supabase.ts`, the three provider
wirings (users/module-access/indicators), monitoring-report persistence + history UI, IRRF
ledger extraction, README section, and an end-to-end verification pass on the dev server.

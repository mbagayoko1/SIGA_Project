# TASK: Live multi-source indicator ingestion + provenance for SIGA (Outcomes 1–3)

Work in the SIGA portal at `/Users/moussabagayoko/Desktop/BioFarm/giap`
(React 19 + Vite 6 + Tailwind v4, browser-only SPA, no backend — deployed static to GitHub Pages).

> **A working scaffold is already in place** (see "Scaffold status" at the bottom). Continue from it —
> do not start over. Your job is to (1) wire the real source APIs into the ingestion script and
> (2) consume the loader in the four tabs.

## Goal
Refresh the indicators under **Outcome 1, 2, and 3** from real external APIs, using the **UNFPA
Population Data Portal as the PRIMARY source**, falling back to alternative sources when the primary
value is missing or stale. Every indicator value must carry an explicit, visible **data-source
attribution and reference year**. Then update the **Intelligence Platform**, **STAGE**, **ANALYTICS**,
and **LEDGER** tabs to reflect the revised data, its sources, and revision date.

## Indicators in scope (existing `Indicator` keys in `src/types.ts`)
- **Outcome 1 — Family Planning:** `unmetNeed`, `mCPR`, `demandSatisfied`
- **Outcome 2 — Maternal & Newborn Health:** `mmr`, `adolescentBirthRate` (+ skilled birth attendance,
  add as a new key `skilledBirthAttendance` + a new `CountryData` field if a source provides it)
- **Outcome 3 — GBV & Harmful Practices:** `gbvPrevalence`, child marriage (add new key `childMarriage`)
Outcome 4 is OUT of scope — leave on existing values.

## Data sources & priority (per indicator)
1. **PRIMARY — UNFPA Population Data Portal** — https://pdp.unfpa.org/#/
   Discover its data API (inspect the site's network requests / public docs). Authoritative for all
   in-scope SP indicators. Wire `FETCHERS['UNFPA PDP']` in the ingestion script.
2. **ALTERNATIVES (only when PDP missing or stale)** — query in this order, take the **freshest**:
   - **DHS Program** — https://dhsprogram.com/ — STATcompiler REST
     (`https://api.dhsprogram.com/rest/dhs/data`). Best survey source for Outcome 1/2/3.
   - **WHO GHO** — https://www.who.int/data/gho — OData (`https://ghoapi.azureedge.net/api/`).
   - **UN WPP** — https://population.un.org/wpp/ — Data Portal API
     (`https://population.un.org/dataportalapi/api/v1/`).
   - **GDELT** — https://www.gdeltproject.org/ — DOC 2.0 API. **Context/crisis signal ONLY** (news
     volume & tone feeding `crisisLevel`/humanitarian watch) — NEVER a numeric substitute for a rate.

## "Up to date" definition (staleness rule)
- `STALE_THRESHOLD_YEARS = 3`. A value is **fresh** if `referenceYear >= currentYear - 3`, else **stale**.
- If PDP is missing or stale → walk the alternative chain, pick the most recent `referenceYear`, record
  that a fallback was used. If nothing is found, keep the seed value flagged as baseline.

## Architectural constraint — no browser-side cross-origin pulls
Static SPA + GitHub Pages. Ingestion is a **Node build-time script** that writes committed JSON; the app
reads the JSON at build time. The app MUST still build & run with no network (seed fallback). A
serverless `/api/indicators` proxy (Vercel/Netlify) is the optional future path for on-demand refresh.

## Tab updates
- **Intelligence Platform** (`src/components/AboutGeospatialPlatform.tsx`, view `about-geospatial`):
  add a **"Data Revision & Sources"** panel — revision date (`getRevision().generatedAt`), staleness
  threshold, and a per-indicator table (label · value · **source badge** · reference year · Fresh/Stale
  chip), grouped by Outcome 1/2/3. Replace the existing hardcoded `indicator.source` with live provenance.
- **STAGE** (map, view `stage`): drive the choropleth from `getIndicatorNumber`; show a source-attribution
  caption under the legend and a per-country source note in the hover/click panel.
- **ANALYTICS** (`src/components/Dashboard.tsx`, view `analytics`): recompute charts from revised values;
  add per-chart source footnotes and a "last revised {date}" subtitle; annotate fallbacks.
- **LEDGER** (`src/components/DataTable.tsx`, view `table`): add **Source**, **Year**, **Freshness**
  columns per indicator/country; make Source filterable + exportable; flag stale rows.

## Source attribution rule (global)
Any in-scope value shown anywhere (sidebar, tiles, IRRF, briefings) must be traceable to its
`DataSource` at minimum via tooltip. Build a reusable `<SourceBadge value={IndicatorValue} />`.

## Acceptance criteria
- [ ] `npm run ingest:live` populates `src/data/indicators.generated.json` with real PDF-primary values
      and correct fallbacks/`referenceYear`; `npm run ingest` (offline) still produces a valid seed snapshot.
- [ ] `npm run lint` passes; `npm run build` succeeds; app runs with NO network via the seed fallback.
- [ ] Intelligence Platform shows the revision panel with per-indicator sources for Outcomes 1–3.
- [ ] STAGE / ANALYTICS / LEDGER read revised values and display source + reference year; stale flagged.
- [ ] Every in-scope value is attributable to a `DataSource`; GDELT used only as a context signal.
- [ ] No secrets committed; any API key (e.g. DHS) read from env with graceful skip.

---

## Scaffold status (already implemented — extend, don't recreate)
- **Provenance types** — `src/types.ts`: `DataSource`, `IndicatorValue`, `IndicatorRevision`,
  `IndicatorSnapshot`.
- **Ingestion script** — `scripts/ingest-indicators.mjs`: 24-country loop, `INDICATOR_CONFIG` (source
  chains + per-source codes), staleness/priority engine, seed parser, JSON writer. `FETCHERS['WHO GHO']`
  and `FETCHERS.DHS` are implemented best-effort; `FETCHERS['UNFPA PDP']` and `['UN WPP']` are TODO
  stubs returning null. GDELT context fetcher present (`fetchGdeltContext`), unused by the rate engine.
- **Generated snapshot** — `src/data/indicators.generated.json` (committed; offline seed run).
- **Loader** — `src/lib/indicatorData.ts`: `getIndicatorValue`, `getIndicatorNumber`,
  `getIndicatorSeries`, `getRevision`, `hasLiveData` — merges snapshot over the `WCA_COUNTRIES` seed.
- **npm scripts** — `ingest` (offline) and `ingest:live` (real APIs).

### Remaining work for you
1. Implement `FETCHERS['UNFPA PDP']` (and optionally `['UN WPP']`) in the ingestion script; verify the
   DHS country-code map (`DHS_COUNTRY`) and all source `codes` against each API's docs.
2. Add `skilledBirthAttendance` + `childMarriage` (new `Indicator` keys, `CountryData` fields, seed
   values, `INDICATOR_CONFIG` entries) if you want them live.
3. Build `<SourceBadge />` and wire the four tabs to the loader per "Tab updates".
4. Run `npm run ingest:live`, then verify lint + build + the dev server before declaring done.

#!/usr/bin/env node
/**
 * SIGA — multi-source indicator ingestion (Outcomes 1–3)
 * ------------------------------------------------------
 * Pulls the in-scope indicators for the 24 WCA country offices, using the
 * UNFPA Population Data Portal as the PRIMARY source and falling back to
 * DHS / WHO GHO / UN WPP when PDP is missing or stale. Writes a normalized,
 * fully-attributed snapshot to src/data/indicators.generated.json.
 *
 * USAGE
 *   node scripts/ingest-indicators.mjs           # offline: emits seed snapshot (safe, deterministic)
 *   node scripts/ingest-indicators.mjs --live     # attempts the real APIs, falls back per-indicator
 *
 * This is a SCAFFOLD: the offline path is fully working today. Each network
 * fetcher has a real endpoint shape with TODOs where the exact indicator IDs
 * must be confirmed against the source's docs. Until then --live degrades
 * gracefully to the seed, so the build is never broken.
 *
 * No browser involved (CORS-free, Node global fetch). Run at build time and
 * commit the generated JSON so the static GitHub Pages build serves it.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_TS = resolve(ROOT, 'src/data.ts');
const OUT = resolve(ROOT, 'src/data/indicators.generated.json');

const LIVE = process.argv.includes('--live');

// --- Tunables ----------------------------------------------------------------
const STALE_THRESHOLD_YEARS = 3;
const CURRENT_YEAR = new Date().getFullYear();
const BASELINE_YEAR = 2024;      // reference year stamped on seed fallback values
const FETCH_TIMEOUT_MS = 12_000;

// --- Source URLs (for provenance attribution) --------------------------------
const SOURCE_URL = {
  'UNFPA PDP': 'https://pdp.unfpa.org/',
  DHS: 'https://dhsprogram.com/',
  'WHO GHO': 'https://www.who.int/data/gho',
  'UN WPP': 'https://population.un.org/wpp/',
  GDELT: 'https://www.gdeltproject.org/',
  'SIGA baseline (seed)': 'https://github.com/mbagayoko1/SIGA_Project',
};

/**
 * In-scope indicators (Outcomes 1–3) → which CountryData field holds the seed
 * value, and the ordered source chain to try (PDP always first).
 * Source-specific lookup codes live under `codes` (TODO: verify against docs).
 */
// `codes['UNFPA PDP']` is the real PDP indicator_code (verified against the live
// Driver_Tables catalog). All chosen at the "all women" disaggregation to match
// the SIGA indicator descriptions. PDP serves modelled estimates for FP rates,
// MMEIG for MMR, and DHS survey rounds for IPV.
const INDICATOR_CONFIG = {
  // Outcome 1 — Family Planning
  unmetNeed:           { seedField: 'unmetNeed',           sources: ['UNFPA PDP', 'DHS'],          codes: { 'UNFPA PDP': '37.1', DHS: 'FP_NADA_W_UNT' } },
  mCPR:                { seedField: 'mCPR',                sources: ['UNFPA PDP', 'DHS', 'WHO GHO'], codes: { 'UNFPA PDP': '33.1', DHS: 'FP_CUSM_W_MOD', 'WHO GHO': 'MDG_0000000017' } },
  demandSatisfied:     { seedField: 'demandSatisfied',     sources: ['UNFPA PDP', 'DHS'],          codes: { 'UNFPA PDP': '36.1', DHS: 'FP_NADS_W_MOD' } },
  // Outcome 2 — Maternal & Newborn Health
  mmr:                 { seedField: 'mmr',                 sources: ['UNFPA PDP', 'WHO GHO', 'DHS'], codes: { 'UNFPA PDP': '52', 'WHO GHO': 'MDG_0000000026', DHS: 'MM_MMRO_W_MMR' } },
  adolescentBirthRate: { seedField: 'adolescentBirthRate', sources: ['UNFPA PDP', 'WHO GHO', 'UN WPP'], codes: { 'UNFPA PDP': '26', 'WHO GHO': 'MDG_0000000003' } },
  // Outcome 3 — GBV & Harmful Practices
  gbvPrevalence:       { seedField: 'gbvPrevalence',       sources: ['UNFPA PDP', 'DHS'],          codes: { 'UNFPA PDP': '193', DHS: 'DV_EXSV_W_12M' } },
  // TODO (new indicators — require new CountryData fields + Indicator keys before enabling):
  //   skilledBirthAttendance: { sources: ['UNFPA PDP','WHO GHO','DHS'], codes: { 'UNFPA PDP': '25', 'WHO GHO': 'MDG_0000000025' } },
  //   childMarriage:          { sources: ['UNFPA PDP','DHS'],           codes: { 'UNFPA PDP': '21.1', DHS: 'CM_MROA_W_B18' } },
};

// ISO3 → UN M49 numeric code (PDP keys country data by m49_code, stored as string).
const M49 = {
  BEN: '204', BFA: '854', CPV: '132', CMR: '120', CAF: '140', TCD: '148', COG: '178',
  CIV: '384', COD: '180', GNQ: '226', GAB: '266', GMB: '270', GHA: '288', GIN: '324',
  GNB: '624', LBR: '430', MLI: '466', MRT: '478', NER: '562', NGA: '566', STP: '678',
  SEN: '686', SLE: '694', TGO: '768',
};

// PDP "Driver Tables" catalog (hosted feature service) — used to resolve each
// indicator's country-level data service URL.
const PDP_DRIVER = 'https://services5.arcgis.com/aQMqya7Haac8J82d/ArcGIS/rest/services/Driver_Tables_6_PROD/FeatureServer';
const pdpServiceCache = new Map(); // indicator_code → Promise<country data service URL | null>

// Resolve (once, de-duped across concurrent callers) the country-level data
// service URL for a PDP indicator_code via the Driver Tables catalog.
function getPdpServiceUrl(code) {
  if (!pdpServiceCache.has(code)) {
    const where = `indicator_code='${code}' AND geo_level='Country (geolev0)'`;
    const p = getJSON(
      `${PDP_DRIVER}/2/query?where=${encodeURIComponent(where)}&outFields=url&returnGeometry=false&f=json`,
    ).then((cat) => cat?.features?.[0]?.attributes?.url ?? null);
    pdpServiceCache.set(code, p);
  }
  return pdpServiceCache.get(code);
}

// ISO3 → DHS 2-letter country code (TODO: complete/verify all 24 against DHS API).
const DHS_COUNTRY = {
  BEN: 'BJ', BFA: 'BF', CMR: 'CM', CIV: 'CI', COD: 'CD', COG: 'CG', GHA: 'GH',
  GIN: 'GN', GMB: 'GM', LBR: 'LB', MLI: 'ML', MRT: 'MR', NER: 'NI', NGA: 'NG',
  SEN: 'SN', SLE: 'SL', TCD: 'TD', TGO: 'TG', GAB: 'GA', GNB: 'GW', CAF: 'CF',
  // CPV, STP, GNQ: no recent DHS — rely on PDP/WHO/seed.
};

// --- Seed loader (parses src/data.ts so we never need a network for fallback) -
function loadSeed() {
  const txt = readFileSync(DATA_TS, 'utf8');
  const seed = {};
  // Split into per-country object windows by the `id: 'XXX'` anchor.
  const blocks = txt.split(/id:\s*'([A-Z]{3})'/).slice(1);
  for (let i = 0; i < blocks.length; i += 2) {
    const iso = blocks[i];
    const body = blocks[i + 1] || '';
    const num = (field) => {
      const m = body.match(new RegExp(`${field}:\\s*(-?[\\d.]+)`));
      return m ? Number(m[1]) : null;
    };
    seed[iso] = {
      unmetNeed: num('unmetNeed'),
      mCPR: num('mCPR'),
      demandSatisfied: num('demandSatisfied'),
      mmr: num('mmr'),
      adolescentBirthRate: num('adolescentBirthRate'),
      gbvPrevalence: num('gbvPrevalence'),
    };
  }
  return seed;
}

// --- Catalog loader (single source of truth: src/data/indicatorCatalog.ts) ----
// The full analytics catalog is keyed by PDP indicator_code. We extract every
// `code: '...'` so the catalog and the ingestion never drift apart.
const CATALOG_TS = resolve(ROOT, 'src/data/indicatorCatalog.ts');
function loadCatalogCodes() {
  const txt = readFileSync(CATALOG_TS, 'utf8');
  const codes = [...txt.matchAll(/code:\s*'([^']+)'/g)].map((m) => m[1]);
  return [...new Set(codes)];
}

// PDP codes that also have a SIGA seed + alternative-source fallback chain.
const LEGACY_BY_CODE = {
  '37.1': 'unmetNeed', '33.1': 'mCPR', '36.1': 'demandSatisfied',
  '52': 'mmr', '26': 'adolescentBirthRate', '193': 'gbvPrevalence',
};

// --- Network helpers ---------------------------------------------------------
async function getJSON(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Per-source fetchers. Each returns { value:number, referenceYear:number } or null.
 * Implemented best-effort; confirm endpoints/IDs against each source's docs.
 */
const FETCHERS = {
  // PRIMARY — UNFPA Population Data Portal (pdp.unfpa.org), backed by ArcGIS.
  // 1) resolve the indicator's country-level data service via the Driver Tables
  //    catalog (indicator_view), 2) query the latest value for the country's M49,
  //    capping at the current year so we report estimates, not future projections.
  async 'UNFPA PDP'(iso3, key, cfg) {
    const code = cfg.codes?.['UNFPA PDP'];
    const m49 = M49[iso3];
    if (!code || !m49) return null;

    const serviceUrl = await getPdpServiceUrl(code);
    if (!serviceUrl) return null;

    const where = `m49_code='${m49}' AND year<='${CURRENT_YEAR}'`;
    const j = await getJSON(
      `${serviceUrl}/0/query?where=${encodeURIComponent(where)}` +
        `&outFields=year,value,source_description&orderByFields=${encodeURIComponent('year DESC')}` +
        `&resultRecordCount=1&returnGeometry=false&f=json`,
    );
    const a = j?.features?.[0]?.attributes;
    if (!a || typeof a.value !== 'number') return null;
    return { value: Math.round(a.value * 10) / 10, referenceYear: Number(a.year) };
  },

  // WHO GHO — OData. SpatialDim is ISO3, so no country-code mapping needed.
  async 'WHO GHO'(iso3, key, cfg) {
    const code = cfg.codes?.['WHO GHO'];
    if (!code) return null;
    const j = await getJSON(
      `https://ghoapi.azureedge.net/api/${code}?$filter=SpatialDim eq '${iso3}'`,
    );
    const rows = j?.value?.filter((r) => typeof r.NumericValue === 'number' && r.TimeDim);
    if (!rows?.length) return null;
    const latest = rows.sort((a, b) => b.TimeDim - a.TimeDim)[0];
    return { value: latest.NumericValue, referenceYear: Number(latest.TimeDim) };
  },

  // DHS STATcompiler REST.
  async DHS(iso3, key, cfg) {
    const indicatorId = cfg.codes?.DHS;
    const country = DHS_COUNTRY[iso3];
    if (!indicatorId || !country) return null;
    const j = await getJSON(
      `https://api.dhsprogram.com/rest/dhs/data?indicatorIds=${indicatorId}` +
        `&countryIds=${country}&breakdown=national&f=json&perpage=200`,
    );
    const rows = j?.Data?.filter((r) => r.Value != null && r.SurveyYear);
    if (!rows?.length) return null;
    const latest = rows.sort((a, b) => b.SurveyYear - a.SurveyYear)[0];
    return { value: Number(latest.Value), referenceYear: Number(latest.SurveyYear) };
  },

  // UN WPP Data Portal. TODO: map indicator + location ids before enabling.
  async 'UN WPP'(/* iso3, key, cfg */) {
    // const j = await getJSON(`https://population.un.org/dataportalapi/api/v1/data/indicators/${id}/locations/${loc}`);
    return null; // TODO
  },
};

// GDELT is a CONTEXT signal only — never a numeric SP indicator. Returns a
// crisis/news descriptor for the humanitarian-watch context, not a rate.
// eslint-disable-next-line no-unused-vars
async function fetchGdeltContext(countryName) {
  const j = await getJSON(
    `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(
      countryName,
    )}%20(maternal%20OR%20%22gender-based%20violence%22)&mode=tonechart&format=json&timespan=3months`,
  );
  return j ?? null; // consumed by crisisLevel/humanitarian context, not the rate engine
}

// --- Resolution engine: primary → freshest fallback → seed --------------------
function makeValue(value, source, referenceYear, fallbackUsed) {
  const isStale =
    referenceYear == null || referenceYear < CURRENT_YEAR - STALE_THRESHOLD_YEARS;
  return {
    value: typeof value === 'number' ? Math.round(value * 10) / 10 : value,
    source,
    sourceUrl: SOURCE_URL[source],
    referenceYear,
    fetchedAt: new Date().toISOString(),
    isStale,
    fallbackUsed,
  };
}

async function resolveIndicator(iso3, key, cfg, seedValue) {
  if (LIVE) {
    let best = null; // freshest non-PDP candidate
    for (const src of cfg.sources) {
      const fetcher = FETCHERS[src];
      if (!fetcher) continue;
      const r = await fetcher(iso3, key, cfg);
      if (!r || typeof r.value !== 'number') continue;
      const fresh = r.referenceYear >= CURRENT_YEAR - STALE_THRESHOLD_YEARS;
      if (src === 'UNFPA PDP' && fresh) {
        return makeValue(r.value, src, r.referenceYear, false); // primary & current → done
      }
      if (src === 'UNFPA PDP') {
        // keep PDP (even if stale) as a low-priority candidate
        best = best ?? { ...r, source: src, fallbackUsed: false };
      } else if (!best || (r.referenceYear ?? 0) > (best.referenceYear ?? 0)) {
        best = { ...r, source: src, fallbackUsed: true };
      }
    }
    if (best) return makeValue(best.value, best.source, best.referenceYear, best.fallbackUsed);
  }
  // Offline default, or every source missing → seed fallback.
  return makeValue(seedValue, 'SIGA baseline (seed)', BASELINE_YEAR, true);
}

// --- Main --------------------------------------------------------------------
async function main() {
  const seed = loadSeed();
  const isos = Object.keys(seed);
  const codes = loadCatalogCodes();   // full PDP analytics catalog, keyed by code
  const values = {};
  for (const iso3 of isos) values[iso3] = {};
  const sourcesUsed = new Set();

  // One indicator at a time, all 24 countries in parallel (service URL resolved
  // once per code). Legacy codes use the full PDP→DHS/WHO→seed resolution chain;
  // the rest are PDP-only (null when PDP has no observation).
  for (const code of codes) {
    const legacyKey = LEGACY_BY_CODE[code];
    await Promise.all(
      isos.map(async (iso3) => {
        let iv;
        if (legacyKey) {
          const cfg = INDICATOR_CONFIG[legacyKey];
          iv = await resolveIndicator(iso3, legacyKey, cfg, seed[iso3]?.[cfg.seedField] ?? null);
        } else if (LIVE) {
          const r = await FETCHERS['UNFPA PDP'](iso3, code, { codes: { 'UNFPA PDP': code } });
          iv = r
            ? makeValue(r.value, 'UNFPA PDP', r.referenceYear, false)
            : makeValue(null, 'SIGA baseline (seed)', null, true);
        } else {
          iv = makeValue(seed[iso3]?.[legacyKey] ?? null, 'SIGA baseline (seed)', BASELINE_YEAR, true);
        }
        values[iso3][code] = iv;
        sourcesUsed.add(iv.source);
      }),
    );
    process.stdout.write('.');
  }
  process.stdout.write('\n');

  const snapshot = {
    revision: {
      generatedAt: new Date().toISOString(),
      currentYear: CURRENT_YEAR,
      primarySource: 'UNFPA PDP',
      staleThresholdYears: STALE_THRESHOLD_YEARS,
      sourcesUsed: [...sourcesUsed],
      countryCount: isos.length,
      indicatorKeys: codes,
    },
    values,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(
    `[ingest] mode=${LIVE ? 'live' : 'offline(seed)'} → ${OUT}\n` +
      `[ingest] ${isos.length} countries × ${codes.length} indicators · sources: ${[...sourcesUsed].join(', ')}`,
  );
}

main().catch((e) => {
  console.error('[ingest] failed:', e);
  process.exit(1);
});

/**
 * Indicator data loader — merges the generated multi-source snapshot
 * (src/data/indicators.generated.json) over the offline WCA_COUNTRIES seed,
 * exposing fully-attributed IndicatorValue records to the UI.
 *
 * The app NEVER hard-depends on the generated file: if it is absent, or a
 * given value is missing, callers fall back to the seed value stamped with
 * source 'SIGA baseline (seed)'. Run `npm run ingest` to (re)generate it.
 *
 * See prompts/indicator-ingestion.md and scripts/ingest-indicators.mjs.
 */
import type { CountryData, Indicator, IndicatorValue, IndicatorRevision, IndicatorSnapshot } from '../types';
import { WCA_COUNTRIES } from '../data';
import generated from '../data/indicators.generated.json';

// Indicators whose seed lives directly on CountryData (Outcomes 1–3 in scope).
const SEED_FIELD: Partial<Record<Indicator, keyof CountryData>> = {
  unmetNeed: 'unmetNeed',
  mCPR: 'mCPR',
  demandSatisfied: 'demandSatisfied',
  mmr: 'mmr',
  adolescentBirthRate: 'adolescentBirthRate',
  gbvPrevalence: 'gbvPrevalence',
};

// Generated snapshot (committed; produced by `npm run ingest`). Statically
// imported so it's bundled at build time — no runtime fetch, no top-level await.
// Value-level seed fallback below covers any indicator the snapshot omits.
const snapshot = generated as unknown as IndicatorSnapshot;

const SEED_BY_ISO: Record<string, CountryData> = Object.fromEntries(
  WCA_COUNTRIES.map((c) => [c.id, c]),
);

function seedValue(iso3: string, key: Indicator): IndicatorValue {
  const field = SEED_FIELD[key];
  const raw = field ? (SEED_BY_ISO[iso3]?.[field] as number | undefined) : undefined;
  return {
    value: typeof raw === 'number' ? raw : null,
    source: 'SIGA baseline (seed)',
    sourceUrl: 'https://github.com/mbagayoko1/SIGA_Project',
    referenceYear: null,
    fetchedAt: '',
    isStale: false,
    fallbackUsed: true,
  };
}

/** Fully-attributed value for one country + indicator (generated → seed fallback). */
export function getIndicatorValue(iso3: string, key: Indicator): IndicatorValue {
  return snapshot?.values?.[iso3]?.[key] ?? seedValue(iso3, key);
}

/** Plain numeric value (or null) — convenience for charts/maps. */
export function getIndicatorNumber(iso3: string, key: Indicator): number | null {
  return getIndicatorValue(iso3, key).value;
}

/** All countries' values for one indicator, attributed. */
export function getIndicatorSeries(key: Indicator): Array<{ iso3: string } & IndicatorValue> {
  return WCA_COUNTRIES.map((c) => ({ iso3: c.id, ...getIndicatorValue(c.id, key) }));
}

/** Revision metadata for the Intelligence Platform panel. */
export function getRevision(): IndicatorRevision | null {
  return snapshot?.revision ?? null;
}

/** True once any non-seed source has supplied data (i.e. a real ingestion ran). */
export function hasLiveData(): boolean {
  return (snapshot?.revision?.sourcesUsed ?? []).some((s) => s !== 'SIGA baseline (seed)');
}

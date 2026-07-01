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
import { useEffect, useState } from 'react';
import type { CountryData, Indicator, IndicatorValue, IndicatorRevision, IndicatorSnapshot } from '../types';
import { WCA_COUNTRIES } from '../data';
import generated from '../data/indicators.generated.json';
import { hasSupabase, supabase } from './supabase';

// Indicators whose seed lives directly on CountryData (Outcomes 1–3 in scope).
const SEED_FIELD: Partial<Record<Indicator, keyof CountryData>> = {
  unmetNeed: 'unmetNeed',
  mCPR: 'mCPR',
  demandSatisfied: 'demandSatisfied',
  mmr: 'mmr',
  adolescentBirthRate: 'adolescentBirthRate',
  gbvPrevalence: 'gbvPrevalence',
};

// Legacy SIGA indicator key → PDP indicator_code (the snapshot is keyed by code).
const LEGACY_KEY_TO_CODE: Partial<Record<Indicator, string>> = {
  unmetNeed: '37.1',
  mCPR: '33.1',
  demandSatisfied: '36.1',
  mmr: '52',
  adolescentBirthRate: '26',
  gbvPrevalence: '193',
};

// Generated snapshot (committed; produced by `npm run ingest`). Statically
// imported so it's bundled at build time — first paint never blocks on the
// network. When Supabase is configured, the freshest revision is fetched in
// the background and OVERLAID on this bundled snapshot (see refreshFromDb).
let snapshot = generated as unknown as IndicatorSnapshot;

const LIVE_EVENT = 'siga-indicators';
let fetched = false;

/** Background refresh: pull the latest revision from Supabase and overlay it. */
export function refreshIndicatorsFromDb() {
  if (!hasSupabase || fetched) return;
  fetched = true;
  (async () => {
    try {
      const sb = supabase();
      const { data: rev } = await sb
        .from('revisions').select('*').order('generated_at', { ascending: false }).limit(1).maybeSingle();
      if (!rev) return;
      const { data: rows } = await sb
        .from('indicator_values')
        .select('indicator_code, iso3, value, source, source_url, reference_year, fetched_at, is_stale, fallback_used')
        .eq('revision_id', rev.id);
      if (!rows?.length) return;
      const values: IndicatorSnapshot['values'] = {};
      for (const r of rows) {
        (values[r.iso3] ??= {})[r.indicator_code] = {
          value: r.value === null ? null : Number(r.value),
          source: r.source,
          sourceUrl: r.source_url,
          referenceYear: r.reference_year,
          fetchedAt: r.fetched_at ?? '',
          isStale: r.is_stale,
          fallbackUsed: r.fallback_used,
        };
      }
      snapshot = {
        revision: {
          generatedAt: rev.generated_at,
          currentYear: rev.current_year,
          primarySource: rev.primary_source,
          staleThresholdYears: rev.stale_threshold_years,
          sourcesUsed: rev.sources_used ?? [],
          countryCount: Object.keys(values).length,
          indicatorKeys: [...new Set(rows.map((r) => r.indicator_code))],
        },
        values,
      };
      window.dispatchEvent(new CustomEvent(LIVE_EVENT));
    } catch (e) {
      console.error('[supabase] indicator refresh failed:', e);
    }
  })();
}

/**
 * React hook: bumps a version counter when the live DB overlay lands, so chart
 * memos recompute. Returns 0 forever when Supabase isn't configured.
 */
export function useLiveIndicators(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    refreshIndicatorsFromDb();
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(LIVE_EVENT, bump);
    return () => window.removeEventListener(LIVE_EVENT, bump);
  }, []);
  return version;
}

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

/** Empty/unknown value for a code that the snapshot doesn't cover. */
function emptyValue(): IndicatorValue {
  return {
    value: null,
    source: 'SIGA baseline (seed)',
    sourceUrl: 'https://pdp.unfpa.org/',
    referenceYear: null,
    fetchedAt: '',
    isStale: false,
    fallbackUsed: true,
  };
}

/** Fully-attributed value for a raw PDP indicator_code (used by Analytics). */
export function getValueByCode(iso3: string, code: string): IndicatorValue {
  return snapshot?.values?.[iso3]?.[code] ?? emptyValue();
}

/** All countries' attributed values for one PDP code. */
export function getSeriesByCode(code: string): Array<{ iso3: string } & IndicatorValue> {
  return WCA_COUNTRIES.map((c) => ({ iso3: c.id, ...getValueByCode(c.id, code) }));
}

/** Fully-attributed value for one country + legacy indicator (generated → seed fallback). */
export function getIndicatorValue(iso3: string, key: Indicator): IndicatorValue {
  const code = LEGACY_KEY_TO_CODE[key];
  const fromSnapshot = code ? snapshot?.values?.[iso3]?.[code] : undefined;
  return fromSnapshot ?? seedValue(iso3, key);
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

/**
 * DataRevisionPanel — "Data Revision & Sources" surface for the Intelligence
 * Platform tab. Reads the generated multi-source snapshot and shows, per
 * Outcome (1–3), the regional value of each in-scope indicator with full
 * source attribution, reference year, and Fresh/Stale state.
 *
 * Regional value = simple mean of the 24 country values for that indicator.
 * Source/freshness shown is the modal (most common) source across countries.
 */
import React from 'react';
import { Database, RefreshCw, Layers } from 'lucide-react';
import type { DataSource, Indicator, IndicatorValue } from '../../types';
import { INDICATORS, SP_OUTCOMES } from '../../types';
import { getIndicatorSeries, getRevision, hasLiveData } from '../../lib/indicatorData';
import SourceBadge from './SourceBadge';

const IN_SCOPE: Indicator[] = ['unmetNeed', 'mCPR', 'demandSatisfied', 'mmr', 'adolescentBirthRate', 'gbvPrevalence'];

/** Aggregate a country series into one regional IndicatorValue. */
function regionalValue(key: Indicator): IndicatorValue {
  const series = getIndicatorSeries(key).filter((s) => typeof s.value === 'number');
  const mean = series.length
    ? Math.round((series.reduce((a, s) => a + (s.value as number), 0) / series.length) * 10) / 10
    : null;

  // Modal source + worst-case freshness across the region.
  const counts = new Map<DataSource, number>();
  let anyStale = false;
  let anyFallback = false;
  let latestYear: number | null = null;
  for (const s of series) {
    counts.set(s.source, (counts.get(s.source) ?? 0) + 1);
    anyStale = anyStale || s.isStale;
    anyFallback = anyFallback || s.fallbackUsed;
    if (s.referenceYear && (latestYear == null || s.referenceYear > latestYear)) latestYear = s.referenceYear;
  }
  const source = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'SIGA baseline (seed)';
  const first = series[0];
  return {
    value: mean,
    source,
    sourceUrl: first?.sourceUrl ?? '',
    referenceYear: latestYear,
    fetchedAt: first?.fetchedAt ?? '',
    isStale: anyStale,
    fallbackUsed: anyFallback,
  };
}

const DataRevisionPanel: React.FC = () => {
  const revision = getRevision();
  const live = hasLiveData();
  const generated = revision?.generatedAt ? new Date(revision.generatedAt) : null;

  return (
    <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-8 lg:px-10 pt-8 pb-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-quantum-blue text-white flex items-center justify-center shadow-sm shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-quantum-blue mb-1">
              Live Indicator Provenance
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Data Revision &amp; Sources</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Primary source <span className="font-semibold text-slate-700">UNFPA Population Data Portal</span>,
              with DHS · WHO GHO · UN WPP fallbacks when primary data is stale.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-center min-w-[112px]">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Revised</p>
            <p className="text-sm font-bold text-slate-800">
              {generated ? generated.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
          <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-center min-w-[112px]">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Freshness Window</p>
            <p className="text-sm font-bold text-slate-800">{revision?.staleThresholdYears ?? 3} yrs</p>
          </div>
        </div>
      </div>

      {/* Mode banner */}
      {!live && (
        <div className="mx-8 lg:mx-10 mt-6 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <RefreshCw className="w-4 h-4 shrink-0" />
          <p className="text-[13px] font-medium">
            Showing <span className="font-semibold">SIGA baseline</span> values. Run{' '}
            <code className="px-1.5 py-0.5 bg-amber-100 rounded font-mono text-[12px]">npm run ingest:live</code>{' '}
            to pull current figures from UNFPA PDP and the alternative sources.
          </p>
        </div>
      )}

      {/* Per-outcome indicator tables */}
      <div className="p-8 lg:p-10 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {(['outcome1', 'outcome2', 'outcome3'] as const).map((oid) => {
          const outcome = SP_OUTCOMES[oid];
          const keys = outcome.indicators.filter((k) => IN_SCOPE.includes(k));
          return (
            <div key={oid} className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-2.5" style={{ backgroundColor: `${outcome.color}10` }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: outcome.color }} />
                <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: outcome.color }}>
                  {outcome.label}
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {keys.map((key) => {
                  const rv = regionalValue(key);
                  const meta = INDICATORS[key];
                  return (
                    <div key={key} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="text-[13px] font-semibold text-slate-800 leading-tight">{meta.label}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Regional mean</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-lg font-bold text-slate-900">
                            {rv.value ?? '—'}
                          </span>
                          <span className="text-[11px] text-slate-400 ml-1">{meta.unit}</span>
                        </div>
                      </div>
                      <SourceBadge value={rv} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sources legend */}
      <div className="px-8 lg:px-10 pb-8 -mt-2">
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
          <Layers className="w-3.5 h-3.5" />
          <span className="font-semibold uppercase tracking-widest">Sources in this revision:</span>
          {(revision?.sourcesUsed ?? ['SIGA baseline (seed)']).map((s) => (
            <span key={s} className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full font-medium text-slate-500">
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DataRevisionPanel;

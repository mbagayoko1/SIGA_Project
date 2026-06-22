/**
 * AnalyticsView — rebuilt Analytics tab.
 * PDP-organised multi-indicator (cross-outcome) + multi-country analysis sourced
 * from the live UNFPA Population Data Portal snapshot.
 *  - 1 indicator  → deep single-indicator analysis (ranking, KPIs, performers)
 *  - 2+ indicators → cross-outcome performance matrix + correlation (when 2)
 * All charts react to the selected indicators AND the country filter.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { TrendingUp, TrendingDown, Gauge, Building2, CalendarClock, ArrowUpRight, ArrowDownRight, Info, X, Layers, GitCompareArrows } from 'lucide-react';
import { WCA_COUNTRIES } from '../../data';
import type { DataSource, IndicatorValue } from '../../types';
import { CATALOG_BY_CODE } from '../../data/indicatorCatalog';
import { getValueByCode, getRevision } from '../../lib/indicatorData';
import SourceBadge from '../quantum/SourceBadge';
import IndicatorBrowser from './IndicatorBrowser';
import CountryFilter from './CountryFilter';

const META = Object.fromEntries(WCA_COUNTRIES.map((c) => [c.id, { name: c.name, region: c.region }]));

function fmt(n: number | null, unit: string): string {
  if (n == null) return '—';
  if (unit === 'thousands') return n >= 1000 ? `${(n / 1000).toFixed(1)}M` : `${Math.round(n)}k`;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** 0 (worst) → 100 (best) performance, honoring inverse (higher-is-better). */
function perf(value: number, min: number, max: number, inverse?: boolean): number {
  if (max === min) return 50;
  const t = (value - min) / (max - min);
  return Math.round((inverse ? t : 1 - t) * 100);
}
const perfColor = (p: number) => `hsl(${4 + (138 * p) / 100}, 70%, 92%)`;
const perfText = (p: number) => `hsl(${4 + (138 * p) / 100}, 60%, 30%)`;

interface AnalyticsViewProps {
  code?: string;
  onCodeChange?: (code: string) => void;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ code: codeProp, onCodeChange }) => {
  const [codes, setCodes] = useState<string[]>(codeProp ? [codeProp] : ['52']);
  const [countryIds, setCountryIds] = useState<string[]>([]); // [] = all
  const revision = getRevision();

  // Sidebar / single-select drives the focused indicator → reset the comparison set.
  const lastProp = useRef(codeProp);
  useEffect(() => {
    if (codeProp && codeProp !== lastProp.current) {
      lastProp.current = codeProp;
      setCodes([codeProp]);
    }
  }, [codeProp]);

  const toggleCode = (c: string) => {
    setCodes((prev) => {
      const next = prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c];
      onCodeChange?.(next[0] ?? c);
      return next;
    });
  };

  const activeCountries = useMemo(
    () => (countryIds.length ? WCA_COUNTRIES.filter((c) => countryIds.includes(c.id)) : WCA_COUNTRIES),
    [countryIds],
  );

  // Per-indicator series + stats over the active country set.
  const indicators = useMemo(() => codes.map((code) => {
    const meta = CATALOG_BY_CODE[code];
    const rows = activeCountries
      .map((c) => ({ iso3: c.id, name: c.name, region: c.region, ...getValueByCode(c.id, code) }))
      .filter((r) => typeof r.value === 'number');
    const vals = rows.map((r) => r.value as number);
    const min = vals.length ? Math.min(...vals) : 0;
    const max = vals.length ? Math.max(...vals) : 1;
    const mean = vals.length ? vals.reduce((a, v) => a + v, 0) / vals.length : null;
    return { code, meta, rows, min, max, mean };
  }), [codes, activeCountries]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-1 space-y-6 pb-10">
      {/* Header + controls */}
      <div className="relative rounded-3xl bg-gradient-to-br from-quantum-blue via-quantum-blue-dark to-quantum-blue-darker text-white p-7 lg:p-9">
        <div className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.7) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 mb-3">
            <Layers className="w-3.5 h-3.5" /><span>Cross-outcome analytics</span>
            <span className="opacity-50">·</span><span>{activeCountries.length} countries</span>
          </div>
          <h1 className="text-3xl lg:text-[34px] font-bold tracking-tight leading-tight max-w-3xl">
            {codes.length === 0 ? 'Select indicators to analyse'
              : codes.length === 1 ? indicators[0].meta?.name
              : `Comparing ${codes.length} indicators across outcomes`}
          </h1>
          <p className="text-white/70 font-medium mt-2 max-w-3xl text-[15px]">
            Build a single-indicator deep-dive or a cross-outcome comparison from the UNFPA Population Data Portal — then narrow it to any set of country offices.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <IndicatorBrowser mode="multi" selectedCodes={codes} onToggle={toggleCode} align="left" />
            <CountryFilter selected={countryIds} onChange={setCountryIds} align="left" />
          </div>

          {/* Selected indicator chips */}
          {codes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {indicators.map((ind) => (
                <span key={ind.code} className="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-full bg-white/12 border border-white/20 text-[12px] font-medium">
                  <span className="w-2 h-2 rounded-full" style={{ background: ind.meta?.color }} />
                  {ind.meta?.short}
                  <button onClick={() => toggleCode(ind.code)} className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {codes.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">Pick one or more indicators to begin.</div>
      ) : codes.length === 1 ? (
        <SingleIndicator ind={indicators[0]} revision={revision} />
      ) : (
        <CrossOutcome indicators={indicators} activeCountries={activeCountries} revision={revision} />
      )}
    </div>
  );
};

/* ----------------------------- Single indicator ---------------------------- */
const SingleIndicator: React.FC<{ ind: any; revision: any }> = ({ ind, revision }) => {
  const { meta, rows, min, max, mean } = ind;
  const sorted = useMemo(() => [...rows].sort((a, b) => (meta?.inverse ? b.value - a.value : a.value - b.value)), [rows, meta]);

  if (!rows.length) return <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">No data for this indicator in the selected countries.</div>;

  const best = sorted[0], worst = sorted[sorted.length - 1];
  const fresh = rows.filter((r: any) => !r.isStale).length;
  const west = rows.filter((r: any) => r.region === 'West Africa').map((r: any) => r.value);
  const central = rows.filter((r: any) => r.region === 'Central Africa').map((r: any) => r.value);
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const srcCounts = new Map<DataSource, number>();
  rows.forEach((r: any) => srcCounts.set(r.source, (srcCounts.get(r.source) ?? 0) + 1));
  const modalSource = [...srcCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'UNFPA PDP';
  const latestYear = Math.max(...rows.map((r: any) => r.referenceYear ?? 0));
  const regional: IndicatorValue = { value: mean != null ? Math.round(mean * 10) / 10 : null, source: modalSource, sourceUrl: 'https://pdp.unfpa.org/', referenceYear: latestYear || null, fetchedAt: '', isStale: rows.some((r: any) => r.isStale), fallbackUsed: modalSource !== 'UNFPA PDP' };
  const colorFor = (v: number) => `hsl(${perf(v, min, max, meta?.inverse) * 1.38 + 4}, 68%, 45%)`;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi icon={<Gauge className="w-5 h-5" />} label="Regional Mean" value={fmt(mean, meta.unit)} unit={meta.unit} tone="blue" />
        <Kpi icon={<TrendingUp className="w-5 h-5" />} label={meta?.inverse ? 'Highest (best)' : 'Lowest (best)'} value={fmt(best.value, meta.unit)} sub={best.name} tone="green" />
        <Kpi icon={<TrendingDown className="w-5 h-5" />} label={meta?.inverse ? 'Lowest (worst)' : 'Highest (worst)'} value={fmt(worst.value, meta.unit)} sub={worst.name} tone="red" />
        <Kpi icon={<Building2 className="w-5 h-5" />} label="Countries Reporting" value={`${rows.length}`} sub="in selection" tone="slate" />
        <Kpi icon={<CalendarClock className="w-5 h-5" />} label="Data Freshness" value={`${fresh}/${rows.length}`} sub="fresh observations" tone="slate" />
      </div>

      <div className="flex flex-wrap items-center gap-3 px-1">
        <SourceBadge value={regional} />
        <span className="text-[12px] text-slate-400">Sources in series:</span>
        {[...srcCounts.keys()].map((s) => <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">{s}</span>)}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Regional Ranking</h2>
            <p className="text-sm text-slate-500">{meta?.short} · {meta?.unit} · sorted best → worst{meta?.inverse ? ' (higher is better)' : ' (lower is better)'}</p>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-300">Mean {fmt(mean, meta.unit)} {meta.unit}</span>
        </div>
        <ResponsiveContainer width="100%" height={Math.max(320, sorted.length * 26)}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(28,109,181,0.05)' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              formatter={(v: number, _n, p: any) => [`${fmt(v, meta.unit)} ${meta.unit} · ${p.payload.source} ${p.payload.referenceYear ?? ''}`, meta?.short]} />
            {mean != null && <ReferenceLine x={mean} stroke="#1C6DB5" strokeDasharray="4 4" />}
            <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={14}>
              {sorted.map((r: any) => <Cell key={r.iso3} fill={colorFor(r.value)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Sub-regional Comparison</h3>
          <SubRegion label="West Africa" value={avg(west)} unit={meta.unit} color="#1C6DB5" />
          <SubRegion label="Central Africa" value={avg(central)} unit={meta.unit} color="#7C3AED" />
        </div>
        <Performers title="Best Performers" icon={<ArrowUpRight className="w-4 h-4" />} tone="green" list={sorted.slice(0, 3)} unit={meta.unit} />
        <Performers title="Priority Watchlist" icon={<ArrowDownRight className="w-4 h-4" />} tone="red" list={sorted.slice(-3).reverse()} unit={meta.unit} />
      </div>

      <Methodology revision={revision} note={`indicator code ${meta?.code}`} />
    </>
  );
};

/* ------------------------------ Cross-outcome ------------------------------ */
const CrossOutcome: React.FC<{ indicators: any[]; activeCountries: any[]; revision: any }> = ({ indicators, activeCountries, revision }) => {
  // Performance matrix rows (one per country), sorted by mean performance.
  const matrix = useMemo(() => {
    const rows = activeCountries.map((c) => {
      const cells = indicators.map((ind) => {
        const iv = getValueByCode(c.id, ind.code);
        const p = typeof iv.value === 'number' ? perf(iv.value, ind.min, ind.max, ind.meta?.inverse) : null;
        return { code: ind.code, value: iv.value, unit: ind.meta?.unit, p };
      });
      const ps = cells.map((x) => x.p).filter((x): x is number => x != null);
      const meanP = ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 0;
      return { iso3: c.id, name: c.name, cells, meanP };
    });
    return rows.sort((a, b) => b.meanP - a.meanP);
  }, [indicators, activeCountries]);

  // Scatter (exactly two indicators).
  const scatter = useMemo(() => {
    if (indicators.length !== 2) return null;
    const [a, b] = indicators;
    return activeCountries.map((c) => {
      const va = getValueByCode(c.id, a.code).value;
      const vb = getValueByCode(c.id, b.code).value;
      return va != null && vb != null ? { name: c.name, x: va, y: vb } : null;
    }).filter(Boolean) as Array<{ name: string; x: number; y: number }>;
  }, [indicators, activeCountries]);

  return (
    <>
      {/* Per-indicator mean chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {indicators.map((ind) => (
          <div key={ind.code} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: ind.meta?.color }} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{ind.meta?.short}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 leading-none">{fmt(ind.mean, ind.meta?.unit)}<span className="text-sm text-slate-400 ml-1">{ind.meta?.unit === '%' ? '%' : ''}</span></p>
            <p className="text-[11px] text-slate-400 mt-1">{ind.meta?.domain} · regional mean</p>
          </div>
        ))}
      </div>

      {/* Performance matrix (cross-outcome heatmap) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-1">
          <GitCompareArrows className="w-5 h-5 text-quantum-blue" />
          <h2 className="text-lg font-bold text-slate-900">Cross-outcome Performance Matrix</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">Each cell shows the country value, shaded by normalized performance (red = worst, green = best in the selected set). Sorted by overall performance.</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 pr-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky left-0 bg-white">Country</th>
                {indicators.map((ind) => (
                  <th key={ind.code} className="px-3 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wide text-center">
                    <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: ind.meta?.color }} />{ind.meta?.short}</span>
                    <span className="block text-[9px] text-slate-300 font-medium normal-case">{ind.meta?.unit}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.iso3} className="border-b border-slate-50">
                  <td className="py-2 pr-4 text-[13px] font-semibold text-slate-700 sticky left-0 bg-white whitespace-nowrap">{row.name}</td>
                  {row.cells.map((cell, i) => (
                    <td key={i} className="px-3 py-2 text-center">
                      <span className="inline-block min-w-[64px] px-2 py-1 rounded-lg text-[12px] font-bold"
                        style={cell.p != null ? { background: perfColor(cell.p), color: perfText(cell.p) } : { color: '#cbd5e1' }}>
                        {cell.value == null ? '—' : fmt(cell.value, cell.unit)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correlation scatter (two indicators) */}
      {scatter && indicators.length === 2 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Correlation</h2>
          <p className="text-sm text-slate-500 mb-5">{indicators[0].meta?.short} (x) vs {indicators[1].meta?.short} (y) across {scatter.length} countries.</p>
          <ResponsiveContainer width="100%" height={360}>
            <ScatterChart margin={{ left: 8, right: 24, top: 8, bottom: 16 }}>
              <XAxis type="number" dataKey="x" name={indicators[0].meta?.short} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                label={{ value: `${indicators[0].meta?.short} (${indicators[0].meta?.unit})`, position: 'insideBottom', offset: -8, fontSize: 11, fill: '#64748b' }} />
              <YAxis type="number" dataKey="y" name={indicators[1].meta?.short} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                label={{ value: indicators[1].meta?.unit, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#64748b' }} />
              <ZAxis range={[80, 80]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(v: number, n: string) => [fmt(v, ''), n]} labelFormatter={() => ''} />
              <Scatter data={scatter} fill="#1C6DB5" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <Methodology revision={revision} note={`${indicators.length} indicators · ${activeCountries.length} countries`} />
    </>
  );
};

/* --------------------------------- shared --------------------------------- */
const Methodology: React.FC<{ revision: any; note: string }> = ({ revision, note }) => (
  <div className="flex items-start gap-3 px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-[12px] text-slate-500">
    <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
    <p className="leading-relaxed">
      <span className="font-semibold text-slate-700">Methodology.</span> Latest observation at or before {revision?.currentYear ?? new Date().getFullYear()} per country,
      from the UNFPA Population Data Portal ({note}) with DHS / WHO GHO fallbacks. Performance is min–max normalized within the selected country set, honoring each
      indicator's direction. Last revised {revision?.generatedAt ? new Date(revision.generatedAt).toLocaleDateString() : '—'}.
    </p>
  </div>
);

const TONE: Record<string, string> = {
  blue: 'text-quantum-blue bg-quantum-blue/10', green: 'text-emerald-600 bg-emerald-50',
  red: 'text-rose-600 bg-rose-50', slate: 'text-slate-500 bg-slate-100',
};
const Kpi: React.FC<{ icon: React.ReactNode; label: string; value: string; unit?: string; sub?: string; tone: string }> = ({ icon, label, value, unit, sub, tone }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${TONE[tone]}`}>{icon}</span>
    </div>
    <p className="text-2xl font-bold text-slate-900 leading-none">{value}{unit === '%' ? <span className="text-sm text-slate-400 ml-1">%</span> : null}</p>
    {sub && <p className="text-[11px] text-slate-400 mt-1 truncate">{sub}</p>}
  </div>
);
const SubRegion: React.FC<{ label: string; value: number | null; unit: string; color: string }> = ({ label, value, unit, color }) => (
  <div className="mb-3 last:mb-0">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[12px] font-semibold text-slate-600">{label}</span>
      <span className="text-[13px] font-bold text-slate-900">{value == null ? '—' : value.toFixed(1)} <span className="text-[11px] text-slate-400">{unit}</span></span>
    </div>
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: value == null ? '0%' : `${Math.min(100, Math.max(6, value))}%`, background: color }} />
    </div>
  </div>
);
const Performers: React.FC<{ title: string; icon: React.ReactNode; tone: 'green' | 'red'; list: any[]; unit: string }> = ({ title, icon, tone, list, unit }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
    <div className="flex items-center gap-2 mb-4">
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${tone === 'green' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>{icon}</span>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    </div>
    <div className="space-y-3">
      {list.map((r: any, idx: number) => (
        <div key={r.iso3} className="flex items-center gap-3">
          <span className="w-5 text-[12px] font-bold text-slate-300">{idx + 1}</span>
          <span className="flex-1 text-[13px] font-medium text-slate-700 truncate">{r.name}</span>
          <span className="text-[13px] font-bold text-slate-900">{fmt(r.value, unit)}<span className="text-[10px] text-slate-400 ml-0.5">{unit === '%' ? '%' : ''}</span></span>
        </div>
      ))}
    </div>
  </div>
);

export default AnalyticsView;

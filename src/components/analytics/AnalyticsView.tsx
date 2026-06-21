/**
 * AnalyticsView — rebuilt Analytics tab.
 * A PDP-organised indicator browser drives a professional, single-indicator
 * regional analysis sourced from the live UNFPA Population Data Portal snapshot.
 */
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Gauge, Building2, CalendarClock, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { WCA_COUNTRIES } from '../../data';
import type { DataSource, IndicatorValue } from '../../types';
import { CATALOG_BY_CODE } from '../../data/indicatorCatalog';
import { getSeriesByCode, getRevision } from '../../lib/indicatorData';
import SourceBadge from '../quantum/SourceBadge';
import IndicatorBrowser from './IndicatorBrowser';

const META = Object.fromEntries(WCA_COUNTRIES.map((c) => [c.id, { name: c.name, region: c.region }]));

function fmt(n: number | null, unit: string): string {
  if (n == null) return '—';
  if (unit === 'thousands') return n >= 1000 ? `${(n / 1000).toFixed(1)}M` : `${Math.round(n)}k`;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

const AnalyticsView: React.FC = () => {
  const [code, setCode] = useState('52'); // default: Maternal mortality ratio
  const meta = CATALOG_BY_CODE[code];
  const revision = getRevision();

  const rows = useMemo(() => {
    const series = getSeriesByCode(code)
      .filter((s) => typeof s.value === 'number')
      .map((s) => ({ ...s, name: META[s.iso3]?.name ?? s.iso3, region: META[s.iso3]?.region ?? '' }));
    // Sort best→worst for the ranking (higher-is-better → desc, else asc).
    series.sort((a, b) => (meta?.inverse ? (b.value as number) - (a.value as number) : (a.value as number) - (b.value as number)));
    return series;
  }, [code, meta]);

  const stats = useMemo(() => {
    const vals = rows.map((r) => r.value as number);
    if (!vals.length) return null;
    const mean = vals.reduce((a, v) => a + v, 0) / vals.length;
    const west = rows.filter((r) => r.region === 'West Africa').map((r) => r.value as number);
    const central = rows.filter((r) => r.region === 'Central Africa').map((r) => r.value as number);
    const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    // best = first row (already sorted best→worst)
    const best = rows[0];
    const worst = rows[rows.length - 1];
    const fresh = rows.filter((r) => !r.isStale).length;
    const srcCounts = new Map<DataSource, number>();
    rows.forEach((r) => srcCounts.set(r.source, (srcCounts.get(r.source) ?? 0) + 1));
    const modalSource = [...srcCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'UNFPA PDP';
    const latestYear = Math.max(...rows.map((r) => r.referenceYear ?? 0));
    return { mean, min: Math.min(...vals), max: Math.max(...vals), best, worst, fresh, reporting: rows.length,
      west: avg(west), central: avg(central), modalSource, latestYear, sources: [...srcCounts.keys()] };
  }, [rows]);

  const regional: IndicatorValue | null = stats ? {
    value: Math.round(stats.mean * 10) / 10, source: stats.modalSource, sourceUrl: 'https://pdp.unfpa.org/',
    referenceYear: stats.latestYear || null, fetchedAt: '', isStale: rows.some((r) => r.isStale), fallbackUsed: stats.modalSource !== 'UNFPA PDP',
  } : null;

  // Color scale across the range: green (good) → red (bad), honoring `inverse`.
  const colorFor = (v: number) => {
    if (!stats || stats.max === stats.min) return meta?.color ?? '#1C6DB5';
    let t = (v - stats.min) / (stats.max - stats.min); // 0..1
    if (!meta?.inverse) t = 1 - t; // for "lower is better", low value = good
    const hue = 142 * t + 4 * (1 - t); // 4=red, 142=green
    return `hsl(${hue}, 68%, 45%)`;
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-1 space-y-6 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-quantum-blue via-quantum-blue-dark to-quantum-blue-darker text-white p-7 lg:p-9">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.7) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 mb-3">
              <span>{meta?.domain}</span><span className="opacity-50">▸</span><span>{meta?.subdomain}</span>
              <span className="opacity-50">·</span><span className="font-mono">code {code}</span>
            </div>
            <h1 className="text-3xl lg:text-[34px] font-bold tracking-tight leading-tight max-w-2xl">{meta?.name}</h1>
            <p className="text-white/70 font-medium mt-2 max-w-2xl text-[15px]">
              Cross-border comparative analysis across 24 West &amp; Central Africa country offices, sourced from the UNFPA Population Data Portal.
            </p>
          </div>
          <div className="shrink-0">
            <IndicatorBrowser selectedCode={code} onSelect={setCode} />
          </div>
        </div>
      </div>

      {!stats ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">No data available for this indicator.</div>
      ) : (
      <>
        {/* KPI tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Kpi icon={<Gauge className="w-5 h-5" />} label="Regional Mean" value={`${fmt(stats.mean, meta!.unit)}`} unit={meta!.unit} tone="blue" />
          <Kpi icon={<TrendingUp className="w-5 h-5" />} label={meta?.inverse ? 'Highest (best)' : 'Lowest (best)'} value={fmt(stats.best.value as number, meta!.unit)} sub={stats.best.name} tone="green" />
          <Kpi icon={<TrendingDown className="w-5 h-5" />} label={meta?.inverse ? 'Lowest (worst)' : 'Highest (worst)'} value={fmt(stats.worst.value as number, meta!.unit)} sub={stats.worst.name} tone="red" />
          <Kpi icon={<Building2 className="w-5 h-5" />} label="Countries Reporting" value={`${stats.reporting}`} sub="of 24 offices" tone="slate" />
          <Kpi icon={<CalendarClock className="w-5 h-5" />} label="Data Freshness" value={`${stats.fresh}/${stats.reporting}`} sub="fresh observations" tone="slate" />
        </div>

        {/* Source attribution */}
        <div className="flex flex-wrap items-center gap-3 px-1">
          {regional && <SourceBadge value={regional} />}
          <span className="text-[12px] text-slate-400">Sources in series:</span>
          {stats.sources.map((s) => (
            <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">{s}</span>
          ))}
        </div>

        {/* Ranking chart */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Regional Ranking</h2>
              <p className="text-sm text-slate-500">{meta?.short} · {meta?.unit} · sorted best → worst{meta?.inverse ? ' (higher is better)' : ' (lower is better)'}</p>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-300">Regional mean {fmt(stats.mean, meta!.unit)} {meta!.unit}</span>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(360, rows.length * 26)}>
            <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(28,109,181,0.05)' }}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(v: number, _n, p: any) => [`${fmt(v, meta!.unit)} ${meta!.unit} · ${p.payload.source} ${p.payload.referenceYear ?? ''}`, meta?.short]}
              />
              <ReferenceLine x={stats.mean} stroke="#1C6DB5" strokeDasharray="4 4" />
              <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={14}>
                {rows.map((r) => <Cell key={r.iso3} fill={colorFor(r.value as number)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sub-regional comparison + performers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Sub-regional Comparison</h3>
            <SubRegion label="West Africa" value={stats.west} unit={meta!.unit} color="#1C6DB5" />
            <SubRegion label="Central Africa" value={stats.central} unit={meta!.unit} color="#7C3AED" />
            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">Simple mean of reporting country offices in each UNFPA sub-region.</p>
          </div>

          <Performers title="Best Performers" icon={<ArrowUpRight className="w-4 h-4" />} tone="green"
            list={rows.slice(0, 3)} unit={meta!.unit} fmt={fmt} />
          <Performers title="Priority Watchlist" icon={<ArrowDownRight className="w-4 h-4" />} tone="red"
            list={rows.slice(-3).reverse()} unit={meta!.unit} fmt={fmt} />
        </div>

        {/* Methodology footer */}
        <div className="flex items-start gap-3 px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-[12px] text-slate-500">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-slate-700">Methodology.</span> Values are the latest observation at or before {revision?.currentYear ?? new Date().getFullYear()} per country,
            pulled from the UNFPA Population Data Portal (indicator code {code}) with DHS / WHO GHO fallbacks where the portal lacks a recent figure.
            Last revised {revision?.generatedAt ? new Date(revision.generatedAt).toLocaleDateString() : '—'}.
          </p>
        </div>
      </>
      )}
    </div>
  );
};

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
    <p className="text-2xl font-bold text-slate-900 leading-none">{value}{unit && unit !== 'thousands' && unit !== 'index' && unit !== 'per woman' ? <span className="text-sm text-slate-400 ml-1">{unit === '%' ? '%' : ''}</span> : null}</p>
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

const Performers: React.FC<{ title: string; icon: React.ReactNode; tone: 'green' | 'red'; list: any[]; unit: string; fmt: (n: number | null, u: string) => string }> = ({ title, icon, tone, list, unit, fmt }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
    <div className="flex items-center gap-2 mb-4">
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${tone === 'green' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>{icon}</span>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    </div>
    <div className="space-y-3">
      {list.map((r, idx) => (
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

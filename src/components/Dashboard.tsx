import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';
import { CountryData, Indicator, INDICATORS } from '../types';
import { WCA_COUNTRIES } from '../data';
import { Users, UsersRound, TrendingDown, AlertTriangle, Globe2, Baby, CircleDot, Activity, Sparkles, Zap, ShieldCheck, Flame, HeartPulse, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import PopulationDynamicsDashboard from './PopulationDynamicsDashboard';

type Scenario = 'optimistic' | 'baseline' | 'fragile';

interface Props {
  selectedIndicators: Indicator[];
  selectedCountries: CountryData[];
  onToggleCountry: (country: CountryData) => void;
  onIndicatorChange: (indicator: Indicator) => void;
}

export default function Dashboard({ selectedIndicators, selectedCountries, onToggleCountry, onIndicatorChange }: Props) {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('baseline');
  
  const isComparison = selectedCountries.length > 1;
  const isSingle = selectedCountries.length === 1;
  const isMultiIndicator = selectedIndicators.length > 1;

  const activeIndicator = selectedIndicators[0];
  const indicatorMeta = INDICATORS[activeIndicator];

  const topData = [...WCA_COUNTRIES].sort((a, b) => b[activeIndicator] - a[activeIndicator]).slice(0, 10);
  const comparisonData = selectedCountries.sort((a, b) => b[activeIndicator] - a[activeIndicator]);
  
  const totalPop = WCA_COUNTRIES.reduce((acc, c) => acc + c.population, 0);
  const avgIndicator = WCA_COUNTRIES.reduce((acc, c) => acc + c[activeIndicator], 0) / WCA_COUNTRIES.length;

  // For multi-indicator comparison, normalize data to 100 max for each indicator
  const chartData = useMemo(() => {
    const rawData = isComparison ? comparisonData : topData;
    if (!isMultiIndicator) return rawData;

    return rawData.map(country => {
      const normalizedRow: any = { ...country };
      selectedIndicators.forEach(id => {
        const values = WCA_COUNTRIES.map(c => c[id]);
        const max = Math.max(...values);
        // Normalize 0-100 for visual comparison
        normalizedRow[`norm_${id}`] = (country[id] / max) * 100;
      });
      return normalizedRow;
    });
  }, [isComparison, comparisonData, topData, isMultiIndicator, selectedIndicators]);

  // Generate simulated trend data based on strategic scenarios
  const trendData = useMemo(() => {
    const scenarios = {
      optimistic: { m: 1.15, label: 'Targeted Achievement' },
      baseline: { m: 1.05, label: 'Trend Projection' },
      fragile: { m: 0.92, label: 'Conflict/Climate Shock' }
    };

    const multiplier = scenarios[selectedScenario].m;
    
    return [
      { year: 2025, value: avgIndicator * 0.98 },
      { year: 2026, value: avgIndicator * (1 + (multiplier - 1) * 0.2) },
      { year: 2027, value: avgIndicator * (1 + (multiplier - 1) * 0.5) },
      { year: 2028, value: avgIndicator * (1 + (multiplier - 1) * 0.8) },
      { year: 2029, value: avgIndicator * multiplier },
    ];
  }, [avgIndicator, selectedScenario]);

  const scenarioMeta = {
    optimistic: { label: 'Resilient Frontier', color: '#FF8200', icon: <ShieldCheck className="w-4 h-4" /> },
    baseline: { label: 'Sustainable Growth', color: '#0072BC', icon: <Zap className="w-4 h-4" /> },
    fragile: { label: 'Fragile Trajectory', color: '#ef4444', icon: <Flame className="w-4 h-4" /> }
  };

  if (activeIndicator === 'demographicDynamics' && !isComparison) {
    return <PopulationDynamicsDashboard />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Strategic Roadmap Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Demographic Resilience" 
          value={`${(WCA_COUNTRIES.reduce((acc, c) => acc + c.demographicDynamics, 0) / WCA_COUNTRIES.length).toFixed(1)}`} 
          icon={<Globe2 className="w-5 h-5 text-purple-600" />}
          subtitle="Regional Outcome 4"
          trend="Tracking Active"
        />
        <StatCard 
          title="Maternal Health" 
          value={(WCA_COUNTRIES.reduce((acc, c) => acc + c.mmr, 0) / WCA_COUNTRIES.length).toFixed(0)} 
          icon={<HeartPulse className="w-5 h-5 text-rose-600" />}
          subtitle="Outcome 2: MM Ratio"
          trend="Plan Target: 120"
        />
        <StatCard 
          title="Family Planning" 
          value={`${(WCA_COUNTRIES.reduce((acc, c) => acc + c.unmetNeed, 0) / WCA_COUNTRIES.length).toFixed(1)}%`} 
          icon={<Users className="w-5 h-5 text-blue-600" />}
          subtitle="Outcome 1: Unmet Need"
          trend="Accelerating"
        />
        <StatCard 
          title="GBV Index" 
          value={`${(WCA_COUNTRIES.reduce((acc, c) => acc + c.gbvPrevalence, 0) / WCA_COUNTRIES.length).toFixed(1)}%`} 
          icon={<ShieldAlert className="w-5 h-5 text-orange-600" />}
          subtitle="Outcome 3 Prevalence"
          status="2026 Focus"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Ranking Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-card-border shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] mb-1">Strategic Results Framework</h3>
              <p className="text-sm font-black text-text-main uppercase tracking-tight">
                {isMultiIndicator ? 'Multi-Metric Resilience Profile' : `${indicatorMeta.label} Distribution`}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-card-border">
              <Sparkles className="w-3.5 h-3.5 text-unfpa-blue" />
              <span className="text-[10px] font-black text-unfpa-blue uppercase tracking-widest">
                {isMultiIndicator ? 'Normalized Comparison' : 'Resilience Tracking'}
              </span>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide domain={[0, isMultiIndicator ? 100 : 'auto']} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={110} 
                  tick={{ fontSize: 9, fill: '#64748b', fontWeight: '900' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-2xl border border-slate-100 min-w-[160px]">
                          <p className="text-[11px] font-black text-text-main border-b border-slate-50 pb-2 mb-2 uppercase">{label}</p>
                          <div className="space-y-2">
                            {selectedIndicators.map((id, idx) => {
                              const country = (isComparison ? comparisonData : topData).find(c => c.name === label);
                              return (
                                <div key={id} className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: id === activeIndicator ? '#0072BC' : (INDICATORS[id].colorRange[1]) }} />
                                    <span className="text-[10px] font-bold text-slate-400">{INDICATORS[id].label}:</span>
                                  </div>
                                  <span className="text-[10px] font-black text-text-main">{country ? country[id] : 'N/A'}{INDICATORS[id].unit}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {!isMultiIndicator ? (
                  <Bar 
                    dataKey={activeIndicator} 
                    radius={[0, 6, 6, 0]} 
                    barSize={isComparison ? 32 : 18}
                    style={{ cursor: 'pointer' }}
                    onClick={(data: any) => {
                      if (data && data.payload) {
                        onToggleCountry(data.payload);
                      }
                    }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={selectedCountries.find(c => c.id === (entry as CountryData).id) ? '#0072BC' : '#cbd5e1'} 
                      />
                    ))}
                  </Bar>
                ) : (
                  selectedIndicators.map((id, idx) => (
                    <Bar 
                      key={id}
                      dataKey={`norm_${id}`}
                      name={INDICATORS[id].label}
                      fill={idx === 0 ? '#0072BC' : (INDICATORS[id].colorRange[1])}
                      radius={[0, 4, 4, 0]}
                      barSize={12}
                    />
                  ))
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strategic Roadmap Visualization */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-card-border shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">2026-2029 PROJECTION</h3>
              <div className="flex gap-1 p-1 bg-slate-50 rounded-lg border border-slate-100">
                {(['optimistic', 'baseline', 'fragile'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedScenario(s)}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      selectedScenario === s ? "bg-white text-unfpa-blue shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                    title={scenarioMeta[s].label}
                  >
                    {scenarioMeta[s].icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Scenario</span>
                <span className={cn("text-[10px] font-black uppercase", `text-[${scenarioMeta[selectedScenario].color}]`)} style={{ color: scenarioMeta[selectedScenario].color }}>
                  {scenarioMeta[selectedScenario].label}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold leading-tight">
                Simulated modeling based on {selectedScenario === 'optimistic' ? 'accelerated investment' : (selectedScenario === 'fragile' ? 'resource constraints' : 'current trends')}.
              </p>
            </div>

            <div className="h-[120px] mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={scenarioMeta[selectedScenario].color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={scenarioMeta[selectedScenario].color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={scenarioMeta[selectedScenario].color} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-between mt-2 text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                <span>Start cycle</span>
                <span style={{ color: scenarioMeta[selectedScenario].color }}>2029 Target</span>
              </div>
            </div>

            <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {selectedCountries.length > 0 ? (
                <>
                  <IndicatorRow 
                    label="Outcome 1: Unmet Need for Family Planning" 
                    value={isSingle ? selectedCountries[0].unmetNeed : Number((selectedCountries.reduce((acc, c) => acc + c.unmetNeed, 0) / selectedCountries.length).toFixed(1))} 
                    unit="%" 
                    meta={INDICATORS.unmetNeed}
                    max={100}
                    onClick={() => onIndicatorChange('unmetNeed')}
                    active={selectedIndicators.includes('unmetNeed')}
                  />
                  <IndicatorRow 
                    label="Outcome 2: Preventable Maternal Deaths" 
                    value={isSingle ? selectedCountries[0].mmr : Math.round(selectedCountries.reduce((acc, c) => acc + c.mmr, 0) / selectedCountries.length)} 
                    unit="per 100k" 
                    meta={INDICATORS.mmr}
                    max={1200}
                    onClick={() => onIndicatorChange('mmr')}
                    active={selectedIndicators.includes('mmr')}
                  />
                  <IndicatorRow 
                    label="Outcome 3: GBV and Harmful Practices" 
                    value={isSingle ? selectedCountries[0].gbvPrevalence : Number((selectedCountries.reduce((acc, c) => acc + c.gbvPrevalence, 0) / selectedCountries.length).toFixed(1))} 
                    unit="% prev." 
                    meta={INDICATORS.gbvPrevalence}
                    max={100}
                    onClick={() => onIndicatorChange('gbvPrevalence')}
                    active={selectedIndicators.includes('gbvPrevalence')}
                  />
                  <IndicatorRow 
                    label="Outcome 4: Demographic Resilience" 
                    value={isSingle ? selectedCountries[0].demographicDynamics : Number((selectedCountries.reduce((acc, c) => acc + c.demographicDynamics, 0) / selectedCountries.length).toFixed(1))} 
                    unit="Index" 
                    meta={INDICATORS.demographicDynamics}
                    max={100}
                    onClick={() => onIndicatorChange('demographicDynamics')}
                    active={selectedIndicators.includes('demographicDynamics')}
                  />
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                  <Globe2 className="w-8 h-8 text-slate-200 mb-4" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                    Four Interconnected Outcomes Focus Area
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-8 border-t border-slate-100 flex justify-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Source: UNFPA Population Data Portal & WCARO Integrated Geospatial Hub</p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle, trend, trendColor = "text-unfpa-blue", status }: { title: string, value: string, icon: React.ReactNode, subtitle: string, trend?: string, trendColor?: string, status?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-card-border shadow-sm group hover:ring-2 hover:ring-unfpa-blue-10 transition-all flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-unfpa-blue-5 transition-colors">
          {icon}
        </div>
        {status && (
          <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded uppercase tracking-[0.2em]">{status}</span>
        )}
      </div>
      <div className="flex-1">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</h4>
        <div className="text-2xl font-black text-text-main tracking-tighter tabular-nums leading-none mb-1.5">{value}</div>
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wide truncate">{subtitle}</p>
      </div>
      {trend && (
        <div className={cn("mt-4 pt-4 border-t border-slate-50 text-[10px] font-black uppercase tracking-widest", trendColor)}>
          {trend}
        </div>
      )}
    </div>
  );
}

function IndicatorRow({ label, value, unit, meta, max, onClick, active }: { label: string, value: number, unit: string, meta: any, max: number, onClick: () => void, active: boolean }) {
  const percentage = Math.min(100, (value / max) * 100);
  return (
    <div 
      className={cn(
        "group/row cursor-pointer p-2 -mx-2 rounded-xl transition-all",
        active ? "bg-unfpa-blue-5 border border-unfpa-blue-10" : "hover:bg-slate-50 border border-transparent"
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-end mb-1.5">
        <span className={cn(
          "text-[9px] font-black uppercase tracking-widest transition-colors",
          active ? "text-unfpa-blue" : "text-slate-400 group-hover/row:text-unfpa-blue"
        )}>{label}</span>
        <span className="text-[11px] font-black text-text-main tabular-nums">
          {value}<span className="text-[9px] ml-1 text-slate-400 font-bold">{unit}</span>
        </span>
      </div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden p-[1px]">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out shadow-sm",
            active ? "bg-unfpa-blue" : "bg-slate-300"
          )} 
          style={{ width: `${percentage}%` }} 
        />
      </div>
    </div>
  );
}

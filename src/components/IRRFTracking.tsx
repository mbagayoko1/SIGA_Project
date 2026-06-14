import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, BarChart3, TrendingUp, Info, 
  ChevronRight, ArrowUpRight, Search, 
  Globe2, CheckCircle2, ShieldAlert,
  LayoutDashboard, FileText, Filter,
  PieChart as PieIcon, Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { WCA_COUNTRIES } from '../data';
import { INDICATORS, SP_OUTCOMES } from '../types';
import HeroGeoMotif from './quantum/HeroGeoMotif';

interface IRRFIndicator {
  id: string;
  label: string;
  baseline: number;
  target2029: number;
  currentRegional: number;
  unit: string;
  outcomeId: string;
}

const IRRF_LEDGER: IRRFIndicator[] = [
  { id: '1.1', label: 'Unmet need for family planning', baseline: 24.2, target2029: 15.0, currentRegional: 22.1, unit: '%', outcomeId: 'outcome1' },
  { id: '1.2', label: 'Modern contraceptive prevalence rate (mCPR)', baseline: 32.1, target2029: 45.0, currentRegional: 35.4, unit: '%', outcomeId: 'outcome1' },
  { id: '2.1', label: 'Maternal mortality ratio (per 100k live births)', baseline: 542, target2029: 300, currentRegional: 518, unit: 'per 100k', outcomeId: 'outcome2' },
  { id: '2.3', label: 'Proportion of births attended by skilled personnel', baseline: 58, target2029: 80, currentRegional: 62, unit: '%', outcomeId: 'outcome2' },
  { id: '3.1', label: 'Women 15–49 who subjected to physical/sexual violence', baseline: 36, target2029: 15, currentRegional: 34, unit: '%', outcomeId: 'outcome3' },
  { id: '3.2', label: 'Women 20–24 married before age 18', baseline: 42, target2029: 20, currentRegional: 38, unit: '%', outcomeId: 'outcome3' },
  { id: '4.4', label: 'Countries with demographic resilience strategies', baseline: 4, target2029: 23, currentRegional: 8, unit: 'Countries', outcomeId: 'outcome4' },
  { id: '4.6', label: 'Population and housing census round completion', baseline: 60, target2029: 100, currentRegional: 70, unit: '%', outcomeId: 'outcome4' },
];

export default function IRRFTrackingSection() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['GHA']);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCorrection, setShowCorrection] = useState(false);

  const displayLabel = useMemo(() => {
    if (selectedCountries.includes('REG')) return 'WCA Regional Aggregate';
    if (selectedCountries.length === 1) return WCA_COUNTRIES.find(c => c.id === selectedCountries[0])?.name || 'Selected Area';
    return `${selectedCountries.length} Countries Selected`;
  }, [selectedCountries]);

  const toggleCountry = (id: string) => {
    setSelectedCountries(prev => 
      id === 'REG' 
        ? ['REG'] 
        : prev.includes(id) 
          ? prev.filter(c => c !== id && c !== 'REG') 
          : [...prev.filter(c => c !== 'REG'), id]
    );
  };

  const countryAdjustment = useMemo(() => {
    if (selectedCountries.includes('REG')) return 1.0;
    // Calculate average adjustment for selected countries
    const totalAdj = selectedCountries.reduce((acc, id) => {
      const country = WCA_COUNTRIES.find(c => c.id === id);
      if (!country) return acc + 1.0;
      const sum = country.name.split('').reduce((a, char) => a + char.charCodeAt(0), 0);
      return acc + (0.7 + (sum % 60) / 100);
    }, 0);
    return totalAdj / (selectedCountries.length || 1);
  }, [selectedCountries]);

  const countryLedger = useMemo(() => {
    return IRRF_LEDGER.map(ind => {
      // Very simple simulation: country value is some factor of regional
      const countryValue = ind.currentRegional * countryAdjustment;
      const finalValue = ind.unit === '%' ? Math.min(100, Math.max(0, countryValue)) : Math.round(countryValue);
      return { ...ind, currentRegional: finalValue };
    });
  }, [countryAdjustment]);

  const regionalAchievement = useMemo(() => {
    const progressTotal = countryLedger.reduce((acc, curr) => {
      const totalDist = Math.abs(curr.target2029 - curr.baseline);
      const currentDist = Math.abs(curr.currentRegional - curr.baseline);
      return acc + (currentDist / totalDist);
    }, 0);
    return (progressTotal / countryLedger.length) * 100;
  }, [countryLedger]);

  return (
    <div className="min-h-screen bg-main-bg p-6 md:p-8 space-y-8 overflow-y-auto pb-24">
      {/* Strategic Header — Quantum blue hero with radar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-quantum-blue via-quantum-blue-dark to-quantum-blue-darker p-6 md:p-8 shadow-[0_22px_55px_-24px_rgba(14,60,102,0.6)]">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)', backgroundSize: '38px 38px' }} />
        <HeroGeoMotif className="pointer-events-none absolute -top-28 -right-14 w-[420px] h-[420px] opacity-45 hidden md:block" />
        <div className="absolute -bottom-24 -left-10 w-64 h-64 rounded-full bg-unfpa-orange/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
           <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/15 border border-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-white/75 uppercase tracking-[0.18em] mb-1">Integrated Results & Resources Framework</p>
              <h2 className="text-[26px] font-bold tracking-tight text-white leading-tight text-balance">IRRF Tracking &amp; Correction</h2>
              <p className="text-sm text-white/80 mt-1 font-medium">Integrated result ledger across {selectedCountries.length} jurisdiction{selectedCountries.length === 1 ? '' : 's'}.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm mr-2">
             <button 
                onClick={() => setShowCorrection(false)}
                className={cn(
                   "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                   !showCorrection ? "bg-unfpa-blue text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                )}
             >
                Indicator Ledger
             </button>
             <button 
                onClick={() => setShowCorrection(true)}
                className={cn(
                   "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                   showCorrection ? "bg-rose-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                )}
             >
                Course Correction
             </button>
          </div>
          <div className="relative group/selector">
            <div className="flex items-center gap-3 bg-white border-2 border-slate-200 px-6 py-3 rounded-2xl shadow-sm min-w-[240px] cursor-pointer hover:border-unfpa-blue transition-all">
               <div className="p-2 bg-slate-50 rounded-lg">
                  <Globe2 className="w-4 h-4 text-slate-400" />
               </div>
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Impact Scope</span>
                  <span className="text-xs font-black uppercase text-slate-900 truncate max-w-[150px]">{displayLabel}</span>
               </div>
               <ChevronRight className="w-4 h-4 text-slate-300 ml-auto rotate-90" />
            </div>

            <div className="absolute top-full right-0 mt-2 w-[400px] max-h-[500px] overflow-y-auto bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 p-6 opacity-0 group-hover/selector:opacity-100 pointer-events-none group-hover/selector:pointer-events-auto transition-all duration-300 translate-y-2 group-hover/selector:translate-y-0">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Multi-Country Selection</h4>
               <div className="grid grid-cols-2 gap-2">
                 <button
                   onClick={() => toggleCountry('REG')}
                   className={cn(
                     "col-span-2 p-4 rounded-2xl text-left transition-all mb-4 flex items-center justify-between font-black uppercase tracking-widest text-[10px]",
                     selectedCountries.includes('REG') ? "bg-unfpa-blue text-white shadow-xl shadow-unfpa-blue/20" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                   )}
                 >
                   WCA Regional Aggregate
                   {selectedCountries.includes('REG') && <CheckCircle2 className="w-4 h-4" />}
                 </button>
                 {WCA_COUNTRIES.map(country => (
                    <button
                      key={country.id}
                      onClick={() => toggleCountry(country.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl text-left transition-all border",
                        selectedCountries.includes(country.id) ? "bg-unfpa-blue/5 border-unfpa-blue/20 text-unfpa-blue" : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span className="text-[10px] font-bold uppercase">{country.name}</span>
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                        selectedCountries.includes(country.id) ? "bg-unfpa-blue border-unfpa-blue" : "border-slate-200"
                      )}>
                        {selectedCountries.includes(country.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                 ))}
               </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showCorrection ? (
          <motion.div
            key="correction"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-rose-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-10 -rotate-12 translate-x-1/4">
                 <ShieldAlert className="w-64 h-64" />
               </div>
               <div className="relative z-10">
                 <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-4">Strategic Correction Report</h3>
                 <h4 className="text-5xl font-black uppercase tracking-tighter mb-6 leading-none">High Variance <br/> Flags Detected</h4>
                 <p className="text-white/80 font-medium text-base leading-relaxed max-w-2xl">
                    Our multi-jurisdictional analysis for {displayLabel} reveals critical disparities between current results and the 2029 Strategic Plan benchmarks. {countryLedger.filter(i => (i.target2029 < i.baseline ? i.currentRegional > i.baseline : i.currentRegional < i.baseline)).length} indicators are currently flagged as "Stalled" or "Regressing".
                 </p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {countryLedger.filter(ind => {
                 const isPositive = ind.target2029 < ind.baseline ? ind.currentRegional < ind.baseline : ind.currentRegional > ind.baseline;
                 return !isPositive;
               }).map((indicator) => {
                 const outcome = SP_OUTCOMES[indicator.outcomeId as keyof typeof SP_OUTCOMES];
                 return (
                   <div key={indicator.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-rose-100 shadow-sm hover:shadow-xl transition-all group">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100">
                            Critical Flag
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: outcome.color }} />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{indicator.outcomeId}</span>
                         </div>
                      </div>
                      <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-4 leading-none group-hover:text-rose-600 transition-colors">
                        {indicator.label}
                      </h4>
                      
                      <div className="grid grid-cols-3 gap-4 mb-8">
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Baseline</span>
                            <span className="text-base font-black text-slate-600">{indicator.baseline}</span>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Current</span>
                            <span className="text-base font-black text-rose-600">{indicator.currentRegional.toFixed(1)}</span>
                         </div>
                         <div className="bg-slate-900 p-4 rounded-2xl">
                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1">Target</span>
                            <span className="text-base font-black text-white">{indicator.target2029}</span>
                         </div>
                      </div>

                      <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100 border-l-4 border-l-rose-500">
                         <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" /> Correction Logic
                         </h5>
                         <p className="text-xs font-black text-rose-900 leading-tight italic">
                            {indicator.outcomeId === 'outcome1' ? 'Accelerate service integration and expand task-sharing to community health workers.' : 
                             indicator.outcomeId === 'outcome2' ? 'Intensify maternal health surveillance and scale-up midwifery-led care models.' :
                             indicator.outcomeId === 'outcome3' ? 'Harmonize legal protection frameworks and increase specialized response hub funding.' :
                             'Consolidate spatial data hubs and integrate demographic variables into national development planning.'}
                         </p>
                      </div>
                   </div>
                 );
               })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="ledger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Regional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
                 <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12 translate-x-1/4 hover:scale-110 transition-transform duration-700">
                   <Globe2 className="w-48 h-48" />
                 </div>
                 <div className="relative z-10">
                   <h4 className="text-[10px] font-black text-unfpa-blue uppercase tracking-widest mb-2">Scope Benchmark</h4>
                   <h3 className="text-4xl font-black tracking-tighter mb-8 leading-none">{selectedCountries.length > 3 ? 'Aggregated' : displayLabel} <br/> Achievement</h3>
                   <div className="flex items-baseline gap-2">
                     <span className="text-6xl font-black">{regionalAchievement.toFixed(1)}</span>
                     <span className="text-2xl font-black text-unfpa-blue">%</span>
                   </div>
                   <div className="mt-6 flex items-center gap-2">
                     <TrendingUp className="w-4 h-4 text-emerald-400" />
                     <span className="text-[10px] font-bold text-emerald-400 uppercase">+1.2% since Strategic Baseline</span>
                   </div>
                 </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                 {Object.values(SP_OUTCOMES).map((outcome, i) => {
                   const indicators = countryLedger.filter(ind => ind.outcomeId === outcome.id);
                   const achievement = indicators.reduce((acc, curr) => {
                     const totalDist = Math.abs(curr.target2029 - curr.baseline);
                     const currentDist = Math.abs(curr.currentRegional - curr.baseline);
                     return acc + (currentDist / totalDist);
                   }, 0) / indicators.length * 100;

                   return (
                     <div key={outcome.id}>
                       <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-2">
                           <div className="w-1 h-4 rounded-full" style={{ backgroundColor: outcome.color }} />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OUTCOME {i+1}</span>
                         </div>
                         <span className="text-[10px] font-black text-slate-900">{achievement.toFixed(0)}%</span>
                       </div>
                       <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden mb-2 border border-slate-100">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${achievement}%` }}
                            className="h-full"
                            style={{ backgroundColor: outcome.color }}
                          />
                       </div>
                       <p className="text-[11px] font-bold text-slate-600 line-clamp-1">{outcome.label.split(': ')[1]}</p>
                     </div>
                   );
                 })}
              </div>
            </div>

            {/* Main Ledger */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-10">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-none">Strategic Indicator Ledger</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{displayLabel} Impact Mapping</p>
                </div>
                <div className="relative group w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-unfpa-blue" />
                  <input 
                    type="text" 
                    placeholder="Filter Ledger..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-unfpa-blue/10 shadow-sm"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">ID</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 min-w-[300px]">Strategic Indicator</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Outcome</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Baseline</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Current</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">2029 Target</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Activity Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {countryLedger.filter(ind => ind.label.toLowerCase().includes(searchQuery.toLowerCase())).map((indicator) => {
                      const outcome = SP_OUTCOMES[indicator.outcomeId as keyof typeof SP_OUTCOMES];
                      // Simulated implementation status
                      const isPositive = indicator.target2029 < indicator.baseline ? indicator.currentRegional < indicator.baseline : indicator.currentRegional > indicator.baseline;
                      
                      return (
                        <motion.tr 
                          key={indicator.id}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-black text-slate-400 group-hover:text-unfpa-blue transition-colors">{indicator.id}</span>
                          </td>
                          <td className="px-6 py-6">
                            <p className="text-xs font-black text-slate-900 group-hover:text-unfpa-blue transition-colors leading-tight mb-1">{indicator.label}</p>
                            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">{indicator.unit}</p>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: outcome.color }} />
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest transition-opacity group-hover:opacity-100">
                                 {outcome.label.split(':')[0]}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-center">
                             <span className="text-xs font-black text-slate-400">{indicator.baseline}</span>
                          </td>
                          <td className="px-6 py-6 text-center">
                             <span className={cn(
                               "text-xs font-black",
                               isPositive ? "text-emerald-600" : "text-rose-600"
                             )}>{indicator.currentRegional.toFixed(1)}</span>
                          </td>
                          <td className="px-6 py-6 text-center">
                             <span className="text-xs font-black text-slate-900">{indicator.target2029}</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className="flex flex-col items-end">
                               <div className={cn(
                                 "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                                 isPositive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                               )}>
                                 {isPositive ? <TrendingUp className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                 {isPositive ? 'On Track' : 'Stalled'}
                               </div>
                               {!isPositive && (
                                 <button 
                                   onClick={() => setShowCorrection(true)}
                                   className="mt-2 text-[8px] font-black uppercase text-rose-500 tracking-tighter hover:underline"
                                 >
                                   Correction Needed
                                 </button>
                               )}
                               {isPositive && <span className="mt-2 text-[8px] font-black uppercase text-slate-300 tracking-tighter">Verified: Q1 2026</span>}
                             </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-900 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-unfpa-blue/20 rounded-xl">
                     <FileText className="w-6 h-6 text-unfpa-blue" />
                   </div>
                   <div>
                     <h4 className="text-sm font-black text-white uppercase tracking-tighter">Integrated IRRF Synthesis Report</h4>
                     <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Status: Operational Review Active</p>
                   </div>
                 </div>
                 <button className="px-8 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] transition-all active:scale-95 shadow-lg">
                   Export Strategic Ledger (CSV/PDF)
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

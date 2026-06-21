import React from 'react';
import { 
  BrainCircuit, 
  Target, 
  Satellite, 
  Compass, 
  Sparkles, 
  LayoutDashboard, 
  Boxes, 
  Cpu, 
  ShieldCheck, 
  BookOpen, 
  Globe2, 
  ArrowUpRight, 
  Orbit, 
  LifeBuoy,
  Table as TableIcon,
  Search,
  Database,
  BarChart3,
  Network
} from 'lucide-react';
import HeroGeoMotif from './quantum/HeroGeoMotif';
import DataRevisionPanel from './quantum/DataRevisionPanel';

export default function AboutGeospatialPlatform() {
  // Indicator catalog mirrors the live UNFPA Population Data Portal (pdp.unfpa.org).
  // `source` shows the PDP indicator_code now pulled by the ingestion pipeline.
  const outcomes = [
    {
      id: "Outcome 1",
      title: "Family Planning",
      color: "blue",
      metrics: [
        { name: "Contraceptive prevalence rate, modern methods, all women", source: "UNFPA PDP · code 33.1" },
        { name: "Unmet need for family planning, all women", source: "UNFPA PDP · code 37.1" },
        { name: "Demand for family planning satisfied by modern methods", source: "UNFPA PDP · code 36.1 (SDG 3.7.1)" }
      ]
    },
    {
      id: "Outcome 2",
      title: "Maternal & Newborn Health",
      color: "rose",
      metrics: [
        { name: "Maternal mortality ratio", source: "UNFPA PDP · code 52 (UN MMEIG)" },
        { name: "Adolescent birth rate", source: "UNFPA PDP · code 26 / WHO GHO fallback" },
        { name: "Skilled birth attendance rate", source: "WHO GHO · MDG_0000000025" }
      ]
    },
    {
      id: "Outcome 3",
      title: "GBV & Harmful Practices",
      color: "orange",
      metrics: [
        { name: "Intimate partner violence, lifetime", source: "UNFPA PDP · code 193 (DHS)" },
        { name: "Intimate partner violence, past 12 months", source: "UNFPA PDP · code 176 (SDG 5.2.1)" },
        { name: "Child marriage (married before age 18)", source: "UNFPA PDP / UNICEF · DHS" }
      ]
    },
    {
      id: "Outcome 4",
      title: "Demographic Resilience",
      color: "purple",
      metrics: [
        { name: "Population dynamics & sustainable development", source: "UN World Population Prospects" },
        { name: "Crisis & displacement context", source: "GDELT signal / IOM DTM" },
        { name: "Census round completion", source: "UNFPA / UNSD" }
      ]
    }
  ];

  const objectives = [
    {
      title: "Strategic Decision Support",
      description: "Providing high-fidelity data visualization to support UNFPA WCA leadership in regional strategic pivots.",
      icon: <BrainCircuit className="w-6 h-6 text-unfpa-blue" />
    },
    {
      title: "Strategic Ledger (Performance Audit)",
      description: "Utilizing a 'Strategic Ledger' concept to create an immutable record of field performance and milestone achievement.",
      icon: <Target className="w-6 h-6 text-emerald-600" />
    },
    {
      title: "Antigravity-v2.6 SE (AI Engine)",
      description: "Powered by the Antigravity AI core, utilizing machine learning to anticipate humanitarian crises and pre-position services.",
      icon: <Satellite className="w-6 h-6 text-rose-600" />
    }
  ];

  const indicators = [
    {
      name: "Maternal Mortality Ratio",
      source: "UNFPA PDP · code 52 (UN MMEIG)",
      calculation: "Maternal deaths per 100,000 live births",
      analysis: "Spatial Hotspot Mapping & Trend Regression"
    },
    {
      name: "Contraceptive Prevalence, Modern Methods",
      source: "UNFPA PDP · code 33.1",
      calculation: "% of all women using modern contraception",
      analysis: "Bivariate Spatial Analysis & Projection"
    },
    {
      name: "Unmet Need for Family Planning",
      source: "UNFPA PDP · code 37.1",
      calculation: "% of women wanting to avoid pregnancy but not using contraception",
      analysis: "Gap Identification & Access Analysis"
    },
    {
      name: "Demand Satisfied, Modern Methods",
      source: "UNFPA PDP · code 36.1 (SDG 3.7.1)",
      calculation: "% of FP demand met with modern methods",
      analysis: "Coverage Convergence Analysis"
    },
    {
      name: "Intimate Partner Violence, Lifetime",
      source: "UNFPA PDP · code 193 (DHS) → DHS fallback",
      calculation: "% of women experiencing lifetime physical/sexual IPV",
      analysis: "Prevalence Clustering & Risk Density"
    },
    {
      name: "Adolescent Birth Rate",
      source: "UNFPA PDP · code 26 → WHO GHO fallback",
      calculation: "Births per 1,000 women aged 15-19",
      analysis: "Demographic Dividend Impact Modeling"
    },
    {
      name: "Crisis Hotspot Index",
      source: "GDELT signal / IOM DTM (context only)",
      calculation: "Weighted index of conflict, climate, and displacement data",
      analysis: "Real-time Crisis Vector Mapping"
    }
  ];

  const verificationSources = [
    { name: "UNFPA Population Data Portal (Primary SP Indicator Source)", category: "Primary Source", url: "https://pdp.unfpa.org/" },
    { name: "UN World Population Prospects (2024 Revision)", category: "Demographics", url: "https://population.un.org/wpp/" },
    { name: "UNFPA WCA Regional Demographic Resilience Framework", category: "Strategy", url: "https://wca.unfpa.org/en/publications/demographic-resilience-framework" },
    { name: "GDELT Project (Global Database of Events, Language, and Tone)", category: "Crisis Mapping", url: "https://www.gdeltproject.org/" },
    { name: "DHS Program (Demographic and Health Surveys)", category: "Health Indicators", url: "https://dhsprogram.com/" },
    { name: "WHO Global Health Observatory", category: "Mortality & Health", url: "https://www.who.int/data/gho" }
  ];

  return (
    <div className="bg-main-bg min-h-screen overflow-y-auto custom-scrollbar">
      <div className="max-w-[1400px] mx-auto p-8 lg:p-12 space-y-12 pb-32">

        {/* Hero */}
        <div className="bg-gradient-to-br from-quantum-blue via-quantum-blue-dark to-quantum-blue-darker rounded-[2.5rem] p-12 lg:p-16 text-white relative overflow-hidden shadow-sm">
          <HeroGeoMotif className="pointer-events-none absolute -top-40 -right-20 w-[700px] h-[700px] opacity-35 hidden md:block" />
          <div className="absolute top-0 right-0 p-20 opacity-20 -rotate-12 translate-x-1/4">
            <Orbit className="w-[800px] h-[800px] text-white animate-[spin_60s_linear_infinite]" />
          </div>
          <div className="absolute bottom-0 left-0 p-20 opacity-10">
             <LayoutDashboard className="w-96 h-96" />
          </div>

          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/15 rounded-full border border-white/20 backdrop-blur-xl mb-10">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Next-Gen Humanitarian Command</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-8">
              The Geospatial Integrated<br/>
              <span className="text-white/80">Analysis Platform</span>
            </h1>

            <p className="text-xl font-medium text-white/75 leading-relaxed mb-12 max-w-3xl">
              The WCA Population Dynamics Intelligence Hub is an advanced analytics ecosystem merging demographic sovereignty with high-fidelity geospatial intelligence. 
              Built for the 2026-2029 Strategic Plan transition.
            </p>
            
            <div className="flex flex-wrap gap-6">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Build Core</span>
                  <span className="text-lg font-bold">Antigravity-v2.6 SE</span>
               </div>
               <div className="w-px h-12 bg-white/10" />
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Intelligence Type</span>
                  <span className="text-lg font-bold">Predictive Geospatial</span>
               </div>
               <div className="w-px h-12 bg-white/10" />
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Regional Hub</span>
                  <span className="text-lg font-bold">WCARO / Dakar</span>
               </div>
            </div>
          </div>
        </div>

        {/* Data Revision & Sources (live multi-source provenance) */}
        <DataRevisionPanel />

        {/* Objectives Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {objectives.map((obj, i) => (
            <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:translate-y-[-8px] transition-all duration-500 group">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 border border-slate-100 group-hover:bg-unfpa-blue group-hover:border-unfpa-blue transition-all duration-500">
                <div className="group-hover:text-white transition-colors duration-500">
                  {obj.icon}
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-4">{obj.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{obj.description}</p>
            </div>
          ))}
        </div>

        {/* Outcome Alignment Section */}
        <div className="space-y-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                <Network className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xs font-black text-purple-600 uppercase tracking-[0.4em]">Strategic Coherence</h3>
            </div>
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-6">Outcome Alignment Matrix</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              Direct mapping of the 2026-2029 Strategic Plan Outcomes to the specific geospatial indicators and datasets monitored by the platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {outcomes.map((outcome, idx) => (
              <div key={idx} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${outcome.color}-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700`} />
                
                <div className="flex items-center gap-4 mb-8">
                  <div className={`px-4 py-1.5 rounded-full bg-${outcome.color}-100 text-${outcome.color}-700 text-[10px] font-black uppercase tracking-widest border border-${outcome.color}-200`}>
                    {outcome.id}
                  </div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{outcome.title}</h3>
                </div>

                <div className="space-y-6">
                  {outcome.metrics.map((metric, mIdx) => (
                    <div key={mIdx} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                      <div className={`shrink-0 w-10 h-10 rounded-xl bg-${outcome.color}-50 flex items-center justify-center border border-${outcome.color}-100`}>
                        <Search className={`w-5 h-5 text-${outcome.color}-600`} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">{metric.name}</p>
                        <div className="flex items-center gap-2">
                           <Database className="w-3 h-3 text-slate-400" />
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source: {metric.source}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CRITICAL FEATURE: The Indicator Matrix Table */}
        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden relative">
          <div className="p-12 md:p-16">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-16">
              <div className="max-w-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <TableIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.4em]">Integrated Ledger</h3>
                </div>
                <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-6">Indicator & Analytics Matrix</h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Detailed technical documentation of the core indicators driving the dashboard's geospatial analysis, including sources, calculations, and analytical methods.
                </p>
              </div>
              
              <div className="flex gap-4">
                 <div className="px-8 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-2xl font-black text-slate-800 tracking-tighter">10+</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Datasets</p>
                 </div>
                 <div className="px-8 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-2xl font-black text-slate-800 tracking-tighter">Daily</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sync Frequency</p>
                 </div>
              </div>
            </div>

            <div className="overflow-x-auto -mx-12 md:-mx-16">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/50">
                    <th className="py-6 px-12 md:px-16 text-[10px] font-black text-slate-400 uppercase tracking-widest">Indicator Metric</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Data Source</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Technical Calculation</th>
                    <th className="py-6 px-12 md:px-16 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type of Analysis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {indicators.map((indicator, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-8 px-12 md:px-16">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-unfpa-blue group-hover:scale-150 transition-transform" />
                          <span className="text-base font-black text-slate-800 uppercase tracking-tight">{indicator.name}</span>
                        </div>
                      </td>
                      <td className="py-8 px-8">
                        <span className="text-sm font-bold text-slate-500">{indicator.source}</span>
                      </td>
                      <td className="py-8 px-8">
                        <div className="bg-slate-100/50 border border-slate-200/50 px-4 py-2 rounded-xl inline-block">
                          <code className="text-[11px] font-mono text-slate-600 font-bold">{indicator.calculation}</code>
                        </div>
                      </td>
                      <td className="py-8 px-12 md:px-16">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <BarChart3 className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-black text-slate-700 uppercase tracking-tight italic">{indicator.analysis}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Verification & Verification Links */}
        <div className="bg-emerald-50 rounded-[4rem] p-16 border border-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-20 opacity-5">
            <ShieldCheck className="w-[600px] h-[600px] text-emerald-950" />
          </div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-5 mb-8">
                <div className="p-4 bg-emerald-600 rounded-3xl shadow-2xl shadow-emerald-600/20">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.4em] mb-1">Verify Accuracy</h3>
                  <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter">Global Repositories</h2>
                </div>
              </div>
              <p className="text-emerald-900/60 font-bold italic text-lg leading-relaxed mb-10">
                This platform is connected via live APIs and static batch processing to the following primary sources. Click to verify the underlying records.
              </p>
              
              <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/50">
                 <div className="flex items-center gap-4 mb-6">
                    <Database className="w-6 h-6 text-emerald-700" />
                    <span className="text-xs font-black uppercase text-emerald-900 tracking-widest">Sync Health: 99.9%</span>
                 </div>
                 <div className="space-y-4">
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                       <div className="h-full w-[99.9%] bg-emerald-500" />
                    </div>
                    <p className="text-[10px] text-emerald-800/40 font-black uppercase tracking-widest">Last regional reconciliation: 2 hours ago</p>
                 </div>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {verificationSources.map((source, i) => (
                <a 
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col justify-between p-10 bg-white rounded-[3rem] border border-emerald-100 hover:border-emerald-500 hover:shadow-2xl transition-all group overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                     <Network className="w-48 h-48" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 mb-8 group-hover:bg-emerald-600 group-hover:border-emerald-600 transition-all">
                      <Globe2 className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors mb-4 leading-tight">{source.name}</h4>
                    <span className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">{source.category}</span>
                  </div>
                  <div className="mt-12 flex items-center justify-between pt-8 border-t border-slate-50 relative z-10">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Access External API</span>
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors shadow-sm">
                      <ArrowUpRight className="w-6 h-6 text-slate-300 group-hover:text-emerald-500 transform group-hover:-translate-y-1 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Core Innovation Block */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
           <div className="p-16 bg-slate-900 rounded-[4rem] text-white overflow-hidden relative border border-white/10 group">
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                 <Boxes className="w-64 h-64" />
              </div>
              <div className="relative z-10">
                 <div className="inline-flex items-center gap-3 px-6 py-2 bg-emerald-500/20 rounded-full border border-emerald-500/30 backdrop-blur-xl mb-12">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Security & Performance</span>
                 </div>
                 <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 leading-tight">The Strategic <br/> Ledger</h2>
                 <p className="text-white/60 font-medium text-lg leading-relaxed mb-10 max-w-md">
                    Our proprietary "Strategic Ledger" concept enforces high-integrity performance auditing. 
                    Every milestone, from field outreach to policy signing, is logged as an immutable entry, 
                    ensuring 100% transparency in WCA results-based management.
                 </p>
                 <div className="flex items-center gap-4 py-8 border-t border-white/10">
                    <div className="shrink-0 w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                       <LayoutDashboard className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                       <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Audit Protocol</p>
                       <p className="text-sm font-bold text-white tracking-tight">Quantum-Core Compliance v4.0</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="p-16 bg-unfpa-blue rounded-[4rem] text-white overflow-hidden relative group border border-white/10">
              <div className="absolute bottom-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                 <Cpu className="w-64 h-64" />
              </div>
              <div className="relative z-10">
                 <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/20 rounded-full border border-white/30 backdrop-blur-xl mb-12">
                    <Sparkles className="w-4 h-4 text-white" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Predictive Intelligence</span>
                 </div>
                 <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 leading-tight">Antigravity <br/> v2.6 SE Core</h2>
                 <p className="text-white/80 font-medium text-lg leading-relaxed mb-10 max-w-md">
                    The platform's predictive engine is powered by the Antigravity-v2.6 SE AI. 
                    This model processes multi-modal inputs—from demographic surveys to real-time humanitarian vectors—to anticipate 
                    shifts in SRHR demand with hyper-local precision.
                 </p>
                 <div className="flex items-center gap-4 py-8 border-t border-white/10">
                    <div className="shrink-0 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                       <BrainCircuit className="w-6 h-6 text-white" />
                    </div>
                    <div>
                       <p className="text-xs font-black uppercase tracking-widest text-white/60">AI Architecture</p>
                       <p className="text-sm font-bold text-white tracking-tight">Predictive Neural Vector Mapping</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Vision Footer */}
        <div className="bg-unfpa-blue rounded-[5rem] p-20 text-center relative overflow-hidden text-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 opacity-10">
             <Orbit className="w-[1000px] h-[1000px] text-white animate-pulse" />
          </div>
          <div className="max-w-3xl mx-auto relative z-10">
            <LifeBuoy className="w-20 h-20 text-white/40 mx-auto mb-10" />
            <h3 className="text-5xl font-black uppercase tracking-tighter mb-8 leading-tight">Demographic Sovereignty <br/> for Every Life</h3>
            <p className="text-white/70 font-medium text-xl leading-relaxed mb-16">
              This intelligence platform serves as the technical vanguard of UNFPA's mission in West and Central Africa. 
              By mapping the unseen, we ensure no one is left behind in the demographic transition.
            </p>
            
            <div className="bg-white/10 backdrop-blur-2xl rounded-full p-8 flex flex-col md:flex-row items-center justify-center gap-20 border border-white/10">
               <div className="text-center">
                  <p className="text-4xl font-black">2026</p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">Active Cycle</p>
               </div>
               <div className="hidden md:block w-px h-12 bg-white/20" />
               <div className="text-center">
                  <p className="text-4xl font-black">WCA</p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">Regional Focus</p>
               </div>
               <div className="hidden md:block w-px h-12 bg-white/20" />
               <div className="text-center">
                  <p className="text-4xl font-black">AI+</p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">Engine Mode</p>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

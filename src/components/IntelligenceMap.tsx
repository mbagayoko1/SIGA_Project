import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { generateNarrative, hasGemini } from '../lib/ai';
import { localIntelSummary } from '../lib/aiFallbacks';
import { 
  Radar, 
  ShieldAlert, 
  Globe2, 
  Zap, 
  Activity, 
  MessageSquare,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  Search,
  Loader2,
  ShieldCheck,
  X,
  Lock
} from 'lucide-react';
import { cn } from '../lib/utils';
import GeospatialMap from './GeospatialMap';
import { CountryRiskInfo, WCA_COUNTRY_INTELLIGENCE } from '../data/riskFlux';

const INTEL_ALERTS = [
  { id: '1', region: 'Central Sahel', status: 'High Risk', detail: 'Rapid evolution of cross-border movement in the Liptako-Gourma region.', severity: 'critical' },
  { id: '2', region: 'Gulf of Guinea', status: 'Monitoring', detail: 'Increased maritime security drills responding to coastal trade flux.', severity: 'warning' },
  { id: '3', region: 'Lake Chad Basin', status: 'Stable', detail: 'Humanitarian corridors established for vaccine distribution.', severity: 'stable' },
];

export default function IntelligenceMap() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [intelSummary, setIntelSummary] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryRiskInfo | null>(null);
  const [selectedTiers, setSelectedTiers] = useState<string[]>(['Critical', 'High', 'Moderate', 'Stable']);

  const filteredCountries = Object.values(WCA_COUNTRY_INTELLIGENCE).filter(c => 
    selectedTiers.includes(c.status) &&
    (searchQuery === '' || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleTier = (tier: string) => {
    setSelectedTiers(prev => 
      prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
    );
  };

  const executeSynthesis = async () => {
    setIsSynthesizing(true);

    let context = "";
    if (selectedCountry) {
      context = `Focus Specifically on: ${selectedCountry.name}. Threats: ${selectedCountry.threats.join(', ')}. Context: ${selectedCountry.politicalContext}.`;
    } else {
      const tierNames = selectedTiers.join(', ');
      const count = filteredCountries.length;
      context = `Focus on Regional Operational Tiers: [${tierNames}]. Analyzing ${count} countries including ${filteredCountries.slice(0, 3).map(c => c.name).join(', ')}. Focus on: 1. Security-Migration Nexus. 2. Maritime security. 3. Strategic humanitarian access.`;
    }

    if (!hasGemini) {
      setIntelSummary(localIntelSummary(context));
      setIsSynthesizing(false);
      return;
    }

    try {
      const prompt = `
        You are a Senior Geospatial Intelligence Analyst for UNFPA WCARO.
        Analyze the current Risk Flux dynamics in West and Central Africa for 2026.
        ${context}

        Provide a concise, executive intelligence summary (180 words).
        Focus on how these specific operational tiers impact UNFPA's response readiness.
        Style: Highly technical, strategic, restricted-level briefing.
      `;
      const text = await generateNarrative(prompt);
      setIntelSummary(text);
    } catch (err) {
      console.error('Intel synthesis failed, using local summary:', err);
      setIntelSummary(localIntelSummary(context));
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      const found = Object.values(WCA_COUNTRY_INTELLIGENCE).find(c => 
        c.name.toLowerCase().includes(query.toLowerCase())
      );
      if (found) setSelectedCountry(found);
    }
  };

  return (
    <div className="h-full flex flex-col bg-quantum-blue-darker overflow-hidden font-sans">
      {/* Intelligence Header */}
      <div className="bg-black-10 border-b border-white-10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-quantum-blue flex items-center justify-center shadow-sm">
            <Radar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">Risk Flux Intelligence</h1>
            <p className="text-[10px] text-quantum-blue-light font-semibold uppercase tracking-[0.18em] mt-1.5">Strategic Geospatial Monitoring · WCARO</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-hover:text-unfpa-blue transition-colors" />
              <input 
                type="text"
                placeholder="Search Risk Zones or Countries..."
                value={searchQuery}
                onChange={handleSearch}
                className="bg-white-5 border border-white-10 rounded-full px-10 py-2 text-[10px] text-white font-bold w-64 focus:outline-none focus:border-unfpa-blue transition-all"
              />
           </div>
           <div className="h-6 w-px bg-white-10" />
           <div className="flex items-center gap-2">
              <Lock className="w-3 h-3 text-unfpa-orange" />
              <span className="text-[9px] font-black text-unfpa-orange uppercase tracking-widest">TS//SCI RESTRICTED ACCESS</span>
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[1fr_360px] overflow-hidden">
        {/* Map Stage */}
        <div className="relative overflow-hidden p-6">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(65,143,222,0.05)_0%,transparent_70%)]" />
           <div className="h-full w-full bg-slate-900 rounded-[2.5rem] border border-white-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
              <GeospatialMap onSelectCountry={setSelectedCountry} selectedCountryId={selectedCountry?.id} />
              
              {/* Tactical Overlay Elements */}
              <div className="absolute top-8 left-8 flex flex-col gap-2 pointer-events-none">
                 <TacticalLabel icon={<Zap className="w-3 h-3" />} label="Satellite Uplink Active" />
                 <TacticalLabel icon={<Activity className="w-3 h-3" />} label="Real-time SigInt Flow" />
              </div>
           </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="bg-slate-900 border-l border-white-10 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {/* Country Detailed Tactical Panel */}
                  <AnimatePresence mode="wait">
                {selectedCountry ? (
                  <motion.div 
                    key={selectedCountry.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-unfpa-blue rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform">
                       <Globe2 className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <span className={cn(
                          "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-white/20 backdrop-blur-md",
                          selectedCountry.status === 'Critical' ? 'text-red-200' : 'text-white'
                        )}>{selectedCountry.status} Status</span>
                        <button onClick={() => setSelectedCountry(null)} className="p-1 hover:bg-white/10 rounded-lg">
                           <X className="w-3 h-3" />
                        </button>
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">{selectedCountry.name}</h3>
                      <div className="flex items-center gap-2 mb-6">
                         <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${selectedCountry.riskScore}%` }}
                              className={cn(
                                "h-full",
                                selectedCountry.riskScore > 80 ? "bg-red-400" : "bg-emerald-400"
                              )}
                            />
                         </div>
                         <span className="text-[10px] font-black">{selectedCountry.riskScore}% Risk</span>
                      </div>
                      
                      <div className="space-y-4">
                         <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-white/60 mb-2">Threat Profile</p>
                            <div className="flex flex-wrap gap-2">
                               {selectedCountry.threats.map((t, idx) => (
                                 <span key={idx} className="text-[8px] font-bold bg-white/10 px-2 py-1 rounded-lg border border-white/10">{t}</span>
                               ))}
                            </div>
                         </div>
                         <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-white/60 mb-1">Political Context</p>
                            <p className="text-[10px] font-medium leading-relaxed">{selectedCountry.politicalContext}</p>
                         </div>
                         <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-white/60 mb-1">Humanitarian Gap</p>
                            <p className="text-[10px] font-medium leading-relaxed italic">{selectedCountry.humanitarianNeeds}</p>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                       <StatusTile label="WCA Stability" value="Strained" trend="down" />
                       <StatusTile label="Refugee Flux" value="+14% YoY" trend="up" />
                    </div>

                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Regional Operational Tiering</h4>
                          <button 
                            onClick={() => setSelectedTiers(selectedTiers.length === 4 ? [] : ['Critical', 'High', 'Moderate', 'Stable'])}
                            className="text-[8px] font-black text-unfpa-blue uppercase hover:underline"
                          >
                            {selectedTiers.length === 4 ? 'Deselect All' : 'Select All'}
                          </button>
                       </div>
                       
                       {/* Tier Selectors */}
                       <div className="flex flex-wrap gap-2 mb-4">
                          {['Critical', 'High', 'Moderate', 'Stable'].map(tier => (
                            <button
                              key={tier}
                              onClick={() => toggleTier(tier)}
                              className={cn(
                                "px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border transition-all",
                                selectedTiers.includes(tier) 
                                  ? "bg-unfpa-blue border-unfpa-blue text-white shadow-[0_0_10px_rgba(65,143,222,0.3)]"
                                  : "bg-white-5 border-white-10 text-slate-500 hover:border-white-20"
                              )}
                            >
                              {tier}
                            </button>
                          ))}
                       </div>

                       <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {filteredCountries.sort((a, b) => b.riskScore - a.riskScore).map(country => (
                            <button 
                              key={country.id}
                              onClick={() => setSelectedCountry(country)}
                              className="w-full flex items-center justify-between p-3 bg-white-5 border border-white-10 rounded-xl hover:bg-white-10 transition-all group"
                            >
                               <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    country.riskScore > 80 ? "bg-red-500" : country.riskScore > 50 ? "bg-orange-500" : "bg-emerald-500"
                                  )} />
                                  <span className="text-[10px] font-black text-white uppercase tracking-tight group-hover:text-unfpa-blue transition-colors">{country.name}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black text-slate-600 uppercase italic">{country.status}</span>
                                  <span className="text-[9px] font-bold text-slate-500">{country.riskScore}</span>
                               </div>
                            </button>
                          ))}
                          {filteredCountries.length === 0 && (
                            <div className="py-8 text-center">
                               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">No Intel Matches Selected Tiering</p>
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                )}
              </AnimatePresence>

              {/* Critical Alerts */}
              <div className="space-y-3 pt-4">
                 <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Strategic Alerts</h4>
                 {INTEL_ALERTS.map(alert => (
                   <div key={alert.id} className="bg-white-5 border border-white-10 rounded-2xl p-4 hover:bg-white-10 transition-all group">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[8px] font-black text-white uppercase tracking-widest">{alert.region}</span>
                         <span className={cn(
                           "text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest",
                           alert.severity === 'critical' ? 'bg-red-500-20 text-red-500 border border-red-500-30' : 
                           alert.severity === 'warning' ? 'bg-unfpa-blue-20 text-unfpa-blue border border-unfpa-blue-30' : 'bg-emerald-500-20 text-emerald-500 border border-emerald-500-30'
                         )}>{alert.status}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed group-hover:text-white transition-colors">{alert.detail}</p>
                   </div>
                 ))}
              </div>

                  {/* Insight Generation Button */}
                  <div className="pt-6 space-y-4">
                     <button 
                      onClick={executeSynthesis}
                      disabled={isSynthesizing}
                      className="w-full bg-unfpa-blue text-white p-4 rounded-2xl flex items-center justify-center gap-3 group overflow-hidden relative disabled:opacity-50"
                     >
                        {isSynthesizing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <BrainCircuit className="w-4 h-4 text-white" />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {isSynthesizing ? 'Synthesizing Tactical Data...' : 'Execute AI Intel Synthesis'}
                        </span>
                     </button>

                 <AnimatePresence>
                    {intelSummary && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-unfpa-blue-10 border border-unfpa-blue-20 rounded-2xl p-4"
                      >
                         <div className="flex items-center gap-2 mb-2">
                             <MessageSquare className="w-3 h-3 text-unfpa-blue" />
                             <span className="text-[8px] font-black text-unfpa-blue uppercase tracking-widest">AI Generated Insight</span>
                          </div>
                          <div className="text-[10px] text-slate-300 font-medium leading-relaxed italic prose prose-invert max-w-none">
                             <ReactMarkdown>{intelSummary}</ReactMarkdown>
                          </div>
                       </motion.div>
                     )}
                  </AnimatePresence>
               </div>

               {/* Technical Telemetry */}
              <div className="pt-8 space-y-4">
                 <TelemetryLine label="Grid Calibration" value="OK" />
                 <TelemetryLine label="Latency (Hub-6)" value="42ms" />
                 <TelemetryLine label="Asset Visibility" value="89.4%" />
              </div>
           </div>

           {/* Footer Security Branding */}
           <div className="p-6 bg-slate-950-50 border-t border-white-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-unfpa-blue" />
                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">UNFPA Integrated Intel System</span>
              </div>
              <Globe2 className="w-4 h-4 text-slate-700" />
           </div>
        </div>
      </div>
    </div>
  );
}

function TacticalLabel({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="bg-slate-900 border border-white-10 px-3 py-1.5 rounded-full flex items-center gap-2">
       <span className="text-unfpa-blue">{icon}</span>
       <span className="text-[8px] font-black text-white uppercase tracking-widest">{label}</span>
    </div>
  );
}

function StatusTile({ label, value, trend }: { label: string, value: string, trend: 'up' | 'down' | 'flat' }) {
  return (
    <div className="bg-white-5 border border-white-10 p-4 rounded-2xl">
       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
       <div className="flex items-center justify-between">
          <span className="text-xs font-black text-white uppercase tracking-tight">{value}</span>
          <TrendingUp className={cn("w-3 h-3", trend === 'up' ? 'text-red-500' : 'text-emerald-500', trend === 'down' && 'rotate-180')} />
       </div>
    </div>
  );
}

function TelemetryLine({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white-5 pb-2">
       <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
       <span className="text-[8px] font-black text-unfpa-blue uppercase tracking-widest">{value}</span>
    </div>
  );
}

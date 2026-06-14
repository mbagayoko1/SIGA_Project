import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, 
  RefreshCw, TrendingUp, Info, ArrowRight,
  ShieldCheck, ClipboardCheck, BarChart3,
  FileSearch, Search, Filter, X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { WCA_COUNTRIES } from '../data';
import { useUser } from '../contexts/UserContext';
import { userService } from '../services/userService';
import HeroGeoMotif from './quantum/HeroGeoMotif';

interface AlignmentItem {
  id: string;
  focusArea: string;
  status: 'aligned' | 'misaligned' | 'partial';
  score: number;
  description: string;
  correction?: string;
  level: 'Programme' | 'QA' | 'Operational';
}

const MOCK_FOCUS_AREAS = [
  "Integrated SRH services",
  "Family Planning Commodities",
  "Maternal Health Systems",
  "GBV Response Protocols",
  "Demographic Dividend Policies",
  "Humanitarian Preparedness"
];

export default function SPAlignmentSection() {
  const { profile } = useUser();
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['GHA']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [report, setReport] = useState<AlignmentItem[] | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const toggleCountry = (id: string) => {
    setSelectedCountries(prev => 
      id === 'REG' 
        ? ['REG'] 
        : prev.includes(id) 
          ? prev.filter(c => c !== id && c !== 'REG') 
          : [...prev.filter(c => c !== 'REG'), id]
    );
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate Gemini API analysis based on multiple countries
    setTimeout(async () => {
      setReport([
        {
          id: '1',
          focusArea: 'Integrated SRH services',
          status: 'aligned',
          score: 92 - (selectedCountries.length * 2),
          level: 'Programme',
          description: `Strategic alignment confirmed for ${selectedCountries.length} jurisdictions. Implementation plan incorporates rights-based SRH frameworks.`
        },
        {
          id: '2',
          focusArea: 'Family Planning Commodities',
          status: 'partial',
          score: 65 + (selectedCountries.length),
          level: 'Operational',
          description: 'Supply chain last-mile distribution timelines lag behind SP 2026 targets in specific hubs.',
          correction: 'Accelerate digital eLMIS deployment and consolidate regional hubs.'
        },
        {
          id: '3',
          focusArea: 'GBV Response Protocols',
          status: 'misaligned',
          score: 40 - (selectedCountries.length),
          level: 'QA',
          description: 'Reporting systems show gaps in PWD-disaggregated data across selected countries.',
          correction: 'Implement disability-inclusive module in G-IMS reporting immediately.'
        },
        {
          id: '4',
          focusArea: 'Maternal Health Systems',
          status: 'aligned',
          score: 88,
          level: 'Programme',
          description: 'Midwifery scaling roadmaps show high degree of synchronization with regional standards.'
        }
      ]);

      if (profile) {
        await userService.logActivity(
          profile.uid,
          profile.displayName,
          'Data Upload: Strategy Alignment Audit',
          { fileCount: files.length, countries: selectedCountries }
        );
      }

      setIsAnalyzing(false);
      setShowCorrection(false);
    }, 2000);
  };

  const avgAlignment = useMemo(() => {
    if (!report) return 0;
    return report.reduce((acc, curr) => acc + curr.score, 0) / report.length;
  }, [report]);

  return (
    <div className="min-h-screen bg-main-bg p-6 md:p-8 space-y-8 overflow-y-auto pb-24">
      {/* Header — Quantum blue hero with radar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-quantum-blue via-quantum-blue-dark to-quantum-blue-darker p-6 md:p-8 shadow-[0_22px_55px_-24px_rgba(14,60,102,0.6)] mb-4">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)', backgroundSize: '38px 38px' }} />
        <HeroGeoMotif className="pointer-events-none absolute -top-28 -right-14 w-[420px] h-[420px] opacity-45 hidden md:block" />
        <div className="absolute -bottom-24 -left-10 w-64 h-64 rounded-full bg-unfpa-orange/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/15 border border-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-white/75 uppercase tracking-[0.18em] mb-1">Strategic Plan 2026–2029 Audit</p>
              <h2 className="text-[26px] font-bold tracking-tight text-white leading-tight">SP Alignment Monitor</h2>
              <p className="text-sm text-white/80 mt-1 font-medium">Implementation alignment scoring across programme, QA, and operational levels.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group/selector">
            <div className="flex items-center gap-2 bg-white border-2 border-slate-200 px-6 py-4 rounded-2xl shadow-sm min-w-[240px] cursor-pointer hover:border-unfpa-blue transition-all">
               <Filter className="w-3.5 h-3.5 text-slate-400" />
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Select Scope</span>
                  <div className="flex flex-wrap gap-1 max-w-[300px]">
                     {selectedCountries.length === 0 ? (
                        <span className="text-[10px] font-bold text-slate-300 uppercase">Select Countries</span>
                     ) : (
                        selectedCountries.slice(0, 2).map(c => (
                           <span key={c} className="text-unfpa-blue text-[10px] font-black uppercase">{c === 'REG' ? 'Region' : c}</span>
                        ))
                     )}
                     {selectedCountries.length > 2 && (
                        <span className="text-[10px] font-black text-slate-400">+{selectedCountries.length - 2}</span>
                     )}
                  </div>
               </div>
               <Search className="w-4 h-4 text-slate-300 ml-auto" />
            </div>
            
            <div className="absolute top-full right-0 mt-2 w-[350px] max-h-[400px] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 grid grid-cols-2 gap-2 opacity-0 group-hover/selector:opacity-100 pointer-events-none group-hover/selector:pointer-events-auto transition-all duration-200">
              <button
                onClick={() => toggleCountry('REG')}
                className={cn(
                  "col-span-2 p-3 rounded-xl text-left transition-all mb-2 flex items-center justify-between",
                  selectedCountries.includes('REG') ? "bg-unfpa-blue text-white shadow-lg shadow-unfpa-blue/20 escala-105" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">WCA Regional Aggregate</span>
                {selectedCountries.includes('REG') && <CheckCircle2 className="w-4 h-4" />}
              </button>
              {WCA_COUNTRIES.map(country => (
                 <button
                   key={country.id}
                   onClick={() => toggleCountry(country.id)}
                   className={cn(
                     "flex items-center justify-between p-3 rounded-xl text-left transition-all",
                     selectedCountries.includes(country.id) ? "bg-unfpa-blue text-white shadow-md shadow-unfpa-blue/20" : "hover:bg-slate-50 text-slate-600 border border-transparent hover:border-slate-100"
                   )}
                 >
                   <span className="text-[10px] font-bold uppercase">{country.name}</span>
                   {selectedCountries.includes(country.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
                 </button>
              ))}
            </div>
          </div>

          <div className="h-10 w-px bg-slate-200 mx-2 hidden md:block" />
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
             <button 
                onClick={() => setShowCorrection(false)}
                className={cn(
                   "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                   !showCorrection ? "bg-unfpa-blue text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                )}
             >
                Evidence Audit
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
          <button 
            onClick={runAnalysis}
            disabled={files.length === 0 || isAnalyzing}
            className={cn(
              "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50 disabled:grayscale ml-2",
              isAnalyzing ? "bg-white/30 text-white/70" : "bg-white text-quantum-blue shadow-black/10"
            )}
          >
            {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
            {isAnalyzing ? 'Analyzing Alignment...' : 'Generate Alignment Report'}
          </button>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Column */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 translate-x-4">
              <Upload className="w-32 h-32" />
            </div>
            
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 font-sans">Execution Evidence</h3>
            <div 
              className="border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center hover:border-unfpa-blue transition-colors relative"
            >
              <input 
                type="file" 
                multiple 
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-unfpa-blue" />
              </div>
              <p className="text-xs font-bold text-slate-600 mb-1">Drag and drop documents</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Supports PDF, XLS, DOCX (Max 20MB)</p>
            </div>

            <div className="mt-8 space-y-3">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group/file">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <FileText className="w-4 h-4 text-unfpa-blue" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 truncate max-w-[150px]">{f.name}</span>
                  </div>
                  <button 
                    onClick={() => setFiles(files.filter((_, idx) => i !== idx))}
                    className="text-slate-300 hover:text-rose-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {files.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 grayscale">
                  <Info className="w-6 h-6 mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest">No evidence uploaded</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150">
              <ShieldCheck className="w-full h-full" />
            </div>
            <div className="relative z-10">
              <h4 className="text-[10px] font-black text-unfpa-blue uppercase tracking-widest mb-4">Strategic Correction AI</h4>
              <p className="text-lg font-bold leading-snug mb-8 font-serif italic text-white/90">
                "Our alignment model identifies structural gaps in CPD delivery and suggests corrective actions based on the 2026 results framework."
              </p>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                 <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Selected Scope Insight</p>
                 <p className="text-xs font-medium text-white/70 leading-relaxed">
                   Analysis of {selectedCountries.length} jurisdictions indicates a potential variance in IRRF outcome reporting standards.
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {!report ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 h-[600px] flex flex-col items-center justify-center text-center p-12"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8 relative">
                   <div className="absolute inset-0 bg-unfpa-blue/5 rounded-full scale-150 blur-2xl animate-pulse" />
                   <FileSearch className="w-10 h-10 text-slate-300 relative z-10" />
                </div>
                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-4 leading-none font-sans">Ready for Alignment Audit</h4>
                <p className="text-sm text-slate-500 max-w-sm mb-10 leading-relaxed font-medium">
                  Upload implementation documents for {selectedCountries.length} countries to generate a multi-dimensional strategy alignment and course correction report.
                </p>
              </motion.div>
            ) : showCorrection ? (
              <motion.div
                key="correction"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-rose-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-rose-200 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10">
                      <AlertCircle className="w-32 h-32" />
                   </div>
                   <div className="relative z-10">
                     <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-4">Strategic Course Correction Matrix</h3>
                     <h4 className="text-4xl font-black uppercase tracking-tighter mb-4 leading-none">Critical Alignment <br/> Flags Detected</h4>
                     <p className="text-white/80 font-medium text-sm leading-relaxed max-w-xl">
                        Based on the uploaded evidence for {selectedCountries.join(', ')}, we have identified {report.filter(i => i.status !== 'aligned').length} areas requiring immediate management attention to stay on the 2029 trajectory.
                     </p>
                   </div>
                </div>

                <div className="space-y-4">
                  {report.filter(i => i.status !== 'aligned').map((item, idx) => (
                    <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-rose-100 shadow-sm hover:border-rose-300 transition-all">
                       <div className="flex items-start justify-between gap-6">
                          <div className="flex-1">
                             <div className="flex items-center gap-3 mb-4">
                                <span className={cn(
                                  "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest",
                                  item.status === 'misaligned' ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                                )}>
                                  {item.status.toUpperCase()}
                                </span>
                                <div className="flex items-center gap-2 text-rose-600">
                                   <ShieldCheck className="w-3.5 h-3.5" />
                                   <span className="text-[9px] font-black uppercase tracking-widest">Correction Flag #{idx + 1}</span>
                                </div>
                             </div>
                             <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2 leading-none font-sans">{item.focusArea}</h4>
                             <p className="text-xs font-bold text-slate-500 mb-8 leading-relaxed italic border-l-2 border-slate-200 pl-4">"Evaluation: {item.description}"</p>
                             
                             <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
                                <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                   <RefreshCw className="w-3.5 h-3.5" /> Recommended Strategic Switch
                                </h5>
                                <p className="text-sm font-black text-rose-900 leading-tight">
                                   {item.correction || "Operational review required to identify specific local bottlenecks."}
                                </p>
                             </div>
                          </div>
                          
                          <div className="text-right shrink-0">
                             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Impact Risk</div>
                             <p className="text-4xl font-black text-rose-600 tracking-tighter leading-none">{100 - item.score}%</p>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="audit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Score Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Alignment Score</span>
                      </div>
                      <div className="mt-8 flex items-baseline gap-2">
                        <span className="text-6xl font-black text-slate-900 tracking-tighter leading-none">{avgAlignment.toFixed(0)}</span>
                        <span className="text-2xl font-black text-slate-300">%</span>
                      </div>
                      <div className="mt-6 h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${avgAlignment}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                   </div>

                   <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-rose-200 transition-all">
                      <div className="flex items-center gap-3 text-rose-600">
                        <div className="p-2.5 bg-rose-50 rounded-xl group-hover:scale-110 transition-transform">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Misalignment Score</span>
                      </div>
                      <div className="mt-8 flex items-baseline gap-2">
                        <span className="text-6xl font-black text-rose-600 tracking-tighter leading-none">{100 - Math.round(avgAlignment)}</span>
                        <span className="text-2xl font-black text-slate-300">%</span>
                      </div>
                      <button 
                        onClick={() => setShowCorrection(true)}
                        className="mt-6 flex items-center gap-2 group/btn"
                      >
                         <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                         <span className="text-[10px] font-black text-slate-500 uppercase group-hover/btn:text-rose-600 transition-colors">Course correction recommended</span>
                         <ArrowRight className="w-3 h-3 text-slate-300 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                   </div>
                </div>

                {/* Focus Area Details */}
                <div className="space-y-4">
                  {report.map((item, i) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all relative group"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <span className={cn(
                              "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm",
                              item.status === 'aligned' ? "bg-emerald-500 text-white" : 
                              item.status === 'partial' ? "bg-amber-500 text-white" : "bg-rose-600 text-white"
                            )}>
                              {item.status.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 px-3 py-1.5 rounded-xl">
                              Level: {item.level}
                            </span>
                          </div>
                          <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-900 group-hover:text-unfpa-blue transition-colors mb-3 leading-none font-sans">
                            {item.focusArea}
                          </h4>
                          <p className="text-sm font-medium text-slate-600 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Focus Score</div>
                           <p className={cn(
                             "text-4xl font-black tracking-tighter leading-none shadow-text",
                             item.score >= 80 ? "text-emerald-500" : item.score >= 60 ? "text-amber-500" : "text-rose-500"
                           )}>
                             {item.score}%
                           </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

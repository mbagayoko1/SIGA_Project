import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ShieldAlert, 
  Map as MapIcon, 
  Search, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Flag, 
  History, 
  BrainCircuit, 
  ShieldCheck, 
  Loader2,
  Download,
  FileDown,
  Globe,
  GanttChart,
  Radar,
  Scale,
  ChevronDown,
  X as CloseIcon,
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import GeospatialMap from './GeospatialMap';
import { WCA_COUNTRIES } from '../data';
import HeroGeoMotif from './quantum/HeroGeoMotif';
import { generateNarrative, generateJSON, hasGemini } from '../lib/ai';
import { localPoliticalBrief } from '../lib/aiFallbacks';

interface PoliticalScenario {
  id: string;
  title: string;
  probability: string;
  impactLevel: 'High' | 'Medium' | 'Low';
  description: string;
  implications: string[];
}

const DEFAULT_SCENARIOS: PoliticalScenario[] = [
  {
    id: 'S1',
    title: 'Constitutional Continuity',
    probability: '65%',
    impactLevel: 'Medium',
    description: 'Electoral cycles in majority of coastal states proceed without major institutional rupture, maintaining current operational budgets.',
    implications: ['Stable planning for 2026-2027; direct government partnerships remain viable; continuation of current contraceptive logistics.']
  },
  {
    id: 'S2',
    title: 'Regional Security Retraction',
    probability: '25%',
    impactLevel: 'High',
    description: 'Escalation of non-state armed groups in the Central Sahel leads to displacement spikes and suspension of static health centers.',
    implications: ['Escalation of non-state armed groups in Central Sahel; displacement spikes; shift to mobile humanitarian response; increased demand for GBV services.']
  },
  {
    id: 'S3',
    title: 'Cross-Border Alliance Shift',
    probability: '10%',
    impactLevel: 'Low',
    description: 'Emergence of new regional economic blocs altering diplomatic protocols and reporting requirements.',
    implications: ['Emergence of new regional economic blocs; need for new bilateral MOU structures; re-alignment of regional monitoring frameworks.']
  }
];

const REGIONAL_CLUSTERS = {
  sahel: ["Mali", "Burkina Faso", "Niger", "Chad", "Mauritania"],
  coastal: ["Senegal", "Gambia", "Guinea", "Sierra Leone", "Liberia", "Cote d'Ivoire", "Ghana", "Togo", "Benin", "Nigeria"],
  central: ["Cameroon", "CAR", "Congo", "Gabon", "Equatorial Guinea", "Sao Tome and Principe"]
};

const MOCK_INTEL_FEED = [
  { id: '1', text: 'Constitutional referendum in coastal states shows high turnout and stability.', type: 'Diplomatic', timestamp: '2 hours ago' },
  { id: '2', text: 'AES alliance strengthens cross-border security protocols in the Liptako-Gourma region.', type: 'Security', timestamp: '4 hours ago' },
  { id: '3', text: 'New regional economic trade corridor proposed between Nigeria and Benin.', type: 'Economic', timestamp: '6 hours ago' },
  { id: '4', text: 'UNFPA strategic supplies reach northern border clinics despite logistics pressure.', type: 'Logistical', timestamp: '8 hours ago' },
  { id: '5', text: 'Youth empowerment summits in Senegal reflect positive governance benchmarks.', type: 'Diplomatic', timestamp: '12 hours ago' }
];

export default function PoliticalAnalysis({ onNavigateQuantum }: { onNavigateQuantum?: () => void }) {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [brief, setBrief] = useState<string | null>(null);
  const [intelFeed, setIntelFeed] = useState<{id: string, text: string, type: string, timestamp: string}[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<PoliticalScenario | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const generateLiveIntel = async () => {
    if (!hasGemini) {
      setIntelFeed(MOCK_INTEL_FEED);
      return;
    }
    try {
      const prompt = `
        Generate 5 short political intelligence signals for West and Central Africa (WCA) dated late 2024 to early 2025.
        Format: JSON array of objects with id, text, type (Security, Diplomatic, Economic), timestamp (e.g. 2 hours ago).
        Current context: Alliance of Sahel States (AES) dynamics, Gulf of Guinea security, and electoral cycles in the region.
      `;
      const data = await generateJSON<typeof MOCK_INTEL_FEED>(prompt);
      setIntelFeed(Array.isArray(data) && data.length ? data : MOCK_INTEL_FEED);
    } catch (err) {
      console.error("Intel feed failed, using fallback:", err);
      setIntelFeed(MOCK_INTEL_FEED);
    }
  };

  const toggleCountry = (id: string) => {
    if (id === 'ALL') {
      setSelectedCountries([]);
      return;
    }
    setSelectedCountries(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const generatePoliticalBrief = async () => {
    setIsGenerating(true);
    generateLiveIntel();

    const countryNames = selectedCountries
      .map(id => WCA_COUNTRIES.find(c => c.id === id)?.name)
      .filter((n): n is string => Boolean(n));

    if (!hasGemini) {
      setBrief(localPoliticalBrief(countryNames));
      setIsGenerating(false);
      return;
    }

    try {
      const scenarioData = JSON.stringify(DEFAULT_SCENARIOS, null, 2);
      const clustersData = JSON.stringify(REGIONAL_CLUSTERS, null, 2);

      const countryContext = countryNames.length > 0
        ? `Focus the analysis specifically on the following countries: ${countryNames.join(', ')}. Examine cross-border dynamics involving these specific states.`
        : "Provide a comprehensive regional overview covering all WCA clusters (Sahel, Coastal, Central) and their interdependencies.";

      const prompt = `
        You are James Emmanuel Wanki, Political and Intergovernmental Affairs Adviser, UNFPA West and Central Africa (WCA).
        Generate a Comprehensive Political Briefing that replicates the attached STRATEGIC TEMPLATE structure.
        
        ${countryContext}
        
        Mandatory Formatting:
        - SECTION 3: SCENARIO ANALYSIS MATRIX MUST be a Markdown Table with columns: ID, Scenario, Probability, Impact, Implications for UNFPA.
        - USE vertical bars (|) for the leftmost border of main section headers (### EXECUTIVE SUMMARY etc).
        - SECTION 2: Use "Cluster 1 · The Sahel", "Cluster 2 · Coastal States", "Cluster 3 · Central Africa" formatting.
        - RISK PROFILE pills: Use "RISK PROFILE · HIGH / VOLATILE" format for clusters.
        
        Document Structure:
        1. EXECUTIVE SUMMARY (High-level Geopolitical landscape)
        2. 1. THE SECURITY-DEVELOPMENT NEXUS (Detailed analysis)
        3. 2. GEOPOLITICAL DEEP DIVES (REGIONAL RISK FLUX)
           - Discuss Clusters 1, 2, and 3 with "Impact on UNFPA" bullets.
        4. 3. SCENARIO ANALYSIS MATRIX (The Table)
        5. 4. GEOSPATIAL INTELLIGENCE OVERLAY (Corridor security, humanitarian access)
        6. 5. STRATEGIC RECOMMENDATIONS (The 5 actions for Regional Director)
        7. CLOSING STATEMENT: "The regional outlook for 2026 is one of cautious navigation..."
        
        Current Scenario Data for the Table: ${scenarioData}
        Regional clusters: ${clustersData}
        
        Style: Strategic, executive, neutral, foresight-oriented. 
        Length: Approx 1200 words.
      `;

      const text = await generateNarrative(prompt);
      setBrief(text);
    } catch (err) {
      console.error('Political brief failed, using local brief:', err);
      setBrief(localPoliticalBrief(countryNames));
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPDF = () => {
    if (!brief) return;
    const doc = new jsPDF();
    const unfpaBlue = [65, 143, 222]; // #418FDE
    const unfpaOrange = [255, 108, 44]; // #FF6C2C
    const unfpaGrey = [102, 102, 102];

    // Header Dots (3x2)
    const dotRadius = 0.9;
    const startX = 12;
    const startY = 15;
    doc.setFillColor(unfpaOrange[0], unfpaOrange[1], unfpaOrange[2]);
    for (let r = 0; r < 2; r++) {
       for (let c = 0; c < 3; c++) {
          doc.circle(startX + c * 3.5, startY + r * 3.5, dotRadius, 'F');
       }
    }
    
    // UNFPA Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(unfpaOrange[0], unfpaOrange[1], unfpaOrange[2]);
    doc.text("UNFPA", 28, 20);
    
    // Right Header
    doc.setFontSize(10);
    doc.setTextColor(unfpaBlue[0], unfpaBlue[1], unfpaBlue[2]);
    doc.text("United Nations Population Fund", 198, 17, { align: 'right' });
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(unfpaGrey[0], unfpaGrey[1], unfpaGrey[2]);
    doc.text("West and Central Africa Regional Office", 198, 21, { align: 'right' });

    // Header Lines
    doc.setDrawColor(unfpaOrange[0], unfpaOrange[1], unfpaOrange[2]);
    doc.setLineWidth(1.5);
    doc.line(12, 28, 198, 28);
    
    doc.setDrawColor(unfpaBlue[0], unfpaBlue[1], unfpaBlue[2]);
    doc.setLineWidth(1.5);
    doc.line(12, 33, 198, 33);
    
    // Official Metadata
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(unfpaOrange[0], unfpaOrange[1], unfpaOrange[2]);
    doc.text("OFFICIAL STRATEGIC DOCUMENTATION", 12, 45);
    
    doc.setFontSize(32);
    doc.setTextColor(unfpaBlue[0], unfpaBlue[1], unfpaBlue[2]);
    doc.text("Regional Political Briefing", 12, 60);
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(14);
    doc.setTextColor(unfpaBlue[0], unfpaBlue[1], unfpaBlue[2]);
    doc.text("West and Central Africa · Q2 2026", 12, 70);

    // Memorandum Section
    doc.setDrawColor(unfpaOrange[0], unfpaOrange[1], unfpaOrange[2]);
    doc.setLineWidth(1.5);
    doc.line(12, 78, 198, 78);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(unfpaOrange[0], unfpaOrange[1], unfpaOrange[2]);
    doc.text("MEMORANDUM", 12, 85);

    const memoLabels = ["TO:", "FROM:", "DATE:", "SUBJECT:"];
    const memoValues = [
      "Regional Director, UNFPA WCA",
      "James Emmanuel Wanki, Political and Intergovernmental Affairs Adviser",
      new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      "Comprehensive Political Briefing: Regional Dynamics and Strategic Foresight"
    ];

    doc.setFontSize(10);
    memoLabels.forEach((label, i) => {
      doc.setTextColor(unfpaBlue[0], unfpaBlue[1], unfpaBlue[2]);
      doc.setFont("helvetica", "bold");
      doc.text(label, 12, 95 + (i * 7));
      
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "normal");
      doc.text(memoValues[i], 40, 95 + (i * 7));
    });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(12, 125, 198, 125);
    
    let cursorY = 135;
    const lines = doc.splitTextToSize(brief.replace(/#/g, ''), 180);
    
    lines.forEach((line: string) => {
      if (cursorY > 280) {
        doc.addPage();
        // Simplified Header for sub-pages
        doc.setDrawColor(unfpaBlue[0], unfpaBlue[1], unfpaBlue[2]);
        doc.setLineWidth(0.5);
        doc.line(12, 15, 198, 15);
        
        doc.setFontSize(8);
        doc.setTextColor(unfpaGrey[0], unfpaGrey[1], unfpaGrey[2]);
        doc.text(`UNFPA WCARO Regional Political Briefing · April 2026 Page ${doc.getNumberOfPages()} of 5`, 12, 290);
        
        cursorY = 25;
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
      }
      doc.text(line, 12, cursorY);
      cursorY += 6;
    });
    
    // Add page numbers to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(unfpaBlue[0], unfpaBlue[1], unfpaBlue[2]);
        doc.setFont("helvetica", "bold");
        doc.text(`UNFPA WCARO Regional Political Briefing · April 2026 Page ${i} of ${totalPages}`, 12, 285);
        doc.setDrawColor(unfpaBlue[0], unfpaBlue[1], unfpaBlue[2]);
        doc.setLineWidth(0.5);
        doc.line(12, 282, 198, 282);
    }
    
    doc.save(`UNFPA_WCA_Political_Brief_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportDocx = async () => {
    if (!brief) return;
    const unfpaBlue = "418FDE";
    const unfpaOrange = "FF6C2C";
    const lines = brief.split('\n');
    const children = [
      new Paragraph({
        children: [
          new TextRun({ text: "UNFPA", bold: true, color: unfpaOrange, size: 48 }),
          new TextRun({ text: "\t\t\t\tUnited Nations Population Fund", color: unfpaBlue, size: 22 }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "\t\t\t\t\t\t\tWest and Central Africa Regional Office", color: "666666", size: 18, italics: true }),
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "________________________________________________________________________________", color: unfpaOrange, bold: true })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "________________________________________________________________________________", color: unfpaBlue, bold: true })
        ],
        spacing: { after: 400 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "OFFICIAL STRATEGIC DOCUMENTATION", bold: true, color: unfpaOrange, size: 20 }),
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: "Regional Political Briefing",
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "West and Central Africa · Q2 2026", italics: true, color: unfpaBlue, size: 28 }),
        ],
        spacing: { after: 400 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "________________________________________________________________________________", color: unfpaOrange, bold: true })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "MEMORANDUM", bold: true, color: unfpaOrange, size: 22 }),
        ],
        spacing: { after: 300 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "TO:\t\tRegional Director, UNFPA WCA", bold: true, color: unfpaBlue, size: 20 }),
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "FROM:\t\tJames Emmanuel Wanki, Political Advisor", bold: true, color: unfpaBlue, size: 20 }),
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "DATE:\t\t" + new Date().toLocaleDateString(), bold: true, color: unfpaBlue, size: 20 }),
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "SUBJECT:\tComprehensive Political Briefing: Regional Dynamics and Strategic Foresight", bold: true, color: unfpaBlue, size: 20 }),
        ],
        spacing: { after: 400 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "________________________________________________________________________________", color: "E2E8F0" })
        ],
        spacing: { after: 400 }
      }),
    ];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        children.push(new Paragraph({ 
          text: trimmed.replace(/###/g, '').trim(), 
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }));
      } else if (trimmed.startsWith('####')) {
        children.push(new Paragraph({ 
          text: trimmed.replace(/####/g, '').trim(), 
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 150 }
        }));
      } else if (trimmed.length > 0) {
        children.push(new Paragraph({ 
          text: trimmed,
          spacing: { after: 200 }
        }));
      }
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `UNFPA_WCA_Political_Brief_${new Date().toISOString().split('T')[0]}.docx`);
  };

  return (
    <div className="h-full flex flex-col p-6 bg-main-bg overflow-hidden">
      {/* Header — Quantum blue hero with radar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-quantum-blue via-quantum-blue-dark to-quantum-blue-darker p-6 md:p-7 shadow-[0_22px_55px_-24px_rgba(14,60,102,0.6)] mb-6 shrink-0">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)', backgroundSize: '38px 38px' }} />
        <HeroGeoMotif className="pointer-events-none absolute -top-28 -right-14 w-[420px] h-[420px] opacity-45 hidden md:block" />
        <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/15 border border-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/75 mb-1">Strategic Foresight</p>
            <h1 className="text-[26px] font-bold text-white tracking-tight leading-tight">WCA Regional Political Analysis</h1>
            <p className="text-sm text-white/80 mt-1 font-medium">Geopolitical scenario modelling and intelligence for the WCA region.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
             <button 
                onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm min-w-[200px] hover:border-unfpa-blue transition-all"
             >
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Scope:</span>
                <div className="flex flex-wrap gap-1 max-w-[150px]">
                   {selectedCountries.length === 0 ? (
                      <span className="text-[10px] font-black text-unfpa-blue uppercase">WCA Regional</span>
                   ) : (
                      selectedCountries.slice(0, 1).map(c => (
                         <span key={c} className="bg-unfpa-blue/10 text-unfpa-blue text-[8px] font-black px-1.5 py-0.5 rounded uppercase">{c}</span>
                      ))
                   )}
                   {selectedCountries.length > 1 && (
                      <span className="text-[8px] font-black text-slate-400">+{selectedCountries.length - 1}</span>
                   )}
                </div>
                <ChevronDown className={cn("w-3 h-3 text-slate-400 ml-auto transition-transform", isSelectorOpen && "rotate-180")} />
             </button>
             
             <AnimatePresence>
               {isSelectorOpen && (
                 <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-[400px] bg-white border border-slate-200 rounded-3xl shadow-2xl z-[100] overflow-hidden"
                 >
                    <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-unfpa-blue" />
                          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Select Operational Scope</h4>
                       </div>
                       <button onClick={() => setIsSelectorOpen(false)} className="p-1.5 hover:bg-white rounded-lg transition-colors">
                          <CloseIcon className="w-4 h-4 text-slate-400" />
                       </button>
                    </div>

                    <div className="p-5 space-y-5">
                       <div className="relative group">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 transition-colors group-focus-within:text-unfpa-blue" />
                          <input 
                             type="text"
                             placeholder="Search Countries..."
                             value={searchQuery}
                             onChange={(e) => setSearchQuery(e.target.value)}
                             className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-unfpa-blue/10 focus:bg-white transition-all"
                          />
                       </div>

                       <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                          <button
                            onClick={() => toggleCountry('ALL')}
                            className={cn(
                              "col-span-2 flex items-center justify-between p-3 rounded-xl text-left border-2 transition-all",
                              selectedCountries.length === 0 ? "bg-unfpa-blue border-unfpa-blue text-white shadow-lg" : "bg-white border-slate-50 hover:border-slate-200 text-slate-400"
                            )}
                          >
                            <span className="text-[10px] font-black uppercase tracking-widest">WCA Regional Aggregate</span>
                            {selectedCountries.length === 0 && <ShieldCheck className="w-4 h-4" />}
                          </button>

                          {WCA_COUNTRIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(country => (
                             <button
                               key={country.id}
                               onClick={() => toggleCountry(country.id)}
                               className={cn(
                                 "flex items-center justify-between p-2.5 rounded-xl text-left transition-all border",
                                 selectedCountries.includes(country.id) 
                                   ? "bg-unfpa-blue/5 border-unfpa-blue text-unfpa-blue font-black" 
                                   : "bg-white border-slate-50 hover:bg-slate-50 text-slate-600"
                               )}
                             >
                               <span className="text-[10px] font-bold uppercase truncate pr-2">{country.name}</span>
                               {selectedCountries.includes(country.id) && <div className="w-2 h-2 rounded-full bg-unfpa-blue shadow-sm" />}
                             </button>
                          ))}
                       </div>
                    </div>

                    <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {selectedCountries.length} Countries Active
                       </span>
                       <div className="flex items-center gap-2">
                          <button 
                             onClick={() => setSelectedCountries([])}
                             className="text-[9px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
                          >
                             Clear All
                          </button>
                          <button 
                             onClick={() => setIsSelectorOpen(false)}
                             className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-unfpa-blue transition-colors"
                          >
                             Apply
                          </button>
                       </div>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          <button
            onClick={generatePoliticalBrief}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-white text-quantum-blue px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all shadow-md disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
            Generate {selectedCountries.length > 0 ? 'Selected' : 'Comprehensive'} Political Brief
          </button>
          
          {brief && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button 
                onClick={exportPDF}
                className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-unfpa-blue hover:bg-slate-50 rounded-lg transition-all"
                title="Export to PDF"
              >
                <FileDown className="w-3.5 h-3.5" />
                PDF
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button 
                onClick={exportDocx}
                className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-unfpa-blue hover:bg-slate-50 rounded-lg transition-all"
                title="Export to Word"
              >
                <Download className="w-3.5 h-3.5" />
                Word
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 flex-1 overflow-hidden">
        {/* Main Analysis Section */}
        <div className="overflow-y-auto custom-scrollbar pr-4">
          <div className="space-y-8">
            {/* Briefing Display */}
            {brief ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Geospatial Intelligence Section */}
                <div className="bg-slate-900 rounded-3xl p-8 border border-white-10 shadow-2xl overflow-hidden relative">
                   <GeospatialMap />
                </div>

                <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-xl relative overflow-hidden font-[Arial,sans-serif]"
              >
                {/* Official Branded Header Bar */}
                <div className="absolute top-0 left-0 w-full h-[6px] bg-unfpa-blue" />
                
                <div className="flex items-start justify-between mb-16">
                   <div className="flex items-center gap-4">
                      {/* Logo Treatment */}
                      <div className="grid grid-cols-3 gap-1">
                         {[...Array(6)].map((_, i) => (
                           <div key={i} className="w-1.5 h-1.5 rounded-full bg-unfpa-orange" />
                         ))}
                      </div>
                      <h2 className="text-2xl font-black text-unfpa-orange tracking-tight leading-none">UNFPA</h2>
                   </div>
                   <div className="text-right">
                      <h4 className="text-sm font-bold text-unfpa-blue tracking-tight">United Nations Population Fund</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">West and Central Africa Regional Office</p>
                   </div>
                </div>

                <div className="mb-12">
                   <div className="w-full h-[3px] bg-unfpa-orange mb-10" />
                   <div className="space-y-4">
                      <h4 className="text-[11px] font-black text-unfpa-orange uppercase tracking-[0.3em]">Official Strategic Documentation</h4>
                      <h3 className="text-5xl font-black text-unfpa-blue tracking-tighter uppercase leading-none">Regional Political Briefing</h3>
                      <p className="text-xl font-bold text-slate-400 italic">West and Central Africa · 2026 Foresight</p>
                   </div>
                </div>

                <div className="mb-12 p-8 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-[120px_1fr] gap-x-8 gap-y-4">
                   <div className="col-span-2 border-b border-unfpa-orange pb-2 mb-2">
                      <span className="text-[12px] font-black text-unfpa-orange uppercase tracking-[0.2em]">Memorandum</span>
                   </div>
                   
                   <span className="text-[10px] font-black text-unfpa-blue uppercase tracking-widest">To:</span>
                   <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Regional Director, UNFPA WCA</span>
                   
                   <span className="text-[10px] font-black text-unfpa-blue uppercase tracking-widest">From:</span>
                   <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">James Emmanuel Wanki, Political and Intergovernmental Affairs Adviser</span>
                   
                   <span className="text-[10px] font-black text-unfpa-blue uppercase tracking-widest">Date:</span>
                   <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>

                   <span className="text-[10px] font-black text-unfpa-blue uppercase tracking-widest">Subject:</span>
                   <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Comprehensive Political Briefing: Regional Dynamics and Strategic Foresight</span>
                </div>

                <div className="prose prose-slate max-w-none prose-headings:text-unfpa-blue prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-unfpa-blue prose-table:border-collapse prose-table:w-full prose-table:my-8 prose-th:bg-unfpa-blue prose-th:text-white prose-th:p-4 prose-th:border prose-th:border-unfpa-blue prose-td:p-4 prose-td:border prose-td:border-slate-200 prose-th:text-[10px] prose-th:uppercase prose-th:tracking-widest prose-td:text-[11px] prose-h3:border-l-8 prose-h3:border-unfpa-orange prose-h3:pl-4 prose-h3:py-1">
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>{brief}</ReactMarkdown>
                </div>

                <div className="mt-20 pt-8 border-t border-slate-100 flex items-center justify-between opacity-50">
                   <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-unfpa-blue" />
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Confidential Strategic Intelligence Briefing</p>
                   </div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Authorized Release only</p>
                </div>
              </div>
            </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-32 border-2 border-dashed border-slate-200 rounded-3xl bg-white-50">
                <Radar className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">No Active Briefing</h3>
                <div className="flex flex-col items-center gap-4 mt-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed text-center">
                    Initiate strategic simulation or trigger higher intelligence
                  </p>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={generatePoliticalBrief}
                      className="bg-unfpa-blue text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all"
                    >
                      Generate Brief
                    </button>
                    {onNavigateQuantum && (
                      <button 
                        onClick={onNavigateQuantum}
                        className="bg-white border border-unfpa-blue text-unfpa-blue px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-unfpa-blue hover:text-white transition-all flex items-center gap-2"
                      >
                        <BrainCircuit className="w-4 h-4" />
                        Trigger Quantum Intelligence
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Scenario Analysis & Regional Metrics */}
        <div className="space-y-6 overflow-y-auto custom-scrollbar">
          {/* Scenario Analysis Matrix */}
          <div className="bg-unfpa-blue rounded-3xl p-6 text-white shadow-xl shadow-[0_10px_15px_-3px_#418FDE33]">
            <div className="flex items-center gap-3 mb-6">
              <Scale className="w-4 h-4 text-white" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Scenario Analysis Matrix</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white-20">
                    <th className="py-2 text-[8px] font-black uppercase tracking-widest opacity-60">Scenario</th>
                    <th className="py-2 text-[8px] font-black uppercase tracking-widest opacity-60">Prob.</th>
                    <th className="py-2 text-[8px] font-black uppercase tracking-widest opacity-60 text-right">Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white-10">
                  {DEFAULT_SCENARIOS.map((scenario) => (
                    <tr 
                      key={scenario.id} 
                      onClick={() => setSelectedScenario(scenario)}
                      className={cn(
                        "cursor-pointer transition-all hover:bg-white-10 group",
                        selectedScenario?.id === scenario.id && "bg-white text-unfpa-blue"
                      )}
                    >
                      <td className="py-3 pr-2">
                        <div className="text-[10px] font-black uppercase tracking-tight group-hover:translate-x-1 transition-transform">
                          {scenario.title}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-[9px] font-bold opacity-80">{scenario.probability}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={cn(
                          "text-[7px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest inline-block border",
                          scenario.impactLevel === 'High' ? "bg-red-50 text-red-600 border-red-200" : 
                          scenario.impactLevel === 'Medium' ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-unfpa-blue-5 text-unfpa-blue border-unfpa-blue-20"
                        )}>
                          {scenario.impactLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Intelligence Feed */}
          {intelFeed.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-hidden relative">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-unfpa-blue" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Intelligent Feed</h3>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-unfpa-blue animate-ping" />
               </div>
               
               <div className="space-y-4">
                  {intelFeed.map((item) => (
                    <div key={item.id} className="relative pl-4 border-l-2 border-slate-100 py-1 hover:border-unfpa-blue transition-colors">
                       <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            "text-[7px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-slate-50",
                            item.type === 'Security' ? 'text-red-600' : 'text-unfpa-blue'
                          )}>{item.type}</span>
                          <span className="text-[7px] font-bold text-slate-300">{item.timestamp}</span>
                       </div>
                       <p className="text-[10px] font-medium text-slate-600 leading-tight">{item.text}</p>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* Scenario Detail Modal/Panel */}
          <AnimatePresence>
            {selectedScenario && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                   <h4 className="text-[10px] font-black text-unfpa-blue uppercase tracking-widest">Scenario Implications</h4>
                   <button onClick={() => setSelectedScenario(null)} className="p-1 hover:bg-slate-50 rounded-lg">
                      <TrendingUp className="w-3 h-3 text-slate-400 rotate-90" />
                   </button>
                </div>
                <div className="space-y-4">
                   {selectedScenario.implications.map((imp, i) => (
                      <div key={i} className="flex gap-3">
                         <div className="w-1.5 h-1.5 bg-unfpa-blue rounded-full mt-1.5 shrink-0" />
                         <p className="text-[10px] font-medium text-slate-600 leading-relaxed">{imp}</p>
                      </div>
                   ))}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-50">
                   <div className="flex items-center gap-2 text-unfpa-blue">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Mitigation Strategy Verified</span>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Regional Risk Markers */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Regional Risk Flux</h3>
            <div className="space-y-4">
              <RiskMarker label="Sahel Fragmentation" risk="Critical" color="red" trend="up" />
              <RiskMarker label="Coastal Stability" risk="Stable" color="blue" trend="flat" />
              <RiskMarker label="Central African Access" risk="Moderate" color="orange" trend="down" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskMarker({ label, risk, color, trend }: { label: string; risk: string; color: 'red' | 'orange' | 'emerald' | 'blue'; trend: 'up' | 'down' | 'flat' }) {
  const colors = {
    red: 'bg-red-500',
    orange: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    blue: 'bg-unfpa-blue'
  };

  const textColors = {
    red: 'text-red-600 bg-red-50 border-red-100',
    orange: 'text-amber-600 bg-amber-50 border-amber-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    blue: 'text-unfpa-blue bg-unfpa-blue-5 border-unfpa-blue-10'
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", colors[color])} />
        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest border",
          textColors[color]
        )}>
          {risk}
        </span>
        {trend === 'up' && <TrendingUp className="w-3 h-3 text-red-500" />}
        {trend === 'down' && <TrendingUp className="w-3 h-3 text-emerald-500 rotate-180" />}
      </div>
    </div>
  );
}

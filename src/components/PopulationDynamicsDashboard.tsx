import React, { useMemo, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, 
  ComposedChart, Line, ScatterChart, Scatter, ZAxis,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { 
  Users, TrendingUp, Globe2, Zap, ShieldAlert, 
  ArrowUpRight, Landmark, BrainCircuit, Activity, 
  UsersRound, AlertTriangle, CloudRain, BarChart3, Search, Filter,
  ChevronRight, Map as MapIcon, Sparkles, BookOpen, X,
  Baby, HeartPulse, Ship, Building2, Smartphone,
  ArrowRightLeft, FileText, LayoutDashboard,
  MapPin, ShieldCheck, Target, CheckCircle2,
  Timer, PackageCheck, Satellite, Boxes, Upload, Check, Loader2, FileUp, Download, Compass,
  Orbit, Cpu, LifeBuoy, Lock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { WCA_COUNTRIES } from '../data';
import HeroGeoMotif from './quantum/HeroGeoMotif';
import { useUser } from '../contexts/UserContext';
import { userService } from '../services/userService';
import QuantumTracker from './QuantumTracker';

// --- DATASETS ---
const DEMOGRAPHIC_RESILIENCE_FACTORS = [
  { id: 'education', name: 'Female Education', impactLevel: 'High', strengthIndex: 82, trend: '+4.2%', description: 'Universal secondary education for girls as the primary driver of demographic transition.', icon: <BookOpen />, status: 'Advancing', category: 'Human Capital', score: 82, details: ['Secondary enrollment rates hitting records in urban hubs.', 'Digital literacy programs scaled in 5 pilot regions.'] },
  { id: 'health', name: 'Health Infrastructure', impactLevel: 'Critical', strengthIndex: 65, trend: '+1.5%', description: 'Resilience of primary health systems to maintain services during climatic or security shocks.', icon: <HeartPulse />, status: 'Stable', category: 'Public Health', score: 65, details: ['Resilience nodes expanded to 45% of border zones.', 'Telemedicine pilot reduced rural maternal mortality by 12%.'] },
  { id: 'economy', name: 'Youth Employment', impactLevel: 'High', strengthIndex: 48, trend: '-2.1%', description: 'Absorption of the youth bulge into productive, high-value economic sectors.', icon: <Building2 />, status: 'Strained', category: 'Economic Sector', score: 48, details: ['Youth unemployment remains high despite GDP growth.', 'Mismatch in technical skills across Sahelian corridor.'] },
  { id: 'urban', name: 'Smart Urbanization', impactLevel: 'Medium', strengthIndex: 54, trend: '+5.8%', description: 'Managing rapid urban growth through data-driven infrastructure and services.', icon: <Smartphone />, status: 'In-Progress', category: 'Infrastructure', score: 54, details: ['Digital census mapping complete for top 12 metro hubs.', 'Smart traffic management pilot in Lagos showing 15% efficiency gain.'] }
];

const CHAPTER_TABS = [
  { id: 'overview', label: 'Executive Summary', icon: <LayoutDashboard className="w-3 h-3 text-slate-400" /> },
  { id: 'dynamics', label: 'Dynamics Hub', icon: <Zap className="w-3 h-3 text-unfpa-blue" /> },
  { id: 'quantum', label: 'Quantum Performance', icon: <Boxes className="w-3 h-3 text-unfpa-blue" /> },
  { id: 'political', label: 'Strategic Plan', icon: <ShieldAlert className="w-3 h-3 text-emerald-600" /> },
  { id: 'predictive', label: 'Predictive Modeling', icon: <Satellite className="w-3 h-3 text-rose-500" /> },
  { id: 'outcome4', label: 'Demographic Resilience', icon: <Target className="w-3 h-3 text-purple-500" /> },
  { id: 'outcome1', label: 'Outcome 1: Family Planning', icon: <Target className="w-3 h-3 text-blue-500" /> },
  { id: 'outcome2', label: 'Outcome 2: Maternal Health', icon: <Target className="w-3 h-3 text-rose-500" /> },
  { id: 'outcome3', label: 'Outcome 3: GBV & Harmful Practices', icon: <Target className="w-3 h-3 text-orange-500" /> },
  { id: 'megatrends', label: 'Strategic Megatrends', icon: <Globe2 className="w-3 h-3 text-emerald-500" /> },
];

const WCA_POLITICAL_DATA: Record<string, { status: string, stability: number, brief: string, riskLevel: 'Low' | 'Medium' | 'High', tags: string[], cluster: 'Sahel' | 'Coastal' | 'Central' }> = {
  'BEN': { status: 'Stable', stability: 72, riskLevel: 'Low', cluster: 'Coastal', tags: ['Democratic Continuity', 'Institutional Reform'], brief: 'Benin maintains a relatively stable democratic process, though recent constitutional changes have sparked debate. Strategic focus is on reinforcing institutional resilience and social cohesion.' },
  'BFA': { status: 'Transition/Crisis', stability: 25, riskLevel: 'High', cluster: 'Sahel', tags: ['Security Alert', 'Transition'], brief: 'Burkina Faso is in a state of political transition following recent shifts in leadership. High security alerts in northern zones impact demographic data collection and service delivery.' },
  'CIV': { status: 'Stable', stability: 68, riskLevel: 'Medium', cluster: 'Coastal', tags: ['Economic Growth', 'Social Cohesion'], brief: 'Côte d\'Ivoire shows strong economic growth and relative political stability after past tensions. Focus remains on inclusive development and strengthening public health systems.' },
  'CMR': { status: 'Fragile', stability: 45, riskLevel: 'High', cluster: 'Central', tags: ['Internal Conflict', 'Decentralization'], brief: 'Cameroon faces dual challenges with unrest in the Anglophone regions and Boko Haram in the North. Political continuity is maintained but decentralization is key to addressing local grievances.' },
  'COD': { status: 'Transition/Fragile', stability: 32, riskLevel: 'High', cluster: 'Central', tags: ['Post-Election', 'Humanitarian'], brief: 'DRC is navigating a complex post-election period and ongoing conflict in the East. Rapid population growth in conflict-affected zones complicates humanitarian response.' },
  'GHA': { status: 'Stable', stability: 88, riskLevel: 'Low', cluster: 'Coastal', tags: ['Model Democracy', 'Strategic Hub'], brief: 'Ghana remains a regional model for democratic stability. Strategic focus is on managing the economic impact of global shocks while maintaining social safety nets.' },
  'GIN': { status: 'Transition', stability: 40, riskLevel: 'Medium', cluster: 'Coastal', tags: ['Constitutional Return', 'Mining Sector'], brief: 'Guinea is currently under a transitional government. Efforts are underway to return to constitutional order, with significant implications for regional mining and trade.' },
  'MLI': { status: 'Transition/Crisis', stability: 22, riskLevel: 'High', cluster: 'Sahel', tags: ['Security Shift', 'Sovereignty'], brief: 'Mali is facing significant security and governance challenges. Political transitions are ongoing amidst a shift in international security partnerships.' },
  'NER': { status: 'Transition/Crisis', stability: 28, riskLevel: 'High', cluster: 'Sahel', tags: ['Flux', 'Food Security'], brief: 'Niger is in a state of political flux following recent changes in government. Border stability and food security remain critical demographic pressures.' },
  'NGA': { status: 'Stable/Strained', stability: 55, riskLevel: 'Medium', cluster: 'Coastal', tags: ['Economic Reform', 'Security Pressures'], brief: 'Nigeria, a regional giant, is implementing major economic reforms. Security challenges in the North and Delta regions continue to affect national stability metrics.' },
  'SEN': { status: 'Stable', stability: 82, riskLevel: 'Low', cluster: 'Coastal', tags: ['Power Shift', 'Youth Employment'], brief: 'Senegal recently successfully transitioned to a new administration, reinforcing its democratic credentials. Focus is on youth employment and digital transformation.' },
  'SLE': { status: 'Stable/Fragile', stability: 58, riskLevel: 'Medium', cluster: 'Coastal', tags: ['Post-Conflict', 'Human Capital'], brief: 'Sierra Leone is focusing on human capital development and food security. Maintaining peace in a post-conflict context remains a top priority.' },
  'TGO': { status: 'Stable', stability: 65, riskLevel: 'Medium', cluster: 'Coastal', tags: ['Modernization', 'Executive Change'], brief: 'Togo is modernizing its governance systems and focusing on social inclusion. Constitutional reforms are reshaping the executive structure.' },
};

const HUB_DATA = [
  { id: 'lagos', name: 'Lagos', x: 45, y: 65, size: 24, connectivity: 98, cluster: 'Coastal' },
  { id: 'kinshasa', name: 'Kinshasa', x: 82, y: 88, size: 18, connectivity: 85, cluster: 'Congo' },
  { id: 'abidjan', name: 'Abidjan', x: 28, y: 70, size: 12, connectivity: 92, cluster: 'Coastal' },
  { id: 'dakar', name: 'Dakar', x: 5, y: 35, size: 10, connectivity: 88, cluster: 'Coastal' },
  { id: 'kano', name: 'Kano', x: 52, y: 45, size: 14, connectivity: 75, cluster: 'Sahel' },
  { id: 'luanda', name: 'Luanda', x: 80, y: 95, size: 11, connectivity: 82, cluster: 'Congo' },
  { id: 'accra', name: 'Accra', x: 38, y: 68, size: 12, connectivity: 94, cluster: 'Coastal' },
  { id: 'douala', name: 'Douala', x: 62, y: 75, size: 9, connectivity: 78, cluster: 'Congo' },
  { id: 'niamey', name: 'Niamey', x: 48, y: 35, size: 6, connectivity: 65, cluster: 'Sahel' },
  { id: 'bamako', name: 'Bamako', x: 22, y: 40, size: 8, connectivity: 68, cluster: 'Sahel' },
];

const CONNECTIVITY_CLUSTERS = [
  { id: 'coastal', name: 'Coastal Digital Hubs', hubs: ['dakar', 'abidjan', 'accra', 'lagos'], color: '#0072BC' },
  { id: 'sahel', name: 'Sahelian Corridor', hubs: ['bamako', 'niamey', 'kano'], color: '#F48120' },
  { id: 'congo', name: 'Congo River Basin', hubs: ['douala', 'kinshasa', 'luanda'], color: '#10b981' },
];

const POP_GROWTH_DATA = [
  { year: 2000, value: 275, label: 'Actual' },
  { year: 2010, value: 360, label: 'Actual' },
  { year: 2020, value: 450, label: 'Actual' },
  { year: 2025, value: 530, label: 'Current Estimate' },
  { year: 2030, value: 610, label: 'Projection' },
  { year: 2040, value: 730, label: 'Projection' },
  { year: 2050, value: 850, label: 'Strategic Target' },
];

const FERTILITY_COMPARISON = [
  { region: 'Central Africa', tfr: 5.2, mcpr: 18, unmet: 24 },
  { region: 'West Africa', tfr: 4.8, mcpr: 22, unmet: 21 },
  { region: 'Sahel', tfr: 6.1, mcpr: 12, unmet: 28 },
  { region: 'Coastal', tfr: 4.1, mcpr: 31, unmet: 18 },
];

const MORTALITY_TRENDS = [
  { year: '2015', imr: 68, mmr: 542 },
  { year: '2017', imr: 64, mmr: 512 },
  { year: '2019', imr: 59, mmr: 485 },
  { year: '2021', imr: 55, mmr: 462 },
  { year: '2023', imr: 52, mmr: 440 },
  { year: '2025', imr: 48, mmr: 418 },
];

const MIGRATION_FLOWS = [
  { name: 'Intra-Regional', value: 7.2, detail: 'Within WCA' },
  { name: 'To Europe', value: 1.8, detail: 'External' },
  { name: 'To North America', value: 0.9, detail: 'External' },
  { name: 'To Asia/Middle East', value: 1.1, detail: 'External' },
];

const MEGATRENDS_DATA = [
  { name: 'Urbanization', value: 78, description: '80% of growth in cities', icon: <Building2 className="w-4 h-4" /> },
  { name: 'Forced Displacement', value: 65, description: '15M in Sahel/Lake Chad', icon: <Ship className="w-4 h-4" /> },
  { name: 'Digitalization', value: 38, description: 'Expansion of 4G/Service Econ', icon: <Smartphone className="w-4 h-4" /> },
  { name: 'Climate Resilience', value: 92, description: 'Adaptation in agricultural zones', icon: <CloudRain className="w-4 h-4" /> },
];

const WCA_PYRAMID_DATA = [
  { age: '0-4', male: -14.2, female: 13.8 },
  { age: '5-9', male: -12.5, female: 12.1 },
  { age: '10-14', male: -11.1, female: 10.8 },
  { age: '15-19', male: -9.8, female: 9.5 },
  { age: '20-24', male: -8.4, female: 8.2 },
  { age: '25-29', male: -7.2, female: 7.0 },
  { age: '30-34', male: -6.1, female: 5.9 },
  { age: '35-39', male: -5.1, female: 4.9 },
  { age: '40-44', male: -4.2, female: 4.1 },
  { age: '45-49', male: -3.4, female: 3.3 },
  { age: '50-54', male: -2.7, female: 2.6 },
  { age: '55-59', male: -2.1, female: 2.0 },
  { age: '60-64', male: -1.6, female: 1.5 },
  { age: '65-69', male: -1.1, female: 1.1 },
  { age: '70-74', male: -0.7, female: 0.7 },
  { age: '75+', male: -0.5, female: 0.6 },
];

const AES_COUNTRIES = ['BFA', 'MLI', 'NER'];

const PREDICTIVE_CRISIS_DATA = [
  { 
    id: 'lcb-01', 
    region: 'Lake Chad Basin', 
    trigger: 'Climate-Induced Conflict',
    popAtRisk: '2.4M',
    srhSurgeProb: 88,
    daysToImpact: 42,
    displacementVector: 'North-to-South',
    prePositionStatus: 'In-Progress',
    commodities: ['ERH Kit 1A', 'Dignity Kits (50k)', 'Oxytocin Bundles'],
    hotspot: { x: 55, y: 32 }
  },
  { 
    id: 'sahel-02', 
    region: 'Liptako-Gourma', 
    trigger: 'Cross-Border Flux',
    popAtRisk: '1.2M',
    srhSurgeProb: 94,
    daysToImpact: 12,
    displacementVector: 'Radial Outward',
    prePositionStatus: 'Critical',
    commodities: ['Safe Delivery Kits', 'Contraceptive Implants', 'Field Clinic B'],
    hotspot: { x: 35, y: 38 }
  },
  { 
    id: 'drc-03', 
    region: 'North Kivu Proxy', 
    trigger: 'Armed Insurgency',
    popAtRisk: '3.1M',
    srhSurgeProb: 91,
    daysToImpact: 58,
    displacementVector: 'East-to-West',
    prePositionStatus: 'Optimal',
    commodities: ['PEP Kits', 'Blood Transfusion Packs', 'Midwifery Mobile Units'],
    hotspot: { x: 88, y: 78 }
  }
];

const NARRATIVE_BRIEFS: Record<string, string> = {
  overview: "The WCA region is at a critical demographic pivot. With a population exceeding 530 million, the strategic focus is on transforming the 'youth bulge' into a 'demographic dividend'. Sustainable development requires harmonizing population growth with investment in human capital, particularly through the 2026-2029 strategic cycle.",
  predictive: "Our AI-driven geospatial engine (Section 4.1) leverages real-time mobility data and climate indicators to anticipate displacement-induced SRH surges. By identifying these surges 60 days in advance, we enable the pre-positioning of life-saving commodities, ensuring continuity of rights even in the most volatile humanitarian contexts.",
  trends: "Demographic trends (Section 1.1) confirm a structural youth bulge where 64% of the population is under 25. The dependency ratio of 84.2 remains high, placing significant pressure on social infrastructure. Rapid urbanization (Section 1.1.5) is reshaping the spatial distribution of these populations.",
  maps: "Spatial intelligence (Section 1.1.5) reveals emerging 'Density Hubs' and connectivity clusters. The Coastal Digital Hub (Dakar to Lagos) and the Sahelian Corridor (Bamako to Kano) are the primary engines of regional economic and demographic dynamism.",
  political: "The political landscape of WCA is increasingly bifurcated between stable coastal democracies and the complex transitions of the central Sahel. Strategic pivots are required to maintain service delivery in fragile contexts while leveraging stability in others for long-term growth.",
  fertility: "Fertility dynamics (Section 1.2) reveal a stark sub-regional divergence. While coastal regions see a transition toward 4.1 TFR, the Sahel remains at 6.1. The unmet need for modern contraception (24.2%) and high adolescent birth rates (114/1k) remain primary indicators for intervention.",
  mortality: "Mortality reduction (Section 1.3) shows steady gains in life expectancy (58.4 years), but maternal mortality (440/100k) and neonatal rates remain stubbornly high in crisis clusters. The slow reduction pace in maternal deaths indicates critical gaps in emergency obstetric care.",
  migration: "Migration flows (Section 1.4) are predominantly intra-regional (7.2M), driven by economic seeking and environmental push factors. Forced displacement (2.2) has reached a staggering 15 million people, fundamentally disrupting local resilience and human rights protections.",
  megatrends: "Megatrends (Chapter 2) like digitalization and climate change are creating a double-edged sword. While 4G expansion facilitates tech-health scaling, high climate vulnerability (92%) and urban slum prevalence (52%) threaten to roll back decades of development gains.",
  quantum: "The Quantum Performance Tracker (Section 5.1) monitors Strategy Plan 2026-2029 outcomes in real-time. By synchronizing country office milestones with regional strategic pivots, it provides a high-fidelity 'Strategic Ledger' for results-based management and compliance.",
};

export default function PopulationDynamicsDashboard() {
  const { profile, isAdmin } = useUser();
  const [activeTabs, setActiveTabs] = useState<string[]>(['overview']);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFrameworkActive, setIsFrameworkActive] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const aesData = useMemo(() => WCA_COUNTRIES.filter(c => AES_COUNTRIES.includes(c.id)), []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setIsUploading(true);
    setUploadSuccess(false);
    
    // Simulate upload progress
    const timer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate backend processing
    setTimeout(async () => {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadSuccess(true);
      
      if (profile) {
        await userService.logActivity(
          profile.uid, 
          profile.displayName, 
          'Data Upload: Population Dynamics', 
          { fileName: e.target.files?.[0].name || 'unnamed_report.pdf', type: 'Demographic Data' }
        );
      }

      setTimeout(() => {
        setUploadSuccess(false);
        setIsUploadModalOpen(false);
      }, 2000);
    }, 2500);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(0, 114, 188); // UNFPA Blue
    doc.text("UNFPA WCARO: POPULATION DYNAMICS DASHBOARD", 10, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Generated On: ${new Date().toLocaleString()}`, 10, 30);
    doc.text(`Active Perspectives: ${activeTabs.join(', ')}`, 10, 40);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Executive Summary:", 10, 60);
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize("The West and Central Africa region is undergoing a profound demographic shift. This report synthesizes key datasets across Fertility, Mortality, Migration, and Socio-Economic connectivity to guide strategic alignment with the SP 2026-2029 outcomes.", 180);
    doc.text(summaryLines, 10, 70);

    doc.save("UNFPA_Population_Dynamics_Dashboard.pdf");
  };

  const toggleTab = (tabId: string) => {
    setActiveTabs(prev => {
      if (tabId === 'overview') return ['overview'];
      
      const dynamicsRelated = ['quantum', 'political', 'predictive', 'outcome4'];
      
      if (tabId === 'dynamics') {
        const isAllSelected = dynamicsRelated.every(id => prev.includes(id));
        if (isAllSelected) {
          const filtered = prev.filter(t => !dynamicsRelated.includes(t));
          return filtered.length === 0 ? ['overview'] : filtered;
        } else {
          const otherTabs = prev.filter(t => t !== 'overview' && !dynamicsRelated.includes(t));
          return [...otherTabs, ...dynamicsRelated];
        }
      }
      
      const newTabs = prev.filter(t => t !== 'overview');
      if (newTabs.includes(tabId)) {
        const filtered = newTabs.filter(t => t !== tabId);
        return filtered.length === 0 ? ['overview'] : filtered;
      } else {
        return [...newTabs, tabId];
      }
    });
  };

  return (
    <div className="h-screen bg-slate-50 font-sans relative flex flex-col overflow-hidden">
      {/* Floating Navigation Rail for Strategic Sections */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[100] hidden xl:flex flex-col gap-4">
        {activeTabs.length > 1 && activeTabs.map((tabId) => {
          const tab = CHAPTER_TABS.find(t => t.id === tabId);
          if (!tab || tabId === 'overview') return null;
          return (
            <motion.button
              key={`nav-rail-${tabId}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => {
                const element = document.getElementById(`section-${tabId}`);
                const container = document.getElementById('main-scroll-container');
                if (element && container) {
                  const offset = 20;
                  const elementPosition = element.offsetTop;
                  const offsetPosition = elementPosition - offset;
                  container.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
              }}
              className="group relative flex items-center justify-end"
            >
              <div className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {tab.label}
              </div>
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-lg border backdrop-blur-md",
                "bg-white border-slate-200 text-slate-400 hover:text-unfpa-blue hover:border-unfpa-blue hover:scale-110"
              )}>
                {tab.icon}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar pb-20" id="main-scroll-container">
        <div className="max-w-[1700px] mx-auto p-6 lg:p-10 space-y-8">
      {/* Strategic Header */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-unfpa-blue to-blue-700 rounded-[2.5rem] shadow-xl overflow-hidden">
          <HeroGeoMotif className="pointer-events-none absolute -top-40 -right-16 w-[640px] h-[640px] opacity-30 hidden md:block" />
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        </div>

        <div className="relative z-20 p-6 md:p-10 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/30 shadow-inner">
                   <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <h2 className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Demographic Resilience · Strategic Analytics</h2>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05] mb-4">
                Population Dynamics <br className="hidden md:block" /> &amp; Sustainable Development
              </h1>
              <div className="flex items-center gap-2 text-white/60">
                <div className="w-8 h-px bg-white/30" />
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">West and Central Africa Regional Intelligence</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Strategic Navigation Tabs */}
              <div className="hidden xl:flex items-center bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-2xl">
                 {CHAPTER_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => toggleTab(tab.id)}
                      className={cn(
                        "px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 group whitespace-nowrap",
                        activeTabs.includes(tab.id) 
                          ? "bg-white text-unfpa-blue shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1)]" 
                          : "text-white/60 hover:text-white"
                      )}
                    >
                      <span className={cn(
                        "transition-colors",
                        activeTabs.includes(tab.id) ? "text-unfpa-blue" : "text-white/40 group-hover:text-white"
                      )}>{tab.icon}</span>
                      {tab.label}
                    </button>
                 ))}
              </div>

              {/* Indicator Selector Dropdown */}
              <div className="relative group/dropdown">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white text-unfpa-blue px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:scale-[1.03] transition-all active:scale-95 z-30 relative"
                >
                  <BookOpen className="w-4 h-4" />
                  Selector
                  <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-300", isDropdownOpen ? "rotate-90" : "")} />
                </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[4px]" 
                      onClick={() => setIsDropdownOpen(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 lg:right-0 left-0 sm:left-auto mt-4 w-full sm:w-80 bg-white rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] z-50 border border-slate-100 p-6 md:p-8 overflow-hidden"
                    >
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 ml-4">Strategic Monitor</h3>
                      <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                        {CHAPTER_TABS.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => toggleTab(tab.id)}
                            className={cn(
                              "w-full flex items-center justify-between px-5 py-4 rounded-[1.25rem] transition-all group/item",
                              activeTabs.includes(tab.id) 
                                ? "bg-unfpa-blue text-white shadow-xl shadow-unfpa-blue/20 scale-[1.02]" 
                                : "text-slate-500 hover:bg-slate-50"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "p-2 rounded-xl transition-colors",
                                activeTabs.includes(tab.id) ? "bg-white/20" : "bg-slate-100 group-hover/item:bg-slate-200"
                              )}>
                                {tab.icon}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-left">{tab.label}</span>
                            </div>
                            <div className={cn(
                              "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                              activeTabs.includes(tab.id) ? "bg-white border-white scale-110" : "border-slate-200"
                            )}>
                              {activeTabs.includes(tab.id) && <div className="w-2.5 h-2.5 bg-unfpa-blue rounded-full" />}
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="mt-8 pt-8 border-t border-slate-100 flex gap-4">
                        <button 
                          onClick={() => {
                            setActiveTabs(['overview']);
                            setIsDropdownOpen(false);
                          }}
                          className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 rounded-[1.25rem] border border-slate-100 hover:bg-slate-100"
                        >
                          Reset
                        </button>
                        <button 
                          onClick={() => {
                            setActiveTabs(CHAPTER_TABS.filter(t => t.id !== 'overview').map(t => t.id));
                            setIsDropdownOpen(false);
                          }}
                          className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest text-white bg-unfpa-blue shadow-lg shadow-unfpa-blue/20 rounded-[1.25rem] hover:scale-[1.02] transition-all active:scale-95"
                        >
                          Select All
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-[9px] font-black text-white/40 uppercase tracking-widest w-full mb-1 lg:w-auto lg:mb-0 lg:mr-4">Active Perspectives:</h4>
            {activeTabs.map(tabId => {
              const tab = CHAPTER_TABS.find(t => t.id === tabId);
              if (!tab) return null;
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={tabId} 
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/20 shadow-lg text-white group/pill"
                >
                  <div className="text-white/80 group-hover/pill:text-white transition-colors">{tab.icon}</div>
                  <span className="text-[9px] font-black uppercase tracking-[0.1em]">{tab.label}</span>
                  {tabId !== 'overview' && (
                    <button 
                      onClick={() => toggleTab(tabId)} 
                      className="ml-1 p-1 rounded-full hover:bg-white/20 text-white/40 hover:text-white transition-all shadow-inner"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </motion.div>
              );
            })}
            
            {(isAdmin || profile?.email === 'mbagayoko@unfpa.org') && (
              <div className="flex items-center gap-2 ml-auto">
                <button 
                  onClick={exportToPDF}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/20 shadow-lg text-white hover:bg-white/20 transition-all group/export"
                >
                  <Download className="w-3.5 h-3.5 group-hover/export:translate-y-0.5 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Export PDF</span>
                </button>
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-3 bg-unfpa-orange/20 backdrop-blur-xl px-5 py-2.5 rounded-full border border-unfpa-orange/30 shadow-lg text-unfpa-orange hover:bg-unfpa-orange hover:text-white transition-all group/upload"
                >
                  <Upload className="w-3.5 h-3.5 group-hover/upload:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Upload Dataset</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    <div className="space-y-8">
        {/* Sub-Navigation for Dynamics Suite */}
        {activeTabs.filter(id => ['quantum', 'political', 'predictive', 'outcome4'].includes(id)).length > 1 && (
          <div className="sticky top-0 z-[60] bg-white/80 backdrop-blur-2xl border-b border-slate-100 py-3 overflow-hidden mb-6 lg:-mx-8">
            <div className="max-w-[1600px] mx-auto px-8 flex items-center justify-center gap-8">
              <div className="flex items-center gap-3 pr-8 border-r border-slate-100">
                <Compass className="w-3.5 h-3.5 text-unfpa-blue animate-spin-slow" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-900 italic">Dynamics_Hub</span>
              </div>
              {['quantum', 'political', 'predictive', 'outcome4'].filter(id => activeTabs.includes(id)).map(id => (
                <button
                  key={`subnav-${id}`}
                  onClick={() => {
                    const el = document.getElementById(`section-${id}`);
                    const container = document.getElementById('main-scroll-container');
                    if (el && container) {
                      const offset = 20;
                      const elementPosition = el.offsetTop;
                      const offsetPosition = elementPosition - offset;
                      container.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                    }
                  }}
                  className="group flex items-center gap-3 transition-transform hover:scale-105"
                >
                  <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-unfpa-blue text-slate-400 group-hover:text-white transition-all shadow-sm">
                    {React.cloneElement(CHAPTER_TABS.find(t => t.id === id)?.icon as React.ReactElement, { className: 'w-3.5 h-3.5' } as any)}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-unfpa-blue transition-colors">
                    {CHAPTER_TABS.find(t => t.id === id)?.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {activeTabs.map((tabId, index) => (
            <motion.div
              key={tabId}
              id={`section-${tabId}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="relative scroll-mt-24"
            >
              {tabId !== 'overview' && (
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-slate-100" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 whitespace-nowrap">
                    {CHAPTER_TABS.find(t => t.id === tabId)?.label}
                  </h2>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
              )}
              
              {tabId === 'overview' && <OverviewSection aesData={aesData} toggleTab={toggleTab} />}
              {tabId === 'outcome1' && <FertilitySection toggleTab={toggleTab} />}
              {tabId === 'outcome2' && <MortalitySection toggleTab={toggleTab} />}
              {tabId === 'outcome3' && <GBVSection toggleTab={toggleTab} />}
              {tabId === 'outcome4' && (
                <div className="space-y-12">
                   <DemographicTrendsSection toggleTab={toggleTab} />
                   <DensityHubsMap />
                   <DemographicResilienceSection toggleTab={toggleTab} />
                </div>
              )}
              {tabId === 'predictive' && <PredictiveModelingSection />}
              {tabId === 'quantum' && <QuantumPerformanceSection toggleTab={toggleTab} />}
              {tabId === 'political' && <PoliticalSection toggleTab={toggleTab} />}
              {tabId === 'megatrends' && <MegatrendsSection />}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Intelligence Briefing Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden border border-white/5"
        >
          <div className="absolute top-0 right-0 p-20 opacity-5 -rotate-12 translate-x-1/4">
            <FileText className="w-96 h-96" />
          </div>
          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-unfpa-blue/20 rounded-2xl border border-unfpa-blue/30 backdrop-blur-md">
                <BrainCircuit className="w-6 h-6 text-unfpa-blue" />
              </div>
              <div>
                <h3 className="text-xs font-black text-unfpa-blue uppercase tracking-[0.3em] mb-1">Intelligence Synthesis</h3>
                <h2 className="text-2xl font-black uppercase tracking-tighter">WCA Regional Strategic Briefing</h2>
              </div>
            </div>

            <div className="space-y-6">
              {activeTabs.map(tabId => (
                <div key={`brief-${tabId}`} className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-unfpa-blue" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      {CHAPTER_TABS.find(t => t.id === tabId)?.label}
                    </span>
                  </div>
                  <p className="text-lg font-medium text-white/80 leading-relaxed group-hover:text-white transition-colors pl-4 border-l border-white/10">
                    {NARRATIVE_BRIEFS[tabId]}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4">
              <button className="bg-white text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] transition-all">
                <FileText className="w-4 h-4" />
                Export Full Intelligence Report
              </button>
              <button 
                onClick={() => setIsFrameworkActive(true)}
                className="bg-unfpa-blue text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-unfpa-blue shadow-lg shadow-unfpa-blue/30 hover:scale-[1.05] transition-all"
              >
                Strategic Framework (2026-2029) Active
              </button>
            </div>
          </div>
        </motion.div>

        {/* Strategic Framework Modal Overlay */}
        <AnimatePresence>
          {isFrameworkActive && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFrameworkActive(false)}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[60]"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="fixed inset-4 md:inset-20 bg-white rounded-[3rem] z-[70] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col md:flex-row"
              >
                {/* Visual Side */}
                <div className="w-full md:w-2/5 bg-unfpa-blue p-12 text-white flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <Globe2 className="w-full h-full -translate-y-1/2 translate-x-1/2 scale-150" />
                  </div>
                  <div className="relative z-10">
                    <div className="bg-white/20 w-fit p-3 rounded-2xl border border-white/20 mb-8">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-4">
                      Strategic <br/> Framework <br/> 2026-2029
                    </h2>
                    <p className="text-white/60 font-medium leading-relaxed max-w-xs">
                      The WCA transformative roadmap for demographic sovereignty and sustainable resilience.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsFrameworkActive(false)}
                    className="relative z-10 w-full py-4 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Close Strategic View
                  </button>
                </div>

                {/* Content Side */}
                <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-slate-50">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-12">Core Transformation Pillars</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {[
                      {
                        title: "Human Capital Acceleration",
                        desc: "Unlocking the potential of 340M young people through vocational tech and rights-based autonomy.",
                        color: "bg-blue-600",
                        progress: 75
                      },
                      {
                        title: "Universal Rights & 'Three Zeros'",
                        desc: "Zero unmet need for family planning, zero preventable maternal deaths, and zero GBV.",
                        color: "bg-orange-600",
                        progress: 62
                      },
                      {
                        title: "Resilient Demographic Governance",
                        desc: "Strengthening civil registration and digital census systems for real-time policy intelligence.",
                        color: "bg-emerald-600",
                        progress: 88
                      },
                      {
                        title: "Climate-Adaptive Systems",
                        desc: "Integrating population data into climate adaptation strategies for vulnerable coastal and Sahel zones.",
                        color: "bg-amber-600",
                        progress: 45
                      }
                    ].map((pillar, i) => (
                      <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                        <div className={cn("w-2 h-8 rounded-full mb-6", pillar.color)} />
                        <h4 className="text-lg font-black uppercase tracking-tighter mb-3">{pillar.title}</h4>
                        <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">{pillar.desc}</p>
                        
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Target Velocity</span>
                          <span className="text-[10px] font-black text-slate-800 uppercase">{pillar.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pillar.progress}%` }}
                            transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                            className={cn("h-full", pillar.color)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 p-8 bg-slate-900 rounded-[2.5rem] text-white">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-white/10 rounded-xl">
                        <Activity className="w-5 h-5 text-unfpa-blue" />
                      </div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50">Tactical 2026 Milestone</h4>
                    </div>
                    <p className="text-xl font-bold leading-snug">
                      Integration of geospatial connectivity clusters into all sub-regional development budgets by Q3 2026.
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Upload Modal */}
        <AnimatePresence>
          {isUploadModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isUploading && setIsUploadModalOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[80]"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] z-[90] overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-unfpa-blue rounded-2xl shadow-lg shadow-unfpa-blue/20">
                      <FileUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Regional Data Intake</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Population Dynamics | Analytics Engine</p>
                    </div>
                  </div>
                  {!isUploading && (
                    <button 
                      onClick={() => setIsUploadModalOpen(false)}
                      className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  )}
                </div>

                <div className="p-10">
                  {uploadSuccess ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                        <Check className="w-10 h-10 text-emerald-600" />
                      </div>
                      <h4 className="text-xl font-black uppercase tracking-tighter text-slate-800 mb-2">Ingestion Complete</h4>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Global metadata patterns synchronized</p>
                    </div>
                  ) : isUploading ? (
                    <div className="space-y-8 py-10">
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-unfpa-blue animate-spin mb-6" />
                        <h4 className="text-lg font-black uppercase tracking-tighter text-slate-800 mb-1">Synthesizing Demographic Flux</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">AI Engine Mapping Vectors</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-unfpa-blue">Progressive Mapping</span>
                          <span className="text-slate-400">{uploadProgress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-unfpa-blue"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                       <div className="border-3 border-dashed border-slate-100 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center group hover:border-unfpa-blue/30 transition-all cursor-pointer relative bg-slate-50/50">
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={handleFileUpload}
                            accept=".csv,.json,.xlsx"
                          />
                          <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                             <Upload className="w-10 h-10 text-slate-300 group-hover:text-unfpa-blue transition-colors" />
                          </div>
                          <h4 className="text-lg font-black uppercase tracking-tighter text-slate-700 mb-2">Select Regional Dataset</h4>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">CSV, JSON or Excel format required</p>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                             <Target className="w-5 h-5 text-unfpa-blue mb-4" />
                             <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-800 mb-1">Outcome Mapping</h5>
                             <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase">Automatic alignment with SP 2026-2029 outcomes.</p>
                          </div>
                          <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                             <Globe2 className="w-5 h-5 text-unfpa-orange mb-4" />
                             <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-800 mb-1">Geospatial Sync</h5>
                             <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase">Real-time update to the Geospatial Stage layer.</p>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
    </div>
  );
}

function QuantumPerformanceSection({ toggleTab }: { toggleTab?: (tabId: string) => void }) {
  return (
    <div className="space-y-8">
      <div className="bg-[#0A0A0B] p-10 rounded-[4rem] border border-white/5 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-16 opacity-10 scale-150 rotate-12 transition-transform group-hover:rotate-45 duration-[2000ms]">
          <Orbit className="w-80 h-80 text-unfpa-blue" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#0072BC15,transparent_70%)]" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 border-b border-white/10 pb-12">
            <div className="max-w-xl">
               <div className="flex items-center gap-3 mb-8">
                  <div className="px-4 py-2 bg-unfpa-blue/20 text-unfpa-blue rounded-xl text-[10px] font-black uppercase tracking-[0.3em] border border-unfpa-blue/30 font-mono italic">
                    QUANTUM_EXEC_CORE_v6
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-widest italic">Neural Tracking Active</h3>
               </div>
               <h4 className="text-4xl font-black text-white uppercase tracking-tighter leading-[0.8] mb-6 italic">Operational <br/> Intelligence Matrix</h4>
               <p className="text-lg text-white/50 font-medium leading-relaxed max-w-md italic border-l-2 border-unfpa-blue/30 pl-6">
                 Real-time data synchronization architecture mapping micro-milestones to WCA regional outcomes.
               </p>
            </div>
            <div className="flex flex-wrap gap-4">
               {[
                 { label: 'Sync Rate', val: '0.8ms', color: 'text-unfpa-blue' },
                 { label: 'Nodes', val: '24/24', color: 'text-emerald-500' },
                 { label: 'Uptime', val: '99.9%', color: 'text-purple-500' }
               ].map((stat, i) => (
                 <div key={i} className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 min-w-[140px] shadow-2xl transform hover:scale-105 transition-transform">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">{stat.label}</p>
                    <p className={cn("text-3xl font-black italic tracking-tighter", stat.color)}>{stat.val}</p>
                 </div>
               ))}
            </div>
          </div>
          
          <div className="lg:col-span-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <button 
                 onClick={() => toggleTab?.('overview')}
                 className="md:col-span-1 bg-unfpa-blue hover:bg-white text-white hover:text-unfpa-blue px-8 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-unfpa-blue/20 transition-all flex items-center justify-center gap-3 border border-unfpa-blue italic active:scale-95"
               >
                 Strategic Core
                 <ArrowUpRight className="w-4 h-4" />
               </button>
               <div className="md:col-span-3 bg-white/5 rounded-2xl border border-white/10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-6 px-4">
                     <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">Network Health:</span>
                     <div className="flex gap-1.5">
                        {[...Array(12)].map((_, i) => (
                          <motion.div 
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                            className="w-1.5 h-6 bg-emerald-500/40 rounded-full" 
                          />
                        ))}
                     </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black text-white/40 uppercase tracking-widest italic pr-4">
                    <Cpu className="w-4 h-4" />
                    v6.2 Edge Node Array
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-950 p-6 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
           <svg className="w-full h-full"><pattern id="grid-q" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern><rect width="100%" height="100%" fill="url(#grid-q)" /></svg>
        </div>
        <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/10 relative z-10 italic">
          <QuantumTracker />
        </div>
      </div>
    </div>
  );
}

// --- SUB-SECTIONS ---

function PoliticalSection({ toggleTab }: { toggleTab?: (tabId: string) => void }) {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['SEN', 'GHA', 'BEN']);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClusterFilter, setActiveClusterFilter] = useState<'All' | 'Sahel' | 'Coastal' | 'Central'>('All');

  const toggleCountry = (id: string) => {
    setSelectedCountries(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const filteredCountries = useMemo(() => {
    return WCA_COUNTRIES.filter(c => {
      const data = WCA_POLITICAL_DATA[c.id];
      if (!data) return false;
      
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           c.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCluster = activeClusterFilter === 'All' || data.cluster === activeClusterFilter;
      
      return matchesSearch && matchesCluster;
    });
  }, [searchQuery, activeClusterFilter]);

  const selectedData = useMemo(() => 
    selectedCountries.map(id => ({
      id,
      ...WCA_COUNTRIES.find(c => c.id === id),
      ...WCA_POLITICAL_DATA[id]
    })),
    [selectedCountries]
  );

  // Advanced Synthesis Engine
  const synthesis = useMemo(() => {
    if (selectedCountries.length === 0) return null;
    
    const avgStability = selectedData.reduce((acc, curr) => acc + (curr.stability || 0), 0) / selectedCountries.length;
    const hasSahel = selectedData.some(d => d.cluster === 'Sahel');
    const hasCoastal = selectedData.some(d => d.cluster === 'Coastal');
    const highRiskCount = selectedData.filter(d => d.riskLevel === 'High').length;

    let narrative = "";
    if (selectedCountries.length === 1) {
      narrative = `Strategic focus on ${selectedData[0].name} reveals a ${selectedData[0].status.toLowerCase()} context with a stability index of ${selectedData[0].stability}%. The implementation of rights-based demographic policies here must navigate ${selectedData[0].riskLevel.toLowerCase()}-risk institutional hurdles.`;
    } else {
      narrative = `This ${selectedCountries.length}-country cluster presents a bifurcated strategic landscape with an aggregate stability of ${avgStability.toFixed(1)}%. `;
      
      if (hasSahel && hasCoastal) {
        narrative += "The interaction between stable coastal engines and fragile Sahelian transition zones creates a complex regional dependency. ";
      } else if (hasSahel) {
        narrative += "The cluster is primarily characterized by transitional governance and heightened security pressures, requiring a crisis-adaptive humanitarian-development nexus approach. ";
      } else if (hasCoastal) {
        narrative += "The group represents a critical 'Stability Anchor' for the region, where investments in human capital can be maximized through institutional scaling. ";
      }

      if (highRiskCount > 0) {
        narrative += `With ${highRiskCount} jurisdictions under high-risk alerts, strategic pivots in service delivery are mandatory to maintain rights-based coverage.`;
      }
    }

    return { narrative, avgStability, highRiskCount };
  }, [selectedData, selectedCountries]);
  return (
    <div className="space-y-8" id="section-political">
      <div className="bg-[#0A0A0B] p-10 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-16 opacity-10 scale-150 rotate-12 transition-transform group-hover:rotate-45 duration-[2000ms]">
          <ShieldAlert className="w-80 h-80 text-amber-500" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_120%,#fbbf2415,transparent_50%)]" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-12 border-b border-white/10 pb-12">
            <div className="max-w-2xl">
               <div className="flex items-center gap-3 mb-8">
                  <div className="px-4 py-2 bg-amber-500/20 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] border border-amber-500/30 font-mono italic">
                    POLITICAL_SYNTAX_v4
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest italic leading-none">Stability Feed Synchronized</span>
                  </div>
               </div>
               <h4 className="text-4xl font-black text-white uppercase tracking-tighter leading-[0.8] mb-8 italic">Political <br/> Context Engine</h4>
               <p className="text-lg text-white/50 font-medium leading-relaxed max-w-xl italic border-l-4 border-amber-500/30 pl-8">
                 Mapping governance volatility and socio-political shifts to preserve rights-based demographic protections in complex regional clusters.
               </p>
            </div>
            
            <div className="flex flex-wrap gap-6">
               <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl min-w-[180px] shadow-2xl text-center group/stat border-t-amber-500/50">
                  <h5 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] mb-3">Cluster Health</h5>
                  <p className="text-4xl font-black text-white italic tracking-tighter">{synthesis?.avgStability.toFixed(0)}%</p>
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-3">Mean Stability Index</p>
               </div>
               <div className="p-6 bg-slate-900 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl min-w-[180px] shadow-2xl text-center group/stat border-t-rose-500/50">
                  <h5 className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] mb-3">Risk Exposure</h5>
                  <p className="text-4xl font-black text-white italic tracking-tighter">{synthesis?.highRiskCount}</p>
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-3">Critical Risk Nodes</p>
               </div>
            </div>
          </div>
          
          <div className="lg:col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4">
             <div className="flex items-center gap-4">
               <button 
                 onClick={() => toggleTab?.('predictive')}
                 className="px-10 py-5 bg-amber-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-amber-500/30 hover:scale-105 transition-all flex items-center gap-3 italic border border-amber-400 group/btn"
               >
                 Predictive Intelligence
                 <Zap className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
               </button>
               <button className="px-6 py-5 bg-white/5 border border-white/10 text-white/40 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all italic">
                 Download Stability Dataset
               </button>
             </div>
             <div className="flex items-center gap-6">
                <div className="flex -space-x-4">
                   {[...Array(4)].map((_, i) => (
                     <div key={i} className="w-12 h-12 rounded-full border-4 border-[#0A0A0B] bg-slate-800 flex items-center justify-center overflow-hidden shadow-2xl" />
                   ))}
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Advisory Status</p>
                   <p className="text-[12px] font-black text-white uppercase tracking-tighter italic">Regional Governance Board [Active]</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-8 sticky top-[100px] z-40">
            <div className="flex-1 flex flex-col md:flex-row md:items-center gap-10">
              <div className="relative group/search w-full md:w-96">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/search:text-amber-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Query Regional Nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-[12px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:bg-white transition-all shadow-inner placeholder:text-slate-300"
                />
              </div>
              
              <div className="flex items-center bg-slate-50 p-2 rounded-[2.5rem] border border-slate-100 shadow-inner">
                {(['All', 'Sahel', 'Coastal', 'Central'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveClusterFilter(f)}
                    className={cn(
                      "px-8 py-3.5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all italic",
                      activeClusterFilter === f 
                        ? "bg-white text-amber-600 shadow-[0_8px_20px_-4px_rgba(251,191,36,0.3)] border border-amber-200" 
                        : "text-slate-400 hover:text-amber-500"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-8 pl-10 border-l border-slate-100 italic">
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Perspective Nodes</p>
                  <p className="text-2xl font-black text-amber-600 uppercase tracking-tighter">{selectedCountries.length} Matrix Linked</p>
               </div>
               <button 
                  onClick={() => setSelectedCountries([])}
                  className="px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl active:scale-95"
               >
                  Sync Reset
               </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredCountries.map((country, idx) => {
                  const data = WCA_POLITICAL_DATA[country.id];
                  const isSelected = selectedCountries.includes(country.id);
                  return (
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      key={`country-${country.id}`}
                      onClick={() => toggleCountry(country.id)}
                      className={cn(
                        "p-6 rounded-[2.5rem] border-2 transition-all text-left relative overflow-hidden group",
                        isSelected 
                          ? "bg-white border-unfpa-blue shadow-2xl scale-[1.02] z-10" 
                          : "bg-white border-slate-50 hover:border-slate-200"
                      )}
                    >
                      {isSelected && (
                         <div className="absolute top-0 right-0 w-24 h-24 bg-unfpa-blue/5 -rotate-45 translate-x-12 -translate-y-12 transition-transform group-hover:scale-150" />
                      )}
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{country.id}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border",
                              data.riskLevel === 'High' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                            )}>
                              {data.riskLevel} Risk
                            </span>
                         </div>
                         {isSelected && <div className="w-2 h-2 rounded-full bg-unfpa-blue" />}
                      </div>
                      <h5 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-4 group-hover:text-unfpa-blue transition-colors">
                        {country.name}
                      </h5>
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                         <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Stability</p>
                            <p className="text-xl font-black text-slate-900 leading-none">{data.stability}%</p>
                         </div>
                         <div className="h-6 w-px bg-slate-200" />
                         <div className="text-right">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cluster</p>
                            <p className="text-[10px] font-black text-slate-600 leading-none">{data.cluster}</p>
                         </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {data.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-[8px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-lg">#{t}</span>
                        ))}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
           </div>
        </div>

        <div className="lg:col-span-4">
           <AnimatePresence mode="wait">
             {selectedCountries.length > 0 ? (
               <motion.div
                key="synthesis-active"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6 sticky top-24"
               >
                 <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl border border-white/5 relative overflow-hidden group/synth">
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                      <Target className="w-32 h-32" />
                   </div>
                   <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-8">
                         <div className="p-3 bg-unfpa-blue rounded-2xl">
                            <ShieldAlert className="w-5 h-5 text-white" />
                         </div>
                         <div>
                            <h3 className="text-xs font-black text-unfpa-blue uppercase tracking-widest leading-none mb-1">Synthesis v1</h3>
                            <h2 className="text-lg font-black uppercase tracking-tight">Strategy Narrative</h2>
                         </div>
                      </div>
                      <p className="text-lg font-bold leading-relaxed italic text-white/90 border-l-4 border-unfpa-blue pl-6 py-2 mb-10">
                        "{synthesis?.narrative}"
                      </p>
                      <div className="space-y-6">
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                           <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-4">Jurisdiction Ledger</p>
                           <div className="space-y-4">
                             {selectedData.map(d => (
                               <div key={`ledg-${d.id}`} className="flex items-center justify-between">
                                 <span className="text-[10px] font-bold text-white/60">{d.name}</span>
                                 <div className="h-1 flex-1 mx-4 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-unfpa-blue" style={{ width: `${d.stability}%` }} />
                                 </div>
                                 <span className="text-[10px] font-black text-white">{d.stability}%</span>
                               </div>
                             ))}
                           </div>
                        </div>
                        <button className="w-full py-4 bg-unfpa-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-unfpa-blue/20 hover:scale-[1.03] transition-all">
                           Export Multi-Cluster Brief
                        </button>
                      </div>
                   </div>
                 </div>
               </motion.div>
             ) : (
               <motion.div
                key="synthesis-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border-2 border-dashed border-slate-200 p-12 rounded-[3rem] text-center sticky top-24"
               >
                  <MapIcon className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none italic italic">Select <br/> Nodes</h4>
                  <p className="text-[11px] font-medium text-slate-400 leading-relaxed max-w-[180px] mx-auto uppercase tracking-widest">
                    Synchronize multiple country nodes to generate advanced cross-cluster narrative intelligence.
                  </p>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function DensityHubsMap() {
  const [activeCluster, setActiveCluster] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 bg-slate-900 rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden h-[600px] shadow-2xl">
        <div className="absolute top-8 left-8 z-20">
          <h3 className="text-xs font-black text-unfpa-blue uppercase tracking-widest mb-2">Innovative Spatial Intelligence (1.1.5)</h3>
          <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Density Hubs & Connectivity Clusters</h4>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-8 left-8 z-20 space-y-3 bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/10">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Active Connectivity Layers</p>
          {CONNECTIVITY_CLUSTERS.map(cluster => (
            <button
              key={cluster.id}
              onClick={() => setActiveCluster(activeCluster === cluster.id ? null : cluster.id)}
              className={cn(
                "flex items-center gap-3 transition-all",
                activeCluster === null || activeCluster === cluster.id ? "opacity-100" : "opacity-30"
              )}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cluster.color }} />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{cluster.name}</span>
            </button>
          ))}
        </div>

        {/* Map Container */}
        <div className="relative w-full h-full">
           <svg viewBox="0 0 100 100" className="w-full h-full preserve-3d opacity-90">
             {/* Background Map Simulation Lines */}
             <path d="M 0 50 L 100 50" stroke="white" strokeWidth="0.05" strokeOpacity="0.1" strokeDasharray="1 2" />
             <path d="M 50 0 L 50 100" stroke="white" strokeWidth="0.05" strokeOpacity="0.1" strokeDasharray="1 2" />
             
             {/* Cluster Connectivity Vectors */}
             {CONNECTIVITY_CLUSTERS.map(cluster => {
               if (activeCluster !== null && activeCluster !== cluster.id) return null;
               
               const hubs = HUB_DATA.filter(h => cluster.hubs.includes(h.id));
               return (
                 <g key={`cluster-line-${cluster.id}`}>
                   {hubs.map((hub, i) => {
                     const nextHub = hubs[i + 1];
                     if (!nextHub) return null;
                     return (
                        <motion.line
                          key={`line-${hub.id}-${nextHub.id}`}
                          x1={hub.x} y1={hub.y}
                          x2={nextHub.x} y2={nextHub.y}
                          stroke={cluster.color}
                          strokeWidth="0.5"
                          strokeDasharray="2 1"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                        />
                     );
                   })}
                 </g>
               );
             })}

             {/* Density Hub Nodes */}
             {HUB_DATA.map(hub => {
               const clusterColor = CONNECTIVITY_CLUSTERS.find(c => hub.cluster === c.name.split(' ')[0])?.color || '#94a3b8';
               const isActive = activeCluster === null || CONNECTIVITY_CLUSTERS.find(c => c.id === activeCluster)?.name.startsWith(hub.cluster);

               return (
                 <motion.g 
                  key={hub.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: isActive ? 1 : 0.6 }}
                  className="cursor-pointer"
                 >
                   {/* Pulse Effect */}
                   {isActive && (
                     <motion.circle
                        cx={hub.x} cy={hub.y}
                        r={hub.size/2}
                        fill={clusterColor}
                        opacity={0.2}
                        animate={{ scale: [1, 2], opacity: [0.2, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                     />
                   )}
                   
                   <circle 
                    cx={hub.x} cy={hub.y} 
                    r={hub.size/4} 
                    fill={isActive ? clusterColor : '#334155'} 
                    className="shadow-xl"
                   />
                   
                   <text 
                    x={hub.x} y={hub.y - (hub.size/3)} 
                    fontSize="1.5" 
                    fontWeight="900" 
                    fill="white" 
                    textAnchor="middle" 
                    className="uppercase tracking-tighter opacity-70"
                   >
                     {hub.name}
                   </text>
                 </motion.g>
               );
             })}
           </svg>
        </div>
      </div>

      <div className="space-y-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-card-border shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Cluster Intelligence</h4>
            <div className="space-y-6">
              <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100">
                <div className="flex items-center gap-3 mb-2">
                   <Zap className="w-4 h-4 text-blue-600" />
                   <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Connectivity Cluster</span>
                </div>
                <p className="text-2xl font-black text-blue-950 uppercase tracking-tighter mb-1">92% Digital Hub</p>
                <p className="text-[9px] font-bold text-blue-600 uppercase">Coastal Cluster Dominance</p>
              </div>

              <div className="p-5 bg-orange-50 rounded-3xl border border-orange-100">
                <div className="flex items-center gap-3 mb-2">
                   <UsersRound className="w-4 h-4 text-orange-600" />
                   <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Aggregate Hub</span>
                </div>
                <p className="text-2xl font-black text-orange-950 uppercase tracking-tighter mb-1">220M+ Pop</p>
                <p className="text-[9px] font-bold text-orange-600 uppercase">Sahelian Population Mass</p>
              </div>
            </div>
         </div>

         <div className="bg-unfpa-blue p-8 rounded-[2.5rem] shadow-xl text-white">
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-60">Spatial Directive</h4>
            <p className="text-sm font-bold leading-relaxed mb-6">
              Focus investments on the "Abidjan-Lagos Corridor" to leverage high-density connectivity for service delivery scaling.
            </p>
            <button className="w-full py-4 bg-white/20 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all">
              Load Accessibility Heatmap
            </button>
         </div>
      </div>
    </div>
  );
}

function OverviewSection({ aesData, toggleTab }: { aesData: any[], toggleTab?: (tabId: string) => void }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-card-border shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
            <LayoutDashboard className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Growth Momentum (2000-2050)</h3>
                <p className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Regional Population Trajectory</p>
              </div>
              <div className="flex items-center gap-2 bg-unfpa-blue/10 text-unfpa-blue px-4 py-2 rounded-2xl border border-unfpa-blue/20">
                <TrendingUp className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">+210% Net Increase</span>
              </div>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={POP_GROWTH_DATA}>
                  <defs>
                    <linearGradient id="popGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0072BC" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0072BC" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} unit="M" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#0072BC" strokeWidth={5} fillOpacity={1} fill="url(#popGradient)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => toggleTab?.('quantum')}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-unfpa-blue/5 hover:border-unfpa-blue/20 transition-all text-left group/nav"
              >
                <Boxes className="w-4 h-4 text-unfpa-blue mb-2 group-hover/nav:scale-110 transition-transform" />
                <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Quantum Ops</p>
              </button>
              <button 
                onClick={() => toggleTab?.('political')}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-unfpa-blue/5 hover:border-unfpa-blue/20 transition-all text-left group/nav"
              >
                <Landmark className="w-4 h-4 text-amber-500 mb-2 group-hover/nav:scale-110 transition-transform" />
                <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Political Intelligence</p>
              </button>
              <button 
                onClick={() => toggleTab?.('predictive')}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-unfpa-blue/5 hover:border-unfpa-blue/20 transition-all text-left group/nav"
              >
                <Satellite className="w-4 h-4 text-rose-500 mb-2 group-hover/nav:scale-110 transition-transform" />
                <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Risk Prediction</p>
              </button>
              <button 
                onClick={() => toggleTab?.('megatrends')}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-unfpa-blue/5 hover:border-unfpa-blue/20 transition-all text-left group/nav"
              >
                <Globe2 className="w-4 h-4 text-emerald-500 mb-2 group-hover/nav:scale-110 transition-transform" />
                <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Megatrends</p>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] border border-card-border shadow-xl flex flex-col group/ledger">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 border-b border-slate-50 pb-4 flex items-center justify-between">
            Strategic Indicators Ledger
            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover/ledger:opacity-100 transition-opacity" />
          </h3>
          <div className="space-y-8 flex-1">
            <LedgerRow label="WCA Total Pop" value="530M" trend="+2.7%" />
            <LedgerRow label="Median Age" value="18.2" trend="-0.1yr" />
            <LedgerRow label="Dependency Ratio" value="84.2" trend="stable" />
            <LedgerRow label="Urban Share" value="44.2%" trend="+1.2%" />
            <div className="mt-auto pt-8 border-t border-slate-50">
               <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 relative overflow-hidden group/box">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/box:scale-125 transition-transform">
                    <ShieldCheck className="w-12 h-12 text-emerald-600" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-emerald-700 mb-2">
                      <ShieldCheck className="w-4 h-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Resilience Threshold</p>
                    </div>
                    <p className="text-xs text-emerald-800/80 font-medium leading-relaxed mb-4">
                      Sustainable development outcomes prioritized for 2026-2029 cycle.
                    </p>
                    <button 
                      onClick={() => toggleTab?.('outcome4')}
                      className="text-[9px] font-black text-emerald-700 uppercase tracking-widest hover:underline"
                    >
                      Deep Dive Resilience →
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <DataTile label="Youth Bulge" value="64%" subtitle="Under age 25" icon={<UsersRound className="w-4 h-4" />} color="blue" />
        <DataTile label="Urban Absorption" value="80%" subtitle="Growth in cities" icon={<Landmark className="w-4 h-4" />} color="orange" />
        <DataTile label="Digital Catalyst" value="230M" subtitle="Connectivity 2030" icon={<Zap className="w-4 h-4" />} color="purple" />
        <DataTile label="Climate Nexus" value="15M" subtitle="Displacements" icon={<AlertTriangle className="w-4 h-4" />} color="red" />
      </div>

      <div className="mt-12">
         <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-10 text-center">Strategic Performance Launchpad</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <LaunchCard 
              title="Family Planning" 
              subtitle="Strategic Outcome 1" 
              metric="Total Fertility Rate" 
              value="4.5" 
              color="blue" 
              onClick={() => toggleTab?.('outcome1')} 
              icon={<Target className="w-6 h-6" />}
            />
            <LaunchCard 
              title="Maternal Health" 
              subtitle="Strategic Outcome 2" 
              metric="Maternal Mort. Ratio" 
              value="452" 
              color="rose" 
              onClick={() => toggleTab?.('outcome2')} 
              icon={<HeartPulse className="w-6 h-6" />}
            />
            <LaunchCard 
              title="GBV Protection" 
              subtitle="Strategic Outcome 3" 
              metric="Harmful Practice Prev." 
              value="36.2%" 
              color="orange" 
              onClick={() => toggleTab?.('outcome3')} 
              icon={<ShieldAlert className="w-6 h-6" />}
            />
            <LaunchCard 
              title="Demographic Res." 
              subtitle="Strategic Outcome 4" 
              metric="Dependency Ratio" 
              value="84.2" 
              color="purple" 
              onClick={() => toggleTab?.('outcome4')} 
              icon={<TrendingUp className="w-6 h-6" />}
            />
         </div>
      </div>
    </div>
  );
}

function LaunchCard({ title, subtitle, metric, value, color, onClick, icon }: any) {
  const colorMap: any = {
    blue: "bg-unfpa-blue",
    rose: "bg-rose-500",
    orange: "bg-orange-500",
    purple: "bg-purple-600"
  };

  return (
    <button 
      onClick={onClick}
      className="group relative bg-white p-8 rounded-[2.5rem] border border-card-border shadow-sm hover:shadow-2xl transition-all text-left overflow-hidden hover:scale-[1.02]"
    >
      <div className={cn("absolute top-0 right-0 p-10 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-45 duration-700", colorMap[color].replace('bg-', 'text-'))}>
        {icon}
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className={cn("p-2.5 rounded-2xl text-white shadow-xl group-hover:scale-110 transition-transform", colorMap[color])}>
            {icon}
          </div>
          <div>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{subtitle}</p>
            <h4 className="text-sm font-black uppercase text-slate-900 tracking-tighter">{title}</h4>
          </div>
        </div>
        <div className="pt-6 border-t border-slate-50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{metric}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{value}</span>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </div>
        </div>
      </div>
    </button>
  );
}

function GBVSection({ toggleTab }: { toggleTab?: (tabId: string) => void }) {
  return (
    <div className="space-y-8">
      <div className="bg-white p-10 rounded-[3rem] border border-card-border shadow-xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-16 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-45 duration-[2000ms]">
          <ShieldAlert className="w-64 h-64 text-orange-500" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-xl">
             <div className="flex items-center gap-3 mb-6">
                <div className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-[9px] font-black uppercase tracking-widest">WCA Strategic Outcome 3</div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">GBV & Harmful Practices</h3>
             </div>
             <h4 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9] mb-4">Zero Gender-Based <br/> Violence & Practices</h4>
             <p className="text-lg text-slate-500 font-medium leading-relaxed">
               Accelerating actions to eliminate child marriage, FGM, and all forms of violence against women and girls in West and Central Africa.
             </p>
          </div>
          <div className="shrink-0 flex flex-col gap-3">
             <button 
               onClick={() => toggleTab?.('outcome4')}
               className="bg-purple-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.05] transition-all flex items-center gap-2 group"
             >
               Next: Demographic Resilience
               <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
             </button>
             <button 
               onClick={() => toggleTab?.('outcome2')}
               className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-unfpa-blue transition-colors text-center"
             >
               ← Maternal Health
             </button>
          </div>
        </div>
      </div>
        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-45 duration-1000">
          <ShieldAlert className="w-48 h-48 text-orange-500" />
        </div>
        <div className="relative z-10">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Outcome 3: GBV and Harmful Practices</h3>
          <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Protection & Rights Architecture</h4>
          <p className="text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
            Strengthening institutional response to GBV and eliminating harmful practices like FGM and child marriage 
            remain core priorities of the 2026-2029 Strategic Plan in WCA.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="p-6 bg-orange-50 rounded-[2rem] border border-orange-100">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">GBV Prevalence (12m)</p>
              <p className="text-4xl font-black text-orange-950 tracking-tighter">36.2%</p>
              <div className="mt-4 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                 <span className="text-[9px] font-bold text-orange-700 uppercase">Emergency Threshold</span>
              </div>
           </div>
           <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Response Hubs</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">142</p>
              <div className="mt-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Specialized Service Points</div>
           </div>
           <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Legal Protections</p>
              <p className="text-4xl font-black text-white tracking-tighter">18/23</p>
              <div className="mt-4 text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">Countries with Harmonized Laws</div>
           </div>
        </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white p-8 rounded-[2rem] border border-card-border shadow-sm">
            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Harmful Practices Monitor</h4>
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <span className="text-xs font-bold text-slate-600">Child Marriage (Before 18)</span>
                 <span className="text-sm font-black text-rose-600">38.4%</span>
               </div>
               <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} animate={{ width: '38.4%' }} className="h-full bg-orange-500" />
               </div>
               
               <div className="flex items-center justify-between">
                 <span className="text-xs font-bold text-slate-600">FGM/C Prevalence (15-49)</span>
                 <span className="text-sm font-black text-orange-600">22.1%</span>
               </div>
               <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} animate={{ width: '22.1%' }} className="h-full bg-orange-400" />
               </div>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2rem] border border-card-border shadow-sm relative overflow-hidden">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-unfpa-blue/10 rounded-2xl">
                   <Activity className="w-5 h-5 text-unfpa-blue" />
                </div>
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-tighter leading-none">Real-time Advocacy Flow</h4>
             </div>
             <p className="text-xs font-medium text-slate-500 leading-relaxed mb-6">
                Sentiment analysis of regional legislation indicates a move toward more robust protection frameworks.
             </p>
             <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-bold text-emerald-800 flex items-center gap-2">
                   <CheckCircle2 className="w-3 h-3" />
                   New Protection Bill Passed: Côle d'Ivoire (March 2026)
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-bold text-emerald-800 flex items-center gap-2">
                   <CheckCircle2 className="w-3 h-3" />
                   Regional Protocol Signed: ECOWAS Gender Center
                </div>
             </div>
         </div>
      </div>
    </div>
  );
}

function DemographicTrendsSection({ toggleTab }: { toggleTab?: (tabId: string) => void }) {
  return (
    <div className="space-y-8" id="section-demographic-trends">
      {/* Dark Theme Analytics Header */}
      <div className="bg-[#0A0A0B] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-16 opacity-10 scale-125 rotate-12 transition-transform group-hover:rotate-45 duration-[3000ms]">
          <UsersRound className="w-80 h-80 text-purple-600" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,#7c3aed15,transparent_50%)]" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="px-4 py-2 rounded-xl bg-purple-600/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-purple-600/10 font-mono italic">
                CORE_METRICS_v1.4
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10 shadow-sm backdrop-blur-md">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Structural Transition Logged</span>
              </div>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white leading-[0.8] mb-8 italic">
              Population <br/> Dynamics Hub
            </h2>
            <p className="text-lg font-medium text-white/50 leading-relaxed max-w-xl border-l-4 border-purple-600/30 pl-8 italic">
              Analyzing profound demographic structural shifts to ensure rights-based protections amidst rapid urbanization and generational transitions.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-8 bg-white/[0.03] rounded-[2.5rem] border border-white/10 backdrop-blur-2xl hover:bg-white/[0.05] transition-all group/stat shadow-inner">
               <h5 className="text-[9px] font-black text-purple-500 uppercase tracking-[0.2em] mb-4">Regional TFR</h5>
               <div className="flex items-baseline gap-2">
                 <p className="text-4xl font-black text-white tracking-tighter italic">4.8</p>
                 <span className="text-[11px] text-white/20 uppercase font-black tracking-widest">Index</span>
               </div>
               <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-4">Transitional Stability</p>
            </div>
            <div className="p-8 bg-white/[0.03] rounded-[2.5rem] border border-white/10 backdrop-blur-2xl hover:bg-white/[0.05] transition-all group/stat shadow-inner">
               <h5 className="text-[9px] font-black text-purple-500 uppercase tracking-[0.2em] mb-4">Youth Density</h5>
               <div className="flex items-baseline gap-2">
                 <p className="text-4xl font-black text-white tracking-tighter italic">64</p>
                 <span className="text-[12px] text-white/20 uppercase font-black">%</span>
               </div>
               <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-4">Under 25 Years</p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 flex items-center justify-between pt-12 border-t border-white/10">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => toggleTab?.('megatrends')}
                className="px-8 py-3.5 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-purple-600/30 hover:scale-[1.05] transition-all italic flex items-center gap-3"
              >
                Launch Megatrend Analysis
                <Zap className="w-5 h-5" />
              </button>
           </div>
           <div className="flex items-center gap-8">
              <div className="flex flex-col items-end">
                 <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Last Data Ingest</p>
                 <p className="text-[12px] font-black text-white uppercase tracking-widest">WCA_CENSUS_2026_Q1</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Pyramid Analysis */}
        <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-24 opacity-[0.03] rotate-12 translate-x-1/4">
              <BarChart3 className="w-96 h-96 text-purple-600" />
           </div>
           
           <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-16">
                 <div>
                    <div className="flex items-center gap-4 mb-4">
                       <span className="w-12 h-0.5 bg-purple-500" />
                       <h4 className="text-[12px] font-black text-purple-600 uppercase tracking-[0.3em] font-mono italic">Structure Matrix v1</h4>
                    </div>
                    <h3 className="text-5xl font-black uppercase tracking-tighter leading-none italic">
                      The "Youth Bulge" <br/> <span className="text-slate-300">Generational Projection</span>
                    </h3>
                 </div>
                 <div className="flex gap-4 p-4 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                    <LegendItem color="#0072BC" label="Male %" />
                    <LegendItem color="#F48120" label="Female %" />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
                 <div className="md:col-span-3 h-[500px] w-full bg-slate-50/50 rounded-[3rem] p-8 border border-slate-50 shadow-inner">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart
                         data={WCA_PYRAMID_DATA}
                         layout="vertical"
                         stackOffset="sign"
                         margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                       >
                         <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                         <XAxis type="number" hide />
                         <YAxis 
                            dataKey="age" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }}
                         />
                         <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} content={<PyramidTooltip />} />
                         <Bar dataKey="male" stackId="stack" fill="#0072BC" radius={[0, 4, 4, 0]} barSize={20} />
                         <Bar dataKey="female" stackId="stack" fill="#F48120" radius={[0, 4, 4, 0]} barSize={20} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
                 
                 <div className="md:col-span-2 space-y-10">
                    <div className="p-8 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden group/it shadow-2xl">
                       <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:scale-125 transition-transform duration-700">
                          <Activity className="w-32 h-32 text-purple-500" />
                       </div>
                       <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mb-6 italic underline decoration-purple-500/30 underline-offset-8">Insight Vector</p>
                       <p className="text-xl font-bold leading-tight italic relative z-10 text-white/90">
                          "A structural pivot where 64% of the population are under 25 creates an unprecedented generational opportunity for accelerated economic growth."
                       </p>
                       <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                             <span className="text-[9px] font-black uppercase text-white/40">Critical Opportunity Zone</span>
                          </div>
                          <Sparkles className="w-5 h-5 text-purple-500" />
                       </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200 shadow-inner">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 italic">Age Cohort Ledger</h4>
                       <div className="space-y-8">
                         <LedgerBar label="0-14 Years (Children)" value={44} color="#0072BC" />
                         <LedgerBar label="15-24 Years (Youth)" value={20} color="#F48120" />
                         <LedgerBar label="25-64 Years (Adults)" value={33} color="#10b981" />
                         <LedgerBar label="65+ Years (Elderly)" value={3} color="#a855f7" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Dependency & Resilience Sidecard */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl flex flex-col h-full relative overflow-hidden group/res shadow-inner">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000">
                 <ShieldCheck className="w-64 h-64 text-purple-600" />
              </div>
              
              <div className="relative z-10 flex-1 flex flex-col">
                 <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-purple-600 rounded-2xl shadow-xl shadow-purple-200">
                       <Compass className="w-6 h-6 text-white" />
                    </div>
                    <div>
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 italic">Structural Load</h4>
                       <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Dependency Dynamics</p>
                    </div>
                 </div>

                 <div className="flex-1 flex flex-col justify-center py-10">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Ratio Coefficient</span>
                       <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i <= 4 ? "bg-rose-500" : "bg-slate-100")} />
                          ))}
                       </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                       <p className="text-7xl font-black text-slate-900 tracking-tighter italic">84.2</p>
                       <p className="text-[14px] font-black text-rose-500 uppercase tracking-tighter leading-none italic underline decoration-rose-500/20 underline-offset-4">CRITICAL_HIGH</p>
                    </div>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed mt-6 italic">
                       Pressure on social infrastructure remains acute but is showing localized stabilization in coastal urban clusters.
                    </p>
                 </div>

                 <div className="mt-10 pt-10 border-t border-slate-100">
                    <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl group/btn overflow-hidden">
                       <div className="absolute -right-4 -bottom-4 p-8 opacity-10 group-hover/btn:scale-125 transition-transform duration-700">
                          <Zap className="w-32 h-32 text-purple-500" />
                       </div>
                       <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-4 text-white/40 italic">Insight Pulse</p>
                       <h4 className="text-2xl font-black uppercase tracking-tighter leading-none mb-6 italic">
                          Resilience <br/> Coefficient
                       </h4>
                       <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-6 shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '72%' }}
                            className="h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]" 
                          />
                       </div>
                       <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all italic">
                          Contextual Adaptation Report
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function FertilitySection({ toggleTab }: { toggleTab?: (tabId: string) => void }) {
  return (
    <div className="space-y-8">
      <div className="bg-white p-10 rounded-[3rem] border border-card-border shadow-xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-16 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-45 duration-[2000ms]">
          <Target className="w-64 h-64 text-blue-500" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-xl">
             <div className="flex items-center gap-3 mb-6">
                <div className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">WCA Strategic Outcome 1</div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Family Planning & Rights</h3>
             </div>
             <h4 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9] mb-4">Voluntary Fertility <br/> & SRHR Autonomy</h4>
             <p className="text-lg text-slate-500 font-medium leading-relaxed">
               Targeting 100% voluntary access to modern contraception and transformative SRH services across the region.
             </p>
          </div>
          <div className="shrink-0 flex flex-col gap-3">
             <button 
               onClick={() => toggleTab?.('outcome2')}
               className="bg-rose-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.05] transition-all flex items-center gap-2 group"
             >
               Next: Maternal Health
               <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
             </button>
             <button 
               onClick={() => toggleTab?.('overview')}
               className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-unfpa-blue transition-colors text-center"
             >
               Back to Overview
             </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-card-border shadow-sm">
        <div className="flex items-center justify-between mb-8">
           <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Fertility Trends & Comparisons (1.2)</h3>
              <p className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">TFR vs. mCPR by Strategic Sub-region</p>
           </div>
           <div className="flex gap-4">
              <LegendItem color="#0072BC" label="Total Fertility Rate (TFR)" />
              <LegendItem color="#F48120" label="mCPR %" />
           </div>
        </div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={FERTILITY_COMPARISON}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
              <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10}} unit="%" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="tfr" fill="#0072BC" radius={[6, 6, 0, 0]} barSize={40} />
              <Line yAxisId="right" type="monotone" dataKey="mcpr" stroke="#F48120" strokeWidth={4} dot={{ r: 6, fill: '#F48120' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-8 rounded-[2rem] border border-card-border shadow-sm">
            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Fertility Index Ledger</h4>
            <div className="space-y-4">
               <LedgerRow label="Adolescent birth rate (1.2.4)" value="114" trend="Critical" />
               <LedgerRow label="Unmet Need for FP (1.2.7)" value="24.2%" trend="+0.4%" />
               <LedgerRow label="Mean Age at Childbearing" value="28.4" trend="stable" />
               <LedgerRow label="Child Marriage (1.2.9)" value="38%" trend="-2.1%" />
               <LedgerRow label="GBV Reported Incidents" value="64%" trend="Elevated" />
            </div>
         </div>
         <div className="bg-unfpa-blue/5 border border-unfpa-blue/20 p-8 rounded-[2rem] flex flex-col">
            <BrainCircuit className="w-8 h-8 text-unfpa-blue mb-4" />
             <h4 className="text-lg font-black text-unfpa-blue uppercase mb-2">Sustainable Dev. Pathway</h4>
             <p className="text-sm text-unfpa-blue/80 leading-relaxed font-medium flex-1">
               Closing the gap between desired and actual fertility through expanded modern contraception (mCPR) 
               is the primary driver for demographic transition in the Sahel.
             </p>
             <div className="mt-6 flex items-center gap-2 text-unfpa-blue/40">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Strategy Validated</span>
             </div>
         </div>
      </div>
    </div>
  );
}

function MortalitySection({ toggleTab }: { toggleTab?: (tabId: string) => void }) {
  return (
    <div className="space-y-8">
      <div className="bg-white p-10 rounded-[3rem] border border-card-border shadow-xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-16 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-45 duration-[2000ms]">
          <HeartPulse className="w-64 h-64 text-rose-500" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-xl">
             <div className="flex items-center gap-3 mb-6">
                <div className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest">WCA Strategic Outcome 2</div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Maternal & Neonatal Health</h3>
             </div>
             <h4 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9] mb-4">Zero Preventable <br/> Maternal Deaths</h4>
             <p className="text-lg text-slate-500 font-medium leading-relaxed">
               Eliminating critical gaps in emergency obstetric care and ensuring safe delivery for every woman in WCA.
             </p>
          </div>
          <div className="shrink-0 flex flex-col gap-3">
             <button 
               onClick={() => toggleTab?.('outcome3')}
               className="bg-orange-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.05] transition-all flex items-center gap-2 group"
             >
               Next: GBV Protection
               <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
             </button>
             <button 
               onClick={() => toggleTab?.('outcome1')}
               className="text-[9px] font-black text-slate-400 font-medium uppercase tracking-widest hover:text-unfpa-blue transition-colors text-center"
             >
               ← FP Dynamics
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-card-border shadow-sm">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Pace of Mortality Reduction (1.3)</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MORTALITY_TRENDS}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <Tooltip />
              <Line type="monotone" dataKey="mmr" stroke="#F48120" strokeWidth={4} dot={{ r: 4 }} name="Maternal Mortality (MMR)" />
              <Line type="monotone" dataKey="imr" stroke="#0072BC" strokeWidth={4} dot={{ r: 4 }} name="Infant Mortality (IMR)" />
              <Legend verticalAlign="top" iconType="circle" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-slate-900 text-white p-8 rounded-[2rem] border border-white/5 flex flex-col">
        <h3 className="text-xs font-black text-unfpa-blue uppercase tracking-widest mb-8">Mortality Ledger</h3>
        <div className="space-y-8 flex-1">
           <div>
              <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Maternal Mortality (1.3.4)</p>
              <p className="text-3xl font-black text-white">440.0 <span className="text-xs text-white/20">per 100k</span></p>
              <p className="text-[10px] text-red-500 font-bold uppercase mt-1">Slow reduction pace</p>
           </div>
           <div>
              <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Neonatal Mortality (1.3.3)</p>
              <p className="text-3xl font-black text-white">32.4 <span className="text-xs text-white/20">per 1k</span></p>
              <p className="text-[10px] text-amber-500 font-bold uppercase mt-1">Stagnant trend</p>
           </div>
           <div className="pt-6 border-t border-white/10">
              <div className="flex items-center gap-3 text-white/80">
                 <HeartPulse className="w-5 h-5 text-red-500" />
                 <span className="text-[11px] font-black uppercase tracking-widest">Life Expectancy Hub</span>
              </div>
              <p className="text-[10px] text-white/40 mt-2 font-medium">
                Overall regional life expectancy has risen to 58.4 years, but remains highly socio-economically stratified.
              </p>
           </div>
        </div>
      </div>
    </div>
    </div>
  );
}

function DemographicResilienceSection({ toggleTab }: { toggleTab?: (tabId: string) => void }) {
  const [selectedFactor, setSelectedFactor] = useState(DEMOGRAPHIC_RESILIENCE_FACTORS[0]);

  return (
    <div className="space-y-8" id="section-outcome4">
      {/* Header Section */} 
      <div className="bg-unfpa-blue/5 p-12 rounded-[4rem] border border-unfpa-blue/20 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-16 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-45 duration-[2000ms]">
          <Target className="w-80 h-80 text-unfpa-blue" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_120%,#0072BC15,transparent_50%)]" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="px-4 py-2 rounded-xl bg-unfpa-blue/20 text-unfpa-blue text-[10px] font-black uppercase tracking-[0.25em] shadow-xl shadow-unfpa-blue/10 font-mono italic">
                STRATEGIC_OUTCOME_4
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-unfpa-blue/10 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Resilience Vectors Synchronized</span>
              </div>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-[0.8] mb-6 italic">
              Demographic <br/> Resilience Hub
            </h2>
            <p className="text-lg font-medium text-slate-500 leading-relaxed max-w-xl border-l-4 border-unfpa-blue/20 pl-8 italic">
              Mapping population adaptability to systemic shocks (climate, conflict, economic) to secure health and rights for the most vulnerable.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl group/card relative overflow-hidden">
               <div className="absolute top-0 left-0 w-2 h-full bg-unfpa-blue opacity-50" />
               <h5 className="text-[9px] font-black text-unfpa-blue uppercase tracking-[0.2em] mb-3">Vulnerability Index</h5>
               <p className="text-4xl font-black text-slate-900 tracking-tighter italic">78.2<span className="text-[11px] text-slate-300 uppercase not-italic ml-1">/100</span></p>
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-3">Elevated Risk Protocol</p>
            </div>
            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group/card">
               <div className="absolute top-0 left-0 w-2 h-full bg-unfpa-orange" />
               <h5 className="text-[9px] font-black text-unfpa-blue uppercase tracking-[0.2em] mb-3">Adaptation Readiness</h5>
               <p className="text-4xl font-black text-white tracking-tighter italic">High</p>
               <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-3">Capacity Optimized</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <button 
          onClick={() => toggleTab?.('predictive')}
          className="px-8 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-unfpa-blue hover:text-unfpa-blue transition-all flex items-center gap-3 shadow-sm"
        >
          <Compass className="w-5 h-5 opacity-40" />
          Predictive Labs
        </button>
        <button 
          onClick={() => toggleTab?.('quantum')}
          className="px-8 py-3.5 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/40 hover:scale-[1.05] transition-all flex items-center gap-3 italic"
        >
          <BrainCircuit className="w-5 h-5 text-unfpa-blue" />
          Quantum Tracker
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {DEMOGRAPHIC_RESILIENCE_FACTORS.map((factor) => (
          <button 
            key={factor.id}
            onClick={() => setSelectedFactor(factor)}
            className={cn(
              "p-10 rounded-[3.5rem] border-2 transition-all text-left relative overflow-hidden flex flex-col justify-between min-h-[440px] group/item shadow-inner",
              selectedFactor.id === factor.id 
                ? "bg-white border-unfpa-blue shadow-2xl scale-[1.01]" 
                : "bg-slate-50/50 border-slate-100 hover:border-unfpa-blue/30 hover:bg-white"
            )}
          >
             {selectedFactor.id === factor.id && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-unfpa-blue/5 -rotate-45 translate-x-12 -translate-y-12 transition-transform" />
             )}
             
             <div>
                <div className="flex items-center justify-between mb-10">
                  <div className={cn(
                    "p-4 rounded-2xl transition-all shadow-lg",
                    selectedFactor.id === factor.id ? "bg-unfpa-blue text-white shadow-unfpa-blue/30" : "bg-white text-slate-300 border border-slate-100"
                  )}>
                    {factor.icon}
                  </div>
                   <span className={cn(
                    "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic border",
                    factor.status === 'High' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                    factor.status === 'Medium' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100"
                  )}>
                    {factor.status}
                  </span>
                </div>
                
                <h4 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-[0.85] mb-2 group-hover/item:text-unfpa-blue transition-colors italic">
                  {factor.name}
                </h4>
                <p className="text-[11px] font-black text-unfpa-blue/60 uppercase tracking-[0.25em] mb-12 italic">
                  {factor.category}
                </p>
             </div>

             <div className="space-y-8">
               <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2 leading-none">Resilience Index</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-unfpa-blue italic tracking-tighter">{factor.score}</span>
                      <span className="text-[10px] font-black uppercase text-slate-400">%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2 leading-none">Impact Load</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900 italic tracking-tighter">{factor.impactLevel}</span>
                    </div>
                  </div>
               </div>
               
               <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trend: {factor.trend}</span>
                  </div>
                  <div className={cn(
                    "p-2 rounded-xl transition-all",
                    selectedFactor.id === factor.id ? "bg-unfpa-blue text-white" : "bg-slate-100 text-slate-300"
                  )}>
                    <ChevronRight className="w-4 h-4" />
                  </div>
               </div>
             </div>
          </button>
        ))}
      </div>

      {/* Detail Analysis Panel */}
      <motion.div 
        layout
        className="bg-white rounded-[4rem] p-12 shadow-2xl border border-slate-100 relative overflow-hidden"
      >
         <div className="absolute top-0 right-0 p-24 opacity-[0.03] rotate-12 -translate-x-1/4">
            <Target className="w-96 h-96 text-unfpa-blue" />
         </div>

         <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 mb-16">
               <div>
                  <div className="flex items-center gap-3 mb-4">
                     <span className="w-12 h-px bg-unfpa-blue" />
                     <h4 className="text-[12px] font-black text-unfpa-blue uppercase tracking-[0.4em] italic">Strategic Deep Dive</h4>
                  </div>
                  <h3 className="text-5xl font-black uppercase tracking-tighter leading-none italic">
                    {selectedFactor.name} <br/> <span className="text-slate-300">Resilience Analysis</span>
                  </h3>
               </div>
               
               <div className="flex items-center gap-6">
                  <div className="bg-slate-50 px-10 py-6 rounded-[2.5rem] border border-slate-100 text-center min-w-[200px] shadow-sm transform hover:scale-105 transition-transform">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Score</p>
                     <p className="text-5xl font-black text-unfpa-blue italic tracking-tighter">{selectedFactor.score}%</p>
                  </div>
                  <div className="bg-slate-900 px-10 py-6 rounded-[2.5rem] text-white text-center min-w-[200px] shadow-2xl transform hover:scale-105 transition-transform">
                     <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Impact</p>
                     <p className="text-5xl font-black text-white italic tracking-tighter">{selectedFactor.impactLevel}</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
               <div className="md:col-span-4 space-y-10">
                  <div className="relative p-8 bg-slate-50 rounded-[3rem] border border-slate-100 hover:bg-white transition-colors group/info">
                     <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover/info:scale-110 transition-transform">
                           {selectedFactor.icon}
                        </div>
                        <h5 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-900 underline decoration-unfpa-blue/30 decoration-4 underline-offset-4">Contextual Narrative</h5>
                     </div>
                     <p className="text-xl font-bold leading-tight text-slate-900 italic mb-10">{selectedFactor.description}</p>
                     
                     <div className="space-y-5">
                       {selectedFactor.details.map((detail, i) => (
                         <div key={i} className="flex items-start gap-4">
                            <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-unfpa-blue shrink-0 shadow-[0_0_8px_rgba(0,114,188,0.5)]" />
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-relaxed italic">{detail}</p>
                         </div>
                       ))}
                     </div>
                  </div>
               </div>

               <div className="md:col-span-8 bg-slate-50 rounded-[4rem] border border-slate-200 p-12 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-12">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-unfpa-blue/10 rounded-2xl">
                           <TrendingUp className="w-5 h-5 text-unfpa-blue" />
                        </div>
                        <div>
                           <h5 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-900 italic">Temporal Trajectory</h5>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Trend: {selectedFactor.trend}</p>
                        </div>
                     </div>
                     <div className="px-4 py-1.5 bg-white rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Q1 2026 Audit
                     </div>
                  </div>

                  {/* Placeholder for complex trend visual */}
                  <div className="h-[220px] bg-white rounded-[3rem] border border-slate-100 mb-12 relative overflow-hidden flex items-end px-12 pb-8 gap-4 group/chart shadow-inner">
                     <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                        <svg className="w-full h-full"><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" strokeWidth="1"/></pattern><rect width="100%" height="100%" fill="url(#grid)" /></svg>
                     </div>
                     {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                       <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                          <div className="w-full bg-slate-50 rounded-t-2xl relative transition-all group-hover/bar:bg-unfpa-blue/10" style={{ height: `${h}%` }}>
                             <motion.div 
                               initial={{ height: 0 }}
                               animate={{ height: '100%' }}
                               transition={{ delay: i * 0.1 }}
                               className="absolute inset-x-0 bottom-0 bg-unfpa-blue/40 rounded-t-full transition-all group-hover/bar:bg-unfpa-blue shadow-[0_-5px_15px_rgba(0,114,188,0.2)]" 
                             />
                          </div>
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">M0{i+1}</span>
                       </div>
                     ))}
                  </div>

                  <div className="bg-unfpa-blue p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group/alert shadow-unfpa-blue/30">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/alert:scale-125 transition-transform duration-1000">
                        <Lock className="w-24 h-24 text-white" />
                     </div>
                     <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="max-w-md">
                           <h6 className="text-[11px] font-black text-white/60 uppercase tracking-[0.3em] mb-3 italic">Policy Catalyst Recommendation</h6>
                           <p className="text-xl font-bold text-white leading-tight italic">
                             Synchronize local community preparedness frameworks with {selectedFactor.name} benchmarks to mitigate projected {selectedFactor.impactLevel.toLowerCase()} impact.
                           </p>
                        </div>
                        <button className="whitespace-nowrap px-10 py-4 bg-white text-unfpa-blue rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95 italic">
                          Action Roadmap
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                   <div className="flex -space-x-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-lg transform hover:translate-y-[-4px] transition-transform cursor-pointer">
                           <Users className="w-5 h-5 text-slate-400" />
                        </div>
                      ))}
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Panel Experts</p>
                      <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">Outcome 4 Global Advisory Board</p>
                   </div>
                </div>
                <div className="flex items-center gap-8">
                   <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-unfpa-blue transition-colors group/btn">
                      <FileText className="w-5 h-5 opacity-40 group-hover/btn:opacity-100" /> Executive Digest
                   </button>
                   <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-unfpa-blue transition-colors group/btn">
                      <Download className="w-5 h-5 opacity-40 group-hover/btn:opacity-100" /> Node Data (JSON)
                   </button>
                </div>
            </div>
         </div>
      </motion.div>
     </div>
  );
}

function MegatrendsSection({ toggleTab }: { toggleTab?: (tabId: string) => void }) {
  return (
    <div className="space-y-8">
      <div className="bg-slate-900 p-10 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-16 opacity-10 scale-150 rotate-12 transition-transform group-hover:rotate-45 duration-[2000ms]">
          <Globe2 className="w-64 h-64 text-emerald-500" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-xl">
             <div className="flex items-center gap-3 mb-6">
                <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">Strategic Horizons</div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Macro-Regional Forces</h3>
             </div>
             <h4 className="text-4xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-4">West & Central Africa <br/> Strategic Megatrends</h4>
             <p className="text-lg text-slate-400 font-medium leading-relaxed">
               Mapping the convergence of digitalization, urbanization, and environmental shifts that will define the continent's trajectory towards 2050.
             </p>
          </div>
          <div className="shrink-0 flex flex-col gap-3">
             <button 
               onClick={() => toggleTab?.('overview')}
               className="bg-unfpa-blue text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.05] transition-all flex items-center gap-2 group"
             >
               Strategic Overview
               <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
             </button>
             <button 
               onClick={() => toggleTab?.('predictive')}
               className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors text-center"
             >
               → Predictive Labs
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-card-border shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Megatrend Intensity Radar (Chapter 2)</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={MEGATRENDS_DATA}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <Radar name="Intensity" dataKey="value" stroke="#0072BC" fill="#0072BC" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2rem] border border-card-border shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                   <Building2 className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Urbanization & slums (2.1)</h3>
                   <p className="text-xl font-black text-slate-800 tracking-tighter">52% Slum Prevalence</p>
                </div>
             </div>
             <p className="text-xs text-slate-500 font-medium leading-relaxed">
               Urban growth is outpacing basic service infrastructure, creating "vulnerability pockets" in mega-cities like Lagos, Dakar, and Abidjan.
             </p>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-[1.6]">
                 <Smartphone className="w-32 h-32 text-unfpa-blue" />
              </div>
              <div className="relative z-10">
                 <h3 className="text-xs font-black text-unfpa-blue uppercase tracking-widest mb-6">Digitalization intersection (2.3)</h3>
                 <div className="space-y-4">
                    <p className="text-sm font-black text-white uppercase leading-tight">4G penetration reaching 64% in urban tiers</p>
                    <button className="text-[9px] font-black bg-white/10 hover:bg-white text-white hover:text-slate-900 px-4 py-2 rounded-full uppercase tracking-widest transition-all">
                       Explore Tech-Health Nexus
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
      
      {/* Forced Displacement Snapshot */}
      <div className="bg-red-50 p-10 rounded-[2.5rem] border border-red-100 flex flex-col md:flex-row items-center gap-8 shadow-sm">
         <div className="bg-red-500 p-5 rounded-[2rem] shadow-lg shadow-red-500/20">
            <Ship className="w-10 h-10 text-white" />
         </div>
         <div className="flex-1">
            <h3 className="text-xs font-black text-red-600/60 uppercase tracking-widest mb-2">Forced Displacement Ledger (2.2)</h3>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div>
                <h4 className="text-4xl font-black text-red-900 uppercase tracking-tighter leading-none mb-4">15 Million People</h4>
                <p className="text-red-900/60 text-sm font-bold max-w-xl">
                   Conflict-induced displacements across the Sahel and Lake Chad Basin remain the primary constraint to achieving UNFPA 3-Transformative results in WCA.
                </p>
              </div>
              <div className="shrink-0 pb-1">
                 <button 
                  onClick={() => toggleTab?.('outcome4')}
                  className="bg-red-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.05] transition-all flex items-center gap-2 group"
                >
                  Analyze Demographic Resilience
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </div>
         </div>
         <div className="flex gap-4">
            <MetricBox label="Refugees" value="2.4M" />
            <MetricBox label="IDPs" value="12.6M" />
         </div>
      </div>
    </div>
  );
}

function PredictiveModelingSection({ toggleTab }: { toggleTab?: (tabId: string) => void }) {
  const [selectedPrediction, setSelectedPrediction] = useState(PREDICTIVE_CRISIS_DATA[0]);

  return (
    <div className="space-y-12" id="section-predictive">
      <div className="bg-slate-900 p-8 rounded-[3rem] text-white italic">
         <h2 className="text-3xl font-black uppercase tracking-tighter">Predictive Analysis Hub</h2>
         <p className="mt-4 opacity-60">Scanning geopolitical horizon for humanitarian surges.</p>
         <button 
           onClick={() => toggleTab?.('quantum')}
           className="mt-8 px-8 py-4 bg-rose-600 rounded-2xl text-[10px] uppercase font-black tracking-widest"
         >
           Access Quantum
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PREDICTIVE_CRISIS_DATA.map((p) => (
          <button 
            key={p.id}
            onClick={() => setSelectedPrediction(p)}
            className={cn(
              "p-10 rounded-[3rem] border-2 transition-all text-left italic",
              selectedPrediction.id === p.id ? "bg-white border-rose-500 shadow-xl scale-105" : "bg-slate-50 border-transparent hover:border-slate-200"
            )}
          >
            <h4 className="text-2xl font-black uppercase tracking-tight mb-2 text-slate-900">{p.region}</h4>
            <div className="flex items-center justify-between text-sm font-black text-rose-600">
               <span>Prob: {p.srhSurgeProb}%</span>
               <span>{p.daysToImpact} Days</span>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white italic">
         <h3 className="text-3xl font-black uppercase tracking-widest mb-6">{selectedPrediction.region} Analysis</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
               <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2 font-mono">Displacement Flux</p>
               <p className="text-xl font-bold italic">{selectedPrediction.displacementVector}</p>
            </div>
            <div className="bg-white/5 p-8 rounded-2xl">
               <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-40">Priority Commodities</p>
               <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase">
                  {selectedPrediction.commodities.slice(0, 4).map((c, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5">{c}</div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

// --- SHARED UI COMPONENTS ---

function DataTile({ label, value, subtitle, icon, color }: any) {
  const colorMap: any = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    orange: 'text-orange-600 bg-orange-50 border-orange-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
    red: 'text-red-600 bg-red-50 border-red-100'
  };
  return (
    <div className={cn("p-8 rounded-[2rem] border shadow-sm flex flex-col h-full bg-white transition-all hover:scale-[1.02]", colorMap[color])}>
      <div className="p-2 w-fit rounded-xl bg-white shadow-sm border border-black/5 mb-4">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
      <div className="text-3xl font-black tracking-tighter mb-1">{value}</div>
      <p className="text-[10px] font-bold opacity-50 uppercase tracking-tight">{subtitle}</p>
    </div>
  );
}

function LedgerRow({ label, value, trend }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-black text-slate-800">{value}</span>
        <span className={cn(
          "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
          trend.startsWith('+') ? "bg-red-50 text-red-600" : trend.startsWith('-') ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
        )}>{trend}</span>
      </div>
    </div>
  );
}

function LedgerBar({ label, value, color }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black text-slate-500 uppercase">{label}</span>
        <span className="text-[10px] font-black text-slate-800">{value}%</span>
      </div>
      <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-2xl">
        <p className="text-[9px] font-black text-unfpa-blue uppercase mb-1">{data.year} Forecast</p>
        <p className="text-2xl font-black text-white leading-none">{data.value}M</p>
        <p className="text-[10px] text-white/40 uppercase font-bold mt-1">{data.label}</p>
      </div>
    );
  }
  return null;
}

function PyramidTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10">
        <p className="text-[10px] font-black text-unfpa-blue uppercase mb-2">Age Group: {payload[0].payload.age}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-8">
            <span className="text-[10px] font-bold text-white/50 uppercase">Male</span>
            <span className="text-xs font-black">{Math.abs(payload[0].payload.male)}%</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-[10px] font-bold text-white/50 uppercase">Female</span>
            <span className="text-xs font-black">{payload[0].payload.female}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function LegendItem({ color, label }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function MetricBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white/50 backdrop-blur-sm border border-red-200/50 p-4 rounded-2xl min-w-[100px]">
       <p className="text-[9px] font-black text-red-600/60 uppercase tracking-widest mb-1">{label}</p>
       <p className="text-xl font-black text-red-900">{value}</p>
    </div>
  );
}

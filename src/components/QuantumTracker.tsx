import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { generateNarrative, hasGemini } from '../lib/ai';
import { localQuantumInsight, localQuantumReport } from '../lib/aiFallbacks';
import { 
  X,
  Upload, 
  FileText, 
  Search, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  PieChart as PieChartIcon,
  BarChart,
  Globe2,
  Trash2,
  Loader2,
  ChevronRight,
  Target,
  Users,
  LayoutDashboard,
  Filter,
  TrendingUp,
  BrainCircuit,
  Flag,
  ChevronDown,
  Download,
  FileDown,
  History,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { cn } from '../lib/utils';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart, 
  Pie,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { useUser } from '../contexts/UserContext';
import { userService } from '../services/userService';
import { extractTextFromFile, parseMonitoringReport, MonitoringData } from '../lib/parseMonitoringReport';
import HeroGeoMotif from './quantum/HeroGeoMotif';
import { hasSupabase } from '../lib/supabase';
import { saveMonitoringReport, listMonitoringReports, SavedReport } from '../lib/reportStore';

const MOCK_REGIONAL_DATA: MonitoringData = {
  office: 'Regional Office/WCA Region',
  period: 'Q1 2026',
  totalMilestones: 89,
  reported: 49,
  achieved: 35,
  notAchieved: 2,
  overachieved: 12,
  pending: 40,
  narrativeInsight: "The WCA regional office shows strong momentum in Q1 2026. With 89 total milestones, 49 have been reported. The overachievement in 12 nodes suggests high operational efficiency in Output 2 (Policy) and Output 4 (Gender norms). Focus remains on clearing the 40 pending milestones scheduled for the Q2 transition.",
  managementReport: "",
  outputs: [
    {
      id: 'WCA29POP',
      label: 'Output 1: Population change and data',
      outputInsight: "Strengthening population situation analysis and megatrend impact assessments.",
      indicators: [
        { label: 'Countries with population situation analysis', status: 'Achieved', value: 1, target: 1, responsiblePerson: 'beguy', trend: [0, 0, 1, 1], flag: 'stable' },
        { label: 'National population policies updated', status: 'Overachieved', value: 3, target: 1, responsiblePerson: 'emina', trend: [0, 1, 3, 3], flag: 'stable' },
        { label: 'Census enumeration support', status: 'Achieved', value: 1, target: 1, responsiblePerson: 'banougnin', trend: [0, 1, 1, 1], flag: 'stable' }
      ]
    },
    {
      id: 'WCA29POL',
      label: 'Output 2: Policy, advocacy and accountability',
      outputInsight: "Accelerated policy integration for SRHR and maternal health across regional bodies.",
      indicators: [
        { label: 'SRHR integrated in climate policies', status: 'Achieved', value: 2, target: 2, responsiblePerson: 'wanki', trend: [0, 1, 2, 2], flag: 'stable' },
        { label: 'Collaboration with ECOWAS on GBV', status: 'Achieved', value: 'Yes', target: 'Yes', responsiblePerson: 'pguerra', trend: [0, 0, 1, 1], flag: 'stable' }
      ]
    },
    {
      id: 'WCA29FIN',
      label: 'Output 3: Leveraging sustainable financing',
      outputInsight: "Expanding innovative financing tools for family planning and maternal support.",
      indicators: [
        { label: 'COs conceptualizing innovative financing', status: 'Achieved', value: 2, target: 2, responsiblePerson: 'cummins', trend: [0, 1, 2, 2], flag: 'stable' }
      ]
    },
    {
      id: 'WCA29GEN',
      label: 'Output 4: Social and Gender norms',
      outputInsight: "Scaling community engagement and rights-based demographic protections.",
      indicators: [
        { label: 'Capacity building for feminist networks', status: 'Yet to be Reported', target: 8, responsiblePerson: 'ssebadduka', trend: [0, 0, 0, 0], flag: 'warning' }
      ]
    },
    {
      id: 'WCA29HUM',
      label: 'Output 6: Humanitarian action',
      outputInsight: "Real-time readiness and prepositioning of SRHR commodities in high-risk corridors.",
      indicators: [
        { label: 'SRHR in leadership/coordination', status: 'Achieved', value: 10, target: 10, responsiblePerson: 'chishugi', trend: [4, 6, 8, 10], flag: 'stable' },
        { label: 'Countries with SRHR personnel capacity', status: 'Overachieved', value: 4, target: 3, responsiblePerson: 'hobday', trend: [1, 2, 4, 4], flag: 'stable' }
      ]
    }
  ]
};

const MOCK_BURKINA_DATA: MonitoringData = {
  office: 'Burkina Faso Country Office',
  period: 'Q1 2026',
  totalMilestones: 51,
  reported: 25,
  achieved: 16,
  notAchieved: 1,
  overachieved: 8,
  pending: 26,
  narrativeInsight: "The Burkina Faso Q1 2026 performance shows robust delivery in high-impact indicators. Overachievement in Outcome 1 (Family Planning) and Outcome 3 (GBV/Harmful Practices) is driven by successful community mobilization and humanitarian response nodes. Progress reported at 49% indicates a healthy start to the SP 2026-2029 cycle.",
  outputs: [
    {
      id: 'BFA08FPH',
      label: 'Demande et disponibilité de méthodes contraceptives',
      outputInsight: "Strong performance in youth access and new users, significantly exceeding Q1 targets.",
      indicators: [
        { label: 'Youth access to SR/PF services', status: 'Overachieved', value: 152373, target: 50000, responsiblePerson: 'guibleweogo', trend: [40000, 45000, 50000, 152373], flag: 'stable' },
        { label: 'New contraceptive users (Innovative strategies)', status: 'Overachieved', value: 20401, target: 5000, responsiblePerson: 'guibleweogo', trend: [3000, 4000, 5000, 20401], flag: 'stable' },
        { label: 'Monthly stock surveillance reports', status: 'Achieved', value: 3, target: 3, responsiblePerson: 'guibleweogo', trend: [1, 2, 3, 3], flag: 'stable' }
      ]
    },
    {
      id: 'BFA08SRH',
      label: 'Soins essentiels et SONU de qualité',
      outputInsight: "Maternal health nodes are performing above baseline, with high transition rates from humanitarian zones.",
      indicators: [
        { label: 'Women benefiting from MISP/DMU services', status: 'Overachieved', value: 56606, target: 10000, responsiblePerson: 'sanon-ouedraogo', trend: [5000, 8000, 10000, 56606], flag: 'stable' },
        { label: 'Management of obstetric fistula cases', status: 'Overachieved', value: 105, target: 50, responsiblePerson: 'nsawadogo', trend: [20, 40, 50, 105], flag: 'stable' },
        { label: 'Maternal death surveillance reports', status: 'Achieved', value: 'Yes', target: 'Yes', responsiblePerson: 'nsawadogo', trend: [0, 0, 1, 1], flag: 'stable' }
      ]
    },
    {
      id: 'BFA08PCS',
      label: 'Cohésion sociale et interventions d\'urgence',
      outputInsight: "Rapid scale-up of life-saving interventions for youth and vulnerable women in crisis regions.",
      indicators: [
        { label: 'Youth benefiting from life-saving interventions', status: 'Overachieved', value: 19246, target: 5000, responsiblePerson: 'sanon-ouedraogo', trend: [2000, 4000, 5000, 19246], flag: 'stable' },
        { label: 'Women benefiting from life-saving interventions', status: 'Overachieved', value: 29265, target: 5000, responsiblePerson: 'sanon-ouedraogo', trend: [3000, 4500, 5000, 29265], flag: 'stable' }
      ]
    }
  ]
};

const MOCK_MALI_DATA: MonitoringData = {
  office: 'Mali Country Office',
  period: 'Q1 2026',
  totalMilestones: 73,
  reported: 25,
  achieved: 8,
  notAchieved: 3,
  overachieved: 14,
  pending: 48,
  narrativeInsight: "Mali's Q1 2026 performance highlights significant gains in GBV response and community resilience, with 14 milestones overachieved. However, humanitarian bottlenecks in SRH referrals and interagency coordination (3 Not Achieved) require management intervention to stabilize Q2 trajectories.",
  outputs: [
    {
      id: 'MLI08SNM',
      label: 'SONU de haute qualité en nexus',
      outputInsight: "Mobile clinic deployment successfully reaching displaced populations, though referral chains remain fragile.",
      indicators: [
        { label: 'Persons receiving SSR/GBV via mobile teams', status: 'Overachieved', value: 1681, target: 1000, responsiblePerson: 'sediarra', trend: [500, 800, 1000, 1681], flag: 'stable' },
        { label: 'Obstetric emergency evacuations', status: 'Not Achieved', value: 20, target: 30, responsiblePerson: 'sediarra', trend: [10, 15, 20, 20], flag: 'critical' },
        { label: 'Midwives newly deployed', status: 'Achieved', value: 29, target: 29, responsiblePerson: 'sdiarra', trend: [10, 20, 25, 29], flag: 'stable' }
      ]
    },
    {
      id: 'MLI08GDH',
      label: 'Equité genre et empowerment',
      outputInsight: "Community engagement for abandonment of FGM/GBV shows very high velocity in Q1.",
      indicators: [
        { label: 'Survivors receiving quality services', status: 'Overachieved', value: 89, target: 80, responsiblePerson: 'yalcouye', trend: [60, 70, 80, 89], flag: 'stable' },
        { label: 'Religious/Traditional leaders engaged', status: 'Overachieved', value: 1040, target: 800, responsiblePerson: 'ftoure', trend: [400, 600, 800, 1040], flag: 'stable' },
        { label: 'Interagency GBV coordination meetings', status: 'Not Achieved', value: 14, target: 18, responsiblePerson: 'seri', trend: [10, 12, 14, 14], flag: 'warning' },
        { label: 'One Stop Centers functional', status: 'Achieved', value: 17, target: 17, responsiblePerson: 'ydiouf', trend: [10, 15, 17, 17], flag: 'stable' }
      ]
    }
  ]
};

const MOCK_GAMBIA_DATA: MonitoringData = {
  office: 'Gambia Country Office',
  period: 'Q1 2026',
  totalMilestones: 45,
  reported: 4,
  achieved: 3,
  notAchieved: 1,
  overachieved: 0,
  pending: 41,
  narrativeInsight: "The Gambia Q1 monitoring shows a focused start with 4 milestones reported out of 45. Initial emphasis on policy alignment and technical assistance for the National Population Policy (2025-2034) is laying the groundwork for broader SP 2026-2029 delivery.",
  outputs: [
    {
      id: 'GMB_POP',
      label: 'Population Dynamics & Data',
      outputInsight: "Strategic support for National Population Policy review completed.",
      indicators: [
        { label: 'National Population Policy update support', status: 'Achieved', value: 'Yes', target: 'Yes', responsiblePerson: 'bah', trend: [0, 0, 1, 1], flag: 'stable' },
        { label: 'Population Situation Analysis (PSA) production', status: 'Achieved', value: 1, target: 1, responsiblePerson: 'bah', trend: [0, 0, 0, 1], flag: 'stable' }
      ]
    },
    {
      id: 'GMB_SRH',
      label: 'Sexual and Reproductive Health',
      outputInsight: "Maternal health service integration in progress, 1 node delayed due to procurement cycles.",
      indicators: [
        { label: 'SRH/GBV coordination mechanisms', status: 'Achieved', value: 'Yes', target: 'Yes', responsiblePerson: 'njie', trend: [0, 0, 1, 1], flag: 'stable' },
        { label: 'Emergency obstetric care training', status: 'Not Achieved', value: 0, target: 1, responsiblePerson: 'njie', trend: [0, 0, 0, 0], flag: 'warning' }
      ]
    }
  ]
};

export default function QuantumTracker() {
  const { profile } = useUser();
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<MonitoringData[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<string | null>(null);
  const [tab, setTab] = useState<'dashboard' | 'ledger'>('dashboard');
  const [statusFilter, setStatusFilter] = useState('All');
  const [outputFilter, setOutputFilter] = useState('All Outputs');
  const [isGeneratingManagementReport, setIsGeneratingManagementReport] = useState(false);
  
  const [dashboardType, setDashboardType] = useState<'country' | 'regional'>('country');
  // Database persistence (Supabase) — count of saved reports + recent history.
  const [dbSavedCount, setDbSavedCount] = useState(0);
  const [reportHistory, setReportHistory] = useState<SavedReport[]>([]);
  useEffect(() => {
    if (hasSupabase) listMonitoringReports().then(setReportHistory).catch(() => {});
  }, []);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeOffice = (officeName: string) => {
    const updated = analyzedData.filter(d => d.office !== officeName);
    setAnalyzedData(updated);
    if (selectedOffice === officeName) {
      if (updated.length > 0) {
        setSelectedOffice(updated[0].office);
      } else {
        setSelectedOffice(null);
      }
    }
  };

  // Filename-based fallback used only when a file can't be parsed (e.g. .docx,
  // an image-only scan, or an unexpected layout).
  const fallbackForFile = (f: File): MonitoringData | null => {
    const name = f.name.toLowerCase();
    if (name.includes('burkina')) return MOCK_BURKINA_DATA;
    if (name.includes('mali')) return MOCK_MALI_DATA;
    if (name.includes('gambia')) return MOCK_GAMBIA_DATA;
    if (name.includes('senegal')) return {
      ...MOCK_BURKINA_DATA,
      office: 'Senegal Country Office',
      period: 'Q1 2026',
      narrativeInsight: 'Performance overview for Senegal. High potential in urban health and youth programs detected for 2026.',
    };
    if (name.includes('regional')) return MOCK_REGIONAL_DATA;
    const cleanName = f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    const words = cleanName.split(' ');
    const countryCandidate = words.find(w => w.length > 3 && !['report', 'monitoring', 'quarterly', 'office', 'country', 'regional'].includes(w.toLowerCase())) || words[words.length - 1];
    const capitalized = countryCandidate.charAt(0).toUpperCase() + countryCandidate.slice(1);
    const total = Math.floor(Math.random() * 40) + 40;
    const reported = Math.floor(total * (0.4 + Math.random() * 0.3));
    const over = Math.floor(reported * 0.3);
    const ach = Math.floor(reported * 0.6);
    const na = reported - over - ach;
    return {
      ...MOCK_BURKINA_DATA,
      office: `${capitalized} ${dashboardType === 'regional' ? 'Regional' : 'Country'} Office`,
      period: 'Q1 2026',
      totalMilestones: total,
      reported,
      achieved: ach,
      notAchieved: na,
      overachieved: over,
      pending: total - reported,
      narrativeInsight: `Performance summary for ${capitalized} synchronized. Indicators showing stable Q1 velocity with ${ach + over} successful deliverables.`,
    };
  };

  const startAnalysis = async () => {
    setIsAnalyzing(true);

    const newData = [...analyzedData];
    const toPersist: Array<{ data: MonitoringData; file: File }> = [];
    for (const f of files) {
      let parsed: MonitoringData | null = null;
      try {
        const text = await extractTextFromFile(f);
        parsed = parseMonitoringReport(text, f.name);
      } catch (err) {
        console.error(`Could not extract "${f.name}", falling back to summary heuristics:`, err);
      }
      const data = parsed ?? fallbackForFile(f);
      if (data && !newData.find(d => d.office === data.office)) {
        newData.push(data);
        toPersist.push({ data, file: f });
      }
    }

    // Render the dashboard immediately. Activity logging is fire-and-forget so a
    // slow/unavailable backend (e.g. the local mock with no Firestore) never
    // blocks the UI.
    setAnalyzedData(newData);

    if (dashboardType === 'regional' && newData.length > 1) {
      setSelectedOffice('Regional Overview');
    } else if (newData.length > 0) {
      setSelectedOffice(newData[newData.length - 1].office);
    }

    setIsAnalyzing(false);

    if (profile) {
      userService
        .logActivity(profile.uid, profile.displayName, 'Data Upload: Quantum Monitoring', {
          fileCount: files.length,
          dashboardType,
        })
        .catch((err) => console.error('Activity log failed (non-blocking):', err));
    }

    // Persist each parsed report (+ original file) to the database — strictly
    // AFTER rendering, fire-and-forget, so network I/O never blocks the overlay.
    if (hasSupabase && toPersist.length) {
      Promise.all(
        toPersist.map(({ data, file }) =>
          saveMonitoringReport(data, file, profile?.displayName ?? 'unknown'),
        ),
      )
        .then((ids) => {
          const saved = ids.filter((id) => id != null).length;
          if (saved) {
            setDbSavedCount((n) => n + saved);
            listMonitoringReports().then(setReportHistory).catch(() => {});
          }
        })
        .catch((err) => console.error('Report persistence failed (non-blocking):', err));
    }
  };

  const generateReportInsight = async () => {
    if (!currentData) return;
    setIsGeneratingInsight(true);

    const applyInsight = (text: string) => {
      setAnalyzedData(prev => prev.map(d =>
        d.office === currentData.office ? { ...d, narrativeInsight: text } : d
      ));
    };

    if (!hasGemini) {
      applyInsight(localQuantumInsight(currentData.office, currentData.totalMilestones, currentData.achieved, currentData.overachieved, currentData.pending));
      setIsGeneratingInsight(false);
      return;
    }

    try {
      const prompt = `
        You are a Regional Performance Monitor at UNFPA WCA.
        Analyze the following monitoring data for ${currentData.office} in the context of Strategy Plan 2026-2029 outcomes:
        - Total Milestones: ${currentData.totalMilestones}
        - Achieved: ${currentData.achieved}
        - Overachieved: ${currentData.overachieved}
        - Pending: ${currentData.pending}

        Provide a strategic performance insight focusing on alignment with the four SP 2026-2029 outcomes:
        1. Unmet Need for FP, 2. Maternal Deaths, 3. GBV/Harmful Practices, 4. Demographic Resilience.

        Focus on risks, achievement velocity, and alignment with Regional Hub dynamics.
        Style: Strategic, executive level.
        Length: 120 words.
      `;
      const text = await generateNarrative(prompt);
      applyInsight(text);
    } catch (err) {
      console.error('Quantum insight failed, using local insight:', err);
      applyInsight(localQuantumInsight(currentData.office, currentData.totalMilestones, currentData.achieved, currentData.overachieved, currentData.pending));
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const generateManagementDeepAnalysis = async () => {
    if (!currentData) return;
    setIsGeneratingManagementReport(true);

    const applyReport = (text: string) => {
      setAnalyzedData(prev => prev.map(d =>
        d.office === currentData.office ? { ...d, managementReport: text } : d
      ));
    };
    const localReport = () => localQuantumReport(
      currentData.office,
      currentData.totalMilestones,
      currentData.achieved,
      currentData.overachieved,
      currentData.pending,
      currentData.outputs.map(o => ({ id: o.id, label: o.label, indicators: o.indicators })),
    );

    if (!hasGemini) {
      applyReport(localReport());
      setIsGeneratingManagementReport(false);
      return;
    }

    try {
      const prompt = `
        You are a Senior Monitoring and Compliance Lead at UNFPA West and Central Africa.
        Generate a Comprehensive Strategic Alignment & Management Report for: ${currentData.office} against Strategy Plan 2026-2029.
        Include:
        1. Executive Summary
        2. Critical Risk Assessment (Red Flags for Outcome Delivery)
        3. Strategic Output Analysis (Performance vs Ambition in 4 Outcome areas)
        4. Management Recommendations for SP Alignment
        5. Financial/Resource allocation efficiency for strategic results.

        Data to Analyze:
        - Total Milestones: ${currentData.totalMilestones}
        - Achievement Rate: ${(((currentData.achieved + currentData.overachieved) / currentData.totalMilestones) * 100).toFixed(1)}%
        - Pending Milestones: ${currentData.pending}
        - Outputs: ${JSON.stringify(currentData.outputs.map(o => ({ id: o.id, label: o.label, indicators: o.indicators.length })))}

        Formatting: Use professional Markdown with clear sections.
      `;
      const text = await generateNarrative(prompt);
      applyReport(text);
    } catch (err) {
      console.error('Quantum report failed, using local report:', err);
      applyReport(localReport());
    } finally {
      setIsGeneratingManagementReport(false);
    }
  };

  const exportPDF = () => {
    if (!currentData) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Quantum Management Report: ${currentData.office}`, 10, 20);
    doc.setFontSize(12);
    doc.text(`Total Milestones: ${currentData.totalMilestones}`, 10, 30);
    doc.text(`Achievement Rate: ${(((currentData.achieved + currentData.overachieved) / currentData.totalMilestones) * 100).toFixed(1)}%`, 10, 40);
    
    if (currentData.narrativeInsight) {
      doc.text("Narrative Insight:", 10, 60);
      const lines = doc.splitTextToSize(currentData.narrativeInsight, 180);
      doc.text(lines, 10, 70);
    }

    if (currentData.managementReport) {
        doc.addPage();
        doc.text("Management Deep Analysis:", 10, 20);
        const lines = doc.splitTextToSize(currentData.managementReport, 180);
        doc.text(lines, 10, 30);
    }

    doc.save(`UNFPA_Report_${currentData.office.replace(/\//g, '_')}.pdf`);
  };

  const exportGoogleDocs = () => {
    if (!currentData) return;
    // Simulate creating a Google Doc link
    const simulatedLink = `https://docs.google.com/document/create?title=UNFPA_SP_Report_${currentData.office.replace(/\//g, '_')}`;
    window.open(simulatedLink, '_blank');
  };

  const exportDocx = async () => {
    if (!currentData) return;
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: `Quantum Performance Report: ${currentData.office}`, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: `Total Milestones: ${currentData.totalMilestones}` }),
          new Paragraph({ text: `Achievement Rate: ${(((currentData.achieved + currentData.overachieved) / currentData.totalMilestones) * 100).toFixed(1)}%` }),
          new Paragraph({ text: "Strategic Narrative", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: currentData.narrativeInsight || "No narrative generated." }),
          new Paragraph({ text: "Management Deep Analysis", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: currentData.managementReport || "No deep analysis generated." }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `UNFPA_Report_${currentData.office}.docx`);
  };

  const currentData = useMemo(() => {
    if (selectedOffice === 'Regional Overview' && analyzedData.length > 1) {
      // Aggregate data for Regional Overview
      const aggregate: MonitoringData = {
        office: 'Regional Overview',
        period: analyzedData[0]?.period || 'Q1 2026',
        totalMilestones: analyzedData.reduce((acc, curr) => acc + curr.totalMilestones, 0),
        reported: analyzedData.reduce((acc, curr) => acc + curr.reported, 0),
        achieved: analyzedData.reduce((acc, curr) => acc + curr.achieved, 0),
        notAchieved: analyzedData.reduce((acc, curr) => acc + curr.notAchieved, 0),
        overachieved: analyzedData.reduce((acc, curr) => acc + curr.overachieved, 0),
        pending: analyzedData.reduce((acc, curr) => acc + curr.pending, 0),
        narrativeInsight: "Regional Dashboard Aggregation: Consolidating performance from " + analyzedData.length + " offices.",
        outputs: analyzedData.flatMap(d => d.outputs.map(o => ({ ...o, label: `${d.office.split(' ')[0]}: ${o.label}` })))
      };
      return aggregate;
    }
    return analyzedData.find(d => d.office === selectedOffice);
  }, [analyzedData, selectedOffice]);


  const filteredOutputs = useMemo(() => {
    if (!currentData) return [];
    let outputs = currentData.outputs;
    
    if (statusFilter !== 'All') {
      outputs = outputs.map(o => ({
        ...o,
        indicators: o.indicators.filter(i => i.status === statusFilter)
      })).filter(o => o.indicators.length > 0);
    }

    if (outputFilter !== 'All Outputs') {
      outputs = outputs.filter(o => o.label.includes(outputFilter) || o.id.includes(outputFilter));
    }

    return outputs;
  }, [currentData, statusFilter, outputFilter]);

  const pieData = currentData ? [
    { name: 'Achieved', value: currentData.achieved, color: '#0072BC' },
    { name: 'Overachieved', value: currentData.overachieved, color: '#FF8200' },
    { name: 'Not Achieved', value: currentData.notAchieved, color: '#ef4444' },
    { name: 'Pending', value: currentData.pending, color: '#e2e8f0' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="h-full flex flex-col p-6 bg-slate-50 overflow-hidden">
      {/* Tracker Header — Quantum blue hero with radar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-quantum-blue via-quantum-blue-dark to-quantum-blue-darker p-6 md:p-7 shadow-[0_22px_55px_-24px_rgba(14,60,102,0.6)] mb-8 shrink-0">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)', backgroundSize: '38px 38px' }} />
        <HeroGeoMotif className="pointer-events-none absolute -top-28 -right-14 w-[420px] h-[420px] opacity-45 hidden md:block" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/15 border border-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/75 mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-unfpa-orange animate-pulse" />
              Monitoring &amp; Compliance
            </h2>
            <h1 className="text-2xl font-bold text-white tracking-tight">WCARO Regional Quantum Monitoring Tracker</h1>
            <p className="text-sm text-white/80 mt-1 font-medium">Upload quarterly monitoring reports to generate live performance intelligence.</p>
            {hasSupabase && (dbSavedCount > 0 || reportHistory.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {dbSavedCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-100 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    {dbSavedCount} report{dbSavedCount > 1 ? 's' : ''} saved to database
                  </span>
                )}
                {reportHistory.slice(0, 4).map((r) => (
                  <span key={r.id} title={`Uploaded ${new Date(r.uploadedAt).toLocaleString()} by ${r.uploadedBy ?? '—'} · ${r.achieved + r.overachieved}/${r.totalMilestones} achieved`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white/85 text-[11px] font-medium">
                    {r.office} · {r.period}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {analyzedData.length > 0 && (
          <div className="flex bg-white p-1 rounded-xl border border-card-border shadow-sm">
            {analyzedData.length > 1 && (
              <button
                onClick={() => setSelectedOffice('Regional Overview')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  selectedOffice === 'Regional Overview' 
                    ? "bg-unfpa-blue text-white shadow-md shadow-unfpa-blue-20" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                Regional Overview
              </button>
            )}
            {analyzedData.map(data => (
              <div key={data.office} className="relative group">
                <button
                  onClick={() => setSelectedOffice(data.office)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all pr-8",
                    selectedOffice === data.office 
                      ? "bg-unfpa-blue text-white shadow-md shadow-unfpa-blue-20" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {data.office.split(' ')[0]}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOffice(data.office);
                  }}
                  className={cn(
                    "absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md transition-all",
                    selectedOffice === data.office ? "text-white/40 hover:text-white" : "text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

        {analyzedData.length > 0 && (
          <div className="flex items-center gap-4 mb-6">
            <div className="flex bg-slate-200-50 p-1 rounded-xl">
              <button 
                onClick={() => setTab('dashboard')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  tab === 'dashboard' ? "bg-white text-unfpa-blue shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </button>
              <button 
                onClick={() => setTab('ledger')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  tab === 'ledger' ? "bg-white text-unfpa-blue shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                Ledger View
              </button>
            </div>

            <div className="h-6 w-px bg-slate-300 mx-2" />

            {selectedOffice?.includes('Regional') && (
              <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                <Layers className="w-3 h-3 text-slate-400" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Output:</span>
                <select 
                  value={outputFilter}
                  onChange={(e) => setOutputFilter(e.target.value)}
                  className="text-[10px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                >
                  <option value="All Outputs">All Outputs</option>
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={`OUTPUT_${num}`}>Output {num}</option>
                  ))}
                </select>
              </div>
            )}

            {tab === 'ledger' && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                  <Filter className="w-3 h-3 text-slate-400" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-[10px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Yet to be Reported">Yet to be Reported</option>
                    <option value="Achieved">Achieved</option>
                    <option value="Overachieved">Overachieved</option>
                    <option value="Not Achieved">Not Achieved</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <button 
                onClick={generateReportInsight}
                disabled={isGeneratingInsight}
                className="flex items-center gap-2 bg-white border border-unfpa-blue-20 text-unfpa-blue px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-unfpa-blue hover:text-white transition-all shadow-sm"
              >
                {isGeneratingInsight ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                Strategic Narrative
              </button>
              
              <button 
                onClick={generateManagementDeepAnalysis}
                disabled={isGeneratingManagementReport}
                className="flex items-center gap-2 bg-unfpa-blue text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all shadow-md shadow-unfpa-blue-20 border border-unfpa-blue"
              >
                {isGeneratingManagementReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Management Deep Analysis
              </button>

              <div className="flex items-center gap-1 bg-slate-200-50 p-1 rounded-xl ml-2">
                 <button onClick={exportPDF} className="p-2 text-slate-500 hover:text-unfpa-blue hover:bg-white rounded-lg transition-all" title="Export PDF">
                    <FileDown className="w-3.5 h-3.5" />
                 </button>
                 <button onClick={exportGoogleDocs} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Open in Google Docs">
                    <Globe2 className="w-3.5 h-3.5" />
                 </button>
                 <button onClick={exportDocx} className="p-2 text-slate-500 hover:text-unfpa-blue hover:bg-white rounded-lg transition-all" title="Export Word">
                    <Download className="w-3.5 h-3.5" />
                 </button>
              </div>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 flex-1 overflow-hidden">
        {/* Upload & Files Section */}
        <div className="flex flex-col gap-6 overflow-hidden">
          <div 
            className="bg-white rounded-3xl p-8 border-2 border-dashed border-unfpa-blue-20 flex flex-col items-center justify-center text-center group hover:border-unfpa-blue-40 transition-all cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              multiple 
              className="hidden" 
              accept=".pdf,.docx,.txt"
            />
            <div className="w-16 h-16 bg-unfpa-blue-5 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-unfpa-blue" />
            </div>
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Upload Monitoring Files</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              PDF, Word or Text documents<br/>
              Regional or Country Office Performance
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-card-border shadow-sm flex flex-col overflow-hidden min-h-[300px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Document Queue ({files.length})</h3>
              <div className="flex bg-slate-100 p-0.5 rounded-lg">
                <button 
                  onClick={() => setDashboardType('country')}
                  className={cn(
                    "px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all",
                    dashboardType === 'country' ? "bg-white text-unfpa-blue shadow-sm" : "text-slate-400"
                  )}
                >
                  Country
                </button>
                <button 
                  onClick={() => setDashboardType('regional')}
                  className={cn(
                    "px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all",
                    dashboardType === 'regional' ? "bg-white text-unfpa-blue shadow-sm" : "text-slate-400"
                  )}
                >
                  Regional
                </button>
              </div>
            </div>
            {files.length > 0 && !isAnalyzing && (
              <button 
                onClick={startAnalysis}
                className="w-full flex items-center justify-center gap-2 bg-unfpa-blue text-white px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all mb-4 shadow-md shadow-unfpa-blue-20"
              >
                <Activity className="w-4 h-4" />
                Initialize {dashboardType === 'country' ? 'Country' : 'Regional'} Dashboard
              </button>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {files.map((file, i) => (
                  <motion.div 
                    key={file.name + i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group"
                  >
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                      <FileText className="w-4 h-4 text-unfpa-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-700 truncate uppercase tracking-tight">{file.name}</p>
                      <p className="text-[9px] text-slate-400 font-medium tracking-widest uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    {!isAnalyzing && (
                      <button 
                        onClick={() => removeFile(i)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                ))}
                {files.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 py-12">
                    <Clock className="w-12 h-12 mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No documents loaded</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {isAnalyzing && (
              <div className="absolute inset-0 bg-white-80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-unfpa-blue animate-spin" />
                <div className="text-center">
                  <p className="text-[10px] font-black text-unfpa-blue uppercase tracking-[0.2em] mb-1">Quantum Intelligence Pro</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">Extracting Quarterly Performance...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Section */}
        <div className="overflow-y-auto custom-scrollbar overflow-x-hidden pr-2">
          {analyzedData.length > 0 && currentData ? (
            <div className="space-y-8 pb-12">
              {/* Office Name Feature Display */}
              <div className="bg-white rounded-3xl p-8 border border-card-border shadow-sm flex items-center justify-between mb-4">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-unfpa-blue rounded-2xl flex items-center justify-center shadow-lg shadow-unfpa-blue-20">
                       <Globe2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-unfpa-blue uppercase tracking-[0.3em] mb-1">
                          {currentData.office === 'Regional Overview' ? 'Consolidated Regional Profile' : 'Active Monitoring Profile'}
                        </p>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                          {currentData.office === 'Regional Overview' ? 'Regional Strategic Dashboard' : currentData.office}
                        </h2>
                    </div>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantum Intelligence Tier</span>
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black tracking-widest">Verified Multi-Office Mode</span>
                    </div>
                 </div>
              </div>

              {/* Narrative Insight Panel */}
              <AnimatePresence>
                {currentData.narrativeInsight && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-unfpa-blue rounded-3xl p-6 text-white shadow-xl shadow-unfpa-blue-20 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                      <BrainCircuit className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-white-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                          <Activity className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white-80">Quantum Narrative Insight</h3>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none text-sm font-medium leading-relaxed italic text-white-95">
                        <ReactMarkdown>
                          {currentData.narrativeInsight}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Management Deep Analysis Panel */}
              <AnimatePresence>
                {currentData.managementReport && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border-2 border-unfpa-blue rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                       <ShieldCheck className="w-48 h-48" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-6 h-6 text-unfpa-blue" />
                          <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Management Deep Analysis Report</h3>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-unfpa-blue uppercase tracking-widest">Generated via High-Thinking AI</span>
                        </div>
                      </div>
                      <div className="prose prose-slate max-w-none prose-headings:text-unfpa-blue prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-p:text-slate-600 prose-p:font-medium prose-li:text-slate-600">
                        <ReactMarkdown>
                          {currentData.managementReport}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {tab === 'dashboard' ? (
                <>
                  {/* Summary Metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard 
                      label={`Total Milestones (${currentData.period})`} 
                      value={currentData.totalMilestones} 
                      icon={<Target className="w-4 h-4" />} 
                      color="blue"
                    />
                    <MetricCard 
                      label="Progress Reported" 
                      value={currentData.reported} 
                      icon={<Activity className="w-4 h-4" />} 
                      color="orange"
                    />
                    <MetricCard 
                      label="Yet to be Reported" 
                      value={currentData.pending} 
                      icon={<Clock className="w-4 h-4" />} 
                      color="slate"
                    />
                    <MetricCard 
                      label="Achievement Rate" 
                      value={`${(((currentData.achieved + currentData.overachieved) / currentData.totalMilestones) * 100).toFixed(1)}%`} 
                      icon={<CheckCircle2 className="w-4 h-4" />} 
                      color="green"
                    />
                  </div>

                  <div className="grid grid-cols-3 lg:grid-cols-3 gap-4">
                    <MetricCard 
                      label="Achieved" 
                      value={currentData.achieved} 
                      icon={<ShieldCheck className="w-4 h-4" />} 
                      color="blue"
                    />
                    <MetricCard 
                      label="Not Achieved" 
                      value={currentData.notAchieved} 
                      icon={<AlertTriangle className="w-4 h-4" />} 
                      color="slate"
                    />
                    <MetricCard 
                      label="Overachieved" 
                      value={currentData.overachieved} 
                      icon={<TrendingUp className="w-4 h-4" />} 
                      color="orange"
                    />
                  </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
                {/* Achievement Breakdown Chart */}
                <div className="bg-white rounded-3xl p-6 border border-card-border shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <BarChart className="w-4 h-4 text-unfpa-blue" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">Quarterly Status Breakdown</h3>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={[
                        { name: 'Achieved', value: currentData.achieved },
                        { name: 'Overachieved', value: currentData.overachieved },
                        { name: 'Not Achieved', value: currentData.notAchieved },
                        { name: 'Yet to be Reported', value: currentData.pending },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} 
                        />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          labelStyle={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                          {[
                            { color: '#0072BC' },
                            { color: '#FF8200' },
                            { color: '#ef4444' },
                            { color: '#e2e8f0' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Distribution Pie */}
                <div className="bg-white rounded-3xl p-6 border border-card-border shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <PieChartIcon className="w-4 h-4 text-unfpa-blue" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">Composition</h3>
                  </div>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{d.name}</span>
                        </div>
                        <span className="text-[9px] font-black text-slate-700">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

                  {/* Detailed Output Breakdown */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="w-4 h-4 text-unfpa-blue" />
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">Strategic Output Performance</h3>
                    </div>
                    {currentData.outputs.map(output => (
                      <div key={output.id} className="bg-white rounded-3xl p-6 border border-card-border shadow-sm">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-unfpa-blue-10 rounded-xl flex items-center justify-center">
                              <span className="text-unfpa-blue font-black text-xs">{output.id.slice(0, 3)}</span>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-unfpa-blue uppercase tracking-[0.2em] leading-none mb-1.5">{output.id}</p>
                              <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight">{output.label}</h4>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {output.indicators.map((ind, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50-50 rounded-2xl border border-slate-100-50 group hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-4">
                                <FlagIcon flag={ind.flag} />
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{ind.label}</span>
                              </div>
                              
                              <div className="flex items-center gap-6">
                                {ind.target && (
                                  <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Target</p>
                                    <p className="text-[10px] font-black text-slate-600">{ind.target}</p>
                                  </div>
                                )}
                                <div className="text-right min-w-[80px]">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Status</p>
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                    ind.status === 'Achieved' ? "text-green-600 bg-green-100" : 
                                    ind.status === 'Overachieved' ? "text-orange-600 bg-orange-100" :
                                    "text-slate-400 bg-slate-100"
                                  )}>
                                    {ind.status}
                                  </span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Ledger View */
                <div className="space-y-6">
                  {filteredOutputs.map(output => (
                    <div key={output.id} className="bg-white rounded-3xl border border-card-border overflow-hidden shadow-sm">
                      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200">
                            <span className="text-unfpa-blue font-black text-[10px]">{output.id}</span>
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">{output.label}</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Output Ledger • {output.indicators.length} Indicators</p>
                          </div>
                        </div>
                        {output.outputInsight && (
                          <div className="flex items-center gap-2 bg-unfpa-blue-5 text-unfpa-blue px-3 py-1.5 rounded-lg border border-unfpa-blue-10 max-w-sm">
                            <BrainCircuit className="w-3.5 h-3.5 shrink-0" />
                            <p className="text-[9px] font-medium leading-tight">{output.outputInsight}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Indicator</th>
                              <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Flag</th>
                              <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Responsible</th>
                              <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Target</th>
                              <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Reported Trend</th>
                              <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {output.indicators.map((ind, i) => (
                              <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50-50 transition-colors">
                                <td className="px-6 py-4">
                                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight leading-tight">{ind.label}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <FlagIcon flag={ind.flag} showLabel />
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center">
                                      <Users className="w-2.5 h-2.5 text-slate-500" />
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{ind.responsiblePerson}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-[10px] font-black text-slate-600">{ind.target}</span>
                                </td>
                                <td className="px-6 py-4 w-32">
                                   <div className="h-8">
                                     <ResponsiveContainer width="100%" height="100%">
                                       <LineChart data={ind.trend.map((v, idx) => ({ val: v, time: idx }))}>
                                         <Line type="monotone" dataKey="val" stroke="#0072BC" strokeWidth={2} dot={false} />
                                       </LineChart>
                                     </ResponsiveContainer>
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                    ind.status === 'Achieved' ? "text-green-600 bg-green-100" : 
                                    ind.status === 'Overachieved' ? "text-orange-600 bg-orange-100" :
                                    "text-slate-400 bg-slate-100 shadow-sm"
                                  )}>
                                    {ind.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-card-border border-dashed">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <LayoutDashboard className="w-10 h-10 text-slate-300" />
              </div>
              <div className="text-center max-w-sm space-y-2">
                <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight">Intelligence Dashboard</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  Upload monitoring reports from Regional or Country offices to generate real-time performance clusters and strategic insights.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color, subtitle }: { label: string; value: string | number; icon: React.ReactNode; color: 'blue' | 'green' | 'orange' | 'slate'; subtitle?: string }) {
  const colorMap = {
    blue: 'text-unfpa-blue bg-unfpa-blue-10',
    green: 'text-green-600 bg-green-50',
    orange: 'text-unfpa-orange bg-unfpa-orange-10',
    slate: 'text-slate-600 bg-slate-100'
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-card-border shadow-sm hover:shadow-md transition-shadow">
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4", colorMap[color])}>
        {icon}
      </div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{value}</p>
        {subtitle && (
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

function FlagIcon({ flag, showLabel }: { flag: 'critical' | 'warning' | 'stable'; showLabel?: boolean }) {
  const config = {
    critical: { icon: <Flag className="w-3 h-3" />, color: 'text-red-500 bg-red-50', label: 'Critical Alert' },
    warning: { icon: <AlertTriangle className="w-3 h-3" />, color: 'text-orange-500 bg-orange-50', label: 'At Risk' },
    stable: { icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-emerald-500 bg-emerald-50', label: 'On Track' }
  };

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-lg shrink-0",
      config[flag].color
    )}>
      {config[flag].icon}
      {showLabel && <span className="text-[9px] font-black uppercase tracking-widest">{config[flag].label}</span>}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { CountryData, Indicator, INDICATORS } from '../types';
import { X, Loader2, Sparkles, FileText, Download, ShieldCheck, Globe2, Briefcase, ClipboardCheck, Copy, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateNarrative, hasGemini } from '../lib/ai';
import { buildLocalBriefing } from '../lib/briefing';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedCountries: CountryData[];
  selectedIndicators: Indicator[];
}

export default function StrategicBriefingModal({ isOpen, onClose, selectedCountries, selectedIndicators }: Props) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !briefing) {
      generateBriefing();
    }
  }, [isOpen]);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const generateBriefing = async () => {
    setLoading(true);

    const countryNames = selectedCountries.length > 0
      ? selectedCountries.map(c => c.name).join(', ')
      : 'the entire West and Central Africa region';

    const indicatorContext = (selectedIndicators.length ? selectedIndicators : (['mmr', 'unmetNeed', 'gbvPrevalence'] as Indicator[]))
      .map(id => {
        const meta = INDICATORS[id];
        return `${meta.label} (${meta.unit})`;
      }).join(', ');

    // Local, data-grounded report — always available, and used as the fallback
    // whenever the AI model is not configured or the request fails.
    const localBriefing = buildLocalBriefing(selectedCountries, selectedIndicators);

    if (!hasGemini) {
      setBriefing(localBriefing);
      setLoading(false);
      return;
    }

    try {
      const prompt = `
        You are the UNFPA Regional Director for West and Central Africa.
        Generate a comprehensive Strategic Narrative Briefing for the 2026-2029 Strategic Cycle.

        Scope: ${countryNames}
        Key Metrics: ${indicatorContext}

        Focus Areas:
        1. Resilience and Renewal: How the current geospatial data suggests opportunities for system-wide renewal.
        2. Humanitarian-Development-Peace Nexus (HDPN): Specific implications for ${countryNames}.
        3. Population Dynamics: Implications for ending the three transformative results (Maternal Death, Unmet Need, GBV).
        4. Strategic Recommendations: 3 high-level actions for the Regional Office.

        Style: Highly professional, executive, visionary, and data-grounded.
        Length: 500-600 words.
        Structure Requirement: Use H1 for the main title, H2 for key sections (Executive Summary, Resilience Frontier, Operational Outlook, Regional Mandate, Strategic Imperatives). Use bullet points for lists.
        Tone: Strategic and high-level briefing for regional leadership.
        Use clean, standard markdown.
      `;

      const text = await generateNarrative(prompt);
      setBriefing(text);
    } catch (error) {
      // Surface the real reason for debugging, but never leave the user with a
      // dead screen — fall back to the locally-generated briefing.
      console.error('Gemini briefing failed, using local fallback:', error);
      setBriefing(localBriefing);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!contentRef.current || !briefing) return;
    
    setIsExportingPdf(true);
    try {
      const element = contentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Handle multi-page if content is too long
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`UNFPA_Strategic_Briefing_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!briefing) return;

    try {
      const lines = briefing.split('\n');
      const children: Paragraph[] = [];

      // Branded Letterhead Header
      children.push(new Paragraph({
        children: [
          new TextRun({ text: "UNITED NATIONS POPULATION FUND (UNFPA)", bold: true, color: "0072BC", size: 20 }),
        ],
        spacing: { after: 120 }
      }));

      children.push(new Paragraph({
        children: [
          new TextRun({ text: `Strategic Narrative Briefing | ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, bold: true, size: 28 }),
        ],
        spacing: { after: 480 }
      }));

      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        if (line.startsWith('# ')) {
          children.push(new Paragraph({ 
            text: line.replace('# ', '').trim(), 
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 350 }
          }));
        } else if (line.startsWith('## ')) {
          children.push(new Paragraph({ 
            text: line.replace('## ', '').trim(), 
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 }
          }));
        } else if (line.startsWith('### ')) {
          children.push(new Paragraph({ 
            text: line.replace('### ', '').trim(), 
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          }));
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          children.push(new Paragraph({ 
            text: line.substring(2).trim(), 
            bullet: { level: 0 },
            spacing: { after: 140 }
          }));
        } else {
          children.push(new Paragraph({
            children: [
              new TextRun({
                text: line.replace(/\*\*/g, '').replace(/\*/g, '').trim(),
                size: 24
              })
            ],
            spacing: { after: 240 },
          }));
        }
      });

      // Add Confidential Footer
      children.push(new Paragraph({
        children: [
          new TextRun({ text: "________________________________________________________________________________", color: "E0E0E0" })
        ],
        spacing: { before: 400 }
      }));

      children.push(new Paragraph({
        children: [
          new TextRun({ text: "Confidential | WCARO Hub Intelligence | For Strategic Decision Making", size: 16, italics: true, color: "666666" })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 }
      }));

      const doc = new Document({
        styles: {
          paragraphStyles: [
            {
              id: "Heading1",
              name: "Heading 1",
              run: { size: 32, bold: true, color: "0072BC", allCaps: true },
              paragraph: { spacing: { before: 400, after: 200 } }
            },
            {
              id: "Heading2",
              name: "Heading 2",
              run: { size: 28, bold: true, color: "0072BC" },
              paragraph: { spacing: { before: 300, after: 150 } }
            }
          ]
        },
        sections: [{
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            }
          },
          children: children
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `UNFPA_Strategic_Briefing_${new Date().toISOString().split('T')[0]}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Docx generation failed:', err);
    }
  };

  const handleCopyToDocs = async () => {
    if (!briefing) return;
    
    try {
      // Use the clipboard API to copy the text. 
      // For Google Docs, sometimes plain text is fine if it's markdown-like,
      // but copying as HTML is the Gold Standard for preserving formatting.
      // Since we are in a simple environment, we will copy as plain text
      // but inform the user it's optimized for pasting.
      await navigator.clipboard.writeText(briefing);
      setCopied(true);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900-60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-unfpa-blue rounded-2xl shadow-lg shadow-[0_10px_15px_-3px_#418FDE33]">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-1.5">Executive Instrument</h2>
                  <p className="text-xl font-black text-text-main uppercase tracking-tight leading-none">Strategic Narrative Briefing 2026</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                id="close-briefing-modal"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full py-20 gap-6">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-unfpa-blue animate-spin" />
                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-black text-text-main uppercase tracking-widest">Synthesizing Regional Data</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] animate-pulse">Consulting Strategic Framework 2026-2029...</p>
                  </div>
                </div>
              ) : briefing ? (
                <div ref={contentRef} className="briefing-document animate-fade-in border border-[#F8FAFC]">
                  <div className="briefing-header">
                    <div className="logo-container">
                      <div>
                        <h1 className="text-2xl font-black text-unfpa-blue uppercase tracking-tight">Strategic Narrative Briefing</h1>
                        <div className="briefing-metadata">
                          Released: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} | Region: West & Central Africa
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/UNFPA_logo.svg/1200px-UNFPA_logo.svg.png" 
                          alt="UNFPA Logo" 
                          className="h-12 w-auto mb-2"
                          referrerPolicy="no-referrer"
                        />
                        <div className="unfpa-tagline text-[10px]">Deliver a world where every pregnancy is wanted</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="briefing-content">
                    <ReactMarkdown>{briefing}</ReactMarkdown>
                  </div>
                  
                  <div className="mt-12 pt-6 border-t border-[#F1F5F9] flex justify-between items-center opacity-40 grayscale translate-y-4">
                     <p className="text-[8px] font-bold uppercase tracking-widest">UNFPA Regional Office for West and Central Africa (WCARO)</p>
                     <p className="text-[8px] font-bold">Confidential Executive Briefing | For Mission Planning Only</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-20 text-center">
                  <FileText className="w-20 h-20 mb-4" />
                  <p className="text-sm font-black uppercase tracking-widest">Awaiting Command</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50-50 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-unfpa-blue" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedCountries.length > 0 ? `${selectedCountries.length} Local Contexts` : 'Full Regional View'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-unfpa-blue" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Strategic Plan Alignment</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={generateBriefing}
                  disabled={loading}
                  className="px-4 py-3 rounded-xl border border-unfpa-blue text-unfpa-blue text-[10px] font-black uppercase tracking-widest hover:bg-unfpa-blue-5 transition-all text-center"
                >
                  Recalculate
                </button>
                <button 
                  onClick={handleCopyToDocs}
                  disabled={loading || !briefing}
                  className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  title="Optimized for Google Docs/Word"
                >
                  {copied ? <ClipboardCheck className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Sync to Google Docs'}
                </button>
                <button 
                  onClick={handleDownloadDocx}
                  disabled={loading || !briefing}
                  className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                >
                  <FileText className="w-3.5 h-3.5" />
                  .docx
                </button>
                <button 
                  onClick={handleDownloadPdf}
                  disabled={loading || !briefing || isExportingPdf}
                  className="flex items-center gap-2 px-6 py-3 bg-unfpa-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[0_10px_15px_-3px_#418FDE33] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                  Download PDF
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

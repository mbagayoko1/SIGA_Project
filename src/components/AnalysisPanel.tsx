import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { CountryData, Indicator, INDICATORS } from '../types';
import { Sparkles, Loader2, BrainCircuit, CircleDot } from 'lucide-react';
import { generateNarrative, hasGemini } from '../lib/ai';
import { localStrategicInsight } from '../lib/aiFallbacks';

interface Props {
  selectedCountries: CountryData[];
  selectedIndicators: Indicator[];
  onNavigateQuantum?: () => void;
}

export default function AnalysisPanel({ selectedCountries, selectedIndicators, onNavigateQuantum }: Props) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateAnalysis = async () => {
    setLoading(true);

    if (!hasGemini) {
      setAnalysis(localStrategicInsight(selectedCountries, selectedIndicators));
      setLoading(false);
      return;
    }

    try {
      const countryNames = selectedCountries.map(c => c.name).join(', ');
      const isRegional = selectedCountries.length === 0;
      const isMultiCountry = selectedCountries.length > 1;
      const indicatorLabels = selectedIndicators.map(id => INDICATORS[id].label).join(', ');

      const prompt = `
        You are a Senior Strategic Advisor at UNFPA for West and Central Africa. 
        Provide a situational briefing for ${isRegional ? 'the WCA region' : (isMultiCountry ? `the cluster of countries: ${countryNames}` : selectedCountries[0].name)} 
        anchored in the UNFPA Strategic Plan 2026-2029 (Resilience and Renewal).
        
        Strategic Framework (2026-2029 Outcomes):
        - Metrics Under Review: ${indicatorLabels}
        - Context: Accelerating progress towards "Resilience and Renewal" in the WCA frontier through multidimensional data.
        
        Critical Analysis Requirements:
        1. Multi-metric Nexus: How these different indicators (${indicatorLabels}) interact in ${isRegional ? 'the region' : countryNames}. Look for correlations between development outcomes and demographic dynamics.
        2. Resilience Lens: How population dynamics and demographic shifts impact the target of ending preventable maternal deaths or unmet needs.
        3. Humanitarian Nexus: Address the HDPN specifically for ${isRegional ? 'the wider WCA region' : countryNames}, focusing on displacements and crisis hotspots.
        4. Strategic Foresight: Provide two data-driven "renewal" recommendations that leverage sustainable financing or innovative partnerships as per the new plan.
        
        Style: Strategic, executive-level, data-driven, and forward-looking. 
        Length: Max 220 words. 
        Format: Markdown with concise strategic bullets.
      `;

      const text = await generateNarrative(prompt);
      setAnalysis(text);
    } catch (error) {
      console.error('Analysis generation failed, using local insight:', error);
      setAnalysis(localStrategicInsight(selectedCountries, selectedIndicators));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-quantum-blue to-quantum-blue-dark rounded-2xl p-6 text-white shadow-sm">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-unfpa-blue rounded-lg shadow-lg shadow-[0_10px_15px_-3px_#418FDE33]">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white-90 leading-tight">Geospatial Intelligence</h3>
            <p className="text-[10px] text-white-40 uppercase tracking-widest font-extrabold leading-tight">UNFPA | Gemini 3 Intelligence</p>
          </div>
        </div>
        <button
          onClick={generateAnalysis}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-unfpa-blue hover:scale-[1.02] active:scale-95 disabled:bg-white-10 disabled:scale-100 transition-all px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[0_10px_15px_-3px_#418FDE1A]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {analysis ? 'Re-evaluate Context' : 'Generate Strategic Insights'}
        </button>
      </div>

      <div className="min-h-[140px] border border-white-5 rounded-xl p-5 bg-white-5 backdrop-blur-sm">
        {loading ? (
          <div className="space-y-4 w-full">
            <div className="h-2 bg-white-10 rounded w-3/4 animate-pulse" />
            <div className="h-2 bg-white-10 rounded w-full animate-pulse" />
            <div className="h-2 bg-white-10 rounded w-5/6 animate-pulse" />
            <div className="h-2 bg-white-10 rounded w-4/6 animate-pulse" />
          </div>
        ) : analysis ? (
          <div className="prose prose-invert prose-xs max-w-none text-white-80 leading-relaxed text-[12px] font-medium selection:bg-unfpa-blue-30">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center text-white-20 py-8 px-4 flex flex-col items-center gap-3">
            <Info className="w-6 h-6 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
              Activate analysis for {selectedCountries.length > 0 ? (selectedCountries.length > 1 ? 'the selected cluster' : selectedCountries[0].name) : 'regional context'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-white-5 pt-4">
        <div className="flex items-center gap-2 text-[9px] text-white-20 uppercase tracking-[0.25em] font-black">
          <CircleDot className="w-2 h-2 text-unfpa-blue animate-pulse" />
          <span>PDP Core Dataset v2</span>
        </div>
        {onNavigateQuantum && (
          <button 
            onClick={onNavigateQuantum}
            className="text-[9px] font-black text-unfpa-blue uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1.5"
          >
            Quantum Performance
            <Sparkles className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function Info({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

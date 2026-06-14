import React, { useState } from 'react';
import { Navigation, MapPin, Search, Loader2, Map as MapIcon, ChevronRight } from 'lucide-react';
import { generateJSON, hasGemini } from '../lib/ai';
import { localHubs } from '../lib/aiFallbacks';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  selectedCountryNames: string[];
}

interface HubInfo {
  name: string;
  location: string;
  distance: string;
  accessibility: string;
}

export default function HubAnalysis({ selectedCountryNames }: Props) {
  const [hubs, setHubs] = useState<HubInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeLogistics = async () => {
    if (selectedCountryNames.length === 0) return;
    
    setLoading(true);
    setError(null);

    if (!hasGemini) {
      setHubs(localHubs(selectedCountryNames));
      setLoading(false);
      return;
    }

    try {
      const prompt = `Analyze the humanitarian logistics accessibility and identify major UNFPA-relevant hubs (e.g., regional offices, warehouses, or major healthcare centers) for the following nations: ${selectedCountryNames.join(', ')}.
      Identify the top 3 hubs. For each hub, provide:
      1. Human-readable name.
      2. General location (city/region).
      3. Estimated accessibility status (e.g., 'Fully Accessible', 'Delayed', 'Restricted').
      4. A brief note on transportation distance characteristics from the capital.
      Format the output as a JSON array of objects with keys: name, location, distance, accessibility.`;

      const data = await generateJSON<HubInfo[]>(prompt);
      setHubs(Array.isArray(data) ? data : localHubs(selectedCountryNames));
    } catch (err) {
      console.error("Logistics analysis failed, using local hubs:", err);
      setHubs(localHubs(selectedCountryNames));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-2 border-slate-100 rounded-xl overflow-hidden flex flex-col">
       <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50-50">
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-unfpa-blue" />
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Hub Proximity Analysis</h3>
        </div>
        <button 
          onClick={analyzeLogistics}
          disabled={loading}
          className="px-2 py-1 bg-unfpa-blue text-white rounded text-[8px] font-black uppercase tracking-widest hover:bg-unfpa-dark-blue transition-all disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Execute Analysis'}
        </button>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 text-unfpa-blue animate-spin" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Calculating Supply Chains...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center px-4">
             <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-relaxed">System sync error during geographic grounding.</p>
          </div>
        ) : hubs.length > 0 ? (
          <div className="space-y-3">
            {hubs.map((hub, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-unfpa-blue-30 transition-colors group">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-unfpa-blue" />
                    <span className="text-[11px] font-black text-slate-800">{hub.name}</span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest",
                    hub.accessibility === 'Fully Accessible' ? "bg-emerald-100 text-emerald-700" :
                    hub.accessibility === 'Restricted' ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {hub.accessibility}
                  </span>
                </div>
                <div className="pl-5 space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{hub.location}</p>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                    <ChevronRight className="w-2.5 h-2.5" />
                    <span>{hub.distance}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center px-6">
            <MapIcon className="w-8 h-8 text-slate-100 mx-auto mb-2" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Select countries to perform proximity analysis on humanitarian hubs.
            </p>
          </div>
        )}
      </div>

      <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-unfpa-blue" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Maps-Grounded Logistics Engine</span>
      </div>
    </div>
  );
}

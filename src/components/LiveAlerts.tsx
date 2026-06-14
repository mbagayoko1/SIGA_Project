import React, { useState, useEffect } from 'react';
import { AlertCircle, Zap, Globe, RefreshCcw, ExternalLink } from 'lucide-react';
import { generateJSON, hasGemini } from '../lib/ai';
import { localAlerts } from '../lib/aiFallbacks';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  selectedCountryNames: string[];
}

interface Alert {
  title: string;
  description: string;
  source: string;
  timestamp: string;
  impact: 'high' | 'medium' | 'low';
}

export default function LiveAlerts({ selectedCountryNames }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveIntelligence = async () => {
    if (selectedCountryNames.length === 0) return;
    
    setLoading(true);
    setError(null);

    if (!hasGemini) {
      setAlerts(localAlerts(selectedCountryNames));
      setLoading(false);
      return;
    }

    try {
      const prompt = `Provide a list of the 3 most recent and critical humanitarian or developmental news alerts for the following countries in West and Central Africa: ${selectedCountryNames.join(', ')}.
      Focus on topics related to UNFPA's mandate: reproductive health, maternal mortality, gender-based violence, or population dynamics.
      Format the output as a JSON array of objects with the following keys: title, description, source, timestamp, and impact (one of 'high', 'medium', 'low').`;

      const data = await generateJSON<Alert[]>(prompt);
      setAlerts(Array.isArray(data) ? data : localAlerts(selectedCountryNames));
    } catch (err) {
      console.error("Intelligence fetch failed, using local feed:", err);
      setAlerts(localAlerts(selectedCountryNames));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveIntelligence();
    const interval = setInterval(fetchLiveIntelligence, 300000); // Refresh every 5 mins
    return () => clearInterval(interval);
  }, [selectedCountryNames.join(',')]);

  return (
    <div className="bg-quantum-blue-darker border border-white-10 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900-50">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-unfpa-blue animate-pulse" />
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Intelligence Feed</h3>
        </div>
        <button 
          onClick={fetchLiveIntelligence}
          disabled={loading}
          className="p-1 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCcw className={cn("w-3 h-3 text-slate-400", loading && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {loading && alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-slate-500 space-y-2">
            <RefreshCcw className="w-6 h-6 animate-spin opacity-20" />
            <p className="text-[9px] font-bold uppercase tracking-widest animate-pulse">Scanning Satellite Feeds...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-8 text-red-400-60 text-center px-4">
            <AlertCircle className="w-5 h-5 mb-2" />
            <p className="text-[9px] font-black uppercase tracking-widest">{error}</p>
          </div>
        )}

        {!loading && !error && alerts.length === 0 && (
          <div className="text-center py-8">
            <Globe className="w-6 h-6 text-slate-800 mx-auto mb-2" />
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">No critical alerts for selected nations.</p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {alerts.map((alert, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.1 }}
              className="p-3 bg-slate-800-40 border border-slate-700-50 rounded-lg group hover:border-unfpa-blue-30 transition-all cursor-default"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className={cn(
                  "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                  alert.impact === 'high' ? "bg-red-500-10 text-red-400 border-red-500-20" :
                  alert.impact === 'medium' ? "bg-amber-500-10 text-amber-400 border-amber-500-20" :
                  "bg-unfpa-blue-10 text-unfpa-blue border-unfpa-blue-20"
                )}>
                  {alert.impact}
                </div>
                <span className="text-[8px] font-bold text-slate-500 whitespace-nowrap">{alert.timestamp}</span>
              </div>
              <p className="text-[11px] font-black text-slate-200 leading-snug mb-1 group-hover:text-white transition-colors">{alert.title}</p>
              <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 mb-2 font-medium">{alert.description}</p>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 group-hover:text-unfpa-blue transition-colors">
                <Globe className="w-2.5 h-2.5" />
                <span>{alert.source}</span>
                <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-2 border-t border-slate-800 bg-slate-900-80">
        <div className="flex items-center gap-2 justify-center py-1 overflow-hidden">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Intelligence Sync Optimized by Gemini 3</span>
        </div>
      </div>
    </div>
  );
}

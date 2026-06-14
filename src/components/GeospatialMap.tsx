import React, { useRef, useState } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  Marker,
  Line,
  ZoomableGroup
} from "react-simple-maps";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, Map as MapIcon, Loader2, FileDown, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { WCA_COUNTRY_INTELLIGENCE, CountryRiskInfo, RISK_FLUX_POINTS, FLUX_LINES } from '../data/riskFlux';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface GeospatialMapProps {
  onSelectCountry?: (country: CountryRiskInfo | null) => void;
  selectedCountryId?: string | null;
}

function LegendItem({ color, label, details }: { color: string, label: string, details: string }) {
  return (
    <div className="flex items-start gap-3">
       <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
       <div className="flex flex-col">
          <span className="text-[8px] font-black text-white uppercase tracking-widest leading-none">{label}</span>
          <span className="text-[7px] font-medium text-slate-500 uppercase tracking-tight mt-0.5">{details}</span>
       </div>
    </div>
  );
}

export default function GeospatialMap({ onSelectCountry, selectedCountryId }: GeospatialMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const getCountryColor = (countryName: string) => {
    const data = WCA_COUNTRY_INTELLIGENCE[countryName];
    if (!data) return "#0f172a";
    if (data.id === selectedCountryId) return "#418FDE";
    if (hoveredCountry === countryName) return "#334155";
    
    // Gradient based on risk score
    if (data.riskScore > 80) return "#450a0a"; // Critical Red Dark
    if (data.riskScore > 60) return "#7f1d1d"; // High Red
    if (data.riskScore > 40) return "#92400e"; // Moderate Orange
    return "#1e293b"; // Stable/Default
  };

  const exportMap = async (format: 'png' | 'pdf') => {
    if (!mapRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(mapRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true
      });
      
      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `UNFPA_WCA_Geospatial_Risk_Flux_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`UNFPA_WCA_Geospatial_Risk_Flux_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (err) {
      console.error("Export Error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-unfpa-blue" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white-70">Strategic Risk Flux Intelligence</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => exportMap('png')}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-white-5 border border-white-10 rounded-full text-[10px] font-black uppercase tracking-widest text-white-70 hover:bg-white-10 transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            PNG
          </button>
          <button 
            onClick={() => exportMap('pdf')}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-white-5 border border-white-10 rounded-full text-[10px] font-black uppercase tracking-widest text-white-70 hover:bg-white-10 transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
            PDF
          </button>
        </div>
      </div>

        <div 
          ref={mapRef}
          className="bg-slate-900 rounded-3xl p-4 border border-white-10 relative h-[400px] overflow-hidden"
        >
        <ComposableMap
          projection="geoAzimuthalEqualArea"
          projectionConfig={{
            rotate: [-10, -15, 0],
            scale: 850
          }}
          className="w-full h-full"
        >
          <ZoomableGroup center={[10, 10]} zoom={1} minZoom={0.5} maxZoom={4}>
            <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isWCA = WCA_COUNTRY_INTELLIGENCE[geo.properties.name];
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => isWCA && onSelectCountry && onSelectCountry(isWCA)}
                    onMouseEnter={() => isWCA && setHoveredCountry(geo.properties.name)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    fill={getCountryColor(geo.properties.name)}
                    stroke={selectedCountryId === isWCA?.id ? "#418FDE" : "#334155"}
                    strokeWidth={selectedCountryId === isWCA?.id ? 1.5 : 0.5}
                    style={{
                      default: { outline: "none", cursor: isWCA ? "pointer" : "default" },
                      hover: { outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {FLUX_LINES.map((line, i) => (
            <Line
              key={i}
              from={line.from as [number, number]}
              to={line.to as [number, number]}
              stroke={line.type === 'security' ? "#ef4444" : line.type === 'migration' ? "#3b82f6" : "#f59e0b"}
              strokeWidth={1}
              strokeDasharray="4 2"
              className="animate-pulse"
            />
          ))}

          {RISK_FLUX_POINTS.map((point) => (
            <Marker 
              key={point.name} 
              coordinates={point.coordinates as [number, number]}
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle r={hoveredPoint?.name === point.name ? 8 : 4} fill={point.color} className="animate-ping opacity-75" />
              <circle r={hoveredPoint?.name === point.name ? 5 : 2} fill={point.color} />
              {hoveredPoint?.name === point.name && (
                <text
                  textAnchor="middle"
                  y={-15}
                  style={{ fontFamily: "Inter", fontSize: "12px", fill: "#fff", fontWeight: "black", textTransform: "uppercase" }}
                >
                  {point.name}
                </text>
              )}
            </Marker>
          ))}
          </ZoomableGroup>
        </ComposableMap>

        {/* Hover Intelligence Panel */}
        <AnimatePresence>
          {hoveredPoint && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-20 right-6 w-64 bg-slate-900 border border-unfpa-blue p-5 rounded-2xl shadow-2xl z-20"
            >
               <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest",
                    hoveredPoint.risk === 'Critical' ? 'bg-red-500 text-white' : 'bg-unfpa-blue text-white'
                  )}>{hoveredPoint.risk} RISK</span>
                  <Activity className="w-3 h-3 text-unfpa-blue animate-pulse" />
               </div>
               <h4 className="text-xs font-black text-white uppercase tracking-tight mb-2">{hoveredPoint.name}</h4>
               <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{hoveredPoint.details}</p>
               <div className="mt-4 pt-4 border-t border-white-10">
                  <span className="text-[7px] font-black text-unfpa-blue uppercase tracking-widest">Quantum Situational Verified</span>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-slate-900 border border-white-10 p-5 rounded-2xl space-y-4 shadow-2xl backdrop-blur-xl">
           <div className="border-b border-white-10 pb-2 mb-2">
              <h4 className="text-[9px] font-black text-unfpa-blue uppercase tracking-[0.2em]">Flux Intelligence Legend</h4>
           </div>
           
           <div className="space-y-3">
              <LegendItem color="#450a0a" label="Critical Instability" details="Risk Score > 80 (Conflict/Displacement)" />
              <LegendItem color="#92400e" label="Moderate Pressure" details="Risk Score 40-80 (Evolving Situations)" />
              <LegendItem color="#1e293b" label="Operational Stability" details="Risk Score < 40 (Stable Monitoring)" />
           </div>

           <div className="pt-4 border-t border-white-10 space-y-2">
              <div className="flex items-center gap-2">
                 <div className="w-4 h-px bg-unfpa-blue border-t border-dashed" />
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Migration Flow</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-4 h-px bg-red-500 border-t border-dashed" />
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Security Spillover</span>
              </div>
           </div>
        </div>

        <div className="absolute top-6 right-6">
           <div className="px-3 py-1 bg-white-5 border border-white-10 rounded-full">
              <span className="text-[8px] font-black text-unfpa-blue uppercase tracking-widest">Real-time Flux Monitoring Active</span>
           </div>
        </div>
      </div>
    </div>
  );
}

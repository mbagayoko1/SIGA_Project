import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { scaleLinear } from 'd3';
import { CountryData } from '../types';
import { WCA_COUNTRIES } from '../data';
import { CATALOG_BY_CODE } from '../data/indicatorCatalog';
import { getValueByCode, useLiveIndicators } from '../lib/indicatorData';
import { Tooltip } from 'react-tooltip';
import { Search, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Layers, Map as MapIcon, X, Check, ChevronDown, Loader2, Download, Eye, EyeOff, FileImage, FileDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// Mapping Alpha-3 to Numeric IDs for world-atlas compatibility
const WCA_NUMERIC_MAPPING: Record<string, string> = {
  'BEN': '204', 'BFA': '854', 'CPV': '132', 'CMR': '120', 'CAF': '140',
  'TCD': '148', 'COG': '178', 'CIV': '384', 'COD': '180', 'GNQ': '226',
  'GAB': '266', 'GMB': '270', 'GHA': '288', 'GIN': '324', 'GNB': '624',
  'LBR': '430', 'MLI': '466', 'MRT': '478', 'NER': '562', 'NGA': '566',
  'STP': '678', 'SEN': '686', 'SLE': '694', 'TGO': '768'
};

// Approximate country centroids [longitude, latitude] for WCA region
const COUNTRY_COORDS: Record<string, [number, number]> = {
  BEN: [2.3158, 9.3077],
  BFA: [-1.5616, 12.2383],
  CPV: [-24.0131, 16.0020],
  CMR: [12.3547, 7.3697],
  CAF: [20.9394, 6.6111],
  TCD: [18.7322, 15.4542],
  COG: [15.8277, -0.2280],
  CIV: [-5.5471, 7.5400],
  COD: [21.7587, -4.0383],
  GNQ: [10.2679, 1.6508],
  GAB: [11.6094, -0.8037],
  GMB: [-15.3101, 13.4432],
  GHA: [-1.0232, 7.9465],
  GIN: [-9.9456, 9.9456],
  GNB: [-15.1804, 11.8037],
  LBR: [-9.4295, 6.4281],
  MLI: [-3.9962, 17.5702],
  MRT: [-10.9408, 21.0079],
  NER: [8.0817, 17.6078],
  NGA: [8.6753, 9.0820],
  STP: [6.6131, 0.1864],
  SEN: [-14.4524, 14.4974],
  SLE: [-11.7799, 8.4606],
  TGO: [0.8248, 8.6195],
};

interface Props {
  code: string; // PDP indicator_code driving the choropleth
  onToggleCountry: (country: CountryData) => void;
  selectedCountryIds: string[];
}

export default function MapChart({ code, onToggleCountry, selectedCountryIds }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [position, setPosition] = useState({ coordinates: [5, 12] as [number, number], zoom: 1 });
  const [showHotspots, setShowHotspots] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showLayerControl, setShowLayerControl] = useState(false);
  const [mapStyle, setMapStyle] = useState<'standard' | 'dark' | 'terrain'>('standard');
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);
  const [geoData, setGeoData] = useState<any>(null);
  const [isActivating, setIsActivating] = useState(true);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Pre-fetch Geography for WCA Activation
  useEffect(() => {
    let mounted = true;
    setIsActivating(true);
    fetch(geoUrl)
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const text = await res.text();
        try {
          // Explicitly cleanup potential trailing or leading garbage (GH raw often adds headers in specific envs)
          const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
          return JSON.parse(cleanJson);
        } catch (e) {
          return JSON.parse(text); // Fallback to raw parse if cleaning fails
        }
      })
      .then(data => {
        if (mounted) {
          setGeoData(data);
          setIsActivating(false);
        }
      })
      .catch(err => {
        console.error("Map Activation Error:", err);
        if (mounted) setIsActivating(false);
      });
    return () => { mounted = false; };
  }, []);

  const meta = CATALOG_BY_CODE[code];
  const valueOf = (iso3: string): number | null => getValueByCode(iso3, code).value;
  const colorRange: [string, string] = ['#e0f2fe', meta?.color ?? '#1C6DB5'];

  // Dynamic theme colors
  const theme = useMemo(() => {
    switch (mapStyle) {
      case 'dark':
        return {
          bg: '#111827',
          land: '#1f2937',
          stroke: '#374151',
          empty: '#111827',
          hover: '#0072BC'
        };
      case 'terrain':
        return {
          bg: '#f1f5f9',
          land: '#e2e8f0',
          stroke: '#cbd5e1',
          empty: '#f8fafc',
          hover: '#64748b'
        };
      default:
        return {
          bg: '#f8fafc',
          land: '#f1f5f9',
          stroke: '#e2e8f0',
          empty: '#ffffff',
          hover: '#0072BC'
        };
    }
  }, [mapStyle]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return [];
    return WCA_COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleCountrySearch = (country: CountryData) => {
    const coords = COUNTRY_COORDS[country.id];
    if (coords) {
      setPosition({
        coordinates: coords,
        zoom: 3,
      });
    }
    setSearchQuery("");
    setShowSearch(false);
    // Optional: also select the country if not already selected
    if (!selectedCountryIds.includes(country.id)) {
      onToggleCountry(country);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect) {
          const { width, height } = entry.contentRect;
          setDimensions({ width, height });
          
          // Responsive centering/zoom logic
          if (width < 640) {
            setPosition(prev => ({ 
              ...prev, 
              coordinates: [5, 15], // Shift slightly north/east for mobile verticality
              zoom: 1 
            }));
          } else {
            setPosition(prev => ({ 
              ...prev, 
              coordinates: [5, 12], 
              zoom: 1 
            }));
          }
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const liveVersion = useLiveIndicators(); // re-color when the Supabase overlay lands
  const stats = useMemo(() => {
    const values = WCA_COUNTRIES.map(c => valueOf(c.id)).filter((v): v is number => v != null);
    return {
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 1,
    };
  }, [code, liveVersion]);

  const colorScale = useMemo(() => {
    return scaleLinear<string>()
      .domain([stats.min, stats.max])
      .range(colorRange);
  }, [stats, code]);

  // Dynamic Scale based on container width
  const baseScale = useMemo(() => {
    if (dimensions.width < 480) return 400;
    if (dimensions.width < 640) return 500;
    if (dimensions.width < 1024) return 600;
    return 800;
  }, [dimensions.width]);

  const handleZoomIn = () => {
    if (position.zoom >= 5) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.2 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 0.5) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.2 }));
  };

  const handleReset = () => {
    const isMobile = dimensions.width < 640;
    setPosition({ 
      coordinates: isMobile ? [5, 15] : [5, 12], 
      zoom: 1 
    });
  };

  const handleExport = async (format: 'png' | 'jpeg' | 'svg') => {
    if (!containerRef.current) return;
    setIsExporting(true);
    setShowExportMenu(false);

    try {
      if (format === 'svg') {
        const svgElement = containerRef.current.querySelector('svg');
        const legendElement = containerRef.current.querySelector('.origin-top-left');
        
        if (svgElement) {
          const svgClone = svgElement.cloneNode(true) as SVGElement;
          
          if (legendElement) {
            const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
            foreignObject.setAttribute("x", "20");
            foreignObject.setAttribute("y", "20");
            foreignObject.setAttribute("width", "250");
            foreignObject.setAttribute("height", "300");
            
            const legendClone = legendElement.cloneNode(true) as HTMLElement;
            Object.assign(legendClone.style, {
              backgroundColor: 'white',
              padding: '12px',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              transform: 'none',
              position: 'static',
              fontSize: '10px',
              boxShadow: 'none'
            });
            
            foreignObject.appendChild(legendClone);
            svgClone.appendChild(foreignObject);
          }
          
          svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
          const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
          styleElement.textContent = `
            svg { background-color: ${theme.bg}; font-family: 'Inter', sans-serif; }
            .text-unfpa-blue { color: #0072BC; }
            .bg-unfpa-blue { background-color: #0072BC; }
          `;
          svgClone.insertBefore(styleElement, svgClone.firstChild);
          
          const svgData = new XMLSerializer().serializeToString(svgClone);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          saveAs(svgBlob, `UNFPA_Resilience_Map_${new Date().toISOString().split('T')[0]}.svg`);
        }
      } else {
        // Use html2canvas for raster formats to include Legend and UI (Analytical Stage)
        const canvas = await html2canvas(containerRef.current, {
          backgroundColor: theme.bg,
          scale: 2, // Higher quality
          useCORS: true,
          logging: false,
          ignoreElements: (el) => {
            // Hide the control buttons but keep the legend (Analytical Stage)
            return el.classList.contains('map-control-btn') || el.id === 'map-tooltip';
          }
        });
        
        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, `UNFPA_Geospatial_Export_${new Date().toISOString().split('T')[0]}.${format}`);
          }
        }, `image/${format}`, 1.0);
      }
    } catch (err) {
      console.error("Export failure:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="bg-white rounded-2xl border border-card-border overflow-hidden relative group h-full w-full flex flex-col shadow-inner transition-all duration-500"
    >
      {/* Legend Top Left */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 bg-white-95 backdrop-blur shadow-2xl border border-card-border p-3 sm:p-4 rounded-xl transition-all group-hover:translate-x-1 group-hover:-translate-y-1 origin-top-left max-w-[160px] sm:max-w-none">
        <h3 className="text-[9px] sm:text-[10px] font-black text-unfpa-blue uppercase tracking-[0.2em] mb-1 sm:mb-2 flex items-center gap-2">
          <Layers className="w-3 h-3" />
          Analytics Stage
        </h3>
        
        {meta && (
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">{meta.domain} · {meta.subdomain}</p>
        )}
        <p className="text-[10px] sm:text-xs font-black text-text-main mb-2 sm:mb-3 truncate max-w-[200px]">{meta?.short ?? 'Indicator'}</p>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-[9px] sm:text-[10px] text-text-muted font-bold tabular-nums">{stats.min}</span>
          <div
            className="h-1.5 sm:h-2 w-16 sm:w-32 rounded-full ring-1 ring-black-5"
            style={{ background: `linear-gradient(to right, ${colorRange[0]}, ${colorRange[1]})` }}
          />
          <span className="text-[9px] sm:text-[10px] text-text-muted font-bold tabular-nums">{stats.max}{meta?.unit === '%' ? '%' : ''}</span>
        </div>
      </div>

      {/* Control Panel */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex flex-col gap-2 scale-75 sm:scale-100 origin-top-right">
        {/* Search Control */}
        <div className="relative">
          <MapButton 
            onClick={() => setShowSearch(!showSearch)} 
            icon={<Search className={cn("w-4 h-4 transition-colors", showSearch ? "text-unfpa-blue" : "text-text-main")} />} 
            title="Search Country" 
            active={showSearch}
          />
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute right-12 top-0 bg-white border border-card-border rounded-xl shadow-2xl p-2 w-[240px]"
              >
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search WCA Nations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="bg-transparent border-none outline-none text-[11px] font-bold text-text-main w-full placeholder:text-slate-400 placeholder:font-medium"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")}>
                      <X className="w-3 h-3 text-slate-400" />
                    </button>
                  )}
                </div>
                <div className="max-h-[200px] overflow-y-auto space-y-1 custom-scrollbar pr-1">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map(country => (
                      <button
                        key={country.id}
                        onClick={() => handleCountrySearch(country)}
                        className="w-full flex items-center justify-between p-2 rounded-lg text-[10px] font-black text-slate-600 hover:bg-unfpa-blue-5 hover:text-unfpa-blue transition-colors text-left group"
                      >
                        <span className="truncate">{country.name}</span>
                        <ChevronDown className="w-3 h-3 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))
                  ) : searchQuery ? (
                    <p className="text-[10px] text-slate-400 font-bold p-4 text-center">No nations found</p>
                  ) : (
                    <div className="p-4 text-center space-y-2">
                      <MapIcon className="w-6 h-6 text-slate-100 mx-auto" />
                      <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Type to explore stage</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Layer Control */}
        <div className="relative">
          <MapButton 
            onClick={() => setShowLayerControl(!showLayerControl)} 
            icon={<Layers className={cn("w-4 h-4 transition-colors", showLayerControl ? "text-unfpa-blue" : "text-text-main")} />} 
            title="Layer Settings" 
            active={showLayerControl}
          />
          <AnimatePresence>
            {showLayerControl && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute right-12 top-0 bg-white border border-card-border rounded-xl shadow-2xl p-4 w-[280px] space-y-4"
              >
                <div>
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Base Map Architecture</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(['standard', 'dark', 'terrain'] as const).map(style => (
                      <button
                        key={style}
                        onClick={() => setMapStyle(style)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-2 rounded-lg border transition-all",
                          mapStyle === style ? "border-unfpa-blue bg-unfpa-blue-5 text-unfpa-blue" : "border-slate-100 hover:border-slate-200 text-slate-500"
                        )}
                      >
                        <div className={cn("w-full h-8 rounded-md mb-1", 
                          style === 'standard' ? "bg-slate-100" : (style === 'dark' ? "bg-slate-900" : "bg-green-50"))} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">{style}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Overlay Opacity</h4>
                    <span className="text-[10px] font-black text-unfpa-blue">{Math.round(overlayOpacity * 100)}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-unfpa-blue"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-px bg-slate-100 mx-2 my-1" />

        <MapButton onClick={handleZoomIn} icon={<ZoomIn className="w-4 h-4" />} title="Zoom In" />
        <MapButton onClick={handleZoomOut} icon={<ZoomOut className="w-4 h-4" />} title="Zoom Out" />
        <MapButton onClick={handleReset} icon={<RotateCcw className="w-4 h-4" />} title="Reset Stage" />
        <MapButton 
          onClick={() => setShowOnlySelected(!showOnlySelected)} 
          icon={showOnlySelected ? <EyeOff className="w-4 h-4 text-unfpa-blue" /> : <Eye className="w-4 h-4" />} 
          title="Focus Selected Nations" 
          active={showOnlySelected}
        />
        <MapButton 
          onClick={() => setShowHotspots(!showHotspots)} 
          icon={<AlertTriangle className={cn("w-4 h-4 transition-colors", showHotspots ? "text-red-600" : "text-text-main")} />} 
          title="Crisis Hotspots" 
          active={showHotspots}
        />
        
        <div className="h-px bg-slate-100 mx-2 my-1" />
        
        <div className="relative">
          <MapButton 
            onClick={() => setShowExportMenu(!showExportMenu)} 
            icon={isExporting ? <Loader2 className="w-4 h-4 animate-spin text-unfpa-blue" /> : <Download className="w-4 h-4" />} 
            title="Export Stage" 
            active={showExportMenu}
          />
          <AnimatePresence>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute right-12 bottom-0 bg-white border border-card-border rounded-xl shadow-2xl p-2 w-[140px] space-y-1"
              >
                {[
                  { id: 'png', label: 'Export as PNG', icon: <FileImage className="w-3.5 h-3.5" /> },
                  { id: 'jpeg', label: 'Export as JPEG', icon: <FileImage className="w-3.5 h-3.5" /> },
                  { id: 'svg', label: 'Export as SVG', icon: <FileDown className="w-3.5 h-3.5" /> }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleExport(opt.id as any)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg text-[10px] font-black text-slate-600 hover:bg-unfpa-blue-5 hover:text-unfpa-blue transition-colors text-left"
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isActivating && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-50-50 backdrop-blur-sm transition-opacity duration-1000">
           <div className="relative">
              <Loader2 className="w-12 h-12 text-unfpa-blue animate-spin" />
              <MapIcon className="absolute inset-0 m-auto w-5 h-5 text-unfpa-blue animate-pulse" />
           </div>
           <p className="mt-4 text-[10px] font-black text-unfpa-blue uppercase tracking-[0.3em] animate-pulse">Activating Geospatial Layer...</p>
        </div>
      )}

      <ComposableMap
        width={dimensions.width}
        height={dimensions.height}
        projectionConfig={{
          scale: baseScale,
        }}
        className="flex-1 w-full transition-colors duration-700 cursor-grab active:cursor-grabbing"
        style={{ backgroundColor: theme.bg }}
      >
        <ZoomableGroup 
          zoom={position.zoom} 
          center={position.coordinates}
          onMoveEnd={setPosition}
        >
          {mapStyle === 'terrain' && (
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
              </pattern>
            </defs>
          )}
          {geoData && (
            <Geographies geography={geoData}>
              {({ geographies }) =>
                geographies.map((geo, index) => {
                  const geoId = String(geo.id);
                  const countryData = WCA_COUNTRIES.find(c => {
                    const numericId = WCA_NUMERIC_MAPPING[c.id];
                    return c.id === geoId || numericId === geoId || (geo.properties && (geo.properties.ISO_A3 === c.id || geo.properties.iso_a3 === c.id));
                  });
                  
                  const countryId = countryData ? countryData.id : geoId;
                  const isWCA = !!countryData;
                  const isSelected = selectedCountryIds.includes(countryId);
                  
                  // Focus Mode Filter
                  if (showOnlySelected && isWCA && !isSelected) return null;
                  
                  const isHotspot = showHotspots && countryData && countryData.crisisLevel >= 4;
                  const cellValue = countryData ? valueOf(countryData.id) : null;
                  const cellProv = countryData ? getValueByCode(countryData.id, code) : null;

                  const fillColor = isHotspot
                    ? "#be123c"
                    : (isWCA && cellValue != null ? colorScale(cellValue) : theme.land);

                  const tooltipHtml = countryData ? `
                    <div class="space-y-2">
                      <div class="border-b border-white-10 pb-1 mb-1">
                        <p class="font-black text-xs">${countryData.name}</p>
                      </div>
                      <div class="flex items-center justify-between gap-4">
                        <span class="text-[9px] font-bold text-white-50">${meta?.short ?? 'Indicator'}:</span>
                        <span class="text-[9px] font-black">${cellValue != null ? cellValue + (meta?.unit === '%' ? '%' : ' ' + (meta?.unit ?? '')) : 'No data'}</span>
                      </div>
                      ${cellProv?.source ? `<div class="flex items-center justify-between gap-4"><span class="text-[8px] font-bold text-white-50">Source:</span><span class="text-[8px] font-black">${cellProv.source}${cellProv.referenceYear ? ' ' + cellProv.referenceYear : ''}</span></div>` : ''}
                      ${isHotspot ? '<p class="text-[8px] text-red-400 font-black mt-2">!!! CRISIS HOTSPOT !!!</p>' : ''}
                    </div>
                  ` : "";

                  return (
                    <Geography
                      key={`geo-${countryId}-${geo.rwd || index}`}
                      geography={geo}
                      onClick={() => {
                        if (countryData) onToggleCountry(countryData);
                      }}
                      data-tooltip-id="map-tooltip"
                      data-tooltip-html={tooltipHtml}
                      style={{
                        default: {
                          fill: fillColor,
                          fillOpacity: isWCA ? overlayOpacity : 1,
                          outline: "none",
                          stroke: isSelected ? "#0072BC" : (isHotspot ? "#7f1d1d" : theme.stroke),
                          strokeWidth: isSelected ? 3 : (isHotspot ? 1.5 : 0.4),
                          transition: "all 350ms cubic-bezier(0.4, 0, 0.2, 1)",
                          zIndex: isSelected ? 10 : 1
                        },
                        hover: {
                          fill: isHotspot ? "#991b1b" : theme.hover,
                          fillOpacity: 1,
                          outline: "none",
                          stroke: isWCA ? "#0072BC" : theme.stroke,
                          strokeWidth: isWCA ? 2 : 0.4,
                          cursor: isWCA ? "pointer" : "default",
                          zIndex: 20
                        },
                        pressed: {
                          fill: "#0072bc",
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          )}
        </ZoomableGroup>
      </ComposableMap>
      
      <Tooltip 
        id="map-tooltip" 
        style={{ 
          backgroundColor: '#0f172a', 
          color: '#e2e8f0', 
          borderRadius: '12px', 
          fontSize: '10px',
          fontWeight: '900',
          padding: '10px 14px',
          border: '1px solid #FFFFFF1A',
          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)',
          zIndex: 100,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }} 
      />
      <div className="absolute bottom-4 right-4 z-20 text-right opacity-30 group-hover:opacity-100 transition-opacity pointer-events-none">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Source: UNFPA Population Data Portal & WCARO Hub</p>
      </div>
    </div>
  );
}

function MapButton({ onClick, icon, title, active, className }: { onClick: () => void, icon: React.ReactNode, title: string, active?: boolean, className?: string }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={cn(
        "w-10 h-10 border-2 rounded-xl shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-90 map-control-btn",
        active ? "bg-unfpa-blue-5 border-unfpa-blue-30 text-unfpa-blue" : "bg-white border-slate-100 hover:border-unfpa-blue text-slate-600",
        className
      )}
    >
      {icon}
    </button>
  );
}


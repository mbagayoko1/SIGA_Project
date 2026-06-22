/**
 * IndicatorBrowser — PDP-style hierarchical indicator picker for the Analytics tab.
 * Mirrors pdp.unfpa.org/#/metadata: Search + Domain → Sub-domain → Indicator.
 */
import React, { useMemo, useState } from 'react';
import { Search, X, ChevronRight, ChevronDown, SlidersHorizontal, Check, Flag, HeartPulse, ShieldAlert, Globe2, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';
import { INDICATOR_CATALOG, ALL_CATALOG_INDICATORS } from '../../data/indicatorCatalog';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Flag, HeartPulse, ShieldAlert, Globe2,
};

interface Props {
  // single-select (Stage)
  selectedCode?: string;
  onSelect?: (code: string) => void;
  // multi-select (Analytics cross-outcome)
  mode?: 'single' | 'multi';
  selectedCodes?: string[];
  onToggle?: (code: string) => void;
}

const IndicatorBrowser: React.FC<Props> = ({ selectedCode, onSelect, mode = 'single', selectedCodes = [], onToggle }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [openDomain, setOpenDomain] = useState<string | null>(INDICATOR_CATALOG[0].domain);

  const multi = mode === 'multi';
  const active = ALL_CATALOG_INDICATORS.find((i) => i.code === selectedCode);
  const isSel = (code: string) => (multi ? selectedCodes.includes(code) : selectedCode === code);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return ALL_CATALOG_INDICATORS.filter(
      (i) => i.name.toLowerCase().includes(q) || i.short.toLowerCase().includes(q) ||
             i.subdomain.toLowerCase().includes(q) || i.domain.toLowerCase().includes(q) || i.code.includes(q),
    );
  }, [query]);

  // single → select & close; multi → toggle & stay open for cross-outcome building
  const pick = (code: string) => {
    if (multi) { onToggle?.(code); return; }
    onSelect?.(code); setOpen(false); setQuery('');
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-white border-2 border-slate-200 px-4 py-2.5 rounded-xl text-left shadow-sm flex items-center gap-3 transition-all hover:border-quantum-blue min-w-[280px] group"
      >
        <span className="w-8 h-8 rounded-lg bg-quantum-blue/10 text-quantum-blue flex items-center justify-center shrink-0">
          <Layers className="w-4 h-4" />
        </span>
        <span className="flex-1 min-w-0">
          {multi ? (
            <>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cross-outcome selection</span>
              <span className="block text-[13px] font-bold text-text-main truncate">
                {selectedCodes.length === 0 ? 'Select indicators' : `${selectedCodes.length} indicator${selectedCodes.length > 1 ? 's' : ''} selected`}
              </span>
            </>
          ) : (
            <>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">{active?.domain ?? 'Indicator'} · {active?.subdomain ?? ''}</span>
              <span className="block text-[13px] font-bold text-text-main truncate">{active?.short ?? 'Select indicator'}</span>
            </>
          )}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-[420px] max-h-[560px] bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-300/40 z-40 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Indicators</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            {/* Search */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search indicators…"
                  className="bg-transparent outline-none text-sm w-full placeholder:text-slate-400"
                />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-500">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-xs font-semibold">Filters</span>
                <span className="w-1.5 h-1.5 rounded-full bg-unfpa-orange" />
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto custom-scrollbar flex-1">
              {searchResults ? (
                <div className="py-2">
                  {searchResults.length === 0 && (
                    <p className="px-5 py-8 text-center text-sm text-slate-400">No indicators match “{query}”.</p>
                  )}
                  {searchResults.map((i) => (
                    <button key={i.code} onClick={() => pick(i.code)}
                      className={cn('w-full text-left px-5 py-2.5 hover:bg-slate-50 flex items-center gap-3', isSel(i.code) && 'bg-quantum-blue/5')}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: i.color }} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold text-slate-800 truncate">{i.short}</span>
                        <span className="block text-[11px] text-slate-400 truncate">{i.domain} · {i.subdomain} · code {i.code}</span>
                      </span>
                      {isSel(i.code) && <Check className="w-4 h-4 text-quantum-blue shrink-0" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-2">
                  {INDICATOR_CATALOG.map((d) => {
                    const Icon = ICONS[d.icon] ?? Layers;
                    const isOpen = openDomain === d.domain;
                    return (
                      <div key={d.domain} className="border-b border-slate-50 last:border-0">
                        <button onClick={() => setOpenDomain(isOpen ? null : d.domain)}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${d.color}14`, color: d.color }}>
                            <Icon className="w-5 h-5" />
                          </span>
                          <span className="flex-1 text-left">
                            <span className="block text-[14px] font-semibold text-slate-800">{d.domain}</span>
                            <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wide">{d.outcomeLabel}</span>
                          </span>
                          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        </button>
                        {isOpen && (
                          <div className="pb-2">
                            {d.subdomains.map((sub) => (
                              <div key={sub.name} className="mb-1">
                                <p className="px-5 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub.name}</p>
                                {sub.indicators.map((i) => (
                                  <button key={i.code} onClick={() => pick(i.code)}
                                    className={cn('w-full text-left pl-12 pr-5 py-2 hover:bg-slate-50 flex items-center gap-2', isSel(i.code) && 'bg-quantum-blue/5')}>
                                    {multi && <span className={cn('w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0', isSel(i.code) ? 'bg-quantum-blue border-quantum-blue' : 'border-slate-300')}>{isSel(i.code) && <Check className="w-2.5 h-2.5 text-white" />}</span>}
                                    <span className="flex-1 text-[13px] font-medium text-slate-700 truncate">{i.short}</span>
                                    <span className="text-[10px] text-slate-300 font-mono">{i.code}</span>
                                    {!multi && isSel(i.code) && <Check className="w-3.5 h-3.5 text-quantum-blue shrink-0" />}
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>{ALL_CATALOG_INDICATORS.length} indicators · 4 domains</span>
              <span className="font-semibold">Source: UNFPA Population Data Portal</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default IndicatorBrowser;

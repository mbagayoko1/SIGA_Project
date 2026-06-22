/**
 * CountryFilter — multi-select WCA country picker for the Analytics tab.
 * Empty selection = all 24 countries.
 */
import React, { useState, useMemo } from 'react';
import { MapPin, ChevronDown, Check, X, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { WCA_COUNTRIES } from '../../data';

interface Props {
  selected: string[];                 // ISO3 ids; [] = all
  onChange: (ids: string[]) => void;
}

const CountryFilter: React.FC<Props> = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const sorted = useMemo(
    () => [...WCA_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const filtered = useMemo(
    () => sorted.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())),
    [sorted, query],
  );

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const allSelected = selected.length === 0 || selected.length === WCA_COUNTRIES.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-white border-2 border-slate-200 px-4 py-2.5 rounded-xl text-left shadow-sm flex items-center gap-3 transition-all hover:border-quantum-blue min-w-[230px] group"
      >
        <span className="w-8 h-8 rounded-lg bg-quantum-blue/10 text-quantum-blue flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Countries</span>
          <span className="block text-[13px] font-bold text-text-main truncate">
            {allSelected ? 'All 24 countries' : `${selected.length} selected`}
          </span>
        </span>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-[280px] max-h-[440px] bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-300/40 z-40 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Select countries</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-3 py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…"
                  className="bg-transparent outline-none text-[13px] w-full placeholder:text-slate-400" />
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
              <button onClick={() => onChange([])} className="text-[11px] font-bold text-quantum-blue hover:underline">All countries</button>
              <button onClick={() => onChange(WCA_COUNTRIES.map((c) => c.id))} className="text-[11px] font-semibold text-slate-400 hover:text-slate-600">Select all</button>
              {selected.length > 0 && (
                <button onClick={() => onChange([])} className="text-[11px] font-semibold text-rose-500 hover:underline">Clear</button>
              )}
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1 py-1">
              {filtered.map((c) => {
                const on = selected.includes(c.id);
                return (
                  <button key={c.id} onClick={() => toggle(c.id)}
                    className={cn('w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-left', on && 'bg-quantum-blue/5')}>
                    <span className={cn('w-4 h-4 rounded border flex items-center justify-center shrink-0', on ? 'bg-quantum-blue border-quantum-blue' : 'border-slate-300')}>
                      {on && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="flex-1 text-[13px] font-medium text-slate-700 truncate">{c.name}</span>
                    <span className="text-[10px] text-slate-300 uppercase">{c.region === 'West Africa' ? 'WA' : 'CA'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CountryFilter;

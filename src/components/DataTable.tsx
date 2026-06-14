import React, { useState, useMemo } from 'react';
import { CountryData, Indicator, INDICATORS } from '../types';
import { WCA_COUNTRIES } from '../data';
import { ChevronUp, ChevronDown, Download, Users, Heart, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  selectedIndicators: Indicator[];
  selectedCountries: CountryData[];
  onToggleCountry: (country: CountryData) => void;
}

type SortField = keyof CountryData;

export default function DataTable({ selectedIndicators, selectedCountries, onToggleCountry }: Props) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to desc for data columns
    }
  };

  const sortedData = useMemo(() => {
    return [...WCA_COUNTRIES].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const res = aVal.localeCompare(bVal);
        return sortOrder === 'asc' ? res : -res;
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        const vA = aVal ? 1 : 0;
        const vB = bVal ? 1 : 0;
        return sortOrder === 'asc' ? vA - vB : vB - vA;
      }
      
      return 0;
    });
  }, [sortField, sortOrder]);

  return (
    <div className="bg-white rounded-2xl border border-card-border overflow-hidden flex flex-col h-full shadow-inner animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50-50 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] mb-1">Regional Ledger</h3>
          <p className="text-sm font-black text-text-main uppercase tracking-tight">Population Data Intelligence Grid</p>
        </div>
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-unfpa-blue transition-colors shadow-sm"
          onClick={() => {
            const indicatorHeaders = selectedIndicators.map(id => `"${INDICATORS[id].label} (${INDICATORS[id].unit})"`);
            const headers = ['Country', 'Region', 'Selection Status', 'Population (M)', ...indicatorHeaders].join(',');
            
            const rows = sortedData.map(c => {
              const isSelected = selectedCountries.some(sc => sc.id === c.id) ? 'Selected' : 'Not Selected';
              return [
                `"${c.name}"`, 
                `"${c.region}"`,
                `"${isSelected}"`,
                c.population, 
                ...selectedIndicators.map(id => c[id])
              ].join(',');
            }).join('\n');
            
            const csvContent = `${headers}\n${rows}`;
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `UNFPA_WCA_Regional_Intelligence_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="w-3.5 h-3.5 text-unfpa-blue" />
          Export to CSV
        </button>
      </div>

      {/* Table Body */}
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-white shadow-sm z-10">
            <tr className="border-b border-slate-100">
              <th className="p-4 bg-slate-50-50">
                <SortHeader label="Country" field="name" current={sortField} order={sortOrder} onSort={handleSort} />
              </th>
              <th className="p-4 bg-slate-50-50">
                <SortHeader label="Pop (M)" field="population" current={sortField} order={sortOrder} onSort={handleSort} />
              </th>
              {selectedIndicators.map(id => (
                <th key={id} className="p-4 bg-slate-50-50">
                  <SortHeader 
                    label={INDICATORS[id].label.split(' ').map(w => w[0]).join('')} 
                    fullLabel={INDICATORS[id].label}
                    field={id} 
                    current={sortField} 
                    order={sortOrder} 
                    onSort={handleSort} 
                  />
                </th>
              ))}
              <th className="p-4 bg-slate-50-50 text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedData.map(country => {
              const isSelected = selectedCountries.find(c => c.id === country.id);
              return (
                <tr 
                  key={country.id} 
                  className={cn(
                    "group transition-colors",
                    isSelected ? "bg-unfpa-blue-5 hover:bg-unfpa-blue-10" : "hover:bg-slate-50-50"
                  )}
                >
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-text-main truncate max-w-[120px]">{country.name}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{country.region}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs font-bold text-slate-500">{country.population?.toFixed(1) || '0.0'}</span>
                  </td>
                  {selectedIndicators.map(id => {
                    const indicator = INDICATORS[id];
                    if (!indicator) return <td key={id} className="p-4">-</td>;
                    return (
                      <td key={id} className="p-4">
                        <div className="flex items-center gap-2">
                           <div 
                            className="w-1.5 h-1.5 rounded-full" 
                            style={{ backgroundColor: indicator.colorRange[1] }}
                          />
                          <span className="font-mono text-xs font-black text-text-main">
                            {country[id]}{indicator.unit?.replace('per ', '/') || ''}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => onToggleCountry(country)}
                      className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all",
                        isSelected 
                          ? "bg-unfpa-blue text-white shadow-md" 
                          : "text-slate-400 border border-slate-200 hover:border-unfpa-blue hover:text-unfpa-blue"
                      )}
                    >
                      {isSelected ? 'Selected' : 'Profile'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Footer Info */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Total Countries: {WCA_COUNTRIES.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-unfpa-blue" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              UNFPA Active: {WCA_COUNTRIES.filter(c => c.unfpaActive).length}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Source: UNFPA Population Data Portal</p>
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">Crisis Hotspots: {WCA_COUNTRIES.filter(c => c.crisisLevel >= 4).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortHeader({ label, fullLabel, field, current, order, onSort }: { label: string, fullLabel?: string, field: SortField, current: SortField, order: 'asc' | 'desc', onSort: (f: SortField) => void }) {
  const isActive = current === field;
  return (
    <button 
      onClick={() => onSort(field)}
      className="flex items-center gap-1.5 group/header"
      title={fullLabel || label}
    >
      <span className={cn(
        "text-[10px] font-black uppercase tracking-widest transition-colors",
        isActive ? "text-unfpa-blue" : "text-slate-400 group-hover/header:text-slate-600"
      )}>
        {label}
      </span>
      <div className="flex flex-col -gap-1">
        <ChevronUp className={cn("w-2.5 h-2.5 transition-colors", isActive && order === 'asc' ? "text-unfpa-blue" : "text-slate-200")} />
        <ChevronDown className={cn("w-2.5 h-2.5 transition-colors", isActive && order === 'desc' ? "text-unfpa-blue" : "text-slate-200")} />
      </div>
    </button>
  );
}

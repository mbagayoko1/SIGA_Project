/**
 * SourceBadge — compact, attributed provenance chip for an indicator value.
 * Renders the upstream DataSource, its reference year, and a Fresh/Stale state.
 * Used wherever an in-scope (Outcome 1–3) indicator value is displayed.
 */
import React from 'react';
import type { DataSource, IndicatorValue } from '../../types';
import { cn } from '../../lib/utils';

const SOURCE_STYLE: Record<DataSource, { dot: string; text: string; bg: string }> = {
  'UNFPA PDP':            { dot: 'bg-quantum-blue',   text: 'text-quantum-blue',   bg: 'bg-quantum-blue/10 border-quantum-blue/20' },
  DHS:                    { dot: 'bg-teal-500',       text: 'text-teal-700',       bg: 'bg-teal-50 border-teal-200' },
  'WHO GHO':              { dot: 'bg-indigo-500',     text: 'text-indigo-700',     bg: 'bg-indigo-50 border-indigo-200' },
  'UN WPP':               { dot: 'bg-violet-500',     text: 'text-violet-700',     bg: 'bg-violet-50 border-violet-200' },
  GDELT:                  { dot: 'bg-amber-500',      text: 'text-amber-700',      bg: 'bg-amber-50 border-amber-200' },
  'SIGA baseline (seed)': { dot: 'bg-slate-400',      text: 'text-slate-600',      bg: 'bg-slate-50 border-slate-200' },
};

interface Props {
  value: IndicatorValue;
  showYear?: boolean;
  showFreshness?: boolean;
  className?: string;
}

const SourceBadge: React.FC<Props> = ({ value, showYear = true, showFreshness = true, className }) => {
  const style = SOURCE_STYLE[value.source] ?? SOURCE_STYLE['SIGA baseline (seed)'];
  const title =
    `${value.source}` +
    (value.referenceYear ? ` · ${value.referenceYear}` : '') +
    (value.fallbackUsed && value.source !== 'UNFPA PDP' ? ' · fallback (PDP unavailable/stale)' : '') +
    `\n${value.sourceUrl}`;

  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap',
        style.bg,
        style.text,
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', style.dot)} />
      {value.source}
      {showYear && value.referenceYear ? (
        <span className="opacity-60 font-medium">· {value.referenceYear}</span>
      ) : null}
      {showFreshness && (
        <span
          className={cn(
            'ml-0.5 px-1 rounded text-[9px] font-bold uppercase tracking-wide',
            value.isStale ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
          )}
        >
          {value.isStale ? 'Stale' : 'Fresh'}
        </span>
      )}
    </span>
  );
};

export default SourceBadge;

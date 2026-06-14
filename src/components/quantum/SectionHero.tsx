import React from 'react';
import HeroGeoMotif from './HeroGeoMotif';

/**
 * Professional Quantum-blue hero band carrying the landing radar motif — used
 * across dashboard module screens for one consistent identity from
 * landing → home → every tab.
 */
export function SectionHero({
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        'relative overflow-hidden rounded-3xl bg-gradient-to-br from-quantum-blue via-quantum-blue-dark to-quantum-blue-darker text-white p-6 md:p-8 shadow-[0_22px_55px_-24px_rgba(14,60,102,0.6)] ' +
        (className || '')
      }
    >
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)', backgroundSize: '38px 38px' }}
      />
      <HeroGeoMotif className="pointer-events-none absolute -top-28 -right-14 w-[420px] h-[420px] opacity-45 hidden md:block" />
      <div className="absolute -bottom-24 -left-10 w-64 h-64 rounded-full bg-unfpa-orange/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {icon && (
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center [&_svg]:w-6 [&_svg]:h-6 text-white">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75 mb-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-unfpa-orange animate-pulse" />
                {eyebrow}
              </p>
            )}
            <h2 className="text-2xl md:text-[28px] font-bold tracking-tight leading-tight">{title}</h2>
            {subtitle && <p className="text-white/80 text-[13px] md:text-sm mt-1.5 leading-relaxed max-w-3xl">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="relative z-10 flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

export default SectionHero;

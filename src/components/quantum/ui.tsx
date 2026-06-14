import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Shared Quantum design-system primitives — a clean, corporate visual language
 * (white cards on a soft blue-grey canvas, Quantum-blue accents, restrained
 * typography) used to give every module a consistent, professional look.
 */

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'violet';

const TONE_SOFT: Record<Tone, string> = {
  blue: 'bg-quantum-blue-pale text-quantum-blue',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  slate: 'bg-slate-100 text-slate-600',
  violet: 'bg-violet-50 text-violet-600',
};

const TONE_SOLID: Record<Tone, string> = {
  blue: 'bg-quantum-blue text-white',
  green: 'bg-emerald-500 text-white',
  amber: 'bg-amber-500 text-white',
  red: 'bg-red-500 text-white',
  slate: 'bg-slate-700 text-white',
  violet: 'bg-violet-500 text-white',
};

/** Full-height, scrollable module shell with a consistent professional header. */
export function QuantumPage({
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
  children,
  tone = 'blue',
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-main-bg">
      <div className={cn('mx-auto w-full max-w-[1440px] px-6 lg:px-8 py-7', className)}>
        <QuantumHeader eyebrow={eyebrow} title={title} subtitle={subtitle} icon={icon} actions={actions} tone={tone} />
        <div className="mt-6 space-y-6 pb-12">{children}</div>
      </div>
    </div>
  );
}

/** Standalone professional page header (icon chip + title + actions). */
export function QuantumHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
  tone = 'blue',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-4 min-w-0">
        {icon && (
          <div
            className={cn(
              'shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm [&_svg]:w-6 [&_svg]:h-6',
              TONE_SOLID[tone],
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-quantum-blue mb-1">{eyebrow}</p>
          )}
          <h1 className="text-[26px] leading-tight font-bold tracking-tight text-text-main">{title}</h1>
          {subtitle && <p className="text-sm text-text-muted mt-1 font-medium max-w-2xl">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/** White rounded card. */
export function QCard({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-card-border shadow-sm',
        padded && 'p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Section heading row with a small icon. */
export function SectionTitle({ icon, children, className }: { icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 mb-5', className)}>
      {icon && <span className="text-quantum-blue [&_svg]:w-[18px] [&_svg]:h-[18px]">{icon}</span>}
      <h3 className="text-sm font-bold tracking-tight text-text-main">{children}</h3>
    </div>
  );
}

/** Compact KPI tile. */
export function StatTile({
  label,
  value,
  icon,
  tone = 'blue',
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <QCard className="flex flex-col gap-3" padded={false}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
          {icon && (
            <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4', TONE_SOFT[tone])}>
              {icon}
            </span>
          )}
        </div>
        <p className="text-3xl font-bold tracking-tight text-text-main tabular-nums">{value}</p>
        {hint && <p className="text-[11px] text-text-muted mt-1.5 font-medium">{hint}</p>}
      </div>
    </QCard>
  );
}

/** Small status badge. */
export function Pill({ children, tone = 'slate', className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold',
        TONE_SOFT[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Primary / secondary button helpers for header actions. */
export function QButton({
  children,
  onClick,
  variant = 'primary',
  icon,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 [&_svg]:w-4 [&_svg]:h-4',
        variant === 'primary' && 'bg-quantum-blue text-white shadow-sm hover:bg-quantum-blue-dark',
        variant === 'secondary' && 'bg-white text-text-main border border-card-border hover:border-quantum-blue hover:text-quantum-blue',
        variant === 'ghost' && 'text-text-muted hover:text-quantum-blue hover:bg-quantum-blue-pale',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

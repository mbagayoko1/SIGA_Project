import React from 'react';

/**
 * Faithful inline recreation of the UNFPA logo: the orange 3×3 dot grid, the
 * UN polar-globe emblem with olive-branch wreaths, and the "UNFPA" wordmark.
 * Self-contained (no network dependency) with a color and a reversed/white
 * variant for use on dark backgrounds.
 */
export function UnfpaLogo({
  className,
  variant = 'color',
  withWordmark = true,
}: {
  className?: string;
  variant?: 'color' | 'white';
  withWordmark?: boolean;
}) {
  const orange = variant === 'white' ? '#FFFFFF' : '#EB7D1E';
  const blue = variant === 'white' ? '#FFFFFF' : '#2E6CB5';
  const text = variant === 'white' ? '#FFFFFF' : '#EB7D1E';

  // 3x3 dot grid
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      dots.push(<circle key={`${r}-${c}`} cx={26 + c * 60} cy={26 + r * 60} r={22} fill={orange} />);
    }
  }

  // UN emblem geometry, centred at (cx, cy)
  const cx = 300;
  const cy = 86;
  const R = 56;
  const grid: React.ReactNode[] = [];
  // concentric latitude circles
  [R, R * 0.68, R * 0.36].forEach((rr, i) => (
    grid.push(<circle key={`lat-${i}`} cx={cx} cy={cy} r={rr} fill="none" stroke={blue} strokeWidth={2} />)
  ));
  // radial longitude lines
  for (let a = 0; a < 360; a += 30) {
    const rad = (a * Math.PI) / 180;
    grid.push(
      <line
        key={`lon-${a}`}
        x1={cx}
        y1={cy}
        x2={cx + R * Math.cos(rad)}
        y2={cy + R * Math.sin(rad)}
        stroke={blue}
        strokeWidth={1.5}
      />,
    );
  }

  // Olive branch (one side) — a curved stem with leaf ellipses; mirrored for the other side.
  const branch = (mirror: boolean) => {
    const sign = mirror ? -1 : 1;
    const leaves: React.ReactNode[] = [];
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const lx = cx + sign * (R + 10 + t * 36);
      const ly = cy + 40 - t * 96;
      leaves.push(
        <ellipse
          key={`lf-${mirror}-${i}`}
          cx={lx}
          cy={ly}
          rx={9}
          ry={4.5}
          fill={blue}
          transform={`rotate(${sign * (60 - t * 30)} ${lx} ${ly})`}
        />,
      );
    }
    return (
      <g key={`branch-${mirror}`}>
        <path
          d={`M ${cx + sign * (R + 6)} ${cy + 44} Q ${cx + sign * (R + 52)} ${cy} ${cx + sign * (R + 30)} ${cy - 58}`}
          fill="none"
          stroke={blue}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {leaves}
      </g>
    );
  };

  return (
    <svg viewBox="0 0 760 172" className={className} role="img" aria-label="UNFPA — United Nations Population Fund">
      {dots}
      {grid}
      {branch(false)}
      {branch(true)}
      {withWordmark && (
        <text
          x={392}
          y={120}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={800}
          fontSize={104}
          letterSpacing="-2"
          fill={text}
        >
          UNFPA
        </text>
      )}
    </svg>
  );
}

export default UnfpaLogo;

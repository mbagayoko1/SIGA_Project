import React from 'react';

/**
 * Decorative animated geospatial radar / globe motif for the landing hero.
 * Pure inline SVG + CSS keyframes (defined in index.css) — lightweight, no data
 * dependency. Echoes the UN polar-grid emblem with a scanning radar sweep and
 * pulsing geo-signal pings.
 */
export function HeroGeoMotif({ className }: { className?: string }) {
  const C = 300;
  const rings = [292, 232, 172, 112, 52];
  const radials = Array.from({ length: 12 }, (_, i) => i * 30);
  const pings = [
    { x: 372, y: 206, color: '#F57C1F', delay: '0s' },
    { x: 236, y: 330, color: '#FFFFFF', delay: '0.8s' },
    { x: 418, y: 372, color: '#FFFFFF', delay: '1.6s' },
    { x: 300, y: 150, color: '#F57C1F', delay: '2.2s' },
    { x: 196, y: 232, color: '#FFFFFF', delay: '1.1s' },
  ];

  const polar = (angleDeg: number, r: number) => {
    const a = (angleDeg * Math.PI) / 180;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };

  // Radar beam wedge (60°), rotated by the spinning group.
  const [bx0, by0] = polar(-110, 292);
  const [bx1, by1] = polar(-50, 292);

  return (
    <svg viewBox="0 0 600 600" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="siga-sweep" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.0" />
          <stop offset="55%" stopColor="#9CC4EC" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#CFE2F6" stopOpacity="0.28" />
        </radialGradient>
        <radialGradient id="siga-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* core glow */}
      <circle cx={C} cy={C} r={150} fill="url(#siga-core)" />

      {/* concentric rings */}
      {rings.map((r, i) => (
        <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="#FFFFFF" strokeOpacity={0.16 - i * 0.015} strokeWidth={1.25} />
      ))}

      {/* globe meridians/equator */}
      <ellipse cx={C} cy={C} rx={292} ry={120} fill="none" stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={1} />
      <ellipse cx={C} cy={C} rx={120} ry={292} fill="none" stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={1} />

      {/* slowly rotating radial grid */}
      <g className="siga-spin" style={{ transformOrigin: 'center', transformBox: 'fill-box' as any }}>
        {radials.map((a) => {
          const [x, y] = polar(a, 292);
          return <line key={a} x1={C} y1={C} x2={x} y2={y} stroke="#FFFFFF" strokeOpacity={0.08} strokeWidth={1} />;
        })}
      </g>

      {/* radar sweep */}
      <g className="siga-spin-fast" style={{ transformOrigin: 'center', transformBox: 'fill-box' as any }}>
        <rect x="0" y="0" width="600" height="600" fill="none" />
        <path d={`M ${C} ${C} L ${bx0} ${by0} A 292 292 0 0 1 ${bx1} ${by1} Z`} fill="url(#siga-sweep)" />
        <line x1={C} y1={C} x2={bx1} y2={by1} stroke="#CFE2F6" strokeOpacity={0.5} strokeWidth={1.5} />
      </g>

      {/* geo-signal pings */}
      {pings.map((p, i) => (
        <g key={i} style={{ transformOrigin: `${p.x}px ${p.y}px`, transformBox: 'fill-box' as any }}>
          <circle
            className="siga-ping"
            cx={p.x}
            cy={p.y}
            r={7}
            fill="none"
            stroke={p.color}
            strokeWidth={2}
            style={{ transformOrigin: `${p.x}px ${p.y}px`, transformBox: 'fill-box' as any, animationDelay: p.delay }}
          />
          <circle className="siga-blink" cx={p.x} cy={p.y} r={3.5} fill={p.color} style={{ animationDelay: p.delay }} />
        </g>
      ))}

      {/* center hub */}
      <circle cx={C} cy={C} r={5} fill="#FFFFFF" fillOpacity={0.9} />
    </svg>
  );
}

export default HeroGeoMotif;

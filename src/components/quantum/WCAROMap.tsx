import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { Star, MapPin } from 'lucide-react';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

type Group = 'fr' | 'en' | 'pt' | 'es';

interface Country {
  name: string;
  iso: string; // ISO 3166 numeric (matches world-atlas geo id)
  group: Group;
  capital: string;
  coords: [number, number];
  hq?: boolean;
}

const COUNTRIES: Country[] = [
  // Francophone (14)
  { name: 'Benin', iso: '204', group: 'fr', capital: 'Porto-Novo', coords: [2.3, 9.3] },
  { name: 'Burkina Faso', iso: '854', group: 'fr', capital: 'Ouagadougou', coords: [-1.6, 12.3] },
  { name: 'Cameroon', iso: '120', group: 'fr', capital: 'Yaoundé', coords: [12.5, 5.6] },
  { name: 'Central African Republic', iso: '140', group: 'fr', capital: 'Bangui', coords: [20.9, 6.6] },
  { name: 'Chad', iso: '148', group: 'fr', capital: "N'Djamena", coords: [18.7, 15.0] },
  { name: 'Congo – Brazzaville', iso: '178', group: 'fr', capital: 'Brazzaville', coords: [15.3, -1.0] },
  { name: "Côte d'Ivoire", iso: '384', group: 'fr', capital: 'Yamoussoukro', coords: [-5.5, 7.6] },
  { name: 'Gabon', iso: '266', group: 'fr', capital: 'Libreville', coords: [11.6, -0.6] },
  { name: 'Guinea', iso: '324', group: 'fr', capital: 'Conakry', coords: [-11.0, 10.4] },
  { name: 'Mali', iso: '466', group: 'fr', capital: 'Bamako', coords: [-3.5, 17.5] },
  { name: 'Mauritania', iso: '478', group: 'fr', capital: 'Nouakchott', coords: [-10.9, 20.3] },
  { name: 'Niger', iso: '562', group: 'fr', capital: 'Niamey', coords: [9.5, 17.6] },
  { name: 'Senegal', iso: '686', group: 'fr', capital: 'Dakar', coords: [-14.7, 14.7], hq: true },
  { name: 'Togo', iso: '768', group: 'fr', capital: 'Lomé', coords: [0.9, 8.6] },
  // Anglophone (5)
  { name: 'The Gambia', iso: '270', group: 'en', capital: 'Banjul', coords: [-15.4, 13.5] },
  { name: 'Ghana', iso: '288', group: 'en', capital: 'Accra', coords: [-1.0, 7.9] },
  { name: 'Liberia', iso: '430', group: 'en', capital: 'Monrovia', coords: [-9.4, 6.4] },
  { name: 'Nigeria', iso: '566', group: 'en', capital: 'Abuja', coords: [8.1, 9.4] },
  { name: 'Sierra Leone', iso: '694', group: 'en', capital: 'Freetown', coords: [-11.8, 8.6] },
  // Lusophone (3)
  { name: 'Cabo Verde', iso: '132', group: 'pt', capital: 'Praia', coords: [-23.6, 15.1] },
  { name: 'Guinea-Bissau', iso: '624', group: 'pt', capital: 'Bissau', coords: [-15.2, 12.0] },
  { name: 'Sao Tome & Principe', iso: '678', group: 'pt', capital: 'São Tomé', coords: [6.6, 0.3] },
  // Hispanophone (1) — the 23rd WCARO country
  { name: 'Equatorial Guinea', iso: '226', group: 'es', capital: 'Malabo', coords: [10.4, 1.6] },
];

const ISO_MAP = new Map(COUNTRIES.map((c) => [c.iso, c]));

const GROUPS: { id: Group; label: string; color: string; count: number }[] = [
  { id: 'fr', label: 'Francophone', color: '#1C6DB5', count: 14 },
  { id: 'en', label: 'Anglophone', color: '#F57C1F', count: 5 },
  { id: 'pt', label: 'Lusophone', color: '#16A34A', count: 3 },
  { id: 'es', label: 'Hispanophone', color: '#8B5CF6', count: 1 },
];
const GROUP_COLOR: Record<Group, string> = { fr: '#1C6DB5', en: '#F57C1F', pt: '#16A34A', es: '#8B5CF6' };

export default function WCAROMap() {
  const [active, setActive] = useState<Country | null>(COUNTRIES.find((c) => c.hq) || null);

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      {/* Map card */}
      <div className="relative rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-md overflow-hidden">
        {/* Floating info panel */}
        <div className="absolute top-4 left-4 z-10 max-w-[230px]">
          {active && (
            <div className="rounded-2xl bg-[#0E3C66]/85 border border-white/15 backdrop-blur-md px-4 py-3 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: GROUP_COLOR[active.group] }} />
                <p className="text-[13px] font-bold leading-tight">{active.name}</p>
              </div>
              <p className="text-[11px] text-white/70 flex items-center gap-1.5">
                {active.hq ? <Star className="w-3 h-3 text-unfpa-orange" /> : <MapPin className="w-3 h-3" />}
                {active.capital}{active.hq && ' · WCARO HQ'}
              </p>
              <p className="text-[10px] text-white/50 mt-0.5 uppercase tracking-wider">{GROUPS.find((g) => g.id === active.group)?.label}</p>
            </div>
          )}
        </div>

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [-2, 10], scale: 560 }}
          width={800}
          height={560}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const c = ISO_MAP.get(String(geo.id));
                const isWcaro = !!c;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => c && setActive(c)}
                    onClick={() => c && setActive(c)}
                    style={{
                      default: {
                        fill: isWcaro ? GROUP_COLOR[c!.group] : 'rgba(255,255,255,0.06)',
                        stroke: isWcaro ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.12)',
                        strokeWidth: isWcaro ? 0.6 : 0.4,
                        outline: 'none',
                        opacity: isWcaro ? (active && active.iso === c!.iso ? 1 : 0.9) : 1,
                        transition: 'opacity 0.2s',
                      },
                      hover: {
                        fill: isWcaro ? GROUP_COLOR[c!.group] : 'rgba(255,255,255,0.1)',
                        stroke: 'rgba(255,255,255,0.85)',
                        strokeWidth: isWcaro ? 0.9 : 0.4,
                        outline: 'none',
                        cursor: isWcaro ? 'pointer' : 'default',
                      },
                      pressed: { fill: isWcaro ? GROUP_COLOR[c!.group] : 'rgba(255,255,255,0.1)', outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {COUNTRIES.map((c) => {
            const isActive = active?.iso === c.iso;
            return (
              <Marker key={c.iso} coordinates={c.coords} onMouseEnter={() => setActive(c)} onClick={() => setActive(c)}>
                {c.hq ? (
                  <g transform="translate(-7,-7)" className="cursor-pointer">
                    <circle cx="7" cy="7" r={isActive ? 9 : 7} fill="#F57C1F" stroke="#fff" strokeWidth="1.5" />
                    <text x="7" y="10" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="700">★</text>
                  </g>
                ) : (
                  <circle
                    r={isActive ? 5 : 3}
                    fill={GROUP_COLOR[c.group]}
                    stroke="#fff"
                    strokeWidth={isActive ? 1.5 : 0.8}
                    className="cursor-pointer transition-all"
                    style={{ filter: isActive ? 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' : 'none' }}
                  />
                )}
              </Marker>
            );
          })}
        </ComposableMap>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 border-t border-white/10">
          {GROUPS.map((g) => (
            <div key={g.id} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} />
              <span className="text-[12px] text-white/80 font-medium">{g.label}</span>
              <span className="text-[11px] text-white/50 font-semibold">{g.count}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 ml-auto">
            <Star className="w-3.5 h-3.5 text-unfpa-orange" />
            <span className="text-[12px] text-white/80 font-medium">Regional HQ — Dakar</span>
          </div>
        </div>
      </div>

      {/* Country list */}
      <div className="rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-md p-5 max-h-[560px] overflow-y-auto no-scrollbar">
        <p className="text-white/60 text-[11px] font-bold uppercase tracking-[0.15em] mb-4">23 Country Offices</p>
        <div className="space-y-4">
          {GROUPS.map((g) => (
            <div key={g.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: g.color }} />
                <p className="text-[12px] font-semibold text-white">{g.label}</p>
                <span className="text-[10px] text-white/45 font-bold">{g.count}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COUNTRIES.filter((c) => c.group === g.id).map((c) => (
                  <button
                    key={c.iso}
                    onMouseEnter={() => setActive(c)}
                    onClick={() => setActive(c)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      active?.iso === c.iso
                        ? 'bg-white text-quantum-blue-darker border-white'
                        : 'bg-white/5 text-white/80 border-white/15 hover:bg-white/15'
                    }`}
                  >
                    {c.hq && '★ '}{c.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

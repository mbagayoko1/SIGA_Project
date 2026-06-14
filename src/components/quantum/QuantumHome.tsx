import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Compass, Globe2, BarChart3, FileText, ClipboardCheck, Target, Activity,
  UsersRound, ShieldAlert, Radar, Users, Shield, Heart, Baby, AlertTriangle,
  FileSearch, Map as MapIcon, LogOut, ChevronRight, Layers, Megaphone, GitBranch, Sparkles,
} from 'lucide-react';
import { ViewMode, UserProfile, INDICATORS } from '../../types';
import { WCA_COUNTRIES } from '../../data';
import { cn } from '../../lib/utils';
import QuantumTopBar from './QuantumTopBar';
import HeroGeoMotif from './HeroGeoMotif';
import { useModuleAccess, userCanAccess } from '../../lib/moduleAccess';

const HERO_STATS = [
  { icon: <Globe2 />, value: `${WCA_COUNTRIES.length}`, label: 'Programme Countries' },
  { icon: <UsersRound />, value: `${Math.round(WCA_COUNTRIES.reduce((a, c) => a + c.population, 0))}M`, label: 'People Reached' },
  { icon: <BarChart3 />, value: `${Object.keys(INDICATORS).length}`, label: 'Core Indicators' },
  { icon: <AlertTriangle />, value: `${WCA_COUNTRIES.filter((c) => c.crisisLevel >= 4).length}`, label: 'Crisis Hotspots' },
];

interface QuantumHomeProps {
  profile: UserProfile | null;
  isAdmin: boolean;
  setViewMode: (mode: ViewMode) => void;
  logout: () => void;
}

type Category = 'me' | 'fp' | 'maternal' | 'gbv' | 'demographic' | 'humanitarian' | 'admin';

interface AppTile {
  label: string;
  icon: React.ReactNode;
  view: ViewMode;
  category: Category;
  adminOnly?: boolean;
}

const TABS: { id: Category; label: string }[] = [
  { id: 'me', label: 'Me' },
  { id: 'fp', label: 'Family Planning' },
  { id: 'maternal', label: 'Maternal Health' },
  { id: 'gbv', label: 'GBV & Protection' },
  { id: 'demographic', label: 'Demographic Resilience' },
  { id: 'humanitarian', label: 'Humanitarian' },
  { id: 'admin', label: 'Administration' },
];

const APPS: AppTile[] = [
  { label: 'Platform Overview', icon: <Compass />, view: 'about-geospatial', category: 'me' },
  { label: 'Geospatial Stage', icon: <Globe2 />, view: 'stage', category: 'me' },
  { label: 'Analytics', icon: <BarChart3 />, view: 'analytics', category: 'me' },
  { label: 'Data Ledger', icon: <FileText />, view: 'table', category: 'me' },
  { label: 'Family Planning', icon: <Heart />, view: 'analytics', category: 'fp' },
  { label: 'Maternal Health', icon: <Activity />, view: 'analytics', category: 'maternal' },
  { label: 'Quantum Tracker', icon: <Activity />, view: 'quantum', category: 'maternal' },
  { label: 'Adolescent Health', icon: <Baby />, view: 'analytics', category: 'maternal' },
  { label: 'GBV Watch', icon: <ShieldAlert />, view: 'analytics', category: 'gbv' },
  { label: 'Population Dynamics', icon: <UsersRound />, view: 'dynamics', category: 'demographic' },
  { label: 'SP Alignment', icon: <ClipboardCheck />, view: 'sp-alignment', category: 'demographic' },
  { label: 'IRRF Tracking', icon: <Target />, view: 'irrf-tracking', category: 'demographic' },
  { label: 'Political Analysis', icon: <GitBranch />, view: 'political', category: 'humanitarian' },
  { label: 'Intelligence Map', icon: <Radar />, view: 'flux', category: 'humanitarian' },
  { label: 'Crisis Hotspots', icon: <AlertTriangle />, view: 'flux', category: 'humanitarian' },
  { label: 'User Management', icon: <Users />, view: 'user-management', category: 'admin', adminOnly: true },
  { label: 'My Profile', icon: <Shield />, view: 'profile', category: 'admin' },
];

const QUICK_ACTIONS: { label: string; icon: React.ReactNode; view: ViewMode; adminOnly?: boolean }[] = [
  { label: 'Platform Overview', icon: <Compass />, view: 'about-geospatial' },
  { label: 'Geospatial Stage', icon: <Globe2 />, view: 'stage' },
  { label: 'Generate Briefing', icon: <FileSearch />, view: 'stage' },
  { label: 'Live Intelligence', icon: <Radar />, view: 'flux' },
  { label: 'Strategy Alignment', icon: <ClipboardCheck />, view: 'sp-alignment' },
  { label: 'Results Framework', icon: <Target />, view: 'irrf-tracking' },
  { label: 'My Profile', icon: <Shield />, view: 'profile' },
  { label: 'User Management', icon: <Users />, view: 'user-management', adminOnly: true },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function QuantumHome({ profile, isAdmin, setViewMode, logout }: QuantumHomeProps) {
  const [tab, setTab] = useState<Category>('me');
  const moduleAccess = useModuleAccess();
  const enabled = (v: ViewMode) => userCanAccess(v, profile, moduleAccess);

  const visibleApps = APPS
    .filter((a) => (a.adminOnly ? isAdmin : true))
    .filter((a) => enabled(a.view))
    .filter((a) => tab === 'me' || a.category === tab);
  const visibleActions = QUICK_ACTIONS
    .filter((a) => (a.adminOnly ? isAdmin : true))
    .filter((a) => enabled(a.view));

  return (
    <div className="h-screen flex flex-col bg-main-bg overflow-hidden">
      <QuantumTopBar profile={profile} onHome={() => setViewMode('home')} showSearch />

      {/* Blue hero portal */}
      <div className="flex-1 overflow-y-auto bg-quantum-blue relative">
        {/* Subtle geospatial radar motif (continuity with the landing) */}
        <HeroGeoMotif className="pointer-events-none absolute -top-40 -right-24 w-[680px] h-[680px] opacity-40 hidden lg:block" />
        <div className="max-w-[1500px] mx-auto px-8 lg:px-14 relative z-10">
          {/* Greeting */}
          <div className="pt-12 pb-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full backdrop-blur-md mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-quantum-orange animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
                UNFPA WCARO · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-white text-[40px] leading-tight font-light tracking-tight">
              {greeting()}, <span className="font-semibold">{profile?.displayName || 'Analyst'}</span>
            </h1>
            <p className="text-white/70 text-sm mt-1 font-medium">
              Strategic Information &amp; Geospatial AI-Driven Analysis Portal · WCARO · Strategic Plan 2026–2029
            </p>

            {/* Regional KPI highlights */}
            <div className="flex flex-wrap gap-3 mt-6">
              {HERO_STATS.map((s) => (
                <div key={s.label} className="flex items-center gap-3 bg-white/10 border border-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl hover:bg-white/[0.16] transition-colors">
                  <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white [&_svg]:w-[18px] [&_svg]:h-[18px]">
                    {s.icon}
                  </span>
                  <div className="leading-none">
                    <p className="text-white text-lg font-bold tabular-nums">{s.value}</p>
                    <p className="text-white/60 text-[11px] font-medium mt-1">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-8 border-b border-white/20 overflow-x-auto no-scrollbar">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative whitespace-nowrap pb-3 pt-1 text-[15px] transition-colors',
                  tab === t.id ? 'text-white font-semibold' : 'text-white/65 hover:text-white font-normal',
                )}
              >
                {t.label}
                {tab === t.id && (
                  <motion.span layoutId="quantum-tab" className="absolute left-0 right-0 -bottom-px h-[3px] bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Quick Actions + Apps */}
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 py-10">
            {/* Quick actions */}
            <div>
              <p className="text-white/60 text-[11px] font-bold uppercase tracking-[0.15em] mb-5">Quick Actions</p>
              <div className="flex flex-col">
                {visibleActions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => setViewMode(a.view)}
                    className="group flex items-center gap-3 py-3 text-left border-b border-white/10 hover:pl-1 transition-all"
                  >
                    <span className="w-7 h-7 rounded-md bg-white/10 group-hover:bg-white/20 flex items-center justify-center text-white shrink-0 [&_svg]:w-4 [&_svg]:h-4 transition-colors">
                      {a.icon}
                    </span>
                    <span className="text-white text-[14px] font-medium flex-1">{a.label}</span>
                    <ChevronRight className="w-4 h-4 text-white/0 group-hover:text-white/70 transition-colors" />
                  </button>
                ))}
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('quantum:open-copilot'))}
                  className="group flex items-center gap-3 py-3 text-left border-b border-white/10 hover:pl-1 transition-all"
                >
                  <span className="w-7 h-7 rounded-md bg-white/10 group-hover:bg-white/20 flex items-center justify-center text-white shrink-0 transition-colors">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <span className="text-white text-[14px] font-medium flex-1">WCARO AI Copilot</span>
                  <ChevronRight className="w-4 h-4 text-white/0 group-hover:text-white/70 transition-colors" />
                </button>
                <button
                  onClick={logout}
                  className="group flex items-center gap-3 py-3 text-left mt-2 hover:pl-1 transition-all"
                >
                  <span className="w-7 h-7 rounded-md bg-white/10 group-hover:bg-quantum-orange flex items-center justify-center text-white shrink-0 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </span>
                  <span className="text-white/80 text-[14px] font-medium">Sign Out</span>
                </button>
              </div>
            </div>

            {/* Apps */}
            <div>
              <p className="text-white/60 text-[11px] font-bold uppercase tracking-[0.15em] mb-5">Apps</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 border-t border-l border-white/15">
                {visibleApps.map((app) => (
                  <button
                    key={app.label + app.view}
                    onClick={() => setViewMode(app.view)}
                    className="group flex flex-col items-center justify-center gap-3 py-9 px-3 border-r border-b border-white/15 hover:bg-white/10 transition-colors min-h-[150px]"
                  >
                    <span className="text-white/90 group-hover:text-white group-hover:scale-110 transition-transform [&_svg]:w-9 [&_svg]:h-9 [&_svg]:stroke-[1.4]">
                      {app.icon}
                    </span>
                    <span className="text-white text-[13px] font-medium text-center leading-tight">{app.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pb-12 flex items-center gap-3 text-white/50 text-[11px] font-medium">
            <Layers className="w-3.5 h-3.5" />
            Source: UNFPA Population Data Portal · Integrity V.24.05
            <span className="mx-2">·</span>
            <Megaphone className="w-3.5 h-3.5" />
            Live situational feed active
          </div>
        </div>
      </div>
    </div>
  );
}

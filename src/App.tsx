/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Users, 
  ShieldAlert, 
  Globe2, 
  Layers,
  BarChart3,
  Map as MapIcon,
  Info,
  CircleDot,
  FileText,
  AlertTriangle,
  UsersRound,
  ChevronDown,
  Search,
  Baby,
  X,
  Check,
  Activity,
  Radar,
  Lock,
  Shield,
  GitBranch,
  Target,
  FileSearch,
  ClipboardCheck,
  Compass,
  Home
} from 'lucide-react';
import { cn } from './lib/utils';
import { CountryData, Indicator, INDICATORS, ViewMode, SP_OUTCOMES } from './types';
import { WCA_COUNTRIES } from './data';
import MapChart from './components/MapChart';
import Dashboard from './components/Dashboard';
import AnalyticsView from './components/analytics/AnalyticsView';
import AnalysisPanel from './components/AnalysisPanel';
import DataTable from './components/DataTable';
import StrategicBriefingModal from './components/StrategicBriefingModal';
import LiveAlerts from './components/LiveAlerts';
import HubAnalysis from './components/HubAnalysis';
import QuantumTracker from './components/QuantumTracker';
import PoliticalAnalysis from './components/PoliticalAnalysis';
import IntelligenceMap from './components/IntelligenceMap';
import LandingPage from './components/LandingPage';
import SPAlignmentSection from './components/StrategyAlignment';
import IRRFTrackingSection from './components/IRRFTracking';

import { useUser } from './contexts/UserContext';
import UserManagement from './components/UserManagement';
import ProfileView from './components/UserProfile';
import PopulationDynamicsDashboard from './components/PopulationDynamicsDashboard';
import AboutGeospatialPlatform from './components/AboutGeospatialPlatform';
import QuantumHome from './components/quantum/QuantumHome';
import QuantumBrand from './components/quantum/QuantumBrand';
import WCAROCopilot from './components/WCAROCopilot';
import { useModuleAccess, userCanAccess } from './lib/moduleAccess';

export default function App() {
  const { user, profile, loading, login, logout, isAdmin } = useUser();
  const [selectedIndicators, setSelectedIndicators] = useState<Indicator[]>(['mmr']);
  const [selectedCountries, setSelectedCountries] = useState<CountryData[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [showIndicatorSelector, setShowIndicatorSelector] = useState(false);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const moduleAccess = useModuleAccess();
  const en = (k: ViewMode) => userCanAccess(k, profile, moduleAccess);

  // If the current module is deactivated globally or not granted to this user, return to home.
  React.useEffect(() => {
    const managed: ViewMode[] = ['about-geospatial', 'stage', 'analytics', 'table', 'sp-alignment', 'irrf-tracking', 'quantum', 'dynamics', 'political', 'flux'];
    if (managed.includes(viewMode) && !userCanAccess(viewMode, profile, moduleAccess)) {
      setViewMode('home');
    }
  }, [moduleAccess, viewMode, profile]);

  const toggleIndicator = (id: Indicator) => {
    setSelectedIndicators(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(i => i !== id);
      }
      return [...prev, id];
    });
  };

  const toggleCountry = (country: CountryData) => {
    setSelectedCountries(prev => 
      prev.find(c => c.id === country.id) 
        ? prev.filter(c => c.id !== country.id)
        : [...prev, country]
    );
  };

  const toggleAllCountries = () => {
    if (selectedCountries.length === WCA_COUNTRIES.length) {
      setSelectedCountries([]);
    } else {
      setSelectedCountries([...WCA_COUNTRIES]);
    }
  };

  const removeCountry = (id: string) => {
    setSelectedCountries(prev => prev.filter(c => c.id !== id));
  };

  const handleLogin = async (user: string, pass: string) => {
    // Original mock login - we now use Firebase via LandingPage
    try {
      await login();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center">
         <Activity className="w-12 h-12 text-unfpa-blue animate-pulse mb-4" />
         <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Calibrating Geopolitical Core...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={login} error={null} />;
  }

  if (viewMode === 'home') {
    return (
      <>
        <QuantumHome
          profile={profile}
          isAdmin={isAdmin}
          setViewMode={setViewMode}
          logout={logout}
        />
        <WCAROCopilot onNavigate={setViewMode} currentView={viewMode} />
      </>
    );
  }

  return (
    <div className={cn(
      "grid grid-rows-[64px_1fr] h-screen overflow-hidden bg-main-bg font-sans",
      (viewMode === 'stage' || viewMode === 'table')
        ? "grid-cols-[240px_1fr_320px]"
        : "grid-cols-[240px_1fr]"
    )}>
      {/* Header */}
      <header className="col-span-3 bg-white border-b border-card-border flex items-center justify-between px-6 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode('home')}
            className="flex items-center gap-4 hover:opacity-80 transition-opacity"
          >
            <QuantumBrand />
          </button>
          <div className="h-8 w-px bg-slate-200 mx-1" />
          <div className="flex flex-col">
            <span className="text-quantum-blue-darker font-black uppercase tracking-tight leading-none text-[13px]">SIGA Portal</span>
            <span className="text-[9px] text-unfpa-orange font-black uppercase tracking-[0.2em] mt-1">Strategic Plan 2026-2029 | wcaro</span>
          </div>
        </div>

        {/* Global Navigation Switcher */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-4">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-card-border shadow-sm overflow-x-auto overflow-y-hidden no-scrollbar max-w-full">
            <ViewModeButton
              active={false}
              onClick={() => setViewMode('home')}
              icon={<Home className="w-3.5 h-3.5" />}
              label="Home"
            />
            {en('about-geospatial') && <ViewModeButton
              active={viewMode === 'about-geospatial'}
              onClick={() => setViewMode('about-geospatial')}
              icon={<Compass className="w-3.5 h-3.5" />}
              label="Intelligence Platform"
            />}
            {en('stage') && <ViewModeButton
              active={viewMode === 'stage'}
              onClick={() => setViewMode('stage')}
              icon={<Globe2 className="w-3.5 h-3.5" />}
              label="Stage"
            />}
          {en('analytics') && <ViewModeButton
            active={viewMode === 'analytics'}
            onClick={() => setViewMode('analytics')}
            icon={<BarChart3 className="w-3.5 h-3.5" />}
            label="Analytics"
          />}
          {en('table') && <ViewModeButton
            active={viewMode === 'table'}
            onClick={() => setViewMode('table')}
            icon={<FileText className="w-3.5 h-3.5" />}
            label="Ledger"
          />}
          <div className="w-px h-4 bg-slate-200 mx-1" />
          {en('sp-alignment') && <ViewModeButton
            active={viewMode === 'sp-alignment'}
            onClick={() => setViewMode('sp-alignment')}
            icon={<ClipboardCheck className="w-3.5 h-3.5" />}
            label="SP Alignment"
          />}
          {en('irrf-tracking') && <ViewModeButton
            active={viewMode === 'irrf-tracking'}
            onClick={() => setViewMode('irrf-tracking')}
            icon={<Target className="w-3.5 h-3.5" />}
            label="IRRF Tracking"
          />}
          <div className="w-px h-4 bg-slate-200 mx-1" />
          {en('quantum') && <ViewModeButton
            active={viewMode === 'quantum'}
            onClick={() => setViewMode('quantum')}
            icon={<Activity className="w-3.5 h-3.5" />}
            label="Quantum"
          />}
          {en('dynamics') && <ViewModeButton
            active={viewMode === 'dynamics'}
            onClick={() => setViewMode('dynamics')}
            icon={<UsersRound className="w-3.5 h-3.5" />}
            label="Dynamics"
          />}
          {en('political') && <ViewModeButton
            active={viewMode === 'political'}
            onClick={() => setViewMode('political')}
            icon={<ShieldAlert className="w-3.5 h-3.5" />}
            label="Political"
          />}
          {en('flux') && <ViewModeButton
            active={viewMode === 'flux'}
            onClick={() => setViewMode('flux')}
            icon={<Radar className="w-3.5 h-3.5" />}
            label="Geospatial Monitoring"
          />}
          <div className="w-px h-4 bg-slate-200 mx-1" />
          {isAdmin && (
            <ViewModeButton 
              active={viewMode === 'user-management'} 
              onClick={() => setViewMode('user-management')}
              icon={<Users className="w-3.5 h-3.5" />}
              label="Admin"
            />
          )}
          <ViewModeButton 
            active={viewMode === 'profile'} 
            onClick={() => setViewMode('profile')}
            icon={<Shield className="w-3.5 h-3.5" />}
            label="Profile"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 text-xs text-text-main">
          <div className="flex items-center gap-3 border-l border-card-border pl-6">
            <div className="flex flex-col items-end mr-3">
               <span className="text-[10px] font-black text-slate-900 leading-none mb-1">{profile?.displayName}</span>
               <span className="text-[8px] font-black text-unfpa-blue uppercase tracking-widest">{profile?.role}</span>
            </div>
            <button 
              onClick={logout}
              className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              <Lock className="w-3 h-3" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar — Quantum portal blue */}
      <aside className="bg-gradient-to-b from-quantum-blue to-quantum-blue-dark flex flex-col p-5 gap-7 overflow-y-auto relative">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)', backgroundSize: '42px 42px' }}
        />
        {Object.values(SP_OUTCOMES).map((outcome) => (
          <div key={outcome.id} className="relative z-10">
            <p className="text-[10px] whitespace-nowrap overflow-hidden text-ellipsis uppercase tracking-[0.18em] text-white/60 font-bold mb-3 flex items-center gap-2" title={outcome.label}>
              <span className="w-2 h-2 rounded-full shrink-0 ring-2 ring-white/20" style={{ background: outcome.color }} />
              {outcome.label.split(':')[0]}
            </p>
            <div className="flex flex-col">
              {outcome.indicators.map((indicatorId) => (
                <SidebarLink
                  key={indicatorId}
                  active={selectedIndicators.includes(indicatorId)}
                  onClick={() => toggleIndicator(indicatorId)}
                  icon={
                    indicatorId === 'mmr' ? <Activity className="w-4 h-4" /> :
                    indicatorId === 'unmetNeed' ? <AlertTriangle className="w-4 h-4" /> :
                    indicatorId === 'gbvPrevalence' ? <ShieldAlert className="w-4 h-4" /> :
                    indicatorId === 'mCPR' ? <Users className="w-4 h-4" /> :
                    indicatorId === 'demandSatisfied' ? <Check className="w-4 h-4" /> :
                    indicatorId === 'adolescentBirthRate' ? <Baby className="w-4 h-4" /> :
                    indicatorId === 'demographicDynamics' ? <CircleDot className="w-4 h-4" /> :
                    indicatorId === 'idpCount' ? <UsersRound className="w-4 h-4" /> :
                    indicatorId === 'refugeeCount' ? <Globe2 className="w-4 h-4" /> :
                    <Activity className="w-4 h-4" />
                  }
                >
                  {INDICATORS[indicatorId].label}
                </SidebarLink>
              ))}
            </div>
          </div>
        ))}
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex flex-col p-6 gap-6 bg-[#fcfdfe] overflow-hidden",
        (viewMode === 'quantum' || viewMode === 'political' || (viewMode as any) === 'flux' || viewMode === 'sp-alignment' || viewMode === 'irrf-tracking' || viewMode === 'user-management' || viewMode === 'profile' || viewMode === 'dynamics' || viewMode === 'about-geospatial' || viewMode === 'analytics') && "p-0"
      )}>
        {(viewMode === 'stage' || viewMode === 'table') ? (
          <>
            <div className="flex justify-between items-start shrink-0 p-0">
              <div className="max-w-xl">
            <h2 className="text-[26px] font-bold tracking-tight text-text-main leading-tight">
              {selectedIndicators.length === 1
                ? INDICATORS[selectedIndicators[0]].label
                : `${selectedIndicators.length} Indicators Selected`
              }
            </h2>
            <p className="text-sm text-text-muted mt-2 font-medium">
              {selectedIndicators.length === 1 
                ? "Cross-border comparative analysis and situational monitoring from the Population Data Portal."
                : `Comparing ${selectedIndicators.map(id => INDICATORS[id].label).join(', ')} across the WCA region.`
              }
            </p>
          </div>

          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="flex items-center gap-3">
              {/* Indicator Selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowIndicatorSelector(!showIndicatorSelector)}
                  className="bg-white border-2 border-slate-200 px-4 py-2.5 rounded-xl text-xs font-black text-text-main shadow-sm flex items-center gap-3 transition-all hover:border-unfpa-blue min-w-[220px] group uppercase tracking-widest"
                >
                  <Layers className="w-4 h-4 text-unfpa-blue" />
                  <span className="flex-1 text-left truncate max-w-[140px]">
                    {selectedIndicators.length === 1 
                      ? INDICATORS[selectedIndicators[0]].label 
                      : `${selectedIndicators.length} Mixed Metrics`
                    }
                  </span>
                  <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", showIndicatorSelector && "rotate-180")} />
                </button>
                
                <AnimatePresence>
                  {showIndicatorSelector && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-3 w-[280px] bg-white border border-card-border rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-2 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar text-left">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-2">Family Planning Analysis</p>
                          <div className="space-y-1">
                            {['mCPR', 'demandSatisfied', 'unmetNeed'].map((id) => (
                              <button
                                key={id}
                                onClick={() => toggleIndicator(id as Indicator)}
                                className={cn(
                                  "w-full flex items-center justify-between p-2 rounded-lg text-[10px] font-bold transition-colors",
                                  selectedIndicators.includes(id as Indicator) ? "bg-unfpa-blue/10 text-unfpa-blue" : "text-text-main hover:bg-slate-50"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn("w-1.5 h-1.5 rounded-full", selectedIndicators.includes(id as Indicator) ? "bg-unfpa-blue" : "bg-slate-300")} />
                                  {INDICATORS[id as Indicator].label}
                                </div>
                                {selectedIndicators.includes(id as Indicator) && <Check className="w-3 h-3" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-2">Strategic Pillars</p>
                          <div className="space-y-1">
                            {['mmr', 'adolescentBirthRate', 'gbvPrevalence', 'demographicDynamics'].map((id) => (
                              <button
                                key={id}
                                onClick={() => toggleIndicator(id as Indicator)}
                                className={cn(
                                  "w-full flex items-center justify-between p-2 rounded-lg text-[10px] font-bold transition-colors",
                                  selectedIndicators.includes(id as Indicator) ? "bg-unfpa-blue/10 text-unfpa-blue" : "text-text-main hover:bg-slate-50"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn("w-1.5 h-1.5 rounded-full", selectedIndicators.includes(id as Indicator) ? "bg-unfpa-blue" : "bg-slate-300")} />
                                  {INDICATORS[id as Indicator].label}
                                </div>
                                {selectedIndicators.includes(id as Indicator) && <Check className="w-3 h-3" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-2">Humanitarian Watch</p>
                          <div className="space-y-1">
                            {['idpCount', 'refugeeCount', 'crisisLevel'].map((id) => (
                              <button
                                key={id}
                                onClick={() => toggleIndicator(id as Indicator)}
                                className={cn(
                                  "w-full flex items-center justify-between p-2 rounded-lg text-[10px] font-bold transition-colors",
                                  selectedIndicators.includes(id as Indicator) ? "bg-red-50 text-red-600" : "text-text-main hover:bg-slate-50"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn("w-1.5 h-1.5 rounded-full", selectedIndicators.includes(id as Indicator) ? "bg-red-600" : "bg-slate-300")} />
                                  {INDICATORS[id as Indicator].label}
                                </div>
                                {selectedIndicators.includes(id as Indicator) && <Check className="w-3 h-3" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Country Selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowCountrySelector(!showCountrySelector)}
                  className="bg-white border-2 border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-text-main shadow-sm flex items-center gap-3 transition-all hover:border-unfpa-blue min-w-[240px] group"
                >
                  <Search className="w-4 h-4 text-text-muted group-hover:text-unfpa-blue transition-colors" />
                  <span className="flex-1 text-left">
                    {selectedCountries.length === 0 ? 'Select Countries...' : `${selectedCountries.length} Profiles Selected`}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", showCountrySelector && "rotate-180")} />
                </button>
                
                <AnimatePresence>
                  {showCountrySelector && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-3 w-[240px] bg-white border border-card-border rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                        <button 
                          onClick={toggleAllCountries}
                          className={cn(
                            "w-full flex items-center justify-between p-2 rounded-lg text-[11px] font-black transition-colors text-left border-b border-slate-100 mb-1",
                            selectedCountries.length === WCA_COUNTRIES.length 
                              ? "bg-unfpa-blue text-white shadow-sm" 
                              : "text-unfpa-blue hover:bg-unfpa-blue/5"
                          )}
                        >
                          {selectedCountries.length === WCA_COUNTRIES.length ? 'Deselect All Regions' : 'Select All Regions'}
                          {selectedCountries.length === WCA_COUNTRIES.length ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        </button>
                        {WCA_COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)).map(country => {
                          const isSelected = selectedCountries.find(c => c.id === country.id);
                          return (
                            <button 
                              key={country.id}
                              onClick={() => toggleCountry(country)}
                              className={cn(
                                "w-full flex items-center justify-between p-2 rounded-lg text-[11px] font-bold transition-colors text-left",
                                isSelected ? "bg-unfpa-blue/10 text-unfpa-blue" : "text-text-main hover:bg-slate-50"
                              )}
                            >
                              {country.name}
                              {isSelected && <Check className="w-3 h-3" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
  
            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2 justify-end max-w-sm">
              {selectedCountries.map(country => (
                <span key={country.id} className="bg-unfpa-blue text-white text-[10px] font-black px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm uppercase tracking-tighter">
                  {country.name}
                  <button onClick={() => removeCountry(country.id)} className="hover:text-red-200 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedCountries.length > 0 && (
                <button 
                  onClick={() => setSelectedCountries([])}
                  className="text-[10px] font-bold text-red-600 hover:text-red-700 underline"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 w-full min-h-0 relative mt-2">
          <AnimatePresence mode="wait">
            {viewMode === 'stage' && (
              <motion.div 
                key="stage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="flex-1 min-h-0 flex flex-col">
                  <MapChart 
                    selectedIndicators={selectedIndicators} 
                    onToggleCountry={toggleCountry}
                    selectedCountryIds={selectedCountries.map(c => c.id)}
                  />
                  <div className="mt-4 p-4 bg-white rounded-2xl border border-card-border shadow-sm flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <span className="text-[9px] font-black text-unfpa-blue uppercase tracking-[0.2em]">Geospatial Intelligence Active</span>
                        <div className="flex items-center gap-1.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[9px] font-bold text-slate-400 uppercase">Live Situational Feed</span>
                        </div>
                     </div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-relaxed">
                        Interactive stage — Direct geospatial manipulation enabled
                     </p>
                  </div>
                </div>
              </motion.div>
            )}

            {viewMode === 'analytics' && (
              <motion.div 
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 overflow-y-auto custom-scrollbar pr-2"
              >
                <Dashboard 
                  selectedIndicators={selectedIndicators} 
                  selectedCountries={selectedCountries} 
                  onToggleCountry={toggleCountry}
                  onIndicatorChange={(id) => toggleIndicator(id as Indicator)}
                />
              </motion.div>
            )}

            {viewMode === 'table' && (
              <motion.div 
                key="table"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <DataTable 
                  selectedIndicators={selectedIndicators}
                  selectedCountries={selectedCountries}
                  onToggleCountry={toggleCountry}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </>
        ) : viewMode === 'analytics' ? (
          <AnalyticsView />
        ) : viewMode === 'about-geospatial' ? (
          <AboutGeospatialPlatform />
        ) : viewMode === 'quantum' ? (
          <QuantumTracker />
        ) : viewMode === 'political' ? (
          <PoliticalAnalysis onNavigateQuantum={() => setViewMode('quantum')} />
        ) : viewMode === 'sp-alignment' ? (
          <SPAlignmentSection />
        ) : viewMode === 'irrf-tracking' ? (
          <IRRFTrackingSection />
        ) : viewMode === 'user-management' ? (
          <UserManagement />
        ) : viewMode === 'profile' ? (
          <ProfileView />
        ) : viewMode === 'dynamics' ? (
          <PopulationDynamicsDashboard />
        ) : (
          <IntelligenceMap />
        )}
      </main>

      {/* Stats/Analysis Panel - Only visible in core dashboard views */}
      {(viewMode === 'stage' || viewMode === 'table') && (
        <aside className="bg-white border-l border-card-border p-6 flex flex-col gap-6 overflow-y-auto w-80">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-unfpa-blue">
              <BarChart3 className="w-5 h-5" />
              <h3 className="text-xs font-black uppercase tracking-widest">Resilience Tracking</h3>
            </div>
            
            {selectedCountries.length > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-card-border">
                  <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Impacted Population (Aggregated)</p>
                  <p className="text-2xl font-black text-unfpa-blue tracking-tighter">
                    {selectedCountries.reduce((acc, c) => acc + c.population, 0).toFixed(1)}M
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-unfpa-blue" />
                    <span className="text-[10px] font-bold text-text-main">{selectedCountries.length} Nations Selected</span>
                  </div>
                </div>

                <div className="h-[280px]">
                  <LiveAlerts selectedCountryNames={selectedCountries.map(c => c.name)} />
                </div>

                <HubAnalysis selectedCountryNames={selectedCountries.map(c => c.name)} />
                
                <AnalysisPanel 
                  selectedCountries={selectedCountries} 
                  selectedIndicators={selectedIndicators} 
                  onNavigateQuantum={() => setViewMode('quantum')}
                />
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                  <MapIcon className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-xs text-text-muted font-bold uppercase tracking-tight italic leading-relaxed">
                  Select specific country segments on the geospatial stage for integrated analysis
                </p>
              </div>
            )}
          </div>

          {selectedCountries.some(c => c.crisisLevel >= 4) && (
            <div className="bg-red-50 border-2 border-red-100 rounded-xl p-5 shadow-sm animate-pulse">
              <div className="flex items-center gap-2 text-red-700 mb-3">
                <AlertTriangle className="w-5 h-5 fill-red-100" />
                <p className="font-black text-[10px] uppercase tracking-widest">Crisis Escalation Detected</p>
              </div>
              <p className="text-xs text-red-900 leading-relaxed font-medium">
                Multi-country crisis intersection identified. Population displacement vectors suggest high pressure on UNFPA regional hubs. Immediate humanitarian realignment suggested.
              </p>
            </div>
          )}

          <div className="mt-auto space-y-3">
            <p className="text-[9px] text-text-muted font-bold uppercase tracking-[0.2em] text-center">Source: UNFPA Population Data Portal | Integrity V.24.05</p>
            <button 
              onClick={() => setIsBriefingOpen(true)}
              className="w-full bg-unfpa-blue text-white p-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-unfpa-blue/20 transition-all hover:scale-[1.02] active:scale-95 leading-none"
            >
              Generate Narrative Briefing
            </button>
          </div>

          <StrategicBriefingModal 
            isOpen={isBriefingOpen}
            onClose={() => setIsBriefingOpen(false)}
            selectedCountries={selectedCountries}
            selectedIndicators={selectedIndicators}
          />
        </aside>
      )}

      {/* Click outside to close selectors */}
      {(showCountrySelector || showIndicatorSelector) && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => {
          setShowCountrySelector(false);
          setShowIndicatorSelector(false);
        }} />
      )}

      {/* WCARO AI Copilot — floating assistant */}
      <WCAROCopilot onNavigate={setViewMode} currentView={viewMode} />
    </div>
  );
}

function ViewModeButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
        active ? "bg-white text-unfpa-blue shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function SidebarLink({ children, icon, active, onClick }: { children: React.ReactNode, icon?: React.ReactNode, active?: boolean, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full flex items-center gap-3 px-2.5 py-2.5 text-left text-[13px] font-medium transition-all",
        active
          ? "bg-white text-quantum-blue rounded-xl shadow-sm font-semibold my-0.5"
          : "text-white/85 hover:text-white border-b border-white/10 last:border-0 hover:pl-3.5"
      )}
    >
      <span
        className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors [&_svg]:w-4 [&_svg]:h-4",
          active ? "bg-quantum-blue text-white" : "bg-white/10 text-white group-hover:bg-white/20"
        )}
      >
        {icon}
      </span>
      <span className="flex-1 leading-snug">{children}</span>
    </button>
  );
}

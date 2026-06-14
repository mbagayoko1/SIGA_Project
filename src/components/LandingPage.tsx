import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck, AlertCircle, Chrome, Activity, Globe2, BarChart3, Radar,
  Brain, Lock, ArrowRight, Building2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import QuantumBrand from './quantum/QuantumBrand';
import UnfpaLogo from './quantum/UnfpaLogo';
import HeroGeoMotif from './quantum/HeroGeoMotif';
import WCAROMap from './quantum/WCAROMap';
import { MapPin } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  error?: string | null;
}

const CAPABILITIES = [
  { icon: <Globe2 />, title: 'Geospatial Intelligence', desc: 'Interactive maps and multivariate risk heatmapping across 24 WCA countries.' },
  { icon: <Brain />, title: 'AI-Driven Foresight', desc: 'Strategic narrative briefings and scenario modelling powered by Gemini.' },
  { icon: <BarChart3 />, title: 'Demographic Resilience', desc: 'Population dynamics and Strategic Plan 2026–2029 results tracking.' },
  { icon: <Radar />, title: 'Humanitarian Watch', desc: 'Real-time situational feeds, crisis hotspots, and hub logistics.' },
];

export default function LandingPage({ onLogin, error }: LandingPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await onLogin();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col font-sans bg-quantum-blue-darker text-white relative overflow-x-hidden">
      {/* ===== HERO (first screen) ===== */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-quantum-blue via-quantum-blue-dark to-quantum-blue-darker" />
      <div className="pointer-events-none absolute -top-40 -right-40 w-[680px] h-[680px] rounded-full bg-quantum-blue-light/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-52 -left-40 w-[560px] h-[560px] rounded-full bg-unfpa-orange/10 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
        }}
      />
      {/* Animated geospatial radar motif */}
      <HeroGeoMotif className="pointer-events-none absolute -right-48 top-1/2 -translate-y-1/2 w-[820px] h-[820px] opacity-70 hidden lg:block" />
      <HeroGeoMotif className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] opacity-30 lg:hidden" />

      {/* Top bar */}
      <header className="relative z-10 px-6 lg:px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <UnfpaLogo variant="white" className="h-8 w-auto" />
          <div className="h-7 w-px bg-white/20" />
          <div className="flex items-center gap-2.5">
            <div className="bg-white rounded-lg p-1.5">
              <QuantumBrand compact />
            </div>
            <span className="font-bold tracking-tight text-[15px]">SIGA Portal</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-white/60">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">Global Portal Security</span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center px-6 lg:px-10 py-8">
        <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_440px] gap-12 items-center">
          {/* Left: hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 rounded-full border border-white/20 backdrop-blur-md mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-unfpa-orange animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">UNFPA · West &amp; Central Africa Regional Office</span>
            </div>

            <h1 className="text-4xl lg:text-[52px] font-bold tracking-tight leading-[1.05] mb-6">
              Strategic Information &amp; <br className="hidden lg:block" />
              Geospatial <span className="text-white/70">AI-Driven Analysis</span> Portal
            </h1>

            <p className="text-lg text-white/75 font-medium leading-relaxed max-w-2xl mb-10">
              SIGA unifies demographic intelligence, geospatial analysis, and AI-driven foresight into a single
              command surface for the 2026–2029 Strategic Plan.
            </p>

            {/* Capability cards */}
            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
              {CAPABILITIES.map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                  className="group flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-md hover:bg-white/[0.12] transition-colors"
                >
                  <span className="shrink-0 w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white [&_svg]:w-5 [&_svg]:h-5 group-hover:scale-110 transition-transform">
                    {c.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-tight mb-1">{c.title}</p>
                    <p className="text-[12px] text-white/60 leading-snug">{c.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: sign-in card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-3xl shadow-[0_40px_80px_-24px_rgba(7,30,55,0.55)] p-9 text-text-main"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-quantum-blue text-white flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight leading-none">Identity Verification</h2>
                <p className="text-[12px] text-text-muted mt-1 font-medium">Sign in with your organizational account.</p>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-red-600 mb-5"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-[12px] font-semibold">{error}</span>
              </motion.div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className={cn(
                'group w-full flex items-center justify-center gap-3 bg-quantum-blue text-white py-3.5 rounded-2xl text-sm font-semibold shadow-sm transition-all hover:bg-quantum-blue-dark active:scale-[0.98]',
                isSubmitting && 'opacity-80 cursor-wait',
              )}
            >
              {isSubmitting ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <span className="w-6 h-6 bg-white/15 rounded-lg flex items-center justify-center">
                  <Chrome className="w-4 h-4" />
                </span>
              )}
              {isSubmitting ? 'Verifying…' : 'Sign in with Google'}
              {!isSubmitting && <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 -translate-x-1 transition-all" />}
            </button>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-[0.15em]">Secured Access</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[12px] text-text-muted">
                <Building2 className="w-4 h-4 text-quantum-blue shrink-0" />
                <span>Authorized UNFPA WCARO personnel only.</span>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-text-muted">
                <Lock className="w-4 h-4 text-quantum-blue shrink-0" />
                <span>Protected by the UNFPA Global Information Security Management System (GISMS).</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mt-7 pt-6 border-t border-slate-100">
              By signing in you confirm adherence to the{' '}
              <span className="text-quantum-blue font-semibold">UN Information Security Policy</span> and Regional Data
              Sovereignty Frameworks.
            </p>
          </motion.div>
        </div>
      </main>
      </section>

      {/* ===== WCARO regional coverage map ===== */}
      <section className="relative z-10 px-6 lg:px-10 py-14 lg:py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 backdrop-blur-md mb-4">
              <MapPin className="w-3.5 h-3.5 text-unfpa-orange" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">Regional Coverage · Dakar, Senegal</span>
            </div>
            <h2 className="text-3xl lg:text-[40px] font-bold tracking-tight leading-[1.1] mb-4">
              23 Country Offices across <span className="text-white/70">West &amp; Central Africa</span>
            </h2>
            <p className="text-white/70 font-medium leading-relaxed">
              The UNFPA West and Central Africa Regional Office (WCARO) provides regional oversight, technical assistance,
              and capacity development for 23 country offices — grouped here by official working language. Hover or tap a
              country to explore.
            </p>
          </div>
          <WCAROMap />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
        <p className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} UNFPA · United Nations Population Fund
        </p>
        <div className="flex gap-6">
          <span className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.18em]">Privacy Policy</span>
          <span className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.18em]">Security Protocol</span>
        </div>
      </footer>
    </div>
  );
}

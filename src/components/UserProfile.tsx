import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  User, Mail, MapPin, Briefcase, Globe, Edit3, Shield, Save, X, Camera,
  Activity, Lock, Clock, FileText, CheckCircle2, BadgeCheck,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile, UserRole, ActivityLog } from '../types';
import { useUser } from '../contexts/UserContext';
import { userService } from '../services/userService';
import HeroGeoMotif from './quantum/HeroGeoMotif';

export default function ProfileView() {
  const { profile, refreshProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (profile) userService.setActor(profile);
    userService.getActivityLogs(200).then(setLogs).catch(() => setLogs([]));
  }, [profile]);

  const myLogs = useMemo(
    () => (profile ? logs.filter((l) => l.userId === profile.uid || l.userName === profile.displayName) : []),
    [logs, profile],
  );

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-main-bg">
        <Activity className="w-10 h-10 text-quantum-blue animate-spin mb-3 opacity-30" />
        <p className="text-[12px] font-semibold text-text-muted">Loading profile…</p>
      </div>
    );
  }

  const roleStyles =
    profile.role === UserRole.ADMIN ? 'bg-red-500/20 text-red-100 border-red-400/40' :
    profile.role === UserRole.EDITOR ? 'bg-amber-500/20 text-amber-100 border-amber-300/40' :
    'bg-emerald-500/20 text-emerald-100 border-emerald-300/40';

  const memberDays = Math.max(1, Math.floor((Date.now() - profile.createdAt) / 864e5));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await userService.updateUserProfile(profile.uid, editedProfile);
      await refreshProfile();
      userService.getActivityLogs(200).then(setLogs).catch(() => {});
      setIsEditing(false);
    } catch (error) {
      console.error('Save profile failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => {
    setEditedProfile({
      displayName: profile.displayName,
      title: profile.title,
      department: profile.department,
      location: profile.location,
      bio: profile.bio,
      photoURL: profile.photoURL,
    });
    setIsEditing(true);
  };

  return (
    <div className="flex flex-col h-full bg-main-bg overflow-y-auto custom-scrollbar">
      {/* Hero */}
      <div className="relative h-44 shrink-0 bg-gradient-to-br from-quantum-blue via-quantum-blue-dark to-quantum-blue-darker overflow-hidden">
        <HeroGeoMotif className="pointer-events-none absolute -top-32 -right-12 w-[480px] h-[480px] opacity-40 hidden md:block" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)', backgroundSize: '42px 42px' }}
        />
        <div className="absolute bottom-0 left-0 w-full px-8 lg:px-12 translate-y-1/2">
          <div className="flex items-end gap-6">
            <div className="relative">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.displayName} className="w-28 h-28 rounded-3xl border-4 border-white shadow-xl object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-28 h-28 rounded-3xl border-4 border-white bg-quantum-blue-pale text-quantum-blue flex items-center justify-center shadow-xl text-3xl font-bold">
                  {profile.displayName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 mb-5">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{profile.displayName}</h2>
                <span className={cn('px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border backdrop-blur-md', roleStyles)}>
                  <Shield className="w-3 h-3" /> {profile.role}
                </span>
              </div>
              <p className="text-sm font-medium text-white/80">{profile.title || 'Regional Strategy Adviser'} · {profile.location || 'WCARO Dakar'}</p>
            </div>
            <div className="mb-5 flex gap-2.5">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2.5 bg-white/15 text-white rounded-xl text-[13px] font-semibold hover:bg-white/25 transition-all flex items-center gap-2 backdrop-blur-md">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={isSaving} className="px-5 py-2.5 bg-white text-quantum-blue rounded-xl text-[13px] font-semibold shadow-sm hover:bg-white/90 transition-all flex items-center gap-2 disabled:opacity-70">
                    {isSaving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
                  </button>
                </>
              ) : (
                <button onClick={startEditing} className="px-5 py-2.5 bg-white text-quantum-blue rounded-xl text-[13px] font-semibold shadow-sm hover:bg-white/90 transition-all flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Edit profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 mt-20 px-8 lg:px-12 pb-12">
        <div className="grid grid-cols-12 gap-8">
          {/* Main */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <section className="bg-white p-8 rounded-2xl border border-card-border shadow-sm">
              <h3 className="text-sm font-bold text-text-main mb-6 flex items-center gap-2.5">
                <span className="w-1 h-5 bg-quantum-blue rounded-full" /> Professional Details
              </h3>

              {isEditing ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <Field label="Full name" value={editedProfile.displayName || ''} onChange={(v) => setEditedProfile({ ...editedProfile, displayName: v })} />
                    <Field label="Title" value={editedProfile.title || ''} placeholder="Regional Analyst" onChange={(v) => setEditedProfile({ ...editedProfile, title: v })} />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <Field label="Department" value={editedProfile.department || ''} onChange={(v) => setEditedProfile({ ...editedProfile, department: v })} />
                    <Field label="Duty station" value={editedProfile.location || ''} onChange={(v) => setEditedProfile({ ...editedProfile, location: v })} />
                  </div>
                  <Field label="Avatar URL (optional)" value={editedProfile.photoURL || ''} placeholder="https://…" onChange={(v) => setEditedProfile({ ...editedProfile, photoURL: v })} />
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-text-muted">Biography</label>
                    <textarea
                      className="w-full bg-slate-50 border border-card-border rounded-xl p-4 text-[13px] font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-quantum-blue/15 focus:border-quantum-blue min-h-[120px]"
                      value={editedProfile.bio || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                      placeholder="Describe your role and strategic focus areas…"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-7">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem icon={<Mail className="w-4 h-4" />} label="Email" value={profile.email} />
                    <InfoItem icon={<Briefcase className="w-4 h-4" />} label="Department" value={profile.department || 'Strategic Planning'} />
                    <InfoItem icon={<MapPin className="w-4 h-4" />} label="Duty station" value={profile.location || 'WCARO Dakar'} />
                    <InfoItem icon={<Clock className="w-4 h-4" />} label="Member since" value={`${new Date(profile.createdAt).toLocaleDateString()} · ${memberDays}d`} />
                  </div>
                  <div className="pt-6 border-t border-slate-50">
                    <p className="text-[12px] font-semibold text-text-muted mb-2">Biography</p>
                    <p className="text-[14px] text-slate-600 leading-relaxed">
                      {profile.bio || 'No biography provided yet. Use “Edit profile” to add your role and strategic focus areas.'}
                    </p>
                  </div>
                </div>
              )}
            </section>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Security clearance */}
              <div className="bg-quantum-blue-darker p-7 rounded-2xl text-white">
                <h4 className="text-[12px] font-semibold text-quantum-blue-light uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Security Clearance
                </h4>
                <div className="space-y-3.5">
                  <SecurityCheck label="Multi-factor authentication" active />
                  <SecurityCheck label="Regional data access" active />
                  <SecurityCheck label="Export & reporting rights" active={profile.role !== UserRole.VIEWER} />
                  <SecurityCheck label="Administration privileges" active={profile.role === UserRole.ADMIN} />
                </div>
              </div>

              {/* Activity impact */}
              <div className="bg-gradient-to-br from-quantum-blue to-quantum-blue-dark p-7 rounded-2xl text-white">
                <h4 className="text-[12px] font-semibold text-white/70 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Activity Impact
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 p-4 rounded-xl">
                    <p className="text-[11px] font-medium text-white/60 mb-1">Actions logged</p>
                    <p className="text-2xl font-bold tabular-nums">{myLogs.length}</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-xl">
                    <p className="text-[11px] font-medium text-white/60 mb-1">Account status</p>
                    <p className="text-2xl font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5" /> {profile.active === false ? 'Off' : 'On'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[12px] text-white/70">
                  <BadgeCheck className="w-4 h-4" /> Verified organizational account
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-7 rounded-2xl border border-card-border shadow-sm">
              <h4 className="text-sm font-bold text-text-main mb-5 flex items-center gap-2">
                <Activity className="w-[18px] h-[18px] text-quantum-blue" /> Recent Activity
              </h4>
              <div className="space-y-1">
                {myLogs.slice(0, 6).map((log) => (
                  <ActivityRow key={log.id} title={log.action} time={timeAgo(log.timestamp)} />
                ))}
                <ActivityRow title="Account created" time={new Date(profile.createdAt).toLocaleDateString()} muted />
                {myLogs.length === 0 && (
                  <p className="text-[12px] text-text-muted py-2">No recent actions recorded for this account.</p>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-7 rounded-2xl border border-card-border">
              <Lock className="w-7 h-7 text-slate-300 mb-3" />
              <h4 className="text-[14px] font-bold text-text-main mb-1.5">Privacy &amp; Data Sovereignty</h4>
              <p className="text-[12px] text-text-muted leading-relaxed">
                Operational data is held under UNFPA WCARO jurisdiction. Personal profiles are visible only to regional administrators.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-semibold text-text-muted">{label}</label>
      <input
        className="w-full bg-slate-50 border border-card-border rounded-xl px-4 py-2.5 text-[13px] font-medium text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-quantum-blue/15 focus:border-quantum-blue"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="w-9 h-9 rounded-xl bg-quantum-blue-pale text-quantum-blue flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-[14px] font-semibold text-text-main truncate">{value}</p>
      </div>
    </div>
  );
}

function SecurityCheck({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] font-medium text-white/70">{label}</span>
      <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide', active ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-white/40')}>
        {active ? 'Granted' : 'Restricted'}
      </span>
    </div>
  );
}

const ActivityRow: React.FC<{ title: string; time: string; muted?: boolean }> = ({ title, time, muted }) => {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
      <span className={cn('w-2 h-2 rounded-full shrink-0', muted ? 'bg-slate-200' : 'bg-quantum-blue')} />
      <p className={cn('text-[13px] font-medium flex-1 truncate', muted ? 'text-text-muted' : 'text-text-main')}>{title}</p>
      <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{time}</span>
    </div>
  );
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

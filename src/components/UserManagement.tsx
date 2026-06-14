import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Shield, Edit3, Trash2, Search, History, UserPlus, MoreVertical,
  Activity, MapPin, Mail, X, Save, UserCog, Power, Download, LayoutGrid,
  CheckCircle2, ShieldCheck, Clock, Filter,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile, UserRole, ActivityLog, ViewMode } from '../types';
import { userService } from '../services/userService';
import { useUser } from '../contexts/UserContext';
import { MANAGED_MODULES, useModuleAccess, setModuleEnabled } from '../lib/moduleAccess';
import { StatTile, QCard, Pill } from './quantum/ui';
import HeroGeoMotif from './quantum/HeroGeoMotif';

type AdminTab = 'users' | 'logs' | 'access';

const roleTone = (r: UserRole): 'red' | 'amber' | 'green' => (r === UserRole.ADMIN ? 'red' : r === UserRole.EDITOR ? 'amber' : 'green');
const roleLabel = (r: UserRole) => (r === UserRole.ADMIN ? 'Admin' : r === UserRole.EDITOR ? 'Editor' : 'Viewer');

export default function UserManagement() {
  const { profile: currentUserProfile, isAdmin } = useUser();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [menuOpenUserId, setMenuOpenUserId] = useState<string | null>(null);
  const [confirmingDeleteUserId, setConfirmingDeleteUserId] = useState<string | null>(null);
  const moduleAccess = useModuleAccess();

  useEffect(() => {
    if (currentUserProfile) userService.setActor(currentUserProfile);
  }, [currentUserProfile]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, allLogs] = await Promise.all([userService.getAllUsers(), userService.getActivityLogs()]);
      setUsers(allUsers);
      setLogs(allLogs);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    await userService.updateUserProfile(userId, { role: newRole });
    setMenuOpenUserId(null);
    loadData();
  };

  const handleToggleActive = async (user: UserProfile) => {
    await userService.updateUserProfile(user.uid, { active: !(user.active !== false) });
    setMenuOpenUserId(null);
    loadData();
  };

  const handleDeleteUser = async (userId: string) => {
    await userService.deleteUserProfile(userId);
    setConfirmingDeleteUserId(null);
    setMenuOpenUserId(null);
    loadData();
  };

  const handleSaveUser = async (userData: Partial<UserProfile>) => {
    if (editingUser) {
      await userService.updateUserProfile(editingUser.uid, userData);
    } else {
      await userService.createUserProfile({
        uid: userData.uid || `user_${Date.now()}`,
        email: userData.email || '',
        displayName: userData.displayName || '',
        role: userData.role || UserRole.VIEWER,
        title: userData.title,
        location: userData.location,
        department: userData.department,
        photoURL: userData.photoURL,
        allowedModules: userData.allowedModules,
        active: true,
      });
    }
    setIsModalOpen(false);
    setEditingUser(null);
    loadData();
  };

  const exportAudit = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIGA_audit_trail_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredUsers = useMemo(
    () =>
      users.filter((u) =>
        [u.displayName, u.email, u.title, u.department].some((f) => f?.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
    [users, searchQuery],
  );
  const filteredLogs = useMemo(
    () => logs.filter((l) => [l.userName, l.action].some((f) => f?.toLowerCase().includes(searchQuery.toLowerCase()))),
    [logs, searchQuery],
  );

  const stats = useMemo(() => {
    const active = users.filter((u) => u.active !== false).length;
    return {
      total: users.length,
      active,
      inactive: users.length - active,
      admins: users.filter((u) => u.role === UserRole.ADMIN).length,
      enabledModules: MANAGED_MODULES.filter((m) => moduleAccess[m.key] !== false).length,
    };
  }, [users, moduleAccess]);

  return (
    <div className="flex flex-col h-full bg-main-bg" onClick={() => setMenuOpenUserId(null)}>
      {/* Header — Quantum blue hero with radar */}
      <div className="relative overflow-hidden bg-gradient-to-br from-quantum-blue via-quantum-blue-dark to-quantum-blue-darker px-8 pt-8 pb-6">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)', backgroundSize: '38px 38px' }} />
        <HeroGeoMotif className="pointer-events-none absolute -top-28 -right-14 w-[420px] h-[420px] opacity-45 hidden md:block" />
        <div className="relative z-10 flex items-start justify-between gap-4 mb-7">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/15 border border-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-white/75 uppercase tracking-[0.18em] mb-1">Administration</p>
              <h2 className="text-[26px] font-bold tracking-tight text-white leading-tight">Access Control Hub</h2>
              <p className="text-sm text-white/80 mt-1 font-medium">Manage users, permissions, module access and the audit trail.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-white/10 border border-white/20 backdrop-blur-md p-1 rounded-xl">
              <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users className="w-3.5 h-3.5" />} label="Users" />
              <TabButton active={activeTab === 'access'} onClick={() => setActiveTab('access')} icon={<LayoutGrid className="w-3.5 h-3.5" />} label="Module Access" />
              <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<History className="w-3.5 h-3.5" />} label="Audit Trail" />
            </div>
            {isAdmin && activeTab === 'users' && (
              <button
                onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-quantum-blue rounded-xl text-[13px] font-semibold hover:bg-white/90 transition-all active:scale-95 shadow-sm"
              >
                <UserPlus className="w-4 h-4" /> Add User
              </button>
            )}
            {activeTab === 'logs' && (
              <button
                onClick={exportAudit}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl text-[13px] font-semibold hover:bg-white/20 transition-all backdrop-blur-md"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            )}
          </div>
        </div>

        {activeTab !== 'access' && (
          <div className="relative z-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder={activeTab === 'users' ? 'Search users by name, email, title or department…' : 'Search the audit trail…'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 backdrop-blur-md rounded-xl text-[13px] font-medium text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/15 transition-all"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatTile label="Total Users" value={stats.total} icon={<Users />} tone="blue" />
          <StatTile label="Active" value={stats.active} icon={<CheckCircle2 />} tone="green" hint={`${stats.inactive} deactivated`} />
          <StatTile label="Administrators" value={stats.admins} icon={<ShieldCheck />} tone="red" />
          <StatTile label="Modules Enabled" value={`${stats.enabledModules}/${MANAGED_MODULES.length}`} icon={<LayoutGrid />} tone="violet" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <Activity className="w-10 h-10 animate-pulse mb-3" />
            <p className="text-[11px] font-semibold uppercase tracking-widest">Synchronizing…</p>
          </div>
        ) : activeTab === 'users' ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredUsers.map((user) => {
              const active = user.active !== false;
              return (
                <motion.div
                  key={user.uid}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('bg-white p-6 rounded-2xl border border-card-border shadow-sm transition-all', !active && 'opacity-70')}
                >
                  <div className="flex items-start gap-5">
                    <Avatar user={user} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-bold text-text-main flex items-center gap-2 truncate">
                            {user.displayName}
                            {user.uid === currentUserProfile?.uid && (
                              <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">You</span>
                            )}
                          </h3>
                          <p className="text-[12px] text-text-muted font-medium mt-0.5 truncate">
                            {user.title || 'Regional Analyst'} · {user.department || 'Strategic Planning'}
                          </p>
                        </div>
                        {isAdmin && (
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setMenuOpenUserId(menuOpenUserId === user.uid ? null : user.uid)} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4 text-slate-400" />
                            </button>
                            <AnimatePresence>
                              {menuOpenUserId === user.uid && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute right-0 top-full mt-1 bg-white border border-card-border rounded-xl shadow-xl z-20 w-52 overflow-hidden py-1"
                                >
                                  {confirmingDeleteUserId === user.uid ? (
                                    <div className="p-3">
                                      <p className="text-[12px] font-semibold text-red-700 mb-2 text-center">Remove {user.displayName.split(' ')[0]}?</p>
                                      <div className="flex gap-2">
                                        <button onClick={() => handleDeleteUser(user.uid)} className="flex-1 py-1.5 bg-red-600 text-white text-[11px] font-semibold rounded-lg">Remove</button>
                                        <button onClick={() => setConfirmingDeleteUserId(null)} className="flex-1 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-lg">Cancel</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <MenuItem icon={<Edit3 className="w-3.5 h-3.5" />} onClick={() => { setEditingUser(user); setIsModalOpen(true); setMenuOpenUserId(null); }}>Edit details</MenuItem>
                                      <MenuItem icon={<Power className="w-3.5 h-3.5" />} onClick={() => handleToggleActive(user)} tone={active ? 'amber' : 'green'}>
                                        {active ? 'Deactivate' : 'Activate'}
                                      </MenuItem>
                                      <div className="h-px bg-slate-100 my-1" />
                                      <p className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-300">Set role</p>
                                      <MenuItem icon={<Shield className="w-3.5 h-3.5" />} onClick={() => handleUpdateRole(user.uid, UserRole.ADMIN)} tone="red">Admin</MenuItem>
                                      <MenuItem icon={<Shield className="w-3.5 h-3.5" />} onClick={() => handleUpdateRole(user.uid, UserRole.EDITOR)} tone="amber">Editor</MenuItem>
                                      <MenuItem icon={<Shield className="w-3.5 h-3.5" />} onClick={() => handleUpdateRole(user.uid, UserRole.VIEWER)} tone="green">Viewer</MenuItem>
                                      {user.uid !== currentUserProfile?.uid && (
                                        <>
                                          <div className="h-px bg-slate-100 my-1" />
                                          <MenuItem icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setConfirmingDeleteUserId(user.uid)} tone="red">Remove user</MenuItem>
                                        </>
                                      )}
                                    </>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Pill tone={roleTone(user.role)}><Shield className="w-3 h-3" /> {roleLabel(user.role)}</Pill>
                        <Pill tone={active ? 'green' : 'slate'}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-slate-400')} />
                          {active ? 'Active' : 'Inactive'}
                        </Pill>
                        <Pill tone="violet">
                          <LayoutGrid className="w-3 h-3" />
                          {user.role === UserRole.ADMIN ? 'All modules' : `${user.allowedModules ? user.allowedModules.length : MANAGED_MODULES.length}/${MANAGED_MODULES.length} modules`}
                        </Pill>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-slate-50">
                        <InfoRow icon={<Mail className="w-3.5 h-3.5" />}>{user.email}</InfoRow>
                        <InfoRow icon={<MapPin className="w-3.5 h-3.5" />}>{user.location || 'WCARO Dakar'}</InfoRow>
                        <InfoRow icon={<Clock className="w-3.5 h-3.5" />}>Joined {new Date(user.createdAt).toLocaleDateString()}</InfoRow>
                        <InfoRow icon={<Activity className="w-3.5 h-3.5" />}>
                          {user.lastActive ? `Active ${timeAgo(user.lastActive)}` : '—'}
                        </InfoRow>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filteredUsers.length === 0 && <EmptyState icon={<Users />} label="No users match your search." />}
          </div>
        ) : activeTab === 'access' ? (
          <ModuleAccessPanel access={moduleAccess} isAdmin={isAdmin} onToggle={(k, v) => { setModuleEnabled(k, v); userService.logActivity(currentUserProfile?.uid || 'system', currentUserProfile?.displayName || 'Admin', v ? 'Module Activated' : 'Module Deactivated', { module: k }); }} />
        ) : (
          <QCard padded={false} className="overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-card-border">
                  {['Timestamp', 'User', 'Action', 'Context'].map((h) => (
                    <th key={h} className="px-6 py-4 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 text-[12px] text-text-muted font-medium whitespace-nowrap tabular-nums">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-quantum-blue-pale text-quantum-blue flex items-center justify-center text-[11px] font-bold">{(log.userName || '?').charAt(0)}</span>
                        <span className="text-[13px] font-semibold text-text-main">{log.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5"><AuditBadge action={log.action} /></td>
                    <td className="px-6 py-3.5 text-[12px] text-text-muted font-medium max-w-[280px] truncate">{contextText(log)}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr><td colSpan={4}><EmptyState icon={<History />} label="No audit events yet. Administrative actions will appear here." /></td></tr>
                )}
              </tbody>
            </table>
          </QCard>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-7 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-quantum-blue text-white rounded-xl flex items-center justify-center">
                    {editingUser ? <UserCog className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-text-main">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <UserForm initialData={editingUser || undefined} onSave={handleSaveUser} onCancel={() => setIsModalOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Compliance footer */}
      <div className="bg-quantum-blue-darker px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <ShieldCheck className="w-5 h-5 text-quantum-blue-light" />
          <div>
            <p className="text-[13px] font-semibold">Compliance protocol active</p>
            <p className="text-[11px] text-white/55">All administrative actions are recorded in the audit trail.</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">{logs.length} events logged</span>
      </div>
    </div>
  );
}

/* ---------- sub-components ---------- */

function Avatar({ user }: { user: UserProfile }) {
  const initials = user.displayName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="relative shrink-0">
      {user.photoURL ? (
        <img src={user.photoURL} alt={user.displayName} className="w-14 h-14 rounded-2xl object-cover border border-slate-100" referrerPolicy="no-referrer" />
      ) : (
        <div className="w-14 h-14 rounded-2xl bg-quantum-blue-pale text-quantum-blue flex items-center justify-center text-base font-bold">{initials}</div>
      )}
    </div>
  );
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-text-muted font-medium min-w-0">
      <span className="text-slate-400 shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}

function MenuItem({ icon, children, onClick, tone = 'slate' }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void; tone?: 'slate' | 'red' | 'amber' | 'green' }) {
  const color = tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-600' : tone === 'green' ? 'text-emerald-600' : 'text-text-main';
  return (
    <button onClick={onClick} className={cn('w-full px-3 py-2 text-left text-[13px] font-medium hover:bg-slate-50 flex items-center gap-2.5 transition-colors', color)}>
      {icon}{children}
    </button>
  );
}

function AuditBadge({ action }: { action: string }) {
  const tone =
    /Created|Activated/.test(action) ? 'green' :
    /Removed|Deactivated|Deleted/.test(action) ? 'red' :
    /Role|Updated|Module/.test(action) ? 'blue' : 'slate';
  return <Pill tone={tone as any}>{action}</Pill>;
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-300">
      <span className="[&_svg]:w-10 [&_svg]:h-10 mb-3">{icon}</span>
      <p className="text-[13px] font-medium text-text-muted">{label}</p>
    </div>
  );
}

function ModuleAccessPanel({ access, isAdmin, onToggle }: { access: Record<string, boolean | undefined>; isAdmin: boolean; onToggle: (key: any, value: boolean) => void }) {
  return (
    <QCard>
      <div className="flex items-center gap-2.5 mb-1">
        <LayoutGrid className="w-[18px] h-[18px] text-quantum-blue" />
        <h3 className="text-sm font-bold text-text-main">Module Access Control</h3>
      </div>
      <p className="text-[13px] text-text-muted mb-6">Activate or deactivate platform tabs. Deactivated modules are hidden from the navigation and home portal for everyone.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {MANAGED_MODULES.map((m) => {
          const enabled = access[m.key] !== false;
          return (
            <div key={m.key} className={cn('flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors', enabled ? 'border-card-border bg-white' : 'border-slate-100 bg-slate-50')}>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-text-main flex items-center gap-2">
                  {m.label}
                  {!enabled && <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Off</span>}
                </p>
                <p className="text-[12px] text-text-muted truncate">{m.description}</p>
              </div>
              <Toggle checked={enabled} disabled={!isAdmin} onChange={(v) => onToggle(m.key, v)} />
            </div>
          );
        })}
      </div>
    </QCard>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50',
        checked ? 'bg-quantum-blue' : 'bg-slate-300',
      )}
      aria-pressed={checked}
    >
      <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform', checked && 'translate-x-5')} />
    </button>
  );
}

function UserForm({ initialData, onSave, onCancel }: { initialData?: UserProfile; onSave: (data: Partial<UserProfile>) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState<Partial<UserProfile>>(
    initialData || { displayName: '', email: '', role: UserRole.VIEWER, title: '', department: 'Strategic Planning', location: 'Dakar, Senegal', photoURL: '' },
  );
  // Per-user module grants. New users default to all modules; existing users
  // load their grants (legacy users with none default to all).
  const [modules, setModules] = useState<ViewMode[]>(initialData?.allowedModules ?? MANAGED_MODULES.map((m) => m.key));
  const valid = (formData.displayName || '').trim() && (formData.email || '').trim();
  const input = 'w-full px-4 py-2.5 bg-slate-50 border border-card-border rounded-xl text-[13px] font-medium text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-quantum-blue/15 focus:border-quantum-blue transition-all';
  const isAdminRole = formData.role === UserRole.ADMIN;

  const toggleModule = (k: ViewMode) => setModules((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  const allKeys = MANAGED_MODULES.map((m) => m.key);

  const submit = () => {
    if (!valid) return;
    onSave({ ...formData, allowedModules: isAdminRole ? allKeys : modules });
  };

  return (
    <>
      <div className="p-7 space-y-5 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full name"><input className={input} value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} placeholder="Dr. Jane Cooper" /></Field>
          <Field label="Email address"><input type="email" className={input} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jane.cooper@unfpa.org" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Role">
            <select className={input} value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}>
              <option value={UserRole.VIEWER}>Viewer</option>
              <option value={UserRole.EDITOR}>Editor</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </select>
          </Field>
          <Field label="Title"><input className={input} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="M&E Specialist" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Department"><input className={input} value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="Health Systems" /></Field>
          <Field label="Location"><input className={input} value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Dakar, Senegal" /></Field>
        </div>
        <Field label="Avatar URL (optional)"><input className={input} value={formData.photoURL} onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })} placeholder="https://…" /></Field>

        {/* Module access grants */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-semibold text-text-muted">Module access</label>
            {!isAdminRole && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setModules(allKeys)} className="text-[11px] font-semibold text-quantum-blue hover:underline">Select all</button>
                <span className="text-slate-300">·</span>
                <button type="button" onClick={() => setModules([])} className="text-[11px] font-semibold text-slate-400 hover:underline">Clear</button>
              </div>
            )}
          </div>

          {isAdminRole ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-quantum-blue-pale text-quantum-blue text-[12px] font-medium">
              <ShieldCheck className="w-4 h-4" /> Admins have access to every module by default.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                {MANAGED_MODULES.map((m) => {
                  const on = modules.includes(m.key);
                  return (
                    <button
                      type="button"
                      key={m.key}
                      onClick={() => toggleModule(m.key)}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-colors',
                        on ? 'border-quantum-blue bg-quantum-blue-pale' : 'border-card-border bg-white hover:border-slate-300',
                      )}
                    >
                      <span className={cn('w-4 h-4 rounded-[5px] border flex items-center justify-center shrink-0', on ? 'bg-quantum-blue border-quantum-blue text-white' : 'border-slate-300')}>
                        {on && <CheckCircle2 className="w-3 h-3" />}
                      </span>
                      <span className="text-[12px] font-semibold text-text-main truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-text-muted">{modules.length} of {allKeys.length} modules granted. Home and Profile are always available.</p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 p-7 pt-4 border-t border-slate-100 shrink-0">
        <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[13px] font-semibold hover:bg-slate-200 transition-all">Cancel</button>
        <button onClick={submit} disabled={!valid} className="flex-[2] py-3 bg-quantum-blue text-white rounded-xl text-[13px] font-semibold hover:bg-quantum-blue-dark transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">
          <Save className="w-4 h-4" /> {initialData ? 'Save changes' : 'Create user'}
        </button>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-semibold text-text-muted">{label}</label>
      {children}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap', active ? 'bg-white text-quantum-blue shadow-sm' : 'text-white/70 hover:text-white')}>
      {icon}{label}
    </button>
  );
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function contextText(log: ActivityLog): string {
  const m = log.metadata;
  if (!m) return '—';
  if (m.name) return m.name;
  if (m.module) return `Module: ${m.module}`;
  if (m.updates) return Object.keys(m.updates).join(', ');
  if (m.targetUid) return m.targetUid;
  return JSON.stringify(m).slice(0, 48);
}

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole, ActivityLog } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';
import { hasSupabase, supabase } from '../lib/supabase';

const USERS_COLLECTION = 'users';
const LOGS_COLLECTION = 'activityLogs';

// Provider selection (checked in this order):
//   1. Supabase   — when VITE_SUPABASE_URL/ANON_KEY are configured (primary DB)
//   2. Firestore  — when a real Firebase config is present (legacy path)
//   3. mock       — localStorage; fully functional offline with zero keys
const IS_MOCK = firebaseConfig.apiKey === 'remixed-api-key' || !firebaseConfig.apiKey;
const LS_USERS = 'siga_users';
const LS_LOGS = 'siga_logs';

// The admin performing actions, used to attribute audit-trail entries in mock mode.
let actor: { uid: string; name: string } = { uid: 'system', name: 'System' };

const now = () => Date.now();
const uuid = () => 'id_' + Math.random().toString(36).slice(2, 10) + now().toString(36);

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLS<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

function seedUsers(): UserProfile[] {
  const t = now();
  return [
    { uid: 'dev-mbagayoko', email: 'mbagayoko@unfpa.org', displayName: 'Moussa BAGAYOKO', role: UserRole.ADMIN, title: 'Strategic Information Analyst', department: 'WCARO — Strategic Information Unit', location: 'Dakar, Senegal', active: true, createdAt: t - 220 * 864e5, updatedAt: t, lastActive: t },
    { uid: 'u_adiallo', email: 'adiallo@unfpa.org', displayName: 'Aïssata Diallo', role: UserRole.EDITOR, title: 'M&E Specialist', department: 'Strategic Planning', location: 'Dakar, Senegal', active: true, createdAt: t - 140 * 864e5, updatedAt: t - 3 * 864e5, lastActive: t - 2 * 36e5 },
    { uid: 'u_kmensah', email: 'kmensah@unfpa.org', displayName: 'Kwame Mensah', role: UserRole.VIEWER, title: 'Data Analyst', department: 'Population & Development', location: 'Accra, Ghana', active: true, createdAt: t - 96 * 864e5, updatedAt: t - 12 * 864e5, lastActive: t - 26 * 36e5 },
    { uid: 'u_fsow', email: 'fsow@unfpa.org', displayName: 'Fatou Sow', role: UserRole.EDITOR, title: 'GBV Programme Coordinator', department: 'Gender & Human Rights', location: 'Dakar, Senegal', active: true, createdAt: t - 60 * 864e5, updatedAt: t - 1 * 864e5, lastActive: t - 5 * 36e5 },
    { uid: 'u_jpkabila', email: 'jpkabila@unfpa.org', displayName: 'Jean-Paul Kabila', role: UserRole.VIEWER, title: 'Field Logistics Officer', department: 'Humanitarian Action', location: 'Kinshasa, DRC', active: false, createdAt: t - 30 * 864e5, updatedAt: t - 8 * 864e5, lastActive: t - 18 * 864e5 },
  ];
}

function getLocalUsers(): UserProfile[] {
  let users = readLS<UserProfile[]>(LS_USERS, []);
  if (!users.length) {
    users = seedUsers();
    writeLS(LS_USERS, users);
  }
  return users;
}

function getLocalLogs(): ActivityLog[] {
  return readLS<ActivityLog[]>(LS_LOGS, []);
}

function pushLocalLog(entry: Omit<ActivityLog, 'id'>) {
  const logs = getLocalLogs();
  logs.unshift({ ...entry, id: uuid() });
  writeLS(LS_LOGS, logs.slice(0, 500));
}

/* ---------------------------------------------------------------------------
 * Supabase provider — `profiles` + `activity_logs` tables (snake_case rows).
 * Mirrors the mock/Firestore behavior; errors degrade to safe empty results
 * so a network blip never crashes the admin UI.
 * ------------------------------------------------------------------------- */
const ts = (iso: string | null | undefined): number | undefined => (iso ? Date.parse(iso) : undefined);

function rowToProfile(r: any): UserProfile {
  return {
    uid: r.uid,
    email: r.email,
    displayName: r.display_name,
    role: r.role as UserRole,
    active: r.active,
    allowedModules: r.allowed_modules ?? undefined,
    title: r.title ?? undefined,
    department: r.department ?? undefined,
    location: r.location ?? undefined,
    bio: r.bio ?? undefined,
    photoURL: r.photo_url ?? undefined,
    lastActive: ts(r.last_active),
    createdAt: ts(r.created_at) ?? Date.now(),
    updatedAt: ts(r.updated_at) ?? Date.now(),
  };
}

function profileToRow(p: Partial<UserProfile>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (p.uid !== undefined) row.uid = p.uid;
  if (p.email !== undefined) row.email = p.email;
  if (p.displayName !== undefined) row.display_name = p.displayName;
  if (p.role !== undefined) row.role = p.role;
  if (p.active !== undefined) row.active = p.active;
  if (p.allowedModules !== undefined) row.allowed_modules = p.allowedModules;
  if (p.title !== undefined) row.title = p.title;
  if (p.department !== undefined) row.department = p.department;
  if (p.location !== undefined) row.location = p.location;
  if (p.bio !== undefined) row.bio = p.bio;
  if (p.photoURL !== undefined) row.photo_url = p.photoURL;
  row.updated_at = new Date().toISOString();
  return row;
}

const supa = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const { data, error } = await supabase().from('profiles').select('*').eq('uid', uid).maybeSingle();
    if (error) { console.error('[supabase] getUserProfile:', error.message); return null; }
    return data ? rowToProfile(data) : null;
  },
  async createUserProfile(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
    const { error } = await supabase().from('profiles').insert(profileToRow({ active: true, ...profile }));
    if (error) { console.error('[supabase] createUserProfile:', error.message); return; }
    await userService.logActivity(actor.uid, actor.name, 'User Created', { targetUid: profile.uid, name: profile.displayName });
  },
  async deleteUserProfile(uid: string): Promise<void> {
    const { error } = await supabase().from('profiles').delete().eq('uid', uid);
    if (error) { console.error('[supabase] deleteUserProfile:', error.message); return; }
    await userService.logActivity(actor.uid, actor.name, 'User Removed', { targetUid: uid });
  },
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const { error } = await supabase().from('profiles').update(profileToRow(updates)).eq('uid', uid);
    if (error) { console.error('[supabase] updateUserProfile:', error.message); return; }
    const action =
      'active' in updates ? (updates.active ? 'User Activated' : 'User Deactivated') :
      'role' in updates ? 'Role Updated' : 'Profile Updated';
    await userService.logActivity(actor.uid, actor.name, action, { targetUid: uid, updates });
  },
  async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase().from('profiles').select('*').order('created_at', { ascending: false });
    if (error) { console.error('[supabase] getAllUsers:', error.message); return []; }
    return (data ?? []).map(rowToProfile);
  },
  async logActivity(userId: string, userName: string, action: string, metadata?: any): Promise<void> {
    const { error } = await supabase().from('activity_logs').insert({
      user_id: userId, user_name: userName, action, metadata: metadata ?? null,
    });
    if (error) console.error('[supabase] logActivity:', error.message);
  },
  async getActivityLogs(count = 100): Promise<ActivityLog[]> {
    const { data, error } = await supabase().from('activity_logs').select('*').order('ts', { ascending: false }).limit(count);
    if (error) { console.error('[supabase] getActivityLogs:', error.message); return []; }
    return (data ?? []).map((r: any) => ({
      id: String(r.id), userId: r.user_id, userName: r.user_name, action: r.action,
      timestamp: ts(r.ts) ?? Date.now(), metadata: r.metadata ?? undefined,
    }));
  },
};

export const userService = {
  /** Record who is performing admin actions (for audit attribution in mock mode). */
  setActor(profile: { uid: string; displayName: string } | null) {
    actor = profile ? { uid: profile.uid, name: profile.displayName } : { uid: 'system', name: 'System' };
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (hasSupabase) return supa.getUserProfile(uid);
    if (IS_MOCK) return getLocalUsers().find((u) => u.uid === uid) || null;
    try {
      const docSnap = await getDoc(doc(db, USERS_COLLECTION, uid));
      return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${uid}`);
      return null;
    }
  },

  async createUserProfile(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
    if (hasSupabase) return supa.createUserProfile(profile);
    const timestamp = now();
    const newProfile: UserProfile = { active: true, ...profile, createdAt: timestamp, updatedAt: timestamp };
    if (IS_MOCK) {
      const users = getLocalUsers();
      if (!users.find((u) => u.uid === newProfile.uid)) users.push(newProfile);
      writeLS(LS_USERS, users);
      await this.logActivity(actor.uid, actor.name, 'User Created', { targetUid: profile.uid, name: profile.displayName });
      return;
    }
    try {
      await setDoc(doc(db, USERS_COLLECTION, profile.uid), newProfile);
      const user = auth.currentUser;
      await this.logActivity(user?.uid || 'system', user?.displayName || 'System', 'User Created', { targetUid: profile.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${USERS_COLLECTION}/${profile.uid}`);
    }
  },

  async deleteUserProfile(uid: string): Promise<void> {
    if (hasSupabase) return supa.deleteUserProfile(uid);
    if (IS_MOCK) {
      const users = getLocalUsers();
      const target = users.find((u) => u.uid === uid);
      writeLS(LS_USERS, users.filter((u) => u.uid !== uid));
      await this.logActivity(actor.uid, actor.name, 'User Removed', { targetUid: uid, name: target?.displayName });
      return;
    }
    try {
      await deleteDoc(doc(db, USERS_COLLECTION, uid));
      const user = auth.currentUser;
      await this.logActivity(user?.uid || 'system', user?.displayName || 'System', 'User Removed', { targetUid: uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${USERS_COLLECTION}/${uid}`);
    }
  },

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    if (hasSupabase) return supa.updateUserProfile(uid, updates);
    if (IS_MOCK) {
      const users = getLocalUsers();
      const idx = users.findIndex((u) => u.uid === uid);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...updates, updatedAt: now() };
        writeLS(LS_USERS, users);
      }
      const action =
        'active' in updates ? (updates.active ? 'User Activated' : 'User Deactivated') :
        'role' in updates ? 'Role Updated' : 'Profile Updated';
      await this.logActivity(actor.uid, actor.name, action, { targetUid: uid, updates });
      return;
    }
    try {
      await updateDoc(doc(db, USERS_COLLECTION, uid), { ...updates, updatedAt: now() });
      const user = auth.currentUser;
      if (user) {
        const action =
          'active' in updates ? (updates.active ? 'User Activated' : 'User Deactivated') :
          'role' in updates ? 'Role Updated' : 'Profile Updated';
        await this.logActivity(user.uid, user.displayName || 'Unknown', action, { targetUid: uid, updates });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${uid}`);
    }
  },

  async getAllUsers(): Promise<UserProfile[]> {
    if (hasSupabase) return supa.getAllUsers();
    if (IS_MOCK) return [...getLocalUsers()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    try {
      const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
      return querySnapshot.docs.map((d) => d.data() as UserProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
      return [];
    }
  },

  async logActivity(userId: string, userName: string, action: string, metadata?: any): Promise<void> {
    if (hasSupabase) return supa.logActivity(userId, userName, action, metadata);
    if (IS_MOCK) {
      pushLocalLog({ userId, userName, action, timestamp: now(), metadata: metadata || null });
      return;
    }
    try {
      const logData: Omit<ActivityLog, 'id'> = { userId, userName, action, timestamp: now(), metadata: metadata || null };
      const docRef = await addDoc(collection(db, LOGS_COLLECTION), logData);
      await updateDoc(docRef, { id: docRef.id });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  },

  async getActivityLogs(count = 100): Promise<ActivityLog[]> {
    if (hasSupabase) return supa.getActivityLogs(count);
    if (IS_MOCK) return getLocalLogs().slice(0, count);
    try {
      const q = query(collection(db, LOGS_COLLECTION), orderBy('timestamp', 'desc'), limit(count));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => d.data() as ActivityLog);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, LOGS_COLLECTION);
      return [];
    }
  },
};

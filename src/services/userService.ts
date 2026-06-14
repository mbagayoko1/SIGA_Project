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

const USERS_COLLECTION = 'users';
const LOGS_COLLECTION = 'activityLogs';

// When the bundled Firebase config is still the AI Studio placeholder, there is
// no real backend. In that case the whole admin module runs against a local
// (localStorage) store so it is fully functional offline. As soon as a real
// Firebase config is provided, the Firestore implementation takes over.
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

export const userService = {
  /** Record who is performing admin actions (for audit attribution in mock mode). */
  setActor(profile: { uid: string; displayName: string } | null) {
    actor = profile ? { uid: profile.uid, name: profile.displayName } : { uid: 'system', name: 'System' };
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
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

import { useEffect, useState } from 'react';
import { ViewMode, UserProfile, UserRole } from '../types';

/**
 * Admin-controlled activation of platform tabs/modules. Persisted to
 * localStorage and broadcast via a custom event so the nav + home portal update
 * live when an admin toggles a module on or off.
 */

export interface ManagedModule {
  key: ViewMode;
  label: string;
  description: string;
}

// Modules an admin can activate/deactivate. Home, Profile and Admin are always
// available and are intentionally excluded.
export const MANAGED_MODULES: ManagedModule[] = [
  { key: 'about-geospatial', label: 'Intelligence Platform', description: 'Platform overview & capabilities' },
  { key: 'stage', label: 'Geospatial Stage', description: 'Interactive map workspace' },
  { key: 'analytics', label: 'Analytics', description: 'Comparative indicator dashboards' },
  { key: 'table', label: 'Data Ledger', description: 'Tabular data grid' },
  { key: 'sp-alignment', label: 'SP Alignment', description: 'Strategic Plan alignment audit' },
  { key: 'irrf-tracking', label: 'IRRF Tracking', description: 'Integrated results framework' },
  { key: 'quantum', label: 'Quantum Tracker', description: 'Monitoring report intelligence' },
  { key: 'dynamics', label: 'Demographic Resilience', description: 'Population dynamics dashboard' },
  { key: 'political', label: 'Political Analysis', description: 'Geopolitical foresight' },
  { key: 'flux', label: 'Geospatial Monitoring', description: 'Risk flux intelligence console' },
];

const LS_KEY = 'siga_module_access';
const EVENT = 'siga-module-access';

export type ModuleAccessMap = Partial<Record<ViewMode, boolean>>;

export function getModuleAccess(): ModuleAccessMap {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as ModuleAccessMap) : {};
  } catch {
    return {};
  }
}

export function isModuleEnabled(key: ViewMode): boolean {
  const map = getModuleAccess();
  return map[key] !== false; // default enabled
}

const MANAGED_KEYS = new Set<ViewMode>(MANAGED_MODULES.map((m) => m.key));

/**
 * Effective access to a module for a specific user: combines the global admin
 * switch with the user's per-user module grants. Admins always have full access;
 * a user with no explicit grant list keeps full access (legacy/seed users).
 * Non-managed keys (home, profile, …) are governed only by the global switch.
 */
export function userCanAccess(key: ViewMode, profile: UserProfile | null | undefined, access?: ModuleAccessMap): boolean {
  const map = access ?? getModuleAccess();
  if (map[key] === false) return false; // globally deactivated for everyone
  if (!MANAGED_KEYS.has(key)) return true; // home/profile/admin always reachable
  if (!profile) return true;
  if (profile.role === UserRole.ADMIN) return true;
  if (!profile.allowedModules) return true; // no grant defined → full access
  return profile.allowedModules.includes(key);
}

export function setModuleEnabled(key: ViewMode, enabled: boolean) {
  const map = getModuleAccess();
  map[key] = enabled;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** React hook: live module-access map that re-renders when toggled anywhere. */
export function useModuleAccess(): ModuleAccessMap {
  const [map, setMap] = useState<ModuleAccessMap>(() => getModuleAccess());
  useEffect(() => {
    const update = () => setMap(getModuleAccess());
    window.addEventListener(EVENT, update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);
  return map;
}

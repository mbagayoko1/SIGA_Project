/**
 * IRRF (Integrated Results & Resources Framework) ledger — Strategic Plan
 * 2026–2029 baselines, 2029 targets, and latest regional values.
 *
 * Extracted from IRRFTracking.tsx so it can be seeded into the `irrf_ledger`
 * database table (scripts/db-seed.mjs) and eventually served from Supabase.
 * This module remains the offline fallback.
 */
import type { SPOutcome } from '../types';

export interface IRRFIndicator {
  id: string;              // IRRF indicator id, e.g. '1.1'
  label: string;
  baseline: number;
  target2029: number;
  currentRegional: number;
  unit: string;
  outcomeId: SPOutcome;
}

export const IRRF_LEDGER: IRRFIndicator[] = [
  { id: '1.1', label: 'Unmet need for family planning', baseline: 24.2, target2029: 15.0, currentRegional: 22.1, unit: '%', outcomeId: 'outcome1' },
  { id: '1.2', label: 'Modern contraceptive prevalence rate (mCPR)', baseline: 32.1, target2029: 45.0, currentRegional: 35.4, unit: '%', outcomeId: 'outcome1' },
  { id: '2.1', label: 'Maternal mortality ratio (per 100k live births)', baseline: 542, target2029: 300, currentRegional: 518, unit: 'per 100k', outcomeId: 'outcome2' },
  { id: '2.3', label: 'Proportion of births attended by skilled personnel', baseline: 58, target2029: 80, currentRegional: 62, unit: '%', outcomeId: 'outcome2' },
  { id: '3.1', label: 'Women 15–49 who subjected to physical/sexual violence', baseline: 36, target2029: 15, currentRegional: 34, unit: '%', outcomeId: 'outcome3' },
  { id: '3.2', label: 'Women 20–24 married before age 18', baseline: 42, target2029: 20, currentRegional: 38, unit: '%', outcomeId: 'outcome3' },
  { id: '4.4', label: 'Countries with demographic resilience strategies', baseline: 4, target2029: 23, currentRegional: 8, unit: 'Countries', outcomeId: 'outcome4' },
  { id: '4.6', label: 'Population and housing census round completion', baseline: 60, target2029: 100, currentRegional: 70, unit: '%', outcomeId: 'outcome4' },
];

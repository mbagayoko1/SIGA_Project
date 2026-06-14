/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CountryData {
  id: string; // ISO A3
  name: string;
  mmr: number; // Maternal Mortality Ratio per 100,000 live births
  mCPR: number; // Modern Contraceptive Prevalence Rate (%)
  gbvPrevalence: number; // % of women experiencing GBV
  adolescentBirthRate: number; // per 1,000 women aged 15-19
  demandSatisfied: number; // % of demand for family planning satisfied with modern methods
  demographicDynamics: number; // Demographic Resilience Index (0-100)
  population: number; // in millions
  idpCount: number; // in thousands
  refugeeCount: number; // in thousands
  crisisLevel: number; // 0-5 index
  unfpaActive: boolean;
  region: 'West Africa' | 'Central Africa';
  unmetNeed: number; // % of women with an unmet need for family planning
}

export type Indicator = 'mmr' | 'mCPR' | 'gbvPrevalence' | 'adolescentBirthRate' | 'demandSatisfied' | 'demographicDynamics' | 'idpCount' | 'refugeeCount' | 'crisisLevel' | 'unmetNeed';

export type ViewMode = 'home' | 'about-geospatial' | 'stage' | 'analytics' | 'table' | 'quantum' | 'political' | 'flux' | 'sp-alignment' | 'irrf-tracking' | 'user-management' | 'profile' | 'dynamics';

export interface IndicatorMeta {
  id: Indicator;
  label: string;
  description: string;
  unit: string;
  colorRange: [string, string];
  inverse: boolean; // if true, higher is better
}

export const INDICATORS: Record<Indicator, IndicatorMeta> = {
  mmr: {
    id: 'mmr',
    label: 'Maternal Mortality Ratio',
    description: 'Number of maternal deaths per 100,000 live births.',
    unit: 'per 100k',
    colorRange: ['#fef3c7', '#dc2626'],
    inverse: false,
  },
  mCPR: {
    id: 'mCPR',
    label: 'Modern Contraceptive Prevalence',
    description: 'Percentage of women of reproductive age using modern contraception.',
    unit: '%',
    colorRange: ['#ecfdf5', '#059669'],
    inverse: true,
  },
  gbvPrevalence: {
    id: 'gbvPrevalence',
    label: 'GBV Prevalence',
    description: 'Life-time prevalence of physical and/or sexual intimate partner violence.',
    unit: '%',
    colorRange: ['#fff7ed', '#ea580c'],
    inverse: false,
  },
  adolescentBirthRate: {
    id: 'adolescentBirthRate',
    label: 'Adolescent Birth Rate',
    description: 'Number of births per 1,000 women aged 15-19 years.',
    unit: 'per 1k',
    colorRange: ['#f0f9ff', '#0369a1'],
    inverse: false,
  },
  demandSatisfied: {
    id: 'demandSatisfied',
    label: 'Family Planning Demand Satisfied',
    description: 'Percentage of demand for family planning satisfied with modern methods.',
    unit: '%',
    colorRange: ['#f5f3ff', '#7c3aed'],
    inverse: true,
  },
  demographicDynamics: {
    id: 'demographicDynamics',
    label: 'Population Dynamics & Sustainable Development',
    description: 'Real-time analysis of population shifts, sustainable development goals, and regional resilience in West and Central Africa.',
    unit: 'Index',
    colorRange: ['#fdf4ff', '#a21caf'],
    inverse: true,
  },
  idpCount: {
    id: 'idpCount',
    label: 'Internally Displaced Persons',
    description: 'Number of individuals displaced within their own country.',
    unit: 'k',
    colorRange: ['#f8fafc', '#6366f1'],
    inverse: false,
  },
  refugeeCount: {
    id: 'refugeeCount',
    label: 'Refugee Population',
    description: 'Number of individuals who have fled their country.',
    unit: 'k',
    colorRange: ['#f8fafc', '#a855f7'],
    inverse: false,
  },
  crisisLevel: {
    id: 'crisisLevel',
    label: 'Crisis Hotspot Index',
    description: 'Severity of conflict or natural disaster impacting service delivery (0-5).',
    unit: '/5',
    colorRange: ['#f8fafc', '#be123c'],
    inverse: false,
  },
  unmetNeed: {
    id: 'unmetNeed',
    label: 'Unmet Need for Family Planning',
    description: 'Percentage of women who want to stop or delay childbearing but are not using contraception.',
    unit: '%',
    colorRange: ['#fff1f2', '#e11d48'],
    inverse: false,
  },
};

export type SPOutcome = 'outcome1' | 'outcome2' | 'outcome3' | 'outcome4';

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  bio?: string;
  title?: string;
  department?: string;
  location?: string;
  active?: boolean; // account enabled/disabled (defaults to true)
  allowedModules?: ViewMode[]; // per-user module grants (undefined = all; admins always have all)
  lastActive?: number;
  updatedAt: number;
  createdAt: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: number;
  metadata?: any;
}

export interface SPOutcomeMeta {
  id: SPOutcome;
  label: string;
  description: string;
  indicators: Indicator[];
  color: string;
}

export const SP_OUTCOMES: Record<SPOutcome, SPOutcomeMeta> = {
  outcome1: {
    id: 'outcome1',
    label: 'Outcome 1: Unmet Need for Family Planning',
    description: 'By 2029, the reduction in the unmet need for family planning has accelerated.',
    indicators: ['unmetNeed', 'mCPR', 'demandSatisfied'],
    color: '#0072BC',
  },
  outcome2: {
    id: 'outcome2',
    label: 'Outcome 2: Preventable Maternal Deaths',
    description: 'By 2029, the reduction of preventable maternal deaths has accelerated.',
    indicators: ['mmr', 'adolescentBirthRate'],
    color: '#E11D48',
  },
  outcome3: {
    id: 'outcome3',
    label: 'Outcome 3: GBV and Harmful Practices',
    description: 'By 2029, the reduction in gender-based violence and harmful practices has accelerated.',
    indicators: ['gbvPrevalence'],
    color: '#EA580C',
  },
  outcome4: {
    id: 'outcome4',
    label: 'Outcome 4: Demographic Resilience',
    description: 'By 2029, adaptation to demographic change has strengthened the resilience of societies.',
    indicators: ['demographicDynamics', 'idpCount', 'refugeeCount', 'crisisLevel'],
    color: '#7C3AED',
  },
};

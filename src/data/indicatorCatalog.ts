/**
 * PDP-organised indicator catalog for the Analytics tab.
 *
 * Mirrors the UNFPA Population Data Portal taxonomy (https://pdp.unfpa.org/#/metadata):
 * Domain → Sub-domain → Indicator, with the real PDP `indicator_code` for each.
 * Every code here has a verified country-level data service and is pulled by
 * scripts/ingest-indicators.mjs (keyed by code) into indicators.generated.json.
 *
 * `inverse: true` means a HIGHER value is better (used for chart coloring).
 */
import type { SPOutcome } from '../types';

export interface CatalogIndicator {
  code: string;        // PDP indicator_code
  name: string;        // full PDP indicator name
  short: string;       // compact label for charts/menus
  unit: string;
  inverse?: boolean;   // higher is better
}

export interface CatalogSubdomain {
  name: string;
  indicators: CatalogIndicator[];
}

export interface CatalogDomain {
  domain: string;          // PDP domain
  outcomeId: SPOutcome;     // SIGA Strategic-Plan outcome this domain anchors
  outcomeLabel: string;
  icon: string;             // lucide icon name (resolved in the UI)
  color: string;
  subdomains: CatalogSubdomain[];
}

export const INDICATOR_CATALOG: CatalogDomain[] = [
  {
    domain: 'Family Planning',
    outcomeId: 'outcome1',
    outcomeLabel: 'Outcome 1 · Family Planning',
    icon: 'Flag',
    color: '#1C6DB5',
    subdomains: [
      {
        name: 'Contraceptive use',
        indicators: [
          { code: '33.1', name: 'Contraceptive prevalence rate, modern methods, all women', short: 'Modern CPR (all women)', unit: '%', inverse: true },
          { code: '34.1', name: 'Contraceptive prevalence rate, all methods, all women', short: 'CPR any method', unit: '%', inverse: true },
          { code: '33.3', name: 'Contraceptive prevalence rate, modern methods, married/in-union women', short: 'Modern CPR (married)', unit: '%', inverse: true },
        ],
      },
      {
        name: 'Demand satisfied',
        indicators: [
          { code: '36.1', name: 'Demand for family planning satisfied by modern methods, all women', short: 'Demand satisfied (modern)', unit: '%', inverse: true },
          { code: '35.1', name: 'Demand for family planning satisfied, all women', short: 'Demand satisfied (any)', unit: '%', inverse: true },
        ],
      },
      {
        name: 'Unmet need',
        indicators: [
          { code: '37.1', name: 'Unmet need for family planning, all women', short: 'Unmet need (all women)', unit: '%' },
          { code: '37.3', name: 'Unmet need for family planning, married/in-union women', short: 'Unmet need (married)', unit: '%' },
        ],
      },
      {
        name: 'Method mix',
        indicators: [
          { code: '64.7', name: 'Method mix, implants', short: 'Implants', unit: '%' },
          { code: '64.5', name: 'Method mix, injections', short: 'Injections', unit: '%' },
          { code: '64.3', name: 'Method mix, pill', short: 'Pill', unit: '%' },
          { code: '64.4', name: 'Method mix, IUD', short: 'IUD', unit: '%' },
          { code: '64.8', name: 'Method mix, condom', short: 'Condom', unit: '%' },
          { code: '64.1', name: 'Method mix, female sterilization', short: 'Female sterilization', unit: '%' },
        ],
      },
    ],
  },
  {
    domain: 'Maternal & Newborn Health',
    outcomeId: 'outcome2',
    outcomeLabel: 'Outcome 2 · Preventable Maternal Deaths',
    icon: 'HeartPulse',
    color: '#E11D48',
    subdomains: [
      {
        name: 'Maternal & newborn health',
        indicators: [
          { code: '52', name: 'Maternal mortality ratio', short: 'Maternal mortality ratio', unit: 'per 100k' },
          { code: '26', name: 'Adolescent birth rate', short: 'Adolescent birth rate', unit: 'per 1k' },
          { code: '67', name: 'Neonatal mortality rate', short: 'Neonatal mortality', unit: 'per 1k' },
          { code: '68', name: 'Low birth weight', short: 'Low birth weight', unit: '%' },
          { code: '50', name: 'Women aged 20-24 who gave birth before age 15', short: 'Birth before age 15', unit: '%' },
          { code: '201', name: 'Universal health coverage (UHC) service coverage index', short: 'UHC coverage index', unit: 'index', inverse: true },
        ],
      },
    ],
  },
  {
    domain: 'Gender Equality',
    outcomeId: 'outcome3',
    outcomeLabel: 'Outcome 3 · GBV & Harmful Practices',
    icon: 'ShieldAlert',
    color: '#EA580C',
    subdomains: [
      {
        name: 'Violence against women',
        indicators: [
          { code: '193', name: 'Intimate partner violence, lifetime', short: 'IPV (lifetime)', unit: '%' },
          { code: '176', name: 'Intimate partner violence, past 12 months', short: 'IPV (12 months)', unit: '%' },
          { code: '53.1', name: 'Attitudes toward wife beating, females', short: 'Justifies wife-beating', unit: '%' },
        ],
      },
      {
        name: 'Child marriage',
        indicators: [
          { code: '49', name: 'Child marriage before age 18', short: 'Married before 18', unit: '%' },
          { code: '48', name: 'Child marriage before age 15', short: 'Married before 15', unit: '%' },
        ],
      },
      {
        name: 'Female genital mutilation',
        indicators: [
          { code: '43.1', name: 'Prevalence of female genital mutilation, women aged 15-49', short: 'FGM prevalence (15-49)', unit: '%' },
          { code: '43.3', name: 'Prevalence of female genital mutilation, girls aged 5-9', short: 'FGM prevalence (5-9)', unit: '%' },
        ],
      },
    ],
  },
  {
    domain: 'Population & Development',
    outcomeId: 'outcome4',
    outcomeLabel: 'Outcome 4 · Demographic Resilience',
    icon: 'Globe2',
    color: '#7C3AED',
    subdomains: [
      {
        name: 'Fertility',
        indicators: [
          { code: '24', name: 'Total fertility rate', short: 'Total fertility rate', unit: 'per woman' },
          { code: '25', name: 'Total wanted fertility rate', short: 'Wanted fertility rate', unit: 'per woman' },
          { code: '63', name: 'Crude birth rate', short: 'Crude birth rate', unit: 'per 1k' },
        ],
      },
      {
        name: 'Demographic',
        indicators: [
          { code: '16', name: 'Population size', short: 'Population size', unit: 'thousands' },
        ],
      },
      {
        name: 'Urbanization',
        indicators: [
          { code: '18', name: 'Population residing in urban areas', short: 'Urban population', unit: '%' },
        ],
      },
    ],
  },
];

// ---- Derived helpers --------------------------------------------------------

export const ALL_CATALOG_INDICATORS: Array<CatalogIndicator & { domain: string; subdomain: string; color: string; outcomeId: SPOutcome }> =
  INDICATOR_CATALOG.flatMap((d) =>
    d.subdomains.flatMap((s) =>
      s.indicators.map((i) => ({ ...i, domain: d.domain, subdomain: s.name, color: d.color, outcomeId: d.outcomeId })),
    ),
  );

export const CATALOG_BY_CODE: Record<string, (typeof ALL_CATALOG_INDICATORS)[number]> = Object.fromEntries(
  ALL_CATALOG_INDICATORS.map((i) => [i.code, i]),
);

export function findIndicator(code: string) {
  return CATALOG_BY_CODE[code];
}

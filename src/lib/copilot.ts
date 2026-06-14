/**
 * WCARO AI Copilot brain — client-side. Uses Gemini when a key is configured
 * (structured JSON), otherwise a deterministic local intent router so the
 * Copilot always responds (navigation, indicator definitions, regional
 * summaries) without a backend.
 */
import { ViewMode, INDICATORS, Indicator } from '../types';
import { WCA_COUNTRIES } from '../data';
import { hasGemini, generateJSON } from './ai';

export interface KeyMetric {
  label: string;
  value: string;
  status?: 'met' | 'missed' | 'on_track' | 'n/a';
}

export interface CopilotResponse {
  text: string;
  navigation?: ViewMode | null;
  thinking?: string;
  keyMetrics?: KeyMetric[];
  suggestions?: string[];
}

export const SECTION_NAMES: Partial<Record<ViewMode, string>> = {
  home: 'Home Portal',
  'about-geospatial': 'Intelligence Platform',
  stage: 'Geospatial Stage',
  analytics: 'Analytics',
  table: 'Data Ledger',
  'sp-alignment': 'SP Alignment',
  'irrf-tracking': 'IRRF Tracking',
  quantum: 'Quantum Tracker',
  dynamics: 'Population Dynamics',
  political: 'Political Analysis',
  flux: 'Geospatial Monitoring',
  'user-management': 'Access Control',
  profile: 'My Profile',
};

/** Map free text / model output to a real SIGA view. */
export function normalizeSection(raw?: string | null): ViewMode | null {
  if (!raw) return null;
  const n = raw.trim().toLowerCase().replace(/['"]/g, '');
  const exact = (Object.keys(SECTION_NAMES) as ViewMode[]).find((s) => s === n);
  if (exact) return exact;
  if (/\bhome|portal|dashboard\b/.test(n)) return 'home';
  if (/about|platform|overview|capabilit/.test(n)) return 'about-geospatial';
  if (/stage|map\b|geospatial stage/.test(n)) return 'stage';
  if (/analytic|chart|compare/.test(n)) return 'analytics';
  if (/ledger|table|grid|data/.test(n)) return 'table';
  if (/sp.?align|strategic plan|alignment/.test(n)) return 'sp-alignment';
  if (/irrf|results.?framework|resource/.test(n)) return 'irrf-tracking';
  if (/quantum|monitoring report|milestone/.test(n)) return 'quantum';
  if (/dynamic|population|demographic|resilience/.test(n)) return 'dynamics';
  if (/politic|geopolit|scenario|foresight/.test(n)) return 'political';
  if (/flux|intel|risk|crisis|hotspot|monitoring/.test(n)) return 'flux';
  if (/user|access|member|permission|admin|role/.test(n)) return 'user-management';
  if (/profile|account|myself|\bme\b/.test(n)) return 'profile';
  return null;
}

const avg = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);
const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

function regionStats() {
  const total = WCA_COUNTRIES.length;
  const pop = WCA_COUNTRIES.reduce((a, c) => a + c.population, 0);
  const mmr = avg(WCA_COUNTRIES.map((c) => c.mmr));
  const unmet = avg(WCA_COUNTRIES.map((c) => c.unmetNeed));
  const gbv = avg(WCA_COUNTRIES.map((c) => c.gbvPrevalence));
  const crisis = WCA_COUNTRIES.filter((c) => c.crisisLevel >= 4);
  const worstMmr = [...WCA_COUNTRIES].sort((a, b) => b.mmr - a.mmr)[0];
  return { total, pop, mmr, unmet, gbv, crisis, worstMmr };
}

const STARTER_SUGGESTIONS = [
  'Summarize the WCA region',
  'Where is maternal mortality highest?',
  'Open the Geospatial Stage',
  'What is unmet need for family planning?',
  'Show crisis hotspots',
];

/** Deterministic offline brain. */
function localBrain(message: string): CopilotResponse {
  const m = message.toLowerCase();
  const nav = normalizeSection(message);
  const s = regionStats();

  // Indicator definition lookup
  const indicatorMatch = (Object.keys(INDICATORS) as Indicator[]).find((id) => {
    const meta = INDICATORS[id];
    return m.includes(meta.label.toLowerCase()) || (m.includes('mmr') && id === 'mmr') || (m.includes('gbv') && id === 'gbvPrevalence');
  });
  const isDefinition = /\b(what|define|definition|meaning|explain|stands for)\b/.test(m);
  if (indicatorMatch && isDefinition) {
    const meta = INDICATORS[indicatorMatch];
    return {
      text: `**${meta.label}** (${meta.unit}) — ${meta.description}\n\nAcross the WCA region the indicators can be explored on the [Analytics] dashboard or the [Geospatial Stage].`,
      navigation: 'analytics',
      thinking: `• Matched indicator "${meta.label}" in the PDP catalog.\n• Returned its definition and the best dashboard view.`,
      suggestions: ['Open Analytics', 'Where is it worst?', 'Summarize the region'],
    };
  }

  // Navigation intent
  if (nav && /\b(go|open|show|navigate|take me|view|switch)\b/.test(m)) {
    return {
      text: `Opening the **${SECTION_NAMES[nav]}** for you. [${SECTION_NAMES[nav]}]`,
      navigation: nav,
      thinking: `• Intent: navigation → ${nav}.`,
      suggestions: ['Summarize the region', 'Where are the crisis hotspots?'],
    };
  }

  // Crisis / hotspots
  if (/crisis|hotspot|displac|conflict|humanitarian/.test(m)) {
    return {
      text: `There ${s.crisis.length === 1 ? 'is' : 'are'} **${s.crisis.length} crisis hotspot${s.crisis.length === 1 ? '' : 's'}** (crisis level 4+) across the region: ${s.crisis.map((c) => c.name).join(', ') || 'none currently flagged'}. Explore live situational layers on the [Geospatial Monitoring] console.`,
      navigation: 'flux',
      keyMetrics: [
        { label: 'Hotspots', value: `${s.crisis.length}`, status: s.crisis.length ? 'missed' : 'met' },
        { label: 'Programme countries', value: `${s.total}` },
      ],
      thinking: '• Computed crisis-level ≥ 4 countries from the PDP dataset.',
      suggestions: ['Open Geospatial Monitoring', 'Where is MMR highest?'],
    };
  }

  // Maternal mortality
  if (/maternal|mmr|mortality/.test(m)) {
    return {
      text: `The regional **maternal mortality ratio** averages **${fmt(s.mmr)} per 100,000 live births**, with **${s.worstMmr.name}** carrying the highest burden (${fmt(s.worstMmr.mmr)}). Reducing preventable maternal deaths is Outcome 2 of the Strategic Plan — track it on [Analytics] or the [Geospatial Stage].`,
      navigation: 'analytics',
      keyMetrics: [
        { label: 'Avg MMR', value: `${fmt(s.mmr)}`, status: 'missed' },
        { label: 'Highest', value: s.worstMmr.name },
      ],
      thinking: '• Aggregated MMR across all WCA countries; identified the maximum.',
      suggestions: ['Open Analytics', 'Summarize the region', 'Show crisis hotspots'],
    };
  }

  // Summary / overview
  if (/summar|overview|region|how are we|performance|brief|at a glance/.test(m)) {
    return {
      text: `**WCA regional snapshot:** ${s.total} programme countries covering ~${fmt(s.pop)}M people. Average maternal mortality is ${fmt(s.mmr)}/100k, unmet need for family planning ${fmt(s.unmet, 1)}%, and GBV prevalence ${fmt(s.gbv, 1)}%. ${s.crisis.length} countries are in acute crisis. Generate a full narrative briefing from the [Geospatial Stage], or review the [Data Ledger].`,
      navigation: 'stage',
      keyMetrics: [
        { label: 'Countries', value: `${s.total}` },
        { label: 'Avg MMR', value: `${fmt(s.mmr)}`, status: 'missed' },
        { label: 'Unmet need', value: `${fmt(s.unmet, 1)}%`, status: 'missed' },
        { label: 'Hotspots', value: `${s.crisis.length}` },
      ],
      thinking: '• Built a regional roll-up from the PDP dataset (population, MMR, unmet need, GBV, crisis).',
      suggestions: ['Open the Geospatial Stage', 'Where is MMR highest?', 'Show crisis hotspots'],
    };
  }

  // Default
  return {
    text: `I'm the **WCARO AI Copilot**. I can summarize the West & Central Africa region, explain indicators, surface crisis hotspots, and jump you to any module — try the [Geospatial Stage], [Analytics], [Quantum Tracker] or [Political Analysis]. What would you like to explore?`,
    navigation: nav,
    suggestions: STARTER_SUGGESTIONS.slice(0, 3),
  };
}

/** Main entry — Gemini when available, otherwise the local brain. */
export async function runCopilot(message: string, history: { role: 'user' | 'model'; text: string }[]): Promise<CopilotResponse> {
  if (!hasGemini) return localBrain(message);

  const sectionList = (Object.keys(SECTION_NAMES) as ViewMode[]).map((k) => `${k} (${SECTION_NAMES[k]})`).join(', ');
  const convo = history.slice(-6).map((h) => `${h.role === 'model' ? 'Copilot' : 'User'}: ${h.text}`).join('\n');

  const prompt = `You are the "WCARO AI Copilot", a senior strategic-information and geospatial-intelligence advisor embedded in the UNFPA West & Central Africa Regional Office (WCARO) SIGA portal (Strategic Plan 2026–2029).

You help users understand demographic, maternal-health, family-planning, GBV, humanitarian and geospatial data, and you navigate them to the right module.

Available modules (id → name): ${sectionList}.

Recent conversation:
${convo}

User: ${message}

Respond ONLY with a raw JSON object (no markdown fences) with this shape:
{
  "text": "concise, professional answer (use [Module Name] in square brackets to make a module clickable)",
  "navigation": "<module id to open, or null>",
  "thinking": "2-4 short bullet lines of your reasoning, newline-separated",
  "keyMetrics": [{ "label": "...", "value": "...", "status": "met|missed|on_track|n/a" }],
  "suggestions": ["short follow-up 1", "short follow-up 2", "short follow-up 3"]
}
Keep text under 120 words. keyMetrics and suggestions may be omitted.`;

  try {
    const data = await generateJSON<any>(prompt);
    return {
      text: typeof data.text === 'string' && data.text.trim() ? data.text : 'I processed your request.',
      navigation: normalizeSection(data.navigation),
      thinking: typeof data.thinking === 'string' ? data.thinking : undefined,
      keyMetrics: Array.isArray(data.keyMetrics) ? data.keyMetrics.slice(0, 4) : undefined,
      suggestions: Array.isArray(data.suggestions) ? data.suggestions.slice(0, 3) : undefined,
    };
  } catch (err) {
    console.error('WCARO Copilot Gemini failed, using local brain:', err);
    return localBrain(message);
  }
}

export { STARTER_SUGGESTIONS };

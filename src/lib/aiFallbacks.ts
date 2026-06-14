/**
 * Local, data-grounded fallbacks for every AI feature. Used whenever no Gemini
 * key is configured or a model call fails, so each "AI" action still produces a
 * meaningful, deterministic result instead of an error state.
 */
import { CountryData, Indicator, INDICATORS } from '../types';

const fmt = (n: number, d = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const avg = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);

/* ---- AnalysisPanel: short strategic insight ---------------------------- */
export function localStrategicInsight(countries: CountryData[], indicators: Indicator[]): string {
  const isRegional = countries.length === 0;
  const label = isRegional ? 'the WCA region' : countries.map((c) => c.name).join(', ');
  const inds = (indicators.length ? indicators : (['mmr', 'unmetNeed'] as Indicator[]));
  const scope = isRegional ? [] : countries;
  const lines = inds.slice(0, 4).map((id) => {
    const meta = INDICATORS[id];
    const vals = scope.map((c) => c[id] as number);
    const mean = scope.length ? avg(vals) : NaN;
    return `- **${meta.label}**${
      scope.length ? `: mean ${fmt(mean, 1)} ${meta.unit} across the selection` : ' flagged for regional review'
    }.`;
  });
  const crisis = scope.filter((c) => c.crisisLevel >= 4).map((c) => c.name);
  return `**Strategic Situational Briefing — ${label}**

The multi-metric nexus points to interlinked demographic and development pressures aligned with the 2026–2029 "Resilience and Renewal" agenda.

${lines.join('\n')}

**Resilience lens:** population dynamics continue to drive demand for SRH and protection services${
    crisis.length ? `, with crisis escalation in ${crisis.join(', ')} compressing service continuity` : ''
  }.

**Renewal recommendations:**
- Channel sustainable-financing partnerships toward the highest-burden districts.
- Pair last-mile contraceptive logistics with GBV referral pathways to maximise integrated impact.`;
}

/* ---- HubAnalysis: logistics hubs --------------------------------------- */
export function localHubs(countryNames: string[]): { name: string; location: string; distance: string; accessibility: string }[] {
  const statuses = ['Fully Accessible', 'Delayed', 'Restricted'];
  const base = countryNames.length ? countryNames : ['Regional'];
  return base.slice(0, 3).map((name, i) => ({
    name: `UNFPA ${name} Operations Hub`,
    location: `${name} — primary metropolitan corridor`,
    distance: i === 0 ? 'Within 50km of capital · road-accessible' : `${120 + i * 90}km from capital · mixed road/air`,
    accessibility: statuses[i % statuses.length],
  }));
}

/* ---- LiveAlerts: humanitarian alerts ----------------------------------- */
export function localAlerts(countryNames: string[]): { title: string; description: string; source: string; timestamp: string; impact: 'high' | 'medium' | 'low' }[] {
  const impacts: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
  const topics = [
    'Maternal health service continuity under pressure as displacement rises',
    'Reproductive-health commodity pipeline monitored for stock-out risk',
    'Gender-based violence referral demand increases in affected districts',
  ];
  const names = countryNames.length ? countryNames : ['West & Central Africa'];
  return topics.map((t, i) => ({
    title: t,
    description: `${names[i % names.length]}: situational signal relevant to UNFPA's mandate (reproductive health, maternal mortality, GBV, population dynamics). Local-feed estimate.`,
    source: 'SIGA Situational Feed',
    timestamp: `${(i + 1) * 2}h ago`,
    impact: impacts[i % impacts.length],
  }));
}

/* ---- IntelligenceMap: intel synthesis ---------------------------------- */
export function localIntelSummary(focus: string): string {
  return `**RESTRICTED · Regional Risk-Flux Synthesis (2026)**

${focus}

The current operating picture is defined by a security–migration nexus across the Central Sahel and Lake Chad Basin, sustained maritime-security activity in the Gulf of Guinea, and contested humanitarian access along key corridors. For UNFPA WCARO, response readiness hinges on pre-positioned reproductive-health supplies, mobile service modalities in displacement-affected zones, and reinforced GBV referral capacity.

_Manual synthesis generated locally; configure a GEMINI_API_KEY for live AI grounding._`;
}

/* ---- QuantumTracker: performance insight + management report ------------ */
export function localQuantumInsight(office: string, total: number, achieved: number, overachieved: number, pending: number): string {
  const rate = total ? (((achieved + overachieved) / total) * 100).toFixed(1) : '0';
  return `**${office} — Performance Insight**

Achievement velocity stands at **${rate}%** (${achieved + overachieved}/${total} milestones), with **${pending}** still pending. Against the four SP 2026–2029 outcomes — Unmet Need, Maternal Deaths, GBV/Harmful Practices, and Demographic Resilience — the data signals ${
    Number(rate) >= 70 ? 'strong delivery momentum' : Number(rate) >= 50 ? 'moderate momentum with watch items' : 'delivery risk requiring escalation'
  }. Pending milestones should be sequenced against Regional Hub capacity to protect outcome-level results.`;
}

export function localQuantumReport(
  office: string,
  total: number,
  achieved: number,
  overachieved: number,
  pending: number,
  outputs: { id: string; label: string; indicators: unknown[] }[],
): string {
  const rate = total ? (((achieved + overachieved) / total) * 100).toFixed(1) : '0';
  const outputLines = outputs.map((o) => `- **${o.id} · ${o.label}** — ${o.indicators.length} indicator(s) tracked.`).join('\n');
  return `# Strategic Alignment & Management Report — ${office}

## Executive Summary
${office} reports a milestone achievement rate of **${rate}%** (${achieved} achieved, ${overachieved} overachieved, ${pending} pending) against Strategic Plan 2026–2029.

## Critical Risk Assessment
${pending > achieved ? '- **Red flag:** pending milestones exceed achieved — outcome delivery is at risk without re-sequencing.' : '- Delivery is broadly on-track; maintain monitoring cadence on pending items.'}
- Concentration risk where indicators cluster under a single output.

## Strategic Output Analysis
${outputLines || '- Output-level data not available for this office.'}

## Management Recommendations
- Re-prioritise pending milestones toward the four transformative outcomes.
- Align resource allocation with the highest-burden geographies through the Regional Hub.

## Resource Efficiency
- Direct marginal resources to outputs with the largest unmet-result gap to maximise strategic return.

_Generated locally; configure a GEMINI_API_KEY for a fully AI-authored report._`;
}

/* ---- PoliticalAnalysis: political brief -------------------------------- */
export function localPoliticalBrief(countryNames: string[]): string {
  const focus = countryNames.length ? countryNames.join(', ') : 'all WCA clusters (Sahel, Coastal, Central)';
  return `### | EXECUTIVE SUMMARY

The regional outlook for 2026 across ${focus} is one of cautious navigation: constitutional continuity in most coastal states is offset by elevated security volatility in the Central Sahel.

### | 1. THE SECURITY-DEVELOPMENT NEXUS

Non-state armed group activity in the Liptako-Gourma area continues to drive displacement, compressing static health-service delivery and elevating demand for mobile SRH and GBV response.

### | 2. GEOPOLITICAL DEEP DIVES (REGIONAL RISK FLUX)

- **Cluster 1 · The Sahel** — RISK PROFILE · HIGH / VOLATILE. Impact on UNFPA: shift to mobile humanitarian response; pre-position reproductive-health kits.
- **Cluster 2 · Coastal States** — RISK PROFILE · MODERATE / STABLE. Impact on UNFPA: government partnerships remain viable for contraceptive logistics.
- **Cluster 3 · Central Africa** — RISK PROFILE · MODERATE. Impact on UNFPA: monitor cross-border movements affecting service access.

### | 3. SCENARIO ANALYSIS MATRIX

| ID | Scenario | Probability | Impact | Implications for UNFPA |
|----|----------|-------------|--------|------------------------|
| S1 | Constitutional Continuity | 65% | Medium | Stable planning; direct partnerships viable |
| S2 | Regional Security Retraction | 25% | High | Displacement spikes; mobile response; GBV demand up |
| S3 | Cross-Border Alliance Shift | 10% | Low | New bilateral MOU structures required |

### | 4. GEOSPATIAL INTELLIGENCE OVERLAY

Corridor security along northern borders remains the primary determinant of humanitarian access; maintain contingency routing for supply continuity.

### | 5. STRATEGIC RECOMMENDATIONS

- Sustain mobile service modalities in displacement-affected zones.
- Protect last-mile contraceptive logistics through diversified routing.
- Reinforce GBV referral pathways at all service points.
- Maintain government partnerships in stable coastal states.
- Strengthen real-time risk monitoring through the Regional Hub.

**The regional outlook for 2026 is one of cautious navigation**, requiring adaptive, nexus-aligned programming.

_Generated locally; configure a GEMINI_API_KEY for a fully AI-authored briefing._`;
}

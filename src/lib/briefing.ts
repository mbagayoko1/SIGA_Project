/**
 * Deterministic, data-grounded Strategic Narrative Briefing generator.
 *
 * Used as the offline fallback when no Gemini key is configured (or the API
 * call fails), so the "Generate Narrative Briefing" action always produces a
 * real, structured report built from the currently-selected data.
 */
import { CountryData, Indicator, INDICATORS } from '../types';
import { WCA_COUNTRIES } from '../data';

const fmt = (n: number, digits = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function buildLocalBriefing(
  selectedCountries: CountryData[],
  selectedIndicators: Indicator[],
): string {
  const scope = selectedCountries.length > 0 ? selectedCountries : WCA_COUNTRIES;
  const isRegional = selectedCountries.length === 0;
  const scopeLabel = isRegional
    ? 'the entire West and Central Africa region'
    : scope.map((c) => c.name).join(', ');

  const indicators = selectedIndicators.length ? selectedIndicators : (['mmr', 'unmetNeed', 'gbvPrevalence'] as Indicator[]);

  const totalPop = scope.reduce((a, c) => a + c.population, 0);
  const totalIdp = scope.reduce((a, c) => a + c.idpCount, 0);
  const totalRefugees = scope.reduce((a, c) => a + c.refugeeCount, 0);
  const avgMmr = avg(scope.map((c) => c.mmr));
  const avgUnmet = avg(scope.map((c) => c.unmetNeed));
  const avgGbv = avg(scope.map((c) => c.gbvPrevalence));
  const avgResilience = avg(scope.map((c) => c.demographicDynamics));

  const crisisCountries = [...scope].filter((c) => c.crisisLevel >= 4).sort((a, b) => b.crisisLevel - a.crisisLevel);
  const highestMmr = [...scope].sort((a, b) => b.mmr - a.mmr)[0];
  const highestUnmet = [...scope].sort((a, b) => b.unmetNeed - a.unmetNeed)[0];
  const strongestResilience = [...scope].sort((a, b) => b.demographicDynamics - a.demographicDynamics)[0];

  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Per-indicator situational line for the selected metrics.
  const indicatorLines = indicators
    .map((id) => {
      const meta = INDICATORS[id];
      const values = scope.map((c) => c[id] as number);
      const mean = avg(values);
      const worst = [...scope].sort((a, b) =>
        meta.inverse ? (a[id] as number) - (b[id] as number) : (b[id] as number) - (a[id] as number),
      )[0];
      const direction = meta.inverse ? 'lowest coverage' : 'highest burden';
      return `- **${meta.label}:** regional mean of **${fmt(mean, 1)} ${meta.unit}**, with ${worst.name} presenting the ${direction} and requiring prioritized programmatic attention.`;
    })
    .join('\n');

  return `# Strategic Narrative Briefing — West & Central Africa

_Released ${date} · UNFPA Regional Office (WCARO) · Strategic Cycle 2026–2029 · Scope: ${scopeLabel}_

## Executive Summary

This briefing consolidates the current geospatial intelligence picture across ${
    isRegional ? `all ${scope.length} programme countries` : `${scope.length} selected country context${scope.length > 1 ? 's' : ''}`
  }, covering an estimated impacted population of **${fmt(totalPop, 1)} million people**. The data signals both acute humanitarian pressure and structural opportunities to accelerate the three transformative results. An average maternal mortality ratio of **${fmt(avgMmr)} per 100,000 live births** and an unmet need for family planning averaging **${fmt(avgUnmet, 1)}%** define the core programmatic frontier for the cycle.

## Resilience Frontier

The aggregated Demographic Resilience Index across the scope stands at **${fmt(avgResilience, 1)}/100**, with **${strongestResilience.name}** anchoring the upper band and offering a replicable model for system-wide renewal. Population dynamics across ${scopeLabel} indicate a sustained youth bulge that, if matched with rights-based investment in reproductive health and education, converts demographic pressure into a demographic dividend.

- A combined **${fmt(totalIdp)}k internally displaced persons** and **${fmt(totalRefugees)}k refugees** are concentrating demand on regional service hubs.
- Gender-based violence prevalence averages **${fmt(avgGbv, 1)}%**, reinforcing the case for integrated protection and SRH service delivery.

## Operational Outlook

${
    crisisCountries.length > 0
      ? `Crisis escalation is detected in **${crisisCountries.map((c) => `${c.name} (Level ${c.crisisLevel})`).join(', ')}**. Displacement vectors suggest elevated pressure on UNFPA hubs and warrant immediate humanitarian realignment, pre-positioning of reproductive health kits, and surge staffing.`
      : 'No acute crisis escalation (Level 4+) is currently detected across the selected scope. The operating environment supports a development-weighted posture, with contingency readiness maintained for rapid-onset shocks.'
  }

Priority situational signals for the selected indicators:

${indicatorLines}

## Regional Mandate

Through the Humanitarian–Development–Peace Nexus (HDPN), UNFPA's value proposition in ${scopeLabel} is the continuity of life-saving SRH and protection services across the relief-to-development continuum. The highest maternal mortality burden (${highestMmr.name}, ${fmt(highestMmr.mmr)} per 100k) and the largest unmet need gap (${highestUnmet.name}, ${fmt(highestUnmet.unmetNeed, 1)}%) should anchor results-based resource allocation under the 2026–2029 Integrated Results and Resources Framework.

## Strategic Imperatives

- **Accelerate maternal survival:** concentrate midwifery, EmONC, and supply-chain investment in the highest-MMR districts, targeting a measurable reduction trajectory by 2029.
- **Close the family planning gap:** scale modern contraceptive access and demand generation to convert unmet need into satisfied demand, with last-mile distribution in fragile settings.
- **Embed protection at the core:** mainstream GBV prevention and response into every service point, with strengthened referral pathways in displacement-affected zones.
- **Operationalize demographic resilience:** translate population data into sub-national planning so that ${strongestResilience.name}'s gains are systematized region-wide.

---

_Generated by SIGA from the UNFPA Population Data Portal dataset. For a fully AI-authored narrative, configure a GEMINI_API_KEY._`;
}

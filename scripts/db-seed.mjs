#!/usr/bin/env node
/**
 * SIGA — idempotent database seed (Supabase/Postgres).
 *
 * Upserts all reference data from the portal's TS sources of truth:
 *   countries          ← src/data.ts WCA_COUNTRIES (+ M49 codes)
 *   domains/subdomains/indicators ← src/data/indicatorCatalog.ts
 *   irrf_ledger        ← src/data/irrf.ts
 *   module_access      ← src/lib/moduleAccess.ts MANAGED_MODULES (all enabled)
 *   profiles           ← the 5 demo users (mirrors userService seedUsers)
 *
 * NOT seeded here (by design):
 *   indicator_values/revisions — use `npm run ingest:live -- --db`
 *   content_blocks — the Strategy/Political/Dynamics arrays embed JSX icons;
 *     migrating them needs an icon-name refactor first (incremental).
 *
 * USAGE:  node scripts/db-seed.mjs     (needs scripts/.env — see scripts/supa.mjs)
 */
import { getServiceClient, loadPortalData } from './supa.mjs';
import { M49 } from './ingest-indicators.mjs';

const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function upsert(sb, table, rows, onConflict) {
  const { error } = await sb.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`[seed] ${table}: ${error.message}`);
  console.log(`[seed] ${table}: ${rows.length} rows upserted`);
}

async function main() {
  const sb = getServiceClient();
  const { WCA_COUNTRIES, INDICATOR_CATALOG, IRRF_LEDGER, MANAGED_MODULES } = await loadPortalData();

  // 1) countries
  await upsert(sb, 'countries', WCA_COUNTRIES.map((c) => ({
    iso3: c.id,
    name: c.name,
    m49_code: M49[c.id] ?? '',
    region: c.region,
    population_m: c.population,
    unfpa_active: c.unfpaActive,
    crisis_level: c.crisisLevel,
    idp_k: c.idpCount,
    refugee_k: c.refugeeCount,
  })), 'iso3');

  // 2) catalog: domains → subdomains → indicators (FK order)
  const domains = INDICATOR_CATALOG.map((d) => ({
    id: slug(d.domain),
    name: d.domain,
    outcome_id: d.outcomeId,
    outcome_label: d.outcomeLabel,
    color: d.color,
    icon: d.icon,
  }));
  await upsert(sb, 'domains', domains, 'id');

  const subdomains = INDICATOR_CATALOG.flatMap((d) =>
    d.subdomains.map((s) => ({ id: `${slug(d.domain)}/${slug(s.name)}`, domain_id: slug(d.domain), name: s.name })),
  );
  await upsert(sb, 'subdomains', subdomains, 'id');

  const indicators = INDICATOR_CATALOG.flatMap((d) =>
    d.subdomains.flatMap((s) =>
      s.indicators.map((i) => ({
        code: i.code,
        subdomain_id: `${slug(d.domain)}/${slug(s.name)}`,
        name: i.name,
        short: i.short,
        unit: i.unit,
        inverse: !!i.inverse,
      })),
    ),
  );
  await upsert(sb, 'indicators', indicators, 'code');

  // 3) IRRF ledger
  await upsert(sb, 'irrf_ledger', IRRF_LEDGER.map((r) => ({
    id: r.id,
    label: r.label,
    baseline: r.baseline,
    target_2029: r.target2029,
    current_regional: r.currentRegional,
    unit: r.unit,
    outcome_id: r.outcomeId,
  })), 'id');

  // 4) module access — all managed modules enabled by default
  await upsert(sb, 'module_access', MANAGED_MODULES.map((m) => ({ module_key: m.key, enabled: true })), 'module_key');

  // 5) demo users (mirrors userService seedUsers; static ISO timestamps)
  const now = new Date().toISOString();
  const demoUsers = [
    { uid: 'dev-mbagayoko', email: 'mbagayoko@unfpa.org', display_name: 'Moussa BAGAYOKO', role: 'admin', title: 'Strategic Information Analyst', department: 'WCARO — Strategic Information Unit', location: 'Dakar, Senegal', active: true },
    { uid: 'u_adiallo', email: 'adiallo@unfpa.org', display_name: 'Aïssata Diallo', role: 'editor', title: 'M&E Specialist', department: 'Strategic Planning', location: 'Dakar, Senegal', active: true },
    { uid: 'u_kmensah', email: 'kmensah@unfpa.org', display_name: 'Kwame Mensah', role: 'viewer', title: 'Data Analyst', department: 'Population & Development', location: 'Accra, Ghana', active: true },
    { uid: 'u_fsow', email: 'fsow@unfpa.org', display_name: 'Fatou Sow', role: 'editor', title: 'GBV Programme Coordinator', department: 'Gender & Human Rights', location: 'Dakar, Senegal', active: true },
    { uid: 'u_jpkabila', email: 'jpkabila@unfpa.org', display_name: 'Jean-Paul Kabila', role: 'viewer', title: 'Field Logistics Officer', department: 'Humanitarian Action', location: 'Kinshasa, DRC', active: false },
  ].map((u) => ({ ...u, updated_at: now }));
  await upsert(sb, 'profiles', demoUsers, 'uid');

  console.log('[seed] done ✔ (indicator data: run `npm run ingest:live -- --db`)');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

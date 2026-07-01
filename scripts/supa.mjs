/**
 * Shared helpers for the Node data scripts (db-seed, ingest --db).
 *
 * - loadScriptEnv(): parses scripts/.env (gitignored) — SUPABASE_URL and
 *   SUPABASE_SERVICE_ROLE_KEY live ONLY there. The service-role key bypasses
 *   RLS and must never reach the client bundle or the repo.
 * - getServiceClient(): supabase-js client authenticated as service_role.
 * - loadPortalData(): bundles the portal's TS data modules with esbuild and
 *   imports them, so scripts reuse the exact same source of truth as the app
 *   (no regex re-parsing of TypeScript).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, '..');

export function loadScriptEnv() {
  const envPath = resolve(__dirname, '.env');
  if (!existsSync(envPath)) return {};
  const env = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n#]*)"?\s*$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

export function getServiceClient() {
  const env = { ...loadScriptEnv(), ...process.env };
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase not configured for scripts.\n' +
        'Create scripts/.env (gitignored) with:\n' +
        '  SUPABASE_URL=https://<project>.supabase.co\n' +
        '  SUPABASE_SERVICE_ROLE_KEY=<service role key from Project Settings → API>\n',
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Bundle + import the portal's TS data modules. Returns
 * { WCA_COUNTRIES, INDICATOR_CATALOG, IRRF_LEDGER, SP_OUTCOMES, MANAGED_MODULES }.
 */
export async function loadPortalData() {
  const esbuild = await import(
    pathToFileURL(resolve(ROOT, 'node_modules/vite/node_modules/esbuild/lib/main.js')).href
  ).catch(() => import('esbuild')); // fallback if hoisted
  const entry = `
    export { WCA_COUNTRIES } from '${resolve(ROOT, 'src/data.ts').replace(/\\/g, '/')}';
    export { INDICATOR_CATALOG } from '${resolve(ROOT, 'src/data/indicatorCatalog.ts').replace(/\\/g, '/')}';
    export { IRRF_LEDGER } from '${resolve(ROOT, 'src/data/irrf.ts').replace(/\\/g, '/')}';
    export { SP_OUTCOMES } from '${resolve(ROOT, 'src/types.ts').replace(/\\/g, '/')}';
    export { MANAGED_MODULES } from '${resolve(ROOT, 'src/lib/moduleAccess.ts').replace(/\\/g, '/')}';
  `;
  const outDir = resolve(ROOT, 'node_modules/.siga-scripts');
  mkdirSync(outDir, { recursive: true });
  const entryFile = resolve(outDir, 'data-entry.mjs');
  const outFile = resolve(outDir, 'data-bundle.mjs');
  writeFileSync(entryFile, entry);
  await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: outFile,
    logLevel: 'silent',
    // React is imported by moduleAccess's hook; it's import-safe under Node.
  });
  return import(pathToFileURL(outFile).href + `?t=${Date.now()}`);
}

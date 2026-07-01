/**
 * Supabase client — the portal's primary database when configured.
 *
 * Configuration comes from Vite env (`.env.local`, gitignored):
 *   VITE_SUPABASE_URL=https://<project>.supabase.co
 *   VITE_SUPABASE_ANON_KEY=<publishable anon key>
 *
 * When either var is absent, `hasSupabase` is false and every consumer falls
 * back to its offline path (localStorage / bundled seed) — the app must remain
 * fully usable with zero keys, exactly like the Firebase/Gemini fallbacks.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const hasSupabase = Boolean(url && anonKey);

// Lazy singleton so importing this module never throws when unconfigured.
let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!hasSupabase) throw new Error('Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
  if (!client) client = createClient(url!, anonKey!);
  return client;
}

import { createClient } from '@supabase/supabase-js';

// This client uses the SERVICE ROLE key, which bypasses Row Level
// Security. It must only ever be imported from server-side code
// (API routes, Server Components, Server Actions) — never from a
// file that ships to the browser. Next.js keeps anything without
// the NEXT_PUBLIC_ prefix out of the client bundle, so as long as
// this file is only imported server-side, the key stays server-side.
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

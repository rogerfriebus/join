/**
 * Angular environment configuration (default).
 *
 * Demo setup for the Developer Akademie: for contacts, Supabase is connected
 * via the project URL and the publishable key.
 *
 * IMPORTANT:
 *  - Use ONLY the publishable key.
 *  - NEVER store a secret key, service role key or database password here.
 *  - The current demo RLS allows anon access to `contacts`
 *    (deliberately for the school project, not production-ready).
 */
export const environment = {
  production: false,
  supabase: {
    url: 'https://wauozlupgddlkomieadz.supabase.co',
    publishableKey: 'sb_publishable_yAeJH_WK2E3Fyu_zGk6smg_A9fK9GuT',
  },
};

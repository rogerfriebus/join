/**
 * Angular Environment-Konfiguration (Development).
 *
 * Demo-Setup für die Developer-Akademie: Für Contacts wird Supabase über
 * die Project URL und den Publishable Key angebunden.
 *
 * WICHTIG:
 *  - NUR den Publishable Key verwenden.
 *  - NIEMALS Secret Key, Service Role Key oder Datenbankpasswort hier ablegen.
 *  - Die aktuelle Demo-RLS erlaubt anon-Zugriff auf `contacts`
 *    (bewusst fürs Schulprojekt, nicht produktionsreif).
 */
export const environment = {
  production: false,
  supabase: {
    url: 'https://wauozlupgddlkomieadz.supabase.co',
    publishableKey: 'sb_publishable_yAeJH_WK2E3Fyu_zGk6smg_A9fK9GuT',
  },
};

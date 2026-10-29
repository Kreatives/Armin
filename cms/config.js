/* =========================================================
   CMS-config — publieke Supabase-gegevens.
   De publishable key is bedoeld om in de browser te staan
   (net als de oude anon key); schrijven is beveiligd via RLS.
   De SECRET key hoort hier NOOIT — die staat alleen server-side.
   ========================================================= */
window.CMS_CONFIG = {
  url: 'https://rofihxpwduvhmhwlkyaz.supabase.co',
  anonKey: 'sb_publishable_qqGDDmGWaJnJ1IAuki5lKA_3QSKDron',
  tables: { texts: 'site_texts', cases: 'cases' },
  // Hoeveel ms de site wacht op Supabase voordat hij met de originele
  // (in de HTML gebakken) teksten doorgaat. Site breekt dus nooit.
  fetchTimeoutMs: 1500,
};

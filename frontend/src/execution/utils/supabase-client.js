const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Carica il file .env dalla root del progetto (se non già caricato)
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.error("ERRORE: SUPABASE_URL non configurato.");
}

if (!supabaseServiceKey || supabaseServiceKey.trim() === '') {
  console.warn("\n⚠️  ATTENZIONE: SUPABASE_SERVICE_KEY non trovata nel file .env.");
  console.warn("L'esecuzione degli script potrebbe fallire per motivi di sicurezza (RLS).\n");
}

/**
 * Admin Supabase Client — Per operazioni di sistema e ingestion (Node.js).
 * Bypassa RLS (utilizza la Service Role Key).
 */
const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey || process.env.SUPABASE_ANON_KEY, // Fallback (NON sicuro per admin)
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

module.exports = { supabase };

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

class MinimalScoroClient {
  constructor(apiKey, companyId, baseUrl) {
    this.apiKey = apiKey;
    this.companyId = companyId;
    this.baseUrl = baseUrl ? (baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`) : 'https://proweb.scoro.com/api/v2/';
  }

  async _post(module, requestData = {}) {
    const payload = {
      apiKey: this.apiKey,
      company_account_id: this.companyId,
      lang: 'eng',
      request: requestData
    };
    const response = await axios.post(`${this.baseUrl}${module}`, payload);
    return response.data.data || [];
  }
}

const envPath = path.join(__dirname, '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

async function startExtraction() {
  const client = new MinimalScoroClient(envConfig.SCORO_API_KEY, envConfig.SCORO_COMPANY_ACCOUNT_ID, envConfig.SCORO_API_URL);

  try {
    console.log('[REVENUE-EXTRACTOR] Scaricamento dati completi per filtraggio locale...');
    
    // Fetch all invoices and orders (up to 500 each to be safe)
    const [allInvoices, allOrders] = await Promise.all([
      client._post('invoices/list', { limit: 500 }),
      client._post('orders/list', { limit: 500 })
    ]);

    // Local Filtering for March 2026
    const marchInvoices = allInvoices.filter(i => (i.date || '').startsWith('2026-03'));
    const marchRev = marchInvoices.reduce((acc, inv) => acc + parseFloat(inv.sum || 0), 0);

    // Local Filtering for April 2026
    const aprilInvoices = allInvoices.filter(i => (i.date || '').startsWith('2026-04'));
    const aprilRevIssued = aprilInvoices.reduce((acc, inv) => acc + parseFloat(inv.sum || 0), 0);

    const aprilOrders = allOrders.filter(o => (o.date || '').startsWith('2026-04'));
    const aprilRevOrders = aprilOrders.reduce((acc, ord) => acc + parseFloat(ord.sum || 0), 0);

    // Fetch companies to map IDs to names
    const companies = await client._post('companies/list', { limit: 500 });
    const companyMap = {};
    companies.forEach(c => { companyMap[c.company_id || c.id] = c.company_name || c.name; });

    console.log('\n=========================================');
    console.log('📊 REPORT FINANZIARIO ANIMA 2026 (LOCALE)');
    console.log('=========================================');
    
    console.log('\n--- MARZO 2026 ---');
    if (marchInvoices.length > 0) {
      console.log(`Fatturato Reale: €${marchRev.toLocaleString('it-IT')}`);
      console.log(`Transazioni: ${marchInvoices.length}`);
      console.log('\n--- DETTAGLIO CLIENTI (MARZO) ---');
      marchInvoices.slice(0, 5).forEach(i => {
         const name = companyMap[i.company_id] || `Client #${i.company_id}`;
         console.log(`- ${name}: €${parseFloat(i.sum).toLocaleString('it-IT')}`);
      });
    } else {
      console.log('Nessun dato trovato per Marzo 2026.');
    }

    console.log('\n--- APRILE 2026 (Mese in corso) ---');
    if (aprilInvoices.length > 0 || aprilOrders.length > 0) {
      console.log(`Fatturato Emesso: €${aprilRevIssued.toLocaleString('it-IT')}`);
      console.log(`Pipeline (Ordini): €${aprilRevOrders.toLocaleString('it-IT')}`);
      const projection = aprilRevIssued + aprilRevOrders;
      console.log(`⭐ PROIEZIONE FINALE APRILE: €${projection.toLocaleString('it-IT')}`);
    } else {
      console.log('Nessun dato trovato per Aprile 2026.');
      console.log('NOTA: I dati del Mirror potrebbero essere fermi al 2025.');
    }
    
    console.log('\n--- PERFORMANCE 2025 (Per confronto) ---');
    const rev2025 = allInvoices.filter(i => (i.date || '').startsWith('2025')).reduce((acc, inv) => acc + parseFloat(inv.sum || 0), 0);
    console.log(`Fatturato Totale 2025: €${rev2025.toLocaleString('it-IT')}`);
    
    console.log('=========================================\n');

  } catch (err) {
    console.error('[ERROR] Estrazione fallita:', err.message);
  }
}

startExtraction();

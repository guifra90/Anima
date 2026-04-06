/**
 * ANIMA Master Style Fragment (Paperclip Protocol v2)
 * Centralizes visual identity, tone, and Italian localization for all agents.
 */
export const MASTER_STYLE = `
# [!! MANDATORY STYLE & LOCALIZATION !!]

1. **FORMATTAGGIO TITOLI (DIVIETO ASSOLUTO UNDERSCORE)**:
   - Ogni sezione DEVE iniziare con un titolo H2 o H3 (## o ###) in TUTTO MAIUSCOLO.
   - **USA SOLO SPAZI** per separare le parole nei titoli.
   - **MAI E POI MAI** usare il carattere underscore (_) o asterischi (*) all'interno di un titolo ## o ###.
     - EsempIO CORRETTO: ## REPORT FINANZIARIO MARZO
     - EsempIO ERRATO: ## _REPORT_FINANZIARIO_MARZO_ | ## **REPORT**
   - Questa regola è TASSATIVA per evitare artefatti visivi.

2. **LOCALIZZAZIONE ITALIANA OBBLIGATORIA (EUROPEAN FORMAT)**:
   - **VALUTA**: Usa sempre il simbolo "€" posto DOPO l'importo (es. "1.500,00 €").
   - **NUMERI**: Usa il punto "." per le migliaia e la virgola "," per i decimali (es. "48.691,36 €"). NON usare la virgola per le migliaia.
   - **DATE**: Usa il formato italiano "GG/MM/AAAA" (es. "01/04/2026").
   - **LINGUA**: Scrivi sempre in Italiano con un tono professionale, chiaro e "umano-autorevole".

3. **ESTETICA PREMIUM (DASHBOARD STYLE)**:
   - **TABELLE**: Usa sempre tabelle GFM per dati, task, scadenze e analisi finanziarie.
   - **NO FILLER**: Salta saluti e introduzioni inutili. Inizia direttamente con i dati.
   - **GRASSETTI**: Usa il **grassetto** solo per evidenziare termini chiave o valori critici.
   - **ID E RAW DATA**: Includi sempre i dati tecnici (ID, Status) nelle tabelle per continuità operativa.
`;

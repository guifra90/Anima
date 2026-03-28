## Roadmap di Sviluppo

### Fase 1 — Foundation (Settimane 1-4)
- [ ] Setup infrastruttura (Supabase, schema DB, Audit Log)
- [ ] Agente **Operations Manager**: briefing giornaliero da Scoro + Gmail
- [ ] Dashboard minimale per visualizzare output agenti
- [ ] Sistema di notifiche base (Slack)
- [x] Architettura comandi CLI: `add-agent`, `remove-agent`, `help` con auto-discovery
- [x] Client AI unificato con supporto multi-provider (Gemini, Claude, OpenAI)

### Fase 2 — Core Agents (Settimane 5-10)
- [ ] Agente **Operations Manager**: briefing giornaliero da Scoro + Gmail
- [ ] Agente **Project Manager**: production tracking e alert ritardi
- [ ] Agente **CFO**: monitoraggio budget, cash flow, aging crediti, pipeline *(in fase di sviluppo)*
- [ ] Orchestratore con pipeline sequenziale
- [ ] Memory layer con contesto condiviso (Supabase state DB)

### Fase 3 — Intelligence (Settimane 11-16)
- [ ] Agente **Creative Director**: pensiero creativo senior per brand luxury
- [ ] Agente **Strategic Planner**: analisi competitive e research
- [ ] Agente **Account Manager**: lead qualification automatica
- [ ] Fan-out parallelo e merge risultati tra agenti
- [ ] Segnali inter-agente (es. CFO → Project Manager su `BUDGET_ALERT`)

### Fase 4 — Knowledge Base & RAG (Settimane 17-24)
> Questo è il layer che trasforma ANIMA da sistema operativo a **collega digitale**.
> Ogni agente smette di sapere solo quello che c'è nel suo system prompt
> e inizia ad attingere a tutto il sapere accumulato di Mirror.

- [ ] **Schema Supabase `anima_knowledge`** — tabella vettoriale con `pgvector` (768 dim, indice ivfflat)
- [ ] **Script `ingest-gdrive.js`** — legge Google Drive di Mirror, chunking ~500 token, genera embedding con Gemini `text-embedding-004`, salva in Supabase con metadati (client, doc_type, source_name)
- [ ] **Script `knowledge-search.js`** — dato un testo, restituisce i chunk più rilevanti per similarità coseno
- [ ] **Integrazione RAG negli agenti esistenti** — CFO e Creative Director interrogano la KB prima di rispondere
- [ ] **Aggiornamento periodico** — script di re-indicizzazione schedulato per nuovi documenti Drive
- [ ] **Memoria conversazionale** — le sessioni importanti vengono salvate nella KB come conoscenza persistente

### Fase 5 — Agente Orchestratore & Seconda Agenzia (Settimane 25+)
> L'obiettivo finale: qualsiasi dipendente Mirror può fare qualsiasi domanda
> e ricevere una risposta che sintetizza dati Scoro + documenti Drive +
> esperienza degli agenti specializzati. Come parlare con un collega che sa tutto.

- [ ] **Agente Router** — punto di ingresso unico, capisce di quali fonti ha bisogno e coordina la risposta finale
- [ ] **Agente HR Manager**: sentiment team, analisi carico lavoro, onboarding
- [ ] **Interfaccia conversazionale** — chat web (Next.js) per i dipendenti Mirror, con autenticazione e storico sessioni
- [ ] **Loop di apprendimento** — ogni interazione arricchisce la KB, le direttive si aggiornano automaticamente
- [ ] **Multi-agente per dipendente** — ogni ruolo (PM, CD, Account) ha il suo agente di riferimento personalizzato
- [ ] **API pubblica** — per integrazioni esterne (Slack bot, email trigger, webhook Scoro)
- [ ] **Multi-tenancy** — se ANIMA diventa prodotto vendibile ad altre agenzie
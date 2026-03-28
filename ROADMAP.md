## Roadmap di Sviluppo

### Fase 1 — Foundation (Settimane 1-4)
- [x] Setup infrastruttura (Supabase, schema DB, Audit Log)
- [x] Dashboard minimale per visualizzare output agenti
- [x] Sistema di notifiche base (Slack)
- [x] Architettura comandi CLI: `add-agent`, `remove-agent`, `help` con auto-discovery
- [x] Client AI unificato con supporto multi-provider (Gemini, Claude, OpenAI)

### Fase 2 — Knowledge Base SOPs (Settimane 5-8)
> Prima di costruire gli agenti, ANIMA deve conoscere le procedure operative ufficiali di Mirror. Le SOPs sono la fonte di verità da cui ogni agente attinge prima di rispondere. Questa fase è il prerequisito di tutto il sistema.

#### Step 1 — Infrastruttura KB (Settimane 5-6)
- [x] **Tabella `anima_sops`** — campi: `id`, `title`, `version`, `department`, `owner`, `access_level`, `status`, `content`, `last_updated`
- [x] **Tabella vettoriale `anima_knowledge`** — `pgvector` 384 dim (all-MiniLM-L6-v2), metadati: `source_type`, `source_id`, `department`, `status`
- [x] **Schema SQL completo + migration script** (v1.0.0)

#### Step 2 — Gestione SOPs (Settimane 6-7)
- [x] **Sezione SOPs nella dashboard** — `/sops` completata con editor e listing
- [x] **Editor SOPs** — caricamento testo Markdown, form completo e re-indexing automatico
- [x] **Versioning automatico** — al salvataggio viene creata una nuova versione attiva e archiviata la precedente
- [x] **Script `ingest-sop.js`** — chunking con overlap, embedding locale (384 dim)
- [x] **Batch Ingestion CLI** — `node execution/utils/ingest-cli.js` per aggiornamento massivo

#### Step 3 — Retrieval (Settimana 8)
- [x] **Script `knowledge-search.js`** — dato un testo e filtri opzionali (department, status), restituisce i chunk più rilevanti per similarità coseno
- [x] **Priorità delle fonti definita**: SOPs attive (massima priorità) → dati Scoro live → conoscenza LLM
- [x] **Citazione della fonte** — ogni risposta che usa una SOP indica titolo e versione

#### Step 4 — CLI SOPs
- [x] **Comandi CLI**: `add-sop`, `update-sop`, `list-sops`, `archive-sop` — stessa logica guidata di `add-agent`
- [x] **Gestione cancellazione SOP** — eliminazione fisica e semantica dalla dashboard

#### [0.2.0] - 2026-03-28
#### Aggiunto
- **Motore RAG Locale**: Implementato sistema di embedding basato su `Transformers.js` (`all-MiniLM-L6-v2`) per eliminare la dipendenza da API esterne e costi.
- **Unified Embedding Service**: Creato servizio backend/frontend per generazione vettori a 384 dimensioni.
- **Knowledge Retrieval**: Integrazione nel Bridge ANIMA per l'iniezione automatica del contesto SOP nelle chat degli agenti.
- **SOP UI**: Potenziata l'interfaccia di gestione SOP con indicizzazione vettoriale in tempo reale.

### [0.1.0] - 2026-03-28

### Fase 3 — Core Agents (Settimane 9-16)
> Gli agenti vengono costruiti dopo la KB — così dal primo giorno hanno accesso alle SOPs aziendali e rispondono già con la conoscenza reale di Mirror.

- [ ] Agente **Operations Manager**: briefing giornaliero da Scoro + Gmail + SOPs Operations
- [ ] Agente **Project Manager**: production tracking, alert ritardi + SOPs Production
- [ ] Agente **CFO**: monitoraggio budget, cash flow, aging crediti, pipeline
- [ ] Orchestratore con pipeline sequenziale
- [ ] Memory layer con contesto condiviso (Supabase state DB)
- [ ] **Integrazione RAG** — CFO e tutti i nuovi agenti interrogano la KB SOPs prima di ogni risposta

### Fase 4 — Intelligence (Settimane 17-22)
- [x] Agente **Creative Director**: pensiero creativo senior per brand luxury (RAG integrato)
- [ ] Agente **Strategic Planner**: analisi competitive e research + SOPs Strategy
- [ ] Agente **Account Manager**: lead qualification automatica + SOPs Business Dev
- [ ] Fan-out parallelo e merge risultati tra agenti
- [ ] Segnali inter-agente (es. CFO → Project Manager su `BUDGET_ALERT`)
- [ ] **Integrazione RAG su tutti gli agenti** — estensione retrieval SOPs a tutti i 7 agenti

### Fase 5 — Memoria conversazionale (Settimane 23-24)
- [ ] **Salvataggio sessioni importanti** — le sessioni del Creative Director e i briefing strategici vengono salvati nella KB come `source_type: conversation`
- [ ] La conoscenza generata durante l'uso di ANIMA diventa patrimonio aziendale permanente
- [ ] Loop di apprendimento: le direttive degli agenti si aggiornano quando il sistema impara nuovi vincoli dalle sessioni reali

### Fase 6 — Agente Orchestratore & Seconda Agenzia (Settimane 25+)
> L'obiettivo finale: qualsiasi dipendente Mirror può fare qualsiasi domanda e ricevere una risposta che sintetizza SOPs aziendali + dati Scoro live + esperienza degli agenti specializzati. Come parlare con un collega che sa tutto.

- [x] **Agente Router** — punto di ingresso unico, capisce di quali fonti ha bisogno e coordina la risposta finale
- [ ] **Agente HR Manager**: sentiment team, analisi carico lavoro, onboarding + SOPs HR
- [x] **Interfaccia conversazionale** — `/agents` Hub Next.js completato con supporto RAG real-time
- [ ] **Multi-agente per dipendente** — ogni ruolo (PM, CD, Account) ha il suo agente di riferimento personalizzato
- [ ] **API pubblica** — per integrazioni esterne (Slack bot, n8n, webhook Scoro)
- [ ] **Multi-tenancy** — se ANIMA diventa prodotto vendibile ad altre agenzie
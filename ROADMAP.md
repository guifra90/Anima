## Roadmap di Sviluppo

### Fase 1 — Foundation (Settimane 1-4)
- [ ] Setup infrastruttura (Supabase, schema DB, Audit Log)
- [ ] Dashboard minimale per visualizzare output agenti
- [ ] Sistema di notifiche base (Slack)
- [ ] Architettura comandi CLI: `add-agent`, `remove-agent`, `help` con auto-discovery
- [ ] Client AI unificato con supporto multi-provider (Gemini, Claude, OpenAI)

### Fase 2 — Knowledge Base SOPs (Settimane 5-8)
> Prima di costruire gli agenti, ANIMA deve conoscere le procedure operative ufficiali di Mirror. Le SOPs sono la fonte di verità da cui ogni agente attinge prima di rispondere. Questa fase è il prerequisito di tutto il sistema.

#### Step 1 — Infrastruttura KB (Settimane 5-6)
- [ ] **Tabella `anima_sops`** — campi: `id`, `title`, `version`, `department`, `owner`, `access_level` (all / managers / department), `status` (active / draft / archived), `content`, `last_updated`
- [ ] **Tabella vettoriale `anima_knowledge`** — `pgvector` 768 dim con indice ivfflat, metadati: `source_type` (sop / conversation), `source_id`, `department`, `status`
- [ ] **Schema SQL completo + migration script**

#### Step 2 — Gestione SOPs (Settimane 6-7)
- [ ] **Sezione SOPs nella dashboard** — accessibile solo ai manager autorizzati (ruoli configurabili)
- [ ] **Editor SOPs** — caricamento testo Markdown o upload PDF, con form: titolo, reparto, owner, versione, livello di accesso
- [ ] **Versioning automatico** — al salvataggio di una modifica, la versione precedente viene archiviata (`status: archived`), mai cancellata
- [ ] **Script `ingest-sop.js`** — chunking ~500 token, embedding con Gemini `text-embedding-004`, salvataggio in `anima_knowledge` con `source_type: sop`
- [ ] **Re-indicizzazione automatica** — ogni modifica a una SOP trigghera immediatamente il re-embedding

#### Step 3 — Retrieval (Settimana 8)
- [ ] **Script `knowledge-search.js`** — dato un testo e filtri opzionali (department, status), restituisce i chunk più rilevanti per similarità coseno
- [ ] **Priorità delle fonti definita**: SOPs attive (massima priorità) → dati Scoro live → conoscenza LLM
- [ ] **Citazione della fonte** — ogni risposta che usa una SOP indica titolo e versione

#### Step 4 — CLI SOPs
- [ ] **Comandi CLI**: `add-sop`, `update-sop`, `list-sops`, `archive-sop` — stessa logica guidata di `add-agent`

### Fase 3 — Core Agents (Settimane 9-16)
> Gli agenti vengono costruiti dopo la KB — così dal primo giorno hanno accesso alle SOPs aziendali e rispondono già con la conoscenza reale di Mirror.

- [ ] Agente **Operations Manager**: briefing giornaliero da Scoro + Gmail + SOPs Operations
- [ ] Agente **Project Manager**: production tracking, alert ritardi + SOPs Production
- [ ] Agente **CFO**: monitoraggio budget, cash flow, aging crediti, pipeline
- [ ] Orchestratore con pipeline sequenziale
- [ ] Memory layer con contesto condiviso (Supabase state DB)
- [ ] **Integrazione RAG** — CFO e tutti i nuovi agenti interrogano la KB SOPs prima di ogni risposta

### Fase 4 — Intelligence (Settimane 17-22)
- [ ] Agente **Creative Director**: pensiero creativo senior per brand luxury *(in sviluppo — integrazione SOPs Creative da aggiungere)*
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

- [ ] **Agente Router** — punto di ingresso unico, capisce di quali fonti ha bisogno e coordina la risposta finale
- [ ] **Agente HR Manager**: sentiment team, analisi carico lavoro, onboarding + SOPs HR
- [ ] **Interfaccia conversazionale** — chat web (Next.js) per i dipendenti Mirror, con autenticazione e storico sessioni
- [ ] **Multi-agente per dipendente** — ogni ruolo (PM, CD, Account) ha il suo agente di riferimento personalizzato
- [ ] **API pubblica** — per integrazioni esterne (Slack bot, n8n, webhook Scoro)
- [ ] **Multi-tenancy** — se ANIMA diventa prodotto vendibile ad altre agenzie
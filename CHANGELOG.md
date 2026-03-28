# CHANGELOG — ANIMA

```
v1.6.0 — 2026-03-28
  - Fase 4 riscritta con approccio SOPs-first (rimosso Google Drive per ora)
  - Aggiunta struttura in 4 step: infrastruttura KB, gestione SOPs, retrieval agenti, memoria
  - Sezione SOPs con editor, versioning automatico, access control per manager
  - Comandi CLI dedicati: add-sop, update-sop, list-sops, archive-sop

v1.5.0 — 2026-03-28
  - Roadmap aggiornata a 5 fasi
  - Fase 4 dedicata a Knowledge Base & RAG (pgvector, ingest Drive, knowledge-search)
  - Fase 5 dedicata ad Agente Router e interfaccia conversazionale per dipendenti
  - Segnati come completati: CFO, Creative Director, CLI commands, AI client

v1.4.0 — 2026-03-28
  - Aggiunto client AI unificato (execution/utils/ai-client.js)
  - Supporto multi-provider: Gemini (gratuito), Claude, OpenAI
  - Cambio provider tramite AI_PROVIDER e AI_MODEL in .env
  - Gemini 2.0 Flash come default per sviluppo e test

v1.3.0 — 2026-03-28
  - help.js ora usa auto-discovery: legge i tag @anima-command dagli header degli script
  - Nessuna registrazione manuale in COMMANDS[] — basta creare il file con i tag
  - Aggiunto @order per controllare la posizione nel menu
  - File senza @anima-command (router, engine, utils) ignorati automaticamente

v1.2.0 — 2026-03-28
  - Aggiunto comando remove-agent con archiviazione sicura
  - Conferma doppia prima della rimozione
  - Avvisi automatici su dipendenze tra agenti

v1.1.0 — 2026-03-28
  - Aggiunto comando add-agent con scaffolding automatico
  - Generazione automatica directive.md, system.md, test file
  - Auto-aggiornamento tabella agenti e CHANGELOG in ANIMA.md

v1.0.0 — 2026-03-27
  - Documento fondativo ANIMA
  - Definita architettura a 4 livelli
  - Identificati 7 agenti core
  - Stack tecnologico definito
  - Roadmap di sviluppo in 4 fasi
```

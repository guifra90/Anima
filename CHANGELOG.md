# CHANGELOG — ANIMA

```
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

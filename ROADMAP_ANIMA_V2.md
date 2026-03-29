# ROADMAP ANIMA V2 (Agency OS)

## 🏛️ Filosofia di Progetto (The Mirror Principle)
- **Paperclip as Source of Truth**: Ogni funzionalità, scelta UX/UI e logica di esecuzione deve rispecchiare fedelmente l'esperienza di Paperclip.
- **Zero Human Agency**: L'obiettivo finale è una piattaforma professionale, performante e autonoma che dia risultati concreti.
- **Flessibilità dei Modelli**: Supporto multi-adapter. Possibilità di assegnare modelli diversi ad agenti diversi (es. CEO su Ollama, CFO su Claude, Creative su Gemini).

## 🟢 Status Attuale (Sessione 29-03-2026 Conclusa)
- Sistema Ollama: **OPERATIVO** (DeepSeek-R1 pronto, Llama3.1 @ 75%)
- DB Schema: **PRONTO** (Refined with Dynamic Agent columns)
- AI Client: **PRONTO** (Supporta Ollama locale + Gemini API)
- Heartbeat Engine: **ALPHA** (Script `heartbeat.js` pronto al test)
- Dashboard UI: **ALPHA** (Sidebar e Mission Control redesignati)

---

## 📅 Prossimi Passi (Priorità Alta - Domani)

### 0. Multi-Model Adapter System
- [ ] Implementare il registro degli adapter (clonando `adapters/registry.ts` di Paperclip).
- [ ] Permettere la configurazione della chiave API / Endpoint per ogni agente.

### 1. Hiring Hall (Team Management)
- [ ] Creare la pagina `/team` per la gestione ed "assunzione" degli agenti.
- [ ] Implementare il form di creazione agente con associazione modello (Ollama/Claude/Gemini).
- [ ] Visualizzazione Org Chart gerarchica.

### 2. Mission & Task Management
- [ ] Creare la pagina `/missions/new` per inserire nuovi obiettivi.
- [ ] Implementare il "Planner" (Orchestrator) che scompone la missione usando DeepSeek-R1.
- [ ] Sviluppare la vista dettagliata del "Goal Tree".

### 3. Board Approval Flow
- [ ] Implementare la vista di review per i task in `in_review`.
- [ ] Aggiungere bottoni di "Approve" e "Reject" con feedback.

### 4. Skill System (MCP/Plugins)
- [ ] Implementare il parser per file `SKILL.md` (Formato Paperclip).
- [ ] Creare il servizio di sincronizzazione `skill-service.js`.
- [ ] Supporto per MCP (Model Context Protocol).

### 5. Legacy Cleanup & Modernization
- [ ] Rimuovere la cartella `agents/` (agenti ora dinamici e nel DB).
- [ ] Rimuovere la cartella `orchestration/` (logica obsoleta sostituita dal nuovo heartbeart/planner).
- [ ] Rimuovere la cartella `directives/` (obiettivi ora gestiti via Missioni nel DB).
- [ ] Pulizia file di documentazione legacy (`ANIMA.md`, `ROADMAP.md`).

---

## 📝 Changelog Recente
- **2026-03-29 (Sera)**:
    - **Architecture**: Transizione completa a "Agency OS" (Paperclip Clone).
    - **Ollama**: Configurato server locale e scaricati modelli DeepSeek-R1 e Llama3.1.
    - **Database**: Applicate migrazioni per Missions, Tasks, Config e Dynamic Agents.
    - **Engine**: Sviluppato `heartbeat.js` per il polling e l'esecuzione autonoma dei task.
    - **UI/UX**: Redesign totale della Sidebar e della Dashboard (Mission Control).
    - **Skills (Planned)**: Aggiunta la base per il sistema di abilità e MCP al piano v2.

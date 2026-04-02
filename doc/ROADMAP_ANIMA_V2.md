# ROADMAP ANIMA V2 (Agency OS)

## 🏛️ Filosofia di Progetto (The Mirror Principle)
- **Paperclip as Source of Truth**: Ogni funzionalità, scelta UX/UI e logica di esecuzione deve rispecchiare fedelmente l'esperienza di Paperclip. Il codice sorgente di paperclip sul mio computer: /Users/francescoguidotti/Documents/Lavoro/paperclip per controllare sempre come è stato implementato.
- **Zero Human Agency**: L'obiettivo finale è una piattaforma professionale, performante e autonoma che dia risultati concreti.
- **Flessibilità dei Modelli**: Supporto multi-adapter. Possibilità di assegnare modelli diversi ad agenti diversi (es. CEO su Ollama, CFO su Claude, Creative su Gemini).

## 🟢 Status Attuale (Sessione 01-04-2026 Conclusa)
- Mission Control: **OPERATIVO** (Esecuzione task e navigazione dettaglio ripristinata)
- Dashboard UI: **OPERATIVO** (Grid system V2, Link funzionali)
- Governance: **OPERATIVO** (Directives, Traits e Constitution implementati)
- Team / Hiring Hall: **OPERATIVO** (Organigramma ripristinato, UI V2 Premium)
- Tooling & Skills: **OPERATIVO** (Skill Management UI, multi-account connections, secure encryption)
- AI Core & Bridge: **STABILIZZATO** (V3.2: Neural Consolidation & Fingerprinting)
- Zero-Human Engine: **ROBUSTO** (Consolidamento report multi-turno e protezione anti-loop)

---

## 📅 Prossimi Passi (Priorità Alta - Domani)

### 1. Interattività & Autonomous Logic
- [ ] **Hybrid Execution Engine**: Implementare la possibilità di scegliere tra esecuzione "MANUALE" (step-by-step come ora) e "AUTONOMA" (Auto-Pilot) per ogni missione.
- [/] **Autonomous Loop**: Logica di concatenamento automatico dei task (V3.2 Bridge logic completata).
- [ ] **Sistema di Notifiche**: Notifiche istantanee (UI/Browser) al completamento o in caso di richiesta di intervento umano.
- [ ] **Human-in-the-loop**: Blocchi di sicurezza per conferme esplicite su azioni critiche o distruttive.

### 2. Memory & Context Optimization
- [ ] Migliorare il sistema RAG per permettere agli agenti di ricordare missioni passate.
- [ ] Implementare "Short-term Memory" tra task consecutivi nello stesso thread di missione.
- [ ] Ottimizzare il recupero delle SOPs (Knowledge Base) durante la pianificazione.

### 3. Deployment & Stability
- [ ] Migrazione su VPS di produzione per test di stress h24.
- [ ] Dockerization completa dello stack (Frontend, Backend, DB Proxy).
- [ ] Setup di monitoring (Sentry/Logtail) per il kernel dell'agenzia.

---

## 📝 Changelog Recente
- **2026-04-01 (Oggi)**:
    - **V3.1 Emergency Fix**: Risolta la dipendenza circolare (deadlock) tra `anima.ts` e `ai-bridge-server.ts`. Creato `anima-persistence.ts` per isolare le operazioni DB.
    - **V3.2 Neural Bridge Consolidation**: 
        - Implementato **Neural Accumulator**: ora i report vengono consolidati attraverso tutti i turni dell'agente (risolto il problema del report "punto 5").
        - Implementato **Tool Fingerprinting**: previene la creazione di duplicati (es. eventi calendario doppi) scartando chiamate identiche nello stesso ciclo.
        - **Paperclip-style Directives**: Aggiunto avviso di terminazione automatica al 4° turno per guidare l'agente alla chiusura.
    - **Stability**: Migliorata la robustezza del loop autonomo per missioni multi-task senza supervisione.
- **2026-03-31**:
- **2026-03-30**:
    - **Mission Execution**: Test end-to-end completato con successo. Risolto troncamento report (max_tokens: 8000).
    - **Dashboard**: Refactoring totale della UI in grid system a 12 colonne. Risolte sovrapposizioni su schermi piccoli.
    - **Governance System**: 
        - Aggiunti Campi `traits` e `directives` al DB e alla UI.
        - Implementata la **Agency Constitution** (regole globali).
        - Nuovo Editor Agenti a schede (Identity, Traits, Directives).
    - **AI Core**: Nuovo `buildPaperclipPrompt` per iniezione dinamica della cultura aziendale.
- **2026-03-29**:
    - **Architecture**: Transizione completa a "Agency OS" (Paperclip Clone).
    - **Ollama**: Configurato server locale e modelli DeepSeek-R1 / Llama3.1.
    - **Database**: Migrazioni Missions, Tasks, Config e Dynamic Agents.

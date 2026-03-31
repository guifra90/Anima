# ROADMAP ANIMA V2 (Agency OS)

## 🏛️ Filosofia di Progetto (The Mirror Principle)
- **Paperclip as Source of Truth**: Ogni funzionalità, scelta UX/UI e logica di esecuzione deve rispecchiare fedelmente l'esperienza di Paperclip. Il codice sorgente di paperclip sul mio computer: /Users/francescoguidotti/Documents/Lavoro/paperclip per controllare sempre come è stato implementato.
- **Zero Human Agency**: L'obiettivo finale è una piattaforma professionale, performante e autonoma che dia risultati concreti.
- **Flessibilità dei Modelli**: Supporto multi-adapter. Possibilità di assegnare modelli diversi ad agenti diversi (es. CEO su Ollama, CFO su Claude, Creative su Gemini).

## 🟢 Status Attuale (Sessione 31-03-2026 Conclusa)
- Mission Control: **OPERATIVO** (Esecuzione task e navigazione dettaglio ripristinata)
- Dashboard UI: **OPERATIVO** (Grid system V2, Link funzionali)
- Governance: **OPERATIVO** (Directives, Traits e Constitution implementati)
- Team / Hiring Hall: **OPERATIVO** (Organigramma ripristinato, UI V2 Premium)
- Tooling & Skills: **OPERATIVO** (Skill Management UI, multi-account connections, secure encryption)
- AI Core: **OPERATIVO** (Dynamic decryption, real tool executions for Scoro)
- Zero-Human Engine: **PRONTO** (Output completi fino a 8000 tokens)

---

## 📅 Prossimi Passi (Priorità Alta - Domani)

### 1. Interattività & Autonomous Logic
- [ ] **Hybrid Execution Engine**: Implementare la possibilità di scegliere tra esecuzione "MANUALE" (step-by-step come ora) e "AUTONOMA" (Auto-Pilot) per ogni missione.
- [ ] **Autonomous Loop**: Logica di concatenamento automatico dei task per le missioni in modalità Auto-Pilot.
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
- **2026-03-31 (Oggi)**:
    - **Mission Detail Restoration**: Ripristinata la navigazione dalle card della dashboard e fatto l'overhaul estetico della pagina `/missions/[id]`.
    - **Org Chart Restoration**: Reintegrata la visualizzazione gerarchica nella Hiring Hall con toggle GRID/ORG e stile "Paperclip V2".
    - **UI/UX Polish**: Applicato il design system V2 a tutte le rotte principali (Team, Agents, SOPs, Governance, Departments, Settings).
    - **Skill Management**: Portato a termine il sistema di assegnazione toolset (Skills) agli agenti via UI.
    - **Multi-Account/Connections**: Implementata la gestione sicura dell'identità esterna (Scoro, Google) con protezione AES-256 e RLS. 
    - **AI Bridge**: Refactoring completo per supportare la decriptazione dinamica delle chiavi API durante l'esecuzione del task.
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

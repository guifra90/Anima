# ROADMAP ANIMA V2 (Agency OS)

## 🏛️ Filosofia di Progetto (The Mirror Principle)
- **Paperclip as Source of Truth**: Ogni funzionalità, scelta UX/UI e logica di esecuzione deve rispecchiare fedelmente l'esperienza di Paperclip. Il codice sorgente di paperclip sul mio computer: /Users/francescoguidotti/Documents/Lavoro/paperclip per controllare sempre come è stato implementato.
- **Zero Human Agency**: L'obiettivo finale è una piattaforma professionale, performante e autonoma che dia risultati concreti.
- **Flessibilità dei Modelli**: Supporto multi-adapter. Possibilità di assegnare modelli diversi ad agenti diversi (es. CEO su Ollama, CFO su Claude, Creative su Gemini).

## 🟢 Status Attuale (Sessione 02-04-2026 Conclusa)
- **Bi-Directional Sync**: 🔄 **OPERATIVO** (Sincronizzazione istantanea Dashboard <-> Filesystem. Scaffolding DNA agenti automatico).
- **Archive Module**: 🗑️ **OPERATIVO** (Gestione cartelle orfane e vista "Archive Data" nelle missioni).
- **Mission Control**: 🚀 **OPERATIVO** (Esecuzione task e navigazione dettaglio ripristinata).
- **Governance**: ⚖️ **OPERATIVO** (Directives, Traits e **CONSTITUTION.md** allineata).
- **Team / Hiring Hall**: 👥 **OPERATIVO** (Organigramma, UI V2 e scaffolding DNA completo).
- **AI Core & Bridge**: 🧠 **STABILIZZATO** (V3.2: Neural Consolidation & Fingerprinting).
- **Auto-Pilot & Memory**: 🧠 **OPERATIVO** (RAG 2.0 e Autonomous Chaining).

---

## 📅 Prossimi Passi (Priorità Alta - Deployment & Scale)

### 1. Interattività & Autonomous Logic (OPERATIVO)
- [X] **Hybrid Execution Engine**: Implementata la scelta tra esecuzione "MANUALE" e "AUTONOMA" (Auto-Pilot).
- [X] **Autonomous Loop**: Logica di concatenamento automatico dei task via `executor.ts`.
- [X] **Real-time Logs (Neural Stream)**: Neural Stream 2.0 attivo con visualizzazione pensieri live.
- [X] **Human-in-the-loop**: Safety blocks interattivi con UI di approvazione ambra.

### 2. Memory & Context Optimization (OPERATIVO)
- [X] **Memory RAG 2.0**: Gli agenti ricordano missioni passate via `pgvector`.
- [X] **Neural Trace**: Continuità narrativa tra task dello stesso progetto (Mission Continuum).
- [X] **Knowledge Base (SOP)**: Iniezione dinamica di standard aziendali e linee guida brand Mirror.
- [X] **Search Optimization**: Prioritizzazione della memoria interna rispetto alla ricerca web.

### 3. Deployment & Stability (Domani 🚀)
- [ ] Migrazione su VPS di produzione per test di stress h24.
- [ ] Dockerization completa dello stack (Frontend, Backend, DB Proxy).
- [ ] Setup di monitoring (Sentry/Logtail) per il kernel dell'agenzia.

---

## 📝 Changelog Recente
- **2026-04-02 (Oggi)**:
    - **V3.5 Neural Memory RAG**: 
        - **Mission Consolidation**: Indicizzazione automatica in `pgvector` a fine missione.
        - **Zero-Day Recall**: Gli agenti ricordano i trend e i risultati passati istantaneamente.
        - **Match Optimization**: Soglia di ricerca abbassata a 0.2 per massima sensibilità.
    - **V3.4 Mission Control 2.0**:
        - **Auto-Pilot Ignition**: Innesco automatico dei task (Paperclip style).
        - **Safety Block UI**: Interfaccia ambra pulsante per approvazioni critiche.
- **2026-04-01**:
    - **V3.3 Neural Executor**: Migliorata stabilità agenti e prevenzione loop infiniti.

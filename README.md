# ANIMA — Autonomous Network for Intelligent Mirror Agency

### Sistema Multi-Agente Zero-Human per Mirror Agency

ANIMA è il sistema nervoso centrale di **Mirror**. Non è un semplice assistente, ma un'architettura operativa che coordina autonomamente i reparti dell'agenzia (Finance, Strategy, Creative, Production, HR) attraverso una rete di agenti intelligenti interconnessi.

---

## 🚀 Visione: "Gli LLM decidono, il codice esegue"

ANIMA risolve la complessità dei sistemi multi-agente separando la logica decisionale probabilistica (LLM) dall'esecuzione deterministica (Script Node.js). Ogni azione è tracciata, ogni errore è un'opportunità di apprendimento, ogni successo è scalabile.

## 🏗️ Architettura a 4 Livelli

1.  **Livello 0: Dati & Memoria** — Supabase (PostgreSQL) + pgvector per memoria a lungo termine.
2.  **Livello 1: Direttive** — SOP (Standard Operating Procedures) in Markdown che definiscono il comportamento di ogni agente.
3.  **Livello 2: Orchestrazione** — Routing intelligente, gestione segnali e coordinamento tra agenti.
4.  **Livello 3: Esecuzione** — Script JS/Node.js affidabili per interagire con API (Scoro, Gmail, GCal).

---

## ⚡ Guida Rapida

### 1. Requisiti
- Node.js (v18+)
- Una chiave API di Google Gemini (ottenibile su [aistudio.google.com](https://aistudio.google.com))

### 2. Configurazione
Copia il file `.env.example` in `.env` e inserisci le tue chiavi:
```bash
GEMINI_API_KEY=tua_chiave_qui
AI_MODEL=gemini-flash-lite-latest
```

### 3. Avvio Dashboard (Frontend)
L'interfaccia premium di ANIMA permette di navigare tra gli agenti e avviare sessioni creative:
```bash
cd frontend
npm install
npm run dev
# Apri http://localhost:3000
```

### 4. Utilizzo CLI (Agenti)
Puoi interagire con il Creative Director direttamente dal terminale:
```bash
node agents/creative-director/run.js
```

---

## 🤖 Agenti Core Attivati

| Agente | Reparto | Scopo |
| :--- | :--- | :--- |
| **Creative Director** | Creative | Concept senior, Brand Thinking, De-costruzione Brief |
| **CFO** | Finance | Monitoraggio budget e alert margini (in fase di sviluppo) |
| **Operations Manager** | Operations | Briefing giornaliero Scoro + Gmail (prossimamente) |

---

## 🛠️ Tooling & Orchestrazione

ANIMA include strumenti di scaffolding per espandere il network:
- `node orchestration/help.js` — Menu interattivo dei comandi.
- `node orchestration/add-agent.js` — Crea automaticamente un nuovo agente con tutta la struttura necessaria.

---

## 🗺️ Roadmap Sintetica

- [x] **Fase 1**: Setup architettura, CLI e Client AI resiliente.
- [x] **Fase 2**: Interfaccia Dashboard Next.js (Multi-agente).
- [/] **Fase 3**: Integrazione persistente con Supabase & Audit Log (In corso).
- [ ] **Fase 4**: Knowledge Base & RAG (Ingestion Google Drive).
- [ ] **Fase 5**: Agente Router & Accesso Conversazionale per dipendenti.

---

### Contatti & Governance
Mirror Internal Tool. Confidential & Reserved.
*Sviluppato con passione per l'eccellenza creativa e l'automazione intelligente.*

# ANIMA — Autonomous Network for Intelligent Mirror Agency

### Sistema Multi-Agente "Zero-Human" (Standard Agent Companies)

ANIMA è il sistema nervoso centrale di **Mirror**. Non è un semplice assistente, ma un'architettura operativa che coordina autonomamente i reparti dell'agenzia attraverso una rete di agenti intelligenti interconnessi, seguendo lo standard [AgentCompanies.io](https://agentcompanies.io/).

---

## 🏗️ Architettura & Struttura

Il progetto segue un modello **markdown-first** per la portabilità e l'allineamento degli agenti AI.

- **[COMPANY.md](COMPANY.md)**: Entrypoint dell'agenzia, definisce obiettivi, team e agenti.
- **[doc/](doc/)**: Contiene la documentazione di sistema, roadmap e specifiche tecniche.
- **[agents/](agents/)**: Libreria di ruoli (es. `AGENTS.md`), ognuno con la propria identità e istruzioni.
- **[skills/](skills/)**: Capacità operative condivise (es. `SKILL.md`) per interfacciarsi con Google, Scoro e Web.
- **[orchestration/](orchestration/)**: Nucleo logico per il routing e il coordinamento neurale.
- **[frontend/](frontend/)**: Dashboard Next.js premium per il monitoraggio e l'interazione.
- **[.agents/](.agents/)**: Tool e sub-agenti dedicati all'assistenza nello sviluppo del progetto.

---

## ⚡ Guida Rapida

### 1. Requisiti & Setup
```bash
cp .env.example .env
# Inserisci GEMINI_API_KEY e SUPABASE_URL
```

### 2. Avvio Dashboard
```bash
cd frontend && npm install && npm run dev
```

### 3. Orchestrazione & Comandi
```bash
npm run help # Menu interattivo
```

---

## 🤖 Governance & Portabilità
Ogni entità di ANIMA è definita da file Markdown con frontmatter YAML, rendendo l'intero sistema "Zero Human" e facilmente esportabile o migrabile tra diversi orchestratori compatibili con lo standard `agentcompanies/v1`.

- **Audit Log**: Ogni azione è tracciata su Supabase.
- **Memory Landscape**: Visione olistica della memoria a lungo termine in `doc/memory-landscape.md`.

---

### Contatti & Policy
Mirror Internal Tool. Confidential & Reserved.
*Sviluppato con passione per l'eccellenza creativa e l'automazione intelligente.*

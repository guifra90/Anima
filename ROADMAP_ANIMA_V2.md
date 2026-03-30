# ROADMAP ANIMA V2 (Agency OS)

## 🏛️ Filosofia di Progetto (The Mirror Principle)
- **Paperclip as Source of Truth**: Ogni funzionalità, scelta UX/UI e logica di esecuzione deve rispecchiare fedelmente l'esperienza di Paperclip. Il codice sorgente di paperclip sul mio computer: /Users/francescoguidotti/Documents/Lavoro/paperclip per controllare sempre come è stato implementato.
- **Zero Human Agency**: L'obiettivo finale è una piattaforma professionale, performante e autonoma che dia risultati concreti.
- **Flessibilità dei Modelli**: Supporto multi-adapter. Possibilità di assegnare modelli diversi ad agenti diversi (es. CEO su Ollama, CFO su Claude, Creative su Gemini).

## 🟢 Status Attuale (Sessione 30-03-2026 Conclusa)
- Mission Control: **OPERATIVO** (Esecuzione task end-to-end verificata)
- Dashboard UI: **BETA** (Nuovo grid system a 12 colonne, responsive)
- Governance: **OPERATIVO** (Directives, Traits e Constitution implementati)
- AI Core: **BETA** (Prompt Builder strutturato Paperclip-style)
- Zero-Human Engine: **PRONTO** (Output completi fino a 8000 tokens)

---

## 📅 Prossimi Passi (Priorità Alta - Domani)

### 3. Tooling & Skill System (MCP/Plugins)
- [ ] Implementare il parser per file `SKILL.md` (Formato Paperclip).
- [ ] Supporto per MCP (Model Context Protocol).
- [ ] Collegare i primi tool operativi: **Gmail API**, **Google Calendar**, **Scoro**.

### 4. Memory & Context Optimization
- [ ] Migliorare il sistema RAG per permettere agli agenti di ricordare missioni passate.
- [ ] Implementare "Short-term Memory" tra task consecutivi.

### 5. Deployment & Stability
- [ ] Migrazione su VPS di produzione.
- [ ] Dockerization completa dello stack.

---

## 📝 Changelog Recente
- **2026-03-30 (Oggi)**:
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

# Creative Director Agent — Pacchetto di installazione

## Struttura

```
agents/
└── creative-director/
    ├── directive.md                        ← SOP e knowledge base del CD
    ├── run.js                              ← Entry point (compare nel menu help)
    ├── prompts/
    │   ├── system.md                       ← System prompt — identità e modalità operative
    │   └── templates/
    │       └── few-shot-examples.md        ← Esempi di output di qualità (Bulgari, BC)
    └── tests/
        └── creative-director.test.js       ← Test suite (6 test)
```

## Differenza rispetto agli altri agenti

Il Creative Director **non legge dati da Scoro** e non chiama API esterne.
È un agente puramente cognitivo — il suo unico strumento è il pensiero creativo profondo.

Non ha bisogno di script in `execution/` — usa direttamente `ai-client.js`.

## Setup

### 1. Copia i file nella root ANIMA
```bash
cp -r agents/creative-director /path/to/anima/agents/
```

### 2. Assicurati che ai-client.js sia presente
```bash
# Deve esistere già se hai installato il CFO agent, altrimenti:
cp execution/utils/ai-client.js /path/to/anima/execution/utils/
```

### 3. Variabili .env necessarie
```bash
# Nessuna variabile aggiuntiva — usa AI_PROVIDER e AI_MODEL già presenti
AI_PROVIDER=anthropic          # Consigliato: Claude per il pensiero creativo
AI_MODEL=claude-sonnet-4-5     # Oppure gemini-2.0-flash per test
```

> **Nota sul modello:** per il Creative Director si raccomanda Claude rispetto a Gemini.
> Il pensiero creativo di alta qualità — con sfumature culturali, riferimenti precisi,
> punto di vista — beneficia della profondità di Claude Sonnet più che della velocità di Flash.

### 4. Installa dipendenze (se non già presenti)
```bash
npm install @anthropic-ai/sdk dotenv
```

### 5. Esegui i test
```bash
node agents/creative-director/tests/creative-director.test.js
```
Output atteso:
```
🎨 Creative Director Agent — Test suite

✅ Test 1 — File essenziali presenti: OK
✅ Test 2 — Brand knowledge e progetti Mirror: OK
✅ Test 3 — Modalità operative nel system prompt: OK
✅ Test 4 — Few-shot examples strutturati: OK
✅ Test 5 — Tag ANIMA e funzionalità multi-turno: OK
✅ Test 6 — Struttura directive completa: OK

📊 Risultati: 6 OK, 0 FAIL
```

### 6. Avvia il Creative Director
```bash
node agents/creative-director/run.js
```
oppure dal menu ANIMA:
```bash
node orchestration/help.js
# → seleziona "Creative Director"
```

---

## Modalità disponibili

| # | Modalità | Quando usarla |
|---|----------|---------------|
| 1 | **Brief Deconstruction** | Hai un brief (anche grezzo) da analizzare |
| 2 | **Concept Development** | Vuoi sviluppare un'idea in profondità |
| 3 | **Brand Thinking** | Vuoi ragionare sulla natura di un brand |
| 4 | **Pitch Preparation** | Stai preparando una gara o presentazione |
| 5 | **Creative Review** | Hai un lavoro da valutare criticamente |
| 6 | **Conversazione libera** | Esplorazione, confronto, domande aperte |

---

## Sessioni multi-turno e salvataggio

Il CD supporta conversazioni multi-turno: dopo la prima risposta puoi continuare
con domande di approfondimento, richiedere variazioni, sviluppare ulteriormente.

Al termine di ogni sessione puoi salvarla come file `.md` in `.tmp/cd-sessions/`.
Utile per:
- Tenere traccia del pensiero creativo per un progetto
- Condividere le direzioni con il team
- Costruire un archivio di brief deconstructions per brand ricorrenti

---

## Come aggiornare la brand knowledge

Quando Mirror acquisisce un nuovo cliente importante, aggiungi la sua sezione in:
`agents/creative-director/prompts/system.md` → sezione "Brand knowledge"

Formato consigliato:
```markdown
### [BRAND]
[Descrizione dell'identità profonda del brand — 4-6 righe]
[Clientela e comunicazione]
[Territori creativi]

Progetti Mirror × [brand] che conosci:
- [lista progetti da Scoro]
```

E aggiorna la versione della direttiva in `directive.md`.

# ANIMA — Autonomous Network for Intelligent Mirror Agency
### Sistema Multi-Agente Zero-Human per Mirror Agency
**Versione:** 1.0.0 | **Classificazione:** Internal · Confidential

---

## Visione

ANIMA è il sistema nervoso di Mirror. Non è un chatbot, non è un assistente. È un'architettura operativa vivente che percepisce, decide e agisce su tutti i reparti dell'agenzia — Finance, Strategy, Creative, Production, HR, Business Development — in modo autonomo, coordinato e scalabile.

Il principio fondante è semplice: **gli LLM decidono, il codice esegue, i dati apprendono.**

Gli errori in un sistema multi-agente si moltiplicano. 90% di accuratezza per 5 step = 59% di successo complessivo. ANIMA risolve questo spingendo tutta la complessità deterministica in script testabili e affidabili, lasciando agli agenti solo il decision-making ad alto valore.

---

## Architettura a 4 Livelli

ANIMA separa le responsabilità in 4 strati distinti:

```
┌─────────────────────────────────────────────────────────────┐
│  LIVELLO 0: DATI & MEMORIA                                  │
│  Knowledge base, stato persistente, context condiviso       │
├─────────────────────────────────────────────────────────────┤
│  LIVELLO 1: DIRETTIVE                                       │
│  SOP in Markdown — cosa fare, quando, con quali vincoli     │
├─────────────────────────────────────────────────────────────┤
│  LIVELLO 2: ORCHESTRAZIONE                                  │
│  Routing intelligente tra agenti, gestione errori, segnali  │
├─────────────────────────────────────────────────────────────┤
│  LIVELLO 3: ESECUZIONE                                      │
│  Script deterministici — API, DB, file, integrazioni esterne│
└─────────────────────────────────────────────────────────────┘
```

### Livello 0 — Dati & Memoria (Substrate)

La fonte di verità del sistema. Senza memoria condivisa, gli agenti sono isole.

- **Vector Store**: embeddings di documenti, email, brief, report passati (Pinecone o Supabase `pgvector`)
- **State DB**: stato corrente di ogni workflow attivo (Supabase PostgreSQL)
- **Shared Context**: profilo cliente, storico progetto, preferenze team — accessibile da ogni agente
- **Audit Log**: ogni azione di ogni agente viene tracciata con timestamp, input, output, agente responsabile

> **Principio Twilio:** ogni agente deve poter riprendere da dove si è fermato un altro. Il contesto non muore mai con la sessione.

### Livello 1 — Direttive (`directives/`)

SOP in Markdown. Sono il "manuale operativo" che ogni agente legge prima di agire.

Una direttiva ben scritta contiene:
- **Obiettivo**: cosa deve essere prodotto
- **Trigger**: quando questo agente si attiva (evento, segnale, schedule)
- **Input attesi**: formato e fonte dei dati in ingresso
- **Tool/Script da usare**: riferimento agli script in `execution/`
- **Output**: formato, destinazione, chi riceve il risultato
- **Casi limite**: errori noti, fallback, escalation verso umano
- **Dipendenze**: da quali agenti dipende, quali agenti attiva dopo

Le direttive sono documenti vivi. Si aggiornano quando il sistema impara qualcosa di nuovo. **Non si sovrascrivono senza consenso esplicito.** Ogni modifica viene loggata.

### Livello 2 — Orchestrazione (`orchestration/`)

Il cervello di ANIMA. L'orchestratore non esegue lavoro diretto: legge direttive, coordina agenti, gestisce segnali e anomalie.

Responsabilità dell'orchestratore:
- Ricevere eventi (trigger da webhook, schedule, input umano)
- Selezionare la direttiva appropriata
- Istanziare l'agente corretto con il contesto giusto
- Passare output da un agente al successivo (handoff)
- Gestire retry, timeout, parallelismo e fallback
- Loggare ogni decisione nell'Audit Log
- Notificare umani solo quando strettamente necessario

**Pattern fondamentale: mai eseguire direttamente. Sempre delegare.**

### Livello 3 — Esecuzione (`execution/`)

Script JavaScript/Node.js deterministici. Affidabili, testabili, versionati.

Ogni script:
- Ha un singolo scopo ben definito
- Legge input da stdin o parametri strutturati
- Scrive output in JSON standardizzato
- Gestisce errori con exit code non-zero e messaggio strutturato
- È commentato per essere comprensibile a qualsiasi agente futuro
- Non ha side effects non dichiarati

Variabili d'ambiente e credenziali vivono in `.env` (mai nel codice).

---

## Agenti di ANIMA

Ogni agente è un'istanza specializzata del sistema, con la propria direttiva, i propri tool e il proprio scope operativo.

### Agenti Core (v1.0)

| Agente | Reparto | Responsabilità principale |
|--------|---------|--------------------------|
| **Operations Manager** | Operations | Briefing giornaliero, aggregazione KPI, report operativo |
| **Strategic Planner** | Strategy | Analisi competitive, ricerca di mercato, scoring opportunità |
| **Creative Director** | Creative | Generazione concept, moodboard brief, naming, copy draft |
| **CFO** | Finance | Monitoraggio margini, alert budget, previsioni cash flow |
| **Account Manager** | Business Dev | Lead research, qualificazione prospect, prep pitch |
| **Project Manager** | Production | Task management, allocazione risorse, detection ritardi |
| **HR Manager** | HR | Sentiment team, analisi carico lavoro, onboarding checklist |

> Ogni agente può essere attivato indipendentemente o come parte di un workflow multi-step orchestrato.

### Anatomia di un Agente

```
agents/
└── operations-manager/
    ├── directive.md          # SOP specifica di questo agente
    ├── prompts/
    │   ├── system.md         # System prompt dell'agente
    │   └── templates/        # Template per output strutturati
    └── tests/
        └── operations-manager.test.js   # Test di validazione output
```

---

## Struttura Directory del Progetto

```
anima/
├── agents/                   # Un agente = una directory
│   ├── operations-manager/
│   ├── strategic-planner/
│   ├── creative-director/
│   ├── cfo/
│   ├── account-manager/
│   ├── project-manager/
│   └── hr-manager/
│
├── orchestration/            # Logica di routing e coordinamento
│   ├── router.js             # Entry point: riceve eventi, smista
│   ├── workflow-engine.js    # Gestisce sequenze multi-agente
│   ├── signal-handler.js     # Segnali inter-agente
│   └── error-handler.js      # Gestione centralizzata errori
│
├── execution/                # Script deterministici condivisi
│   ├── scoro/                # Integrazione Scoro MCP
│   ├── gmail/                # Integrazione Gmail
│   ├── gcal/                 # Integrazione Google Calendar
│   ├── reports/              # Generazione report
│   ├── notifications/        # Slack, email, webhook
│   └── utils/                # Utility condivise
│
├── directives/               # SOP trasversali (non agente-specifiche)
│   ├── error-escalation.md
│   ├── data-quality.md
│   ├── communication-protocol.md
│   └── security-policy.md
│
├── memory/                   # Layer persistenza e contesto
│   ├── schema.sql            # Schema Supabase
│   ├── embeddings/           # Configurazione vector store
│   └── migrations/           # Versioning schema DB
│
├── frontend/                 # Dashboard operativa (Next.js)
│   ├── app/
│   ├── components/
│   └── package.json
│
├── .tmp/                     # File intermedi (non committare)
├── .env                      # Credenziali e variabili d'ambiente
├── .env.example              # Template variabili (senza valori)
├── brand-guidelines.md       # Font e colori Mirror
├── ANIMA.md                  # Questo file
└── CHANGELOG.md              # Storico versioni e apprendimenti
```

---

## Workflow Multi-Agente: Pattern Fondamentali

### Pattern 1: Pipeline Sequenziale

```
Trigger → Agente A → [output A] → Agente B → [output B] → Agente C → Risultato finale
```

Usato per: briefing giornaliero, analisi progetto, report clienti.

Ogni agente riceve l'output del precedente + il contesto condiviso. L'orchestratore gestisce i handoff e blocca la pipeline se un agente fallisce.

### Pattern 2: Fan-Out Parallelo

```
Trigger → Orchestratore → Agente A ─┐
                         → Agente B ─┼→ Merge → Risultato
                         → Agente C ─┘
```

Usato per: ricerca multi-source, analisi competitive, aggregazione KPI da sistemi diversi.

Gli agenti lavorano in parallelo. L'orchestratore attende tutti i risultati prima del merge. Timeout individuale per agente.

### Pattern 3: Event-Driven con Segnali

```
Agente A in esecuzione → scopre anomalia → emette segnale → Agente B si attiva
```

Usato per: alert budget, ritardi progetto, opportunità commerciali urgenti.

I segnali sono tipizzati e strutturati. L'orchestratore mantiene un registro dei segnali attivi.

### Pattern 4: Loop di Apprendimento

```
Agente esegue → fallisce o trova limite → aggiorna direttiva → testa di nuovo → sistema più forte
```

Questo è il pattern più importante. Ogni errore è un'opportunità di miglioramento sistemico.

---

## Principi Operativi

### 1. Controlla prima i tool esistenti

Prima di scrivere un nuovo script, l'orchestratore verifica `execution/` secondo la direttiva attiva. Script nuovi si creano solo se non ne esistono di equivalenti.

### 2. Auto-correzione sistematica

Quando qualcosa si rompe:

1. Leggi il messaggio di errore e lo stack trace
2. Identifica se è un errore di script (deterministico → fix immediato) o di prompt (probabilistico → aggiorna system prompt e testa)
3. Correggi e testa (senza consumare risorse a pagamento se non necessario — chiedi prima)
4. Aggiorna la direttiva con il nuovo vincolo scoperto
5. Logga l'evento in CHANGELOG.md

### 3. Memoria condivisa obbligatoria

Nessun agente lavora in isolamento. Prima di eseguire, ogni agente:
- Legge il contesto condiviso rilevante dal DB
- Dopo l'esecuzione, scrive i propri output nel DB
- Questo rende ogni interazione un dato persistente e interrogabile

### 4. Escalation umana come ultima risorsa

ANIMA scala verso un umano solo quando:
- L'incertezza sull'azione supera una soglia definita nella direttiva
- L'azione ha impatto finanziario o reputazionale sopra una certa soglia
- Si verifica un errore non gestito dopo 3 retry
- Un segnale di tipo `CRITICAL` viene emesso

L'escalation include sempre: contesto completo, opzioni raccomandate, azione suggerita. Mai un semplice "c'è un problema".

### 5. Auditabilità totale

Ogni azione di ogni agente è tracciata nell'Audit Log con:
- `timestamp`
- `agent_id`
- `directive_version`
- `input_hash` (non i dati grezzi se sensibili)
- `output_summary`
- `duration_ms`
- `status` (success | retry | failed | escalated)

---

## Standard di Sviluppo

### Script di Esecuzione

```javascript
// execution/scoro/get-project-status.js
// Scopo: recupera stato attuale di un progetto da Scoro
// Input: { projectId: string }
// Output: { id, name, status, budget_used, budget_total, overdue_tasks }
// Errori: PROJECT_NOT_FOUND, SCORO_API_UNAVAILABLE

const { scoroClient } = require('../utils/scoro-client');

async function getProjectStatus(input) {
  const { projectId } = input;
  
  if (!projectId) {
    throw new Error('PROJECT_ID_REQUIRED');
  }
  
  try {
    const project = await scoroClient.getProject(projectId);
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      budget_used: project.budget_used,
      budget_total: project.budget_total,
      overdue_tasks: project.tasks.filter(t => t.is_overdue).length
    };
  } catch (err) {
    if (err.code === 404) throw new Error('PROJECT_NOT_FOUND');
    throw new Error(`SCORO_API_UNAVAILABLE: ${err.message}`);
  }
}

module.exports = { getProjectStatus };
```

### Output Strutturato degli Agenti

Ogni agente produce output in formato JSON standardizzato:

```json
{
  "agent_id": "operations-manager",
  "directive_version": "1.2.0",
  "timestamp": "2026-03-27T08:00:00Z",
  "status": "success",
  "output": {
    "summary": "...",
    "data": {},
    "signals": [],
    "next_agents": ["athena"]
  },
  "metadata": {
    "duration_ms": 1240,
    "tokens_used": 890,
    "sources": ["scoro", "gmail"]
  }
}
```

### Stack Tecnologico

| Layer | Tecnologia | Scopo |
|-------|-----------|-------|
| Frontend | Next.js + React + Tailwind + Framer Motion | Dashboard operativa |
| Backend | Node.js + Next.js API Routes | Orchestratore e API |
| Database | Supabase (PostgreSQL) | State, audit log, contesto |
| Vector Store | Supabase pgvector | Memoria semantica |
| AI | Provider configurabile (vedi sotto) | Tutti gli agenti |
| Integrazioni | Scoro MCP, Gmail MCP, Google Calendar MCP | Dati agenzia |
| Scheduling | Cron / Supabase Edge Functions | Trigger temporali |
| Notifiche | Slack Webhook + Email | Escalation umana |

### Provider LLM Supportati

ANIMA usa un client AI unificato (`execution/utils/ai-client.js`) che astrae il provider sottostante. Cambiare modello significa cambiare due righe in `.env` — nessuna modifica agli agenti o agli script.

| Provider | Modello consigliato | Costo | Limite free |
|----------|-------------------|-------|-------------|
| **Google Gemini** | `gemini-2.0-flash` | Gratuito | 1500 req/giorno |
| **Google Gemini** | `gemini-2.0-flash-thinking` | Gratuito | 150 req/giorno |
| **Anthropic** | `claude-sonnet-4-5` | A pagamento | — |
| **OpenAI** | `gpt-4o-mini` | A pagamento | — |

> **Per i test usa `gemini-2.0-flash`** — è gratuito, veloce e più che sufficiente per sviluppo e validazione dei workflow. Passa a Claude Sonnet quando vai in produzione.

### Client AI Unificato: `execution/utils/ai-client.js`

```javascript
// execution/utils/ai-client.js
// Scopo: client AI unificato — cambia provider senza toccare gli agenti
// Provider supportati: gemini, anthropic, openai
// Configurazione: AI_PROVIDER e AI_MODEL in .env

require('dotenv').config();

const PROVIDER = process.env.AI_PROVIDER || 'gemini';
const MODEL    = process.env.AI_MODEL    || 'gemini-2.0-flash';

async function chat({ system, messages, maxTokens = 1000 }) {

  // ── Google Gemini ──────────────────────────────────────────────────
  if (PROVIDER === 'gemini') {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: system || '',
    });

    // Converte il formato messaggi ANIMA → formato Gemini
    const history = messages.slice(0, -1).map(m => ({
      role:  m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const lastMessage = messages[messages.length - 1].content;

    const chatSession = model.startChat({ history });
    const result      = await chatSession.sendMessage(lastMessage);
    return result.response.text();
  }

  // ── Anthropic Claude ───────────────────────────────────────────────
  if (PROVIDER === 'anthropic') {
    const Anthropic = require('@anthropic-ai/sdk');
    const client    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response  = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system:     system || '',
      messages,
    });
    return response.content[0].text;
  }

  // ── OpenAI ─────────────────────────────────────────────────────────
  if (PROVIDER === 'openai') {
    const OpenAI = require('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const msgs   = system
      ? [{ role: 'system', content: system }, ...messages]
      : messages;
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: maxTokens,
      messages: msgs,
    });
    return response.choices[0].message.content;
  }

  throw new Error(`Provider AI non supportato: ${PROVIDER}`);
}

module.exports = { chat };
```

**Utilizzo negli script degli agenti:**

```javascript
const { chat } = require('../utils/ai-client');

const risposta = await chat({
  system:   'Sei il Project Manager di Mirror Agency...',
  messages: [{ role: 'user', content: 'Analizza i task in ritardo.' }],
});
```

**Installazione dipendenze per Gemini:**

```bash
npm install @google/generative-ai dotenv
```

**Ottenere la API key gratuita di Gemini:**
1. Vai su [aistudio.google.com](https://aistudio.google.com)
2. Clicca "Get API key" → "Create API key"
3. Copia la chiave e incollala in `.env`

---

### Variabili d'Ambiente Richieste

```bash
# AI — Provider attivo (gemini | anthropic | openai)
AI_PROVIDER=gemini
AI_MODEL=gemini-2.0-flash

# Gemini (gratuito — per sviluppo e test)
GEMINI_API_KEY=

# Anthropic (produzione — opzionale)
ANTHROPIC_API_KEY=

# OpenAI (opzionale)
OPENAI_API_KEY=

# Database
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# Integrazioni Mirror
SCORO_MCP_URL=https://mirror.scoro.com/mcp
GMAIL_MCP_URL=https://gmail.mcp.claude.com/mcp
GCAL_MCP_URL=https://gcal.mcp.claude.com/mcp

# Notifiche
SLACK_WEBHOOK_URL=
NOTIFICATION_EMAIL=

# Configurazione
ANIMA_ENV=development         # development | staging | production
ESCALATION_THRESHOLD=0.85     # Soglia incertezza per escalation umana
BUDGET_ALERT_THRESHOLD=0.80   # Alert quando budget progetto > 80%
MAX_AGENT_RETRIES=3
AGENT_TIMEOUT_MS=30000
```

---

## Governance e Sicurezza

### Regole di Modifica

| Tipo di modifica | Chi può fare | Processo |
|-----------------|-------------|---------|
| Fix bug script | Orchestratore autonomo | Fix → test → log in CHANGELOG |
| Aggiornamento direttiva | Orchestratore + notifica umano | Proposta → approvazione → merge |
| Nuova direttiva | Solo umano | Review obbligatoria |
| Nuovo agente | Solo umano | Design review + test isolato |
| Accesso a nuove API esterne | Solo umano | Security review |

---

## Roadmap di Sviluppo

### Fase 1 — Foundation (Settimane 1-4)
- [ ] Setup infrastruttura (Supabase, schema DB, Audit Log)
- [ ] Agente **Operations Manager**: briefing giornaliero da Scoro + Gmail
- [ ] Dashboard minimale per visualizzare output agenti
- [ ] Sistema di notifiche base (Slack)

### Fase 2 — Core Agents (Settimane 5-10)
- [ ] Agente **Project Manager**: production tracking e alert ritardi
- [ ] Agente **CFO**: monitoraggio budget e cash flow
- [ ] Orchestratore con pipeline sequenziale
- [ ] Memory layer con contesto condiviso

### Fase 3 — Intelligence (Settimane 11-16)
- [ ] Agente **Strategic Planner**: analisi competitive e research
- [ ] Agente **Account Manager**: lead qualification automatica
- [ ] Fan-out parallelo e merge risultati
- [ ] Vector store per memoria semantica

### Fase 4 — Scale (Settimane 17+)
- [ ] Agente **Creative Director**: supporto creativo
- [ ] Agente **HR Manager**: sentiment e carico lavoro
- [ ] Loop di apprendimento automatico dalle direttive
- [ ] API pubblica per integrazioni esterne
- [ ] Multi-tenancy (se ANIMA diventa prodotto)

---

## Aggiungere un Nuovo Agente

ANIMA include un sistema guidato per creare nuovi agenti in modo strutturato e consistente. Non è necessario creare file manualmente: basta eseguire il comando `add-agent` e il sistema genera tutto lo scaffolding necessario.

### Comando

```bash
node orchestration/add-agent.js
```

Il comando avvia un prompt interattivo a step. Al termine, genera automaticamente l'intera struttura dell'agente e aggiorna ANIMA.md.

### Script: `orchestration/add-agent.js`

```javascript
// orchestration/add-agent.js
// Scopo: scaffolding guidato per aggiungere un nuovo agente ad ANIMA
// Uso: node orchestration/add-agent.js
// Output: directory agents/<slug>/ completa + aggiornamento ANIMA.md

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║     ANIMA — Aggiungi Nuovo Agente    ║');
  console.log('╚══════════════════════════════════════╝\n');

  // ── Step 1: Identità ──────────────────────────────────────────────
  console.log('[ 1 / 5 ] IDENTITÀ\n');
  const name       = await ask('  Nome del ruolo (es. "SEO Specialist"):         ');
  const department = await ask('  Reparto (es. Marketing, Finance, Creative...): ');
  const slug       = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // ── Step 2: Responsabilità ────────────────────────────────────────
  console.log('\n[ 2 / 5 ] RESPONSABILITÀ\n');
  const responsibility = await ask('  Descrivi la responsabilità principale (1 riga): ');
  const goal           = await ask('  Obiettivo concreto che produce (es. "Report SEO settimanale"): ');

  // ── Step 3: Trigger e dipendenze ─────────────────────────────────
  console.log('\n[ 3 / 5 ] TRIGGER E DIPENDENZE\n');
  console.log('  Tipi di trigger disponibili:');
  console.log('  1. schedule   — si attiva a orario fisso (es. ogni lunedì 09:00)');
  console.log('  2. signal     — si attiva quando un altro agente emette un segnale');
  console.log('  3. manual     — si attiva su richiesta esplicita');
  console.log('  4. event      — si attiva al verificarsi di un evento esterno\n');
  const triggerType   = await ask('  Tipo di trigger [1-4]: ');
  const triggerDetail = await ask('  Dettaglio trigger (es. "ogni lunedì 09:00" oppure "dopo Project Manager"): ');
  const dependsOn     = await ask('  Dipende dall\'output di quale agente? (lascia vuoto se nessuno): ');
  const activates     = await ask('  Attiva quale agente dopo di sé? (lascia vuoto se nessuno): ');

  // ── Step 4: Integrazioni ──────────────────────────────────────────
  console.log('\n[ 4 / 5 ] INTEGRAZIONI\n');
  console.log('  Integrazioni disponibili: scoro, gmail, gcal, slack, supabase, anthropic, web-search, custom\n');
  const integrationsRaw = await ask('  Quali integrazioni usa? (separale con virgola): ');
  const integrations    = integrationsRaw.split(',').map(s => s.trim()).filter(Boolean);

  // ── Step 5: Soglia di escalation ─────────────────────────────────
  console.log('\n[ 5 / 5 ] COMPORTAMENTO\n');
  const escalation   = await ask('  Soglia escalation umana [0.0–1.0, default 0.85]: ') || '0.85';
  const outputFormat = await ask('  Formato output principale (es. "JSON", "Slack message", "PDF report"): ');

  rl.close();

  // ── Generazione file ──────────────────────────────────────────────
  const triggerLabels = { '1': 'schedule', '2': 'signal', '3': 'manual', '4': 'event' };
  const triggerLabel  = triggerLabels[triggerType] || 'manual';
  const agentDir      = path.join(__dirname, '..', 'agents', slug);

  console.log(`\n⏳ Creo la struttura per "${name}"...\n`);

  fs.mkdirSync(path.join(agentDir, 'prompts', 'templates'), { recursive: true });
  fs.mkdirSync(path.join(agentDir, 'tests'), { recursive: true });

  // directive.md
  fs.writeFileSync(path.join(agentDir, 'directive.md'), `# Direttiva — ${name}
**Versione:** 1.0.0 | **Reparto:** ${department} | **Creato:** ${new Date().toISOString().split('T')[0]}

## Obiettivo
${goal}

## Responsabilità
${responsibility}

## Trigger
- **Tipo:** ${triggerLabel}
- **Dettaglio:** ${triggerDetail}

## Input Attesi
<!-- Descrivi il formato e la fonte dei dati in ingresso -->
- Fonte: ${dependsOn || 'nessuna dipendenza diretta'}
- Formato: JSON strutturato con campi da definire

## Tool e Script da Usare
<!-- Elenca gli script in execution/ che questo agente deve chiamare -->
${integrations.map(i => `- \`execution/${i}/\``).join('\n')}

## Output
- **Formato:** ${outputFormat}
- **Destinazione:** ${activates ? `Agente successivo: ${activates}` : 'Destinatario finale — definire'}

## Dipendenze
- **Dipende da:** ${dependsOn || 'nessuno'}
- **Attiva:** ${activates || 'nessuno'}

## Soglia Escalation
${escalation} — scala a un umano se l'incertezza supera questa soglia

## Casi Limite
<!-- Da compilare man mano che il sistema impara -->
- [ ] Dati in ingresso mancanti o malformati
- [ ] Integrazione non disponibile
- [ ] Timeout superato (default: 30s)

## Changelog Direttiva
\`\`\`
v1.0.0 — ${new Date().toISOString().split('T')[0]}
  - Direttiva creata con add-agent
\`\`\`
`);

  // prompts/system.md
  fs.writeFileSync(path.join(agentDir, 'prompts', 'system.md'), `# System Prompt — ${name}

Sei il **${name}** di Mirror Agency, un'agenzia creativa con uffici a Firenze, Milano e Parigi.

## Il tuo ruolo
${responsibility}

## Il tuo obiettivo
${goal}

## Come operi
- Leggi sempre la tua direttiva in \`directive.md\` prima di agire
- Non eseguire operazioni direttamente: usa gli script in \`execution/\`
- Produci output in formato ${outputFormat}
- Se l'incertezza supera ${escalation}, scala a un umano con contesto completo e opzioni raccomandate
- Ogni azione viene loggata nell'Audit Log

## Integrazioni disponibili
${integrations.map(i => `- ${i}`).join('\n')}

## Formato output
Rispondi sempre con un JSON strutturato secondo lo schema standard ANIMA:
\`\`\`json
{
  "agent_id": "${slug}",
  "directive_version": "1.0.0",
  "timestamp": "<ISO 8601>",
  "status": "success | failed | escalated",
  "output": {
    "summary": "...",
    "data": {},
    "signals": []
  },
  "metadata": {
    "duration_ms": 0,
    "sources": ${JSON.stringify(integrations)}
  }
}
\`\`\`
`);

  // tests/agent.test.js
  fs.writeFileSync(path.join(agentDir, 'tests', `${slug}.test.js`), `// Test — ${name}
// Valida che l'agente produca output conformi allo schema ANIMA

const assert = require('assert');

const REQUIRED_FIELDS = ['agent_id', 'directive_version', 'timestamp', 'status', 'output', 'metadata'];

function validateOutput(output) {
  for (const field of REQUIRED_FIELDS) {
    assert(field in output, \`Campo mancante: \${field}\`);
  }
  assert(['success', 'failed', 'escalated'].includes(output.status), 'Status non valido');
  assert(typeof output.output.summary === 'string', 'Summary deve essere una stringa');
  console.log(\`✅ ${name}: output valido\`);
}

// Esempio di output atteso — personalizzare con dati reali
const mockOutput = {
  agent_id: '${slug}',
  directive_version: '1.0.0',
  timestamp: new Date().toISOString(),
  status: 'success',
  output: { summary: 'Test output', data: {}, signals: [] },
  metadata: { duration_ms: 100, sources: ${JSON.stringify(integrations)} }
};

validateOutput(mockOutput);
`);

  console.log(`✅ agents/${slug}/directive.md`);
  console.log(`✅ agents/${slug}/prompts/system.md`);
  console.log(`✅ agents/${slug}/tests/${slug}.test.js`);

  // ── Aggiornamento ANIMA.md ────────────────────────────────────────
  const animaPath  = path.join(__dirname, '..', 'ANIMA.md');
  let   animaContent = fs.readFileSync(animaPath, 'utf8');

  // Aggiunge riga nella tabella agenti
  const tableRow   = `| **${name}** | ${department} | ${responsibility} |`;
  animaContent     = animaContent.replace(
    '> Ogni agente può essere attivato indipendentemente',
    `${tableRow}\n\n> Ogni agente può essere attivato indipendentemente`
  );

  // Aggiunge entry nel CHANGELOG
  const changelogEntry = `v1.x.x — ${new Date().toISOString().split('T')[0]}\n  - Aggiunto agente: ${name} (${department})\n`;
  animaContent = animaContent.replace('```\nv1.0.0', `\`\`\`\n${changelogEntry}\nv1.0.0`);

  fs.writeFileSync(animaPath, animaContent);
  console.log(`✅ ANIMA.md aggiornato (tabella agenti + changelog)\n`);

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log(`║  Agente "${name}" creato con successo!`);
  console.log(`║  Directory: agents/${slug}/`);
  console.log('║');
  console.log('║  Prossimi step:');
  console.log('║  1. Completa directive.md con input/output dettagliati');
  console.log('║  2. Personalizza prompts/system.md con il contesto specifico');
  console.log(`║  3. Aggiungi gli script necessari in execution/${integrations[0] || 'custom'}/`);
  console.log(`║  4. Esegui i test: node agents/${slug}/tests/${slug}.test.js`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

main().catch(err => {
  console.error('Errore durante la creazione dell\'agente:', err.message);
  process.exit(1);
});
```

### Cosa genera il comando

Per ogni nuovo agente, `add-agent` crea automaticamente:

```
agents/<slug>/
├── directive.md          # SOP pre-compilata con tutti i campi richiesti
├── prompts/
│   └── system.md         # System prompt con identità, ruolo e formato output
└── tests/
    └── <slug>.test.js    # Test di validazione schema output ANIMA
```

E aggiorna automaticamente:
- **Tabella agenti** in ANIMA.md — il nuovo agente appare subito nella lista
- **CHANGELOG** in ANIMA.md — viene registrata la data di creazione

### Cosa resta da fare manualmente dopo il comando

Lo scaffolding automatico copre la struttura. Questi campi richiedono invece una revisione umana prima che l'agente vada in produzione:

| File | Campo | Perché manuale |
|------|-------|---------------|
| `directive.md` | Input attesi (schema dettagliato) | Dipende dai dati reali disponibili |
| `directive.md` | Script esatti in `execution/` | Va verificato cosa esiste già |
| `directive.md` | Casi limite specifici | Si scoprono in produzione |
| `prompts/system.md` | Esempi few-shot | Migliorano l'output qualitativo |
| `tests/<slug>.test.js` | Mock data realistici | Richiedono dati di esempio reali |

---

## Rimuovere un Agente

Il comando `remove-agent` elimina un agente in modo sicuro e guidato. Prima di cancellare qualsiasi file, mostra un riepilogo completo di tutto ciò che verrà rimosso e chiede conferma esplicita. Aggiorna automaticamente ANIMA.md e archivia i file in `.tmp/archived-agents/` invece di cancellarli definitivamente.

### Comando

```bash
node orchestration/remove-agent.js
```

### Script: `orchestration/remove-agent.js`

```javascript
// orchestration/remove-agent.js
// Scopo: rimozione guidata e sicura di un agente da ANIMA
// Uso: node orchestration/remove-agent.js
// Output: agente archiviato in .tmp/archived-agents/<slug>/ + aggiornamento ANIMA.md

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║     ANIMA — Rimuovi Agente           ║');
  console.log('╚══════════════════════════════════════╝\n');

  // ── Lista agenti esistenti ────────────────────────────────────────
  const agentsDir = path.join(__dirname, '..', 'agents');
  const existing  = fs.readdirSync(agentsDir).filter(f =>
    fs.statSync(path.join(agentsDir, f)).isDirectory()
  );

  if (existing.length === 0) {
    console.log('  Nessun agente trovato in agents/. Nulla da rimuovere.\n');
    rl.close();
    return;
  }

  console.log('  Agenti disponibili:\n');
  existing.forEach((slug, i) => {
    const directivePath = path.join(agentsDir, slug, 'directive.md');
    let label = slug;
    if (fs.existsSync(directivePath)) {
      const firstLine = fs.readFileSync(directivePath, 'utf8').split('\n')[0];
      label = firstLine.replace('# Direttiva — ', '').trim() || slug;
    }
    console.log(`  ${i + 1}. ${label} (${slug})`);
  });

  // ── Step 1: Selezione ─────────────────────────────────────────────
  console.log('\n[ 1 / 3 ] SELEZIONE\n');
  const input = await ask('  Numero o slug dell\'agente da rimuovere: ');
  const index = parseInt(input, 10);
  const slug  = isNaN(index) ? input.trim() : existing[index - 1];

  if (!slug || !existing.includes(slug)) {
    console.error(`\n  ❌ Agente "${input}" non trovato.\n`);
    rl.close();
    process.exit(1);
  }

  const agentDir      = path.join(agentsDir, slug);
  const directivePath = path.join(agentDir, 'directive.md');
  let   agentName     = slug;

  if (fs.existsSync(directivePath)) {
    const firstLine = fs.readFileSync(directivePath, 'utf8').split('\n')[0];
    agentName = firstLine.replace('# Direttiva — ', '').trim() || slug;
  }

  // ── Step 2: Riepilogo e dipendenze ───────────────────────────────
  console.log('\n[ 2 / 3 ] RIEPILOGO\n');
  console.log(`  Agente selezionato: ${agentName} (${slug})`);
  console.log(`  Directory:          agents/${slug}/\n`);

  // Legge dipendenze dalla direttiva
  if (fs.existsSync(directivePath)) {
    const content   = fs.readFileSync(directivePath, 'utf8');
    const dependsOn = (content.match(/\*\*Dipende da:\*\* (.+)/) || [])[1];
    const activates = (content.match(/\*\*Attiva:\*\* (.+)/) || [])[1];

    if (dependsOn && dependsOn !== 'nessuno') {
      console.log(`  ⚠️  Dipende da:  ${dependsOn}`);
    }
    if (activates && activates !== 'nessuno') {
      console.log(`  ⚠️  Attiva:      ${activates}`);
      console.log(`     → Verifica che ${activates} abbia un trigger alternativo dopo la rimozione.`);
    }
  }

  // Lista file che verranno archiviati
  const files = [];
  function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
      const full = path.join(dir, f);
      fs.statSync(full).isDirectory() ? walk(full) : files.push(full.replace(agentsDir + path.sep, ''));
    });
  }
  walk(agentDir);

  console.log(`\n  File che verranno archiviati in .tmp/archived-agents/${slug}/:\n`);
  files.forEach(f => console.log(`    - ${f}`));
  console.log(`\n  ANIMA.md verrà aggiornato: riga agente rimossa, CHANGELOG aggiornato.\n`);

  // ── Step 3: Conferma doppia ───────────────────────────────────────
  console.log('[ 3 / 3 ] CONFERMA\n');
  const confirm1 = await ask(`  Sei sicuro di voler rimuovere "${agentName}"? [s/N]: `);
  if (confirm1.toLowerCase() !== 's') {
    console.log('\n  Operazione annullata. Nessun file modificato.\n');
    rl.close();
    return;
  }

  const confirm2 = await ask(`  Conferma definitiva — digita lo slug "${slug}" per procedere: `);
  if (confirm2.trim() !== slug) {
    console.log('\n  Slug non corrispondente. Operazione annullata.\n');
    rl.close();
    return;
  }

  rl.close();

  // ── Archiviazione (non eliminazione) ─────────────────────────────
  const archiveDir = path.join(__dirname, '..', '.tmp', 'archived-agents', slug);
  fs.mkdirSync(archiveDir, { recursive: true });

  function copyRecursive(src, dest) {
    if (fs.statSync(src).isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      fs.readdirSync(src).forEach(f => copyRecursive(path.join(src, f), path.join(dest, f)));
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  copyRecursive(agentDir, archiveDir);
  fs.rmSync(agentDir, { recursive: true, force: true });
  console.log(`\n  ✅ agents/${slug}/ archiviato in .tmp/archived-agents/${slug}/`);

  // ── Aggiornamento ANIMA.md ────────────────────────────────────────
  const animaPath    = path.join(__dirname, '..', 'ANIMA.md');
  let   animaContent = fs.readFileSync(animaPath, 'utf8');

  // Rimuove riga dalla tabella agenti (cerca il nome dell'agente in grassetto)
  const tableRowRegex = new RegExp(`\\| \\*\\*${agentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*\\*.*\\n`, 'g');
  animaContent = animaContent.replace(tableRowRegex, '');

  // Rimuove riga dalla struttura directory
  const dirLineRegex = new RegExp(`.*├── ${slug}/.*\\n`, 'g');
  animaContent = animaContent.replace(dirLineRegex, '');
  const dirLineLastRegex = new RegExp(`.*└── ${slug}/.*\\n`, 'g');
  animaContent = animaContent.replace(dirLineLastRegex, '');

  // Aggiunge entry nel CHANGELOG
  const changelogEntry = `v1.x.x — ${new Date().toISOString().split('T')[0]}\n  - Rimosso agente: ${agentName} (${slug}) — archiviato in .tmp/archived-agents/${slug}/\n\n`;
  animaContent = animaContent.replace(/^```\nv/m, `\`\`\`\n${changelogEntry}v`);

  fs.writeFileSync(animaPath, animaContent);
  console.log(`  ✅ ANIMA.md aggiornato (tabella agenti + changelog)\n`);

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  Agente "${agentName}" rimosso con successo.`);
  console.log('║');
  console.log(`║  I file sono in: .tmp/archived-agents/${slug}/`);
  console.log('║  Puoi recuperarli copiando la directory in agents/ se necessario.');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

main().catch(err => {
  console.error('Errore durante la rimozione dell\'agente:', err.message);
  process.exit(1);
});
```

### Come funziona il comando

Il flusso è in 3 step:

**Step 1 — Selezione:** mostra la lista di tutti gli agenti esistenti con nome leggibile. Puoi selezionare per numero o per slug.

**Step 2 — Riepilogo:** prima di toccare qualsiasi file, mostra esattamente cosa verrà rimosso, le dipendenze da e verso altri agenti (con avvisi se altri agenti potrebbero rompersi), e la lista completa dei file che verranno archiviati.

**Step 3 — Conferma doppia:** prima una conferma `s/N`, poi una conferma definitiva digitando lo slug per esteso. Impedisce cancellazioni accidentali.

### Comportamento di sicurezza

I file non vengono mai cancellati definitivamente. Vengono spostati in `.tmp/archived-agents/<slug>/` e possono essere ripristinati in qualsiasi momento copiando la directory in `agents/`.

| Azione | Automatica |
|--------|-----------|
| Archiviazione in `.tmp/archived-agents/` | ✅ |
| Rimozione riga dalla tabella agenti in ANIMA.md | ✅ |
| Aggiornamento CHANGELOG in ANIMA.md | ✅ |
| Avviso dipendenze verso altri agenti | ✅ |
| Cancellazione definitiva dei file | ❌ mai |

---

## Help — Lista Comandi

Il comando `help` mostra un menu interattivo con tutti i comandi disponibili. Il menu è **auto-discovery**: legge dinamicamente tutti i file in `orchestration/` e costruisce la lista da solo. Aggiungere un nuovo script è sufficiente — nessuna registrazione manuale necessaria.

### Comando

```bash
node orchestration/help.js
```

### Convenzione header obbligatoria

Per essere rilevato automaticamente dal menu, ogni script in `orchestration/` deve avere le prime righe in questo formato:

```javascript
// @anima-command
// @label:       Etichetta visibile nel menu
// @description: Descrizione breve di cosa fa il comando
// @order:       2
```

- `@anima-command` — tag obbligatorio: senza questo tag lo script viene ignorato dal menu (utile per file di utilità interni come `router.js`)
- `@label` — nome leggibile mostrato nel menu
- `@description` — descrizione breve mostrata a fianco
- `@order` — ordine di apparizione nel menu (opzionale, default: alfabetico)

### Script: `orchestration/help.js`

```javascript
// @anima-command
// @label:       Help
// @description: Mostra il menu dei comandi disponibili
// @order:       99

const readline = require('readline');
const fs       = require('fs');
const path     = require('path');
const { execSync } = require('child_process');

const rl  = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

// ── Auto-discovery: legge tutti gli script in orchestration/ ─────────────────
function discoverCommands() {
  const orchDir  = __dirname;
  const commands = [];

  fs.readdirSync(orchDir)
    .filter(f => f.endsWith('.js') && f !== 'help.js')
    .forEach(file => {
      const fullPath = path.join(orchDir, file);
      // Legge solo le prime 10 righe per performance
      const header = fs.readFileSync(fullPath, 'utf8').split('\n').slice(0, 10).join('\n');

      // Scarta file senza il tag @anima-command
      if (!header.includes('@anima-command')) return;

      const label       = (header.match(/@label:\s*(.+)/)       || [])[1]?.trim() || file.replace('.js', '');
      const description = (header.match(/@description:\s*(.+)/) || [])[1]?.trim() || '—';
      const order       = parseInt((header.match(/@order:\s*(\d+)/) || [])[1]) || 50;

      commands.push({ label, description, order, script: fullPath });
    });

  // Ordina per @order, poi alfabetico per label
  return commands.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}

// ── Lista agenti attivi ───────────────────────────────────────────────────────
function listAgents() {
  const agentsDir = path.join(__dirname, '..', 'agents');

  if (!fs.existsSync(agentsDir)) {
    console.log('\n  Nessun agente trovato.\n');
    return;
  }

  const agents = fs.readdirSync(agentsDir)
    .filter(f => fs.statSync(path.join(agentsDir, f)).isDirectory());

  if (agents.length === 0) {
    console.log('\n  Nessun agente attivo al momento.\n');
    return;
  }

  console.log('\n  Agenti attivi:\n');
  console.log('  ┌─────────────────────────────┬──────────────────┬─────────────────────────────────────────┐');
  console.log('  │ Nome                        │ Reparto          │ Responsabilità                          │');
  console.log('  ├─────────────────────────────┼──────────────────┼─────────────────────────────────────────┤');

  agents.forEach(slug => {
    const directivePath = path.join(agentsDir, slug, 'directive.md');
    let name = slug, department = '—', responsibility = '—';

    if (fs.existsSync(directivePath)) {
      const content = fs.readFileSync(directivePath, 'utf8');
      const nameLine = content.match(/^# Direttiva — (.+)/m);
      const deptLine = content.match(/\*\*Reparto:\*\* (.+)/);
      const respLine = content.match(/\n## Responsabilità\n(.+)/);
      if (nameLine) name           = nameLine[1].trim();
      if (deptLine) department     = deptLine[1].trim();
      if (respLine) responsibility = respLine[1].trim();
    }

    const col1 = name.substring(0, 27).padEnd(27);
    const col2 = department.substring(0, 16).padEnd(16);
    const col3 = responsibility.substring(0, 39).padEnd(39);
    console.log(`  │ ${col1} │ ${col2} │ ${col3} │`);
  });

  console.log('  └─────────────────────────────┴──────────────────┴─────────────────────────────────────────┘');
  console.log(`\n  Totale: ${agents.length} agente${agents.length !== 1 ? 'i' : ''} attivo${agents.length !== 1 ? 'i' : ''}.\n`);
}

// ── UI ────────────────────────────────────────────────────────────────────────
function printHeader() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              ANIMA — Pannello di Controllo                  ║');
  console.log('║     Autonomous Network for Intelligent Mirror Agency        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

function printMenu(commands) {
  console.log('  Comandi disponibili:\n');

  // Aggiunge "Lista agenti" come voce sempre presente (inline, non è uno script)
  const allEntries = [
    ...commands,
    { label: 'Lista agenti', description: 'Mostra tutti gli agenti attivi con reparto e responsabilità', script: null },
  ];

  allEntries.forEach((cmd, i) => {
    const num   = String(i + 1).padStart(2);
    const label = cmd.label.padEnd(22);
    console.log(`  ${num}.  ${label} — ${cmd.description}`);
  });

  console.log('\n   0.  Esci\n');
  return allEntries;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  printHeader();

  const discovered = discoverCommands();

  if (discovered.length === 0) {
    console.log('  ⚠️  Nessun comando trovato in orchestration/.');
    console.log('  Assicurati che gli script abbiano il tag @anima-command nell\'header.\n');
    rl.close();
    return;
  }

  const allEntries = printMenu(discovered);
  const input      = await ask(`  Seleziona un comando [1-${allEntries.length}] o 0 per uscire: `);
  const index      = parseInt(input, 10);
  rl.close();

  if (input === '0' || isNaN(index)) {
    console.log('\n  Uscita. Ciao!\n');
    return;
  }

  const selected = allEntries[index - 1];

  if (!selected) {
    console.log('\n  ❌ Selezione non valida.\n');
    process.exit(1);
  }

  console.log(`\n  → Avvio: ${selected.label}\n`);

  // Voce inline (Lista agenti)
  if (!selected.script) {
    listAgents();
    return;
  }

  // Lancia lo script scoperto
  try {
    execSync(`node "${selected.script}"`, { stdio: 'inherit' });
  } catch (err) {
    process.exit(err.status || 1);
  }
}

main().catch(err => {
  console.error('Errore nel menu help:', err.message);
  process.exit(1);
});
```

### Come funziona l'auto-discovery

All'avvio, `help.js` scansiona tutti i file `.js` in `orchestration/`, legge le prime 10 righe di ciascuno e cerca il tag `@anima-command`. Chi non ha il tag viene ignorato — utile per tenere fuori dal menu i file interni come `router.js`, `error-handler.js` o utility generiche.

```
orchestration/
├── help.js              → @anima-command  ✅ appare nel menu
├── add-agent.js         → @anima-command  ✅ appare nel menu
├── remove-agent.js      → @anima-command  ✅ appare nel menu
├── router.js            → (nessun tag)    ❌ ignorato
├── workflow-engine.js   → (nessun tag)    ❌ ignorato
└── signal-handler.js    → (nessun tag)    ❌ ignorato
```

### Aggiungere un nuovo comando al menu

Crea il file in `orchestration/` con l'header corretto — il menu lo rileva automaticamente al prossimo avvio:

```javascript
// orchestration/nuovo-script.js
// @anima-command
// @label:       Nome visibile nel menu
// @description: Cosa fa questo comando
// @order:       5

// ... resto dello script
```

Nessuna modifica a `help.js` o ad altri file. Zero configurazione manuale.

---

## CHANGELOG

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

---

*ANIMA è progettato per crescere. Ogni agente aggiunto, ogni direttiva migliorata, ogni errore corretto rende il sistema più forte. Non è un progetto con una fine — è un'infrastruttura operativa vivente.*

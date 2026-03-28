// @anima-command
// @label:       Aggiungi Agente
// @description: Scaffolding guidato per aggiungere un nuovo agente ad ANIMA
// @order:       1

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
  if (fs.existsSync(animaPath)) {
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
  }

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

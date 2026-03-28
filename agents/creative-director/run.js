// @anima-command
// @label:       Creative Director
// @description: Pensiero creativo senior per brand luxury — brief, concept, pitch, review
// @order:       4

// agents/creative-director/run.js
// Scopo: entry point del Creative Director — sessione di pensiero creativo interattiva
// Uso:   node agents/creative-director/run.js

require('dotenv').config();
const readline = require('readline');
const path     = require('path');
const fs       = require('fs');
const { chat } = require('../../execution/utils/ai-client');

const rl  = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

// Carica system prompt e few-shot examples
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, 'prompts', 'system.md'), 'utf8'
);
const FEW_SHOT_EXAMPLES = fs.readFileSync(
  path.join(__dirname, 'prompts', 'templates', 'few-shot-examples.md'), 'utf8'
);

// Modalità disponibili con descrizione
const MODES = [
  { key: 'brief',   label: 'Brief Deconstruction', description: 'Hai un brief da analizzare e scomporre' },
  { key: 'concept', label: 'Concept Development',  description: 'Vuoi sviluppare un\'idea in profondità' },
  { key: 'brand',   label: 'Brand Thinking',        description: 'Vuoi ragionare sulla natura di un brand' },
  { key: 'pitch',   label: 'Pitch Preparation',     description: 'Stai preparando una gara o presentazione' },
  { key: 'review',  label: 'Creative Review',       description: 'Hai un lavoro da valutare criticamente' },
  { key: 'free',    label: 'Conversazione libera',  description: 'Domanda aperta, esplorazione, confronto' },
];

function printHeader() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║         ANIMA — Creative Director  ·  Mirror Agency         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

function printModes() {
  console.log('  Come posso aiutarti oggi?\n');
  MODES.forEach((m, i) => {
    const num   = String(i + 1).padStart(2);
    const label = m.label.padEnd(24);
    console.log(`  ${num}.  ${label} — ${m.description}`);
  });
  console.log();
}

// Costruisce il prompt arricchito in base alla modalità
function buildUserMessage(mode, client, input, context, useFewShot) {
  const parts = [];

  if (client) parts.push(`**Brand / Cliente:** ${client}`);
  if (context) parts.push(`**Contesto aggiuntivo:** ${context}`);

  const modeLabels = {
    brief:   'BRIEF DA DECOSTRUIRE',
    concept: 'IDEA DA SVILUPPARE',
    brand:   'BRAND SU CUI RAGIONARE',
    pitch:   'GARA DA PREPARARE',
    review:  'LAVORO DA VALUTARE',
    free:    'DOMANDA',
  };

  parts.push(`**${modeLabels[mode] || 'INPUT'}:**\n${input}`);

  if (useFewShot) {
    parts.push('\n---\n*Esempi di riferimento per tono e qualità:*\n' + FEW_SHOT_EXAMPLES);
  }

  return parts.join('\n\n');
}

// Sessione multi-turno — il CD ricorda il contesto della conversazione
async function runSession() {
  printHeader();
  printModes();

  // Selezione modalità
  const modeInput = await ask('  Seleziona modalità [1-6]: ');
  const modeIndex = parseInt(modeInput, 10) - 1;
  const mode      = MODES[modeIndex] || MODES[5]; // default: libera

  console.log(`\n  → Modalità: ${mode.label}\n`);

  // Input specifici per modalità
  let client  = '';
  let context = '';
  let input   = '';

  if (['brief', 'concept', 'pitch', 'review'].includes(mode.key)) {
    client = await ask('  Brand / cliente (es. "Bulgari", "Brunello Cucinelli"): ');
  }

  if (mode.key === 'brief') {
    console.log('\n  Incolla il brief (anche grezzo, anche incompleto).');
    console.log('  Scrivi "FINE" su una riga vuota per terminare.\n');
    const lines = [];
    while (true) {
      const line = await ask('  > ');
      if (line.trim() === 'FINE') break;
      lines.push(line);
    }
    input = lines.join('\n');
  } else if (mode.key === 'concept') {
    input   = await ask('  Descrivi l\'idea o la direzione da sviluppare: ');
    context = await ask('  Contesto (brief di riferimento, vincoli, tono) [opzionale]: ');
  } else if (mode.key === 'brand') {
    input = await ask('  Cosa vuoi esplorare del brand? ');
  } else if (mode.key === 'pitch') {
    input   = await ask('  Di cosa parla la gara? ');
    context = await ask('  Cosa sappiamo già del cliente / brief? [opzionale]: ');
  } else if (mode.key === 'review') {
    console.log('\n  Descrivi il lavoro da valutare (concept, testo, strategia, deck...).');
    console.log('  Scrivi "FINE" su una riga vuota per terminare.\n');
    const lines = [];
    while (true) {
      const line = await ask('  > ');
      if (line.trim() === 'FINE') break;
      lines.push(line);
    }
    input = lines.join('\n');
  } else {
    input = await ask('  La tua domanda o riflessione: ');
  }

  // Uso few-shot per brief e concept (più contesto aiuta)
  const useFewShot = ['brief', 'concept'].includes(mode.key);

  console.log('\n  💭 Il Creative Director sta pensando...\n');

  // Storico conversazione per multi-turno
  const conversationHistory = [];
  const userMessage = buildUserMessage(mode.key, client, input, context, useFewShot);
  conversationHistory.push({ role: 'user', content: userMessage });

  const startTime = Date.now();

  let response;
  try {
    response = await chat({
      system:    SYSTEM_PROMPT,
      messages:  conversationHistory,
      maxTokens: 2500,
    });
  } catch (err) {
    console.error(`\n  ❌ Errore: ${err.message}\n`);
    rl.close();
    return;
  }

  console.log('\n' + '─'.repeat(64));
  console.log(response);
  console.log('─'.repeat(64));
  console.log(`\n  ⏱️  ${Date.now() - startTime}ms\n`);

  conversationHistory.push({ role: 'assistant', content: response });

  // Loop multi-turno — continua la conversazione
  while (true) {
    const followUp = await ask('  Continua la conversazione (o "esci" per uscire): ');

    if (['esci', 'exit', 'quit', ''].includes(followUp.toLowerCase().trim())) {
      console.log('\n  Sessione chiusa.\n');
      break;
    }

    conversationHistory.push({ role: 'user', content: followUp });
    console.log('\n  💭 ...\n');

    let followResponse;
    try {
      followResponse = await chat({
        system:    SYSTEM_PROMPT,
        messages:  conversationHistory,
        maxTokens: 2000,
      });
    } catch (err) {
      console.error(`\n  ❌ Errore: ${err.message}\n`);
      break;
    }

    console.log('\n' + '─'.repeat(64));
    console.log(followResponse);
    console.log('─'.repeat(64) + '\n');

    conversationHistory.push({ role: 'assistant', content: followResponse });
  }

  // Offre di salvare la sessione
  const save = await ask('  Vuoi salvare questa sessione? [s/N]: ');
  if (save.toLowerCase() === 's') {
    const timestamp  = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').substring(0, 19);
    const clientSlug = client.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'sessione';
    const filename   = `cd-${clientSlug}-${timestamp}.md`;
    const savePath   = path.join(__dirname, '..', '..', '.tmp', 'cd-sessions', filename);

    fs.mkdirSync(path.dirname(savePath), { recursive: true });

    const sessionContent = [
      `# Sessione Creative Director — ${client || 'Conversazione libera'}`,
      `**Data:** ${new Date().toLocaleString('it-IT')}`,
      `**Modalità:** ${mode.label}`,
      `**Brand:** ${client || '—'}`,
      '',
      '---',
      '',
      ...conversationHistory.map(m =>
        `## ${m.role === 'user' ? '👤 Input' : '🎨 Creative Director'}\n\n${m.content}`
      ),
    ].join('\n\n');

    fs.writeFileSync(savePath, sessionContent);
    console.log(`\n  ✅ Sessione salvata in: .tmp/cd-sessions/${filename}\n`);
  }

  rl.close();
}

runSession().catch(err => {
  console.error('Errore:', err.message);
  process.exit(1);
});

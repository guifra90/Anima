// @anima-command
// @label:       Help
// @description: Mostra il menu dei comandi disponibili
// @order:       99

// orchestration/help.js
// Scopo: mostra un menu interattivo con tutti i comandi disponibili
// Uso: node orchestration/help.js

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

  if (!fs.existsSync(orchDir)) return [];

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

  if (discovered.length === 0 && fs.existsSync(path.join(__dirname, '..', 'agents'))) {
    // Se non ci sono altri comandi, mostriamo almeno la lista agenti se esiste la cartella agents
    console.log('  Nessun comando operativo trovato.');
    listAgents();
    rl.close();
    return;
  } else if (discovered.length === 0) {
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

// @anima-command
// @label:       Rimuovi Agente
// @description: Rimozione guidata e sicura di un agente da ANIMA
// @order:       2

// orchestration/remove-agent.js
// Scopo: rimozione guidata e sicura di un agente da ANIMA
// Uso: node orchestration/remove-agent.js
// Output: agente archiviato in .tmp/archived-agents/<slug>/ + aggiornamento ANIMA.md

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║     ANIMA — Rimuovi Agente           ║');
  console.log('╚══════════════════════════════════════╝\n');

  // ── Lista agenti esistenti ────────────────────────────────────────
  const agentsDir = path.join(__dirname, '..', 'agents');
  if (!fs.existsSync(agentsDir)) {
    console.log('  Nessun agente trovato in agents/. Nulla da rimuovere.\n');
    rl.close();
    return;
  }

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

  // ── Aggiornamento docs/ANIMA.md ────────────────────────────────────────
  const animaPath    = path.join(__dirname, '..', 'docs', 'ANIMA.md');
  if (fs.existsSync(animaPath)) {
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
  }

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  Agente "${agentName}" rimosso con successo.`);
  console.log('║');
  console.log(`║  I file sono in: .tmp/archived-agents/${slug}/`);
  console.log('║  Puoi recuperarli copiando la directory in agents/ se necessario.');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Sincronizzazione automatica con il DB
  try {
    console.log('🚀 Rimozione agente da Supabase via sync...');
    execSync('node orchestration/sync.js', { stdio: 'inherit' });
  } catch (err) {
    console.error('⚠️  Errore durante il sync automatico:', err.message);
  }
}

main().catch(err => {
  console.error('Errore durante la rimozione dell\'agente:', err.message);
  process.exit(1);
});

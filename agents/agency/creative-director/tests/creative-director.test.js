// agents/creative-director/tests/creative-director.test.js
// Test di validazione — verifica che il CD produca output di qualità e non output generici

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// ── Test 1: File essenziali presenti ─────────────────────────────────────────
function testFilesExist() {
    const requiredFiles = [
        path.join(__dirname, '..', 'AGENTS.md'),
        path.join(__dirname, '..', 'run.js'),
        path.join(__dirname, '..', 'prompts', 'system.md'),
        path.join(__dirname, '..', 'prompts', 'templates', 'few-shot-examples.md'),
    ];

    requiredFiles.forEach(f => {
        assert(fs.existsSync(f), `File mancante: ${f}`);
        const content = fs.readFileSync(f, 'utf8');
        assert(content.length > 100, `File troppo corto (probabilmente vuoto): ${f}`);
    });

    console.log('✅ Test 1 — File essenziali presenti: OK');
}

// ── Test 2: System prompt contiene i brand knowledge necessari ────────────────
function testBrandKnowledge() {
    const systemPrompt = fs.readFileSync(
        path.join(__dirname, '..', 'prompts', 'system.md'), 'utf8'
    );

    const requiredBrands = ['Bulgari', 'Brunello Cucinelli', 'Gucci'];
    requiredBrands.forEach(brand => {
        assert(systemPrompt.includes(brand), `Brand mancante nel system prompt: ${brand}`);
    });

    // Verifica che ci siano i progetti reali Mirror (estratti da Scoro)
    const requiredProjects = ['Always On', 'Solomei', 'Magic Mirror', 'Sound'];
    requiredProjects.forEach(project => {
        assert(systemPrompt.includes(project), `Progetto Mirror mancante: ${project}`);
    });

    console.log('✅ Test 2 — Brand knowledge e progetti Mirror: OK');
}

// ── Test 3: Modalità operative documentate ────────────────────────────────────
function testModes() {
    const systemPrompt = fs.readFileSync(
        path.join(__dirname, '..', 'prompts', 'system.md'), 'utf8'
    );

    const requiredModes = [
        'BRIEF DECONSTRUCTION',
        'CONCEPT DEVELOPMENT',
        'BRAND THINKING',
        'PITCH PREPARATION',
        'CREATIVE REVIEW',
    ];

    requiredModes.forEach(mode => {
        assert(systemPrompt.includes(mode), `Modalità mancante nel system prompt: ${mode}`);
    });

    console.log('✅ Test 3 — Modalità operative nel system prompt: OK');
}

// ── Test 4: Few-shot examples contengono esempi realistici ───────────────────
function testFewShotExamples() {
    const examples = fs.readFileSync(
        path.join(__dirname, '..', 'prompts', 'templates', 'few-shot-examples.md'), 'utf8'
    );

    // Deve contenere almeno due esempi con brand reali
    assert(examples.includes('Bulgari'), 'Few-shot: manca esempio Bulgari');
    assert(examples.includes('Brunello Cucinelli'), 'Few-shot: manca esempio Brunello Cucinelli');

    // Deve avere sezioni strutturate
    assert(examples.includes('## Cosa sento nel brief'), 'Few-shot: manca struttura brief deconstruction');
    assert(examples.includes('## Tre direzioni possibili'), 'Few-shot: manca struttura direzioni');
    assert(examples.includes('### Manifesto'), 'Few-shot: manca struttura manifesto');

    console.log('✅ Test 4 — Few-shot examples strutturati: OK');
}

// ── Test 5: run.js ha il tag @anima-command ───────────────────────────────────
function testAnimaCommandTag() {
    const runScript = fs.readFileSync(
        path.join(__dirname, '..', 'run.js'), 'utf8'
    );

    assert(runScript.includes('@anima-command'), 'run.js: manca tag @anima-command');
    assert(runScript.includes('@label:'), 'run.js: manca tag @label');
    assert(runScript.includes('@description:'), 'run.js: manca tag @description');
    assert(runScript.includes('@order:'), 'run.js: manca tag @order');

    // Verifica che la sessione supporti il multi-turno
    assert(runScript.includes('conversationHistory'), 'run.js: manca storico conversazione multi-turno');
    // Verifica che salvi le sessioni
    assert(runScript.includes('cd-sessions'), 'run.js: manca salvataggio sessione');

    console.log('✅ Test 5 — Tag ANIMA e funzionalità multi-turno: OK');
}

// ── Test 6: AGENTS.md contiene soglia escalation e dipendenze ─────────────────
function testDirective() {
    const directive = fs.readFileSync(
        path.join(__dirname, '..', 'AGENTS.md'), 'utf8'
    );

    assert(directive.includes('Dipendenze'), 'AGENTS.md: manca sezione Dipendenze');
    assert(directive.includes('escalation_threshold'), 'AGENTS.md: manca soglia escalation (frontmatter)');
    assert(directive.includes('Obiettivo'), 'AGENTS.md: manca sezione Obiettivo');

    console.log('✅ Test 6 — Struttura AGENTS.md completa: OK');
}

// ── Runner ─────────────────────────────────────────────────────────────────────
console.log('\n🎨 Creative Director Agent — Test suite\n');
let passed = 0, failed = 0;

[
    testFilesExist,
    testBrandKnowledge,
    testModes,
    testFewShotExamples,
    testAnimaCommandTag,
    testDirective,
].forEach(test => {
    try {
        test();
        passed++;
    } catch (err) {
        console.error(`❌ ${test.name}: ${err.message}`);
        failed++;
    }
});

console.log(`\n📊 Risultati: ${passed} OK, ${failed} FAIL\n`);
if (failed > 0) process.exit(1);

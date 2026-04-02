// orchestration/sync.js
// Scopo: Sincronizzazione bi-direzionale (Filesystem <-> Supabase) degli agenti ANIMA.
// Uso: node orchestration/sync.js [--dry-run] [--force-push] [--force-pull]

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// --- Configurazione ---
const AGENTS_DIR = path.join(__dirname, '..', 'agents');
const syncOptions = {
    dryRun: process.argv.includes('--dry-run'),
    forcePush: process.argv.includes('--force-push'),
    forcePull: process.argv.includes('--force-pull'),
};

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // Richiede Service Role per bypassare RLS durante il sync
);

/**
 * Utility per estrarre frontmatter e body da un file Markdown
 */
function parseAgentsMd(content) {
    const yamlRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
    const match = content.match(yamlRegex);
    if (!match) return { metadata: {}, body: content };

    const yamlBlock = match[1];
    const body = match[2];
    const metadata = {};

    yamlBlock.split('\n').forEach(line => {
        const [key, ...val] = line.split(':');
        if (key && val.length) metadata[key.trim()] = val.join(':').trim();
    });

    return { metadata, body };
}

/**
 * Utility per ricostruire il file AGENTS.md
 */
function serializeAgentsMd(metadata, body) {
    let yaml = '---\n';
    for (const [key, val] of Object.entries(metadata)) {
        yaml += `${key}: ${val}\n`;
    }
    yaml += '---\n';
    return yaml + (body || '');
}

/**
 * Mappa i dati dal database al formato locale AGENTS.md
 */
function dbToMd(dbAgent) {
    const metadata = {
        name: dbAgent.name,
        role: dbAgent.role,
        department: dbAgent.department,
        status: dbAgent.status || 'online',
        model_id: dbAgent.model_id,
        reports_to: dbAgent.reports_to || '',
        skills: (dbAgent.skills || []).join(', '),
        tags: (dbAgent.traits || []).join(', '),
        updated_at: dbAgent.updated_at
    };

    // Ricostruiamo il body unendo system_prompt e directives
    let body = `# ${dbAgent.name}\n\n`;
    if (dbAgent.bio) body += `> ${dbAgent.bio}\n\n`;
    
    if (dbAgent.system_prompt) {
        body += `## Obiettivo\n${dbAgent.system_prompt}\n\n`;
    }

    if (dbAgent.directives) {
        body += `## Strategia & Direttive\n${dbAgent.directives}\n\n`;
    }

    return { metadata, body };
}

/**
 * Mappa i dati dal file AGENTS.md al formato database
 */
function mdToDb(slug, metadata, body) {
    // Estrazione grossolana delle sezioni dal body
    const objectiveMatch = body.match(/## Obiettivo\n([\s\S]+?)(?=\n\n##|$)/);
    const directivesMatch = body.match(/## Strategia & Direttive\n([\s\S]+?)(?=\n\n##|$)/);
    const bioMatch = body.match(/^# .+\n\n> (.+)\n\n/);

    return {
        id: slug,
        name: metadata.name,
        role: metadata.role,
        department: metadata.department,
        status: metadata.status,
        model_id: metadata.model_id,
        reports_to: metadata.reports_to || null,
        skills: metadata.skills ? metadata.skills.split(',').map(s => s.trim()) : [],
        traits: metadata.tags ? metadata.tags.split(',').map(t => t.trim()) : [],
        bio: bioMatch ? bioMatch[1] : '',
        system_prompt: objectiveMatch ? objectiveMatch[1].trim() : '',
        directives: directivesMatch ? directivesMatch[1].trim() : '',
        updated_at: new Date().toISOString()
    };
}

/**
 * Main Sync Logic
 */
async function sync() {
    console.log(`\n🔄 Avvio sincronizzazione ANIMA Agents... ${syncOptions.dryRun ? '[DRY RUN]' : ''}\n`);

    // 1. Carica agenti dal DB
    const { data: dbAgents, error } = await supabase.from('anima_agents').select('*');
    if (error) {
        console.error('❌ Errore caricamento dal DB:', error.message);
        return;
    }

    // 2. Carica agenti dal Filesystem
    if (!fs.existsSync(AGENTS_DIR)) fs.mkdirSync(AGENTS_DIR);
    const localAgents = fs.readdirSync(AGENTS_DIR)
        .filter(f => fs.statSync(path.join(AGENTS_DIR, f)).isDirectory());

    const processedSlugs = new Set();

    // ─── PUSH / MERGE: Da Locale a DB ──────────────────────────────────────────
    for (const slug of localAgents) {
        processedSlugs.add(slug);
        const agentPath = path.join(AGENTS_DIR, slug, 'AGENTS.md');
        if (!fs.existsSync(agentPath)) continue;

        const fileContent = fs.readFileSync(agentPath, 'utf8');
        const stats = fs.statSync(agentPath);
        const { metadata, body } = parseAgentsMd(fileContent);
        
        const dbAgent = dbAgents.find(a => a.id === slug);

        if (!dbAgent) {
            console.log(`➕ [PUSH] Nuovo agente trovato localmente: ${slug}`);
            if (!syncOptions.dryRun) {
                const newAgent = mdToDb(slug, metadata, body);
                await supabase.from('anima_agents').insert(newAgent);
            }
        } else {
            const dbUpdated = new Date(dbAgent.updated_at);
            const localUpdated = stats.mtime;

            if (localUpdated > dbUpdated || syncOptions.forcePush) {
                console.log(`🆙 [PUSH] Aggiornamento DB per ${slug} (Locale più recente)`);
                if (!syncOptions.dryRun) {
                    const updateData = mdToDb(slug, metadata, body);
                    await supabase.from('anima_agents').update(updateData).eq('id', slug);
                }
            } else if (dbUpdated > localUpdated || syncOptions.forcePull) {
                // Questa parte verrà gestita nel prossimo loop dei dbAgents, 
                // ma segniamo che è un PULL potenziale.
            } else {
                // console.log(`✅ [OK] ${slug} è sincronizzato.`);
            }
        }
    }

    // ─── PULL: Da DB a Locale ──────────────────────────────────────────────────
    for (const dbAgent of dbAgents) {
        const slug = dbAgent.id;
        if (!localAgents.includes(slug)) {
            console.log(`📥 [PULL] Nuovo agente trovato su DB: ${slug}`);
            if (!syncOptions.dryRun) {
                const agentDir = path.join(AGENTS_DIR, slug);
                if (!fs.existsSync(agentDir)) fs.mkdirSync(agentDir, { recursive: true });
                const { metadata, body } = dbToMd(dbAgent);
                fs.writeFileSync(path.join(agentDir, 'AGENTS.md'), serializeAgentsMd(metadata, body));
                console.log(`   ✅ Cartella created: agents/${slug}/`);
            }
        } else {
            // Verifica se il DB è più recente dei file locali (già analizzato sopra in parte)
            const agentPath = path.join(AGENTS_DIR, slug, 'AGENTS.md');
            const stats = fs.statSync(agentPath);
            const dbUpdated = new Date(dbAgent.updated_at);
            const localUpdated = stats.mtime;

            if (dbUpdated > localUpdated && !syncOptions.forcePush) {
                console.log(`📥 [PULL] Aggiornamento locale per ${slug} (DB più recente)`);
                if (!syncOptions.dryRun) {
                    const { metadata, body } = dbToMd(dbAgent);
                    fs.writeFileSync(agentPath, serializeAgentsMd(metadata, body));
                }
            }
        }
    }

    console.log(`\n✨ Sincronizzazione completata.\n`);
}

sync().catch(err => {
    console.error('❌ Errore critico sync:', err);
    process.exit(1);
});

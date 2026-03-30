require('dotenv').config();
const registry = require('./execution/adapters/registry');

async function testProvider(provider, modelId) {
    console.log(`\n\x1b[36m[TESTING] Provider: ${provider.toUpperCase()} (Model: ${modelId})\x1b[0m`);
    
    try {
        const adapter = registry.getAdapter(provider, {
            apiKey: process.env[`${provider.toUpperCase()}_API_KEY`],
            baseURL: provider === 'ollama' ? process.env.OLLAMA_HOST : undefined
        });

        const startTime = Date.now();
        const response = await adapter.chat([
            { role: 'user', content: 'Rispondi brevemente: "ANIMA Neural Core Online".' }
        ]);
        const duration = Date.now() - startTime;

        console.log(`\x1b[32m[SUCCESS]\x1b[0m Duration: ${duration}ms`);
        console.log(`\x1b[33m[RESPONSE]\x1b[0m ${response.trim()}`);
        return true;
    } catch (err) {
        console.error(`\x1b[31m[FAILED]\x1b[0m Error: ${err.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log('--- ANIMA V2 NEURAL CORE DIAGNOSTICS ---');
    
    const results = {
        gemini: false,
        openrouter: false,
        ollama: false
    };

    // 1. Gemini
    results.gemini = await testProvider('gemini', process.env.AI_MODEL || 'gemini-1.5-flash');

    // 2. OpenRouter (test with DeepSeek if env is available)
    if (process.env.OPENROUTER_API_KEY) {
        results.openrouter = await testProvider('openrouter', 'deepseek/deepseek-r1');
    } else {
        console.log(`\n\x1b[35m[SKIPPED]\x1b[0m OpenRouter (Missing API Key)`);
    }

    // 3. Ollama
    results.ollama = await testProvider('ollama', 'deepseek-r1:14b');

    console.log('\n--- DIAGNOSTIC REPORT ---');
    Object.entries(results).forEach(([p, status]) => {
        const icon = status ? '✅' : '❌';
        console.log(`${icon} ${p.toUpperCase()}: ${status ? 'Ready' : 'Unavailable'}`);
    });

    process.exit(Object.values(results).some(v => v) ? 0 : 1);
}

runAllTests();

require('dotenv').config();
const registry = require('./frontend/src/execution/adapters/registry');

async function testProvider(provider, modelId) {
    console.log(`\n\x1b[36m[TESTING] Provider: ${provider.toUpperCase()} (Model: ${modelId})\x1b[0m`);
    
    try {
        const adapter = registry.getAdapter(provider, {
            apiKey: process.env[`${provider.toUpperCase()}_API_KEY`],
            baseURL: provider === 'ollama' ? process.env.OLLAMA_HOST : undefined,
            model: modelId
        });

        const startTime = Date.now();
        const response = await adapter.chat([
            { role: 'user', content: 'Rispondi brevemente: "ANIMA Neural Core Online".' }
        ]);
        const duration = Date.now() - startTime;

        console.log(`\x1b[32m[SUCCESS]\x1b[0m Duration: ${duration}ms`);
        console.log(`\x1b[33m[RESPONSE]\x1b[0m ${typeof response === 'string' ? response.trim() : JSON.stringify(response)}`);
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
    const geminiModel = process.env.AI_MODEL || 'gemini-1.5-flash';
    results.gemini = await testProvider('gemini', geminiModel);

    // 2. OpenRouter (test with DeepSeek if env is available)
    if (process.env.OPENROUTER_API_KEY) {
        results.openrouter = await testProvider('openrouter', 'deepseek/deepseek-r1');
    } else {
        console.log(`\n\x1b[35m[SKIPPED]\x1b[0m OpenRouter (Missing API Key)`);
    }

    // 3. Ollama (Optional, based on availability)
    if (process.env.OLLAMA_HOST) {
        results.ollama = await testProvider('ollama', 'deepseek-r1:14b');
    }

    console.log('\n--- DIAGNOSTIC REPORT ---');
    Object.entries(results).forEach(([p, status]) => {
        const icon = status ? '✅' : '❌';
        console.log(`${icon} ${p.toUpperCase()}: ${status ? 'Ready' : 'Unavailable'}`);
    });

    // We consider it a success if at least one cloud provider (Gemini or OpenRouter) is ready
    const isReady = results.gemini || results.openrouter;
    process.exit(isReady ? 0 : 1);
}

runAllTests();

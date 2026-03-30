// execution/tests/test_adapters.js
const { chat } = require('../utils/ai-client');

async function runTest() {
  console.log('🧪 Inizio test del Multi-Model Adapter System...');

  const messages = [{ role: 'user', content: 'Ciao, chi sei?' }];
  const system = 'Sei Anima, un assistente efficiente.';

  // 1. Test Gemini (default or via options)
  console.log('\n--- Test 1 (Gemini) ---');
  try {
    const res1 = await chat(messages, system, { provider: 'gemini', model: 'gemini-2.0-flash' });
    console.log('✅ Risposta Gemini:', res1.substring(0, 100) + '...');
  } catch (err) {
    console.error('❌ Fallimento Gemini:', err.message);
  }

  // 2. Test Ollama (Local)
  console.log('\n--- Test 2 (Ollama Local) ---');
  try {
    const res2 = await chat(messages, system, { provider: 'ollama', model: 'llama3.1:8b' });
    console.log('✅ Risposta Ollama:', res2.substring(0, 100) + '...');
  } catch (err) {
    console.error('❌ Fallimento Ollama (Verifica che Ollama sia attivo):', err.message);
  }

  // 3. Test Retro-compatibilità (vecchia firma)
  console.log('\n--- Test 3 (Compatibilità Vecchia Firma) ---');
  try {
    const res3 = await chat({
      system,
      messages,
      maxTokens: 50
    });
    console.log('✅ Risposta (Vecchia Firma):', res3.substring(0, 100) + '...');
  } catch (err) {
    console.error('❌ Fallimento Vecchia Firma:', err.message);
  }
}

runTest();

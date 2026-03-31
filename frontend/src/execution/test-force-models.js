const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testForceModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelsToTry = [
    { name: "gemini-embedding-2-flash", version: "v1beta" },
    { name: "text-embedding-005", version: "v1" },
    { name: "embedding-001", version: "v1" }
  ];

  console.log("🧪 Test Forzato Modelli Embedding...");

  for (const m of modelsToTry) {
    try {
      console.log(`\nProvando modello: ${m.name} (${m.version})...`);
      const model = genAI.getGenerativeModel({ model: m.name }, { apiVersion: m.version });
      const result = await model.embedContent("Mirror Agency Neon Cyan Protocol");
      console.log(`✅ SUCCESSO! Dimensioni: ${result.embedding.values.length}`);
    } catch (err) {
      console.log(`❌ FALLITO: ${err.message}`);
    }
  }
}

testForceModels();

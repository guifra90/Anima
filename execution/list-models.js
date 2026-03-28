const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("=== TUTTI I MODELLI DISPONIBILI (v1beta) ===");
    if (!data.models) {
        console.log("Nessun modello trovato. Risposta API:", JSON.stringify(data));
        return;
    }
    data.models.forEach(m => console.log(`Model: ${m.name} | Methods: ${m.supportedGenerationMethods}`));
  } catch (err) {
    console.error("Errore nel recupero modelli:", err.message);
  }
}

listModels();

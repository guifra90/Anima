// execution/planner/orchestrator.js
// Scopo: Il "Cervello" dell'Agenzia OS.
// Scompone una Missione in Task atomici assegnati agli agenti disponibili.

const aiClient = require('../utils/ai-client');
require('dotenv').config();

/**
 * Pianifica una missione decomponendola in task
 * @param {string} objective - L'obiettivo della missione
 * @param {Array} agents - Lista degli agenti disponibili {id, name, role}
 */
async function planMission(objective, agents) {
    const agentContext = agents.map(a => `- ${a.id}: ${a.name} (${a.role})`).join('\n');
    
    const systemPrompt = `
      Sei l'Orchestratore Strategico di Mirror Agency (ANIMA OS).
      Il tuo compito è trasformare un OBIETTIVO di alto livello in un PIANO D'AZIONE (Task List).
      
      [AGENTI DISPONIBILI]
      ${agentContext}
      
      [ISTRUZIONI]
      1. Scomponi la missione in un numero ragionevole di task (3-6).
      2. Assegna ogni task all'agente più adatto basandoti sul suo ruolo.
      3. Importante: Restituisci SOLO un array JSON con questa struttura:
         [
           {
             "title": "Titolo breve",
             "description": "Descrizione dettagliata del compito",
             "agent_id": "id_agente_scelto",
             "order_index": 1
           }
         ]
      4. Sii concreto e professionale. Non includere testo extra, solo il JSON.
    `;

    const messages = [
        { role: 'user', content: `Pianifica questa missione: "${objective}"` }
    ];

    try {
        const responseText = await aiClient.chat(messages, systemPrompt, { 
            provider: 'gemini', // Forza Gemini per la pianificazione veloce
            model: 'gemini-1.5-flash'
        });

        // Pulizia risposta (rimozione di ```json ... ``` se presente)
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (err) {
        console.error("[Planner Error]", err.message);
        throw new Error("Impossibile generare il piano della missione.");
    }
}

module.exports = { planMission };

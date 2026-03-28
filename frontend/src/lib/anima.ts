import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

/**
 * ANIMA Bridge — Gestisce l'accesso alle direttive degli agenti
 * e l'interazione con i motori AI nel contesto del frontend.
 */

// Risolve il percorso verso la root del progetto ANIMA
const ROOT_DIR = path.resolve(process.cwd(), '..');

// Carica le variabili d'ambiente dalla root
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

export interface AgentInfo {
  id: string;
  name: string;
  department: string;
  responsibility: string;
  directive: string;
  systemPrompt: string;
}

export async function getAgentInfo(agentId: string): Promise<AgentInfo | null> {
  const agentPath = path.join(ROOT_DIR, 'agents', agentId);
  const directivePath = path.join(agentPath, 'directive.md');
  const systemPath = path.join(agentPath, 'prompts', 'system.md');

  if (!fs.existsSync(directivePath)) return null;

  const directive = fs.readFileSync(directivePath, 'utf8');
  const systemPrompt = fs.readFileSync(systemPath, 'utf8');

  // Estrae nome e reparto dai metadati del file markdown
  const nameMatch = directive.match(/^# Direttiva — (.+)/m);
  const deptMatch = directive.match(/\*\*Reparto:\*\* (.+)/);
  const respMatch = directive.match(/\n## Responsabilità\n(.+)/);

  return {
    id: agentId,
    name: nameMatch ? nameMatch[1].trim() : agentId,
    department: deptMatch ? deptMatch[1].trim() : 'General',
    responsibility: respMatch ? respMatch[1].trim() : '',
    directive,
    systemPrompt
  };
}

export async function listAllAgents(): Promise<Partial<AgentInfo>[]> {
  const agentsDir = path.join(ROOT_DIR, 'agents');
  if (!fs.existsSync(agentsDir)) return [];

  const dirs = fs.readdirSync(agentsDir).filter(f => 
    fs.statSync(path.join(agentsDir, f)).isDirectory()
  );

  const agents = [];
  for (const slug of dirs) {
    const info = await getAgentInfo(slug);
    if (info) {
      agents.push({
        id: info.id,
        name: info.name,
        department: info.department,
        responsibility: info.responsibility
      });
    }
  }
  return agents;
}

// Client AI semplificato per il frontend
export async function animaChat({ agentId, messages, system }: { 
  agentId: string, 
  messages: { role: 'user' | 'assistant', content: string }[],
  system?: string 
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.AI_MODEL || 'gemini-1.5-flash';

  if (!apiKey) throw new Error("GEMINI_API_KEY non configurata");

  const genAI = new GoogleGenerativeAI(apiKey);
  // Usiamo v1beta per i modelli 'latest', '2.0' e '2.5', v1 per gli altri
  const apiVer = (modelName.includes('latest') || modelName.includes('2.0') || modelName.includes('2.5')) ? 'v1beta' : 'v1';
  const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: apiVer });

  // Gemini richiede che il primo messaggio della history sia 'user'.
  // Filtriamo eventuali messaggi di benvenuto iniziali dell'assistente.
  let historyMessages = [...messages];
  while (historyMessages.length > 0 && historyMessages[0].role !== 'user') {
    historyMessages.shift();
  }

  if (historyMessages.length === 0) {
    throw new Error("Nessun messaggio utente trovato per iniziare la sessione");
  }

  // Iniezione istruzioni nel primo messaggio (che ora è garantito essere 'user')
  if (system) {
    historyMessages[0].content = `[SYSTEM INSTRUCTION]\n${system}\n\n[USER INPUT]\n${historyMessages[0].content}`;
  }

  const history = historyMessages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const chat = model.startChat({ history });
  const lastMessage = historyMessages[historyMessages.length - 1].content;

  // Funzione con retry potenziato per il frontend
  async function sendMessageWithRetry(msg: string, retries = 5, delay = 2000): Promise<string> {
    try {
      const resp = await chat.sendMessage(msg);
      return resp.response.text();
    } catch (err: any) {
      const errorMsg = err.message || '';
      const isTemporary = errorMsg.includes('429') || 
                          errorMsg.includes('503') || 
                          errorMsg.toLowerCase().includes('service unavailable') ||
                          errorMsg.toLowerCase().includes('too many requests');

      if (isTemporary && retries > 0) {
        console.log(`  [Frontend AI] Tentativo fallito (errore temporaneo). Riprovo tra ${delay/1000}s... (${retries} rimasti)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return sendMessageWithRetry(msg, retries - 1, delay * 2);
      }
      throw err;
    }
  }
  
  return await sendMessageWithRetry(lastMessage);
}

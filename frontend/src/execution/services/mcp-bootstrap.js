/**
 * MCP Bootstrap - Initializes all MCP server connections.
 */

const mcpService = require('./mcp-service');
require('dotenv').config();

async function initMCP() {
  console.log('🔄 Avvio inizializzazione MCP Servers...');

  // 1. Scoro MCP (Remote SSE)
  const scoroUrl = process.env.SCORO_MCP_URL || 'https://mirror.scoro.com/mcp';
  const scoroKey = process.env.SCORO_API_KEY;

  if (scoroUrl) {
    try {
      await mcpService.connectSse('scoro', scoroUrl, scoroKey);
    } catch (err) {
      console.warn('[MCP-BOOTSTRAP] Errore connessione Scoro MCP:', err.message);
    }
  }

  // 2. Local Servers (Example: Stdio)
  // await mcpService.connectStdio('gmail', 'node', ['./servers/gmail.js']);
  
  console.log('✨ Inizializzazione MCP completata.');
}

module.exports = { initMCP };

if (require.main === module) {
  initMCP();
}

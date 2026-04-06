/**
 * Test script to discover Scoro MCP tools.
 */
const mcpService = require('./mcp-service');
require('dotenv').config();

async function discover() {
  console.log('--- SCANNING SCORO MCP SERVER ---');
  const scoroUrl = process.env.SCORO_MCP_URL || 'https://mirror.scoro.com/mcp';
  const scoroKey = process.env.SCORO_API_KEY;
  const companyId = process.env.SCORO_COMPANY_ACCOUNT_ID;

  try {
    const client = await mcpService.connectSse('scoro', scoroUrl, scoroKey, companyId);
    const toolsResult = await client.listTools();
    console.log(`\n✅ Trovati ${toolsResult.tools.length} tool su Scoro MCP:\n`);
    
    toolsResult.tools.forEach(t => {
      console.log(`- [${t.name}] ${t.description.slice(0, 80)}...`);
    });
    
    // Check specific tools for our skills
    const projectTool = toolsResult.tools.find(t => t.name.includes('project'));
    if (projectTool) {
       console.log('\n--- DETTAGLIO TOOL PROGETTI ---');
       console.log(JSON.stringify(projectTool, null, 2));
    }

  } catch (err) {
    console.error('❌ Errore Discovery:', err.message);
  } finally {
    await mcpService.shutdown();
  }
}

discover();

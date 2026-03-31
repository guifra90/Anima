/**
 * MCPService - Integration with Model Context Protocol (MCP) servers.
 */

const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
// const { SseClientTransport } = require("@modelcontextprotocol/sdk/client/sse.js"); // In case we need HTTP/SSE

class MCPService {
  constructor() {
    this.clients = new Map();
  }

  /**
   * Connect to a local MCP server via stdio.
   * @param {string} serverId - Local identifier (e.g. 'gmail')
   * @param {string} command - Path to executable (e.g. 'node')
   * @param {string[]} args - Arguments (e.g. ['path/to/server.js'])
   */
  async connectStdio(serverId, command, args = []) {
    console.log(`[MCP] Connessione a ${serverId} via stdio...`);
    try {
      const transport = new StdioClientTransport({ command, args });
      const client = new Client(
        { name: "anima-client", version: "1.0.0" },
        { capabilities: { tools: {} } }
      );

      await client.connect(transport);
      this.clients.set(serverId, client);
      console.log(`[MCP] ${serverId} connesso con successo.`);
      return client;
    } catch (err) {
      console.error(`[MCP] Errore connessione ${serverId}:`, err.message);
      throw err;
    }
  }

  /**
   * Get all tools from all connected MCP servers.
   */
  async getAllTools() {
    const allTools = [];
    for (const [serverId, client] of this.clients.entries()) {
      try {
        const response = await client.listTools();
        const tools = response.tools.map(t => ({
          ...t,
          name: `${serverId}:${t.name}`, // Namespacing
          serverId: serverId
        }));
        allTools.push(...tools);
      } catch (err) {
        console.warn(`[MCP] Errore recupero tool da ${serverId}:`, err.message);
      }
    }
    return allTools;
  }

  /**
   * Execute an MCP tool.
   * @param {string} namespacedName - e.g. 'gmail:search_emails'
   * @param {object} args 
   */
  async callTool(namespacedName, args) {
    const [serverId, ...toolNameParts] = namespacedName.split(':');
    const toolName = toolNameParts.join(':');
    
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`MCP server ${serverId} non connesso.`);
    }

    console.log(`[MCP] Esecuzione tool ${namespacedName}...`);
    try {
      const result = await client.callTool({
        name: toolName,
        arguments: args
      });
      return result;
    } catch (err) {
      console.error(`[MCP] Errore esecuzione tool ${namespacedName}:`, err.message);
      throw err;
    }
  }

  /**
   * Close all connections.
   */
  async shutdown() {
    for (const client of this.clients.values()) {
      await client.close();
    }
    this.clients.clear();
  }
}

module.exports = new MCPService();

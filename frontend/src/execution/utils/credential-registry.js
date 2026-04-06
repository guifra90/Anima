const { supabase } = require('../../lib/supabase');
const { decrypt } = require('./encryption');

/**
 * CredentialRegistry - Paperclip Logic for ANIMA
 * Resolves credentials based on a hierarchy:
 * 1. Explicit Agent Mapping (anima_agent_connections)
 * 2. Primary Connection (is_primary = true)
 * 3. Fallback (Most recent for type)
 * 4. Local Env (If provided)
 */
class CredentialRegistry {
  /**
   * Resolves a client connection for a specific agent and service.
   * @param {string} agentId - The ID of the agent performing the task.
   * @param {string} type - Service type (scoro, gmail, gcal).
   * @returns {Promise<object>} - Decrypted credentials and metadata.
   */
  async resolve(agentId, type) {
    console.log(`[CREDENTIAL-REGISTRY] Resolving credentials for Agent: ${agentId}, Service: ${type}`);

    try {
      // 1. Check for explicit agent mapping
      const { data: agentConn, error: agentErr } = await supabase
        .from('anima_agent_connections')
        .select('connection_id')
        .eq('agent_id', agentId)
        .single();

      let targetConnectionId = agentConn?.connection_id;

      let query = supabase.from('anima_connections').select('*').eq('type', type);

      if (targetConnectionId) {
        // We have a specific mapping
        query = query.eq('id', targetConnectionId);
      } else {
        // No specific mapping, look for Primary
        query = query.eq('is_primary', true);
      }

      const { data: connections, error: connErr } = await query;

      if (connErr) throw connErr;

      let connection = connections?.[0];

      // fallback to most recent if no primary found
      if (!connection && !targetConnectionId) {
        console.warn(`[CREDENTIAL-REGISTRY] No primary found for ${type}, falling back to most recent.`);
        const { data: recent, error: recentErr } = await supabase
          .from('anima_connections')
          .select('*')
          .eq('type', type)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (recentErr) throw recentErr;
        connection = recent?.[0];
      }

      if (!connection) {
        throw new Error(`NO_CONNECTION_FOUND: ${type}`);
      }

      // Decrypt credentials
      const encryptedData = connection.credentials?.encrypted;
      if (!encryptedData) throw new Error(`MISSING_ENCRYPTED_CREDENTIALS: ${connection.id}`);

      const secrets = decrypt(encryptedData);
      
      // Merge with metadata (non-sensitive fields)
      return {
        id: connection.id,
        name: connection.name,
        type: connection.type,
        ...connection.metadata,
        ...secrets
      };

    } catch (error) {
      console.error(`[CREDENTIAL-REGISTRY] Error resolving credentials:`, error.message);
      // Fallback to Env if requested or needed for local dev
      return null;
    }
  }
}

module.exports = new CredentialRegistry();

const { getAuthenticatedClient } = require('./client');
const gmail = require('./gmail');
const gcal = require('./gcal');
const CredentialRegistry = require('../utils/credential-registry');

/**
 * Main dispatcher for Google Tools.
 */
async function run(toolName, args, credentialsOrAgentId) {
  let credentials = credentialsOrAgentId;

  if (typeof credentialsOrAgentId === 'string' && credentialsOrAgentId.length > 30) {
    // Resolve via registry
    const resolved = await CredentialRegistry.resolve(credentialsOrAgentId, 'gmail');
    credentials = resolved || await CredentialRegistry.resolve(credentialsOrAgentId, 'google');
  }

  const auth = await getAuthenticatedClient(credentials);

  // Normalize: strip namespace prefix if present (handles ':', '__', or bare method)
  // e.g. "gmail:list_messages" -> "list_messages"
  // e.g. "gmail__list_messages" -> "list_messages"
  // e.g. "gcal:create_event"  -> "create_event"
  const normalizedName = toolName
    .replace(/^(gmail|gcal)[_:]+/i, '')  // Strip namespace prefix (case-insensitive)
    .replace(/__/g, '_')               // Normalize double underscore to single
    .toLowerCase();                    // Convert to lowercase for switch matching

  console.log(`[GOOGLE-EXECUTOR] Running tool: "${toolName}" -> normalized: "${normalizedName}"`, args);

  switch (normalizedName) {
    // Gmail Tools
    case 'list_messages':
      return await gmail.listMessages(auth, args);
    case 'get_message':
      return await gmail.getMessage(auth, args);
    case 'send_email':
      return await gmail.sendEmail(auth, args);

    // Calendar Tools
    case 'list_events':
      return await gcal.listEvents(auth, args);
    case 'create_event':
      return await gcal.createEvent(auth, args);

    default:
      throw new Error(`TOOL_NOT_IMPLEMENTED: "${toolName}" (normalized: "${normalizedName}")`);
  }
}

module.exports = { run };

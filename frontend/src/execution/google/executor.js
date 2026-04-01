const { getAuthenticatedClient } = require('./client');
const gmail = require('./gmail');
const gcal = require('./gcal');

/**
 * Main dispatcher for Google Tools.
 * 
 * Accepts both formats for full model-agnostic compatibility:
 * - "gmail:list_messages"  (canonical ANIMA namespace format)
 * - "gmail__list_messages" (OpenRouter/Gemini wire format)
 * - "list_messages"        (legacy bare method format)
 */
async function run(toolName, args, encryptedCredentials) {
  const auth = await getAuthenticatedClient(encryptedCredentials);

  // Normalize: strip namespace prefix if present (handles ':', '__', or bare method)
  // e.g. "gmail:list_messages" -> "list_messages"
  // e.g. "gmail__list_messages" -> "list_messages"
  // e.g. "gcal:create_event"  -> "create_event"
  const normalizedName = toolName
    .replace(/^(gmail|gcal)[_:]+/, '')  // Strip namespace prefix
    .replace(/__/g, '_');               // Normalize double underscore to single

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

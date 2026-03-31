const { getAuthenticatedClient } = require('./client');
const gmail = require('./gmail');
const gcal = require('./gcal');

/**
 * Main dispatcher for Google Tools.
 * Each toolName follows the convention "service:method" (e.g., gmail:send_email).
 */
async function run(toolName, args, encryptedCredentials) {
  const auth = await getAuthenticatedClient(encryptedCredentials);

  console.log(`[GOOGLE-EXECUTOR] Running tool: ${toolName}`, args);

  switch (toolName) {
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
      throw new Error(`TOOL_NOT_IMPLEMENTED: google:${toolName}`);
  }
}

module.exports = { run };

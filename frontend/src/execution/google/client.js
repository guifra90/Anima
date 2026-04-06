const { google } = require('googleapis');

/**
 * Creates an authenticated Google OAuth2 client from saved credentials.
 * Handles automatic token refreshing if needed.
 */
async function getAuthenticatedClient(encryptedOrDecrypted) {
  const { decrypt } = require('../utils/encryption');
  
  let credentials;
  if (typeof encryptedOrDecrypted === 'object' && encryptedOrDecrypted !== null) {
    // Already decrypted via Registry or direct call
    credentials = encryptedOrDecrypted;
  } else {
    try {
      const rawDecrypt = decrypt(encryptedOrDecrypted);
      credentials = typeof rawDecrypt === 'string' ? JSON.parse(rawDecrypt) : rawDecrypt;
    } catch (err) {
      console.warn('[GOOGLE-CLIENT] Decryption failed, assuming raw credentials or bad format.');
      credentials = encryptedOrDecrypted;
    }
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
  );

  oauth2Client.setCredentials(credentials);

  // Note: if refresh_token is present, it will automatically refresh if needed
  // when used by the google libraries.
  
  return oauth2Client;
}

module.exports = { getAuthenticatedClient };

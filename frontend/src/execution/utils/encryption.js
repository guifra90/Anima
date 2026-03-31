// execution/utils/encryption.js
const crypto = require('crypto');

/**
 * Utility for encrypting and decrypting sensitive data (API keys, tokens).
 * Uses AES-256-GCM for strong encryption with authentication.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a string or object.
 * @param {string|object} data - Data to encrypt.
 * @returns {string} - Base64 encoded string: iv + authTag + ciphertext
 */
function encrypt(data) {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ENCRYPTION_SECRET must be at least 32 characters long');
  }

  const text = typeof data === 'string' ? data : JSON.stringify(data);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.scryptSync(secret, 'salt', 32);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted string.
 * @param {string} encryptedData - The iv + authTag + ciphertext string.
 * @returns {string|object} - The decrypted data.
 */
function decrypt(encryptedData) {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ENCRYPTION_SECRET must be at least 32 characters long');
  }

  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');
    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.scryptSync(secret, 'salt', 32);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (err) {
    console.error('[Encryption] Decryption failed:', err.message);
    throw new Error('DECRYPTION_FAILED');
  }
}

module.exports = { encrypt, decrypt };

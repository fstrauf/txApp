import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // AES block size for GCM
const AUTH_TAG_LENGTH = 16; // GCM auth tag length

// Retrieve and validate the encryption key from environment variables
function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.LUNCH_MONEY_ENCRYPTION_KEY;
  if (!keyBase64) {
    throw new Error('LUNCH_MONEY_ENCRYPTION_KEY environment variable is not set.');
  }
  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) {
    throw new Error('LUNCH_MONEY_ENCRYPTION_KEY must be a 32-byte (256-bit) key encoded in base64.');
  }
  return key;
}

/**
 * Encrypts a plain text API key using AES-256-GCM.
 * @param apiKey The plain text API key to encrypt.
 * @returns A base64 encoded string containing iv:encryptedData:authTag, or throws an error.
 */
export function encryptApiKey(apiKey: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(apiKey, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Combine IV, encrypted data, and auth tag, separated by colons
    const combined = `${iv.toString('base64')}:${encrypted}:${authTag.toString('base64')}`;

    // Return the combined data as a single base64 string for easier storage
    return Buffer.from(combined).toString('base64');

  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt API key.');
  }
}

/**
 * Decrypts an API key previously encrypted with encryptApiKey.
 * @param encryptedKey The base64 encoded string (iv:encryptedData:authTag) from the database.
 * @returns The original plain text API key, or throws an error if decryption or verification fails.
 */
export function decryptApiKey(encryptedKey: string): string {
  try {
    const key = getEncryptionKey();

    // Decode the combined base64 string
    const combined = Buffer.from(encryptedKey, 'base64').toString('utf8');

    // Split the combined string back into parts
    const parts = combined.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted key format.');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const encryptedData = parts[1];
    const authTag = Buffer.from(parts[2], 'base64');

    if (iv.length !== IV_LENGTH) {
      throw new Error('Invalid IV length.');
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid authTag length.');
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8'); // Will throw here if auth tag verification fails

    return decrypted;

  } catch (error) {
    console.error('Decryption failed:', error);
    // Distinguish tampering errors from other issues if possible
    if (error instanceof Error && error.message.includes('Unsupported state or unable to authenticate data')) {
      throw new Error('Decryption failed: Data integrity check failed (possible tampering).');
    }
    throw new Error('Failed to decrypt API key.');
  }
} 
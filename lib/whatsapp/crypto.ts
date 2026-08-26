import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Must be provided in .env
const MASTER_KEY = process.env.WHATSAPP_ENCRYPTION_KEY;

/**
 * Encrypts a string using AES-256-GCM.
 * @param text The plain text to encrypt (e.g., Access Token)
 * @returns The encrypted string in format: iv:salt:tag:encryptedText
 */
export function encryptToken(text: string): string | null {
  if (!text) return null;
  if (!MASTER_KEY) {
    throw new Error('WHATSAPP_ENCRYPTION_KEY is not defined in environment variables.');
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derive key using pbkdf2
    const key = crypto.pbkdf2Sync(MASTER_KEY, salt, 100000, KEY_LENGTH, 'sha512');

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();

    // Format: iv:salt:tag:encrypted
    return `${iv.toString('hex')}:${salt.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
}

/**
 * Decrypts a string previously encrypted with encryptToken.
 * @param encryptedData The encrypted string
 * @returns The decrypted plain text, or null if decryption fails
 */
export function decryptToken(encryptedData: string | null): string | null {
  if (!encryptedData) return null;

  // If the token is not encrypted (does not have the iv:salt:tag:data format)
  // we assume it is a plain text token stored directly in the DB.
  const parts = encryptedData.split(':');
  if (parts.length !== 4) {
    return encryptedData;
  }

  if (!MASTER_KEY) {
    console.warn('WHATSAPP_ENCRYPTION_KEY is not defined, but token appears to be encrypted. Decryption will fail.');
    return null;
  }

  try {
    const [ivHex, saltHex, tagHex, encryptedText] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const salt = Buffer.from(saltHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const key = crypto.pbkdf2Sync(MASTER_KEY, salt, 100000, KEY_LENGTH, 'sha512');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

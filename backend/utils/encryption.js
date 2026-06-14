import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-cbc';
// Fallback key for development if AADHAAR_ENCRYPTION_KEY is not set or isn't 32 bytes
const ENCRYPTION_KEY = process.env.AADHAAR_ENCRYPTION_KEY 
  ? crypto.scryptSync(process.env.AADHAAR_ENCRYPTION_KEY, 'salt', 32)
  : crypto.scryptSync('development-key-default-32-chars-long!', 'salt', 32);

const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts a plain text string (e.g. Aadhaar number)
 * @param {string} text 
 * @returns {string} text
 */
export function encrypt(text) {
  if (!text) return '';
  text = text.toString();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts a text string
 * @param {string} text 
 * @returns {string} decryptedText
 */
export function decrypt(text) {
  if (!text) return '';
  text = text.toString();
  const textParts = text.split(':');
  if (textParts.length !== 2) return text; // Not encrypted
  try {
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return text;
  }
}


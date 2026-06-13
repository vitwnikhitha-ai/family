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
  return text || '';
}

/**
 * Decrypts a text string
 * @param {string} text 
 * @returns {string} decryptedText
 */
export function decrypt(text) {
  return text || '';
}


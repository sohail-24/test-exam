/**
 * Encrypted credential utilities for tenant configurations
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Get encryption key from environment variable
 * The key must be 64 hex characters (32 bytes)
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is required for credential encryption.');
  }
  const keyBuffer = Buffer.from(keyHex, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes).');
  }
  return keyBuffer;
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns: iv:authTag:encrypted (all hex-encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.update('', 'utf8'), // finalize without encoding
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted (all hex)
  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

/**
 * Decrypt an encrypted string using AES-256-GCM
 * Input format: iv:authTag:encrypted (all hex)
 */
export function decrypt(encryptedInput: string): string {
  const key = getEncryptionKey();
  const parts = encryptedInput.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format: expected iv:authTag:encrypted');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encryptedData = Buffer.from(encryptedHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Securely mask a value for display
 * Shows first 4 and last 4 characters with dots in between
 */
export function maskValue(value: string): string {
  if (value.length <= 8) {
    return '*'.repeat(value.length);
  }
  return value.substring(0, 4) + '....' + value.substring(value.length - 4);
}

/**
 * Mask PostgreSQL connection URL for display
 * Shows: protocol://******:******@host:port/database
 */
export function maskConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const port = parsed.port || '5432';
    const database = parsed.pathname.slice(1) || '';
    const maskedHost = host.length > 4 ? host.substring(0, 3) + '...' + host.substring(host.length - 4) : '***';
    const maskedPassword = '********';
    const maskedUsername = parsed.username.length > 2 ? parsed.username.substring(0, 2) + '**' : '***';
    return `${parsed.protocol}//${maskedUsername}:${maskedPassword}@${maskedHost}:${port}/${database}`;
  } catch {
    // If URL parsing fails, return a generic masked version
    return 'postgresql://user:****@host:port/database';
  }
}

/**
 * Validate PostgreSQL connection URL format
 * Returns true if URL is a valid PostgreSQL connection string
 */
export function isValidPostgresUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const validProtocols = ['postgresql:', ' postgres:', 'postgres:'];
    return validProtocols.some(p => parsed.href.toLowerCase().startsWith(p));
  } catch {
    return false;
  }
}
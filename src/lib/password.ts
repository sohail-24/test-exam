/**
 * Password hashing utilities for tenant admin accounts
 * Uses SHA-256 for compatibility with existing safeCompare() authentication
 */

import crypto from 'crypto';

const PASSWORD_MIN_LENGTH = 6;
const SALT_LENGTH = 16;

/**
 * Hash a password with a random salt
 * Returns format: salt:hash
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(salt + password)
    .digest('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash
 * Supports both new salted format (salt:hash) and legacy plaintext for migration
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  // Legacy support: if no salt separator, use timing-safe compare directly
  if (!storedHash.includes(':')) {
    const hash = crypto.createHash('sha256').update(password).digest();
    const stored = crypto.createHash('sha256').update(storedHash).digest();
    return crypto.timingSafeEqual(hash, stored);
  }

  // New salted format
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  const computedHash = crypto
    .createHash('sha256')
    .update(salt + password)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(computedHash, 'hex'),
    Buffer.from(hash, 'hex')
  );
}

/**
 * Hash comparison for timing-safe equality
 * Re-exports from auth.ts for backwards compatibility
 */
export function compareHash(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Validate password meets requirements
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` };
  }
  return { valid: true };
}
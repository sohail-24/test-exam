import crypto from 'crypto';
import { z } from 'zod';

if (typeof window !== 'undefined') {
  throw new Error('src/lib/env.ts must only be imported in server-side code.');
}

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().trim().min(1).optional(),
  NEXTAUTH_URL: z.string().trim().url().optional(),
  APP_URL: z.string().trim().url().optional(),
  NEXTAUTH_SECRET: z.string().trim().min(1).optional(),
  SUPER_ADMIN_EMAIL: z.string().trim().email().optional(),
  SUPER_ADMIN_PASSWORD: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().trim().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().trim().min(1).optional(),
  RAZORPAY_KEY_ID: z.string().trim().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().trim().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const globalForEnv = globalThis as unknown as {
  __devAuthSecret?: string;
  __envValidated?: boolean;
};

function normalizeEmptyEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' && !isBuildPhase();
}

export function getParsedServerEnv(): ServerEnv {
  const raw = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: normalizeEmptyEnv(process.env.DATABASE_URL),
    NEXTAUTH_URL: normalizeEmptyEnv(process.env.NEXTAUTH_URL),
    APP_URL: normalizeEmptyEnv(process.env.APP_URL),
    NEXTAUTH_SECRET: normalizeEmptyEnv(process.env.NEXTAUTH_SECRET),
    SUPER_ADMIN_EMAIL: normalizeEmptyEnv(process.env.SUPER_ADMIN_EMAIL),
    SUPER_ADMIN_PASSWORD: normalizeEmptyEnv(process.env.SUPER_ADMIN_PASSWORD),
    GOOGLE_CLIENT_ID: normalizeEmptyEnv(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: normalizeEmptyEnv(process.env.GOOGLE_CLIENT_SECRET),
    NEXT_PUBLIC_RAZORPAY_KEY_ID: normalizeEmptyEnv(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
    RAZORPAY_KEY_ID: normalizeEmptyEnv(process.env.RAZORPAY_KEY_ID),
    RAZORPAY_KEY_SECRET: normalizeEmptyEnv(process.env.RAZORPAY_KEY_SECRET),
  };

  const result = serverEnvSchema.safeParse(raw);
  if (!result.success) {
    const invalidKeys = result.error.issues.map((issue) => issue.path.join('.')).filter(Boolean);
    throw new Error(
      `Invalid server environment configuration for: ${Array.from(new Set(invalidKeys)).join(', ')}`,
    );
  }

  return result.data;
}

/**
 * Resolves the effective NextAuth base URL.
 * Prefers explicitly configured NEXTAUTH_URL; falls back to platform-injected APP_URL
 * (and populates process.env.NEXTAUTH_URL when unset) so NextAuth origin detection,
 * callback URLs, and HTTPS cookie defaults stay consistent with the actual deployment origin.
 */
export function getEffectiveNextAuthUrl(): string | undefined {
  const env = getParsedServerEnv();
  const resolved = env.NEXTAUTH_URL ?? env.APP_URL;
  if (!process.env.NEXTAUTH_URL && resolved) {
    process.env.NEXTAUTH_URL = resolved;
  }
  return resolved;
}

export function validateServerEnv(): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const env = getParsedServerEnv();
  const missing: string[] = [];
  const warnings: string[] = [];

  if (isProductionRuntime()) {
    if (!env.DATABASE_URL) missing.push('DATABASE_URL');
    if (!env.NEXTAUTH_SECRET) missing.push('NEXTAUTH_SECRET');
    if (!env.NEXTAUTH_URL && !env.APP_URL) missing.push('NEXTAUTH_URL');
    if (!env.SUPER_ADMIN_EMAIL) missing.push('SUPER_ADMIN_EMAIL');
    if (!env.SUPER_ADMIN_PASSWORD) missing.push('SUPER_ADMIN_PASSWORD');
  } else if (!isBuildPhase()) {
    if (!env.DATABASE_URL) {
      warnings.push('DATABASE_URL is not set; running in demo/mock database mode.');
    }
    if (!env.NEXTAUTH_SECRET) {
      warnings.push('NEXTAUTH_SECRET is not set; using ephemeral in-memory dev secret.');
    }
    if (!env.SUPER_ADMIN_EMAIL || !env.SUPER_ADMIN_PASSWORD) {
      warnings.push('SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set; Super Admin login is disabled.');
    }
  }

  if (!globalForEnv.__envValidated && !isBuildPhase()) {
    globalForEnv.__envValidated = true;
    for (const warning of warnings) {
      console.warn(`[env] ${warning}`);
    }
    if (missing.length > 0) {
      console.error(`[env] Missing required production environment variables: ${missing.join(', ')}`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Returns configured Super Admin credentials from environment variables,
 * or null when not configured. Never provides hardcoded default credentials.
 */
export function getSuperAdminConfig(): { email: string; password: string } | null {
  const env = getParsedServerEnv();
  if (!env.SUPER_ADMIN_EMAIL || !env.SUPER_ADMIN_PASSWORD) {
    return null;
  }
  return {
    email: env.SUPER_ADMIN_EMAIL.toLowerCase(),
    password: env.SUPER_ADMIN_PASSWORD,
  };
}

/**
 * Returns Google OAuth client credentials only when both values are configured.
 */
export function getGoogleOAuthConfig(): { clientId: string; clientSecret: string } | null {
  const env = getParsedServerEnv();
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return null;
  }
  return {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  };
}

/**
 * Returns NEXTAUTH_SECRET in production (throwing if absent during runtime),
 * and an ephemeral per-process secret in local development/build if unset.
 */
export function getNextAuthSecret(): string {
  const env = getParsedServerEnv();
  if (env.NEXTAUTH_SECRET) {
    return env.NEXTAUTH_SECRET;
  }

  if (isProductionRuntime()) {
    throw new Error('NEXTAUTH_SECRET environment variable must be configured in production.');
  }

  if (!globalForEnv.__devAuthSecret) {
    globalForEnv.__devAuthSecret = crypto.randomBytes(32).toString('hex');
  }
  return globalForEnv.__devAuthSecret;
}

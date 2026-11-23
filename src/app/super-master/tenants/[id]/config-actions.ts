'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { encrypt, isValidPostgresUrl } from '@/lib/encryption';
import { Pool } from 'pg';

export interface DatabaseConfigStatus {
  isConfigured: boolean;
  provider: string | null;
  maskedConnectionString: string | null;
  connectionStatus: 'not_configured' | 'configured' | 'test_pending' | 'success' | 'failed' | 'error';
  testStatus: 'not_tested' | 'testing' | 'success' | 'failed' | 'error';
  lastTestedAt: Date | null;
  lastTestResult: string | null;
}

export interface DatabaseConfigForm {
  provider: 'postgresql' | 'neon';
  connectionString: string;
}

export interface DomainConfig {
  subdomain: string | null;
  customDomain: string | null;
  verificationStatus: 'pending' | 'verified' | 'failed';
  sslStatus: 'not_configured' | 'pending' | 'active';
}

export interface EmailConfigStatus {
  isConfigured: boolean;
  apiKey: string | null;
  senderEmail: string | null;
  senderName: string | null;
  connectionStatus: 'not_configured' | 'configured' | 'test_failed';
}

export interface RazorpayConfigStatus {
  keyId: string | null;
  keyIdMasked: string | null;
  webhookSecret: string | null;
  razorpaySubscriptionId: string | null;
  testMode: boolean;
  isConfigured: boolean;
  connectionStatus: 'not_configured' | 'configured' | 'test_failed';
  // Additional fields from schema
  apiTokenEncrypted: string | null;
}

/**
 * Get database configuration status for a tenant
 */
export async function getDatabaseConfigAction(
  tenantId: string,
): Promise<{ config: DatabaseConfigStatus | null; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    return { config: null };
  }

  // Schema migration needed - these fields don't exist yet
  // Return placeholder indicating configuration is not available
  return {
    config: {
      isConfigured: false,
      provider: null,
      maskedConnectionString: null,
      connectionStatus: 'not_configured',
      testStatus: 'not_tested',
      lastTestedAt: null,
      lastTestResult: null,
    },
  };
}

/**
 * Get domain configuration for a tenant
 * NOTE: Requires Tenant domainConfig field to exist in schema
 */
export async function getDomainConfigAction(
  tenantId: string,
): Promise<{ config: DomainConfig | null; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    return { config: null };
  }

  // Domain config not yet available in schema
  // Placeholder implementation
  return {
    config: {
      subdomain: null,
      customDomain: null,
      verificationStatus: 'pending',
      sslStatus: 'not_configured',
    },
  };
}

/**
 * Get email (Resend) configuration status for a tenant
 * NOTE: Requires Tenant emailConfig field to exist in schema
 */
export async function getEmailConfigAction(
  tenantId: string,
): Promise<{ config: EmailConfigStatus | null; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    return { config: null };
  }

  // Email config not yet available in schema
  return {
    config: {
      isConfigured: false,
      apiKey: null,
      senderEmail: null,
      senderName: null,
      connectionStatus: 'not_configured',
    },
  };
}

/**
 * Get Razorpay configuration status for a tenant
 */
export async function getRazorpayConfigAction(
  tenantId: string,
): Promise<{ config: RazorpayConfigStatus | null; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      razorpaySubscriptionId: true,
    },
  });

  if (!tenant) {
    return { config: null };
  }

  return {
    config: {
      keyId: null, // Not in schema
      keyIdMasked: null,
      webhookSecret: null, // Not in schema
      razorpaySubscriptionId: tenant.razorpaySubscriptionId,
      testMode: true, // Default
      isConfigured: !!tenant.razorpaySubscriptionId,
      connectionStatus: tenant.razorpaySubscriptionId ? 'configured' : 'not_configured',
      apiTokenEncrypted: null, // Not in schema
    },
  };
}

/**
 * Test database connection for a tenant
 * Actually attempts a connection using the provided URL (server-side only)
 * Uses PostgreSQL connection pool for testing
 */
export async function testDatabaseConnectionAction(
  tenantId: string,
  connectionString: string,
): Promise<{ success: boolean; message: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  // Validate connection string format
  if (!isValidPostgresUrl(connectionString)) {
    return {
      success: false,
      message: 'Invalid PostgreSQL connection URL format.',
    };
  }

  // Attempt actual connection test
  const pool = new Pool({
    connectionString: connectionString,
    connectionTimeoutMillis: 5000, // 5 second timeout
    max: 1, // Only one connection for test
  });

  try {
    await pool.connect();
    return {
      success: true,
      message: 'Successfully connected to the database.',
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    // Sanitize error message - don't expose connection string details
    if (errMsg.includes('password')) {
      return {
        success: false,
        message: 'Connection failed: Authentication error.',
      };
    }
    if (errMsg.includes('ECONNREFUSED')) {
      return {
        success: false,
        message: 'Connection failed: Could not connect to the database server.',
      };
    }
    return {
      success: false,
      message: 'Connection failed: Unable to establish database connection.',
    };
  } finally {
    await pool.end().catch(() => {});
  }
}

/**
 * Save database configuration for a tenant
 * Encrypts and stores credentials securely
 */
export async function saveDatabaseConfigAction(
  tenantId: string,
  data: {
    provider: 'postgresql' | 'neon';
    connectionString: string;
  },
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  // Validate provider
  if (data.provider !== 'postgresql' && data.provider !== 'neon') {
    return { success: false, error: 'Invalid database provider.' };
  }

  // Validate connection URL format
  if (!data.connectionString || data.connectionString.trim().length < 10) {
    return { success: false, error: 'Please enter a valid database connection URL.' };
  }

  if (!isValidPostgresUrl(data.connectionString)) {
    return { success: false, error: 'Please enter a valid PostgreSQL connection URL.' };
  }

  // Check if tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    return { success: false, error: 'Tenant not found.' };
  }

  // Encrypt the connection string (server-side only, never logged)
  const encryptedCredentials = encrypt(data.connectionString.trim());

  try {
    // Use a type-safe approach - the fields don't exist in schema yet
    // We build the update object dynamically to avoid TypeScript errors
    const updateData: Record<string, unknown> = {};

    updateData.databaseProvider = data.provider;
    updateData.databaseCredentials = encryptedCredentials;

    // Execute update - will throw if fields don't exist in schema
    await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    return { success: true };
  } catch (err: unknown) {
    // Log only that an error occurred, never the credentials
    console.error('Failed to save database config:', err instanceof Error ? err.message : 'Unknown error');

    // Check if error is due to missing schema fields
    const errorMessage = err instanceof Error ? err.message : '';
    if (errorMessage.includes('Unknown column') || errorMessage.includes('does not exist') || errorMessage.includes('Prisma')) {
      return {
        success: false,
        error: 'Database configuration cannot be saved. Schema migration is required to add database credential fields. Contact system administrator.',
      };
    }

    return { success: false, error: 'Failed to save database configuration. Please try again.' };
  }
}

/**
 * Update database test results after a successful connection test
 */
export async function updateDbTestStatusAction(
  tenantId: string,
  status: 'success' | 'failed' | 'error',
  message?: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  try {
    // Use a type-safe approach - the fields don't exist in schema yet
    const updateData: Record<string, unknown> = {};

    updateData.dbLastTestedAt = new Date();
    updateData.dbTestStatus = status;
    updateData.dbTestResult = message || null;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });
    return { success: true };
  } catch (err: unknown) {
    // Log only that an error occurred, never the credentials
    console.error('Failed to update db test status:', err instanceof Error ? err.message : 'Unknown error');

    // Check if error is due to missing schema fields
    const errorMessage = err instanceof Error ? err.message : '';
    if (errorMessage.includes('Unknown column') || errorMessage.includes('does not exist') || errorMessage.includes('Prisma')) {
      return {
        success: false,
        error: 'Database test status cannot be recorded. Schema migration is required to add test tracking fields. Contact system administrator.',
      };
    }

    return { success: false, error: 'Failed to update test status. Please try again.' };
  }
}

/**
 * Test Resend connection
 */
export async function testResendConnectionAction(): Promise<{ success: boolean; message: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  // Placeholder implementation
  return {
    success: true,
    message: 'Resend configuration test completed. Configuration fields not yet available in schema.',
  };
}

/**
 * Test Razorpay connection
 */
export async function testRazorpayConnectionAction(
  tenantId: string,
  keyId: string,
  webhookSecret: string,
  testMode: boolean,
): Promise<{ success: boolean; message: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  // Validate inputs
  if (!keyId || keyId.length < 10) {
    return { success: false, message: 'Invalid Key ID format' };
  }

  if (!webhookSecret || webhookSecret.length < 10) {
    return { success: false, message: 'Invalid Webhook Secret format' };
  }

  // Placeholder - would normally make API call to Razorpay
  return {
    success: true,
    message: testMode ? 'Test mode: Razorpay credentials validated (simulated)' : 'Razorpay credentials validated (simulated)',
  };
}
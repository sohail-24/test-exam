'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { hashPassword, validatePassword } from '@/lib/password';

interface Question {
  id: string;
  content: string;
}

interface Result {
  id: string;
  score: number;
}

interface ExamWithCount {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  price: number;
  isFree: boolean;
  durationMinutes: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  questions: Question[];
  results: Result[];
  _count: {
    questions: number;
    results: number;
  };
}

interface TenantWithDetails {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  plan: string;
  createdAt: Date;
  razorpaySubscriptionId: string | null;
  users: Array<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: Date;
  }>;
  exams: ExamWithCount[];
  _count: {
    Result: number;
  };
}

/**
 * Get tenant with admin user for display on the management page
 */
export async function getTenantDetailsAction(
  tenantId: string,
): Promise<{ tenant: TenantWithDetails | null; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      plan: true,
      createdAt: true,
      razorpaySubscriptionId: true,
      users: {
        where: { role: 'TENANT_ADMIN' },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!tenant) {
    return { tenant: null };
  }

  // Fetch exams
  const exams = await prisma.exam.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          questions: true,
          results: true,
        },
      },
    },
  });

  // Get result count for tenant
  const resultCount = await prisma.result.groupBy({
    by: ['examId'],
    where: { exam: { tenantId } },
    _count: { id: true },
  });

  const totalResults = resultCount.reduce((sum, r) => sum + (r._count?.id || 0), 0);

  return { tenant: {
    ...tenant,
    exams: exams as ExamWithCount[],
    _count: { Result: totalResults },
  } };
}

/**
 * Update tenant admin account
 * Updates name, email, and optionally password for the primary TENANT_ADMIN
 */
export async function updateTenantAdminAction(
  tenantId: string,
  data: {
    name?: string | null;
    email?: string;
    password?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  // Validate email if provided
  if (data.email !== undefined) {
    const trimmedEmail = data.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (trimmedEmail.length > 254) {
      return { success: false, error: 'Email address is too long.' };
    }
    data.email = trimmedEmail;
  }

  // Check for duplicate email if email is being changed
  if (data.email !== undefined) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: { tenantId },
      },
    });
    if (existingUser) {
      return { success: false, error: 'This email address is already in use by another account.' };
    }
  }

  // Validate name if provided
  if (data.name !== undefined && data.name !== null) {
    const trimmedName = data.name.trim();
    // Allow empty name (will be stored as empty string, different from null)
    if (trimmedName.length > 100) {
      return { success: false, error: 'Name must be at most 100 characters.' };
    }
    data.name = trimmedName || null;
  } else if (data.name === null) {
    // Allow explicitly setting name to null (to clear)
    data.name = null;
  }

  // Find the primary tenant admin (first TENANT_ADMIN)
  const tenantAdmin = await prisma.user.findFirst({
    where: {
      tenantId,
      role: 'TENANT_ADMIN',
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!tenantAdmin) {
    return { success: false, error: 'No tenant administrator found.' };
  }

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    // Allow setting name to null (to clear) or a string value
    updateData.name = data.name;
  }
  if (data.email !== undefined) {
    updateData.email = data.email;
  }
  if (data.password !== undefined) {
    const validation = validatePassword(data.password);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    updateData.password = hashPassword(data.password);
  }

  try {
    await prisma.user.update({
      where: { id: tenantAdmin.id },
      data: updateData,
    });

    revalidatePath(`/super-master/tenants/${tenantId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error('Failed to update tenant admin:', err);
    return { success: false, error: 'Failed to update admin account.' };
  }
}

/**
 * Reset admin password for a tenant
 * Only the first TENANT_ADMIN is considered the primary admin
 */
export async function resetAdminPasswordAction(
  tenantId: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  // Validate password
  const validation = validatePassword(newPassword);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Find the primary tenant admin (first TENANT_ADMIN)
  const tenantAdmin = await prisma.user.findFirst({
    where: {
      tenantId,
      role: 'TENANT_ADMIN',
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!tenantAdmin) {
    return { success: false, error: 'No tenant administrator found.' };
  }

  // Hash the password and update
  const hashedPassword = hashPassword(newPassword);

  await prisma.user.update({
    where: { id: tenantAdmin.id },
    data: { password: hashedPassword },
  });

  revalidatePath(`/super-master/tenants/${tenantId}`);
  return { success: true };
}

/**
 * Update tenant general information
 */
export async function updateTenantGeneralAction(
  tenantId: string,
  data: {
    name?: string;
    slug?: string;
    plan?: string;
    isActive?: boolean;
  },
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  // Validate plan if provided
  const validPlans = ['starter', 'pro', 'enterprise'];
  if (data.plan !== undefined && !validPlans.includes(data.plan)) {
    return { success: false, error: 'Invalid plan selection.' };
  }

  // Validate name if provided
  if (data.name !== undefined) {
    const trimmedName = data.name.trim();
    if (trimmedName.length < 2) {
      return { success: false, error: 'Company name must be at least 2 characters.' };
    }
    if (trimmedName.length > 100) {
      return { success: false, error: 'Company name must be at most 100 characters.' };
    }
    data.name = trimmedName;
  }

  // Validate slug if provided
  if (data.slug !== undefined) {
    const trimmedSlug = data.slug.trim();
    if (trimmedSlug.length < 2) {
      return { success: false, error: 'Slug must be at least 2 characters.' };
    }
    if (trimmedSlug.length > 50) {
      return { success: false, error: 'Slug must be at most 50 characters.' };
    }
    // Check for valid URL slug format
    if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
      return { success: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens.' };
    }
    data.slug = trimmedSlug;
  }

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data,
    });

    revalidatePath(`/super-master/tenants/${tenantId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error('Failed to update tenant:', err);
    return { success: false, error: 'Failed to update tenant details.' };
  }
}
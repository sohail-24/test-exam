'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSuperAdminConfig } from '@/lib/env';
import { revalidatePath } from 'next/cache';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function createTenantBySuperAdminAction(
  name: string,
  adminEmail: string,
  plan: string,
  adminPassword: string,
): Promise<{ success: boolean; error?: string; tenantId?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  const baseSlug = slugify(name);
  const cleanEmail = adminEmail.trim().toLowerCase();
  const password = typeof adminPassword === 'string' ? adminPassword.trim() : '';
  if (password.length < 6) {
    return {
      success: false,
      error: 'Initial admin password is required (minimum 6 characters).',
    };
  }

  const superAdminConfig = getSuperAdminConfig();
  if (superAdminConfig && cleanEmail === superAdminConfig.email) {
    return {
      success: false,
      error: 'Institute admin email must be separate from the Super Master account.',
    };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return {
        success: false,
        error: 'An account with this admin email already exists.',
      };
    }

    const existingSlug = await prisma.tenant.findUnique({ where: { slug: baseSlug } });
    const slug = existingSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const tenant = await prisma.tenant.create({
      data: {
        name: name.trim(),
        slug,
        plan,
        isActive: true,
      },
    });

    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: cleanEmail,
        password,
        role: 'TENANT_ADMIN',
        name: `${name.trim()} Admin`,
      },
    });

    revalidatePath('/super-master');
    return { success: true, tenantId: tenant.id };
  } catch (err: unknown) {
    console.error('Failed to create tenant:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Creation failed' };
  }
}

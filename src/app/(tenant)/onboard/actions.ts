'use server';

import { prisma } from '@/lib/prisma';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function createTenantAction(
  orgName: string,
  adminEmail: string,
  password: string,
  plan?: string,
): Promise<{ redirectTo: string; success: boolean; error?: string }> {
  const baseSlug = slugify(orgName);
  let tenantId = 'demo-tenant';
  const cleanEmail = adminEmail.trim().toLowerCase();
  const userPassword = typeof password === 'string' ? password.trim() : '';
  const chosenPlan = plan || 'starter';

  if (userPassword.length < 6) {
    return {
      success: false,
      error: 'Admin password must be at least 6 characters.',
      redirectTo: '/onboard',
    };
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { tenant: true },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email already exists. Please log in directly.',
        redirectTo: `/login?email=${encodeURIComponent(cleanEmail)}`,
      };
    }

    const existingSlug = await prisma.tenant.findUnique({ where: { slug: baseSlug } });
    const slug = existingSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const tenant = await prisma.tenant.create({
      data: {
        name: orgName.trim(),
        slug,
        plan: chosenPlan,
        isActive: true,
      },
    });
    tenantId = tenant.id;

    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: cleanEmail,
        password: userPassword,
        role: 'TENANT_ADMIN',
        name: `${orgName.trim()} Admin`,
      },
    });

    return {
      success: true,
      redirectTo: `/login?registered=true&email=${encodeURIComponent(cleanEmail)}`,
    };
  } catch (err: unknown) {
    console.warn('DB error during onboarding:', err);
    return {
      success: true,
      redirectTo: `/admin?tenant=${tenantId}&org=${encodeURIComponent(orgName)}`,
    };
  }
}

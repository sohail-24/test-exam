'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function toggleTenantStatusAction(tenantId: string, currentStatus: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { isActive: !currentStatus },
  });

  revalidatePath(`/super-master/tenants/${tenantId}`);
  revalidatePath('/super-master');
}

export async function updateTenantPlanAction(tenantId: string, plan: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { plan },
  });

  revalidatePath(`/super-master/tenants/${tenantId}`);
  revalidatePath('/super-master');
}

export async function deleteTenantAction(tenantId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  await prisma.tenant.delete({
    where: { id: tenantId },
  });

  revalidatePath('/super-master');
}

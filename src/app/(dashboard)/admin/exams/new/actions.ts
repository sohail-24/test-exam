'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

interface QuestionInput {
  text: string;
  options: string[];
  correctOptionIndex: number;
  order: number;
}

interface ExamInput {
  title: string;
  description?: string;
  durationMinutes: number;
  isFree: boolean;
  price: number;
  questions: QuestionInput[];
}

export async function saveExamAction(
  input: ExamInput,
  explicitTenantId?: string,
): Promise<{ success: boolean; examId?: string; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    // 1. Resolve tenantId safely
    let targetTenantId = explicitTenantId || session?.user?.tenantId;

    if (targetTenantId) {
      const exists = await prisma.tenant.findUnique({ where: { id: targetTenantId } });
      if (!exists) targetTenantId = undefined;
    }

    if (!targetTenantId) {
      // Find the latest active tenant in the database
      const latestTenant = await prisma.tenant.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      if (latestTenant) {
        targetTenantId = latestTenant.id;
      } else {
        // Fallback create default tenant so FK constraint NEVER fails
        const defaultTenant = await prisma.tenant.create({
          data: {
            name: 'Default Exam Portal',
            slug: `portal-${Date.now()}`,
            plan: 'starter',
            isActive: true,
          },
        });
        targetTenantId = defaultTenant.id;
      }
    }

    // 2. Insert Exam + Questions in database
    const exam = await prisma.exam.create({
      data: {
        tenantId: targetTenantId,
        title: input.title.trim(),
        description: input.description?.trim(),
        durationMinutes: input.durationMinutes,
        isFree: input.isFree,
        price: input.isFree ? 0 : input.price,
        isPublished: true,
        questions: {
          create: input.questions.map((q, idx) => ({
            tenantId: targetTenantId!,
            text: q.text.trim(),
            options: q.options.map((o) => o.trim()),
            correctOptionIndex: q.correctOptionIndex,
            order: q.order ?? idx,
          })),
        },
      },
      include: { questions: true },
    });

    revalidatePath('/admin');
    revalidatePath(`/admin?tenant=${targetTenantId}`);
    return { success: true, examId: exam.id };
  } catch (err: unknown) {
    console.error('Failed to save exam in DB:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save exam to database',
    };
  }
}

export async function publishExamAction(examId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'TENANT_ADMIN' || !session.user.tenantId) {
    throw new Error('Unauthorized');
  }

  await prisma.exam.update({
    where: { id: examId, tenantId: session.user.tenantId },
    data: { isPublished: true },
  });

  revalidatePath('/admin');
}

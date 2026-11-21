'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

export async function saveKycAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? 'demo-student';
  const tenantId = session?.user?.tenantId ?? 'demo-tenant';

  const name = formData.get('name') as string;
  const gender = formData.get('gender') as 'MALE' | 'FEMALE' | 'OTHER';
  const mobile = formData.get('mobile') as string;
  const aadhaarFile = formData.get('aadhaar') as File;
  const selfieDataUrl = formData.get('selfie') as string | null;

  // ── Save Aadhaar ────────────────────────────────────────
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', userId);
  await mkdir(uploadDir, { recursive: true });

  const aadhaarBuffer = Buffer.from(await aadhaarFile.arrayBuffer());
  const aadhaarFilename = `aadhaar_${Date.now()}_${aadhaarFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  await writeFile(path.join(uploadDir, aadhaarFilename), aadhaarBuffer);
  const aadhaarPath = `/uploads/${userId}/${aadhaarFilename}`;

  // ── Save Selfie (base64 → file) ─────────────────────────
  let selfiePath: string | null = null;
  if (selfieDataUrl) {
    const base64Data = selfieDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const selfieFilename = `selfie_${Date.now()}.jpg`;
    await writeFile(path.join(uploadDir, selfieFilename), Buffer.from(base64Data, 'base64'));
    selfiePath = `/uploads/${userId}/${selfieFilename}`;
  }

  // ── Upsert Profile (graceful fallback if DB offline) ───
  try {
    await prisma.profile.upsert({
      where: { userId },
      create: { userId, tenantId, name, gender, mobile, aadhaarPath, selfiePath },
      update: { name, gender, mobile, aadhaarPath, selfiePath },
    });
  } catch (err) {
    console.warn('Profile upsert skipped (demo/no DB):', err);
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { kycComplete: true },
    });
  } catch (err) {
    console.warn('User kycComplete update skipped (demo/no DB):', err);
  }

  revalidatePath('/student');
  return { success: true, aadhaarPath, selfiePath };
}


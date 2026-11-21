import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import StudentsTableClient from './StudentsTableClient';

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: { tenant?: string };
}) {
  const session = await getServerSession(authOptions);
  const tenantId = searchParams.tenant || session?.user?.tenantId || 'demo-tenant';

  let students: Array<{
    id: string;
    email: string;
    name: string | null;
    kycComplete: boolean;
    createdAt: Date;
    profile: { mobile: string; name: string } | null;
    _count: { results: number };
  }> = [];

  try {
    students = await prisma.user.findMany({
      where: { tenantId, role: 'STUDENT' },
      orderBy: { createdAt: 'desc' },
      include: {
        profile: { select: { mobile: true, name: true } },
        _count: { select: { results: true } },
      },
    });
  } catch (err) {
    console.warn('Prisma lookup skipped in demo mode:', err);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          href={`/admin?tenant=${tenantId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Student Cohorts</h1>
              <p className="text-xs text-slate-500">View and filter students enrolled in this portal</p>
            </div>
          </div>

          <StudentsTableClient
            initialStudents={students.map((s) => ({
              id: s.id,
              name: s.profile?.name || s.name || 'Student',
              mobile: s.profile?.mobile || '—',
              email: s.email,
              kycComplete: s.kycComplete,
              resultsCount: s._count.results,
              createdAt: s.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  );
}

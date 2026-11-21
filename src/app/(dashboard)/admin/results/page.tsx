import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Award } from 'lucide-react';
import ResultsTableClient from './ResultsTableClient';

export default async function AdminResultsPage({
  searchParams,
}: {
  searchParams: { tenant?: string };
}) {
  const session = await getServerSession(authOptions);
  const tenantId = searchParams.tenant || session?.user?.tenantId || 'demo-tenant';

  let results: Array<{
    id: string;
    score: number;
    totalMarks: number;
    timeTaken: number;
    submittedAt: Date;
    exam: { title: string; id: string };
    user: {
      email: string;
      profile: { name: string; mobile: string } | null;
    };
  }> = [];

  let exams: Array<{ id: string; title: string }> = [];

  try {
    const [resList, examList] = await Promise.all([
      prisma.result.findMany({
        where: { tenantId },
        orderBy: { submittedAt: 'desc' },
        include: {
          exam: { select: { id: true, title: true } },
          user: {
            select: {
              email: true,
              profile: { select: { name: true, mobile: true } },
            },
          },
        },
      }),
      prisma.exam.findMany({
        where: { tenantId },
        select: { id: true, title: true },
      }),
    ]);
    results = resList;
    exams = examList;
  } catch (err) {
    console.warn('Prisma results lookup skipped in demo mode:', err);
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
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Exam Results & Submissions</h1>
              <p className="text-xs text-slate-500">Track and review student performance per exam</p>
            </div>
          </div>

          <ResultsTableClient
            exams={exams}
            initialResults={results.map((r) => ({
              id: r.id,
              studentName: r.user.profile?.name || r.user.email,
              mobile: r.user.profile?.mobile || '—',
              examId: r.exam.id,
              examTitle: r.exam.title,
              score: r.score,
              totalMarks: r.totalMarks,
              percentage: r.totalMarks > 0 ? Math.round((r.score / r.totalMarks) * 100) : 0,
              timeTaken: r.timeTaken,
              submittedAt: r.submittedAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  );
}

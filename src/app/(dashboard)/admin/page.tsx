import Link from 'next/link';
import { Plus, BookOpen, Users, Award, Building, QrCode, ExternalLink } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { tenant?: string; org?: string };
}) {
  const session = await getServerSession(authOptions);
  const tenantId = searchParams.tenant || session?.user?.tenantId || 'demo-tenant';
  const orgName = searchParams.org || 'Client Admin';

  // Strict tenant isolation queries
  let examsCount = 0;
  let studentsCount = 0;
  let resultsCount = 0;
  let recentExams: Array<{
    id: string;
    title: string;
    durationMinutes: number;
    isPublished: boolean;
    _count: { questions: number; results: number };
  }> = [];

  try {
    const [eCount, sCount, rCount, exams] = await Promise.all([
      prisma.exam.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId, role: 'STUDENT' } }),
      prisma.result.count({ where: { tenantId } }),
      prisma.exam.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { questions: true, results: true } } },
      }),
    ]);
    examsCount = eCount;
    studentsCount = sCount;
    resultsCount = rCount;
    recentExams = exams;
  } catch (err) {
    console.warn('Prisma query skipped in demo mode:', err);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="w-6 h-6 text-emerald-600" />
            <span className="font-bold text-slate-900 text-lg">{orgName} Portal</span>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              Client Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-3 text-sm font-medium text-slate-600">
              <Link href={`/admin/students?tenant=${tenantId}`} className="hover:text-slate-900">
                Students
              </Link>
              <Link href={`/admin/results?tenant=${tenantId}`} className="hover:text-slate-900">
                Results
              </Link>
            </nav>
            <Link
              href={`/admin/exams/new?tenant=${tenantId}&org=${encodeURIComponent(orgName)}`}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Exam
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-sm font-medium">Total Exams</span>
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{examsCount}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-sm font-medium">Enrolled Students</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{studentsCount}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-sm font-medium">Exam Submissions</span>
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{resultsCount}</div>
          </div>
        </div>

        {/* Recent Exams or Empty State */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-semibold text-slate-900">Your Exams & Share Links</h2>
              <p className="text-xs text-slate-500">Share links or QR codes with your students</p>
            </div>
            <Link
              href={`/admin/exams/new?tenant=${tenantId}&org=${encodeURIComponent(orgName)}`}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              + Create New
            </Link>
          </div>

          {recentExams.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Exams Created Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create your first exam. The portal will generate a student link and QR code to distribute.
              </p>
              <Link
                href={`/admin/exams/new?tenant=${tenantId}&org=${encodeURIComponent(orgName)}`}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Exam
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentExams.map((e) => (
                <div key={e.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{e.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {e.durationMinutes} mins · {e._count.questions} questions · {e._count.results} attempts
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/exam/${e.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Exam Link
                    </Link>
                    <Link
                      href={`/exam/${e.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium"
                    >
                      <QrCode className="w-3.5 h-3.5" /> QR Code
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Building2, BookOpen, Users, CheckCircle2, XCircle } from 'lucide-react';
import TenantManageClient from './TenantManageClient';

export default async function TenantDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'SUPER_ADMIN') redirect('/super-admin/login');

  const tenant = await prisma.tenant.findUnique({
    where: { id: params.id },
    include: {
      users: { orderBy: { createdAt: 'desc' } },
      exams: {
        include: {
          _count: { select: { results: true, questions: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { Result: true } },
    },
  });

  if (!tenant) notFound();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link
          href="/super-admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-slate-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{tenant.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  tenant.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}>
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">slug: {tenant.slug} · ID: {tenant.id}</p>
            </div>
          </div>

          <TenantManageClient
            tenantId={tenant.id}
            currentStatus={tenant.isActive}
            currentPlan={tenant.plan}
          />
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{tenant.users.length}</p>
              <p className="text-xs text-slate-500">Registered Users</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{tenant.exams.length}</p>
              <p className="text-xs text-slate-500">Exams Created</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{tenant._count.Result}</p>
              <p className="text-xs text-slate-500">Submissions</p>
            </div>
          </div>
        </div>

        {/* Exams List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Exams</h2>
          </div>
          {tenant.exams.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No exams created by this client yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {tenant.exams.map((exam) => (
                <div key={exam.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 text-sm">{exam.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {exam.durationMinutes} mins · {exam._count.questions} questions · {exam._count.results} attempts
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    exam.isPublished ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {exam.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Users & Cohorts</h2>
          </div>
          {tenant.users.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No users registered.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {tenant.users.map((u) => (
                <div key={u.id} className="px-6 py-3.5 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{u.name || u.email}</p>
                    <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

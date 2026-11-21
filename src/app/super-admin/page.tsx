import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Users, Building2, BookOpen, LogOut, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function SuperAdminDashboard() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'SUPER_ADMIN') redirect('/super-admin/login');

  const [tenants, totalExams, totalResults] = await Promise.all([
    prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.exam.count(),
    prisma.result.count(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold tracking-wide">LopyTech — Super Admin</span>
        </div>
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </Link>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Tenants', value: tenants.length, icon: Building2 },
            { label: 'Total Exams', value: totalExams, icon: BookOpen },
            { label: 'Total Results', value: totalResults, icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-semibold text-slate-900">Tenant Management</h2>
              <p className="text-xs text-slate-500">Create, configure, and monitor client portals</p>
            </div>
            <Link
              href="/super-admin/tenants/new"
              className="flex items-center gap-1.5 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Tenant
            </Link>
          </div>

          {tenants.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No tenants yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left bg-slate-50">
                    <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Org Name</th>
                    <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Slug</th>
                    <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Plan</th>
                    <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Created</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-3.5 font-medium text-slate-900">{t.name}</td>
                      <td className="px-6 py-3.5 text-slate-500 font-mono text-xs">{t.slug}</td>
                      <td className="px-6 py-3.5">
                        <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {t.plan}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          t.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-600 border-rose-200'
                        }`}>
                          {t.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 text-xs">
                        {new Date(t.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link
                          href={`/super-admin/tenants/${t.id}`}
                          className="text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded px-2.5 py-1 hover:bg-slate-100"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

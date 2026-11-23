'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Building2, BookOpen, Users, CheckCircle2, Shield, User, Mail, Calendar } from 'lucide-react';
import { getTenantDetailsAction } from './admin-actions';
import PasswordResetModal from './PasswordResetModal';
import TenantManageClient from './TenantManageClient';
import { formatDate } from './utils';

interface Question {
  id: string;
  content: string;
}

interface Result {
  id: string;
  score: number;
}

interface ExamWithCount {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  price: number;
  isFree: boolean;
  durationMinutes: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  questions: Question[];
  results: Result[];
  _count: {
    questions: number;
    results: number;
  };
}

interface TenantWithDetails {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  plan: string;
  createdAt: Date;
  razorpaySubscriptionId: string | null;
  users: Array<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: Date;
  }>;
  exams: ExamWithCount[];
  _count: {
    Result: number;
  };
}

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    async function loadTenant() {
      try {
        const result = await getTenantDetailsAction(params.id);
        setTenant(result.tenant ?? null);
      } catch (err) {
        console.error('Failed to load tenant:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTenant();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <p className="text-slate-600">Tenant not found</p>
      </div>
    );
  }

  // Get primary tenant admin (first TENANT_ADMIN, sorted by creation)
  const tenantAdmin = tenant.users.find((u) => u.role === 'TENANT_ADMIN');

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Password Reset Modal */}
        <PasswordResetModal
          tenantId={tenant.id}
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
        />

        {/* Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-slate-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{tenant.name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    tenant.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}
                >
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Tenant ID: {tenant.id}
              </p>
            </div>
          </div>

          <TenantManageClient
            onAdminPasswordReset={() => setShowPasswordModal(true)}
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
              <p className="text-xl font-bold text-slate-900">{tenant._count?.Result || 0}</p>
              <p className="text-xs text-slate-500">Submissions</p>
            </div>
          </div>
        </div>

        {/* General Information Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">General Information</h2>
            <p className="text-xs text-slate-500">Tenant details and configuration</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Company Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Company</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500">Company Name</span>
                    <p className="text-sm font-medium text-slate-900 mt-0.5">{tenant.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Tenant ID</span>
                    <p className="text-sm font-mono text-slate-700 mt-0.5">{tenant.id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Slug</span>
                    <p className="text-sm font-mono text-slate-700 mt-0.5">{tenant.slug}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Status</span>
                    <p className="text-sm font-medium mt-0.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                          tenant.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-600 border-rose-200'
                        }`}
                      >
                        {tenant.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Account</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500">Subscription Plan</span>
                    <p className="text-sm font-medium text-slate-900 mt-0.5 capitalize">{tenant.plan}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Created Date</span>
                    <p className="text-sm font-mono text-slate-700 mt-0.5">{formatDate(tenant.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Subscription ID</span>
                    <p className="text-sm font-mono text-slate-700 mt-0.5">
                      {tenant.razorpaySubscriptionId || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Account Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Admin Account</h2>
            <p className="text-xs text-slate-500">Primary tenant administrator</p>
          </div>

          <div className="p-6 space-y-4">
            {tenantAdmin ? (
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Admin Name</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{tenantAdmin.name || '-'}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Admin Email</span>
                    </div>
                    <p className="text-sm font-mono text-slate-700">{tenantAdmin.email}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Account Created</span>
                    </div>
                    <p className="text-sm font-mono text-slate-700">{formatDate(tenantAdmin.createdAt)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No tenant administrator assigned.</p>
            )}
          </div>
        </div>

        {/* Exams List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Exams</h2>
          </div>
          {tenant.exams.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              No exams created by this client yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {tenant.exams.map((exam) => (
                <div key={exam.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 text-sm">{exam.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {exam.durationMinutes} mins · {exam._count.questions} questions ·{' '}
                      {exam._count.results} attempts
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      exam.isPublished
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
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
            <h2 className="font-semibold text-slate-900">Users</h2>
          </div>
          {tenant.users.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No users registered.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {tenant.users.map((u) => (
                <div key={u.id} className="px-6 py-3.5 flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{u.name || u.email}</p>
                    <p className="text-xs text-slate-400 font-mono truncate">{u.email}</p>
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